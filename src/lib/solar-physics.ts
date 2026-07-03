// src/utils/solar-physics.ts

/**
 * Slab Definition (TANGEDCO Domestic Tariff 2026 Model)
 * Ordered Low to High for correct integration
 */
export const SLABS = [
    { limit: 100, rate: 0.0 },    // First 100 units free
    { limit: 100, rate: 2.35 },   // Next 100 (101-200)
    { limit: 200, rate: 4.70 },   // Next 200 (201-400)
    { limit: 100, rate: 6.30 },   // Next 100 (401-500)
    { limit: 100, rate: 8.40 },   // Next 100 (501-600)
    { limit: 200, rate: 9.45 },   // Next 200 (601-800)
    { limit: 200, rate: 10.50 },  // Next 200 (801-1000)
    { limit: Infinity, rate: 11.55 } // Above 1000
];

// --- Grey-Box v2 Model ---

export interface BillInputs {
    totalBillAmount?: number; // The number at the bottom of the paper (optional if using estimatedUnits)
    estimatedUnits?: number; // Direct monthly units estimate (optional if using totalBillAmount)
    billingCycle: 'Bi-Monthly'; // Hardcoded for TANGEDCO context
}
export const PHYSICS = {
    AREA_PER_KW: 60, // sq.ft (Includes safety factor for maintenance walkways)
    PANEL_WATTAGE: 600, // Wp (Modern PERC/TopCon Mono)
    PANEL_LENGTH_M: 2.38, // meters
    PANEL_WIDTH_M: 1.30, // meters
    PANEL_AREA_M2: 3.11, // m² per panel
    SYSTEM_LOSS_FACTOR: 0.75, // DC-to-AC ratio (Derating for temp & efficiency) - corrected from 0.72
    FIXED_CHARGE_DEDUCTION: 60, // Reduced from 120 (Service charge only, No Tax)
    TARIFF_ESCALATION: 0.05, // 5% annual rise in utility rates
    PANEL_DEGRADATION: 0.006, // 0.6% annual decay in output
    DISCOUNT_RATE: 0.08, // 8% discount rate for NPV
    AVG_TARIFF: 7.0, // INR/kWh (Conservative weighted average)
    COST_PER_KW: 65000, // INR (Tier 1 components)
    LIFESPAN_YEARS: 25,
    SUN_HOURS_ANNUAL_AVG: 5.5, // PSH (Peak Sun Hours)
};

/**
 * Reconstructs energy consumption (kWh) from financial cost (INR).
 * @param billAmount The bi-monthly energy charge (excluding fixed charges/tax).
 * @returns Estimated bi-monthly consumption in kWh.
 */
/**
 * Decompose total bill into energy charge (removes fixed charge and tax buffer).
 * @param bill BillInputs
 * @returns Estimated energy charge (INR)
 */
/**
 * Decompose total bill into energy charge.
 * Removes only the Service Charge, assuming No Tax.
 */
export function estimateEnergyCharge(bill: BillInputs): number {
    return Math.max(0, bill.totalBillAmount ? bill.totalBillAmount - PHYSICS.FIXED_CHARGE_DEDUCTION : 0);
}

/**
 * Estimate units from energy charge using slabs (bottom-up, telescopic)
 * Fixed: Properly handles free slab - bill amount represents only paid consumption
 */
export function estimateUnitsFromEnergyCharge(energyCharge: number): number {
    let units = 0;
    let remainingBill = energyCharge;

    if (remainingBill <= 0) {
        return 0;
    }

    // Always include free units (first 100)
    units += SLABS[0].limit;

    // Calculate paid units from remaining slabs
    for (let i = 1; i < SLABS.length; i++) {
        const slab = SLABS[i];
        const slabMaxCost = slab.limit * slab.rate;

        if (remainingBill >= slabMaxCost) {
            units += slab.limit;
            remainingBill -= slabMaxCost;
        } else {
            const partialUnits = remainingBill / slab.rate;
            units += partialUnits;
            remainingBill = 0;
            break;
        }
    }

    return Math.round(units);
}


