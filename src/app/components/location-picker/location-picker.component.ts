import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';

/**
 * Interactive variant of PropertyMapComponent for the create-property
 * form. Same Leaflet base, but the marker is draggable and emits the
 * new coords on each drag end.
 *
 * Inputs:
 *   [lat] / [lng]  — pin location. Updates from the parent will move
 *                    the marker (e.g. after geocoding the typed address).
 *   [zoom]         — initial zoom. Defaults to 14.
 *
 * Output:
 *   (coordsChanged) — emits { lat, lng } whenever the user drags the
 *                     marker or clicks the map.
 *
 * Renders an instructional placeholder when lat/lng are null so the
 * user understands the map appears once they enter an address.
 */
@Component({
  selector: 'app-location-picker',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (lat != null && lng != null) {
      <div #mapEl class="picker-map" aria-label="Pin the property location"></div>
      <p class="picker-hint">
        Drag the pin to fine-tune the exact location, or click anywhere on the map to move it.
      </p>
    } @else {
      <div class="picker-placeholder">
        <span class="icon">📍</span>
        <p>Fill in <strong>city</strong>, <strong>pincode</strong>, or <strong>locality</strong>
           above and the map will pin the location automatically.</p>
      </div>
    }
  `,
  styles: [`
    .picker-map {
      width: 100%;
      height: 320px;
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid #e8eaed;
    }
    .picker-hint {
      margin-top: 8px;
      font-size: 0.78rem;
      color: #666;
      text-align: center;
    }
    .picker-placeholder {
      width: 100%;
      min-height: 160px;
      border-radius: 12px;
      border: 2px dashed #ccd;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 10px;
      color: #777;
      font-size: 0.88rem;
      text-align: center;
      padding: 20px;
      background: #fafafa;
    }
    .picker-placeholder .icon { font-size: 2rem; }
    .picker-placeholder p { margin: 0; max-width: 320px; line-height: 1.4; }
  `],
})
export class LocationPickerComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() lat: number | null | undefined;
  @Input() lng: number | null | undefined;
  @Input() zoom = 14;

  @Output() coordsChanged = new EventEmitter<{ lat: number; lng: number }>();

  @ViewChild('mapEl') mapEl?: ElementRef<HTMLDivElement>;

  private map?: L.Map;
  private marker?: L.Marker;

  ngAfterViewInit(): void {
    this.tryRenderMap();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // If lat/lng updated externally (e.g. address-geocode result came
    // back), move the marker WITHOUT re-creating the map — preserves
    // the user's current zoom/pan state.
    if ((changes['lat'] || changes['lng']) && this.map && this.marker
        && this.lat != null && this.lng != null) {
      const latlng: L.LatLngExpression = [this.lat, this.lng];
      this.marker.setLatLng(latlng);
      this.map.setView(latlng, this.map.getZoom());
      return;
    }

    // Or, if the map hadn't been created yet (coords were null on init)
    // and they're now available, build it.
    if ((changes['lat'] || changes['lng']) && !this.map) {
      // Wait for the next tick so #mapEl exists in the DOM after the
      // @if branch switches.
      setTimeout(() => this.tryRenderMap(), 0);
    }
  }

  ngOnDestroy(): void {
    this.map?.remove();
    this.map = undefined;
    this.marker = undefined;
  }

  private tryRenderMap(): void {
    if (this.lat == null || this.lng == null || !this.mapEl) return;
    if (this.map) return; // Already initialized.

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

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.map);

    this.marker = L.marker([this.lat, this.lng], {
      icon: defaultIcon,
      draggable: true,
    }).addTo(this.map);

    // Emit on drag end.
    this.marker.on('dragend', () => {
      const pos = this.marker!.getLatLng();
      this.coordsChanged.emit({ lat: pos.lat, lng: pos.lng });
    });

    // Also let users click anywhere on the map to move the pin.
    this.map.on('click', (e: L.LeafletMouseEvent) => {
      this.marker!.setLatLng(e.latlng);
      this.coordsChanged.emit({ lat: e.latlng.lat, lng: e.latlng.lng });
    });
  }
}
