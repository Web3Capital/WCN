/**
 * @wcn/search — Port Definitions
 */

export interface SearchResult {
  type: string;
  id: string;
  label: string;
  href: string;
  badge?: string;
  score?: number;
  createdAt?: string;
}

export interface FacetCount {
  value: string;
  count: number;
}

export interface SearchFacets {
  type?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface SearchPort {
  searchNodes(query: string, dateFilter: { gte?: Date; lte?: Date }, take: number): Promise<Array<{ id: string; name: string; type: string; status: string; createdAt: Date }>>;
  searchProjects(query: string, dateFilter: { gte?: Date; lte?: Date }, take: number): Promise<Array<{ id: string; name: string; status: string; createdAt: Date }>>;
  searchDeals(query: string, dateFilter: { gte?: Date; lte?: Date }, take: number): Promise<Array<{ id: string; title: string; stage: string; createdAt: Date }>>;
  searchTasks(query: string, dateFilter: { gte?: Date; lte?: Date }, take: number): Promise<Array<{ id: string; title: string; status: string; createdAt: Date }>>;
  searchCapital(query: string, dateFilter: { gte?: Date; lte?: Date }, take: number): Promise<Array<{ id: string; name: string; status: string; createdAt: Date }>>;
}
