import { Request, Response, NextFunction, Router } from 'express';
import { IBidRepository } from '../application/IBidRepository';
import { IInterviewRepository } from '../application/IInterviewRepository';
import { BidStatus, BidOrigin } from '../domain/Bid';
import { InterviewStatus, InterviewType } from '../domain/Interview';

export class AnalyticsController {
  private router: Router;

  constructor(
    private bidRepository: IBidRepository,
    private interviewRepository: IInterviewRepository
  ) {
    this.router = Router();
    this.setupRoutes();
  }

  private setupRoutes(): void {
    this.router.get('/overview', this.getOverview.bind(this));
    this.router.get('/bid-performance', this.getBidPerformance.bind(this));
    this.router.get('/interview-performance', this.getInterviewPerformance.bind(this));
    this.router.get('/tech-stack-analysis', this.getTechStackAnalysis.bind(this));
    this.router.get('/company-performance', this.getCompanyPerformance.bind(this));
    this.router.get('/time-trends', this.getTimeTrends.bind(this));
    this.router.get('/recruiter-performance', this.getRecruiterPerformance.bind(this));
    this.router.get('/origin-comparison', this.getOriginComparison.bind(this));
    this.router.get('/advanced-trends', this.getAdvancedTrends.bind(this));
  }

  private async getOverview(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const bids = await this.bidRepository.findAll();
      const interviews = await this.interviewRepository.findAll();

      const totalBids = bids.length;
      const totalInterviews = interviews.length;
      const bidsWithInterviews = bids.filter(b => b.interviewWinning).length;
      const successfulInterviews = interviews.filter(i => i.status === InterviewStatus.COMPLETED_SUCCESS).length;
      const failedInterviews = interviews.filter(i => i.status === InterviewStatus.COMPLETED_FAILURE).length;

      // HR interviews
      const hrInterviews = interviews.filter(i => i.interviewType === InterviewType.HR);
      const hrSuccessful = hrInterviews.filter(i => i.status === InterviewStatus.COMPLETED_SUCCESS).length;
      const hrFailed = hrInterviews.filter(i => i.status === InterviewStatus.COMPLETED_FAILURE).length;

      // Tech interviews (Tech 1, 2, 3)
      const techInterviews = interviews.filter(i => 
        i.interviewType === InterviewType.TECH_INTERVIEW_1 ||
        i.interviewType === InterviewType.TECH_INTERVIEW_2 ||
        i.interviewType === InterviewType.TECH_INTERVIEW_3
      );
      const techSuccessful = techInterviews.filter(i => i.status === InterviewStatus.COMPLETED_SUCCESS).length;
      const techFailed = techInterviews.filter(i => i.status === InterviewStatus.COMPLETED_FAILURE).length;

      const bidSuccessRate = totalBids > 0 ? (bidsWithInterviews / totalBids) * 100 : 0;
      const interviewSuccessRate = (successfulInterviews + failedInterviews) > 0 
        ? (successfulInterviews / (successfulInterviews + failedInterviews)) * 100 
        : 0;
      const hrSuccessRate = (hrSuccessful + hrFailed) > 0
        ? (hrSuccessful / (hrSuccessful + hrFailed)) * 100
        : 0;
      const techSuccessRate = (techSuccessful + techFailed) > 0
        ? (techSuccessful / (techSuccessful + techFailed)) * 100
        : 0;

      res.json({
        totalBids,
        totalInterviews,
        bidsWithInterviews,
        successfulInterviews,
        failedInterviews,
        bidSuccessRate: Math.round(bidSuccessRate * 10) / 10,
        interviewSuccessRate: Math.round(interviewSuccessRate * 10) / 10,
        hrSuccessRate: Math.round(hrSuccessRate * 10) / 10,
        techSuccessRate: Math.round(techSuccessRate * 10) / 10,
        rejectedBids: bids.filter(b => b.bidStatus === BidStatus.REJECTED).length,
        pendingInterviews: interviews.filter(i => i.status === InterviewStatus.PENDING).length
      });
    } catch (error) {
      next(error);
    }
  }

  private async getBidPerformance(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const bids = await this.bidRepository.findAll();

      // Status distribution
      const statusDistribution = {
        [BidStatus.NEW]: 0,
        [BidStatus.SUBMITTED]: 0,
        [BidStatus.REJECTED]: 0,
        [BidStatus.INTERVIEW_STAGE]: 0,
        [BidStatus.INTERVIEW_FAILED]: 0,
        [BidStatus.CLOSED]: 0
      };

      bids.forEach(bid => {
        statusDistribution[bid.bidStatus]++;
      });

      // Success rate by origin
      const linkedinBids = bids.filter(b => b.origin === BidOrigin.LINKEDIN);
      const directBids = bids.filter(b => b.origin === BidOrigin.BID);

      const linkedinSuccess = linkedinBids.length > 0 
        ? (linkedinBids.filter(b => b.interviewWinning).length / linkedinBids.length) * 100 
        : 0;
      const directSuccess = directBids.length > 0 
        ? (directBids.filter(b => b.interviewWinning).length / directBids.length) * 100 
        : 0;

      res.json({
        statusDistribution,
        successRateByOrigin: {
          linkedin: Math.round(linkedinSuccess * 10) / 10,
          direct: Math.round(directSuccess * 10) / 10
        },
        totalBids: bids.length,
        rejectionRate: bids.length > 0 
          ? Math.round((bids.filter(b => b.bidStatus === BidStatus.REJECTED).length / bids.length) * 1000) / 10 
          : 0
      });
    } catch (error) {
      next(error);
    }
  }

  private async getInterviewPerformance(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const interviews = await this.interviewRepository.findAll();

      // Status distribution
      const statusDistribution: Record<string, number> = {};
      Object.values(InterviewStatus).forEach(status => {
        statusDistribution[status] = interviews.filter(i => i.status === status).length;
      });

      // Success rate by stage
      const stagePerformance: Record<string, { total: number; passed: number; failed: number }> = {};
      Object.values(InterviewType).forEach(type => {
        const stageInterviews = interviews.filter(i => i.interviewType === type);
        stagePerformance[type] = {
          total: stageInterviews.length,
          passed: stageInterviews.filter(i => i.status === InterviewStatus.COMPLETED_SUCCESS).length,
          failed: stageInterviews.filter(i => i.status === InterviewStatus.COMPLETED_FAILURE).length
        };
      });

      // Calculate pass rate for each stage
      const stagePassRates = Object.entries(stagePerformance).map(([stage, data]) => ({
        stage,
        total: data.total,
        passRate: data.total > 0 ? Math.round((data.passed / (data.passed + data.failed)) * 1000) / 10 : 0
      }));

      res.json({
        statusDistribution,
        stagePerformance,
        stagePassRates,
        totalInterviews: interviews.length
      });
    } catch (error) {
      next(error);
    }
  }

  private async getTechStackAnalysis(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const bids = await this.bidRepository.findAll();

      // Count occurrences of each tech stack
      const stackCounts: Record<string, { total: number; withInterview: number }> = {};

      bids.forEach(bid => {
        // Extract skills from both legacy (string[]) and new (LayerSkills) formats
        const skills = this.extractSkills(bid.mainStacks);
        skills.forEach(stack => {
          if (!stackCounts[stack]) {
            stackCounts[stack] = { total: 0, withInterview: 0 };
          }
          stackCounts[stack].total++;
          if (bid.interviewWinning) {
            stackCounts[stack].withInterview++;
          }
        });
      });

      // Calculate success rate for each stack
      const stackPerformance = Object.entries(stackCounts)
        .map(([stack, data]) => ({
          stack,
          total: data.total,
          withInterview: data.withInterview,
          successRate: data.total > 0 ? Math.round((data.withInterview / data.total) * 1000) / 10 : 0
        }))
        .sort((a, b) => b.total - a.total);

      res.json({
        stackPerformance,
        topStacks: stackPerformance.slice(0, 10),
        totalUniqueStacks: Object.keys(stackCounts).length
      });
    } catch (error) {
      next(error);
    }
  }

  private async getCompanyPerformance(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const bids = await this.bidRepository.findAll();
      const interviews = await this.interviewRepository.findAll();

      // Group by company
      const companyStats: Record<string, { 
        totalBids: number; 
        withInterview: number; 
        totalInterviews: number;
        passedInterviews: number;
        failedInterviews: number;
      }> = {};

      bids.forEach(bid => {
        if (!companyStats[bid.company]) {
          companyStats[bid.company] = { 
            totalBids: 0, 
            withInterview: 0, 
            totalInterviews: 0,
            passedInterviews: 0,
            failedInterviews: 0
          };
        }
        companyStats[bid.company].totalBids++;
        if (bid.interviewWinning) {
          companyStats[bid.company].withInterview++;
        }
      });

      interviews.forEach(interview => {
        if (companyStats[interview.company]) {
          companyStats[interview.company].totalInterviews++;
          if (interview.status === InterviewStatus.COMPLETED_SUCCESS) {
            companyStats[interview.company].passedInterviews++;
          } else if (interview.status === InterviewStatus.COMPLETED_FAILURE) {
            companyStats[interview.company].failedInterviews++;
          }
        }
      });

      // Calculate rates
      const companyPerformance = Object.entries(companyStats)
        .map(([company, data]) => ({
          company,
          totalBids: data.totalBids,
          bidSuccessRate: data.totalBids > 0 
            ? Math.round((data.withInterview / data.totalBids) * 1000) / 10 
            : 0,
          totalInterviews: data.totalInterviews,
          interviewSuccessRate: (data.passedInterviews + data.failedInterviews) > 0
            ? Math.round((data.passedInterviews / (data.passedInterviews + data.failedInterviews)) * 1000) / 10
            : 0
        }))
        .sort((a, b) => b.totalBids - a.totalBids);

      res.json({
        companyPerformance,
        topCompanies: companyPerformance.slice(0, 10),
        totalCompanies: Object.keys(companyStats).length
      });
    } catch (error) {
      next(error);
    }
  }

  private async getTimeTrends(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const bids = await this.bidRepository.findAll();
      const interviews = await this.interviewRepository.findAll();

      // Group by month
      const monthlyData: Record<string, { bids: number; interviews: number; successfulInterviews: number }> = {};

      bids.forEach(bid => {
        const month = new Date(bid.date).toISOString().slice(0, 7); // YYYY-MM
        if (!monthlyData[month]) {
          monthlyData[month] = { bids: 0, interviews: 0, successfulInterviews: 0 };
        }
        monthlyData[month].bids++;
      });

      interviews.forEach(interview => {
        const month = new Date(interview.date).toISOString().slice(0, 7);
        if (!monthlyData[month]) {
          monthlyData[month] = { bids: 0, interviews: 0, successfulInterviews: 0 };
        }
        monthlyData[month].interviews++;
        if (interview.status === InterviewStatus.COMPLETED_SUCCESS) {
          monthlyData[month].successfulInterviews++;
        }
      });

      // Convert to array and sort by date
      const trends = Object.entries(monthlyData)
        .map(([month, data]) => ({
          month,
          bids: data.bids,
          interviews: data.interviews,
          successfulInterviews: data.successfulInterviews,
          successRate: data.interviews > 0 
            ? Math.round((data.successfulInterviews / data.interviews) * 1000) / 10 
            : 0
        }))
        .sort((a, b) => a.month.localeCompare(b.month));

      res.json({
        trends,
        totalMonths: trends.length
      });
    } catch (error) {
      next(error);
    }
  }

  private async getRecruiterPerformance(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const interviews = await this.interviewRepository.findAll();

      // Group by recruiter
      const recruiterStats: Record<string, { 
        total: number; 
        passed: number; 
        failed: number;
        pending: number;
      }> = {};

      interviews.forEach(interview => {
        if (!recruiterStats[interview.recruiter]) {
          recruiterStats[interview.recruiter] = { total: 0, passed: 0, failed: 0, pending: 0 };
        }
        recruiterStats[interview.recruiter].total++;
        if (interview.status === InterviewStatus.COMPLETED_SUCCESS) {
          recruiterStats[interview.recruiter].passed++;
        } else if (interview.status === InterviewStatus.COMPLETED_FAILURE) {
          recruiterStats[interview.recruiter].failed++;
        } else if (interview.status === InterviewStatus.PENDING) {
          recruiterStats[interview.recruiter].pending++;
        }
      });

      // Calculate success rates
      const recruiterPerformance = Object.entries(recruiterStats)
        .map(([recruiter, data]) => ({
          recruiter,
          total: data.total,
          passed: data.passed,
          failed: data.failed,
          pending: data.pending,
          successRate: (data.passed + data.failed) > 0 
            ? Math.round((data.passed / (data.passed + data.failed)) * 1000) / 10 
            : 0
        }))
        .sort((a, b) => b.total - a.total);

      res.json({
        recruiterPerformance,
        topRecruiters: recruiterPerformance.slice(0, 10),
        totalRecruiters: Object.keys(recruiterStats).length
      });
    } catch (error) {
      next(error);
    }
  }

  private async getOriginComparison(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const bids = await this.bidRepository.findAll();

      const linkedinBids = bids.filter(b => b.origin === BidOrigin.LINKEDIN);
      const directBids = bids.filter(b => b.origin === BidOrigin.BID);

      const comparison = {
        linkedin: {
          total: linkedinBids.length,
          withInterview: linkedinBids.filter(b => b.interviewWinning).length,
          rejected: linkedinBids.filter(b => b.bidStatus === BidStatus.REJECTED).length,
          successRate: linkedinBids.length > 0 
            ? Math.round((linkedinBids.filter(b => b.interviewWinning).length / linkedinBids.length) * 1000) / 10 
            : 0
        },
        direct: {
          total: directBids.length,
          withInterview: directBids.filter(b => b.interviewWinning).length,
          rejected: directBids.filter(b => b.bidStatus === BidStatus.REJECTED).length,
          successRate: directBids.length > 0 
            ? Math.round((directBids.filter(b => b.interviewWinning).length / directBids.length) * 1000) / 10 
            : 0
        }
      };

      res.json(comparison);
    } catch (error) {
      next(error);
    }
  }

  private async getAdvancedTrends(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { period = 'month', stack, role, company } = req.query;
      
      let bids = await this.bidRepository.findAll();
      let interviews = await this.interviewRepository.findAll();

      // Apply filters
      if (stack) {
        bids = bids.filter(b => {
          const skills = this.extractSkills(b.mainStacks);
          return skills.includes(stack as string);
        });
      }
      if (role) {
        bids = bids.filter(b => b.role.toLowerCase().includes((role as string).toLowerCase()));
        interviews = interviews.filter(i => i.role.toLowerCase().includes((role as string).toLowerCase()));
      }
      if (company) {
        bids = bids.filter(b => b.company.toLowerCase().includes((company as string).toLowerCase()));
        interviews = interviews.filter(i => i.company.toLowerCase().includes((company as string).toLowerCase()));
      }

      // Group data by time period
      const timeData: Record<string, {
        totalBids: number;
        totalInterviews: number;
        bidsWithInterview: number;
        hrInterviews: number;
        hrPassed: number;
        hrFailed: number;
        techInterviews: number;
        techPassed: number;
        techFailed: number;
      }> = {};

      const getTimePeriod = (date: Date): string => {
        if (period === 'week') {
          // Get week number and year
          const startOfYear = new Date(date.getFullYear(), 0, 1);
          const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
          const weekNum = Math.ceil((days + startOfYear.getDay() + 1) / 7);
          return `${date.getFullYear()}-W${weekNum.toString().padStart(2, '0')}`;
        } else {
          // Default to month
          return date.toISOString().slice(0, 7); // YYYY-MM
        }
      };

      // Process bids
      bids.forEach(bid => {
        const timePeriod = getTimePeriod(new Date(bid.date));
        if (!timeData[timePeriod]) {
          timeData[timePeriod] = {
            totalBids: 0,
            totalInterviews: 0,
            bidsWithInterview: 0,
            hrInterviews: 0,
            hrPassed: 0,
            hrFailed: 0,
            techInterviews: 0,
            techPassed: 0,
            techFailed: 0
          };
        }
        timeData[timePeriod].totalBids++;
        if (bid.interviewWinning) {
          timeData[timePeriod].bidsWithInterview++;
        }
      });

      // Process interviews
      interviews.forEach(interview => {
        const timePeriod = getTimePeriod(new Date(interview.date));
        if (!timeData[timePeriod]) {
          timeData[timePeriod] = {
            totalBids: 0,
            totalInterviews: 0,
            bidsWithInterview: 0,
            hrInterviews: 0,
            hrPassed: 0,
            hrFailed: 0,
            techInterviews: 0,
            techPassed: 0,
            techFailed: 0
          };
        }
        timeData[timePeriod].totalInterviews++;

        // HR interviews
        if (interview.interviewType === InterviewType.HR) {
          timeData[timePeriod].hrInterviews++;
          if (interview.status === InterviewStatus.COMPLETED_SUCCESS) {
            timeData[timePeriod].hrPassed++;
          } else if (interview.status === InterviewStatus.COMPLETED_FAILURE) {
            timeData[timePeriod].hrFailed++;
          }
        }

        // Tech interviews
        if (
          interview.interviewType === InterviewType.TECH_INTERVIEW_1 ||
          interview.interviewType === InterviewType.TECH_INTERVIEW_2 ||
          interview.interviewType === InterviewType.TECH_INTERVIEW_3
        ) {
          timeData[timePeriod].techInterviews++;
          if (interview.status === InterviewStatus.COMPLETED_SUCCESS) {
            timeData[timePeriod].techPassed++;
          } else if (interview.status === InterviewStatus.COMPLETED_FAILURE) {
            timeData[timePeriod].techFailed++;
          }
        }
      });

      // Convert to array and calculate rates
      const trends = Object.entries(timeData)
        .map(([period, data]) => ({
          period,
          totalBids: data.totalBids,
          totalInterviews: data.totalInterviews,
          bidSuccessRate: data.totalBids > 0 
            ? Math.round((data.bidsWithInterview / data.totalBids) * 1000) / 10 
            : 0,
          hrSuccessRate: (data.hrPassed + data.hrFailed) > 0
            ? Math.round((data.hrPassed / (data.hrPassed + data.hrFailed)) * 1000) / 10
            : 0,
          techSuccessRate: (data.techPassed + data.techFailed) > 0
            ? Math.round((data.techPassed / (data.techPassed + data.techFailed)) * 1000) / 10
            : 0,
          hrInterviews: data.hrInterviews,
          techInterviews: data.techInterviews
        }))
        .sort((a, b) => a.period.localeCompare(b.period));

      res.json({
        trends,
        filters: {
          period,
          stack: stack || null,
          role: role || null,
          company: company || null
        },
        totalPeriods: trends.length
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Helper method to extract skills from both legacy (string[]) and new (LayerSkills) formats
   */
  private extractSkills(mainStacks: string[] | any): string[] {
    if (Array.isArray(mainStacks)) {
      // Legacy format
      return mainStacks;
    }
    
    // New format (LayerSkills) - flatten all layers
    const allSkills: string[] = [];
    const layers = ['frontend', 'backend', 'database', 'cloud', 'devops', 'others'];
    for (const layer of layers) {
      const layerSkills = mainStacks[layer] || [];
      allSkills.push(...layerSkills.map((s: any) => s.skill));
    }
    return allSkills;
  }

  public getRouter(): Router {
    return this.router;
  }
}
