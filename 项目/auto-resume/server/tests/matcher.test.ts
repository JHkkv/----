import { describe, it, expect } from 'vitest';
import { matchJob, extractSalaryNumber } from '../src/matcher';
import type { JobTarget } from '../../shared/types';

describe('Job Matcher', () => {
  const target: JobTarget = {
    id: 1,
    keywords: ['前端', 'React'],
    cities: ['北京', '上海'],
    minSalary: 10,
    maxSalary: 30,
    platforms: ['boss'],
    active: true,
    createdAt: '2026-01-01',
  };

  const blacklist = ['外包公司A', '皮包公司B'];

  it('matches a relevant job with high score', () => {
    const job = { title: '高级前端开发工程师', company: '字节跳动', salary: '20k-35k', city: '北京', salaryNum: 25 };
    const result = matchJob(job, target, blacklist, []);
    expect(result.matched).toBe(true);
    expect(result.score).toBeGreaterThan(50);
  });

  it('rejects job below min salary', () => {
    const job = { title: '前端开发', company: '小公司', salary: '5k-8k', city: '北京', salaryNum: 8 };
    const result = matchJob(job, target, blacklist, []);
    expect(result.matched).toBe(false);
  });

  it('rejects blacklisted company', () => {
    const job = { title: '高级前端', company: '外包公司A', salary: '20k', city: '北京', salaryNum: 20 };
    const result = matchJob(job, target, blacklist, []);
    expect(result.matched).toBe(false);
    expect(result.reason).toContain('blacklist');
  });

  it('rejects already-applied job', () => {
    const job = { title: '前端开发', company: '字节跳动', salary: '20k', city: '北京', salaryNum: 20 };
    const applied = ['字节跳动-前端开发'];
    const result = matchJob(job, target, blacklist, applied);
    expect(result.matched).toBe(false);
    expect(result.reason).toContain('already applied');
  });

  it('rejects wrong city', () => {
    const job = { title: '前端开发', company: '某公司', salary: '20k', city: '深圳', salaryNum: 20 };
    const result = matchJob(job, target, blacklist, []);
    expect(result.matched).toBe(false);
    expect(result.reason).toContain('city');
  });

  it('extractSalaryNumber parses various formats', () => {
    expect(extractSalaryNumber('20k-35k')).toBe(20);
    expect(extractSalaryNumber('1.5万-2万')).toBe(15);
    expect(extractSalaryNumber('15000-25000')).toBe(15);
    expect(extractSalaryNumber('面议')).toBeNull();
  });
});
