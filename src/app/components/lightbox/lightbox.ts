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
              <video autoplay muted loop [src]="item" controls playsinline preload="metadata"
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

    /* Swiper customization.
       The defaults are 44px theme-blue arrows — too loud against a photo.
       Override two CSS variables Swiper reads internally, then use ::part()
       (Swiper exposes button-prev/button-next as shadow parts) to draw a
       small white arrow inside a circular semi-transparent backdrop. */
    swiper-container {
      width: 100%;
      height: 100%;
      --swiper-navigation-size: 18px;
      --swiper-navigation-color: #fff;
      --swiper-pagination-color: #fff;
    }
    swiper-container::part(button-prev),
    swiper-container::part(button-next) {
      width: 40px;
      height: 40px;
      background: rgba(0, 0, 0, 0.45);
      border-radius: 50%;
      backdrop-filter: blur(6px);
      -webkit-backdrop-filter: blur(6px);
      transition: background 0.15s ease, transform 0.15s ease;
    }
    swiper-container::part(button-prev):hover,
    swiper-container::part(button-next):hover {
      background: rgba(0, 0, 0, 0.7);
      transform: scale(1.05);
    }
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