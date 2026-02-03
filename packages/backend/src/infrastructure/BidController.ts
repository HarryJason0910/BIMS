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
      const { link, company, client, role, mainStacks, layerWeights, jobDescription, origin, recruiter, resumeChecker, resumeId, jdSpecId } = req.body;
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

      // Parse mainStacks if it's a string (supports both legacy array and new object format)
      let parsedMainStacks = mainStacks;
      if (typeof mainStacks === 'string') {
        try {
          parsedMainStacks = JSON.parse(mainStacks);
        } catch (e) {
          res.status(400).json({
            error: 'Validation Error',
            message: 'mainStacks must be a valid JSON (array or object with layer keys)',
          });
          return;
        }
      }

      // Validate mainStacks format
      if (Array.isArray(parsedMainStacks)) {
        // Legacy format: string[]
        if (parsedMainStacks.length === 0) {
          res.status(400).json({
            error: 'Validation Error',
            message: 'mainStacks array cannot be empty',
          });
          return;
        }
      } else if (typeof parsedMainStacks === 'object' && parsedMainStacks !== null) {
        // New format: LayerSkills - validate structure
        const requiredLayers = ['frontend', 'backend', 'database', 'cloud', 'devops', 'others'];
        for (const layer of requiredLayers) {
          if (!(layer in parsedMainStacks)) {
            res.status(400).json({
              error: 'Validation Error',
              message: `mainStacks object must have '${layer}' key`,
            });
            return;
          }
          if (!Array.isArray(parsedMainStacks[layer])) {
            res.status(400).json({
              error: 'Validation Error',
              message: `mainStacks['${layer}'] must be an array`,
            });
            return;
          }
          // Validate each skill has required properties
          for (const skill of parsedMainStacks[layer]) {
            if (typeof skill.skill !== 'string' || skill.skill.trim() === '') {
              res.status(400).json({
                error: 'Validation Error',
                message: `Each skill in layer '${layer}' must have a non-empty 'skill' property`,
              });
              return;
            }
            if (typeof skill.weight !== 'number' || skill.weight < 0 || skill.weight > 1) {
              res.status(400).json({
                error: 'Validation Error',
                message: `Each skill in layer '${layer}' must have a 'weight' between 0 and 1`,
              });
              return;
            }
          }
          // Validate weights sum to 1.0 (or layer is empty)
          if (parsedMainStacks[layer].length > 0) {
            const sum = parsedMainStacks[layer].reduce((acc: number, skill: any) => acc + skill.weight, 0);
            if (Math.abs(sum - 1.0) > 0.001) {
              res.status(400).json({
                error: 'Validation Error',
                message: `Skill weights in layer '${layer}' must sum to 1.0 (±0.001 tolerance), got ${sum}`,
              });
              return;
            }
          }
        }
      } else {
        res.status(400).json({
          error: 'Validation Error',
          message: 'mainStacks must be an array or object with layer keys',
        });
        return;
      }

      // Parse and validate layerWeights if provided
      let parsedLayerWeights = undefined;
      if (layerWeights) {
        if (typeof layerWeights === 'string') {
          try {
            parsedLayerWeights = JSON.parse(layerWeights);
          } catch (e) {
            res.status(400).json({
              error: 'Validation Error',
              message: 'layerWeights must be a valid JSON object',
            });
            return;
          }
        } else {
          parsedLayerWeights = layerWeights;
        }

        // Validate layerWeights sum to 1.0
        const sum = parsedLayerWeights.frontend + parsedLayerWeights.backend + 
                    parsedLayerWeights.database + parsedLayerWeights.cloud + 
                    parsedLayerWeights.devops + parsedLayerWeights.others;
        if (Math.abs(sum - 1.0) > 0.001) {
          res.status(400).json({
            error: 'Validation Error',
            message: `Layer weights must sum to 1.0 (±0.001 tolerance), got ${sum}`,
          });
          return;
        }
      }

      // Generate bid ID first (same logic as Bid.create)
      const bidId = `bid-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

      // Handle resume: either save uploaded file or use existing resume
      let resumePath: string;
      if (resumeFile) {
        // Save uploaded resume using bid ID as folder name
        resumePath = await this.fileStorageService.saveResume(bidId, resumeFile.buffer);
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

      // Save job description using bid ID as folder name
      const jdPath = await this.fileStorageService.saveJobDescription(bidId, jobDescription);

      const result = await this.createBidUseCase.execute({
        id: bidId, // Pass the pre-generated ID
        link,
        company,
        client,
        role,
        mainStacks: parsedMainStacks,
        layerWeights: parsedLayerWeights, // Pass layer weights (optional)
        jobDescriptionPath: jdPath,
        resumePath: resumePath,
        origin: origin as BidOrigin,
        recruiter: origin === 'LINKEDIN' ? recruiter : undefined,
        resumeChecker: resumeChecker || undefined,
        jdSpecId: jdSpecId || undefined, // Pass JD spec ID for enhanced skill matching
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
          jdSpecId: bid.jdSpecId,
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
          jdSpecId: bid.jdSpecId,
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
        jdSpecId: bid.jdSpecId,
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

      // Get original bid
      const originalBid = await this.bidRepository.findById(id);
      if (!originalBid) {
        res.status(404).json({
          error: 'Not Found',
          message: `Bid with id ${id} not found`,
        });
        return;
      }

      // Generate new bid ID for the rebid
      const newBidId = `bid-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

      // Save new resume file using new bid ID
      const resumePath = await this.fileStorageService.saveResume(newBidId, resumeFile.buffer);

      // Save new JD if provided, otherwise use original
      let jdPath = originalBid.jobDescriptionPath;
      if (newJobDescription) {
        jdPath = await this.fileStorageService.saveJobDescription(newBidId, newJobDescription);
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

  private async autoRejectOldBids(_req: Request, res: Response, next: NextFunction): Promise<void> {
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

  public getRouter(): Router {
    return this.router;
  }
}
