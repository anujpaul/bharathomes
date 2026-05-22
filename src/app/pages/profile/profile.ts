import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '@/app/services/auth.service';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { appConfig } from '@/app/config/app-config';
import { UserProfile } from '@/types';

interface PaymentHistoryItem {
  id: string;
  planCode: string;
  planTier: string;
  amountInr: number;
  cardLast4: string;
  cardBrand: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  rejectionReason: string | null;
}

const USER_TYPES = [
  { value: 'buyer', label: 'Buyer', icon: '🏠' },
  { value: 'seller', label: 'Seller', icon: '💰' },
  { value: 'agent', label: 'Agent', icon: '🤝' },
  { value: 'hybrid', label: 'Buy & Sell', icon: '🔄' }
];

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  
  template: `
  
  <!-- <div class="profile-wrapper"> -->
  <div class="profile-wrapper text-gray-700">
    @if (profile()) {
      <div class="profile-card">

        <!-- Header -->
        <div class="profile-header">

          <!-- Avatar: click = preview (view mode) OR upload (edit mode) -->
          <div class="avatar-wrapper">
            @if (profile()?.userPhoto) {
              <img class="avatar-img"
                   [src]="profile()?.userPhoto"
                   alt="Profile Photo"
                   (click)="isEditing() ? fileInput.click() : openPreview()">
            } @else {
              <div class="avatar"
                   (click)="isEditing() ? fileInput.click() : null">
                {{ profile()?.name?.charAt(0) || 'U' }}
              </div>
            }

            <!-- Camera button: only visible in edit mode -->
            @if (isEditing()) {
              <div class="avatar-overlay" (click)="fileInput.click()">
                @if (uploading()) { ⏳ } @else { 📷 }
              </div>
            }
          </div>
          <input #fileInput type="file" accept="image/*" style="display:none"
                 (change)="onFileSelected($event)" />

          <div>
            <h2>{{ profile()?.name }}</h2>
            <p class="muted">{{ profile()?.email }}</p>
          </div>
        </div>

        <hr />

        @if (!isEditing()) {
          <div class="info">
            <p><strong>Phone:</strong> {{ profile()?.phone }}</p>
            <p>
              <strong>Account Type:</strong>
              @if (currentUserType) {
                <span class="type-badge">
                  {{ currentUserType.icon }} {{ currentUserType.label }}
                </span>
              } @else {
                <span class="muted">Not set</span>
              }
          </p>
          <p><strong>KYC Status:</strong> {{profile()?.kycStatus}}</p>
          </div>

          <!-- Subscription / Billing -->
          <div class="billing-card">
            <div class="billing-top">
              <span class="billing-heading">Subscription</span>
              <a routerLink="/upgrade" class="change-link">
                {{ profile()?.isPaid ? 'Change plan' : 'Upgrade →' }}
              </a>
            </div>
            <span class="tier-chip" [attr.data-tier]="planTier()">{{ planLabel() }}</span>
            @if (profile()?.isPaid) {
              <p class="billing-detail">
                @if(planLabel() != '○ Free'){
                  @if (subscriptionActive()) {
                    Active · expires {{ profile()?.subscriptionExpiry | date:'d MMM yyyy' }}
                  } @else {
                    <span class="expired-text">Expired · {{ profile()?.subscriptionExpiry | date:'d MMM yyyy' }}</span>
                  }
                }
              </p>
            } @else {
              <p class="billing-detail muted">Free tier — upgrade to unlock more listings</p>
            }
          </div>

          @if (paymentHistory().length > 0) {
            <div class="history-section">
              <p class="section-heading">Payment history</p>
              @for (req of paymentHistory(); track req.id) {
                <div class="history-row">
                  <div class="history-left">
                    <span class="history-plan">{{ req.planCode }}</span>
                    <span class="history-meta">₹{{ req.amountInr.toLocaleString('en-IN') }} · {{ req.submittedAt | date:'d MMM yyyy' }}</span>
                  </div>
                  <span class="status-chip" [attr.data-status]="req.status">{{ statusLabel(req.status) }}</span>
                </div>
              }
            </div>
          }

          <button class="btn primary" (click)="startEdit()">Edit Profile</button>
        } @else {
          <div class="form">
            <label>Name</label>
            <input [(ngModel)]="editModel.name" />
            <label>Email</label>

            <input class = "text-gray-300" [(ngModel)]="editModel.email" disabled />
            <label>Phone</label>
            <div class="phone-row">
              <select [(ngModel)]="selectedDialCode" class="dial-select">
                @for (dc of dialCodes; track dc.code) {
                  <option [value]="dc.code">{{ dc.label }}</option>
                }
              </select>
              <input [(ngModel)]="editModel.phone"
                     type="tel"
                     placeholder="Phone number"
                     class="phone-input" />
            </div>
            <label>Account Type</label>
            <div class="type-grid">
              @for (type of userTypes; track type.value) {
                <button
                  type="button"
                  (click)="setUserType(type.value)"
                  [class.selected]="editModel.userRole === type.value"
                  class="type-option">
                  <span>{{ type.icon }}</span>
                  <span>{{ type.label }}</span>
                </button>
              }
            </div>
          </div>
          <div class="actions">
            <button class="btn" (click)="cancel()">Cancel</button>
            <button class="btn primary" (click)="save()">Save</button>
          </div>
        }

      </div>
    } @else {
      <div class="loading">Loading profile...</div>
    }
  </div>

  <!-- Photo Preview Modal -->
  @if (showPreview()) {
    <div class="modal-backdrop" (click)="closePreview()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <button class="modal-close" (click)="closePreview()">✕</button>
        <img [src]="profile()?.userPhoto" alt="Profile Photo" class="preview-img">
      </div>
    </div>
  }
  `,
  styles: [`
    .profile-wrapper { display: flex; justify-content: center; padding: 40px; font-family: Arial, sans-serif; }
    .profile-card { width: 420px; background: #ffffff; border-radius: 16px; padding: 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.08); }
    .profile-header { display: flex; align-items: center; gap: 16px; }

    .avatar-wrapper { position: relative; width: 60px; height: 60px; flex-shrink: 0; }
    .avatar-img { width: 60px; height: 60px; border-radius: 50%; object-fit: cover; display: block; cursor: pointer; }
    .avatar { width: 60px; height: 60px; border-radius: 50%; background: linear-gradient(135deg, #4f46e5, #9333ea); color: white; display: flex; align-items: center; justify-content: center; font-size: 22px; font-weight: bold; }
    .avatar-overlay { position: absolute; inset: 0; border-radius: 50%; background: rgba(0,0,0,0.4); color: white; display: flex; align-items: center; justify-content: center; font-size: 16px; cursor: pointer; opacity: 0; transition: opacity 0.2s; }
    .avatar-wrapper:hover .avatar-overlay { opacity: 1; }

    h2 { margin: 0; }
    .muted { color: gray; font-size: 13px; }
    hr { margin: 20px 0; border: none; border-top: 1px solid #eee; }
    .btn { padding: 10px 14px; border-radius: 8px; border: none; cursor: pointer; margin-top: 12px; }
    .primary { background: #4f46e5; color: white; }
    .form { display: flex; flex-direction: column; gap: 10px; }

    /* Phone with country code — keep dropdown narrow so the actual
       number field gets the real estate. */
    .phone-row { display: flex; gap: 8px; }
    .dial-select {
      flex: 0 0 170px;
      padding: 8px;
      border: 1px solid #ddd;
      border-radius: 6px;
      background: #fff;
      font-size: 0.9rem;
    }
    .phone-input { flex: 1; }
    @media (max-width: 480px) {
      .phone-row { flex-direction: column; }
      .dial-select { flex: 1 1 auto; }
    }
    input { padding: 10px; border: 1px solid #ddd; border-radius: 8px; outline: none; }
    input:focus { border-color: #4f46e5; }
    .actions { display: flex; justify-content: space-between; margin-top: 16px; }
    .loading { font-size: 16px; color: gray; }

    /* Modal */
    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.75); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .modal-content { position: relative; border-radius: 12px; overflow: hidden; max-width: 90vw; max-height: 90vh; }
    .modal-close { position: absolute; top: 10px; right: 12px; background: rgba(0,0,0,0.5); color: white; border: none; border-radius: 50%; width: 32px; height: 32px; cursor: pointer; font-size: 16px; display: flex; align-items: center; justify-content: center; }
    .preview-img { display: block; max-width: 90vw; max-height: 85vh; object-fit: contain; }
    .type-badge { 
      display: inline-block; 
      background: #ede9fe; 
      color: #4f46e5; 
      padding: 2px 10px; 
      border-radius: 20px; 
      font-size: 13px; 
      margin-left: 6px; 
    }
    .type-grid { 
      display: grid; 
      grid-template-columns: 1fr 1fr; 
      gap: 8px; 
      margin-top: 4px; 
    }
    .type-option { 
      display: flex; 
      flex-direction: column; 
      align-items: center; 
      gap: 4px; 
      padding: 10px; 
      border: 1px solid #ddd; 
      border-radius: 10px; 
      background: white; 
      cursor: pointer; 
      font-size: 13px; 
      transition: all 0.15s; 
    }
    .type-option.selected {
      border-color: #4f46e5;
      background: #ede9fe;
      color: #4f46e5;
    }

    /* Billing card */
    .billing-card { background: #f8f8ff; border: 1px solid #e8e0ff; border-radius: 12px; padding: 14px 16px; margin-top: 16px; }
    .billing-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .billing-heading { font-size: 11px; font-weight: 700; color: #999; text-transform: uppercase; letter-spacing: 0.06em; }
    .change-link { font-size: 12px; font-weight: 600; color: #4f46e5; text-decoration: none; }
    .change-link:hover { text-decoration: underline; }
    .tier-chip { display: inline-block; padding: 3px 12px; border-radius: 20px; font-size: 13px; font-weight: 700; background: #f3f4f6; color: #6b7280; }
    .tier-chip[data-tier="pro"] { background: #fef3c7; color: #b45309; }
    .tier-chip[data-tier="basic"] { background: #dbeafe; color: #1d4ed8; }
    .tier-chip[data-tier="free"] { background: #f3f4f6; color: #6b7280; }
    .billing-detail { margin: 6px 0 0; font-size: 12px; color: #666; }
    .expired-text { color: #dc2626; }

    /* Payment history */
    .history-section { margin-top: 14px; padding-top: 14px; border-top: 1px solid #eee; }
    .section-heading { font-size: 11px; font-weight: 700; color: #aaa; text-transform: uppercase; letter-spacing: 0.06em; margin: 0 0 8px; }
    .history-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #f0f0f0; }
    .history-row:last-child { border-bottom: none; }
    .history-left { display: flex; flex-direction: column; gap: 2px; }
    .history-plan { font-size: 13px; font-weight: 600; color: #333; }
    .history-meta { font-size: 12px; color: #999; }
    .status-chip { font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 12px; background: #f3f4f6; color: #555; }
    .status-chip[data-status="pending"] { background: #fef3c7; color: #b45309; }
    .status-chip[data-status="approved"] { background: #dcfce7; color: #16a34a; }
    .status-chip[data-status="rejected"] { background: #fef2f2; color: #dc2626; }
  `]
})
export class ProfileComponent implements OnInit {

  
  private authService = inject(AuthService);
  private http = inject(HttpClient);

