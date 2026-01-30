import { Request, Response, NextFunction, Router } from 'express';
import multer from 'multer';
import { CreateBidUseCase } from '../application/CreateBidUseCase';
import { RebidWithNewResumeUseCase } from '../application/RebidWithNewResumeUseCase';
import { IBidRepository } from '../application/IBidRepository';
import { FileStorageService } from './FileStorageService';
import { BidOrigin, RejectionReason } from '../domain/Bid';

export class BidController {
  private router: Router;
  private upload: multer.Multer;

  constructor(
    private createBidUseCase: CreateBidUseCase,
    private rebidUseCase: RebidWithNewResumeUseCase,
    private bidRepository: IBidRepository,
    private fileStorageService: FileStorageService
  ) {
    this.router = Router();
    this.upload = multer({ storage: multer.memoryStorage() });
    this.setupRoutes();
  }

  private setupRoutes(): void {
    this.router.post('/', this.upload.single('resume'), this.createBid.bind(this));
    this.router.get('/', this.getAllBids.bind(this));
    this.router.get('/:id', this.getBidById.bind(this));
    this.router.get('/:id/resume', this.downloadResume.bind(this));
    this.router.get('/:id/jd', this.downloadJobDescription.bind(this));
    this.router.get('/:id/candidate-resumes', this.getCandidateResumes.bind(this));
    this.router.post('/:id/rebid', this.upload.single('resume'), this.rebid.bind(this));
    this.router.post('/:id/reject', this.markRejected.bind(this));
    this.router.post('/:id/restore', this.restoreBid.bind(this));
    this.router.post('/auto-reject', this.autoRejectOldBids.bind(this));
    this.router.put('/:id', this.updateBid.bind(this));
    this.router.delete('/:id', this.deleteBid.bind(this));
  }

