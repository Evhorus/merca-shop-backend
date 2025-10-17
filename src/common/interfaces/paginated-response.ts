export interface PaginatedResponse<T> {
  count: number;
  pages: number;
  data: T[];
}
