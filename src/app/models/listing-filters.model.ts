export interface ListingFilters {
  q?: string;
  city?: string;
  category?: string;
  sort?: 'newest' | 'price_asc' | 'price_desc';
  price_min?: number;
  price_max?: number;
  has_image?: boolean;
  posted_within?: number;
}

export interface PriceBucket {
  min: number;
  max: number;
  count: number;
}

export interface ListingFacets {
  total: number;
  price_min: number;
  price_max: number;
  price_avg: number;
  price_buckets: PriceBucket[];
}

export const POSTED_WITHIN_OPTIONS = [
  { value: 1, label: 'Today' },
  { value: 3, label: 'Last 3 days' },
  { value: 7, label: 'Last week' },
  { value: 30, label: 'Last month' }
];

export const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' }
];