  private async createBid(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate required fields
      const { link, company, client, role, mainStacks, jobDescription, origin, recruiter, resumeChecker, resumeId } = req.body;
      const resumeFile = req.file;

      // Either resumeFile or resumeId must be provided
      if (!link || !company || !client || !role || !mainStacks || !jobDescription || (!resumeFile && !resumeId) || !origin) {
        res.status(400).json({
          error: 'Validation Error',
          message: 'Missing required fields: link, company, client, role, mainStacks, jobDescription, resume (file or ID), origin',
        });
        return;
      }

      // Validate recruiter is provided when origin is LINKEDIN
      if (origin === 'LINKEDIN' && (!recruiter || recruiter.trim() === '')) {
        res.status(400).json({
          error: 'Validation Error',
          message: 'Recruiter name is required when origin is LINKEDIN',
        });
        return;
      }

      // Parse mainStacks if it's a string
      let parsedMainStacks = mainStacks;
      if (typeof mainStacks === 'string') {
        try {
          parsedMainStacks = JSON.parse(mainStacks);
        } catch (e) {
          res.status(400).json({
            error: 'Validation Error',
            message: 'mainStacks must be a valid JSON array',
          });
          return;
        }
      }

      if (!Array.isArray(parsedMainStacks)) {
        res.status(400).json({
          error: 'Validation Error',
          message: 'mainStacks must be an array',
        });
        return;
      }

      // Handle resume: either save uploaded file or use existing resume
      let resumePath: string;
      if (resumeFile) {
        // Save uploaded resume
        resumePath = await this.fileStorageService.saveResume(company, role, resumeFile.buffer, parsedMainStacks);
      } else if (resumeId) {
        // Use existing resume - decode the base64 ID to get the file path
        try {
          resumePath = Buffer.from(resumeId, 'base64').toString('utf-8');
          
          // Verify the resume file exists
          const fs = require('fs').promises;
          await fs.access(resumePath);
        } catch (error) {
          res.status(404).json({
            error: 'Not Found',
            message: 'Selected resume file not found',
          });
          return;
        }
      } else {
        res.status(400).json({
          error: 'Validation Error',
          message: 'Either resume file or resume ID must be provided',
        });
        return;
      }

      // Save job description
      const jdPath = await this.fileStorageService.saveJobDescription(company, role, jobDescription, parsedMainStacks);

      const result = await this.createBidUseCase.execute({
        link,
        company,
        client,
        role,
        mainStacks: parsedMainStacks,
        jobDescriptionPath: jdPath,
        resumePath: resumePath,
        origin: origin as BidOrigin,
        recruiter: origin === 'LINKEDIN' ? recruiter : undefined,
        resumeChecker: resumeChecker || undefined,
      });

      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  private async getAllBids(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { company, role, status, dateFrom, dateTo, sortBy, sortOrder, mainStacks, page, pageSize } = req.query;

      // Build filter options
      const filters: any = {};
      if (company) filters.company = company as string;
      if (role) filters.role = role as string;
      if (status) filters.status = status as string;
      if (dateFrom) filters.dateFrom = new Date(dateFrom as string);
      if (dateTo) filters.dateTo = new Date(dateTo as string);
      if (mainStacks) {
        // Parse mainStacks - can be comma-separated string or JSON array
        if (typeof mainStacks === 'string') {
          try {
            filters.mainStacks = JSON.parse(mainStacks);
          } catch {
            filters.mainStacks = mainStacks.split(',').map(s => s.trim()).filter(s => s);
          }
        } else {
          filters.mainStacks = mainStacks;
        }
      }

      // Build sort options
      let sort: any = undefined;
      if (sortBy) {
        sort = {
          field: sortBy as 'date' | 'company' | 'role' | 'bidStatus',
          order: (sortOrder as 'asc' | 'desc') || 'asc',
        };
      }

      // Check if pagination is requested
      if (page || pageSize) {
        const pagination = {
          page: page ? parseInt(page as string, 10) : 1,
          pageSize: pageSize ? parseInt(pageSize as string, 10) : 20,
        };

        const result = await this.bidRepository.findAllPaginated(filters, sort, pagination);
        
        // Serialize bids to JSON
        const serializedBids = result.items.map(bid => ({
          id: bid.id,
          date: bid.date,
          link: bid.link,
          company: bid.company,
          client: bid.client,
          role: bid.role,
          mainStacks: bid.mainStacks,
          jobDescriptionPath: bid.jobDescriptionPath,
          resumePath: bid.resumePath,
          origin: bid.origin,
          recruiter: bid.recruiter,
          status: bid.bidStatus,
          interviewWinning: bid.interviewWinning,
          bidDetail: bid.bidDetail,
          resumeChecker: bid.resumeChecker,
          originalBidId: bid.originalBidId,
          rejectionReason: bid.rejectionReason,
          hasBeenRebid: bid.hasBeenRebid
        }));
        
        res.json({
          items: serializedBids,
          total: result.total,
          page: result.page,
          pageSize: result.pageSize,
          totalPages: result.totalPages
        });
      } else {
        // No pagination - return all results
        const bids = await this.bidRepository.findAll(filters, sort);
        
        // Serialize bids to JSON to ensure proper field mapping
        const serializedBids = bids.map(bid => ({
          id: bid.id,
          date: bid.date,
          link: bid.link,
          company: bid.company,
          client: bid.client,
          role: bid.role,
          mainStacks: bid.mainStacks,
          jobDescriptionPath: bid.jobDescriptionPath,
          resumePath: bid.resumePath,
          origin: bid.origin,
          recruiter: bid.recruiter,
          status: bid.bidStatus,  // Map bidStatus to status for frontend
          interviewWinning: bid.interviewWinning,
          bidDetail: bid.bidDetail,
          resumeChecker: bid.resumeChecker,
          originalBidId: bid.originalBidId,
          rejectionReason: bid.rejectionReason,
          hasBeenRebid: bid.hasBeenRebid
        }));
        
        res.json(serializedBids);
      }
    } catch (error) {
      next(error);
    }
  }

  private async getBidById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const bid = await this.bidRepository.findById(id);

      if (!bid) {
        res.status(404).json({
          error: 'Not Found',
          message: `Bid with id ${id} not found`,
        });
        return;
      }

      // Serialize bid to JSON to ensure proper field mapping
      const serializedBid = {
        id: bid.id,
        date: bid.date,
        link: bid.link,
        company: bid.company,
        client: bid.client,
        role: bid.role,
        mainStacks: bid.mainStacks,
        jobDescriptionPath: bid.jobDescriptionPath,
        resumePath: bid.resumePath,
        origin: bid.origin,
        recruiter: bid.recruiter,
        status: bid.bidStatus,  // Map bidStatus to status for frontend
        interviewWinning: bid.interviewWinning,
        bidDetail: bid.bidDetail,
        resumeChecker: bid.resumeChecker,
        originalBidId: bid.originalBidId,
        rejectionReason: bid.rejectionReason,
        hasBeenRebid: bid.hasBeenRebid
      };

