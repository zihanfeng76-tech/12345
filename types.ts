export interface ColorInfo {
  hex: string;
  rgb: { r: number; g: number; b: number };
  cmyk: { c: number; m: number; y: number; k: number };
  percentage: number;
  name?: string; // Chinese traditional name
  pinyin?: string;
  enName?: string; // English translation
  description?: string; // Brief cultural description
}

export interface Palette {
  id: string;
  name: string;
  colors: ColorInfo[];
  createdAt: number;
  sourceImage?: string; // Base64 or URL
}

export interface ProcessingSettings {
  colorCount: number; // 3-12
  ignoreGrayscale: boolean;
  samplePrecision: number; // 1-10
  brighten: boolean; // PCCS brightening option
}

export interface InspirationImage {
  id: string;
  url: string;
  title: string;
}