/**
 * Pharmacy chain code mapping and branding
 * Ported from Angular PharmacyLogoService registry
 */

import type { ImageSourcePropType } from 'react-native';

export const CHAIN_CODE_MAP: Record<string, string> = {
  '039': 'cvs',
  '207': 'cvs',
  '181': 'riteaid',
  '226': 'walgreens',
  '014': 'walmart',
  '043': 'kroger',
  '113': 'kroger',
  '010': 'costco',
  '023': 'target',
  '025': 'publix',
  '011': 'samsclub',
  '016': 'albertsons',
  '018': 'safeway',
  '158': 'safeway',
  '945': 'genoa',
  '603': 'independent',
};

export interface PharmacyBrand {
  name: string;
  shortName: string;
  color: string;
  initial: string;
  logoFile: string | null;
}

export const PHARMACY_BRANDS: Record<string, PharmacyBrand> = {
  cvs: { name: 'CVS Pharmacy', shortName: 'CVS', color: '#CC0000', initial: 'C', logoFile: 'cvs.png' },
  walgreens: { name: 'Walgreens', shortName: 'Walgreens', color: '#E31837', initial: 'W', logoFile: 'walgreens.png' },
  walmart: { name: 'Walmart Pharmacy', shortName: 'Walmart', color: '#0071CE', initial: 'W', logoFile: 'walmart.png' },
  kroger: { name: 'Kroger Pharmacy', shortName: 'Kroger', color: '#E31837', initial: 'K', logoFile: 'kroger.png' },
  riteaid: { name: 'Rite Aid', shortName: 'Rite Aid', color: '#1E3A8A', initial: 'R', logoFile: 'riteaid.png' },
  costco: { name: 'Costco Pharmacy', shortName: 'Costco', color: '#E31837', initial: 'C', logoFile: 'costco.png' },
  target: { name: 'Target Pharmacy', shortName: 'Target', color: '#CC0000', initial: 'T', logoFile: 'target.png' },
  publix: { name: 'Publix Pharmacy', shortName: 'Publix', color: '#3B7D23', initial: 'P', logoFile: 'publix.png' },
  samsclub: { name: "Sam's Club Pharmacy", shortName: "Sam's Club", color: '#0060A9', initial: 'S', logoFile: 'samsclub.png' },
  albertsons: { name: 'Albertsons Pharmacy', shortName: 'Albertsons', color: '#0072CE', initial: 'A', logoFile: 'albertsons.png' },
  safeway: { name: 'Safeway Pharmacy', shortName: 'Safeway', color: '#E8372B', initial: 'S', logoFile: 'safeway.png' },
  heb: { name: 'H-E-B Pharmacy', shortName: 'H-E-B', color: '#E31837', initial: 'H', logoFile: 'heb.png' },
  meijer: { name: 'Meijer Pharmacy', shortName: 'Meijer', color: '#E31837', initial: 'M', logoFile: 'meijer.png' },
  wegmans: { name: 'Wegmans Pharmacy', shortName: 'Wegmans', color: '#00684B', initial: 'W', logoFile: 'wegmans.png' },
  giant: { name: 'Giant Pharmacy', shortName: 'Giant', color: '#F7941D', initial: 'G', logoFile: 'giant.png' },
  stopandshop: { name: 'Stop & Shop Pharmacy', shortName: 'Stop & Shop', color: '#E31837', initial: 'S', logoFile: 'stopandshop.png' },
  hyvee: { name: 'Hy-Vee Pharmacy', shortName: 'Hy-Vee', color: '#E31837', initial: 'H', logoFile: 'hyvee.png' },
  genoa: { name: 'Genoa Healthcare', shortName: 'Genoa', color: '#00529B', initial: 'G', logoFile: 'genoa.png' },
  independent: { name: 'Independent Pharmacy', shortName: 'Pharmacy', color: '#6B7280', initial: 'Rx', logoFile: null },
};

/**
 * Bundled pharmacy logo images.
 * Keys are the uppercase file basenames in src/assets/images/pharmacy/.
 * React Native requires static require() calls — paths cannot be built dynamically.
 */
