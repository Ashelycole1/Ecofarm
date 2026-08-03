import { Farm, EcoMarket } from './db';

export const CROP_CATEGORY_LABELS: Record<string, string> = {
  leafy:  'Leafy / Vegetables',
  grain:  'Grains',
  root:   'Root Crops',
  cash:   'Cash Crops',
  legume: 'Legumes',
  fruit:  'Fruits',
};

export const CROP_CATEGORY_COLORS: Record<string, string> = {
  leafy:  '#22C55E',
  grain:  '#F5E6BE',
  root:   '#FF9800',
  cash:   '#78350F',
  legume: '#84CC16',
  fruit:  '#FACC15',
};

// Mock GIS Farms (Central Uganda – real coords)
export const mockFarmsGIS: Farm[] = [
  { 
    id: 'f1', 
    farmerId: 'farmer-001',
    name: 'Nansana Maize Hub', 
    lat: 0.3667, 
    lng: 32.5255, 
    cropType: 'Maize', 
    cropCategory: 'grain',
    plotSizeHa: 4.5,
    is_certified_organic: true,
    trust_tier: 'high',
    sustainability_score: 92,
    last_audit: '2024-05-10',
    audited_by: 'EcoCert'
  },
  { 
    id: 'f2', 
    farmerId: 'farmer-002',
    name: 'Zzana Coffee Plantation', 
    lat: 0.2642, 
    lng: 32.5590, 
    cropType: 'Coffee', 
    cropCategory: 'cash',
    plotSizeHa: 12.0,
    is_certified_organic: false,
    trust_tier: 'verified',
    sustainability_score: 78,
    last_audit: '2024-05-12',
    audited_by: 'UCDA'
  },
  { 
    id: 'f3', 
    farmerId: 'farmer-003',
    name: 'Kiteezi Organic Vanilla', 
    lat: 0.4022, 
    lng: 32.5855, 
    cropType: 'Vanilla', 
    cropCategory: 'cash',
    plotSizeHa: 2.5,
    is_certified_organic: true,
    trust_tier: 'verified',
    sustainability_score: 85,
    last_audit: '2024-05-08',
    audited_by: 'EcoCert'
  },
  { 
    id: 'f4', 
    farmerId: 'farmer-004',
    name: 'Gayaza Matooke Estate', 
    lat: 0.4500, 
    lng: 32.6100, 
    cropType: 'Matooke', 
    cropCategory: 'fruit',
    plotSizeHa: 8.2,
    is_certified_organic: true,
    trust_tier: 'high',
    sustainability_score: 96,
    last_audit: '2024-05-11',
    audited_by: 'Local Coop'
  },
  { 
    id: 'f5', 
    farmerId: 'farmer-005',
    name: 'Njeru Hybrid Maize', 
    lat: 0.4283, 
    lng: 33.1550, 
    cropType: 'Maize', 
    cropCategory: 'grain',
    plotSizeHa: 25.0,
    is_certified_organic: false,
    trust_tier: 'pending',
    sustainability_score: 64,
    last_audit: '2024-05-09',
    audited_by: 'Self-Report'
  },
  { 
    id: 'f6', 
    farmerId: 'farmer-006',
    name: 'Mukono Coffee Cooperative', 
    lat: 0.3533, 
    lng: 32.7553, 
    cropType: 'Coffee', 
    cropCategory: 'cash',
    plotSizeHa: 45.0,
    is_certified_organic: true,
    trust_tier: 'high',
    sustainability_score: 89,
    last_audit: '2024-05-13',
    audited_by: 'UCDA'
  },
  { 
    id: 'f7', 
    farmerId: 'farmer-007',
    name: 'Wobulenzi Bean Cluster', 
    lat: 0.7200, 
    lng: 32.5300, 
    cropType: 'Beans', 
    cropCategory: 'legume',
    plotSizeHa: 1.5,
    is_certified_organic: false,
    trust_tier: 'unverified',
    sustainability_score: 74,
    last_audit: '2024-05-07',
    audited_by: 'None'
  },
  { 
    id: 'f8', 
    farmerId: 'farmer-008',
    name: 'Luwero Matooke Collective', 
    lat: 0.8400, 
    lng: 32.4900, 
    cropType: 'Matooke', 
    cropCategory: 'fruit',
    plotSizeHa: 15.5,
    is_certified_organic: true,
    trust_tier: 'high',
    sustainability_score: 91,
    last_audit: '2024-05-11',
    audited_by: 'MAAIF'
  },
];

export const mockEcoMarkets: EcoMarket[] = [
  {
    id: 'm1',
    name: 'Nakasero Eco-Hub',
    lat: 0.3142,
    lng: 32.5822,
    type: 'eco_buyer',
    accepts_organic: true,
    description: 'Specializing in Organic Matooke and Grain Export'
  },
  {
    id: 'm2',
    name: 'Kalerwe Wholesale',
    lat: 0.3450,
    lng: 32.5780,
    type: 'market',
    accepts_organic: false,
    description: 'Wholesale Maize and Legumes'
  },
  {
    id: 'm3',
    name: 'EcoFarm Cooperative — Ntinda',
    lat: 0.3540,
    lng: 32.6110,
    type: 'cooperative',
    accepts_organic: true,
    description: 'Specializing in Vanilla and Coffee'
  },
  {
    id: 'm4',
    name: 'Green Basket — Bukoto',
    lat: 0.3470,
    lng: 32.5980,
    type: 'eco_buyer',
    accepts_organic: true,
    description: 'Fresh Fruits and Vegetables'
  }
];

// Mock Market Prices (UGX per kg) - Updated to match db.ts interface
export const mockMarketPrices = [
  { cropId: 'maize-white', cropName: 'White Maize', pricePerKg: 1200, marketName: 'Kalerwe', change: '+5%', status: 'rising' },
  { cropId: 'beans-nambale', cropName: 'Nambale Beans', pricePerKg: 3500, marketName: 'Nakasero', change: '-2%', status: 'falling' },
  { cropId: 'coffee-arabica', cropName: 'Arabica Coffee', pricePerKg: 7800, marketName: 'Ntinda Coop', change: '+12%', status: 'rising' },
  { cropId: 'matooke-green', cropName: 'Green Matooke', pricePerKg: 15000, marketName: 'Gayaza', change: '0%', status: 'stable' },
  { cropId: 'vanilla-bean', cropName: 'Vanilla Bean', pricePerKg: 45000, marketName: 'Kiteezi', change: '+1%', status: 'rising' },
];

export type { Farm, EcoMarket };
