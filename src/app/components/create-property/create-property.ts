import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PropertyService } from '@/app/services/property-service';
import { AuthService } from '@/app/services/auth.service';
import { debounceTime, filter, forkJoin, map, switchMap } from 'rxjs';
import { VastuOrientation } from '@/types';

const AMENITIES_OPTIONS = [
  'Swimming Pool', 'Gym', 'Parking', 'Security', 'Power Backup',
  'Lift', 'Garden', 'Clubhouse', "Children's Play Area", 'CCTV',
  'Intercom', 'Water Supply', 'Gas Pipeline', 'Modular Kitchen', 'Terrace',
];

@Component({
  selector: 'app-create-property',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  template: `
    <div class="page-wrapper">

      <!-- HEADER BREADCRUMB -->
      <div class="page-header">
        <a class="back-link" routerLink="/properties">← Back to Listings</a>
        <div class="header-titles">
          <h1 class="page-title">List a New Property</h1>
          <p class="page-subtitle">Fill in the details below to publish your listing</p>
        </div>
        <!-- STEP INDICATOR -->
        <div class="step-track">
          @for (step of steps; track step.id) {
            <div class="step-node" [class.active]="currentStep() === step.id" [class.done]="currentStep() > step.id" (click)="goToStep(step.id)">
              <div class="step-dot">
                @if (currentStep() > step.id) { <span class="check">✓</span> }
                @else { <span>{{ step.id }}</span> }
              </div>
              <span class="step-name">{{ step.label }}</span>
            </div>
            @if (step.id < steps.length) {
              <div class="step-line" [class.done]="currentStep() > step.id"></div>
            }
          }
        </div>
      </div>

      <form [formGroup]="form" (ngSubmit)="onSubmit()">
        <div class="form-body">

          <!-- ───────────── STEP 1: BASICS ───────────── -->
          @if (currentStep() === 1) {
            <div class="form-card animate-in">
              <div class="card-header">
                <div class="card-icon">🏠</div>
                <div>
                  <h2 class="card-title">Property Basics</h2>
                  <p class="card-desc">Start with the key details of your listing</p>
                </div>
              </div>

              <!-- INTENT -->
              <div class="field-group">
                <label class="field-label">Listing Intent <span class="required">*</span></label>
                <div class="pill-group">
                  <button type="button" class="pill" [class.selected]="form.get('listingIntent')?.value === 'sell'"
                    (click)="form.get('listingIntent')?.setValue('sell')">🏷️ Sell</button>
                  <button type="button" class="pill" [class.selected]="form.get('listingIntent')?.value === 'rent'"
                    (click)="form.get('listingIntent')?.setValue('rent')">🔑 Rent / Lease</button>
                </div>
              </div>

              <div class="two-col">
                <div class="field-group">
                  <label class="field-label">Property Type <span class="required">*</span></label>
                  <div class="pill-group">
                    @for (t of propertyTypes; track t) {
                      <button type="button" class="pill" [class.selected]="form.get('type')?.value === t"
                        (click)="form.get('type')?.setValue(t)">{{ typeIcon(t) }} {{ t }}</button>
                    }
                  </div>
                  @if (isInvalid('type')) { <span class="error-msg">Please select a type</span> }
                </div>

                <div class="field-group">
                  <label class="field-label">Pincode</label>
                  <div class="pincode-wrap">
                    <input class="field-input" formControlName="pincode" type="text" maxlength="6" placeholder="e.g. 201301">
                    @if (pincodeLoading()) { <span class="pin-spinner"></span> }
                  </div>
                  @if (pincodeError()) {
                    <span class="error-msg">{{ pincodeError() }}</span>
                  } @else {
                    <span class="field-hint">Auto-fills city &amp; state</span>
                  }
                </div>
              </div>

              <div class="two-col">
                <div class="field-group">
                  <label class="field-label">City <span class="required">*</span></label>
                  <input class="field-input" [class.invalid]="isInvalid('city')"
                    formControlName="city" type="text" placeholder="e.g. Noida">
                  @if (isInvalid('city')) { <span class="error-msg">City is required</span> }
                </div>
                <div class="field-group">
                  <label class="field-label">State</label>
                  <input class="field-input" formControlName="state" type="text" placeholder="e.g. Uttar Pradesh">
                </div>
              </div>

              <div class="field-group">
                <label class="field-label">Locality / Area <span class="required">*</span></label>
                <input class="field-input" [class.invalid]="isInvalid('location')"
                  formControlName="location" type="text" placeholder="e.g. Sector 150, Noida Expressway">
                @if (isInvalid('location')) { <span class="error-msg">Location is required</span> }
              </div>

              <div class="field-group">
                <label class="field-label">Listing Title <span class="required">*</span></label>
                <input class="field-input" [class.invalid]="isInvalid('title')"
                  formControlName="title" type="text"
                  placeholder="e.g. Luxury 4BHK Penthouse with Pool View">
                @if (isInvalid('title')) { <span class="error-msg">Title is required (min 10 characters)</span> }
              </div>

              <!-- TOGGLES -->
              <div class="toggle-row">

                <!-- FEATURED — locked behind isPaid -->
                <div class="toggle-item" [class.locked]="!isPaid" (click)="onFeaturedClick()">
                  <div class="toggle-switch" [class.on]="form.get('isFeatured')?.value && isPaid">
                    <div class="toggle-thumb"></div>
                  </div>
                  <div>
                    <div class="toggle-label">
                      ⭐ Featured Listing
                      @if (!isPaid) {
                        <span class="lock-badge">🔒 Pro</span>
                      }
                    </div>
                    <div class="toggle-hint">
                      {{ isPaid ? 'Appear in premium placements' : 'Upgrade to unlock featured listings' }}
                    </div>
                  </div>
                </div>

                <!-- EXPRESSWAY -->
                <div class="toggle-item" (click)="toggle('expresswayProximity')">
                  <div class="toggle-switch" [class.on]="form.get('expresswayProximity')?.value">
                    <div class="toggle-thumb"></div>
                  </div>
                  <div>
                    <div class="toggle-label">🛣️ Expressway Proximity</div>
                    <div class="toggle-hint">Near Noida / Yamuna Expressway</div>
                  </div>
                </div>

                <!-- RERA REGISTERED -->
                <div class="toggle-item" (click)="toggle('isReraRegistered')">
                  <div class="toggle-switch" [class.on]="form.get('isReraRegistered')?.value">
                    <div class="toggle-thumb"></div>
                  </div>
                  <div>
                    <div class="toggle-label">🏛️ RERA Registered</div>
                    <div class="toggle-hint">Project registered under RERA</div>
                  </div>
                </div>

              </div>

              <!-- RERA PANEL — expands when toggle is ON -->
              @if (form.get('isReraRegistered')?.value) {
                <div class="rera-panel animate-in">
                  <div class="rera-panel-header">
                    <span class="rera-icon">🏛️</span>
                    <div>
                      <div class="rera-title">RERA Registration Details</div>
                      <div class="rera-subtitle">Enter the number exactly as on your certificate</div>
                    </div>
                  </div>

                  <div class="field-group">
                    <label class="field-label">
                      RERA Registration Number <span class="required">*</span>
                    </label>
                    <input class="field-input"
                      [class.invalid]="isInvalid('reraRegistrationNumber')"
                      formControlName="reraRegistrationNumber"
                      type="text"
                      placeholder="e.g. UPRERAPRJ12345">
                    @if (isInvalid('reraRegistrationNumber')) {
                      <span class="error-msg">RERA number is required</span>
                    }
                    <span class="field-hint">
                      Verify at
                      <a href="https://up-rera.in/" target="_blank" class="rera-verify-link">
                        up-rera.in ↗
                      </a>
                    </span>
                  </div>

                  <!-- RERA CERTIFICATE UPLOAD -->
                  <div class="field-group">
                    <label class="field-label">
                      RERA Certificate
                      <span class="muted-label">(optional reference copy)</span>
                    </label>
                    @if (reraDoc()) {
                      <div class="rera-doc-preview">
                        <span class="rera-doc-icon">📄</span>
                        <div class="rera-doc-info">
                          <span class="rera-doc-name">{{ reraDoc()!.file.name }}</span>
                          <span class="rera-doc-size">{{ (reraDoc()!.file.size / 1024).toFixed(0) }} KB</span>
                        </div>
                        <button type="button" class="rera-doc-remove" (click)="reraDoc.set(null)">✕ Remove</button>
                      </div>
                    } @else {
                      <label class="rera-upload-zone">
                        <input type="file" accept=".pdf,.jpg,.png" style="display:none"
                          (change)="onReraDocSelect($event)">
                        <span class="rera-upload-icon">📎</span>
                        <span class="rera-upload-text">Upload certificate</span>
                        <span class="rera-upload-hint">PDF, JPG or PNG · Max 5 MB</span>
                      </label>
                    }
                  </div>
                </div>
              }

              <!-- VASTU ORIENTATION -->
              <div class="field-group" style="margin-top: 18px">
                <label class="field-label">Vastu Orientation</label>
                <div class="pill-group">
                  @for (dir of vastuDirections; track dir.value) {
                    <button type="button" class="pill"
                      [class.selected]="form.get('vastuOrientation')?.value === dir.value"
                      (click)="form.get('vastuOrientation')?.setValue(dir.value)">
                      {{ dir.icon }} {{ dir.label }}
                    </button>
                  }
                  <button type="button" class="pill"
                    [class.selected]="!form.get('vastuOrientation')?.value"
                    (click)="form.get('vastuOrientation')?.setValue('')">
                    — Not specified
                  </button>
                </div>
                <span class="field-hint">Facing direction of the main entrance</span>
              </div>

            </div>
          }

          <!-- ───────────── STEP 2: DETAILS ───────────── -->
          @if (currentStep() === 2) {
            <div class="form-card animate-in">
              <div class="card-header">
                <div class="card-icon">📐</div>
                <div>
                  <h2 class="card-title">Size & Pricing</h2>
                  <p class="card-desc">Tell buyers what they're getting and for how much</p>
                </div>
              </div>

              <div class="field-group">
                <label class="field-label">Asking Price (₹) <span class="required">*</span></label>
                <div class="prefix-input-wrap">
                  <span class="prefix">₹</span>
                  <input class="field-input prefix-input" [class.invalid]="isInvalid('price')"
                    formControlName="price" type="number" min="0"
                    placeholder="e.g. 45000000">
                </div>
                @if (form.get('price')?.value) {
                  <span class="price-preview">{{ form.get('price')?.value | number:'1.0-0' }} ≈ {{ toCrore(form.get('price')?.value) }}</span>
                }
                @if (isInvalid('price')) {
                  <span class="error-msg">Please enter a valid price</span>
                }
              </div>

              <div class="three-col">
                <div class="field-group">
                  <label class="field-label">Area (sq.ft) <span class="required">*</span></label>
                  <input class="field-input" [class.invalid]="isInvalid('sqft')"
                    formControlName="sqft" type="number" min="1"
                    placeholder="e.g. 3200">
                  @if (isInvalid('sqft')) {
                    <span class="error-msg">Required</span>
                  }
                </div>

                <div class="field-group">
                  <label class="field-label">Bedrooms <span class="required">*</span></label>
                  <div class="counter-control">
                    <button type="button" class="counter-btn" (click)="decrement('beds')">−</button>
                    <span class="counter-val">{{ form.get('beds')?.value }}</span>
                    <button type="button" class="counter-btn" (click)="increment('beds')">+</button>
                  </div>
                </div>

                <div class="field-group">
                  <label class="field-label">Bathrooms <span class="required">*</span></label>
                  <div class="counter-control">
                    <button type="button" class="counter-btn" (click)="decrement('baths')">−</button>
                    <span class="counter-val">{{ form.get('baths')?.value }}</span>
                    <button type="button" class="counter-btn" (click)="increment('baths')">+</button>
                  </div>
                </div>
              </div>

              @if (form.get('price')?.value && form.get('sqft')?.value) {
                <div class="insight-card">
                  <span class="insight-icon">💡</span>
                  <span>Price per sq.ft: <strong>₹ {{ pricePerSqft() | number:'1.0-0' }}</strong></span>
                </div>
              }
            </div>

            <!-- AMENITIES CARD -->
            <div class="form-card animate-in" style="margin-top: 20px">
              <div class="card-header">
                <div class="card-icon">✨</div>
                <div>
                  <h2 class="card-title">Amenities</h2>
                  <p class="card-desc">Select all that apply</p>
                </div>
              </div>
              <div class="amenities-grid">
                @for (a of amenitiesOptions; track a) {
                  <div class="amenity-chip" [class.selected]="isAmenitySelected(a)" (click)="toggleAmenity(a)">
                    {{ a }}
                  </div>
                }
              </div>
            </div>
          }

          <!-- ───────────── STEP 3: PHOTOS ───────────── -->
          @if (currentStep() === 3) {
            <div class="form-card animate-in">
              <div class="card-header">
                <div class="card-icon">📸</div>
                <div>
                  <h2 class="card-title">Photos</h2>
                  <p class="card-desc">Upload at least 1 photo. First image will be the hero.</p>
                </div>
              </div>

              <div class="drop-zone"
                [class.drag-over]="isDragging()"
                (dragover)="onDragOver($event)"
                (dragleave)="isDragging.set(false)"
                (drop)="onDrop($event)"
                (click)="fileInput.click()">
                <input #fileInput type="file" multiple accept="image/*" style="display:none" (change)="onFileSelect($event)">
                @if (uploading()) {
                  <div class="drop-content">
                    <div class="upload-spinner"></div>
                    <p>Uploading images...</p>
                  </div>
                } @else {
                  <div class="drop-content">
                    <div class="drop-icon">📁</div>
                    <p class="drop-label">Drag &amp; drop images here or <span class="drop-link">browse</span></p>
                    <p class="drop-hint">JPG, PNG, WEBP · Up to 10 images · Max 5MB each</p>
                  </div>
                }
              </div>

              @if (previewImages().length > 0) {
                <div class="preview-grid">
                  @for (img of previewImages(); track img.url; let i = $index) {
                    <div class="preview-item" [class.hero]="i === 0">
                      <img [src]="img.url" [alt]="'Preview ' + i">
                      @if (i === 0) {
                        <div class="hero-badge">Hero</div>
                      }
                      <button type="button" class="remove-img" (click)="removePreview(i)">✕</button>
                    </div>
                  }
                </div>
                <p class="preview-count">{{ previewImages().length }} image{{ previewImages().length !== 1 ? 's' : '' }} selected · Drag to reorder (coming soon)</p>
              }
            </div>

            <!-- REVIEW SUMMARY -->
            <div class="form-card summary-card animate-in" style="margin-top: 20px">
              <div class="card-header">
                <div class="card-icon">📋</div>
                <div>
                  <h2 class="card-title">Review Your Listing</h2>
                  <p class="card-desc">Double-check before publishing</p>
                </div>
              </div>
              <div class="summary-grid">
                <div class="summary-item">
                  <span class="summary-label">Title</span>
                  <span class="summary-val">{{ form.get('title')?.value || '—' }}</span>
                </div>
                <div class="summary-item">
                  <span class="summary-label">Type</span>
                  <span class="summary-val">{{ form.get('type')?.value || '—' }}</span>
                </div>
                <div class="summary-item">
                  <span class="summary-label">City</span>
                  <span class="summary-val">{{ form.get('city')?.value || '—' }}</span>
                </div>
                <div class="summary-item">
                  <span class="summary-label">Location</span>
                  <span class="summary-val">{{ form.get('location')?.value || '—' }}</span>
                </div>
                <div class="summary-item">
                  <span class="summary-label">Price</span>
                  <span class="summary-val">₹ {{ form.get('price')?.value | number:'1.0-0' }}</span>
                </div>
                <div class="summary-item">
                  <span class="summary-label">Size</span>
                  <span class="summary-val">{{ form.get('sqft')?.value }} sq.ft</span>
                </div>
                <div class="summary-item">
                  <span class="summary-label">Beds / Baths</span>
                  <span class="summary-val">{{ form.get('beds')?.value }} BHK · {{ form.get('baths')?.value }} Bath</span>
                </div>
                <div class="summary-item">
                  <span class="summary-label">Amenities</span>
                  <span class="summary-val">{{ selectedAmenities().length ? selectedAmenities().join(', ') : 'None selected' }}</span>
                </div>
                <div class="summary-item">
                  <span class="summary-label">Photos</span>
                  <span class="summary-val">{{ previewImages().length }} uploaded</span>
                </div>
                <div class="summary-item">
                  <span class="summary-label">Intent</span>
                  <span class="summary-val">{{ form.get('listingIntent')?.value === 'rent' ? '🔑 Rent / Lease' : '🏷️ For Sale' }}</span>
                </div>
                <div class="summary-item">
                  <span class="summary-label">RERA</span>
                  <span class="summary-val">
                    {{ form.get('isReraRegistered')?.value
                        ? '🏛️ ' + (form.get('reraRegistrationNumber')?.value || 'Number pending')
                        : '—' }}
                  </span>
                </div>
                <div class="summary-item">
                  <span class="summary-label">Vastu</span>
                  <span class="summary-val">{{ form.get('vastuOrientation')?.value || '—' }}</span>
                </div>
              </div>
            </div>
          }

        </div>

        @if (submitError()) {
          <div class="error-banner">
            ⚠️ {{ submitError() }}
          </div>
        }

        <!-- FOOTER NAV -->
        <div class="form-footer">
          @if (currentStep() > 1) {
            <button type="button" class="btn-back" (click)="prevStep()">← Back</button>
          } @else {
            <a class="btn-back" routerLink="/properties">Cancel</a>
          }

          <div class="footer-right">
            <span class="step-counter">Step {{ currentStep() }} of {{ steps.length }}</span>
            @if (currentStep() < steps.length) {
              <button type="button" class="btn-next" (click)="nextStep()">Continue →</button>
            } @else {
              <button type="submit" class="btn-submit" [disabled]="submitting() || previewImages().length === 0">
                @if (submitting()) {
                  <span class="btn-spinner"></span> Publishing...
                } @else {
                  🚀 Publish Listing
                }
              </button>
            }
          </div>
        </div>

      </form>

    </div>
  `,
  styles: [`
    /* ── TOKENS ─────────────────────────────────── */
    :host {
      --blue: #2c7be5;
      --blue-light: #f0f6ff;
      --blue-hover: #1a63c5;
      --navy: #1a1a2e;
      --muted: #888;
      --border: #e8eaed;
      --surface: #fff;
      --bg: #f5f7fa;
      --red: #dc2626;
      --green: #16a34a;
      --amber: #f59e0b;
      --radius: 12px;
      --shadow: 0 2px 16px rgba(0,0,0,0.07);
    }

    /* ── LAYOUT ──────────────────────────────────── */
    .page-wrapper { max-width: 780px; margin: 0 auto; padding: 24px 20px 100px; }

    /* ── PAGE HEADER ─────────────────────────────── */
    .page-header { margin-bottom: 28px; }
    .back-link { font-size: 0.85rem; color: var(--blue); text-decoration: none; display: inline-block; margin-bottom: 12px; }
    .back-link:hover { text-decoration: underline; }
    .header-titles { margin-bottom: 20px; }
    .page-title { font-size: 1.6rem; font-weight: 700; color: var(--navy); margin: 0 0 4px; }
    .page-subtitle { font-size: 0.9rem; color: var(--muted); margin: 0; }

    /* ── STEP TRACK ──────────────────────────────── */
    .step-track { display: flex; align-items: center; gap: 0; }
    .step-node { display: flex; align-items: center; gap: 8px; cursor: pointer; }
    .step-dot {
      width: 30px; height: 30px; border-radius: 50%;
      border: 2px solid var(--border);
      background: var(--surface);
      display: flex; align-items: center; justify-content: center;
      font-size: 0.78rem; font-weight: 600; color: var(--muted);
      transition: all 0.2s;
    }
    .step-node.active .step-dot { border-color: var(--blue); background: var(--blue); color: #fff; }
    .step-node.done .step-dot { border-color: var(--green); background: var(--green); color: #fff; }
    .step-name { font-size: 0.8rem; color: var(--muted); font-weight: 500; }
    .step-node.active .step-name { color: var(--blue); font-weight: 600; }
    .step-node.done .step-name { color: var(--green); }
    .step-line { flex: 1; height: 2px; background: var(--border); margin: 0 8px; min-width: 30px; transition: background 0.2s; }
    .step-line.done { background: var(--green); }
    .check { font-size: 0.75rem; }

    /* ── FORM CARD ───────────────────────────────── */
    .form-card {
      background: var(--surface); border: 1px solid var(--border);
      border-radius: var(--radius); padding: 24px;
      box-shadow: var(--shadow);
    }
    .animate-in { animation: fadeUp 0.25s ease both; }
    @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
    .card-header { display: flex; align-items: flex-start; gap: 14px; margin-bottom: 24px; }
    .card-icon { font-size: 1.6rem; line-height: 1; margin-top: 2px; }
    .card-title { font-size: 1.1rem; font-weight: 700; color: var(--navy); margin: 0 0 2px; }
    .card-desc { font-size: 0.83rem; color: var(--muted); margin: 0; }

    /* ── FIELDS ──────────────────────────────────── */
    .field-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 18px; }
    .field-label { font-size: 0.78rem; font-weight: 600; color: #555; text-transform: uppercase; letter-spacing: 0.05em; }
    .required { color: var(--red); margin-left: 2px; }
    .muted-label { color: var(--muted); font-weight: 400; text-transform: none; font-size: 0.75rem; margin-left: 4px; }
    .field-input {
      padding: 10px 12px; border: 1.5px solid var(--border); border-radius: 8px;
      font-size: 0.95rem; outline: none; transition: border-color 0.15s; width: 100%; box-sizing: border-box;
    }
    .field-input:focus { border-color: var(--blue); }
    .field-input.invalid { border-color: var(--red); }
    .field-hint { font-size: 0.75rem; color: var(--muted); }
    .error-msg { font-size: 0.78rem; color: var(--red); }

    /* PREFIX INPUT */
    .prefix-input-wrap { display: flex; align-items: center; border: 1.5px solid var(--border); border-radius: 8px; overflow: hidden; transition: border-color 0.15s; }
    .prefix-input-wrap:focus-within { border-color: var(--blue); }
    .prefix { padding: 0 12px; font-size: 1.1rem; color: var(--navy); font-weight: 700; background: #f8f9fa; border-right: 1px solid var(--border); height: 42px; display: flex; align-items: center; }
    .prefix-input { border: none !important; border-radius: 0 !important; flex: 1; outline: none; }
    .prefix-input:focus { border: none; }
    .price-preview { font-size: 0.82rem; color: var(--blue); font-weight: 500; margin-top: 2px; }

    /* ── LAYOUT HELPERS ──────────────────────────── */
    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .three-col { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; }

    /* ── PILL GROUP ──────────────────────────────── */
    .pill-group { display: flex; flex-wrap: wrap; gap: 8px; }
    .pill {
      padding: 7px 14px; border-radius: 20px; border: 1.5px solid var(--border);
      background: var(--surface); cursor: pointer; font-size: 0.84rem;
      color: #555; font-weight: 500; transition: all 0.15s;
    }
    .pill:hover { border-color: var(--blue); color: var(--blue); background: var(--blue-light); }
    .pill.selected { border-color: var(--blue); background: var(--blue); color: #fff; }

    /* ── TOGGLE ──────────────────────────────────── */
    .toggle-row { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 4px; }
    .toggle-item { display: flex; align-items: center; gap: 12px; padding: 12px 16px; border: 1px solid var(--border); border-radius: 10px; cursor: pointer; flex: 1; min-width: 220px; transition: border-color 0.15s; }
    .toggle-item:hover { border-color: var(--blue); }
    .toggle-item.locked { opacity: 0.78; }
    .toggle-item.locked:hover { border-color: var(--amber); }
    .toggle-switch { width: 40px; height: 22px; border-radius: 11px; background: #ddd; position: relative; transition: background 0.2s; flex-shrink: 0; }
    .toggle-switch.on { background: var(--blue); }
    .toggle-thumb { width: 18px; height: 18px; border-radius: 50%; background: #fff; position: absolute; top: 2px; left: 2px; transition: left 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,0.2); }
    .toggle-switch.on .toggle-thumb { left: 20px; }
    .toggle-label { font-size: 0.88rem; font-weight: 600; color: var(--navy); }
    .toggle-hint { font-size: 0.75rem; color: var(--muted); }
    .lock-badge {
      display: inline-block; font-size: 0.68rem; font-weight: 700;
      background: #fef3c7; color: #92400e;
      border: 1px solid #fcd34d; border-radius: 10px;
      padding: 1px 7px; margin-left: 6px; vertical-align: middle;
      letter-spacing: 0.03em;
    }

    /* ── RERA PANEL ───────────────────────────────── */
    .rera-panel {
      margin-top: 16px; padding: 20px;
      background: #f0fdf4; border: 1.5px solid #86efac;
      border-radius: 10px;
    }
    .rera-panel-header { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 18px; }
    .rera-icon { font-size: 1.4rem; }
    .rera-title { font-size: 0.92rem; font-weight: 700; color: #14532d; }
    .rera-subtitle { font-size: 0.78rem; color: #16a34a; margin-top: 2px; }
    .rera-verify-link { color: #16a34a; font-weight: 600; text-decoration: none; }
    .rera-verify-link:hover { text-decoration: underline; }

    /* RERA DOC PREVIEW */
    .rera-doc-preview {
      display: flex; align-items: center; gap: 12px;
      padding: 12px 14px; background: #fff;
      border: 1.5px solid #86efac; border-radius: 8px;
    }
    .rera-doc-icon { font-size: 1.4rem; }
    .rera-doc-info { display: flex; flex-direction: column; flex: 1; }
    .rera-doc-name { font-size: 0.88rem; font-weight: 600; color: var(--navy); }
    .rera-doc-size { font-size: 0.75rem; color: var(--muted); }
    .rera-doc-remove {
      padding: 5px 10px; border-radius: 6px; border: 1px solid #fca5a5;
      background: #fef2f2; color: var(--red); font-size: 0.78rem;
      cursor: pointer; font-weight: 500; white-space: nowrap;
    }

    /* RERA UPLOAD ZONE */
    .rera-upload-zone {
      display: flex; flex-direction: column; align-items: center; gap: 4px;
      padding: 20px; border: 2px dashed #86efac; border-radius: 8px;
      cursor: pointer; transition: background 0.15s; background: #fff;
    }
    .rera-upload-zone:hover { background: #dcfce7; }
    .rera-upload-icon { font-size: 1.4rem; }
    .rera-upload-text { font-size: 0.88rem; color: #16a34a; font-weight: 600; }
    .rera-upload-hint { font-size: 0.75rem; color: var(--muted); }

    /* ── COUNTER ─────────────────────────────────── */
    .counter-control { display: flex; align-items: center; gap: 0; border: 1.5px solid var(--border); border-radius: 8px; overflow: hidden; }
    .counter-btn { width: 38px; height: 42px; border: none; background: #f8f9fa; cursor: pointer; font-size: 1.2rem; color: var(--navy); transition: background 0.15s; }
    .counter-btn:hover { background: var(--blue-light); color: var(--blue); }
    .counter-val { flex: 1; text-align: center; font-size: 1rem; font-weight: 700; color: var(--navy); }

    /* ── INSIGHT ─────────────────────────────────── */
    .insight-card { display: flex; align-items: center; gap: 10px; background: var(--blue-light); border: 1px solid #c8dff7; border-radius: 8px; padding: 10px 14px; font-size: 0.88rem; color: #2c5282; margin-top: 4px; }

    /* ── AMENITIES ───────────────────────────────── */
    .amenities-grid { display: flex; flex-wrap: wrap; gap: 8px; }
    .amenity-chip {
      padding: 7px 14px; border-radius: 8px; border: 1.5px solid var(--border);
      background: var(--surface); cursor: pointer; font-size: 0.83rem;
      color: #555; transition: all 0.15s; user-select: none;
    }
    .amenity-chip:hover { border-color: var(--blue); color: var(--blue); }
    .amenity-chip.selected { border-color: var(--blue); background: var(--blue-light); color: var(--blue); font-weight: 600; }

    /* ── DROP ZONE ───────────────────────────────── */
    .drop-zone {
      border: 2px dashed var(--border); border-radius: 10px;
      padding: 40px 20px; text-align: center; cursor: pointer;
      transition: all 0.2s; margin-bottom: 20px;
    }
    .drop-zone:hover, .drop-zone.drag-over { border-color: var(--blue); background: var(--blue-light); }
    .drop-content { display: flex; flex-direction: column; align-items: center; gap: 8px; }
    .drop-icon { font-size: 2rem; }
    .drop-label { font-size: 0.9rem; color: #444; margin: 0; }
    .drop-link { color: var(--blue); font-weight: 600; }
    .drop-hint { font-size: 0.78rem; color: var(--muted); margin: 0; }
    .upload-spinner { width: 28px; height: 28px; border: 3px solid var(--border); border-top-color: var(--blue); border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* ── PREVIEW GRID ─────────────────────────────── */
    .preview-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 10px; margin-bottom: 10px; }
    .preview-item { position: relative; border-radius: 8px; overflow: hidden; border: 2px solid transparent; }
    .preview-item img { width: 100%; height: 110px; object-fit: cover; display: block; }
    .preview-item.hero { border-color: var(--blue); }
    .hero-badge { position: absolute; top: 6px; left: 6px; background: var(--blue); color: #fff; font-size: 0.68rem; font-weight: 700; padding: 2px 8px; border-radius: 10px; text-transform: uppercase; letter-spacing: 0.05em; }
    .remove-img { position: absolute; top: 6px; right: 6px; background: rgba(220,38,38,0.85); color: white; border: none; border-radius: 50%; width: 22px; height: 22px; cursor: pointer; font-size: 0.7rem; display: flex; align-items: center; justify-content: center; }
    .preview-count { font-size: 0.78rem; color: var(--muted); text-align: right; margin: 0; }

    /* ── SUMMARY ─────────────────────────────────── */
    .summary-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0; }
    .summary-item { padding: 10px 0; border-bottom: 1px solid var(--border); display: flex; flex-direction: column; gap: 2px; padding-right: 16px; }
    .summary-label { font-size: 0.72rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.05em; }
    .summary-val { font-size: 0.9rem; color: var(--navy); font-weight: 500; }

    /* ── FORM FOOTER ─────────────────────────────── */
    .form-footer {
      position: fixed; bottom: 0; left: 0; right: 0;
      background: rgba(255,255,255,0.96); backdrop-filter: blur(8px);
      border-top: 1px solid var(--border);
      padding: 14px 24px;
      display: flex; align-items: center; justify-content: space-between;
      z-index: 100;
    }
    .footer-right { display: flex; align-items: center; gap: 14px; }
    .step-counter { font-size: 0.82rem; color: var(--muted); }
    .btn-back { padding: 9px 18px; border-radius: 8px; border: 1.5px solid var(--border); background: var(--surface); color: #444; cursor: pointer; font-size: 0.9rem; font-weight: 500; text-decoration: none; display: inline-flex; align-items: center; }
    .btn-back:hover { border-color: #bbb; }
    .btn-next { padding: 9px 22px; border-radius: 8px; border: none; background: var(--blue); color: #fff; cursor: pointer; font-size: 0.9rem; font-weight: 600; transition: background 0.15s; }
    .btn-next:hover { background: var(--blue-hover); }
    .btn-submit { padding: 9px 22px; border-radius: 8px; border: none; background: var(--green); color: #fff; cursor: pointer; font-size: 0.9rem; font-weight: 600; display: flex; align-items: center; gap: 8px; transition: opacity 0.15s; }
    .btn-submit:disabled { opacity: 0.55; cursor: not-allowed; }
    .btn-submit:hover:not(:disabled) { opacity: 0.9; }
    .btn-spinner { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.4); border-top-color: #fff; border-radius: 50%; animation: spin 0.8s linear infinite; }

    /* ── ERROR BANNER ────────────────────────────── */
    .error-banner {
      background: #fef2f2; border: 1px solid #fecaca;
      color: var(--red); padding: 12px 16px;
      border-radius: 8px; font-size: 0.88rem; margin-bottom: 16px;
    }

    /* ── PINCODE ─────────────────────────────────── */
    .pincode-wrap { position: relative; display: flex; align-items: center; }
    .pincode-wrap .field-input { padding-right: 36px; }
    .pin-spinner { position: absolute; right: 10px; width: 16px; height: 16px; border: 2px solid var(--border); border-top-color: var(--blue); border-radius: 50%; animation: spin 0.8s linear infinite; }

    /* ── RESPONSIVE ──────────────────────────────── */
    @media (max-width: 600px) {
      .two-col, .three-col { grid-template-columns: 1fr; }
      .summary-grid { grid-template-columns: 1fr; }
      .step-name { display: none; }
      .step-line { min-width: 16px; }
      .toggle-item { min-width: 100%; }
    }
  `]
})
export class CreateProperty implements OnInit {
  private fb             = inject(FormBuilder);
  private router         = inject(Router);
  private route          = inject(ActivatedRoute);
  private propertyService = inject(PropertyService);
  private authService    = inject(AuthService);

