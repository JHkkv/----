import type Database from 'better-sqlite3';

export function initSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS resumes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT NOT NULL,
      work_years INTEGER NOT NULL DEFAULT 0,
      current_role TEXT NOT NULL DEFAULT '',
      skills TEXT NOT NULL DEFAULT '[]',
      projects TEXT NOT NULL DEFAULT '[]',
      education TEXT NOT NULL DEFAULT '',
      school TEXT NOT NULL DEFAULT '',
      raw_text TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS platforms (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      login_url TEXT NOT NULL,
      search_url TEXT NOT NULL,
      enabled INTEGER NOT NULL DEFAULT 1,
      daily_limit INTEGER NOT NULL DEFAULT 50,
      min_delay_ms INTEGER NOT NULL DEFAULT 30000,
      max_delay_ms INTEGER NOT NULL DEFAULT 90000
    );

    CREATE TABLE IF NOT EXISTS job_targets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      keywords TEXT NOT NULL DEFAULT '[]',
      cities TEXT NOT NULL DEFAULT '[]',
      min_salary INTEGER NOT NULL DEFAULT 0,
      max_salary INTEGER NOT NULL DEFAULT 0,
      platforms TEXT NOT NULL DEFAULT '[]',
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      platform TEXT NOT NULL,
      company TEXT NOT NULL,
      position TEXT NOT NULL,
      salary TEXT NOT NULL DEFAULT '',
      greeting TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'sent',
      sent_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS blacklist (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company TEXT NOT NULL UNIQUE,
      reason TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Seed default platform configs
  const count = db.prepare('SELECT COUNT(*) as c FROM platforms').get() as { c: number };
  if (count.c === 0) {
    const insert = db.prepare(
      'INSERT INTO platforms (id, name, login_url, search_url, enabled, daily_limit, min_delay_ms, max_delay_ms) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    );
    const tx = db.transaction(() => {
      insert.run('boss', 'Boss直聘', 'https://www.zhipin.com/web/user/', 'https://www.zhipin.com/web/geek/job', 1, 50, 30000, 90000);
      insert.run('wuyou', '前程无忧', 'https://login.51job.com/', 'https://we.51job.com/pc/search', 0, 50, 40000, 100000);
      insert.run('liepin', '猎聘', 'https://www.liepin.com/', 'https://www.liepin.com/zhaopin/', 0, 50, 40000, 100000);
      insert.run('zhilian', '智联招聘', 'https://www.zhaopin.com/', 'https://www.zhaopin.com/sou/', 0, 50, 40000, 100000);
    });
    tx();
  }
}
