import { OverlayRef } from '@angular/cdk/overlay';
import { CommonModule } from '@angular/common';
import { Component, HostListener, Input, CUSTOM_ELEMENTS_SCHEMA, ViewChild, AfterViewInit, ElementRef, ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-lightbox',
  standalone: true,
  imports: [CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div class="lightbox-content" [style.opacity]="isReady ? 1 : 0">
    @if (!isReady) {
    <div class="loader">Loading...</div>
  }
      <button class="close-btn" (click)="close()">X</button>
      
      <swiper-container #swiperContainer
        [loop]="true"
        [navigation]="true">
        @for (item of image; track item) {
          <swiper-slide>
            @if (isVideo(item)) {
              <video [src]="item" controls playsinline preload="metadata"
                     class="lightbox-video"></video>
            } @else {
              <img [src]="item" class="lightbox-img">
            }
          </swiper-slide>
        }
      </swiper-container>
    </div>
  `,
  styles: [`
    .lightbox-content { position: relative; width: 90vw; height: 80vh; }
    .lightbox-img { width: 100%; height: 100%; object-fit: contain; }
    .lightbox-video { width: 100%; height: 100%; object-fit: contain; background: #000; }
    .close-btn { position: absolute; top: 10px; right: 10px; z-index: 10; cursor: pointer; color: white; background: none; border: none; font-size: 20px;}
    swiper-container { width: 100%; height: 100%; }
  `]
})
export class Lightbox implements AfterViewInit {
  @Input() image: string[] = [];
  @Input() currentIndex: number = 0;
  @Input() overlayRef!: OverlayRef;

  isReady = false;
  // 1. Reference the container
  @ViewChild('swiperContainer') swiperContainer!: ElementRef;

  constructor(private cdr: ChangeDetectorRef) {}

  ngAfterViewInit() {
    // 2. Wait for the browser to render the web component
    setTimeout(() => {
      const swiperEl = this.swiperContainer.nativeElement;

      // 3. Force the slide to the index
      if (swiperEl && swiperEl.swiper) {
        swiperEl.swiper.slideTo(this.currentIndex, 0);
      } else {
        // Fallback for some environments
        swiperEl.initialSlide = this.currentIndex;
      }

      // Pause every <video> when navigating away — otherwise audio keeps
      // playing offscreen and the next slide becomes confusing.
      swiperEl.addEventListener('slidechange', () => {
        const videos: NodeListOf<HTMLVideoElement> = swiperEl.querySelectorAll('video');
        videos.forEach(v => { if (!v.paused) v.pause(); });
      });

      this.isReady = true;
      this.cdr.detectChanges();
    }, 100);
  }

  isVideo(url: string): boolean {
    return /\.(mp4|webm|ogg|mov|avi|mkv|m4v)(\?|$)/i.test(url);
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