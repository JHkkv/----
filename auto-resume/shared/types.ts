// shared/types.ts

// —— Resume ——
export interface Resume {
  id: number;
  name: string;
  phone: string;
  email: string;
  workYears: number;
  currentRole: string;
  skills: string[];
  projects: string[];
  education: string;
  school: string;
  rawText: string;
  createdAt: string;
  updatedAt: string;
}

export interface ResumeInput {
  name: string;
  phone: string;
  email: string;
  workYears: number;
  currentRole: string;
  skills: string[];
  projects: string[];
  education: string;
  school: string;
}

// —— Platform ——
export type PlatformId = 'boss' | 'wuyou' | 'liepin' | 'zhilian';

export interface Platform {
  id: PlatformId;
  name: string;
  loginUrl: string;
  searchUrl: string;
  enabled: boolean;
  dailyLimit: number;
  minDelayMs: number;
  maxDelayMs: number;
}

// —— Job Target ——
export interface JobTarget {
  id: number;
  keywords: string[];
  cities: string[];
  minSalary: number;
  maxSalary: number;
  platforms: PlatformId[];
  active: boolean;
  createdAt: string;
}

// —— Application Record ——
export type ApplicationStatus = 'sent' | 'read' | 'replied' | 'rejected' | 'ignored';

export interface Application {
  id: number;
  platform: PlatformId;
  company: string;
  position: string;
  salary: string;
  greeting: string;
  status: ApplicationStatus;
  sentAt: string;
  updatedAt: string;
}

// —— WebSocket Messages ——

export type WsMessageType =
  | 'task:start'
  | 'task:stop'
  | 'task:progress'
  | 'task:done'
  | 'task:error'
  | 'resume:save'
  | 'resume:get'
  | 'jobtargets:save'
  | 'jobtargets:list'
  | 'apps:list'
  | 'apps:stats'
  | 'config:get'
  | 'config:update';

export interface WsMessage {
  type: WsMessageType;
  payload?: unknown;
  requestId?: string;
}

export interface WsResponse {
  type: string;
  success: boolean;
  data?: unknown;
  error?: string;
  requestId?: string;
}

// —— Stats ——
export interface DeliveryStats {
  totalSent: number;
  totalRead: number;
  totalReplied: number;
  todaySent: number;
  byPlatform: Record<PlatformId, { sent: number; replied: number }>;
}

// —— Platform Config ——
export interface PlatformConfig {
  greetTemplate: string;
  workdayOnly: boolean;
  workHoursStart: number;
  workHoursEnd: number;
}