  readonly propertyTypes   = ['Apartment', 'Villa', 'Plot', 'Commercial'] as const;
  readonly amenitiesOptions = AMENITIES_OPTIONS;

  readonly steps = [
    { id: 1, label: 'Basics'  },
    { id: 2, label: 'Details' },
    { id: 3, label: 'Photos'  },
  ];

  readonly vastuDirections: { value: VastuOrientation; icon: string; label: string }[] = [
    { value: 'North',     icon: '⬆️', label: 'North'      },
    { value: 'South',     icon: '⬇️', label: 'South'      },
    { value: 'East',      icon: '➡️', label: 'East'       },
    { value: 'West',      icon: '⬅️', label: 'West'       },
    { value: 'NorthEast', icon: '↗️', label: 'North-East' },
    { value: 'NorthWest', icon: '↖️', label: 'North-West' },
    { value: 'SouthEast', icon: '↘️', label: 'South-East' },
    { value: 'SouthWest', icon: '↙️', label: 'South-West' },
  ];

  // ── Signals ────────────────────────────────────────────────────────────
  currentStep      = signal(1);
  isDragging       = signal(false);
  uploading        = signal(false);
  submitting       = signal(false);
  previewImages    = signal<{ url: string; file: File }[]>([]);
  selectedAmenities = signal<string[]>([]);
  pincodeLoading   = signal(false);
  pincodeError     = signal('');
  submitError      = signal('');
  reraDoc          = signal<{ url: string; file: File } | null>(null);

