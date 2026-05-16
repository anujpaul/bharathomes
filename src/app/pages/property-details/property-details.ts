import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { AsyncPipe, DecimalPipe, NgFor } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PropertyService } from '@/app/services/property-service';
import { Property, Agent, UserProfile } from '@/types';
import { Observable, forkJoin, switchMap } from 'rxjs';
import { LightboxService } from '@/app/services/lightbox-service';
import { AgentService } from '@/app/services/agent-service';
import { PropertyImageUploadComponent } from '@/app/components/property-image-upload.component/property-image-upload.component';
import { PropertyMapComponent } from '@/app/components/property-map/property-map.component';
import { FormsModule } from '@angular/forms';
import { AuthService } from '@/app/services/auth.service';
import { InrPricePipe } from '@/app/pipes/inr-price.pipe';
import { UserService } from '@/app/services/user-service';

/**
 * Row in the side-panel "people" list. Pulled together from `Agent` and
 * `UserProfile` (which have overlapping but not identical shapes). The two
 * boolean flags drive the badge shown in the template.
 */
interface Person {
  id: string;
  name: string;
  photo?: string;
  phone?: string;
  role?: string;
  rating?: number;
  listingsCount?: number;
  specialization?: string;
  isLister: boolean;
  isAgent: boolean;
}