  profile = this.authService.authResponse;
  isEditing = signal(false);
  uploading = signal(false);
  showPreview = signal(false);
  
  userTypes = USER_TYPES;

  editModel: Partial<UserProfile> = { name: '', email: '', phone: '', userRole: undefined };

  /**
   * Country code dial code state. Kept separate from editModel.phone
   * for clean UX (dropdown + input); concatenated on save into a single
   * "+91 9876543210" string that lands in editModel.phone.
   *
   * The list is the most commonly-encountered countries for an Indian
   * real-estate site (NRI buyers in US/UK/UAE/SG/AU/CA, plus near
   * neighbours). Add more as your audience expands.
   */
  selectedDialCode = '+91';
  readonly dialCodes = [
    { code: '+91',  label: '🇮🇳 +91 India' },
    { code: '+1',   label: '🇺🇸 +1 USA / Canada' },
    { code: '+44',  label: '🇬🇧 +44 UK' },
    { code: '+971', label: '🇦🇪 +971 UAE' },
    { code: '+65',  label: '🇸🇬 +65 Singapore' },
    { code: '+61',  label: '🇦🇺 +61 Australia' },
    { code: '+977', label: '🇳🇵 +977 Nepal' },
    { code: '+880', label: '🇧🇩 +880 Bangladesh' },
    { code: '+94',  label: '🇱🇰 +94 Sri Lanka' },
    { code: '+92',  label: '🇵🇰 +92 Pakistan' },
    { code: '+966', label: '🇸🇦 +966 Saudi Arabia' },
    { code: '+974', label: '🇶🇦 +974 Qatar' },
    { code: '+49',  label: '🇩🇪 +49 Germany' },
  ];