  // ── Computed helpers ───────────────────────────────────────────────────
  get isPaid(): boolean {
    return !!this.authService.authResponse()?.isPaid;
  }

  // ── Form ───────────────────────────────────────────────────────────────
  form: FormGroup = this.fb.group({
    // Step 1 — Basics
    title:                  ['', [Validators.required, Validators.minLength(10)]],
    type:                   ['', Validators.required],
    listingIntent:          ['sell', Validators.required],
    city:                   ['', Validators.required],
    state:                  [''],
    pincode:                ['', [Validators.pattern(/^\d{6}$/)]],
    location:               ['', Validators.required],
    isFeatured:             [false],
    expresswayProximity:    [false],
    isReraRegistered:       [false],
    reraRegistrationNumber: [''],
    vastuOrientation:       ['' as VastuOrientation | ''],

    // Step 2 — Details
    price: [null, [Validators.required, Validators.min(1)]],
    sqft:  [null, [Validators.required, Validators.min(1)]],
    beds:  [2,    [Validators.required, Validators.min(0)]],
    baths: [2,    [Validators.required, Validators.min(0)]],
  });

  // ── Lifecycle ──────────────────────────────────────────────────────────
  ngOnInit() {
    // Preselect listing intent if navbar sent us here with ?intent=rent|sell
    const intent = this.route.snapshot.queryParamMap.get('intent');
    if (intent === 'rent' || intent === 'sell') {
      this.form.get('listingIntent')?.setValue(intent);
    }

    // Auto-fill city + state from pincode
    this.form.get('pincode')!.valueChanges.pipe(
      debounceTime(600),
      filter(v => /^\d{6}$/.test(v))
    ).subscribe(pin => {
      this.pincodeLoading.set(true);
      this.pincodeError.set('');
      fetch(`https://api.postalpincode.in/pincode/${pin}`)
        .then(r => r.json())
        .then(data => {
          const po = data?.[0]?.PostOffice?.[0];
          if (po) {
            this.form.patchValue({ city: po.Division || po.District, state: po.State });
            this.pincodeError.set('');
          } else {
            this.pincodeError.set('Pincode not found');
          }
          this.pincodeLoading.set(false);
        })
        .catch(() => {
          this.pincodeError.set('Could not fetch location');
          this.pincodeLoading.set(false);
        });
    });

    // Clear RERA number when toggle is switched off
    this.form.get('isReraRegistered')!.valueChanges.subscribe(val => {
      if (!val) {
        this.form.get('reraRegistrationNumber')?.reset('');
        this.reraDoc.set(null);
      }
    });
  }

