import { Router, Request, Response } from 'express';
import { getDb } from '../db/connection';
import type { Application, DeliveryStats, PlatformId } from '../../../shared/types';

export const applicationsRouter = Router();

// GET /api/applications — list with pagination
applicationsRouter.get('/', (req: Request, res: Response) => {
  const db = getDb();
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
  const offset = (page - 1) * limit;

  const rows = db.prepare('SELECT * FROM applications ORDER BY sent_at DESC LIMIT ? OFFSET ?').all(limit, offset) as any[];
  const total = (db.prepare('SELECT COUNT(*) as c FROM applications').get() as { c: number }).c;

  const data: Application[] = rows.map(r => ({
    id: r.id,
    platform: r.platform as PlatformId,
    company: r.company,
    position: r.position,
    salary: r.salary,
    greeting: r.greeting,
    status: r.status,
    sentAt: r.sent_at,
    updatedAt: r.updated_at,
  }));

  res.json({ success: true, data, total, page, limit });
});

// POST /api/applications — record a new application
applicationsRouter.post('/', (req: Request, res: Response) => {
  const db = getDb();
  const { platform, company, position, salary, greeting, status } = req.body;
  const result = db.prepare(`
    INSERT INTO applications (platform, company, position, salary, greeting, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(platform || 'unknown', company || 'unknown', position || 'unknown', salary || '', greeting || '', status || 'sent');
  res.json({ success: true, data: { id: result.lastInsertRowid } });
});

// GET /api/applications/stats — delivery statistics
applicationsRouter.get('/stats', (_req: Request, res: Response) => {
  const db = getDb();

  const totalRow = db.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status = 'read' OR status = 'replied' THEN 1 ELSE 0 END) as total_read,
      SUM(CASE WHEN status = 'replied' THEN 1 ELSE 0 END) as total_replied
    FROM applications
  `).get() as any;

  const todayRow = db.prepare(`
    SELECT COUNT(*) as today FROM applications WHERE date(sent_at) = date('now')
  `).get() as any;

  const platformRows = db.prepare(`
    SELECT platform,
      COUNT(*) as sent,
      SUM(CASE WHEN status = 'replied' THEN 1 ELSE 0 END) as replied
    FROM applications GROUP BY platform
  `).all() as any[];

  const byPlatform = {} as Record<string, { sent: number; replied: number }>;
  for (const r of platformRows) {
    byPlatform[r.platform] = { sent: r.sent, replied: r.replied || 0 };
  }

  const stats: DeliveryStats = {
    totalSent: totalRow.total || 0,
    totalRead: totalRow.total_read || 0,
    totalReplied: totalRow.total_replied || 0,
    todaySent: todayRow.today || 0,
    byPlatform: byPlatform as DeliveryStats['byPlatform'],
  };

  res.json({ success: true, data: stats });
});

// PATCH /api/applications/:id — update application status
applicationsRouter.patch('/:id', (req: Request, res: Response) => {
  const db = getDb();
  const { status } = req.body;
  db.prepare("UPDATE applications SET status = ?, updated_at = datetime('now') WHERE id = ?").run(status, req.params.id);
  res.json({ success: true });
});
