import type {
  CalculationResult,
  CalculatorInput,
  FormulaSex,
  ReferenceRange,
  ReferenceStatus,
  ValidationResult,
} from "./types";

const KG_PER_POUND = 0.45359237;
const CM_PER_INCH = 2.54;

export function convertMeasurementValue(
  value: number,
  from: "metric" | "imperial",
  to: "metric" | "imperial",
  kind: "length" | "weight",
): number {
  if (from === to) {
    return value;
  }

  if (kind === "length") {
    return from === "metric" ? value / CM_PER_INCH : value * CM_PER_INCH;
  }

  return from === "metric" ? value / KG_PER_POUND : value * KG_PER_POUND;
}

const REFERENCE_RANGES: Record<
  FormulaSex,
  Array<Omit<ReferenceRange, "formulaSex">>
> = {
  male: [
    { ageBand: "20–39", minimum: 8, maximum: 19 },
    { ageBand: "40–59", minimum: 11, maximum: 21 },
    { ageBand: "60–79", minimum: 13, maximum: 24 },
  ],
  female: [
    { ageBand: "20–39", minimum: 21, maximum: 32 },
    { ageBand: "40–59", minimum: 23, maximum: 33 },
    { ageBand: "60–79", minimum: 24, maximum: 35 },
  ],
};

export function convertInputToMetric(input: CalculatorInput): CalculatorInput {
  if (input.units === "metric") {
    return { ...input };
  }

  return {
    ...input,
    units: "metric",
    height: input.height * CM_PER_INCH,
    weight: input.weight * KG_PER_POUND,
    ...(input.neck === undefined ? {} : { neck: input.neck * CM_PER_INCH }),
    ...(input.waist === undefined ? {} : { waist: input.waist * CM_PER_INCH }),
    ...(input.hip === undefined ? {} : { hip: input.hip * CM_PER_INCH }),
  };
}

export function calculateBmi(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100;
  return weightKg / heightM ** 2;
}

export function calculateNavyBodyFat(input: CalculatorInput): number {
  const metric = convertInputToMetric(input);
  const heightIn = metric.height / CM_PER_INCH;
  const neckIn = (metric.neck ?? 0) / CM_PER_INCH;
  const waistIn = (metric.waist ?? 0) / CM_PER_INCH;

  if (metric.formulaSex === "male") {
    return (
      86.01 * Math.log10(waistIn - neckIn) -
      70.041 * Math.log10(heightIn) +
      36.76
    );
  }

  const hipIn = (metric.hip ?? 0) / CM_PER_INCH;
  return (
    163.205 * Math.log10(waistIn + hipIn - neckIn) -
    97.684 * Math.log10(heightIn) -
    78.387
  );
}

export function calculateBmiBodyFat(input: CalculatorInput): number {
  const metric = convertInputToMetric(input);
  const bmi = calculateBmi(metric.weight, metric.height);
  const sexCoefficient = metric.formulaSex === "male" ? 1 : 0;
  return 1.2 * bmi + 0.23 * metric.age - 10.8 * sexCoefficient - 5.4;
}

export function getReferenceRange(
  formulaSex: FormulaSex,
  age: number,
): ReferenceRange | null {
  if (age < 20 || age > 79) {
    return null;
  }

  const ageBand =
    age <= 39 ? "20–39" : age <= 59 ? "40–59" : ("60–79" as const);
  const range = REFERENCE_RANGES[formulaSex].find(
    (candidate) => candidate.ageBand === ageBand,
  );

  return range ? { ...range, formulaSex } : null;
}

export function classifyReferenceRange(
  percentage: number,
  range: ReferenceRange,
): ReferenceStatus {
  if (percentage < range.minimum) {
    return "below";
  }
  if (percentage > range.maximum) {
    return "above";
  }
  return "within";
}

function validateRequiredNumber(
  value: number | undefined,
  field: keyof CalculatorInput,
  label: string,
  minimum: number,
  maximum: number,
  errors: ValidationResult["errors"],
): void {
  if (value === undefined || !Number.isFinite(value)) {
    errors[field] = `${label} is required.`;
    return;
  }

  if (value < minimum || value > maximum) {
    errors[field] = `${label} must be between ${minimum} and ${maximum}.`;
  }
}

export function validateCalculatorInput(
  input: CalculatorInput,
): ValidationResult {
  const errors: ValidationResult["errors"] = {};
  const metric = convertInputToMetric(input);

  validateRequiredNumber(input.age, "age", "Age", 18, 100, errors);
  validateRequiredNumber(metric.height, "height", "Height", 120, 230, errors);
  validateRequiredNumber(metric.weight, "weight", "Weight", 30, 300, errors);

  if (input.method === "navy") {
    validateRequiredNumber(metric.neck, "neck", "Neck circumference", 20, 70, errors);
    validateRequiredNumber(metric.waist, "waist", "Waist circumference", 40, 200, errors);

    if (input.formulaSex === "female") {
      validateRequiredNumber(metric.hip, "hip", "Hip circumference", 50, 220, errors);
    }

    if (
      metric.neck !== undefined &&
      metric.waist !== undefined &&
      metric.waist <= metric.neck
    ) {
      errors.waist = "Waist circumference must be greater than neck circumference.";
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function calculateBodyFat(
  input: CalculatorInput,
): CalculationResult {
  const validation = validateCalculatorInput(input);
  if (!validation.valid) {
    throw new RangeError("Calculator input is invalid.");
  }

  const metric = convertInputToMetric(input);
  const bmi = calculateBmi(metric.weight, metric.height);
  const rawPercentage =
    input.method === "navy"
      ? calculateNavyBodyFat(input)
      : calculateBmiBodyFat(input);
  const bodyFatPercentage = Math.min(75, Math.max(2, rawPercentage));
  const referenceRange = getReferenceRange(input.formulaSex, input.age);

  return {
    bodyFatPercentage,
    fatMass: input.weight * (bodyFatPercentage / 100),
    leanMass: input.weight * (1 - bodyFatPercentage / 100),
    bmi,
    method: input.method,
    units: input.units,
    referenceRange,
    referenceStatus: referenceRange
      ? classifyReferenceRange(bodyFatPercentage, referenceRange)
      : null,
  };
}
