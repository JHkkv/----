import { Router, Request, Response } from 'express';
import multer from 'multer';
import { getDb } from '../db/connection';
import { parseResumeFile, extractFields } from '../parser';
import type { Resume, ResumeInput } from '../../../shared/types';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

export const resumeRouter = Router();

// GET /api/resume — get current resume
resumeRouter.get('/', (_req: Request, res: Response) => {
  const db = getDb();
  const row = db.prepare('SELECT * FROM resumes ORDER BY updated_at DESC LIMIT 1').get() as any;
  if (!row) {
    res.json({ success: true, data: null });
    return;
  }
  const resume: Resume = {
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    workYears: row.work_years,
    currentRole: row.current_role,
    skills: JSON.parse(row.skills),
    projects: JSON.parse(row.projects),
    education: row.education,
    school: row.school,
    rawText: row.raw_text,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
  res.json({ success: true, data: resume });
});

// POST /api/resume — save resume (manual)
resumeRouter.post('/', (req: Request, res: Response) => {
  const db = getDb();
  const input: ResumeInput = req.body;

  // Upsert: delete old, insert new (single-user mode)
  db.prepare('DELETE FROM resumes').run();
  const result = db.prepare(`
    INSERT INTO resumes (name, phone, email, work_years, current_role, skills, projects, education, school, raw_text)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    input.name, input.phone, input.email, input.workYears, input.currentRole,
    JSON.stringify(input.skills), JSON.stringify(input.projects),
    input.education, input.school, ''
  );

  res.json({ success: true, data: { id: result.lastInsertRowid } });
});

// POST /api/resume/upload — upload & parse resume file
resumeRouter.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, error: 'No file uploaded' });
      return;
    }

    const text = await parseResumeFile(req.file.buffer, req.file.originalname);
    const fields = extractFields(text);

    res.json({
      success: true,
      data: {
        rawText: text,
        extracted: fields,
      },
    });
  } catch (err) {
    res.status(422).json({
      success: false,
      error: err instanceof Error ? err.message : 'Parse failed',
    });
  }
});