export const PHARMACY_LOGOS: Record<string, ImageSourcePropType> = {
  ALBERTSONS: require('@/assets/images/pharmacy/ALBERTSONS.png'),
  COSTCO: require('@/assets/images/pharmacy/COSTCO.png'),
  CVS: require('@/assets/images/pharmacy/CVS.png'),
  GENOA: require('@/assets/images/pharmacy/GENOA.png'),
  HEB: require('@/assets/images/pharmacy/HEB.png'),
  HYVEE: require('@/assets/images/pharmacy/HYVEE.png'),
  KROGER: require('@/assets/images/pharmacy/KROGER.png'),
  PATIENT: require('@/assets/images/pharmacy/PATIENT.png'),
  PAVILIONS: require('@/assets/images/pharmacy/PAVILIONS.png'),
  PUBLIX: require('@/assets/images/pharmacy/PUBLIX.png'),
  SAFEWAY: require('@/assets/images/pharmacy/SAFEWAY.png'),
  SAVON: require('@/assets/images/pharmacy/SAVON.png'),
  SENTARA: require('@/assets/images/pharmacy/SENTARA.png'),
  TARGET: require('@/assets/images/pharmacy/TARGET.png'),
  VIRGINIA: require('@/assets/images/pharmacy/VIRGINIA.png'),
  WALGREENS: require('@/assets/images/pharmacy/WALGREENS.png'),
  WALMART: require('@/assets/images/pharmacy/WALMART.png'),
};

/** Chain key (from CHAIN_CODE_MAP) → logo basename in PHARMACY_LOGOS */
const CHAIN_LOGO_MAP: Record<string, string> = {
  cvs: 'CVS',
  walgreens: 'WALGREENS',
  walmart: 'WALMART',
  kroger: 'KROGER',
  costco: 'COSTCO',
  target: 'TARGET',
  publix: 'PUBLIX',
  albertsons: 'ALBERTSONS',
  safeway: 'SAFEWAY',
  heb: 'HEB',
  hyvee: 'HYVEE',
  genoa: 'GENOA',
};

/**
 * Pharmacy-name keyword → logo basename.
 * Covers pharmacies the backend chain code does not (Sentara, Virginia, Pavilions,
 * Sav-On, Patient), and acts as a fallback when no chain code is supplied.
 * Order matters: more specific patterns first.
 */
const NAME_LOGO_PATTERNS: Array<[RegExp, string]> = [
  [/sentara/i, 'SENTARA'],
  [/genoa/i, 'GENOA'],
  [/walgreen/i, 'WALGREENS'],
  [/wal-?mart/i, 'WALMART'],
  [/\bcvs\b/i, 'CVS'],
  [/kroger/i, 'KROGER'],
  [/costco/i, 'COSTCO'],
  [/target/i, 'TARGET'],
  [/publix/i, 'PUBLIX'],
  [/albertson/i, 'ALBERTSONS'],
  [/safeway/i, 'SAFEWAY'],
  [/\bh-?e-?b\b/i, 'HEB'],
  [/hy-?vee/i, 'HYVEE'],
  [/pavilion/i, 'PAVILIONS'],
  [/sav-?on/i, 'SAVON'],
  [/virginia/i, 'VIRGINIA'],
  [/patient/i, 'PATIENT'],
];

/**
 * Resolve a bundled logo image for a pharmacy.
 * Prefers the mapped chain key, then falls back to matching the pharmacy name.
 * Returns null when no logo matches (caller should show the initial-circle fallback).
 */
export function getPharmacyLogo(chain?: string, name?: string): ImageSourcePropType | null {
  if (chain && CHAIN_LOGO_MAP[chain]) {
    return PHARMACY_LOGOS[CHAIN_LOGO_MAP[chain]];
  }
  if (name) {
    for (const [pattern, key] of NAME_LOGO_PATTERNS) {
      if (pattern.test(name)) return PHARMACY_LOGOS[key];
    }
  }
  return null;
}

/**
 * Build a 1-2 character avatar label from a pharmacy name, used when no logo matches.
 * Prefers the initials of the first two words ("Sam's Club" → "SC"); falls back to the
 * first two letters of a single word ("Walgreens" → "WA").
 */
export function getPharmacyInitials(name?: string): string {
  if (!name) return 'Rx';
  const words = name.replace(/[^a-zA-Z ]/g, '').trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return 'Rx';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

/** Default coupon values */
export const COUPON_DEFAULTS = {
  BIN: '024730',
  PCN: 'GBHRX',
  GROUP_ID: 'CRA12',
  MEMBER_ID: 'GBH22',
} as const;

/** Default location (Hampton, VA) */
export const DEFAULT_LOCATION = {
  latitude: 37.0299,
  longitude: -76.3452,
  city: 'Hampton',
  stateCode: 'VA',
  zipCode: '23666',
} as const;
