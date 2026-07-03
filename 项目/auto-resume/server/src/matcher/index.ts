import type { JobTarget } from '../../../shared/types';

export interface JobItem {
  title: string;
  company: string;
  salary: string;
  city: string;
  salaryNum: number | null;
}

export interface MatchResult {
  matched: boolean;
  score: number;
  reason?: string;
}

export function matchJob(
  job: JobItem,
  target: JobTarget,
  blacklist: string[],
  alreadyApplied: string[]
): MatchResult {
  // 1. Blacklist check
  if (blacklist.some(b => job.company.includes(b) || b.includes(job.company))) {
    return { matched: false, score: 0, reason: 'blacklist' };
  }

  // 2. Already applied check
  const appliedKey = `${job.company}-${job.title}`;
  if (alreadyApplied.some(a => a === appliedKey || (job.title.includes(a.split('-')[1]) && job.company === a.split('-')[0]))) {
    return { matched: false, score: 0, reason: 'already applied' };
  }

  // 3. City filter
  if (target.cities.length > 0) {
    const cityMatch = target.cities.some(c => job.city.includes(c));
    if (!cityMatch) {
      return { matched: false, score: 0, reason: 'city mismatch' };
    }
  }

  // 4. Salary filter
  if (target.minSalary > 0 && job.salaryNum !== null && job.salaryNum < target.minSalary) {
    return { matched: false, score: 0, reason: 'salary below min' };
  }

  // 5. Keyword scoring
  let score = 0;
  const titleLower = job.title.toLowerCase();
  for (const kw of target.keywords) {
    const kwLower = kw.toLowerCase();
    if (titleLower.includes(kwLower)) {
      score += 40;
    }
    // Partial match (e.g. "前端" matched by "Web前端")
    if (kwLower.length >= 2 && titleLower.includes(kwLower.slice(0, 2))) {
      score += 20;
    }
  }

  // Normalize score to 0-100
  score = Math.min(100, score);

  return {
    matched: score >= 30,
    score,
  };
}

export function extractSalaryNumber(salaryStr: string): number | null {
  // Handle patterns like "20k-35k", "1.5万-2万", "15000-25000", "面议"
  const kMatch = salaryStr.match(/(\d+(?:\.\d+)?)\s*k/i);
  if (kMatch) return parseFloat(kMatch[1]);
  const wanMatch = salaryStr.match(/(\d+(?:\.\d+)?)\s*万/i);
  if (wanMatch) return parseFloat(wanMatch[1]) * 10;
  const numMatch = salaryStr.match(/(\d{4,5})/);
  if (numMatch) return parseInt(numMatch[1]) / 1000;
  return null;
}