  // ── Field helpers ──────────────────────────────────────────────────────
  isInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl?.invalid && ctrl?.touched);
  }

  typeIcon(t: string): string {
    return ({ Apartment: '🏢', Villa: '🏡', Plot: '🗺️', Commercial: '🏗️' } as Record<string, string>)[t] ?? '';
  }

  toCrore(val: number): string {
    if (!val) return '';
    if (val >= 10_000_000) return `₹${(val / 10_000_000).toFixed(2)} Cr`;
    if (val >= 100_000)    return `₹${(val / 100_000).toFixed(1)} L`;
    return '';
  }

  pricePerSqft(): number {
    const p = this.form.get('price')?.value ?? 0;
    const s = this.form.get('sqft')?.value  ?? 1;
    return s ? p / s : 0;
  }

  toggle(field: string) {
    const ctrl = this.form.get(field);
    ctrl?.setValue(!ctrl.value);
  }

  increment(field: string) {
    const ctrl = this.form.get(field);
    ctrl?.setValue((ctrl.value ?? 0) + 1);
  }

  decrement(field: string) {
    const ctrl = this.form.get(field);
    if ((ctrl?.value ?? 0) > 0) ctrl?.setValue(ctrl.value - 1);
  }

  // ── Featured (paid gate) ───────────────────────────────────────────────
  onFeaturedClick() {
    if (!this.isPaid) {
      this.router.navigate(['/upgrade']);
      return;
    }
    this.toggle('isFeatured');
  }

  // ── Amenities ──────────────────────────────────────────────────────────
  isAmenitySelected(a: string): boolean {
    return this.selectedAmenities().includes(a);
  }

  toggleAmenity(a: string) {
    const current = this.selectedAmenities();
    this.selectedAmenities.set(
      current.includes(a) ? current.filter(x => x !== a) : [...current, a]
    );
  }

  // ── Navigation ─────────────────────────────────────────────────────────
  goToStep(id: number) {
    if (id < this.currentStep()) this.currentStep.set(id);
  }

  nextStep() {
    const step = this.currentStep();

    if (step === 1) {
      ['title', 'type', 'city', 'location'].forEach(f => this.form.get(f)?.markAsTouched());

      // If RERA toggle is on, also validate the reg number
      if (this.form.get('isReraRegistered')?.value) {
        this.form.get('reraRegistrationNumber')?.markAsTouched();
        if (!this.form.get('reraRegistrationNumber')?.value?.trim()) return;
      }

      const invalid = ['title', 'type', 'listingIntent', 'city', 'location'].some(
        f => this.form.get(f)?.invalid
      );
      if (invalid) return;
    }

    if (step === 2) {
      ['price', 'sqft'].forEach(f => this.form.get(f)?.markAsTouched());
      if (['price', 'sqft'].some(f => this.form.get(f)?.invalid)) return;
    }

    this.currentStep.set(step + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  prevStep() {
    this.currentStep.set(this.currentStep() - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ── Image handling ─────────────────────────────────────────────────────
  onDragOver(e: DragEvent) { e.preventDefault(); this.isDragging.set(true); }

  onDrop(e: DragEvent) {
    e.preventDefault();
    this.isDragging.set(false);
    const files = Array.from(e.dataTransfer?.files ?? []).filter(f => f.type.startsWith('image/'));
    this.addPreviews(files);
  }

  onFileSelect(e: Event) {
    const input = e.target as HTMLInputElement;
    if (!input.files?.length) return;
    this.addPreviews(Array.from(input.files));
    input.value = '';
  }

  private addPreviews(files: File[]) {
    const toAdd = files.slice(0, 10 - this.previewImages().length);
    toAdd.forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => {
        this.previewImages.update(imgs => [...imgs, { url: ev.target!.result as string, file }]);
      };
      reader.readAsDataURL(file);
    });
  }

  removePreview(index: number) {
    this.previewImages.update(imgs => imgs.filter((_, i) => i !== index));
  }

  // ── RERA document ──────────────────────────────────────────────────────
  onReraDocSelect(e: Event) {
    const input = e.target as HTMLInputElement;
    const file  = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      this.reraDoc.set({ url: ev.target!.result as string, file });
    };
    reader.readAsDataURL(file);
    input.value = '';
  }

  // ── Submit ─────────────────────────────────────────────────────────────
  onSubmit() {
    if (this.form.invalid || this.previewImages().length === 0) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.submitError.set('');

    const v = this.form.value;

    // Build payload that matches PropertyDetailsDto / CreatePropertyDto
    const payload = {
      title:                  v.title,
      type:                   v.type,
      listingIntent:          v.listingIntent,   // confirm if your CreatePropertyDto has this
      city:                   v.city,
      location:               v.location,
      price:                  v.price,
      sqft:                   v.sqft,
      beds:                   v.beds,
      baths:                  v.baths,
      isFeatured:             this.isPaid && v.isFeatured,
      expresswayProximity:    v.expresswayProximity,
      isReraRegistered:       v.isReraRegistered,
      reraRegistrationNumber: v.isReraRegistered ? (v.reraRegistrationNumber ?? null) : null,
      vastuOrientation:       v.vastuOrientation || null,
      amenities:              this.selectedAmenities(),
      images:                 [],   // filled server-side after upload
    };

    const imageFiles = this.previewImages().map(p => p.file);

    this.propertyService.createProperty(payload).pipe(
      switchMap(created => {
        const uploads = [
          this.propertyService.uploadImages(created.id, imageFiles),
          ...(this.reraDoc()
            ? [this.propertyService.uploadReraDoc(created.id, this.reraDoc()!.file)]
            : []),
        ];
        return forkJoin(uploads).pipe(map(() => created));
      })
    ).subscribe({
      next: (created) => {
        this.submitting.set(false);
        this.router.navigate(['/property', created.id]);
      },
      error: (err) => {
        this.submitting.set(false);
        const code = err?.error?.code;

        if (code === 'KYC_REQUIRED') {
          this.router.navigate(['/kyc'], { queryParams: { returnUrl: '/property/create' } });
          return;
        }
        if (code === 'LISTING_LIMIT_REACHED') {
          this.router.navigate(['/upgrade'], {
            queryParams: { reason: 'limit', returnUrl: '/property/create' }
          });
          return;
        }
        if (code === 'ACCOUNT_TOO_NEW') {
          this.submitError.set('New accounts must wait 24 hours before listing.');
          return;
        }
        this.submitError.set('Something went wrong. Please try again.');
      },
    });
  }
}