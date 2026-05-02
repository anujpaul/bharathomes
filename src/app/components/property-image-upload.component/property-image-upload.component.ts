import { Component, Input, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { appConfig } from '@/app/config/app-config';

interface UploadedImage {
  id: number;
  url: string;
  order: number;
}

@Component({
  selector: 'app-property-image-upload',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-4">

      <div class="flex items-center justify-between">
        <h3 class="text-sm font-semibold text-gray-700">Property Photos</h3>
        <span class="text-xs text-gray-400">{{ images().length }} uploaded</span>
      </div>

      <!-- Uploaded images grid -->
      @if (images().length > 0) {
        <div class="grid grid-cols-3 gap-3">
          @for (img of images(); track img.id) {
            <div class="relative group aspect-square">
              <img [src]="img.url"
                   class="w-full h-full object-cover rounded-xl border border-gray-100">
              <button (click)="deleteImage(img.id)"
                class="absolute top-1 right-1 bg-red-500 text-white rounded-full
                       w-6 h-6 text-xs hidden group-hover:flex items-center justify-center">
                ✕
              </button>
              @if (img.order === 0) {
                <span class="absolute bottom-1 left-1 bg-blue-600 text-white
                             text-[10px] px-2 py-0.5 rounded-full">Cover</span>
              }
            </div>
          }
        </div>
      }

      <!-- Upload area -->
      <label class="flex flex-col items-center justify-center w-full h-32
                    border-2 border-dashed border-gray-200 rounded-xl cursor-pointer
                    hover:border-blue-400 hover:bg-blue-50 transition-colors">
        @if (uploading()) {
          <span class="text-sm text-gray-500">Uploading...</span>
        } @else {
          <span class="text-2xl mb-1">📷</span>
          <span class="text-sm text-gray-500">Click to upload photos</span>
          <span class="text-xs text-gray-400 mt-1">JPG, PNG, WebP up to 10MB each</span>
        }
        <input type="file" accept="image/*" multiple class="hidden"
               [disabled]="uploading()"
               (change)="onFilesSelected($event)">
      </label>

      @if (errorMessage()) {
        <p class="text-xs text-red-500">{{ errorMessage() }}</p>
      }

    </div>
  `
})
export class PropertyImageUploadComponent implements OnInit {
  @Input() propertyId!: string;
  @Input() existingImages: { url: string; order: number }[] = [];

  private http = inject(HttpClient);
  private base = `${appConfig.baseUrl}/api/property`;

  images = signal<UploadedImage[]>([]);
  uploading = signal(false);
  errorMessage = signal('');

  ngOnInit() {
    // Seed from existing if editing a property
    if (this.existingImages?.length) {
      this.images.set(this.existingImages.map((img, i) => ({
        id: i, url: img.url, order: img.order
      })));
    }
  }

  async onFilesSelected(event: Event) {
    const files = Array.from((event.target as HTMLInputElement).files ?? []);
    if (!files.length) return;

    this.uploading.set(true);
    this.errorMessage.set('');

    for (const file of files) {
      try {
        const form = new FormData();
        form.append('file', file);
        const result = await firstValueFrom(
          this.http.post<UploadedImage>(`${this.base}/${this.propertyId}/images`, form)
        );
        this.images.update(imgs => [...imgs, result]);
      } catch (err: any) {
        this.errorMessage.set(err.error?.message ?? `Failed to upload ${file.name}`);
      }
    }

    this.uploading.set(false);
    (event.target as HTMLInputElement).value = '';
  }

  async deleteImage(imageId: number) {
    try {
      await firstValueFrom(
        this.http.delete(`${this.base}/${this.propertyId}/images/${imageId}`)
      );
      this.images.update(imgs => imgs.filter(i => i.id !== imageId));
    } catch {
      this.errorMessage.set('Failed to delete image');
    }
  }
}