export interface SolarSystemSpecs {
    recommendedCapacityKw: number;
    panelCount: number;
    dailyGenerationKwh: number;
    annualGenerationKwh: number;
    requiredAreaSqFt: number;
    estimatedCost: number;
    roiYears: number;
    npv: number;
    annualSavings: number;
}

/**
 * Calculates system specifications based on physics constraints.
 * @param biMonthlyBillAmount - INR
 * @param panelWattage - Wp (e.g., 550)
 */

/**
 * Main entry: Calculate solar system specs from user bill input (Grey-Box v2)
 */
export function calculateSolarRequirementsFromBill(
    bill: BillInputs
): SolarSystemSpecs {
    // 1. Get bi-monthly units either from bill decomposition or direct estimate
    let biMonthlyUnits: number;
    
    if (bill.estimatedUnits !== undefined) {
        // Direct bi-monthly units estimate
        biMonthlyUnits = bill.estimatedUnits;
    } else if (bill.totalBillAmount !== undefined) {
        // Decompose bill to get energy charge, then estimate units
        const energyCharge = estimateEnergyCharge(bill);
        biMonthlyUnits = estimateUnitsFromEnergyCharge(energyCharge);
    } else {
        throw new Error("Either totalBillAmount or estimatedUnits must be provided");
    }
    
    // 2. Calculate daily consumption (bi-monthly = 60 days)
    const dailyConsumption = biMonthlyUnits / 60; // kWh/day

    // 3. System Sizing
    // Capacity = Demand / (PSH * Derating)
    let systemKw = dailyConsumption / (PHYSICS.SUN_HOURS_ANNUAL_AVG * PHYSICS.SYSTEM_LOSS_FACTOR);

    // Round UP to nearest 0.5kW (inverter sizing - ensures adequate capacity)
    // Examples: 2.1→2.5, 2.6→3.0, 2.9→3.0, 3.0→3.0
    systemKw = Math.ceil(systemKw * 2) / 2;

    // 4. Component Quantization
    const panelCount = Math.ceil((systemKw * 1000) / PHYSICS.PANEL_WATTAGE);
    const actualDcCapacityKw = (panelCount * PHYSICS.PANEL_WATTAGE) / 1000;

    // 5. Projections (Year 1)
    // Apply loss factor to convert DC capacity into realistic AC generation
    const dailyGen = actualDcCapacityKw * PHYSICS.SUN_HOURS_ANNUAL_AVG * PHYSICS.SYSTEM_LOSS_FACTOR;
    const annualGen = dailyGen * 365;
    const systemCost = actualDcCapacityKw * PHYSICS.COST_PER_KW;
    const annualSavings = annualGen * PHYSICS.AVG_TARIFF;
    
    // Calculate required area using actual panel dimensions
    const requiredAreaM2 = panelCount * PHYSICS.PANEL_AREA_M2 * 1.20; // 20% extra for spacing
    const requiredAreaSqFt = requiredAreaM2 * 10.764; // Convert m² to sq ft
    
    // Simple Payback
    const roi = systemCost / annualSavings;

    // 6. NPV Calculation (Geometric Series)
    // Models cash flows over 25 years with escalation and degradation.
    let npv = -systemCost; // Initial Outflow
    let currentYearSavings = annualSavings;
    
    for (let t = 1; t <= PHYSICS.LIFESPAN_YEARS; t++) {
        // Discount the cash flow back to present value
        npv += currentYearSavings / Math.pow(1 + PHYSICS.DISCOUNT_RATE, t);
        
        // Prepare next year's savings:
        // Tariff goes UP, Panel Output goes DOWN
        currentYearSavings = currentYearSavings * (1 + PHYSICS.TARIFF_ESCALATION) * (1 - PHYSICS.PANEL_DEGRADATION);
    }

    return {
        recommendedCapacityKw: actualDcCapacityKw,
        panelCount: panelCount,
        dailyGenerationKwh: parseFloat(dailyGen.toFixed(1)),
        annualGenerationKwh: Math.round(annualGen),
        requiredAreaSqFt: Math.round(requiredAreaSqFt),
        estimatedCost: systemCost,
        roiYears: parseFloat(roi.toFixed(1)),
        npv: Math.round(npv),
        annualSavings: Math.round(annualSavings)
    };
}
