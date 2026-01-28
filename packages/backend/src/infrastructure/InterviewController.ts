import { Request, Response, NextFunction, Router } from 'express';
import { ScheduleInterviewUseCase } from '../application/ScheduleInterviewUseCase';
import { CompleteInterviewUseCase } from '../application/CompleteInterviewUseCase';
import { IInterviewRepository } from '../application/IInterviewRepository';
import { InterviewBase } from '../domain/Interview';

export class InterviewController {
  private router: Router;

  constructor(
    private scheduleInterviewUseCase: ScheduleInterviewUseCase,
    private completeInterviewUseCase: CompleteInterviewUseCase,
    private interviewRepository: IInterviewRepository
  ) {
    this.router = Router();
    this.setupRoutes();
  }

  private setupRoutes(): void {
    this.router.post('/', this.scheduleInterview.bind(this));
    this.router.get('/', this.getAllInterviews.bind(this));
    this.router.get('/:id', this.getInterviewById.bind(this));
    this.router.post('/:id/attend', this.markAttended.bind(this));
    this.router.post('/:id/close', this.closeInterview.bind(this));
    this.router.post('/:id/complete', this.completeInterview.bind(this));
    this.router.post('/:id/cancel', this.cancelInterview.bind(this));
    this.router.put('/:id', this.updateInterview.bind(this));
    this.router.delete('/:id', this.deleteInterview.bind(this));
  }

  private async scheduleInterview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        base,
        bidId,
        company,
        client,
        role,
        jobDescription,
        resume,
        interviewType,
        recruiter,
        attendees,
        detail,
      } = req.body;

      // Validate required fields
      if (!base || !interviewType || !recruiter) {
        res.status(400).json({
          error: 'Validation Error',
          message: 'Missing required fields: base, interviewType, recruiter',
        });
        return;
      }

      // Validate attendees array exists (but can be empty for HR interviews)
      if (!Array.isArray(attendees)) {
        res.status(400).json({
          error: 'Validation Error',
          message: 'attendees must be an array',
        });
        return;
      }

      // For non-HR interviews, attendees are required
      if (interviewType !== 'HR' && attendees.length === 0) {
        res.status(400).json({
          error: 'Validation Error',
          message: 'attendees are required for non-HR interviews',
        });
        return;
      }

      // Validate base value
      if (base !== InterviewBase.BID && base !== InterviewBase.LINKEDIN_CHAT) {
        res.status(400).json({
          error: 'Validation Error',
          message: 'base must be either "BID" or "LINKEDIN_CHAT"',
        });
        return;
      }

      // If base is BID, bidId is required
      if (base === InterviewBase.BID && !bidId) {
        res.status(400).json({
          error: 'Validation Error',
          message: 'bidId is required when base is "BID"',
        });
        return;
      }

      // If base is LINKEDIN_CHAT, manual fields are required
      if (base === InterviewBase.LINKEDIN_CHAT) {
        if (!company || !client || !role) {
          res.status(400).json({
            error: 'Validation Error',
            message:
              'company, client, and role are required when base is "LINKEDIN_CHAT"',
          });
          return;
        }
      }

      const result = await this.scheduleInterviewUseCase.execute({
        base,
        bidId,
        company: company || '',
        client: client || '',
        role: role || '',
        jobDescription: jobDescription || '',
        resume: resume || '',
        interviewType,
        recruiter,
        attendees,
        detail: detail || '', // Optional - defaults to empty string
      });

      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  private async getAllInterviews(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { company, role, status, recruiter, interviewType, attendees, dateFrom, dateTo, sortBy, sortOrder } = req.query;

      // Build filter options
      const filters: any = {};
      if (company) filters.company = company as string;
      if (role) filters.role = role as string;
      if (status) filters.status = status as string;
      if (recruiter) filters.recruiter = recruiter as string;
      if (interviewType) filters.interviewType = interviewType as string;
      if (attendees) filters.attendees = attendees as string;
      if (dateFrom) filters.dateFrom = new Date(dateFrom as string);
      if (dateTo) filters.dateTo = new Date(dateTo as string);

      // Build sort options
      let sort: any = undefined;
      if (sortBy) {
        sort = {
          field: sortBy as 'date' | 'company' | 'role' | 'status',
          order: (sortOrder as 'asc' | 'desc') || 'asc',
        };
      }

      const interviews = await this.interviewRepository.findAll(filters, sort);
      res.json(interviews);
    } catch (error) {
      next(error);
    }
  }

  private async getInterviewById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const interview = await this.interviewRepository.findById(id);

      if (!interview) {
        res.status(404).json({
          error: 'Not Found',
          message: `Interview with id ${id} not found`,
        });
        return;
      }

      res.json(interview);
    } catch (error) {
      next(error);
    }
  }

  private async markAttended(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const interview = await this.interviewRepository.findById(id);

      if (!interview) {
        res.status(404).json({
          error: 'Not Found',
          message: `Interview with id ${id} not found`,
        });
        return;
      }

      // Mark as attended and then immediately as pending
      interview.markAsAttended();
      interview.markAsPending();
      
      await this.interviewRepository.update(interview);
      res.json({ success: true, status: interview.status });
    } catch (error) {
      next(error);
    }
  }

  private async closeInterview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const interview = await this.interviewRepository.findById(id);

      if (!interview) {
        res.status(404).json({
          error: 'Not Found',
          message: `Interview with id ${id} not found`,
        });
        return;
      }

      interview.markAsClosed();
      
      await this.interviewRepository.update(interview);
      res.json({ success: true, status: interview.status });
    } catch (error) {
      next(error);
    }
  }

  private async completeInterview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { success, detail } = req.body;

      if (typeof success !== 'boolean') {
        res.status(400).json({
          error: 'Validation Error',
          message: 'success field is required and must be a boolean',
        });
        return;
      }

      const result = await this.completeInterviewUseCase.execute({
        interviewId: id,
        success,
        detail,
      });

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  private async cancelInterview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const interview = await this.interviewRepository.findById(id);

      if (!interview) {
        res.status(404).json({
          error: 'Not Found',
          message: `Interview with id ${id} not found`,
        });
        return;
      }

      interview.markAsCancelled();
      
      await this.interviewRepository.update(interview);
      res.json({ success: true, status: interview.status });
    } catch (error) {
      next(error);
    }
  }

  private async updateInterview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const interview = await this.interviewRepository.findById(id);

      if (!interview) {
        res.status(404).json({
          error: 'Not Found',
          message: `Interview with id ${id} not found`,
        });
        return;
      }

      // Update detail field using the domain method
      const { detail } = req.body;
      if (detail !== undefined) {
        interview.updateDetail(detail);
      }

      await this.interviewRepository.update(interview);
      res.json(interview);
    } catch (error) {
      next(error);
    }
  }

  private async deleteInterview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const interview = await this.interviewRepository.findById(id);

      if (!interview) {
        res.status(404).json({
          error: 'Not Found',
          message: `Interview with id ${id} not found`,
        });
        return;
      }

      await this.interviewRepository.delete(id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  public getRouter(): Router {
    return this.router;
  }
}
