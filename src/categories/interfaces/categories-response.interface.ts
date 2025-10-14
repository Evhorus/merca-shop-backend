import { CategoryResponse } from './category-response.interface';

export interface CategoriesResponse {
  count: number;
  pages: number;
  categories: CategoryResponse[];
}
