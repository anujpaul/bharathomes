import { OverlayRef } from '@angular/cdk/overlay';
import { CommonModule } from '@angular/common';
import { Component, HostListener, Input } from '@angular/core';

@Component({
  selector: 'app-lightbox',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
    <button (click)="close()" class="absolute top-4 right-4 text-white text-xl z-10">Close</button>
    
    <button (click)="prev()" class="absolute left-4 text-white text-4xl">❮</button>
    
    <img [src]="image[currentIndex]" class="max-w-full max-h-[80vh] object-contain transition-all" />
    
    <button (click)="next()" class="absolute right-4 text-white text-4xl">❯</button>
  </div>
  `,
  styles: ``,
})
export class Lightbox {
  @Input() image: string[] = [];
  @Input() currentIndex: number = 0;
  public overlayRef!: OverlayRef;

  public next(): void {
    if (this.currentIndex < this.image.length - 1) {
      this.currentIndex++;
    } else {
      this.currentIndex = 0; // Loop back to start
    }
  }

  public prev(): void {
    if (this.currentIndex > 0) {
      this.currentIndex--;
    } else {
      this.currentIndex = this.image.length - 1; // Loop to end
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