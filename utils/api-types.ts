export interface ProductImage {
  id?: string;
  by_name?: string;
  file_name?: string;
  title?: string;
  original_file_name?: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category_id?: string;
  brand_id?: string;
  category?: {
    id: string;
    name: string;
    slug?: string;
  };
  brand?: {
    id: string;
    name: string;
  };
  product_image: ProductImage[] | ProductImage;
}

export interface Category {
  id: string;
  name: string;
  slug?: string;
  parent_id?: string | null;
}

export interface PaginationMeta {
  current_page: number;
  from: number;
  last_page: number;
  path: string;
  per_page: number;
  to: number;
  total: number;
}

export interface PaginationLinks {
  first: string | null;
  last: string | null;
  prev: string | null;
  next: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
  links: PaginationLinks;
}

export interface AuthRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const ULID_PATTERN = /^[0-9A-HJKMNP-TV-Z]{26}$/;

export const NIL_UUID = '00000000-0000-0000-0000-000000000000';
