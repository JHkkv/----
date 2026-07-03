export interface PlatformSelectors {
  searchInput: string;
  searchButton: string;
  jobList: string;
  jobCard: string;
  jobTitle: string;
  companyName: string;
  salary: string;
  contactBtn: string;
  greetingInput: string;
  sendBtn: string;
  loginIndicator: string;
}

export interface PlatformScript {
  name: string;
  selectors: PlatformSelectors;
  checkLogin: () => boolean;
  searchJobs: (keyword: string, city: string) => Promise<void>;
  sendGreeting: (greeting: string) => Promise<boolean>;
}