  /**
   * Split a stored phone string into (dialCode, localNumber). Tries the
   * longest dial code first so "+971…" doesn't get mistaken as "+9 71…".
   * Defaults to India (+91) when no recognized code is found.
   */
  private splitPhone(phone: string | null | undefined): { code: string; local: string } {
    const trimmed = (phone ?? '').trim();
    if (!trimmed) return { code: '+91', local: '' };
    const sorted = [...this.dialCodes].sort((a, b) => b.code.length - a.code.length);
    for (const dc of sorted) {
      if (trimmed.startsWith(dc.code)) {
        return { code: dc.code, local: trimmed.slice(dc.code.length).trim() };
      }
    }
    return { code: '+91', local: trimmed };
  }

  openPreview() { this.showPreview.set(true); }
  closePreview() { this.showPreview.set(false); }

  async onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    this.uploading.set(true);
    try {
      await this.http.post<{ userPhoto: string }>(
        `${appConfig.baseUrl}/api/user/upload-photo`, formData
      ).toPromise();
      this.authService.fetchUserProfile();
    } catch (err) {
      console.error('Upload failed', err);
    } finally {
      this.uploading.set(false);
    }
  }

  setUserType(value: string) {
    this.editModel.userRole = value as UserProfile['userRole'];
  }

  startEdit() {
    const p = this.profile();
    // Pre-split any existing stored phone so the dial-code dropdown and
    // local-number input start in sync with what's in the DB.
    const { code, local } = this.splitPhone(p?.phone);
    this.selectedDialCode = code;
    this.editModel = { name: p?.name, email: p?.email, phone: local, userRole: p?.userRole };
    this.isEditing.set(true);
  }

  cancel() { this.isEditing.set(false); }

  save() {
    // Recombine dial code + local number into a single canonical string
    // on save so the backend / data layer never has to guess. Strip any
    // leading "+" or whitespace from the local part — defensive against
    // a paste that already included a country code.
    const local = (this.editModel.phone ?? '').replace(/^[+\d]+\s/, '').trim();
    const fullPhone = local ? `${this.selectedDialCode} ${local}` : '';
    this.authService.editUserProfile({ ...this.editModel, phone: fullPhone });
    this.isEditing.set(false);
  }

  get currentUserType() {
    return USER_TYPES.find(t => t.value === this.profile()?.userRole);
  }

  // ── Subscription / billing ──────────────────────────────────────────────

  paymentHistory = signal<PaymentHistoryItem[]>([]);

  subscriptionActive = computed(() => {
    const p = this.profile();
    if (!p?.isPaid) return false;
    if (!p.subscriptionExpiry) return true;
    return new Date(p.subscriptionExpiry) > new Date();
  });

  planTier = computed(() => {
    const p = this.profile();
    if (!p?.isPaid || !this.subscriptionActive()) return 'free';
    return p.currentPlanTier ?? 'free';
  });

  planLabel = computed(() => {
    const tier = this.planTier();
    if (tier === 'pro') return '⭐ Pro';
    if (tier === 'basic') return '✦ Basic';
    return '○ Free';
  });

  statusLabel(status: string): string {
    if (status === 'pending') return '⏳ Pending';
    if (status === 'approved') return '✓ Approved';
    if (status === 'rejected') return '✕ Rejected';
    return status;
  }

  ngOnInit(): void {
    this.http.get<PaymentHistoryItem[]>(`${appConfig.baseUrl}/api/payment/my-requests`)
      .subscribe({ next: items => this.paymentHistory.set(items), error: () => {} });
  }
}