import { 
  SoilProperties, 
  FoundationProperties, 
  LoadingConditions, 
  CalculationResults,
  SoilType 
} from './types';

function deg2rad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function rad2deg(rad: number): number {
  return (rad * 180) / Math.PI;
}

export function allowablePressureSPT(soilType: SoilType, N: number): number {
  switch (soilType) {
    case 'Cohesionless (Sand)':
      if (N < 10) return 50 + 5 * (N - 5);
      if (N < 30) return 100 + 10 * (N - 10);
      return 300;
    case 'Cohesive (Clay)':
      if (N < 4) return 50;
      if (N < 8) return 80;
      if (N < 15) return 100;
      return 200;
    case 'c-φ Soil':
      return 100 + 10 * N;
    case 'Rock':
      return 500;
    default:
      return 150;
  }
}

export function calculateBearingCapacity(
  soil: SoilProperties,
  foundation: FoundationProperties,
  load: LoadingConditions,
  water_table_depth: number | null,
  FOS: number
): CalculationResults {
  const phi_rad = deg2rad(soil.phi);
  const { V, Mx, My, H } = load;
  const { B, L, Df, shape } = foundation;

  // 1. Eccentricity and effective dimensions
  const ex = V !== 0 ? Math.abs(My / V) : 0;
  const ey = V !== 0 ? Math.abs(Mx / V) : 0;
  
  const B_prime = Math.max(B - 2 * ex, 0.1);
  const L_prime = Math.max(L - 2 * ey, 0.1);
  const eccentricity_check = (ex / B > 1/6) || (ey / L > 1/6);

  // 2. IS 6403 Water Table Corrections
  let q_surcharge = soil.gamma * Df;
  let W_prime = 1.0;

  if (water_table_depth !== null) {
    // Surcharge Correction (Term 2)
    // If Dw <= Df, soil above base level is partially or fully submerged
    if (water_table_depth <= Df) {
      q_surcharge = soil.gamma * water_table_depth + soil.gamma_sub * (Df - water_table_depth);
    }

    // Third Term (Self Weight) Correction Factor W'
    // Corrects for water table position relative to foundation base
    if (water_table_depth <= Df) {
      // Water table at or above base level
      W_prime = 0.5;
    } else if (water_table_depth >= (Df + B)) {
      // Water table below zone of influence (depth B below base)
      W_prime = 1.0;
    } else {
      // Linear interpolation between base and B depth below base
      W_prime = 0.5 * (1 + (water_table_depth - Df) / B);
    }
  }

  // Gamma effective for the third term (Self-weight)
  const gamma_eff = soil.gamma * W_prime;

  // 3. Bearing capacity factors (IS 6403:1981)
  let Nc, Nq, Ngamma;
  if (soil.phi > 0) {
    Nq = Math.exp(Math.PI * Math.tan(phi_rad)) * Math.pow(Math.tan(Math.PI / 4 + phi_rad / 2), 2);
    Nc = (Nq - 1) / Math.tan(phi_rad);
    Ngamma = 2 * (Nq + 1) * Math.tan(phi_rad);
  } else {
    Nc = 5.14;
    Nq = 1;
    Ngamma = 0;
  }

  // 4. Shape factors
  let sc = 1, sq = 1, sgamma = 1;
  switch (shape) {
    case 'Strip/Continuous':
      sc = 1.0; sq = 1.0; sgamma = 1.0;
      break;
    case 'Square':
      if (soil.phi > 0) {
        sc = 1 + 0.2 * (B_prime / L_prime);
        sq = 1 + 0.2 * (B_prime / L_prime) * Math.tan(deg2rad(45 + soil.phi / 2));
      } else {
        sc = 1.3; sq = 1.0;
      }
      sgamma = 0.8;
      break;
    case 'Rectangular':
      sc = 1 + 0.2 * (B_prime / L_prime);
      sq = 1 + 0.2 * (B_prime / L_prime) * Math.tan(deg2rad(45 + soil.phi / 2));
      sgamma = 1 - 0.4 * (B_prime / L_prime);
      break;
    case 'Circular':
      sc = 1.3; sq = 1.2; sgamma = 0.6;
      break;
  }

  // 5. Depth factors (IS 6403 simplified)
  const D_B_ratio = Df / B;
  let dc, dq, dgamma = 1.0;
  const factor = D_B_ratio <= 1 ? D_B_ratio : Math.atan(D_B_ratio);
  dc = 1 + 0.2 * factor * Math.tan(deg2rad(45 + soil.phi / 2));
  dq = 1 + 0.1 * factor * Math.tan(deg2rad(45 + soil.phi / 2));

  // 6. Inclination factors
  const alpha = V > 0 ? rad2deg(Math.atan(H / V)) : 0;
  const phi_temp = soil.phi === 0 ? 0.001 : soil.phi;
  const ic = Math.pow(1 - (alpha / 90), 2);
  const iq = ic;
  const igamma = Math.pow(1 - (alpha / phi_temp), 2);

  // 7. Calculate terms
  const term1 = soil.c * Nc * sc * dc * ic;
  const term2 = q_surcharge * Nq * sq * dq * iq;
  const term3 = 0.5 * gamma_eff * B_prime * Ngamma * sgamma * dgamma * igamma;

  // 8. Capacities
  const qu = term1 + term2 + term3;
  const qnu = qu - q_surcharge;
  const qns = qnu / FOS;
  const qs = qns + q_surcharge;

  // 9. SPT check
  const qa_spt = soil.spt_n ? allowablePressureSPT(soil.type, soil.spt_n) : NaN;

  // 10. Recommended safe pressure
  const recommended_sbc = !isNaN(qa_spt) ? Math.min(qs, qa_spt) : qs;

  // 11. Settlement (Standard calculation)
  let settlement = 0;
  if (soil.Es && soil.Es > 0) {
    const mu = 0.3; // Poisson's ratio
    const I = 0.82; // Influence factor
    settlement = (qs * B * (1 - Math.pow(mu, 2)) * I) / soil.Es * 1000;
  } else {
    if (soil.type === 'Cohesive (Clay)') {
      settlement = (qs / 50) * 25;
    } else {
      settlement = (qs / 100) * 15;
    }
  }

  // 12. Determine Status
  let status: CalculationResults['status'] = 'SAFE';
  if (settlement > 25) status = 'SETTLEMENT GOVERNING';
  else if (eccentricity_check) status = 'HIGH ECCENTRICITY';

  return {
    SoilType: soil.type,
    Cohesion: soil.c,
    FrictionAngle: soil.phi,
    UnitWeight: soil.gamma,
    FoundationShape: shape,
    FoundationWidth: B,
    FoundationLength: L,
    FoundationDepth: Df,
    FOS,
    ex, ey, B_prime, L_prime, eccentricity_check,
    Nc, Nq, Ngamma,
    sc, sq, sgamma,
    dc, dq, dgamma,
    ic, iq, igamma,
    W_prime,
    term1, term2, term3,
    qu, qnu, qns, qs,
    qa_spt, recommended_sbc,
    settlement,
    status
  };
}