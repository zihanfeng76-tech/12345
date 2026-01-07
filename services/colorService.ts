
import { ColorInfo, ProcessingSettings } from '../types';

/**
 * Extracts dominant colors from an image using a basic K-Means clustering approach.
 * This is performed entirely on the client side for privacy and speed.
 */
export const extractColorsFromImage = async (imgSrc: string, settings: ProcessingSettings): Promise<ColorInfo[]> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imgSrc;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error("Could not create canvas context"));
        return;
      }
      
      // Sampling size affects both performance and accuracy based on user settings
      const size = 50 + (settings.samplePrecision * 15);
      canvas.width = size;
      canvas.height = size;
      ctx.drawImage(img, 0, 0, size, size);
      
      const imageData = ctx.getImageData(0, 0, size, size).data;
      const pixels: {r: number, g: number, b: number}[] = [];
      
      for (let i = 0; i < imageData.length; i += 4) {
        const r = imageData[i];
        const g = imageData[i+1];
        const b = imageData[i+2];
        const a = imageData[i+3];
        
        // Skip transparent pixels
        if (a < 128) continue;
        
        // Optional grayscale filtering to focus on actual pigments
        if (settings.ignoreGrayscale) {
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          if (max - min < 15) continue;
        }
        
        pixels.push({ r, g, b });
      }

      if (pixels.length === 0) {
        resolve([]);
        return;
      }

      // Initial centroids: spaced selection from the image data
      let clusters = [];
      const step = Math.floor(pixels.length / settings.colorCount);
      for (let i = 0; i < settings.colorCount; i++) {
        const pixelIdx = Math.min(i * step, pixels.length - 1);
        clusters.push({ ...pixels[pixelIdx], count: 0 });
      }
      
      // Basic K-Means clustering iterations
      for (let iter = 0; iter < 10; iter++) {
        const newClusters = clusters.map(() => ({ r: 0, g: 0, b: 0, count: 0 }));
        
        pixels.forEach(p => {
          let minDist = Infinity;
          let clusterIdx = 0;
          
          for (let i = 0; i < clusters.length; i++) {
            const c = clusters[i];
            const d = (p.r - c.r)**2 + (p.g - c.g)**2 + (p.b - c.b)**2;
            if (d < minDist) {
              minDist = d;
              clusterIdx = i;
            }
          }
          
          newClusters[clusterIdx].r += p.r;
          newClusters[clusterIdx].g += p.g;
          newClusters[clusterIdx].b += p.b;
          newClusters[clusterIdx].count++;
        });
        
        clusters = newClusters.map((nc, idx) => {
          if (nc.count === 0) return clusters[idx];
          return {
            r: Math.round(nc.r / nc.count),
            g: Math.round(nc.g / nc.count),
            b: Math.round(nc.b / nc.count),
            count: nc.count
          };
        });
      }

      const totalSamples = clusters.reduce((acc, c) => acc + c.count, 0);
      
      const result: ColorInfo[] = clusters
        .filter(c => c.count > 0)
        .map(c => {
          let r = c.r, g = c.g, b = c.b;
          
          if (settings.brighten) {
            // PCCS Brightening simulation for pigment restoration
            r = Math.min(255, Math.round(r * 1.15));
            g = Math.min(255, Math.round(g * 1.15));
            b = Math.min(255, Math.round(b * 1.15));
          }

          const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
          const percentage = Math.round((c.count / totalSamples) * 100);
          
          // Color space conversions (RGB to CMYK)
          const rN = r / 255;
          const gN = g / 255;
          const bN = b / 255;
          const k = 1 - Math.max(rN, gN, bN);
          const cV = k === 1 ? 0 : Math.round(((1 - rN - k) / (1 - k)) * 100);
          const mV = k === 1 ? 0 : Math.round(((1 - gN - k) / (1 - k)) * 100);
          const yV = k === 1 ? 0 : Math.round(((1 - bN - k) / (1 - k)) * 100);

          return {
            hex,
            percentage,
            name: "Matching...",
            enName: "Wait...",
            rgb: { r, g, b },
            cmyk: { c: cV, m: mV, y: yV, k: Math.round(k * 100) }
          };
        });

      resolve(result.sort((a, b) => b.percentage - a.percentage));
    };
    img.onerror = () => reject(new Error("Failed to load image"));
  });
};
