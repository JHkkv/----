import type { IncomingMessage } from 'http';
import { WebSocket } from 'ws';
import type { WsMessage, WsResponse } from '../../../shared/types';
import { getDb } from '../db/connection';
import { Scheduler } from '../scheduler';
import { CONFIG } from '../config';

const platformSchedulers = new Map<string, Scheduler>();

function getScheduler(platform: string): Scheduler {
  if (!platformSchedulers.has(platform)) {
    const cfg = CONFIG.PLATFORMS.find(p => p.id === platform);
    platformSchedulers.set(platform, new Scheduler({
      dailyLimit: cfg?.dailyLimit ?? 50,
      minDelayMs: cfg?.minDelayMs ?? 30000,
      maxDelayMs: cfg?.maxDelayMs ?? 90000,
      workdayOnly: true,
      workHoursStart: 9,
      workHoursEnd: 18,
    }));
  }
  return platformSchedulers.get(platform)!;
}

function respond(ws: WebSocket, msg: WsResponse): void {
  ws.send(JSON.stringify(msg));
}

export function handleWsConnection(ws: WebSocket, _req: IncomingMessage): void {
  console.log('[ws] client connected');

  ws.on('message', (raw) => {
    let msg: WsMessage;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      respond(ws, { type: 'error', success: false, error: 'Invalid JSON' });
      return;
    }

    switch (msg.type) {
      case 'resume:get': {
        const db = getDb();
        const row = db.prepare('SELECT * FROM resumes ORDER BY updated_at DESC LIMIT 1').get() as any;
        if (!row) {
          respond(ws, { type: 'resume:get', success: true, data: null, requestId: msg.requestId });
          return;
        }
        respond(ws, {
          type: 'resume:get', success: true, requestId: msg.requestId,
          data: {
            id: row.id, name: row.name, phone: row.phone, email: row.email,
            workYears: row.work_years, currentRole: row.current_role,
            skills: JSON.parse(row.skills), projects: JSON.parse(row.projects),
            education: row.education, school: row.school,
            rawText: row.raw_text, createdAt: row.created_at, updatedAt: row.updated_at,
          },
        });
        break;
      }

      case 'resume:save': {
        const db = getDb();
        const input = msg.payload as any;
        db.prepare('DELETE FROM resumes').run();
        db.prepare(`
          INSERT INTO resumes (name, phone, email, work_years, current_role, skills, projects, education, school, raw_text)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          input.name, input.phone, input.email, input.workYears, input.currentRole,
          JSON.stringify(input.skills || []), JSON.stringify(input.projects || []),
          input.education, input.school, ''
        );
        respond(ws, { type: 'resume:save', success: true, requestId: msg.requestId });
        break;
      }

      case 'jobtargets:list': {
        const db = getDb();
        const rows = db.prepare('SELECT * FROM job_targets ORDER BY created_at DESC').all() as any[];
        const data = rows.map(r => ({
          id: r.id, keywords: JSON.parse(r.keywords), cities: JSON.parse(r.cities),
          minSalary: r.min_salary, maxSalary: r.max_salary,
          platforms: JSON.parse(r.platforms), active: !!r.active, createdAt: r.created_at,
        }));
        respond(ws, { type: 'jobtargets:list', success: true, data, requestId: msg.requestId });
        break;
      }

      case 'jobtargets:save': {
        const db = getDb();
        const targets = (msg.payload as any)?.targets || [];
        const insert = db.prepare(`
          INSERT INTO job_targets (keywords, cities, min_salary, max_salary, platforms, active)
          VALUES (?, ?, ?, ?, ?, ?)
        `);
        const tx = db.transaction(() => {
          db.prepare('DELETE FROM job_targets').run();
          for (const t of targets) {
            insert.run(
              JSON.stringify(t.keywords || []), JSON.stringify(t.cities || []),
              t.minSalary || 0, t.maxSalary || 0,
              JSON.stringify(t.platforms || []), t.active ? 1 : 0
            );
          }
        });
        tx();
        respond(ws, { type: 'jobtargets:save', success: true, requestId: msg.requestId, data: { count: targets.length } });
        break;
      }

      case 'apps:list': {
        const db = getDb();
        const payload = msg.payload as any || {};
        const page = payload.page || 1;
        const limit = Math.min(payload.limit || 50, 200);
        const offset = (page - 1) * limit;
        const rows = db.prepare('SELECT * FROM applications ORDER BY sent_at DESC LIMIT ? OFFSET ?').all(limit, offset) as any[];
        const total = (db.prepare('SELECT COUNT(*) as c FROM applications').get() as { c: number }).c;
        const data = rows.map(r => ({
          id: r.id, platform: r.platform, company: r.company, position: r.position,
          salary: r.salary, greeting: r.greeting, status: r.status,
          sentAt: r.sent_at, updatedAt: r.updated_at,
        }));
        respond(ws, { type: 'apps:list', success: true, data: { items: data, total }, requestId: msg.requestId });
        break;
      }

      case 'apps:stats': {
        const db = getDb();
        const totalRow = db.prepare(`
          SELECT COUNT(*) as t, SUM(CASE WHEN status='replied' THEN 1 ELSE 0 END) as replied FROM applications
        `).get() as any;
        const todayRow = db.prepare("SELECT COUNT(*) as c FROM applications WHERE date(sent_at)=date('now')").get() as any;
        respond(ws, {
          type: 'apps:stats', success: true, requestId: msg.requestId,
          data: { totalSent: totalRow.t, totalReplied: totalRow.replied || 0, todaySent: todayRow.c || 0 },
        });
        break;
      }

      case 'task:start': {
        const { platform, greeting } = msg.payload as any;
        const scheduler = getScheduler(platform);

        scheduler.enqueue(async () => {
          const db = getDb();
          db.prepare(`
            INSERT INTO applications (platform, company, position, salary, greeting, status)
            VALUES (?, ?, ?, ?, ?, 'sent')
          `).run(platform, 'auto-sending...', 'auto-sending...', '', greeting);

          ws.send(JSON.stringify({
            type: 'task:progress', success: true,
            data: { platform, sent: scheduler.todaySent, action: 'send_greeting', greeting },
          }));
        });

        respond(ws, { type: 'task:start', success: true, requestId: msg.requestId, data: { platform } });
        break;
      }

      case 'task:stop': {
        const { platform } = msg.payload as any;
        const scheduler = platformSchedulers.get(platform);
        if (scheduler) {
          scheduler.stop();
          platformSchedulers.delete(platform);
        }
        respond(ws, { type: 'task:stop', success: true, requestId: msg.requestId });
        break;
      }

      default:
        respond(ws, { type: msg.type, success: true, data: null, requestId: msg.requestId });
    }
  });

  ws.on('close', () => {
    console.log('[ws] client disconnected');
  });
}
