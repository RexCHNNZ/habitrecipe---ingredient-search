export interface Recipe {
  id: number;
  name: string;
  ingredients: string[];
  cookTime: number;
  instructions: string[];
  tags: string[];
  image: string;
  matchCount?: number;
  totalCount?: number;
  matched?: string[];
  missing?: string[];
  score?: number;
}
