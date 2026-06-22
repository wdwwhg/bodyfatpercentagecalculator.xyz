import { describe, expect, it } from "vitest";
import {
  calculateBodyFat,
  calculateBmi,
  calculateBmiBodyFat,
  calculateNavyBodyFat,
  classifyReferenceRange,
  convertInputToMetric,
  convertMeasurementValue,
  getReferenceRange,
  validateCalculatorInput,
} from "@/lib/body-fat";
import type { CalculatorInput } from "@/lib/types";

const metricMaleNavy: CalculatorInput = {
  method: "navy",
  units: "metric",
  formulaSex: "male",
  age: 35,
  height: 180,
  weight: 80,
  neck: 39,
  waist: 88,
};

describe("US Navy body-fat formula", () => {
  it("calculates a male estimate from metric circumferences", () => {
    expect(calculateNavyBodyFat(metricMaleNavy)).toBeCloseTo(17.71, 1);
  });

  it("includes hip circumference for female estimates", () => {
    expect(
      calculateNavyBodyFat({
        ...metricMaleNavy,
        formulaSex: "female",
        height: 165,
        weight: 65,
        neck: 33,
        waist: 76,
        hip: 98,
      }),
    ).toBeCloseTo(29.24, 1);
  });
});

describe("height and weight estimate", () => {
  it("calculates BMI in metric units", () => {
    expect(calculateBmi(80, 180)).toBeCloseTo(24.69, 2);
  });

  it("uses the adult Deurenberg estimate", () => {
    expect(
      calculateBmiBodyFat({
        method: "bmi",
        units: "metric",
        formulaSex: "male",
        age: 35,
        height: 180,
        weight: 80,
      }),
    ).toBeCloseTo(21.48, 1);
  });
});

describe("unit conversion", () => {
  it("converts lengths and weights in both directions", () => {
    expect(convertMeasurementValue(180, "metric", "imperial", "length")).toBeCloseTo(
      70.87,
      1,
    );
    expect(convertMeasurementValue(80, "metric", "imperial", "weight")).toBeCloseTo(
      176.37,
      1,
    );
    expect(convertMeasurementValue(70.8661, "imperial", "metric", "length")).toBeCloseTo(
      180,
      1,
    );
  });

  it("produces equivalent inputs for metric and imperial measurements", () => {
    const converted = convertInputToMetric({
      method: "navy",
      units: "imperial",
      formulaSex: "male",
      age: 35,
      height: 70.8661,
      weight: 176.37,
      neck: 15.3543,
      waist: 34.6457,
    });

    expect(converted.height).toBeCloseTo(180, 1);
    expect(converted.weight).toBeCloseTo(80, 1);
    expect(converted.neck).toBeCloseTo(39, 1);
    expect(converted.waist).toBeCloseTo(88, 1);
  });
});

describe("age- and sex-based reference ranges", () => {
  it("returns the published adult range for men aged 20–39", () => {
    expect(getReferenceRange("male", 35)).toEqual({
      minimum: 8,
      maximum: 19,
      ageBand: "20–39",
      formulaSex: "male",
    });
  });

  it("returns no range outside ages 20–79", () => {
    expect(getReferenceRange("female", 19)).toBeNull();
    expect(getReferenceRange("male", 80)).toBeNull();
  });

  it("classifies estimates relative to a reference range", () => {
    const range = getReferenceRange("female", 45);
    expect(range).not.toBeNull();
    expect(classifyReferenceRange(22, range!)).toBe("below");
    expect(classifyReferenceRange(28, range!)).toBe("within");
    expect(classifyReferenceRange(36, range!)).toBe("above");
  });
});

describe("validation and complete results", () => {
  it("requires hip circumference for the female Navy method", () => {
    const validation = validateCalculatorInput({
      ...metricMaleNavy,
      formulaSex: "female",
    });
    expect(validation.valid).toBe(false);
    expect(validation.errors.hip).toMatch(/required/i);
  });

  it("rejects ages outside the supported adult range", () => {
    const validation = validateCalculatorInput({
      ...metricMaleNavy,
      age: 17,
    });
    expect(validation.errors.age).toMatch(/18 and 100/i);
  });

  it("rejects impossible Navy circumference relationships", () => {
    const validation = validateCalculatorInput({
      ...metricMaleNavy,
      neck: 90,
      waist: 80,
    });
    expect(validation.errors.waist).toMatch(/greater than neck/i);
  });

  it("returns body fat, fat mass, lean mass, and the method", () => {
    const result = calculateBodyFat(metricMaleNavy);
    expect(result.bodyFatPercentage).toBeCloseTo(17.71, 1);
    expect(result.fatMass).toBeCloseTo(14.17, 1);
    expect(result.leanMass).toBeCloseTo(65.83, 1);
    expect(result.method).toBe("navy");
    expect(result.referenceStatus).toBe("within");
  });
});
