export interface Listing {
  id: number;
  title: string;
  description: string;
  price: number;
  location: string;
  area?: string;
  images: string[];
  views: number;
  is_active: boolean;
  is_featured?: boolean;
  is_favorited?: boolean;
  promoted_until?: string | null;
  created_at: string;
  user_id: number;
  category_id: number;
}

export interface Category {
  id: number;
  slug: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

export interface User {
  id: number;
  email: string;
  username: string;
  phone?: string;
  city?: string;
  is_admin: boolean;
  created_at: string;
}

export interface City {
  id: number;
  name: string;
}

export interface Message {
  id: number;
  content: string;
  sender_id: number;
  receiver_id: number;
  listing_id?: number;
  is_read: boolean;
  created_at: string;
}

export interface PaginatedListings {
  listings: Listing[];
  has_next: boolean;
  page: number;
  total: number;
  total_pages: number;
  page_size: number;
}
