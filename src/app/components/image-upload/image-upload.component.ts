import { Component, EventEmitter, Output, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-image-upload',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-3">
      <input #fileInput type="file" multiple accept="image/*" style="display: none;" (change)="onFileChange($event)">
      <div class="border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer w-full"
           [class.border-mb-blue]="isDragging()"
           [class.bg-blue-50]="isDragging()"
           [class.border-gray-300]="!isDragging()"
           (dragover)="onDragOver($event)"
           (dragleave)="onDragLeave($event)"
           (drop)="onDrop($event)"
           (click)="fileInput.click()">
        <div class="text-4xl mb-2">📷</div>
        <p class="font-medium text-mb-dark">Drop images here or click to select</p>
      </div>

      @if (previews().length > 0) {
        <div class="grid grid-cols-4 gap-2">
          @for (preview of previews(); track $index) {
            <div class="relative group">
              <img [src]="preview" class="w-full h-24 object-cover rounded border border-gray-200" loading="lazy" decoding="async">
              <button type="button" (click)="remove($index)"
                      class="absolute top-1 right-1 bg-red-500 text-white w-6 h-6 rounded-full text-xs opacity-0 group-hover:opacity-100 transition">×</button>
            </div>
          }
        </div>
      }
    </div>
  `
})
export class ImageUploadComponent {
  @Input() maxFiles = 10;
  @Output() filesChange = new EventEmitter<File[]>();

  isDragging = signal(false);
  previews = signal<string[]>([]);
  private files: File[] = [];

  onDragOver(e: DragEvent): void {
    e.preventDefault();
    this.isDragging.set(true);
  }

  onDragLeave(e: DragEvent): void {
    e.preventDefault();
    this.isDragging.set(false);
  }

  onDrop(e: DragEvent): void {
    e.preventDefault();
    this.isDragging.set(false);
    const files = Array.from(e.dataTransfer?.files || []).filter(f => f.type.startsWith('image/'));
    this.addFiles(files);
  }

  onFileChange(e: Event): void {
    const target = e.target as HTMLInputElement;
    if (target.files) this.addFiles(Array.from(target.files));
  }

  private addFiles(newFiles: File[]): void {
    const total = this.files.length + newFiles.length;
    if (total > this.maxFiles) {
      newFiles = newFiles.slice(0, this.maxFiles - this.files.length);
    }
    this.files.push(...newFiles);
    newFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        this.previews.update(list => [...list, ev.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
    this.filesChange.emit(this.files);
  }

  remove(index: number): void {
    this.files.splice(index, 1);
    this.previews.update(list => list.filter((_, i) => i !== index));
    this.filesChange.emit(this.files);
  }
}
