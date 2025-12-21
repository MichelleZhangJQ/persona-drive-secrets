// lib/persona-utils.ts

export const driveNames = ["Exploration", "Achievement", "Dominance", "Pleasure", "Care", "Affiliation", "Value"];

/**
 * INNATE CALCULATION
 * Logic: (Front Drive + (6 - Back Drive)) / count
 */
export const calculateInnateScores = (data: any) => {
  if (!data) return null;
  const q = (n: number) => Number(data[`q${n}_answer`]) || 0;
  
  return {
    Exploration: (q(1) + q(2) + q(3) + q(4) + q(5) + q(6)) / 6,
    Achievement: (q(9) + (6 - q(1)) + (6 - q(10)) + q(13) + q(16)) / 5,
    Dominance: (q(8) + (6 - q(2)) + q(11) + q(14)) / 4,
    Care: (q(12) + (6 - q(5)) + (6 - q(8)) + (6 - q(9))) / 4,
    Affiliation: (q(7) + (6 - q(4)) + q(10) + (6 - q(11))) / 4,
    Value: (q(15) + (6 - q(6)) + (6 - q(13)) + (6 - q(14))) / 4,
    Pleasure: ((6 - q(3)) + (6 - q(7)) + (6 - q(12)) + (6 - q(15)) + 6-q(16)) / 5
  };
};

/**
 * PRIVATE CALCULATION
 * Logic: Exploration is flipped (6-q), others are (q)
 */
export const calculatePrivateScores = (data: any) => {
  if (!data) return null;
  const q = (n: number) => Number(data[`q${n}_answer`]) || 0;
  
  return {
    Exploration: ((6 - q(1)) + (6 - q(2)) + (6 - q(3)) + (6 - q(4)) + (6 - q(5)) + (6 - q(6))) / 6,
    Achievement: (q(1) + q(7) + q(10) + q(13) + q(16)) / 5,
    Dominance: (q(2) + q(8) + q(11) + q(14)) / 4,
    Pleasure: (q(3) + q(9) + q(12) + q(15) + 6-q(16)) / 5,
    Care: (q(4) + 6-q(7) + 6-q(8) + 6-q(9)) / 4,
    Affiliation: (q(5) + 6-q(10) + 6-q(11) + 6-q(12)) / 4,
    Value: (q(6) + 6- q(13) + 6-q(14) + 6-q(15)) / 4
  };
};

/**
 * PUBLIC CALCULATION
 * Returns a flat object with drive: normalized_score (0-5)
 * to maintain compatibility with existing report pages.
 */
export const calculatePublicScores = (data: any) => {
  if (!data) return null;
  
  const rawResults = driveNames.map((name, i) => {
    const start = i * 3 + 1;
    const envScale = Number(data[`q${start}_answer`]) || 0;
    const envMag = Number(data[`q${start+1}_answer`]) || 0;
    const selfDrive = Number(data[`q${start+2}_answer`]) || 0;
    
    const envTotal = (envScale * envMag) / 5;
    const total = envTotal + selfDrive;
    
    return { name, total };
  });

  const maxRaw = Math.max(...rawResults.map(d => d.total));

  // Returns { Exploration: 4.2, Achievement: 3.1, ... }
  return rawResults.reduce((acc: any, d) => {
    acc[d.name] = maxRaw > 0 ? (d.total / maxRaw) * 5 : 0;
    return acc;
  }, {});
};