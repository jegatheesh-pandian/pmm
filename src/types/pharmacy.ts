/**
 * Pharmacy types - ported from Angular pharmacy.model.ts
 */

export type PharmacyChain =
  | 'cvs' | 'walgreens' | 'walmart' | 'kroger' | 'riteaid' | 'costco'
  | 'target' | 'publix' | 'samsclub' | 'albertsons' | 'safeway' | 'heb'
  | 'meijer' | 'wegmans' | 'giant' | 'stopandshop' | 'hyvee'
  | 'genoa' | 'independent';

export type PharmacyPriceSortOption =
  | 'price-asc' | 'price-desc' | 'distance-asc' | 'savings-desc' | 'name-asc';

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  latitude?: number;
  longitude?: number;
}

export interface PharmacyHours {
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  open: string;
  close: string;
  isClosed: boolean;
}

export interface Pharmacy {
  id: string;
  name: string;
  chain: PharmacyChain;
  storeNumber?: string;
  address: Address;
  phone: string;
  hours: PharmacyHours[];
  is24Hours: boolean;
  hasDriveThrough: boolean;
  hasHomeDelivery: boolean;
  hasOnlinePayment: boolean;
  rating?: number;
  reviewCount?: number;
  logoUrl?: string;
}

export interface PharmacyWithDistance extends Pharmacy {
  distance: number;
  driveTimeMinutes?: number;
}

export interface PharmacyPrice {
  pharmacy: PharmacyWithDistance;
  retailPrice: number;
  discountPrice: number;
  savingsAmount: number;
  savingsPercent: number;
  isLowestPrice: boolean;
  bin: string;
  pcn: string;
  group: string;
  memberId: string;
  apiSource?: string;
}

export interface PharmacyPriceFilters {
  maxDistance?: number;
  chains?: PharmacyChain[];
  features?: {
    is24Hours?: boolean;
    hasDriveThrough?: boolean;
    hasHomeDelivery?: boolean;
  };
}
