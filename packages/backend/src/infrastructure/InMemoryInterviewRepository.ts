import { IInterviewRepository, InterviewFilterOptions, InterviewSortOptions, InterviewPaginationOptions, PaginatedInterviews } from '../application/IInterviewRepository';
import { Interview } from '../domain/Interview';

export class InMemoryInterviewRepository implements IInterviewRepository {
  private interviews: Map<string, Interview> = new Map();

  async save(interview: Interview): Promise<void> {
    this.interviews.set(interview.id, interview);
  }

  async findById(id: string): Promise<Interview | null> {
    return this.interviews.get(id) || null;
  }

  async findAll(filters?: InterviewFilterOptions, sort?: InterviewSortOptions): Promise<Interview[]> {
    let results = Array.from(this.interviews.values());

    // Apply filters
    if (filters) {
      if (filters.company) {
        results = results.filter(interview => 
          interview.company.toLowerCase().includes(filters.company!.toLowerCase())
        );
      }
      if (filters.role) {
        results = results.filter(interview => 
          interview.role.toLowerCase().includes(filters.role!.toLowerCase())
        );
      }
      if (filters.status) {
        results = results.filter(interview => interview.status === filters.status);
      }
      if (filters.recruiter) {
        results = results.filter(interview => 
          interview.recruiter.toLowerCase().includes(filters.recruiter!.toLowerCase())
        );
      }
      if (filters.interviewType) {
        results = results.filter(interview => interview.interviewType === filters.interviewType);
      }
      if (filters.attendees) {
        results = results.filter(interview => 
          interview.attendees.some(attendee => 
            attendee.toLowerCase().includes(filters.attendees!.toLowerCase())
          )
        );
      }
      if (filters.dateFrom) {
        results = results.filter(interview => interview.date >= filters.dateFrom!);
      }
      if (filters.dateTo) {
        results = results.filter(interview => interview.date <= filters.dateTo!);
      }
    }

    // Apply sorting
    if (sort) {
      results.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        switch (sort.field) {
          case 'date':
            aValue = a.date.getTime();
            bValue = b.date.getTime();
            break;
          case 'company':
            aValue = a.company.toLowerCase();
            bValue = b.company.toLowerCase();
            break;
          case 'role':
            aValue = a.role.toLowerCase();
            bValue = b.role.toLowerCase();
            break;
          case 'status':
            aValue = a.status;
            bValue = b.status;
            break;
          default:
            return 0;
        }

        if (aValue < bValue) return sort.order === 'asc' ? -1 : 1;
        if (aValue > bValue) return sort.order === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return results;
  }

  async findByCompanyAndRole(company: string, role: string): Promise<Interview[]> {
    return Array.from(this.interviews.values()).filter(
      (interview) =>
        interview.company.toLowerCase() === company.toLowerCase() &&
        interview.role.toLowerCase() === role.toLowerCase()
    );
  }

  async findByBidId(bidId: string): Promise<Interview[]> {
    return Array.from(this.interviews.values()).filter(
      (interview) => interview.bidId === bidId
    );
  }

  async update(interview: Interview): Promise<void> {
    if (!this.interviews.has(interview.id)) {
      throw new Error(`Interview with id ${interview.id} not found`);
    }
    this.interviews.set(interview.id, interview);
  }

  async delete(id: string): Promise<void> {
    if (!this.interviews.has(id)) {
      throw new Error(`Interview with id ${id} not found`);
    }
    this.interviews.delete(id);
  }

  async findAllPaginated(filters?: InterviewFilterOptions, sort?: InterviewSortOptions, pagination?: InterviewPaginationOptions): Promise<PaginatedInterviews> {
    // Get all filtered and sorted results
    const allResults = await this.findAll(filters, sort);
    
    // Apply pagination
    const page = pagination?.page || 1;
    const pageSize = pagination?.pageSize || 20;
    const skip = (page - 1) * pageSize;
    const items = allResults.slice(skip, skip + pageSize);
    
    return {
      items,
      total: allResults.length,
      page,
      pageSize,
      totalPages: Math.ceil(allResults.length / pageSize)
    };
  }

  // Helper method for testing
  clear(): void {
    this.interviews.clear();
  }
}
