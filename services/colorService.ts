import { ColorInfo, ProcessingSettings } from '../types';

// Utility: RGB to Hex
export const rgbToHex = (r: number, g: number, b: number): string => {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
};

// Utility: RGB to CMYK
export const rgbToCmyk = (r: number, g: number, b: number) => {
  let c = 0, m = 0, y = 0, k = 0;
  if (r === 0 && g === 0 && b === 0) {
    k = 100;
  } else {
    c = 1 - r / 255;
    m = 1 - g / 255;
    y = 1 - b / 255;
    const minCMY = Math.min(c, m, y);
    c = Math.round(((c - minCMY) / (1 - minCMY)) * 100);
    m = Math.round(((m - minCMY) / (1 - minCMY)) * 100);
    y = Math.round(((y - minCMY) / (1 - minCMY)) * 100);
    k = Math.round(minCMY * 100);
  }
  return { c, m, y, k };
};

// Utility: RGB to HSL for PCCS adjustments
const rgbToHsl = (r: number, g: number, b: number) => {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h, s, l };
};

const hslToRgb = (h: number, s: number, l: number) => {
  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
};

// PCCS Brightening: Move towards "v" (vivid) or "b" (bright) tones
const applyPccsBrighten = (r: number, g: number, b: number): [number, number, number] => {
  let { h, s, l } = rgbToHsl(r, g, b);
  
  // Simulation of restoring faded pigments:
  // Increase saturation significantly and boost lightness to move away from "weathered" (dull/dark) tones
  s = Math.min(1, s * 1.4 + 0.1); 
  l = Math.min(0.95, l * 1.1 + 0.05);

  const [nr, ng, nb] = hslToRgb(h, s, l);
  return [nr, ng, nb] as [number, number, number];
};

// Utility: Check if color is grayscale
const isGrayscale = (r: number, g: number, b: number, threshold = 20): boolean => {
  return Math.abs(r - g) < threshold && Math.abs(g - b) < threshold && Math.abs(r - b) < threshold;
};

// K-means Clustering implementation
export const extractColors = async (
  imageSrc: string,
  settings: ProcessingSettings
): Promise<ColorInfo[]> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = imageSrc;

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject("Canvas not available");
        return;
      }

      const scale = Math.min(1, 200 / Math.max(img.width, img.height));
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const pixels: number[][] = [];

      const step = Math.max(1, 11 - settings.samplePrecision); 
      for (let i = 0; i < data.length; i += 4 * step) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];

        if (a < 128) continue;
        if (settings.ignoreGrayscale && isGrayscale(r, g, b)) continue;

        pixels.push([r, g, b]);
      }

      if (pixels.length === 0) {
        resolve([]);
        return;
      }

      const k = settings.colorCount;
      let centroids = pixels.sort(() => 0.5 - Math.random()).slice(0, k);
      
      const maxIterations = 20;
      for (let iter = 0; iter < maxIterations; iter++) {
        const clusters: number[][][] = Array.from({ length: k }, () => []);

        for (const pixel of pixels) {
          let minDist = Infinity;
          let clusterIndex = 0;
          for (let i = 0; i < k; i++) {
            const dr = pixel[0] - centroids[i][0];
            const dg = pixel[1] - centroids[i][1];
            const db = pixel[2] - centroids[i][2];
            const dist = dr * dr + dg * dg + db * db;
            if (dist < minDist) {
              minDist = dist;
              clusterIndex = i;
            }
          }
          clusters[clusterIndex].push(pixel);
        }

        let changed = false;
        centroids = centroids.map((centroid, i) => {
          if (clusters[i].length === 0) return centroid;
          const sum = clusters[i].reduce((acc, p) => [acc[0] + p[0], acc[1] + p[1], acc[2] + p[2]], [0, 0, 0]);
          const newCentroid = [
            Math.floor(sum[0] / clusters[i].length),
            Math.floor(sum[1] / clusters[i].length),
            Math.floor(sum[2] / clusters[i].length)
          ];
          if (Math.abs(newCentroid[0] - centroid[0]) > 1 || 
              Math.abs(newCentroid[1] - centroid[1]) > 1 || 
              Math.abs(newCentroid[2] - centroid[2]) > 1) {
            changed = true;
          }
          return newCentroid;
        });

        if (!changed) break;
      }

      const counts = new Array(k).fill(0);
      for (const pixel of pixels) {
        let minDist = Infinity;
        let clusterIndex = 0;
        for (let i = 0; i < k; i++) {
           const dr = pixel[0] - centroids[i][0];
           const dg = pixel[1] - centroids[i][1];
           const db = pixel[2] - centroids[i][2];
           const dist = dr*dr + dg*dg + db*db;
           if (dist < minDist) {
             minDist = dist;
             clusterIndex = i;
           }
        }
        counts[clusterIndex]++;
      }
      
      const total = pixels.length;
      const finalColors: ColorInfo[] = centroids.map((rgb, index) => {
        let targetRgb = rgb;
        if (settings.brighten) {
          targetRgb = applyPccsBrighten(rgb[0], rgb[1], rgb[2]);
        }

        return {
          hex: rgbToHex(targetRgb[0], targetRgb[1], targetRgb[2]),
          rgb: { r: targetRgb[0], g: targetRgb[1], b: targetRgb[2] },
          cmyk: rgbToCmyk(targetRgb[0], targetRgb[1], targetRgb[2]),
          percentage: parseFloat(((counts[index] / total) * 100).toFixed(1))
        };
      });

      resolve(finalColors.sort((a, b) => b.percentage - a.percentage));
    };

    img.onerror = () => reject("Failed to load image");
  });
};

export const generatePaletteImage = (palette: ColorInfo[], title: string): Promise<string> => {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        const width = 800;
        const height = 600;
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) return resolve('');

        ctx.fillStyle = '#F2E8D5';
        ctx.fillRect(0, 0, width, height);

        ctx.fillStyle = '#3E3832';
        ctx.font = 'bold 32px "Noto Serif SC", serif';
        ctx.textAlign = 'center';
        ctx.fillText(title, width / 2, 60);

        const cols = palette.length > 6 ? 4 : 3;
        const rows = Math.ceil(palette.length / cols);
        const cardWidth = (width - 100) / cols;
        const cardHeight = (height - 150) / rows;
        
        palette.forEach((color, index) => {
            const col = index % cols;
            const row = Math.floor(index / cols);
            const x = 50 + col * cardWidth;
            const y = 100 + row * cardHeight;

            ctx.fillStyle = color.hex;
            ctx.fillRect(x + 10, y + 10, cardWidth - 20, cardHeight - 80);

            ctx.fillStyle = '#3E3832';
            ctx.font = 'bold 16px "Noto Serif SC"';
            ctx.textAlign = 'left';
            const name = color.name || color.hex;
            ctx.fillText(name, x + 10, y + cardHeight - 45);

            ctx.font = '12px sans-serif';
            ctx.fillStyle = '#666';
            ctx.fillText(color.hex, x + 10, y + cardHeight - 25);
            ctx.fillText(`CMYK: ${color.cmyk.c},${color.cmyk.m},${color.cmyk.y},${color.cmyk.k}`, x + 10, y + cardHeight - 10);
        });

        ctx.fillStyle = '#A84C32';
        ctx.font = 'italic 14px serif';
        ctx.textAlign = 'center';
        ctx.fillText('Generated by Dunhuang Color AI', width / 2, height - 20);

        resolve(canvas.toDataURL('image/png'));
    });
};