import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';

/**
 * Renders a small Leaflet map with a single marker at the property's
 * coordinates. Self-contained: no map service needed, no state outside
 * this component.
 *
 * Notes:
 *   - Renders nothing when [lat] or [lng] is null — the parent should
 *     simply omit this component for unmapped properties, but the guard
 *     here means accidental empty inputs degrade gracefully.
 *   - Re-creates the map if [lat]/[lng] inputs change (rare in practice
 *     but cheap and makes the component reactive).
 *   - Uses Leaflet's bundled default icon. Without the iconUrl/shadowUrl
 *     overrides, Webpack/Vite asset bundling can fail to find the marker
 *     PNGs and you get the dreaded "marker is a broken image" bug.
 */
@Component({
  selector: 'app-property-map',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (lat != null && lng != null) {
      <div #mapEl class="property-map" aria-label="Property location map"></div>
    } @else {
      <div class="property-map-placeholder">
        Map location is not available for this property yet.
      </div>
    }
  `,
  styles: [`
    .property-map {
      width: 100%;
      height: 280px;
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid #e8eaed;
    }
    .property-map-placeholder {
      width: 100%;
      height: 80px;
      border-radius: 12px;
      border: 1px dashed #ddd;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #888;
      font-size: 0.85rem;
      background: #fafafa;
    }
  `],
})
export class PropertyMapComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() lat: number | null | undefined;
  @Input() lng: number | null | undefined;
  /** Optional: tweak per-instance. Default 14 is good for "street-level". */
  @Input() zoom = 14;

  @ViewChild('mapEl') mapEl?: ElementRef<HTMLDivElement>;

  private map?: L.Map;

  ngAfterViewInit(): void {
    this.tryRenderMap();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // If lat/lng become available (or change) AFTER initial render —
    // e.g. async API response landed late — (re-)build the map.
    if ((changes['lat'] || changes['lng']) && this.mapEl) {
      this.destroyMap();
      this.tryRenderMap();
    }
  }

  ngOnDestroy(): void {
    this.destroyMap();
  }

  private tryRenderMap(): void {
    if (this.lat == null || this.lng == null || !this.mapEl) return;

    // Tell Leaflet where to find its marker assets. With Webpack/Vite
    // asset bundling, Leaflet's default _getIconUrl logic breaks and
    // produces 404s for marker-icon.png / marker-shadow.png. Pointing
    // it at the CDN avoids needing to copy assets into the build.
    const iconBase = 'https://unpkg.com/leaflet@1.9.4/dist/images';
    const defaultIcon = L.icon({
      iconUrl:        `${iconBase}/marker-icon.png`,
      iconRetinaUrl:  `${iconBase}/marker-icon-2x.png`,
      shadowUrl:      `${iconBase}/marker-shadow.png`,
      iconSize:    [25, 41],
      iconAnchor:  [12, 41],
      popupAnchor: [1, -34],
      shadowSize:  [41, 41],
    });

    this.map = L.map(this.mapEl.nativeElement).setView(
      [this.lat, this.lng],
      this.zoom
    );

    // OpenStreetMap tiles. Free, no API key. Attribution is required
    // by the OSM tile policy.
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.map);

    L.marker([this.lat, this.lng], { icon: defaultIcon }).addTo(this.map);
  }

  private destroyMap(): void {
    if (this.map) {
      this.map.remove();
      this.map = undefined;
    }
  }
}
