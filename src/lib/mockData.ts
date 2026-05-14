// mockData.ts — simulates real weather & farm data until Firebase is connected

export type WeatherStatus = 'sunny' | 'cloudy' | 'rainy' | 'stormy' | 'drought'
export type CropStatus = 'optimal' | 'good' | 'caution' | 'avoid'
export type PestSeverity = 'low' | 'medium' | 'high'

export interface WeatherData {
  location: string
  region: string
  temperature: number        // °C
  feelsLike: number
  rainfall: number           // mm this week
  humidity: number           // %
  windSpeed: number          // km/h
  uvIndex: number
  status: WeatherStatus
  forecast: ForecastDay[]
  lastUpdated: string
}

export interface ForecastDay {
  day: string
  high: number
  low: number
  rainfall: number
  status: WeatherStatus
}

export interface Crop {
  id: string
  name: string
  localName: string
  emoji: string
  plantingMonths: number[]   // 1-12
  harvestWeeks: number
  waterNeed: 'low' | 'medium' | 'high'
  status: CropStatus
  tip: string
  region: string[]
}

export interface PestAlert {
  id: string
  pestName: string
  emoji: string
  affectedCrops: string[]
  severity: PestSeverity
  description: string
  action: string
  reportCount: number
  lastReported: string
  reporterName?: string
}

export interface FarmStatus {
  overall: 'green' | 'yellow' | 'red'
  message: string
  aiAdvice?: string          // AI-generated advice
  treeHealth: number         // 0-100
  alerts: number
  waterLevel: number        // 0-100
  soilHealth: number        // 0-100
}

export interface ChatMessage {
  id: string
  text: string
  sender: 'user' | 'elder'
  timestamp: string
  metadata?: {
    dialect?: string
    emotion?: string
    icon?: string
    brief?: string
  }
}

// ─── Mock AI Advice (Stoic Agronomist style) ───────────────────────────────────

export const mockAIAdvice = [
  "Water the roots, not the leaves. Control what you can, accept the rain.",
  "Nature does not hurry, yet everything is accomplished. Planting today is wisdom.",
  "Pests are a test of patience. Remove them with focus, as you would a distraction from your purpose.",
  "The sun shines on all. Your work is to ensure your soil is ready to receive it.",
  "An abundant harvest is the reward of discipline, not just good weather.",
]

// ─── Mock Village Elder Chat ──────────────────────────────────────────────────

export const mockChatHistory: ChatMessage[] = [
  { id: '1', sender: 'elder', text: "Welcome, my child. How are your crops today?", timestamp: '10:00 AM' },
  { id: '2', sender: 'user', text: "Hello Elder. The Matooke leaves are looking a bit yellow.", timestamp: '10:05 AM' },
  { id: '3', sender: 'elder', text: "Yellow leaves speak of hunger in the soil or thirst in the roots. Have you checked the moisture near the base?", timestamp: '10:06 AM' },
]

// ─── Mock Weather ────────────────────────────────────────────────────────────

export const mockWeather: WeatherData = {
  location: 'Kampala',
  region: 'Central Uganda',
  temperature: 24,
  feelsLike: 26,
  rainfall: 38,
  humidity: 72,
  windSpeed: 14,
  uvIndex: 7,
  status: 'cloudy',
  lastUpdated: new Date().toISOString(),
  forecast: [
    { day: 'Today',  high: 26, low: 17, rainfall: 8,  status: 'cloudy' },
    { day: 'Tue',   high: 28, low: 18, rainfall: 2,  status: 'sunny' },
    { day: 'Wed',   high: 22, low: 15, rainfall: 18, status: 'rainy' },
    { day: 'Thu',   high: 20, low: 14, rainfall: 25, status: 'rainy' },
    { day: 'Fri',   high: 25, low: 16, rainfall: 5,  status: 'cloudy' },
  ],
}

// ─── Mock Crops ──────────────────────────────────────────────────────────────

