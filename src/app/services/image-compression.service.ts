import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export interface CompressionOptions {
  maxWidthPx?: number;
  maxHeightPx?: number;
  quality?: number;
  maxSizeBytes?: number;
  outputType?: 'image/jpeg' | 'image/webp' | 'image/png';
}

const DEFAULTS: Required<CompressionOptions> = {
  maxWidthPx: 1920,
  maxHeightPx: 1920,
  quality: 0.82,
  maxSizeBytes: 1024 * 1024,
  outputType: 'image/jpeg'
};

@Injectable({ providedIn: 'root' })
export class ImageCompressionService {
  private platformId = inject(PLATFORM_ID);

  async compress(file: File, options: CompressionOptions = {}): Promise<File> {
    if (!isPlatformBrowser(this.platformId)) return file;
    if (!file.type.startsWith('image/')) return file;
    if (file.size <= (options.maxSizeBytes || DEFAULTS.maxSizeBytes)) return file;

    const opts = { ...DEFAULTS, ...options };

    const img = await this.loadImage(file);
    const canvas = this.resizeCanvas(img, opts.maxWidthPx, opts.maxHeightPx);

    let blob = await this.canvasToBlob(canvas, opts.outputType, opts.quality);

    if (blob.size > opts.maxSizeBytes) {
      let q = opts.quality;
      while (blob.size > opts.maxSizeBytes && q > 0.3) {
        q -= 0.1;
        blob = await this.canvasToBlob(canvas, opts.outputType, q);
      }
    }

    const ext = opts.outputType === 'image/jpeg' ? 'jpg'
              : opts.outputType === 'image/webp' ? 'webp' : 'png';
    const baseName = file.name.replace(/\.[^.]+$/, '');
    return new File([blob], `${baseName}.${ext}`, { type: opts.outputType });
  }

  async compressMany(files: File[], options?: CompressionOptions): Promise<File[]> {
    return Promise.all(files.map(f => this.compress(f, options)));
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  }

  private loadImage(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
      img.onerror = (e) => { URL.revokeObjectURL(url); reject(e); };
      img.src = url;
    });
  }

  private resizeCanvas(img: HTMLImageElement, maxW: number, maxH: number): HTMLCanvasElement {
    let { width, height } = img;
    if (width > maxW || height > maxH) {
      const ratio = Math.min(maxW / width, maxH / height);
      width = Math.round(width * ratio);
      height = Math.round(height * ratio);
    }
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);
    }
    return canvas;
  }

  private canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        blob => blob ? resolve(blob) : reject(new Error('Canvas toBlob failed')),
        type, quality
      );
    });
  }
}
