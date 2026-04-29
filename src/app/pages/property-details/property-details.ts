import { Component, inject, OnInit } from '@angular/core';
import { AsyncPipe, DecimalPipe, NgFor } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { PropertyService } from '@/app/services/property-service';
import { Property, Agent } from '@/types';
import { Observable, forkJoin, switchMap } from 'rxjs';
import { LightboxService } from '@/app/services/lightbox-service';
import { AgentService } from '@/app/services/agent-service';

@Component({
  selector: 'app-property-details',
  standalone: true,
  imports: [AsyncPipe, DecimalPipe],
  template: `
    @if (property$ | async; as property) {
    <div class="page-container">
      <div class="top-section">

        <!-- GALLERY -->
        <div class="gallery-container">
          <div class="hero-image">
            <img [src]="property.images[0]" (click)="openLightbox(property, 0)" alt="Main">
          </div>
          <div class="thumbnail-grid">
            @for (img of property.images.slice(1, 5); track img; let i = $index) {
              <div class="thumbnail-wrapper">
                <img [src]="img" (click)="openLightbox(property, i + 1)" alt="Thumb">
                @if (i === 3 && property.images.length > 5) {
                  <div class="more-overlay" (click)="openLightbox(property, 5); $event.stopPropagation()">
                    <span>+{{ property.images.length - 5 }}</span>
                  </div>
                }
              </div>
            }
          </div>
        </div>

        <!-- SIDE PANEL -->
        <div class="side-panel">
          <div class="price-tag">₹ {{ property.price | number:'1.0-0' }}</div>
          <h2 class="property-title">{{ property.title }}</h2>

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

          <div class="divider"></div>

          <!-- AGENTS SECTION -->
          <div class="agents-section">
            <div class="section-label">Listed By</div>

            @if (agentsLoading) {
              <div class="agents-loading">
                <div class="skeleton-agent"></div>
                <div class="skeleton-agent"></div>
              </div>
            }

            @if (!agentsLoading) {
              @for (agent of agents; track agent.id) {
                <div class="agent-card">
                  <img class="agent-photo" [src]="agent.userPhoto" [alt]="agent.name">
                  <div class="agent-info">
                    <div class="agent-name">{{ agent.name }}</div>
                    <div class="agent-role">{{ agent.role }}</div>
                    <div class="agent-meta">
                      <span class="agent-rating">⭐ {{ agent.rating }}</span>
                      <span class="agent-dot">·</span>
                      <span class="agent-listings">{{ agent.listingsCount }} listings</span>
                    </div>
                    <div class="agent-specialization">{{ agent.specialization }}</div>
                    <a class="agent-phone" [href]="'tel:' + agent.phone">📞 {{ agent.phone }}</a>
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
    .page-container { max-width: 1200px; margin: 0 auto; padding: 20px; }

    .top-section { display: flex; gap: 24px; align-items: flex-start; }

    /* GALLERY */
    .gallery-container { flex: 1 1 0; min-width: 0; display: flex; flex-direction: column; gap: 10px; }
    .hero-image img { width: 100%; height: 320px; object-fit: cover; border-radius: 10px; cursor: pointer; display: block; }
    .thumbnail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .thumbnail-wrapper { position: relative; cursor: pointer; }
    .thumbnail-wrapper img { width: 100%; height: 140px; object-fit: cover; border-radius: 8px; display: block; }
    .more-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.6); color: white; display: flex; align-items: center; justify-content: center; font-size: 1.4rem; font-weight: bold; border-radius: 8px; }

    /* SIDE PANEL */
    .side-panel { width: 300px; flex-shrink: 0; background: #fff; border: 1px solid #e8eaed; border-radius: 12px; padding: 20px; box-shadow: 0 2px 12px rgba(0,0,0,0.07); display: flex; flex-direction: column; gap: 14px; }
    .price-tag { font-size: 1.5rem; font-weight: 700; color: #1a1a2e; }
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
    .agents-section { display: flex; flex-direction: column; gap: 12px; }
    .section-label { font-size: 0.72rem; color: #999; text-transform: uppercase; letter-spacing: 0.05em; }

    .agent-card { display: flex; gap: 12px; align-items: flex-start; padding: 12px; background: #f8f9fa; border-radius: 10px; }
    .agent-photo { width: 52px; height: 52px; border-radius: 50%; object-fit: cover; flex-shrink: 0; }
    .agent-info { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
    .agent-name { font-size: 0.95rem; font-weight: 600; color: #1a1a2e; }
    .agent-role { font-size: 0.78rem; color: #888; }
    .agent-meta { display: flex; align-items: center; gap: 4px; font-size: 0.78rem; color: #666; margin-top: 2px; }
    .agent-dot { color: #ccc; }
    .agent-specialization { font-size: 0.75rem; color: #aaa; font-style: italic; }
    .agent-phone { font-size: 0.82rem; color: #2c7be5; text-decoration: none; margin-top: 4px; }
    .agent-phone:hover { text-decoration: underline; }

    /* Skeleton loader */
    .agents-loading { display: flex; flex-direction: column; gap: 10px; }
    .skeleton-agent { height: 72px; border-radius: 10px; background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; }
    @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
  `]
})
export class PropertyDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private propertyService = inject(PropertyService);
  private lightboxService = inject(LightboxService);
  private agentService = inject(AgentService);
  

  property$!: Observable<Property>;
  agents: Agent[] = [];
  agentsLoading = false;

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.property$ = this.propertyService.getPropertyById(id);

      // Fetch property once to get agentIds, then fetch all agents in parallel
      this.propertyService.getPropertyById(id).subscribe(property => {
        this.agentsLoading = true;
        const requests = property.agentId.map(aid => this.agentService.getAgent(aid));
        forkJoin(requests).subscribe({
          next: (agents) => { this.agents = agents; this.agentsLoading = false; },
          error: () => { this.agentsLoading = false; }
        });
      });
    }
  }

  openLightbox(property: Property, index: number) {
    this.lightboxService.open(property.images, index);
  }
}