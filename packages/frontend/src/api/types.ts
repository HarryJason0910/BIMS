/**
 * TypeScript DTOs matching backend contracts
 */

// Enums
export enum BidStatus {
  NEW = 'NEW',
  SUBMITTED = 'SUBMITTED',
  REJECTED = 'REJECTED',
  INTERVIEW_STAGE = 'INTERVIEW_STAGE',
  INTERVIEW_FAILED = 'INTERVIEW_FAILED',
  CLOSED = 'CLOSED'
}

export enum ResumeCheckerType {
  ATS = 'ATS',
  RECRUITER = 'RECRUITER'
}

export enum BidOrigin {
  LINKEDIN = 'LINKEDIN',
  BID = 'BID'
}

export enum InterviewBase {
  BID = 'BID',
  LINKEDIN_CHAT = 'LINKEDIN_CHAT'
}

export enum InterviewType {
  HR = 'HR',
  TECH_INTERVIEW_1 = 'TECH_INTERVIEW_1',
  TECH_INTERVIEW_2 = 'TECH_INTERVIEW_2',
  TECH_INTERVIEW_3 = 'TECH_INTERVIEW_3',
  FINAL_INTERVIEW = 'FINAL_INTERVIEW',
  CLIENT_INTERVIEW = 'CLIENT_INTERVIEW'
}

export enum InterviewStatus {
  SCHEDULED = 'SCHEDULED',
  ATTENDED = 'ATTENDED',
  PENDING = 'PENDING',
  EXPIRED = 'EXPIRED',
  CLOSED = 'CLOSED',
  COMPLETED_SUCCESS = 'COMPLETED_SUCCESS',
  COMPLETED_FAILURE = 'COMPLETED_FAILURE',
  CANCELLED = 'CANCELLED'
}

// Bid Types
export interface Bid {
  id: string;
  link: string;
  company: string;
  client: string;
  role: string;
  mainStacks: string[];
  jobDescriptionPath: string;
  resumePath: string;
  origin: BidOrigin;
  recruiter?: string;
  date: string;
  status: BidStatus;
  interviewWinning: boolean;
  resumeChecker?: ResumeCheckerType;
  bidDetail?: string;
  originalBidId?: string;
}

export interface CreateBidRequest {
  link: string;
  company: string;
  client: string;
  role: string;
  mainStacks: string[];
  jobDescription: string;
  resumeFile: File;
  origin: BidOrigin;
  recruiter?: string;
}

export interface CreateBidResponse {
  bidId: string;
  warnings: DuplicationWarning[];
}

export interface DuplicationWarning {
  type: 'LINK_MATCH' | 'COMPANY_ROLE_MATCH';
  existingBidId: string;
  message: string;
}

export interface RebidRequest {
  resumeFile: File;
  jobDescription?: string;
}

export interface RebidResponse {
  newBidId: string;
}

// Interview Types
export interface Interview {
  id: string;
  base: InterviewBase;
  bidId?: string;
  company: string;
  client: string;
  role: string;
  recruiter: string;
  attendees: string[];
  interviewType: InterviewType;
  date: string;
  status: InterviewStatus;
  detail?: string;
}

export interface ScheduleInterviewRequest {
  base: InterviewBase;
  bidId?: string;
  company?: string;
  client?: string;
  role?: string;
  recruiter: string;
  attendees: string[];
  interviewType: InterviewType;
  date: string;
  detail?: string; // Optional - can be added later when completing the interview
}

export interface ScheduleInterviewResponse {
  interviewId: string;
  eligibilityResult: EligibilityResult;
}

export interface EligibilityResult {
  allowed: boolean;
  reason: string;
}

export interface CompleteInterviewRequest {
  success: boolean;
  detail?: string;
}

export interface CompleteInterviewResponse {
  success: boolean;
}

// Company History Types
export interface CompanyHistory {
  company: string;
  role: string;
  failures: FailureRecord[];
}

export interface FailureRecord {
  interviewId: string;
  date: string;
  recruiter: string;
  attendees: string[];
  detail?: string;
}

// Filter and Sort Types
export interface BidFilters {
  company?: string;
  role?: string;
  status?: BidStatus;
  dateFrom?: string;
  dateTo?: string;
  mainStacks?: string[];
}

export interface InterviewFilters {
  company?: string;
  role?: string;
  status?: InterviewStatus;
  recruiter?: string;
  interviewType?: InterviewType;
  attendees?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface SortOptions {
  field: string;
  order: 'asc' | 'desc';
}
