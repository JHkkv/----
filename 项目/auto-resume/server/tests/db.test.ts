import { describe, it, expect } from 'vitest';
import { getDb, closeDb } from '../src/db/connection';

describe('Database', () => {
  it('creates all tables', () => {
    const db = getDb(':memory:');
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all() as { name: string }[];
    const names = tables.map(t => t.name);
    expect(names).toContain('resumes');
    expect(names).toContain('platforms');
    expect(names).toContain('job_targets');
    expect(names).toContain('applications');
    expect(names).toContain('blacklist');
    closeDb();
  });

  it('inserts and retrieves a resume', () => {
    const db = getDb(':memory:');
    const result = db.prepare(`
      INSERT INTO resumes (name, phone, email, work_years, current_role, skills, projects, education, school, raw_text)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run('张三', '13800138000', 'zhang@test.com', 3, '前端开发',
      '["React","TypeScript"]', '["电商后台"]', '本科', '清华大学', ''
    );
    expect(result.lastInsertRowid).toBeGreaterThan(0);

    const row = db.prepare('SELECT * FROM resumes WHERE id = ?').get(result.lastInsertRowid as number) as any;
    expect(row.name).toBe('张三');
    expect(JSON.parse(row.skills)).toEqual(['React', 'TypeScript']);
    closeDb();
  });

  it('seeds platform defaults on first init', () => {
    const db = getDb(':memory:');
    const rows = db.prepare('SELECT * FROM platforms ORDER BY id').all() as any[];
    expect(rows).toHaveLength(4);
    expect(rows[0].id).toBe('boss');
    expect(rows[1].id).toBe('liepin');
    expect(rows[2].id).toBe('wuyou');
    expect(rows[3].id).toBe('zhilian');
    closeDb();
  });

  it('getDb with :memory: creates independent databases', () => {
    const db1 = getDb(':memory:');
    db1.prepare("CREATE TABLE test (val TEXT)").run();
    closeDb();

    const db2 = getDb(':memory:');
    const t = db2.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='test'").get();
    expect(t).toBeUndefined();
    closeDb();
  });
});