      res.json(serializedBid);
    } catch (error) {
      next(error);
    }
  }

  private async rebid(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { newJobDescription } = req.body;
      const resumeFile = req.file;

      if (!resumeFile) {
        res.status(400).json({
          error: 'Validation Error',
          message: 'Missing required field: resume file',
        });
        return;
      }

      // Get original bid to get company and role
      const originalBid = await this.bidRepository.findById(id);
      if (!originalBid) {
        res.status(404).json({
          error: 'Not Found',
          message: `Bid with id ${id} not found`,
        });
        return;
      }

      // Save new resume file
      const resumePath = await this.fileStorageService.saveResume(
        originalBid.company, 
        originalBid.role, 
        resumeFile.buffer,
        originalBid.mainStacks
      );

      // Save new JD if provided, otherwise use original
      let jdPath = originalBid.jobDescriptionPath;
      if (newJobDescription) {
        jdPath = await this.fileStorageService.saveJobDescription(
          originalBid.company, 
          originalBid.role, 
          newJobDescription,
          originalBid.mainStacks
        );
      }

      const result = await this.rebidUseCase.execute({
        originalBidId: id,
        newResumePath: resumePath,
        newJobDescriptionPath: jdPath,
      });

      if (!result.allowed) {
        res.status(400).json({
          error: 'Rebid Not Allowed',
          message: result.reason,
        });
        return;
      }

      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  private async downloadResume(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const bid = await this.bidRepository.findById(id);

      if (!bid) {
        res.status(404).json({
          error: 'Not Found',
          message: `Bid with id ${id} not found`,
        });
        return;
      }

      const resumeBuffer = await this.fileStorageService.readResume(bid.resumePath);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="Resume_${bid.company}_${bid.role}.pdf"`);
      res.send(resumeBuffer);
    } catch (error) {
      next(error);
    }
  }

  private async downloadJobDescription(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const bid = await this.bidRepository.findById(id);

      if (!bid) {
        res.status(404).json({
          error: 'Not Found',
          message: `Bid with id ${id} not found`,
        });
        return;
      }

      const jdContent = await this.fileStorageService.readJobDescription(bid.jobDescriptionPath);
      
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', `attachment; filename="JD_${bid.company}_${bid.role}.txt"`);
      res.send(jdContent);
    } catch (error) {
      next(error);
    }
  }

  private async updateBid(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const bid = await this.bidRepository.findById(id);

      if (!bid) {
        res.status(404).json({
          error: 'Not Found',
          message: `Bid with id ${id} not found`,
        });
        return;
      }

      // Update allowed fields
      const { status, resumeChecker } = req.body;
      
      if (status !== undefined) {
        (bid as any)._bidStatus = status;
      }
      
      if (resumeChecker !== undefined) {
        bid.setResumeChecker(resumeChecker || null);
      }

      await this.bidRepository.update(bid);
      res.json(bid);
    } catch (error) {
      next(error);
    }
  }

  private async markRejected(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const bid = await this.bidRepository.findById(id);

      if (!bid) {
        res.status(404).json({
          error: 'Not Found',
          message: `Bid with id ${id} not found`,
        });
        return;
      }

      if (!reason) {
        res.status(400).json({
          error: 'Validation Error',
          message: 'Rejection reason is required',
        });
        return;
      }

      bid.markAsRejected(reason);
      await this.bidRepository.update(bid);
      
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }

  private async restoreBid(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const bid = await this.bidRepository.findById(id);

      if (!bid) {
        res.status(404).json({
          error: 'Not Found',
          message: `Bid with id ${id} not found`,
        });
        return;
      }

      bid.restoreFromRejection();
      await this.bidRepository.update(bid);
      
      res.json({ success: true, message: 'Bid restored successfully' });
    } catch (error) {
      next(error);
    }
  }

  private async autoRejectOldBids(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const bids = await this.bidRepository.findAll();
      const rejectedBids: string[] = [];

      for (const bid of bids) {
        if (bid.shouldAutoReject()) {
          bid.markAsRejected(RejectionReason.AUTO_REJECTED);
          await this.bidRepository.update(bid);
          rejectedBids.push(bid.id);
        }
      }

      res.json({ 
        success: true, 
        rejectedCount: rejectedBids.length,
        rejectedBids 
      });
    } catch (error) {
      next(error);
    }
  }

  private async deleteBid(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const bid = await this.bidRepository.findById(id);

      if (!bid) {
        res.status(404).json({
          error: 'Not Found',
          message: `Bid with id ${id} not found`,
        });
        return;
      }

      await this.bidRepository.delete(id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  private async getCandidateResumes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const bid = await this.bidRepository.findById(id);

      if (!bid) {
        res.status(404).json({
          error: 'Not Found',
          message: `Bid with id ${id} not found`,
        });
        return;
      }

      // Find candidate resumes based on mainStacks
      const candidates = await this.fileStorageService.findCandidateResumes(bid.mainStacks);

      res.json({
        bidId: id,
        targetStacks: bid.mainStacks,
        candidates: candidates.map(c => ({
          folderName: c.folderName,
          resumePath: c.resumePath,
          matchingStacks: c.matchingStacks,
          matchCount: c.matchCount
        }))
      });
    } catch (error) {
      next(error);
    }
  }

  public getRouter(): Router {
    return this.router;
  }
}
