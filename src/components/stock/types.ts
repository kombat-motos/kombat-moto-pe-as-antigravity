export interface Product {
  id: number;
  description: string;
  sku: string;
  barcode: string;
  purchase_price: number;
  sale_price: number;
  sale_price_credit?: number;
  sale_price_wholesale?: number;
  stock: number;
  unit: string;
  category?: string;
  brand?: string;
  location?: string;
  image_url?: string;
  image_url2?: string;
  image_url3?: string;
  image_url4?: string;
  application?: string;
  distributor?: string;
  alt_code?: string;
}

export type QuickFilterType = 
  | 'ALL'
  | 'IN_STOCK'
  | 'LOW_STOCK'
  | 'OUT_OF_STOCK'
  | 'NO_IMAGE'
  | 'NO_EAN'
  | 'NO_LOCATION';

export type SortField = 'description' | 'sku' | 'brand' | 'stock' | 'sale_price' | 'location';
export type SortDirection = 'asc' | 'desc';
