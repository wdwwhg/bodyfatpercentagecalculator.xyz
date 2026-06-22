export type CalculatorMethod = "navy" | "bmi";
export type UnitSystem = "metric" | "imperial";
export type FormulaSex = "male" | "female";
export type ReferenceStatus = "below" | "within" | "above";

export interface CalculatorInput {
  method: CalculatorMethod;
  units: UnitSystem;
  formulaSex: FormulaSex;
  age: number;
  height: number;
  weight: number;
  neck?: number;
  waist?: number;
  hip?: number;
}

export interface ReferenceRange {
  minimum: number;
  maximum: number;
  ageBand: "20–39" | "40–59" | "60–79";
  formulaSex: FormulaSex;
}

export interface CalculationResult {
  bodyFatPercentage: number;
  fatMass: number;
  leanMass: number;
  bmi: number;
  method: CalculatorMethod;
  units: UnitSystem;
  referenceRange: ReferenceRange | null;
  referenceStatus: ReferenceStatus | null;
}

export interface ValidationResult {
  valid: boolean;
  errors: Partial<Record<keyof CalculatorInput, string>>;
}
