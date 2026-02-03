const fs = require('fs');
const path = require('path');

// Fix RebidWithNewResumeUseCase.test.ts
const rebidTestPath = path.join(__dirname, 'src/application/RebidWithNewResumeUseCase.test.ts');
let rebidContent = fs.readFileSync(rebidTestPath, 'utf8');
rebidContent = rebidContent.replace(/RejectionReason\.NO_RESPONSE/g, 'RejectionReason.UNSATISFIED_RESUME');
rebidContent = rebidContent.replace(/useCase = new RebidWithNewResumeUseCase\(mockBidRepository, duplicationPolicy, companyHistory\);/g, 
  'useCase = new RebidWithNewResumeUseCase(mockBidRepository, duplicationPolicy, companyHistory, {} as any);');
fs.writeFileSync(rebidTestPath, rebidContent);
console.log('Fixed RebidWithNewResumeUseCase.test.ts');

// Fix ScheduleInterviewUseCase.test.ts - remove unused import
const scheduleTestPath = path.join(__dirname, 'src/application/ScheduleInterviewUseCase.test.ts');
let scheduleContent = fs.readFileSync(scheduleTestPath, 'utf8');
scheduleContent = scheduleContent.replace(/import \{ Bid, BidStatus, BidOrigin, RejectionReason \} from '\.\.\/domain\/Bid';/g,
  "import { Bid, BidStatus, BidOrigin } from '../domain/Bid';");
fs.writeFileSync(scheduleTestPath, scheduleContent);
console.log('Fixed ScheduleInterviewUseCase.test.ts');

// Fix CompleteInterviewUseCase.test.ts
const completeTestPath = path.join(__dirname, 'src/application/CompleteInterviewUseCase.test.ts');
let completeContent = fs.readFileSync(completeTestPath, 'utf8');
completeContent = completeContent.replace(/jobDescriptionPath:/g, 'jobDescription:');
completeContent = completeContent.replace(/resumePath:/g, 'resume:');
fs.writeFileSync(completeTestPath, completeContent);
console.log('Fixed CompleteInterviewUseCase.test.ts');

// Fix Interview.property.test.ts
const interviewPropTestPath = path.join(__dirname, 'src/domain/Interview.property.test.ts');
let interviewPropContent = fs.readFileSync(interviewPropTestPath, 'utf8');
interviewPropContent = interviewPropContent.replace(/InterviewType\.FINAL/g, 'InterviewType.FINAL_INTERVIEW');
interviewPropContent = interviewPropContent.replace(/BidOrigin\.REBID/g, 'BidOrigin.BID');
interviewPropContent = interviewPropContent.replace(/jobDescriptionPath:/g, 'jobDescription:');
interviewPropContent = interviewPropContent.replace(/resumePath:/g, 'resume:');
interviewPropContent = interviewPropContent.replace(/interview\.jobDescriptionPath/g, 'interview.jobDescription');
interviewPropContent = interviewPropContent.replace(/interview\.resumePath/g, 'interview.resume');
interviewPropContent = interviewPropContent.replace(/bid\.jobDescriptionPath/g, 'bid.jobDescriptionPath');
interviewPropContent = interviewPropContent.replace(/bid\.resumePath/g, 'bid.resumePath');
fs.writeFileSync(interviewPropTestPath, interviewPropContent);
console.log('Fixed Interview.property.test.ts');

// Fix ResumeCheckerService.property.test.ts
const resumeCheckerPropTestPath = path.join(__dirname, 'src/domain/ResumeCheckerService.property.test.ts');
let resumeCheckerPropContent = fs.readFileSync(resumeCheckerPropTestPath, 'utf8');
resumeCheckerPropContent = resumeCheckerPropContent.replace(/BidOrigin\.REBID/g, 'BidOrigin.BID');
fs.writeFileSync(resumeCheckerPropTestPath, resumeCheckerPropContent);
console.log('Fixed ResumeCheckerService.property.test.ts');

console.log('All test files fixed!');
