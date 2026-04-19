import { OverlayRef } from '@angular/cdk/overlay';
import { CommonModule } from '@angular/common';
import { Component, HostListener, Input, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

@Component({
  selector: 'app-lightbox',
  standalone: true,
  imports: [CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div class="lightbox-content">
      <button class="close-btn" (click)="close()">X</button>
      
      <swiper-container [loop]="true" [navigation]="true" [initialSlide]="currentIndex">
        @for (img of image; track img) {
          <swiper-slide>
            <img [src]="img" class="lightbox-img">
          </swiper-slide>
        }
      </swiper-container>
    </div>
  `,
  styles: [`
    .lightbox-content { position: relative; width: 90vw; height: 80vh; }
    .lightbox-img { width: 100%; height: 100%; object-fit: contain; }
    .close-btn { position: absolute; top: 10px; right: 10px; z-index: 10; cursor: pointer; color: white; background: none; border: none; font-size: 20px;}
    swiper-container { width: 100%; height: 100%; }
  `]
})
export class Lightbox {
  @Input() image: string[] = [];
  @Input() currentIndex: number = 0;
  @Input() overlayRef!: OverlayRef;

  next() {
    if (this.currentIndex < this.image.length - 1) {
      this.currentIndex++;
    } else {
      this.currentIndex = 0; // Loop back to start
    }
  }

  prev() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
    } else {
      this.currentIndex = this.image.length - 1; // Loop back to end
    }
  }

  @HostListener('window:keydown.escape', ['$event'])
  handleKeyboardEvent(event: any) {
    this.close();
  }

  public close(): void {
    if (this.overlayRef) {
      this.overlayRef.dispose();
    }
  }
}