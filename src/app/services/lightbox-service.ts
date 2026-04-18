import { Lightbox } from '../components/lightbox/lightbox';
import { Injectable } from '@angular/core';
import { Overlay } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';

@Injectable({ providedIn: 'root' })
export class LightboxService {
  constructor(private overlay: Overlay) {}

  open(image: string[], startIndex: number) {
    const overlayRef = this.overlay.create({
      positionStrategy: this.overlay.position().global().centerHorizontally().centerVertically(),
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-dark-backdrop'
    });

    // Attach a component that renders the full-screen carousel
    const portal = new ComponentPortal(Lightbox);
    const componentRef = overlayRef.attach(portal);
    
    // Pass data to the modal
    componentRef.instance.image = image;
    componentRef.instance.currentIndex = startIndex;
    
    componentRef.instance.overlayRef = overlayRef;
    // Close on backdrop click
    overlayRef.backdropClick().subscribe(() => overlayRef.dispose());
  }
}