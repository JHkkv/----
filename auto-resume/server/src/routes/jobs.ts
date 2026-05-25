import { Router, Request, Response } from 'express';
import { getDb } from '../db/connection';
import type { JobTarget } from '../../../shared/types';

export const jobsRouter = Router();

// GET /api/jobs — list all job targets
jobsRouter.get('/', (_req: Request, res: Response) => {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM job_targets ORDER BY created_at DESC').all() as any[];
  const data: JobTarget[] = rows.map(r => ({
    id: r.id,
    keywords: JSON.parse(r.keywords),
    cities: JSON.parse(r.cities),
    minSalary: r.min_salary,
    maxSalary: r.max_salary,
    platforms: JSON.parse(r.platforms),
    active: !!r.active,
    createdAt: r.created_at,
  }));
  res.json({ success: true, data });
});

// POST /api/jobs — create or update job targets (replace all)
jobsRouter.post('/', (req: Request, res: Response) => {
  const db = getDb();
  const targets: JobTarget[] = req.body.targets;
  if (!Array.isArray(targets)) {
    res.status(400).json({ success: false, error: 'targets must be an array' });
    return;
  }

  const insert = db.prepare(`
    INSERT INTO job_targets (keywords, cities, min_salary, max_salary, platforms, active)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const tx = db.transaction(() => {
    db.prepare('DELETE FROM job_targets').run();
    for (const t of targets) {
      insert.run(
        JSON.stringify(t.keywords),
        JSON.stringify(t.cities),
        t.minSalary,
        t.maxSalary,
        JSON.stringify(t.platforms),
        t.active ? 1 : 0
      );
    }
  });
  tx();

  res.json({ success: true, data: { count: targets.length } });
});

// DELETE /api/jobs/:id — delete a target
jobsRouter.delete('/:id', (req: Request, res: Response) => {
  const db = getDb();
  db.prepare('DELETE FROM job_targets WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});
