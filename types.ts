
// Core type definitions for the Dunhuang Color application
export interface ProcessingSettings {
  colorCount: number;
  samplePrecision: number;
  brighten: boolean;
  ignoreGrayscale: boolean;
}

export interface ColorInfo {
  hex: string;
  percentage: number;
  name: string;
  enName: string;
  pinyin?: string;
  rgb: { r: number; g: number; b: number };
  cmyk: { c: number; m: number; y: number; k: number };
  description?: string;
}
