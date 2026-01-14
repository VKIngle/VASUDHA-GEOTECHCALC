
export type SoilType = 'Cohesionless (Sand)' | 'Cohesive (Clay)' | 'c-φ Soil' | 'Rock' | 'Other';
export type FoundationShape = 'Strip/Continuous' | 'Square' | 'Rectangular' | 'Circular';

export interface SoilProperties {
  type: SoilType;
  c: number; // Cohesion (kPa)
  phi: number; // Friction angle (degrees)
  gamma: number; // Unit weight (kN/m³)
  gamma_sub: number; // Submerged unit weight (kN/m³)
  spt_n?: number; // SPT N-value
  Es?: number; // Elastic modulus (kPa)
}

export interface FoundationProperties {
  shape: FoundationShape;
  B: number; // Width (m)
  L: number; // Length (m)
  Df: number; // Depth (m)
}

export interface LoadingConditions {
  V: number; // Vertical load (kN)
  H: number; // Horizontal load (kN)
  Mx: number; // Moment about x (kN-m)
  My: number; // Moment about y (kN-m)
}

export interface CalculationResults {
  SoilType: string;
  Cohesion: number;
  FrictionAngle: number;
  UnitWeight: number;
  FoundationShape: string;
  FoundationWidth: number;
  FoundationLength: number;
  FoundationDepth: number;
  FOS: number;
  ex: number;
  ey: number;
  B_prime: number;
  L_prime: number;
  eccentricity_check: boolean;
  Nc: number;
  Nq: number;
  Ngamma: number;
  sc: number;
  sq: number;
  sgamma: number;
  dc: number;
  dq: number;
  dgamma: number;
  ic: number;
  iq: number;
  igamma: number;
  W_prime: number; // Water table correction factor for term 3
  term1: number;
  term2: number;
  term3: number;
  qu: number;
  qnu: number;
  qns: number;
  qs: number;
  qa_spt: number;
  recommended_sbc: number;
  settlement: number;
  status: 'SAFE' | 'SETTLEMENT GOVERNING' | 'HIGH ECCENTRICITY';
}