@Component({
  selector: 'app-property-details',
  standalone: true,
  imports: [AsyncPipe, DecimalPipe, RouterLink, FormsModule, InrPricePipe, PropertyMapComponent],
  template: `
    @if (property$ | async; as property) {
    <div class="page-container">

      <!-- EDIT TOGGLE (only visible to agent/owner) -->
      @if (isOwner(property)) {
        <div class="edit-bar">
          <button class="edit-toggle" (click)="editMode = !editMode">
            {{ editMode ? '✕ Cancel' : '✏️ Edit Listing' }}
          </button>
          <button class="edit-toggle" (click)="deleteProperty()">
            {{'✕ Delete Listing' }}
          </button>
          @if (editMode && pendingChanges) {
            <button class="save-btn" (click)="saveChanges(property)">💾 Save Changes</button>
          }
        </div>
      }

      <div class="top-section text-gray-900">

        <!-- GALLERY -->
        <div class="gallery-container">
          <div class="hero-image">
            <!-- "Listed N days ago" pill + Apply CTA, overlaid on top-left
                 of the hero. Only renders when the backend supplied the
                 listedSince string. -->
            @if (property.listedSince) {
              <div class="hero-badges">
                <span class="badge-listed">{{ property.listedSince }} ago</span>
                <!-- <button type="button" class="badge-apply" (click)="applyInstantly(property)">
                  Apply instantly
                </button> -->
              </div>
            }
            @if (!isVideo(property.images[0])) {
              <img [src]="property.images[0]" (click)="openLightbox(property, 0)" alt="Main">
            }
            @else {
              <!--
                muted as an HTML attribute is only an INITIAL hint; once
                Angular sets [src] the browser may reset it. [muted]="true"
                drives the JS property on every change-detection pass, and
                the (loadedmetadata) handler re-asserts it after the video
                pipeline initialises — belt and suspenders for autoplay.
              -->
              <video #heroVid
                     controls autoplay loop playsinline preload="metadata"
                     [src]="property.images[0]"
                     [muted]="true"
                     (loadedmetadata)="heroVid.muted = true"
                     style="width:100%; height:320px; object-fit:cover;"></video>
            }
          </div>
          <div class="thumbnail-grid">
            @for (media of property.images.slice(1, 5); track media; let i = $index) {
              <div class="thumbnail-wrapper">
              @if (!isVideo(media)) {
                <img [src]="media" (click)="openLightbox(property, i + 1)" alt="Thumb">
              }@else {
                <video #thumbVid
                       autoplay loop playsinline
                       [src]="media"
                       [muted]="true"
                       (loadedmetadata)="thumbVid.muted = true"
                       (click)="openLightbox(property, i + 1)"
                       style="width:100%; height:140px; object-fit:cover; cursor:pointer;"></video>
              }
                @if (i === 3 && property.images.length > 5) {
                  <div class="more-overlay" (click)="openLightbox(property, 5); $event.stopPropagation()">
                    <span>+{{ property.images.length - 5 }}</span>
                  </div>
                }
                <!-- DELETE BUTTON in edit mode -->
                @if (editMode) {
                  <button class="delete-img-btn" (click)="removeImage(property, media); $event.stopPropagation()">✕</button>
                  <button class="set-hero-btn" (click)="setAsHero(property, media); $event.stopPropagation()" title="Set as main image">★</button>
                }
                
              </div>
            }
          </div>

          <!-- UPLOAD ZONE in edit mode -->
          @if (editMode) {
            <div class="upload-zone" (click)="fileInput.click()" (dragover)="$event.preventDefault()" (drop)="onDrop($event, property)">
              <input #fileInput type="file" multiple accept="image/*, video/*" style="display:none" (change)="onFileSelect($event, property)">
              <div class="upload-prompt ">
                @if (uploading ) {
                  
                  <span>Uploading...</span>
                } @else {
                  <span>📁 Click or drag images to upload</span>
                }
              </div>
            </div>
          }

          <!-- Map section. Renders directly under the gallery in the
               left column. PropertyMapComponent handles the null-coords
               case internally, so we always render the wrapper. -->
          <div class="map-section">
            <h3 class="map-heading">Location</h3>
            <app-property-map [lat]="property.latitude" [lng]="property.longitude"></app-property-map>
          </div>
        </div>

        <!-- SIDE PANEL -->
        <div class="side-panel">

          <!-- Editable price -->
          @if (editMode) {
            <input class="edit-input price-input" type="number" [(ngModel)]="editData.price" (ngModelChange)="pendingChanges = true" placeholder="Price">
          } @else {
            <div class="price-tag">
              {{ property.price | inrPrice }}<!--
              -->@if (isRent(property)) {<span class="price-suffix"> / month</span>}
            </div>
          }

          <!-- Editable title -->
          @if (editMode) {
            <input class="edit-input" type="text" [(ngModel)]="editData.title" (ngModelChange)="pendingChanges = true" placeholder="Title">
          } @else {
            <h2 class="property-title">{{ property.title }}</h2>
          }

          <div class="divider"></div>

          <div class="detail-row">
            <span class="detail-icon">📍</span>
            <div>
              <div class="detail-label">Address</div>
              <div class="detail-value">{{ property.location }}, {{ property.city }}</div>
            </div>
          </div>

          <div class="detail-row">
            <span class="detail-icon">📐</span>
            <div>
              <div class="detail-label">Size</div>
              <div class="detail-value">{{ property.sqft }} sq.ft</div>
            </div>
          </div>

          <div class="divider"></div>

          <div class="specs-row">
            <div class="spec-item">
              <div class="spec-value">{{ property.beds }}</div>
              <div class="spec-label">Beds</div>
            </div>
            <div class="spec-divider"></div>
            <div class="spec-item">
              <div class="spec-value">{{ property.baths }}</div>
              <div class="spec-label">Baths</div>
            </div>
            <div class="spec-divider"></div>
            <div class="spec-item">
              <div class="spec-value">{{ property.sqft }}</div>
              <div class="spec-label">Sq.ft</div>
            </div>
          </div>
          
          @if (property?.builtYear || property?.listingIntent) {  
          <div class="divider"></div>
          
          <div class="specs-row">
          @if (property?.builtYear){
            <div class="spec-item">
              <div class="spec-value">{{ property.builtYear }}</div>
              <div class="spec-label">Built Year</div>
          </div>
          }
            <div class="spec-divider"></div>
          
            @if (property?.listingIntent) {
            <div class="spec-item">
              <div class="spec-value">{{ property.listingIntent }}</div>
              <div class="spec-label">Listed for</div>
            </div>
            }
            <!-- } -->
            <!-- <div class="spec-divider"></div> -->
            <!-- <div class="spec-item">
              <div class="spec-value">{{ property.sqft }}</div>
              <div class="spec-label">Sq.ft</div>
            </div> -->
          </div>
          }

          <div class="divider"></div> 

          <!-- AGENTS + LISTER SECTION -->
          <div class="lister-section">
            <div class="section-label">
              {{ people.length > 1 ? 'Contacts' : 'Listed By' }}
            </div>
            @if (agentsLoading) {
              <div class="agents-loading">
                <div class="skeleton-agent"></div>
              </div>
            }
            @if (!agentsLoading) {
              @for (p of people; track p.id) {
                <div class="agent-card">
                  <img class="agent-photo" [src]="p.photo" [alt]="p.name">
                  <div class="agent-info">
                    <div class="agent-name-row">
                      <span class="agent-name">{{ p.name }}</span>
                      @if (p.isLister && p.isAgent) {
                        <span class="badge badge-combined">Lister · Agent</span>
                      } @else if (p.isLister) {
                        <span class="badge badge-lister">Lister</span>
                      } @else {
                        <span class="badge badge-agent">Agent</span>
                      }
                    </div>
                    @if (p.role) { <div class="agent-role">{{ p.role }}</div> }
                    <div class="agent-meta">
                      @if (p.rating != null && p.rating > 0) {
                        <span class="agent-rating">⭐ {{ p.rating }}</span>
                      }
                      @if (p.rating != null && p.rating > 0 && p.listingsCount) {
                        <span class="agent-dot">·</span>
                      }
                      @if (p.listingsCount) {
                        <span class="agent-listings">{{ p.listingsCount }} listings</span>
                      }
                    </div>
                    @if (p.specialization) {
                      <div class="agent-specialization">{{ p.specialization }}</div>
                    }
                    @if (p.phone) {
                      <a class="agent-phone" [href]="'tel:' + p.phone">📞 {{ p.phone }}</a>
                    }
                  </div>
                </div>
              }
            }
          </div>

        </div>
      </div>
    </div>
    }
  `,
  styles: [`
    /* PAGE */
    .page-container { max-width: 1200px; margin: 0 auto; padding: 20px; }
    .top-section { display: flex; gap: 24px; align-items: flex-start; }
  
    /* GALLERY */
    .gallery-container { flex: 1 1 0; min-width: 0; display: flex; flex-direction: column; gap: 10px; }
    /* position: relative so the badges can absolute-position over the
       hero image/video. */
    .hero-image { position: relative; }
    .hero-image img { width: 100%; height: 320px; object-fit: cover; border-radius: 10px; cursor: pointer; display: block; }

    /* Overlay pills (top-left of hero) — listing age + Apply CTA. */
    .hero-badges {
      position: absolute;
      top: 12px;
      left: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
      z-index: 5;
      pointer-events: none; /* Let clicks through to the hero by default */
    }
    .badge-listed,
    .badge-apply {
      pointer-events: auto; /* Re-enable for the pills themselves */
      font-size: 0.78rem;
      font-weight: 600;
      padding: 6px 12px;
      border-radius: 9999px;
      line-height: 1;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    }
    .badge-listed {
      background: rgba(255, 255, 255, 0.95);
      color: #1a1a2e;
      backdrop-filter: blur(4px);
    }
    .badge-apply {
      background: #2c7be5;
      color: #fff;
      border: none;
      cursor: pointer;
      transition: background 0.15s ease;
    }
    .badge-apply:hover { background: #1a63c5; }
    .thumbnail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .thumbnail-wrapper { position: relative; cursor: pointer; }
    .thumbnail-wrapper img { width: 100%; height: 140px; object-fit: cover; border-radius: 8px; display: block; }
    .more-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.6); color: white; display: flex; align-items: center; justify-content: center; font-size: 1.4rem; font-weight: bold; border-radius: 8px; }
  
    /* SIDE PANEL */
    .side-panel { width: 300px; flex-shrink: 0; background: #fff; border: 1px solid #e8eaed; border-radius: 12px; padding: 20px; box-shadow: 0 2px 12px rgba(0,0,0,0.07); display: flex; flex-direction: column; gap: 14px; }
    .price-tag { font-size: 1.5rem; font-weight: 700; color: #1a1a2e; }
    .price-suffix { font-size: 0.95rem; font-weight: 500; color: #666; }
    .property-title { font-size: 1rem; font-weight: 500; color: #444; margin: 0; line-height: 1.4; }
    .divider { height: 1px; background: #f0f0f0; }
    .detail-row { display: flex; align-items: flex-start; gap: 10px; }
    .detail-icon { font-size: 1.1rem; margin-top: 2px; }
    .detail-label { font-size: 0.72rem; color: #999; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 2px; }
    .detail-value { font-size: 0.92rem; color: #2c2c2c; font-weight: 500; }
    .specs-row { display: flex; align-items: center; justify-content: space-between; }
    .spec-item { flex: 1; text-align: center; }
    .spec-value { font-size: 1.2rem; font-weight: 700; color: #1a1a2e; }
    .spec-label { font-size: 0.72rem; color: #999; text-transform: uppercase; letter-spacing: 0.04em; }
    .spec-divider { width: 1px; height: 36px; background: #ebebeb; }
  
    /* AGENTS */
    .lister-section { display: flex; flex-direction: column; gap: 12px; }
    .section-label { font-size: 0.72rem; color: #999; text-transform: uppercase; letter-spacing: 0.05em; }
    .agent-card { display: flex; gap: 12px; align-items: flex-start; padding: 12px; background: #f8f9fa; border-radius: 10px; }
    .agent-photo { width: 52px; height: 52px; border-radius: 50%; object-fit: cover; flex-shrink: 0; background: #e0e0e0; }
    .agent-info { display: flex; flex-direction: column; gap: 2px; min-width: 0; flex: 1; }
    .agent-name-row { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
    .agent-name { font-size: 0.95rem; font-weight: 600; color: #1a1a2e; }
    .agent-role { font-size: 0.78rem; color: #888; }
    .agent-meta { display: flex; align-items: center; gap: 4px; font-size: 0.78rem; color: #666; margin-top: 2px; }
    .agent-dot { color: #ccc; }
    .agent-specialization { font-size: 0.75rem; color: #aaa; font-style: italic; }
    .agent-phone { font-size: 0.82rem; color: #2c7be5; text-decoration: none; margin-top: 4px; }
    .agent-phone:hover { text-decoration: underline; }

    /* ROLE BADGES */
    .badge { font-size: 0.65rem; font-weight: 700; padding: 2px 7px; border-radius: 999px; text-transform: uppercase; letter-spacing: 0.04em; line-height: 1.4; }
    .badge-lister   { background: #ecfdf5; color: #047857; }
    .badge-agent    { background: #eff6ff; color: #1d4ed8; }
    .badge-combined { background: #fef3c7; color: #92400e; }
  
    /* SKELETON */
    .agents-loading { display: flex; flex-direction: column; gap: 10px; }
    .skeleton-agent { height: 72px; border-radius: 10px; background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; }
    @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
  
    /* EDIT BAR */
    .edit-bar { display: flex; gap: 10px; margin-bottom: 16px; align-items: center; }
    .edit-toggle { padding: 8px 16px; border-radius: 8px; border: 1.5px solid #2c7be5; color: #2c7be5; background: #fff; cursor: pointer; font-size: 0.9rem; font-weight: 500; }
    .edit-toggle:hover { background: #f0f6ff; }
    .save-btn { padding: 8px 16px; border-radius: 8px; border: none; background: #2c7be5; color: #fff; cursor: pointer; font-size: 0.9rem; font-weight: 500; }
    .save-btn:hover { background: #1a63c5; }
  
    /* EDIT INPUTS */
    .edit-input { width: 100%; padding: 8px 10px; border: 1.5px solid #2c7be5; border-radius: 8px; font-size: 0.95rem; outline: none; box-sizing: border-box; }
    .price-input { font-size: 1.3rem; font-weight: 700; color: #1a1a2e; }
  
    /* DELETE IMAGE BUTTON */
    .delete-img-btn { position: absolute; top: 6px; right: 6px; background: rgba(220,38,38,0.85); color: white; border: none; border-radius: 50%; width: 24px; height: 24px; cursor: pointer; font-size: 0.75rem; display: flex; align-items: center; justify-content: center; z-index: 10; }
  
    /* UPLOAD ZONE */
    .upload-zone { border: 2px dashed #2c7be5; border-radius: 10px; padding: 20px; text-align: center; cursor: pointer; color: #2c7be5; font-size: 0.9rem; margin-top: 4px; }
    .upload-zone:hover { background: #f0f6ff; }

    /* Map section sits in the gallery column under the thumbnails. */
    .map-section { margin-top: 16px; }
    .map-heading {
      font-size: 0.95rem;
      font-weight: 700;
      color: #1a1a2e;
      margin: 0 0 10px 0;
    }
    .set-hero-btn {
      position: absolute;
      bottom: 6px;
      right: 6px;
      background: rgba(255, 215, 0, 0.85);
      color: #333;
      border: none;
      border-radius: 50%;
      width: 24px;
      height: 24px;
      cursor: pointer;
      font-size: 0.9rem;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10;
      font-weight: bold;
    }
    .set-hero-btn:hover {
      background: rgba(255, 200, 0, 1);
    }
  
    /* RESPONSIVE */
    @media (max-width: 768px) {
      .top-section { flex-direction: column; }
      .side-panel { width: 100%; }
      .hero-image img { height: 240px; }
      .thumbnail-wrapper img { height: 100px; }
    }
  `]
})
export class PropertyDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private propertyService = inject(PropertyService);
  private lightboxService = inject(LightboxService);
  private agentService = inject(AgentService);
  private authService = inject(AuthService);
  private userService = inject(UserService);


  property$!: Observable<Property>;
  agents: Agent[] = [];
  agentsLoading = false;
  editMode = false;
  uploading = false;
  pendingChanges = false;
  currentUser = this.authService.authResponse; // signal or property from your auth service
  listerId = '';
  lister: UserProfile | null = null;
  deleteListing: false | (() => void) = false;
  isVideo(url: string): boolean {
    // Match the extension whether the URL ends there or has a query string
    // (SAS tokens append `?sp=...&sig=...`).
    return /\.(mp4|webm|ogg|mov|avi|mkv|m4v)(\?|$)/i.test(url);
  }

  /**
   * Placeholder for the "Apply instantly" CTA on the hero. Wire this up
   * when the apply/enquiry flow exists — e.g. open a contact-agent modal,
   * navigate to /apply/{propertyId}, or post directly to a leads endpoint.
   * Kept as a stub so the button doesn't throw on click today.
   */
  // applyInstantly(property: Property) {
  //   console.log('Apply instantly clicked for property', property.id);
  //   // TODO: open enquiry modal / route to /apply/:id
  // }

  /**
   * Case-insensitive intent check. At least one row in the DB has "Rent"
   * with a capital R because the normalization in PropertyService was
   * added later — comparing lowercased on every read defends against any
   * pre-normalization rows and any future inconsistency.
   */
  isRent(property: Property): boolean {
    return property?.listingIntent?.toLowerCase() === 'rent';
  }

  /**
   * Unified people list shown in the side panel.
   *
   * Behaviour:
   *  - Always include every agent attached to the property.
   *  - Also include the lister as a separate entry, *unless* the lister is
   *    already one of the agents (matched by id) — in that case we just mark
   *    that agent's card with a "Lister · Agent" badge instead of showing
   *    them twice.
   *  - Each entry carries `isLister` / `isAgent` flags so the template can
   *    render the right badge without further branching.
   *
   * Recomputed on every change-detection cycle. That's fine — `agents` and
   * `lister` are tiny per-page arrays, so doing the merge here keeps the
   * single-source-of-truth in one place rather than spread across template
   * conditions.
   */
  get people(): Person[] {
    const agentList = this.agents ?? [];
    const lister = this.lister;
    const listerIsAgent = !!lister && agentList.some(a => a.id === lister.id);

    const fromAgents: Person[] = agentList.map(a => ({
      id: a.id,
      name: a.name,
      photo: a.userPhoto,
      phone: a.phone,
      role: a.role,
      rating: a.rating,
      listingsCount: a.listingsCount,
      specialization: a.specialization,
      isAgent: true,
      // Mark the matching agent as lister too — drives the combined badge.
      isLister: !!lister && a.id === lister.id,
    }));

    if (lister && !listerIsAgent) {
      fromAgents.push({
        id: lister.id,
        name: lister.name,
        photo: lister.userPhoto,
        phone: lister.phone,
        role: lister.userRole,
        rating: lister.rating,
        listingsCount: lister.listingsCount,
        isAgent: false,
        isLister: true,
      });
    }

    return fromAgents;
  }
  // editData: Partial<Property> = {};
  editData: Property = {} as Property;
  private cdr = inject(ChangeDetectorRef);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    this.agentsLoading = true;
    this.property$ = this.propertyService.getPropertyById(id);

    this.propertyService.getPropertyById(id).subscribe({
      next: (property) => {
        console.log('images:', property.images);
        console.log('isVideo per item:', property.images.map(u => ({ url: u, isVideo: this.isVideo(u) })));
        this.agents = property.agents ?? [];
        this.agentsLoading = false;
        if (property.listerId) {
          this.userService.getUserProfileById(property.listerId).subscribe({
            next: (lister) => this.lister = lister
          });
        }
        
        // Seed edit data with current values
        // // this.editData = { title: property.title, price: property.price };
        // this.editData = property;
        // this.editData.images = [];
        // this.editData.amenities = [];

        this.editData ={...property };


      },
      error: () => { this.agentsLoading = false; }
    });

    

  }

  /**
   * "Owner" here means the user who created the listing — i.e. the lister.
   * Only they should see the edit toggle.
   *
   * Earlier this was comparing user.id to the agents list, which meant the
   * actual lister (who isn't necessarily an agent on the property) couldn't
   * edit their own listing, while every co-listed agent could. Flipped to
   * a direct listerId match.
   */
  isOwner(property: Property): boolean {
    const user = this.currentUser();
    if (!user) return false;
    return !!property.listerId && property.listerId === user.id;
  }

  saveChanges(property: Property) {
    if (!this.pendingChanges) return;

    const cleanData: any = { ...this.editData };

    delete cleanData.images;
    delete cleanData.agents;
    delete cleanData.amenities;

    this.propertyService.updateProperty(property.id, cleanData).subscribe({
      next: () => {
        this.pendingChanges = false;
        this.editMode = false;
        this.cdr.detectChanges();
        // Refresh the property
        this.property$ = this.propertyService.getPropertyById(property.id);
      }
    });
  }

  removeImage(property: Property, imageUrl: string) {
    this.propertyService.deleteImage(property.id, imageUrl).subscribe({
      next: () => {
        this.property$ = this.propertyService.getPropertyById(property.id);
      }
    });
  }

  onFileSelect(event: Event, property: Property) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    this.uploadFiles(Array.from(input.files), property);
  }

  onDrop(event: DragEvent, property: Property) {
    event.preventDefault();
    const files = Array.from(event.dataTransfer?.files ?? []).filter(f => f.type.startsWith('image/') || f.type.startsWith('video/'));
    if (files.length) this.uploadFiles(files, property);
  }

  private uploadFiles(files: File[], property: Property) {
    this.uploading = true;

    this.propertyService.uploadImages(property.id, files).subscribe({
      next: () => {
        this.uploading = false;
        this.property$ = this.propertyService.getPropertyById(property.id);
        this.property$.subscribe(p => {
          this.editData = { ...p };   // keep editData in sync
          this.cdr.detectChanges();
        });

      },
      error: () => { this.uploading = false; }
    });
  }

  openVideoModal(videoUrl: string) {
    // Option 1: Open in a new tab
    window.open(videoUrl, '_blank');
    
    // Option 2: Use a simple alert or custom modal
    // alert(`Play video: ${videoUrl}`);
  }
  
  setAsHero(property: Property, imageUrl: string) {
    // Find current index of the target image
    const currentImages = [...property.images];
    const index = currentImages.findIndex(url => url === imageUrl);
    if (index === -1 || index === 0) return;
  
    // Move the target to the front
    const [moved] = currentImages.splice(index, 1);
    currentImages.unshift(moved);
  
    // Update SortOrder on the backend for all images
    const updatedImages = currentImages.map((url, idx) => ({ url, sortOrder: idx }));
    
    this.propertyService.reorderImages(property.id, updatedImages).subscribe({
      next: () => {
        // Refresh the property
        this.property$ = this.propertyService.getPropertyById(property.id);
        this.property$.subscribe(p => {
          this.editData = { ...p };
          this.cdr.detectChanges();
        });
      }
    });
  }

  deleteProperty() {
    if (!confirm('Are you sure you want to delete this listing? This action cannot be undone.')) return;
    this.propertyService.deleteProperty(this.route.snapshot.paramMap.get('id')!).subscribe({
      next: () => {
        alert('Listing deleted successfully.');
        // Navigate back to homepage or listings page after deletion
        window.location.href = '/';
      },
      error: () => {
        alert('Failed to delete the listing. Please try again later.');
      }
    });
  }

  // Pass the full media array (images AND videos). The Lightbox component
  // branches on isVideo internally and renders <video> for video URLs.
  openLightbox(property: Property, index: number) {
    if (!property.images?.length) return;
    const safeIndex = Math.max(0, Math.min(index, property.images.length - 1));
    this.lightboxService.open(property.images, safeIndex);
  }
}