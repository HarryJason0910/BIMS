import { IBidRepository, BidFilterOptions, BidSortOptions } from '../application/IBidRepository';
import { Bid } from '../domain/Bid';

export class InMemoryBidRepository implements IBidRepository {
  private bids: Map<string, Bid> = new Map();

  async save(bid: Bid): Promise<void> {
    this.bids.set(bid.id, bid);
  }

  async findById(id: string): Promise<Bid | null> {
    return this.bids.get(id) || null;
  }

  async findAll(filters?: BidFilterOptions, sort?: BidSortOptions): Promise<Bid[]> {
    let results = Array.from(this.bids.values());

    // Apply filters
    if (filters) {
      if (filters.company) {
        results = results.filter(bid => 
          bid.company.toLowerCase().includes(filters.company!.toLowerCase())
        );
      }
      if (filters.role) {
        results = results.filter(bid => 
          bid.role.toLowerCase().includes(filters.role!.toLowerCase())
        );
      }
      if (filters.status) {
        results = results.filter(bid => bid.bidStatus === filters.status);
      }
      if (filters.dateFrom) {
        results = results.filter(bid => bid.date >= filters.dateFrom!);
      }
      if (filters.dateTo) {
        results = results.filter(bid => bid.date <= filters.dateTo!);
      }
      if (filters.mainStacks && filters.mainStacks.length > 0) {
        // Filter: bid must include ALL specified stacks
        results = results.filter(bid => 
          filters.mainStacks!.every(stack => 
            bid.mainStacks.some(bidStack => 
              bidStack.toLowerCase() === stack.toLowerCase()
            )
          )
        );
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
          case 'bidStatus':
            aValue = a.bidStatus;
            bValue = b.bidStatus;
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

  async findByCompanyAndRole(company: string, role: string): Promise<Bid[]> {
    return Array.from(this.bids.values()).filter(
      (bid) =>
        bid.company.toLowerCase() === company.toLowerCase() &&
        bid.role.toLowerCase() === role.toLowerCase()
    );
  }

  async findByLink(link: string): Promise<Bid | null> {
    return Array.from(this.bids.values()).find((bid) => bid.link === link) || null;
  }

  async update(bid: Bid): Promise<void> {
    if (!this.bids.has(bid.id)) {
      throw new Error(`Bid with id ${bid.id} not found`);
    }
    this.bids.set(bid.id, bid);
  }

  async delete(id: string): Promise<void> {
    if (!this.bids.has(id)) {
      throw new Error(`Bid with id ${id} not found`);
    }
    this.bids.delete(id);
  }

  // Helper method for testing
  clear(): void {
    this.bids.clear();
  }
}