export const mockCrops: Crop[] = [
  {
    id: 'matooke',
    name: 'Matooke (Plantain)',
    localName: 'Matooke',
    emoji: '',
    plantingMonths: [3, 4, 9, 10],
    harvestWeeks: 36,
    waterNeed: 'high',
    status: 'optimal',
    tip: 'April rains are ideal. Plant on ridges to avoid waterlogging.',
    region: ['Central', 'Western', 'Eastern'],
  },
  {
    id: 'maize',
    name: 'Maize (Corn)',
    localName: 'Kasooli',
    emoji: '',
    plantingMonths: [3, 4, 8, 9],
    harvestWeeks: 16,
    waterNeed: 'medium',
    status: 'good',
    tip: 'Good rainfall ahead. Use drought-tolerant LONGE 5 variety.',
    region: ['Northern', 'Eastern', 'Central'],
  },
  {
    id: 'beans',
    name: 'Climbing Beans',
    localName: 'Bijaanjalo',
    emoji: '',
    plantingMonths: [3, 4, 9, 10],
    harvestWeeks: 12,
    waterNeed: 'medium',
    status: 'optimal',
    tip: 'Optimal planting window open. Inter-crop with maize for best yield.',
    region: ['Western', 'Central'],
  },
  {
    id: 'cassava',
    name: 'Cassava',
    localName: 'Muwogo',
    emoji: '',
    plantingMonths: [3, 4, 5, 9, 10, 11],
    harvestWeeks: 52,
    waterNeed: 'low',
    status: 'good',
    tip: 'Disease-resistant NASE 14 recommended. Space 1m x 1m.',
    region: ['Eastern', 'Northern', 'Central'],
  },
  {
    id: 'sorghum',
    name: 'Sorghum',
    localName: 'Otoole',
    emoji: '',
    plantingMonths: [4, 5, 9],
    harvestWeeks: 20,
    waterNeed: 'low',
    status: 'good',
    tip: 'Drought-tolerant. Excellent for drier sub-regions of Karamoja.',
    region: ['Northern', 'Eastern'],
  },
  {
    id: 'simsim',
    name: 'Simsim (Sesame)',
    localName: 'Simsim',
    emoji: '',
    plantingMonths: [4, 5],
    harvestWeeks: 14,
    waterNeed: 'low',
    status: 'caution',
    tip: 'Wait for rain to stabilize. Loamy soils preferred.',
    region: ['Northern'],
  },
  {
    id: 'coffee',
    name: 'Arabica Coffee',
    localName: 'Emmwanyi',
    emoji: '',
    plantingMonths: [3, 9],
    harvestWeeks: 200,
    waterNeed: 'medium',
    status: 'optimal',
    tip: 'Plant on shaded hillsides. Mulch heavily around base.',
    region: ['Western'],
  },
  {
    id: 'sweetpotato',
    name: 'Sweet Potato',
    localName: 'Lumonde',
    emoji: '',
    plantingMonths: [3, 4, 5, 8, 9, 10],
    harvestWeeks: 16,
    waterNeed: 'medium',
    status: 'good',
    tip: 'Orange-fleshed varieties (NASPOT 13) rich in Vitamin A.',
    region: ['Central', 'Eastern', 'Western'],
  },
]

// ─── Mock Pest Alerts ────────────────────────────────────────────────────────

export const mockPestAlerts: PestAlert[] = [
  {
    id: 'faw',
    pestName: 'Fall Armyworm',
    emoji: '',
    affectedCrops: ['Maize', 'Sorghum'],
    severity: 'high',
    description: 'Active outbreak near Mbale and Jinja regions. Worms visible in leaf whorls.',
    action: 'Apply Emamectin Benzoate or neem extract. Report to your sub-county agricultural officer.',
    reportCount: 47,
    lastReported: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
  {
    id: 'banana-weevil',
    pestName: 'Banana Weevil',
    emoji: '',
    affectedCrops: ['Matooke'],
    severity: 'medium',
    description: 'Larvae boring into Matooke corms in Central region. Watch for yellowing leaves.',
    action: 'Use clean planting material. Trash management and application of Diazinon granules.',
    reportCount: 23,
    lastReported: new Date(Date.now() - 5 * 3600000).toISOString(),
  },
  {
    id: 'cassava-mosaic',
    pestName: 'Cassava Mosaic Disease',
    emoji: '',
    affectedCrops: ['Cassava'],
    severity: 'medium',
    description: 'Whitefly-transmitted virus causing yellow mosaic on leaves. Reducing yields.',
    action: 'Use disease-free cuttings (NASE 14). Remove and burn infected plants immediately.',
    reportCount: 18,
    lastReported: new Date(Date.now() - 24 * 3600000).toISOString(),
  },
  {
    id: 'locust',
    pestName: 'Desert Locust',
    emoji: '',
    affectedCrops: ['Maize', 'Sorghum', 'Beans', 'Cassava'],
    severity: 'low',
    description: 'Small swarm spotted in Moroto. Monitoring underway by Ministry of Agriculture.',
    action: 'Report any sightings immediately. Do not attempt to spray alone — contact district office.',
    reportCount: 5,
    lastReported: new Date(Date.now() - 72 * 3600000).toISOString(),
  },
]

// ─── Mock Farm Status ─────────────────────────────────────────────────────────

export const mockFarmStatus: FarmStatus = {
  overall: 'yellow',
  message: 'Pest alert in your area. Check Fall Armyworm advisory.',
  aiAdvice: 'The worm seeks to eat, but the farmer seeks to protect. Be vigilant, not anxious. Action is the only remedy.',
  treeHealth: 72,
  alerts: 2,
  waterLevel: 68,
  soilHealth: 81,
}

// ─── Pest Type Icons for Form ─────────────────────────────────────────────────

export const pestTypes = [
  { id: 'worm',    label: 'Worms',      emoji: '', description: 'Caterpillars, armyworms' },
  { id: 'beetle',  label: 'Beetles',    emoji: '', description: 'Weevils, borers' },
  { id: 'fly',     label: 'Flies',      emoji: '', description: 'Whiteflies, fruit flies' },
  { id: 'fungus',  label: 'Fungus',     emoji: '', description: 'Blight, mildew, rust' },
  { id: 'locust',  label: 'Locusts',    emoji: '', description: 'Swarms, hoppers' },
  { id: 'mite',    label: 'Mites',      emoji: '', description: 'Spider mites, red mites' },
  { id: 'rodent',  label: 'Rodents',    emoji: '', description: 'Rats, moles' },
  { id: 'disease', label: 'Disease',    emoji: '', description: 'Mosaic, leaf curl' },
]
