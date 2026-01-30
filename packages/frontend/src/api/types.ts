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

export enum Role {
  FULL_STACK_ENGINEER = 'Full Stack Engineer',
  FULL_STACK_DEVELOPER = 'Full Stack Developer',
  FRONTEND_ENGINEER = 'Frontend Engineer',
  FRONTEND_DEVELOPER = 'Frontend Developer',
  BACKEND_ENGINEER = 'Backend Engineer',
  BACKEND_DEVELOPER = 'Backend Developer',
  DEVOPS_ENGINEER = 'DevOps Engineer',
  CLOUD_INFRASTRUCTURE_ENGINEER = 'Cloud Infrastructure Engineer',
  QA_AUTOMATION_ENGINEER = 'QA Automation Engineer',
  SOFTWARE_ENGINEER = 'Software Engineer',
  SOFTWARE_DEVELOPER = 'Software Developer',
  SENIOR_SOFTWARE_ENGINEER = 'Senior Software Engineer',
  LEAD_SOFTWARE_ENGINEER = 'Lead Software Engineer',
  PRINCIPAL_ENGINEER = 'Principal Engineer',
  STAFF_ENGINEER = 'Staff Engineer',
  SOLUTIONS_ARCHITECT = 'Solutions Architect',
  TECHNICAL_ARCHITECT = 'Technical Architect',
  DATA_ENGINEER = 'Data Engineer',
  MACHINE_LEARNING_ENGINEER = 'Machine Learning Engineer',
  MOBILE_ENGINEER = 'Mobile Engineer',
  SITE_RELIABILITY_ENGINEER = 'Site Reliability Engineer'
}

export enum RejectionReason {
  ROLE_CLOSED = 'Role Closed',
  UNSATISFIED_RESUME = 'Unsatisfied Resume',
  AUTO_REJECTED = 'Auto-Rejected (2 weeks)'
}

export enum HRFailureReason {
  BILINGUAL = 'Bilingual',
  NOT_REMOTE = 'Not Remote',
  SELF_MISTAKE = 'Self Mistake'
}

export enum TechFailureReason {
  LIVE_CODING = 'Live Coding',
  ANSWERING = 'Answering'
}

export enum FinalClientFailureReason {
  BACKGROUND_CHECK = 'Background Check',
  CONVERSATION_ISSUE = 'Conversation Issue'
}

export type InterviewFailureReason = HRFailureReason | TechFailureReason | FinalClientFailureReason;

export enum CancellationReason {
  ROLE_CLOSED = 'Role Closed',
  RESCHEDULED = 'Rescheduled'
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
  rejectionReason?: RejectionReason;
  hasBeenRebid?: boolean;
}

export interface CreateBidRequest {
  link: string;
  company: string;
  client: string;
  role: string;
  mainStacks: string[];
  jobDescription: string;
  resumeFile?: File;  // Optional - used when uploading new resume
  resumeId?: string;  // Optional - used when selecting from history
  origin: BidOrigin;
  recruiter?: string;
  resumeChecker?: ResumeCheckerType;
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
  failureReason?: InterviewFailureReason;
  hasScheduledNext?: boolean;
  cancellationReason?: CancellationReason;
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
  baseInterviewId?: string; // Optional - ID of the interview this is scheduled from (for "Schedule Next" feature)
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
  failureReason?: InterviewFailureReason;
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

// Resume Selection Types
export interface ResumeMetadata {
  id: string;
  company: string;
  role: string;
  techStack: string[];
  score: number;
  createdAt: string;
  matchedSkills: string[];
  missingSkills: string[];
}

// Pagination Types
export interface PaginationOptions {
  page: number;
  pageSize: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
