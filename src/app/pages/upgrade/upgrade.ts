import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '@/app/services/auth.service';
import { appConfig } from '@/app/config/app-config';

interface Plan {
  code: string;
  name: string;
  tier: 'basic' | 'pro';
  cycle: 'monthly' | 'yearly';
  priceInr: number;
  listingLimit: number;
  featuredPlacement: boolean;
  features: string[];
}

interface PaymentResult {
  success: boolean;
  message?: string;
  planCode?: string;
  requestId?: string;
  status?: string;
  subscriptionExpiry?: string;
}

type CardBrand = 'visa' | 'mastercard' | 'amex' | 'rupay' | 'discover' | 'diners' | 'unknown';

/**
 * BIN-based brand detection. Mirrors PaymentController.DetectBrand on the
 * server so the live preview matches what the server will store.
 */
function detectCardBrand(digits: string): CardBrand {
  if (!digits) return 'unknown';
  if (digits[0] === '4') return 'visa';
  if (digits.length >= 2) {
    const p2 = parseInt(digits.substring(0, 2), 10);
    if (p2 === 34 || p2 === 37) return 'amex';
    if (p2 >= 51 && p2 <= 55) return 'mastercard';
    if (p2 === 36 || p2 === 38 || p2 === 30) return 'diners';
    if (p2 === 65) return 'discover';
    if (p2 === 60 || p2 === 81 || p2 === 82) return 'rupay';
  }
  if (digits.length >= 4) {
    const p4 = parseInt(digits.substring(0, 4), 10);
    if (p4 >= 2221 && p4 <= 2720) return 'mastercard';
    if (p4 === 6011) return 'discover';
  }
  return 'unknown';
}

/** Standard Luhn checksum — catches typos in card numbers. */
function passesLuhn(digits: string): boolean {
  if (!digits) return false;
  let sum = 0;
  let alt = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = digits.charCodeAt(i) - 48;
    if (alt) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    alt = !alt;
  }
  return sum % 10 === 0;
}

/** "1234123412341234" → "1234 1234 1234 1234" (or 4-6-5 for Amex). */
function formatCardNumber(digits: string, brand: CardBrand): string {
  if (brand === 'amex') {
    // 4-6-5 grouping
    return digits
      .replace(/^(\d{0,4})(\d{0,6})(\d{0,5}).*$/, (_, a, b, c) =>
        [a, b, c].filter(Boolean).join(' '));
  }
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
}

@Component({
  selector: 'app-upgrade',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="upgrade-wrap">

      <!-- HERO -->
      <div class="hero animate-in">
        @if (reason() === 'limit') {
          <div class="hero-badge limit">⚠️ Listing limit reached</div>
        } @else {
          <div class="hero-badge">⭐ Upgrade your account</div>
        }
        <h1 class="hero-title">
          @if (reason() === 'limit') {
            You've hit your free listing limit
          } @else {
            Unlock more listings and reach more buyers
          }
        </h1>
        <p class="hero-sub">
          @if (step() === 'card') {
            You're upgrading to <strong>{{ selectedPlan()?.name }}</strong> — ₹{{ selectedPlan()?.priceInr?.toLocaleString('en-IN') }}.
            An admin will activate your subscription within 24 hours of payment.
          } @else if (reason() === 'limit') {
            Pick a plan below to keep listing properties and stay visible to thousands of serious buyers across UP.
          } @else {
            Pick the plan that fits how you list. Upgrade or cancel any time.
          }
        </p>
      </div>

      <!-- ── STEP: PLAN ──────────────────────────────────────────────────── -->
      @if (step() === 'plan') {

        <!-- BILLING TOGGLE -->
        <div class="billing-toggle animate-in">
          <button class="toggle-btn" [class.active]="billingCycle() === 'monthly'"
                  (click)="billingCycle.set('monthly')">Monthly</button>
          <button class="toggle-btn" [class.active]="billingCycle() === 'yearly'"
                  (click)="billingCycle.set('yearly')">
            Yearly <span class="save-pill">Save ~17%</span>
          </button>
        </div>

        @if (loadingPlans()) {
          <div class="loading">Loading plans…</div>
        }

        @if (!loadingPlans() && visiblePlans().length > 0) {
          <div class="plan-grid animate-in">
            @for (plan of visiblePlans(); track plan.code) {
              <div class="plan-card" [class.featured]="plan.tier === 'pro'">
                @if (plan.tier === 'pro') { <div class="ribbon">Most popular</div> }
                <div class="plan-tier">{{ plan.tier === 'pro' ? 'PRO' : 'BASIC' }}</div>
                <div class="plan-price-row">
                  <span class="plan-price">₹{{ plan.priceInr.toLocaleString('en-IN') }}</span>
                  <span class="plan-cycle">/ {{ plan.cycle === 'yearly' ? 'year' : 'month' }}</span>
                </div>
                <p class="plan-tagline">
                  {{ plan.tier === 'pro'
                      ? 'For agents, builders & developers who list at scale.'
                      : 'For active owners who want a few listings live at once.' }}
                </p>
                <ul class="feature-list">
                  @for (f of plan.features; track f) {
                    <li><span class="tick">✓</span> {{ f }}</li>
                  }
                </ul>
                <button class="cta-btn" [class.cta-primary]="plan.tier === 'pro'"
                        (click)="choosePlan(plan)">
                  Choose {{ plan.tier === 'pro' ? 'Pro' : 'Basic' }}
                </button>
              </div>
            }
          </div>
        }
      }

      <!-- ── STEP: CARD ──────────────────────────────────────────────────── -->
      @if (step() === 'card' && selectedPlan(); as plan) {
        <div class="card-form animate-in text-gray-900">
          <button class="back-link" (click)="step.set('plan')">← Choose a different plan</button>

          <div class="form-grid">
            <!-- Cardholder name -->
            <div class="field full">
              <label for="cardName">Cardholder name</label>
              <input id="cardName" type="text" autocomplete="cc-name"
                     [ngModel]="cardName()"
                     (ngModelChange)="cardName.set($event)"
                     placeholder="As printed on the card" />
            </div>

            <!-- Card number with live brand badge -->
            <div class="field full">
              <label for="cardNumber">Card number</label>
              <div class="card-input-wrap">
                <input id="cardNumber" type="text" inputmode="numeric"
                       autocomplete="cc-number"
                       [maxlength]="cardBrand() === 'amex' ? 17 : 19"
                       [ngModel]="cardNumberDisplay()"
                       (ngModelChange)="onCardNumberInput($event)"
                       placeholder="1234 5678 9012 3456" />
                <span class="brand-badge" [attr.data-brand]="cardBrand()">
                  {{ brandLabel(cardBrand()) }}
                </span>
              </div>
            </div>

            <!-- Expiry -->
            <div class="field">
              <label for="cardExpiry">Expiry (MM/YY)</label>
              <input id="cardExpiry" type="text" inputmode="numeric"
                     autocomplete="cc-exp" maxlength="5"
                     [ngModel]="cardExpiry()"
                     (ngModelChange)="onExpiryInput($event)"
                     placeholder="MM/YY" />
            </div>

            <!-- CVV (collected for UX, never sent or stored) -->
            <div class="field">
              <label for="cardCvv">CVV</label>
              <input id="cardCvv" type="text" inputmode="numeric"
                     autocomplete="cc-csc"
                     [maxlength]="cardBrand() === 'amex' ? 4 : 3"
                     [ngModel]="cardCvv()"
                     (ngModelChange)="onCvvInput($event)"
                     [placeholder]="cardBrand() === 'amex' ? '4 digits' : '3 digits'" />
            </div>
          </div>

          @if (cardError()) {
            <div class="error-banner">⚠️ {{ cardError() }}</div>
          }

          <div class="actions">
            <button class="cta-btn cta-primary cta-wide"
                    [disabled]="paying()"
                    (click)="submitPayment()">
              @if (paying()) { Processing… }
              @else { Pay ₹{{ plan.priceInr.toLocaleString('en-IN') }} → }
            </button>
          </div>

          <p class="legal-note">
            🔒 Your card details are sent over HTTPS. We store only the
            cardholder name, last 4 digits, brand, and expiry — never the
            full card number or CVV. This is a demo checkout — no real charge
            is made.
          </p>
        </div>
      }

      <!-- ── STEP: SUCCESS ───────────────────────────────────────────────── -->
      @if (step() === 'success' && successResult(); as result) {
        <div class="success-card animate-in">
          <div class="success-icon">⏳</div>
          <h2 class="success-title">Submitted for review</h2>
          <p class="success-msg">{{ result.message }}</p>
          <p class="success-sub">
            We'll email you as soon as the activation is approved. You can keep
            using your free-tier listings until then.
          </p>
          <a class="success-cta" [routerLink]="returnUrl()">
            Continue → {{ returnUrl() === '/property/create' ? 'List your property' : 'Continue' }}
          </a>
        </div>
      }

      <!-- ERROR -->
      @if (errorMessage()) {
        <div class="error-banner animate-in">⚠️ {{ errorMessage() }}</div>
      }

      <p class="trust-line">
        🔒 Demo checkout — no real card is charged. Replace with Razorpay
        before taking real money.
      </p>
    </div>
  `,
  styles: [`
    :host {
      --blue: #2c7be5;
      --blue-light: #f0f6ff;
      --blue-hover: #1a63c5;
      --navy: #1a1a2e;
      --muted: #888;
      --border: #e8eaed;
      --surface: #fff;
      --green: #16a34a;
      --amber: #d97706;
      --red: #dc2626;
      --shadow: 0 2px 16px rgba(0,0,0,0.07);
    }

    .upgrade-wrap { max-width: 1040px; margin: 0 auto; padding: 48px 20px 80px; }

    /* HERO */
    .hero { text-align: center; margin-bottom: 32px; }
    .hero-badge { display: inline-block; background: var(--blue-light); color: var(--blue); font-size: 0.78rem; font-weight: 700; padding: 4px 14px; border-radius: 20px; margin-bottom: 14px; letter-spacing: 0.04em; }
    .hero-badge.limit { background: #fff5e6; color: var(--amber); }
    .hero-title { font-size: 2rem; font-weight: 800; color: var(--navy); margin: 0 0 10px; line-height: 1.2; }
    .hero-sub { font-size: 1rem; color: var(--muted); max-width: 620px; margin: 0 auto; line-height: 1.55; }

    /* BILLING TOGGLE */
    .billing-toggle { display: inline-flex; background: #f4f6f9; border-radius: 999px; padding: 4px; margin: 0 auto 28px; gap: 4px; display: flex; justify-content: center; width: fit-content; margin-left: auto; margin-right: auto; }
    .toggle-btn { background: transparent; border: none; padding: 9px 22px; font-size: 0.9rem; font-weight: 600; color: #555; border-radius: 999px; cursor: pointer; transition: all 0.15s; display: flex; align-items: center; gap: 8px; }
    .toggle-btn.active { background: var(--surface); color: var(--navy); box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
    .save-pill { background: #e8f8ee; color: var(--green); font-size: 0.7rem; padding: 2px 8px; border-radius: 999px; font-weight: 700; }

    /* PLAN GRID */
    .plan-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 32px; }
    .plan-card { position: relative; background: var(--surface); border: 1.5px solid var(--border); border-radius: 16px; padding: 28px; box-shadow: var(--shadow); display: flex; flex-direction: column; }
    .plan-card.featured { border-color: var(--blue); box-shadow: 0 8px 28px rgba(44,123,229,0.18); }
    .ribbon { position: absolute; top: -12px; right: 24px; background: var(--blue); color: #fff; font-size: 0.7rem; font-weight: 800; padding: 4px 12px; border-radius: 999px; letter-spacing: 0.06em; }
    .plan-tier { font-size: 0.74rem; font-weight: 800; color: var(--blue); letter-spacing: 0.12em; margin-bottom: 12px; }
    .plan-price-row { display: flex; align-items: baseline; gap: 6px; margin-bottom: 8px; }
    .plan-price { font-size: 2.2rem; font-weight: 800; color: var(--navy); }
    .plan-cycle { font-size: 0.9rem; color: var(--muted); font-weight: 500; }
    .plan-tagline { font-size: 0.88rem; color: var(--muted); margin: 0 0 18px; line-height: 1.5; }
    .feature-list { list-style: none; padding: 0; margin: 0 0 22px; flex: 1; display: flex; flex-direction: column; gap: 10px; }
    .feature-list li { display: flex; align-items: flex-start; gap: 10px; font-size: 0.9rem; color: #333; }
    .tick { color: var(--green); font-weight: 800; flex-shrink: 0; }
    .cta-btn { background: var(--surface); border: 1.5px solid var(--blue); color: var(--blue); padding: 12px 16px; border-radius: 10px; font-size: 0.95rem; font-weight: 700; cursor: pointer; transition: all 0.15s; }
    .cta-btn:hover:not(:disabled) { background: var(--blue-light); }
    .cta-primary { background: var(--blue); color: #fff; border-color: var(--blue); }
    .cta-primary:hover:not(:disabled) { background: var(--blue-hover); border-color: var(--blue-hover); }
    .cta-btn:disabled { opacity: 0.55; cursor: not-allowed; }
    .cta-wide { width: 100%; padding: 14px; font-size: 1rem; }

    /* CARD FORM */
    .card-form { background: var(--surface); border: 1.5px solid var(--border); border-radius: 16px; padding: 28px; box-shadow: var(--shadow); max-width: 540px; margin: 0 auto; }
    .back-link { background: none; border: none; color: var(--blue); cursor: pointer; font-size: 0.85rem; font-weight: 600; padding: 0 0 14px; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    .field { display: flex; flex-direction: column; gap: 6px; }
    .field.full { grid-column: 1 / -1; }
    .field label { font-size: 0.78rem; color: #555; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; }
    .field input { padding: 10px 12px; border: 1.5px solid var(--border); border-radius: 8px; font-size: 0.95rem; }
    .field input:focus { outline: none; border-color: var(--blue); }
    .card-input-wrap { position: relative; }
    .card-input-wrap input { padding-right: 88px; width: 100%; box-sizing: border-box; }
    .brand-badge { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); padding: 3px 8px; border-radius: 4px; font-size: 0.7rem; font-weight: 800; letter-spacing: 0.04em; background: #f3f4f6; color: #6b7280; text-transform: uppercase; }
    .brand-badge[data-brand="visa"]       { background: #1a1f71; color: #fff; }
    .brand-badge[data-brand="mastercard"] { background: #eb001b; color: #fff; }
    .brand-badge[data-brand="amex"]       { background: #2e77bb; color: #fff; }
    .brand-badge[data-brand="rupay"]      { background: #097dc6; color: #fff; }
    .brand-badge[data-brand="discover"]   { background: #ff6000; color: #fff; }
    .brand-badge[data-brand="diners"]     { background: #0079be; color: #fff; }
    .actions { margin-top: 20px; }
    .legal-note { font-size: 0.75rem; color: var(--muted); margin: 14px 0 0; line-height: 1.5; text-align: center; }

    /* STATES */
    .loading { text-align: center; color: var(--muted); padding: 40px 0; font-size: 0.95rem; }
    .error-banner { background: #fef2f2; border: 1px solid #fecaca; color: var(--red); padding: 12px 16px; border-radius: 10px; font-size: 0.9rem; margin: 12px 0; }

    /* SUCCESS */
    .success-card { background: var(--surface); border: 1.5px solid var(--amber); border-radius: 16px; padding: 36px; text-align: center; box-shadow: var(--shadow); margin-top: 16px; max-width: 540px; margin-left: auto; margin-right: auto; }
    .success-icon { font-size: 2.6rem; margin-bottom: 12px; }
    .success-title { font-size: 1.4rem; font-weight: 800; color: var(--navy); margin: 0 0 8px; }
    .success-msg { color: #444; margin: 0 0 6px; font-size: 0.95rem; }
    .success-sub { color: var(--muted); font-size: 0.85rem; margin: 0 0 18px; }
    .success-cta { display: inline-block; background: var(--blue); color: #fff; padding: 12px 26px; border-radius: 10px; font-size: 0.95rem; font-weight: 700; text-decoration: none; }
    .success-cta:hover { background: var(--blue-hover); }

    .trust-line { text-align: center; color: var(--muted); font-size: 0.78rem; margin: 24px 0 0; }

    .animate-in { animation: fadeUp 0.3s ease both; }
    @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }

    @media (max-width: 720px) {
      .plan-grid { grid-template-columns: 1fr; }
      .form-grid { grid-template-columns: 1fr; }
      .hero-title { font-size: 1.55rem; }
    }
  `]
})
export class UpgradePage implements OnInit {
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);

  private apiUrl = `${appConfig.baseUrl}/api/payment`;

  plans = signal<Plan[]>([]);
  loadingPlans = signal(true);
  billingCycle = signal<'monthly' | 'yearly'>('monthly');
  errorMessage = signal('');
  successResult = signal<PaymentResult | null>(null);

  // Three-step flow: pick a plan → enter card → see confirmation
  step = signal<'plan' | 'card' | 'success'>('plan');
  selectedPlan = signal<Plan | null>(null);

  // Card form state. cardNumberDisplay is the spaced/formatted version shown
  // in the input; cardNumberDigits is the raw digit string we ship to the API.
  cardName = signal('');
  cardNumberDisplay = signal('');
  cardNumberDigits = signal('');
  cardExpiry = signal('');
  cardCvv = signal('');
  cardError = signal('');
  paying = signal(false);

  cardBrand = computed<CardBrand>(() => detectCardBrand(this.cardNumberDigits()));

  reason = signal<'limit' | 'browse'>('browse');
  returnUrl = signal<string>('/property/create');

  visiblePlans = computed(() =>
    this.plans().filter(p => p.cycle === this.billingCycle())
  );

  ngOnInit(): void {
    this.route.queryParams.subscribe(p => {
      if (p['reason'] === 'limit') this.reason.set('limit');
      if (p['returnUrl']) this.returnUrl.set(p['returnUrl']);
    });

    this.http.get<Plan[]>(`${this.apiUrl}/plans`).subscribe({
      next: (plans) => {
        this.plans.set(plans);
        this.loadingPlans.set(false);
      },
      error: () => {
        this.loadingPlans.set(false);
        this.errorMessage.set('Could not load plans. Please refresh the page.');
      }
    });
  }

  // ── Step 1 → Step 2 ────────────────────────────────────────────────────
  choosePlan(plan: Plan): void {
    this.errorMessage.set('');
    if (!this.authService.isAuthenticated()) {
      this.authService.requestAuthModal('signin');
      this.errorMessage.set('Please sign in to continue with payment.');
      return;
    }
    this.selectedPlan.set(plan);
    this.step.set('card');
  }

  // ── Card input handlers ────────────────────────────────────────────────
  onCardNumberInput(value: string): void {
    const digits = (value || '').replace(/\D/g, '').slice(0, 19);
    this.cardNumberDigits.set(digits);
    this.cardNumberDisplay.set(formatCardNumber(digits, detectCardBrand(digits)));
    this.cardError.set('');
  }

  onExpiryInput(value: string): void {
    // Auto-insert "/" between MM and YY as the user types.
    let digits = (value || '').replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) {
      digits = digits.substring(0, 2) + '/' + digits.substring(2);
    }
    this.cardExpiry.set(digits);
    this.cardError.set('');
  }

  onCvvInput(value: string): void {
    const digits = (value || '').replace(/\D/g, '').slice(0, 4);
    this.cardCvv.set(digits);
    this.cardError.set('');
  }

  brandLabel(b: CardBrand): string {
    return b === 'unknown' ? 'CARD' : b.toUpperCase();
  }

  // ── Step 2 → Step 3 ────────────────────────────────────────────────────
  submitPayment(): void {
    const plan = this.selectedPlan();
    if (!plan) return;

    // Local validation — matches the server's rules so we fail fast and
    // give a friendly message instead of a generic 400.
    if (!this.cardName().trim()) {
      this.cardError.set('Cardholder name is required.');
      return;
    }
    const digits = this.cardNumberDigits();
    if (digits.length < 12 || !passesLuhn(digits)) {
      this.cardError.set('Card number doesn\'t look right. Check for typos.');
      return;
    }
    const expiry = this.cardExpiry();
    const m = expiry.match(/^(\d{2})\/(\d{2})$/);
    if (!m) {
      this.cardError.set('Expiry should be MM/YY.');
      return;
    }
    const month = parseInt(m[1], 10);
    const year  = 2000 + parseInt(m[2], 10);
    if (month < 1 || month > 12) {
      this.cardError.set('Expiry month must be 01–12.');
      return;
    }
    const expiryEnd = new Date(year, month, 0);   // last day of that month
    if (expiryEnd < new Date(Date.now() - 24 * 3600 * 1000)) {
      this.cardError.set('Card has expired.');
      return;
    }
    const expectedCvv = this.cardBrand() === 'amex' ? 4 : 3;
    if (this.cardCvv().length !== expectedCvv) {
      this.cardError.set(`CVV should be ${expectedCvv} digits.`);
      return;
    }

    this.paying.set(true);
    this.cardError.set('');

    // The full card number goes over HTTPS once for last4/brand extraction;
    // server discards everything but those two and the safe metadata.
    this.http.post<PaymentResult>(`${this.apiUrl}/confirm`, {
      planCode: plan.code,
      cardholderName: this.cardName().trim(),
      cardNumber: digits,
      cardExpiryMonth: month,
      cardExpiryYear: year,
    }).subscribe({
      next: (result) => {
        this.paying.set(false);
        this.successResult.set(result);
        this.step.set('success');
        // Wipe in-memory card data once we're past the post — no point
        // keeping it around longer than necessary even though we never
        // persisted it client-side.
        this.cardName.set('');
        this.cardNumberDigits.set('');
        this.cardNumberDisplay.set('');
        this.cardExpiry.set('');
        this.cardCvv.set('');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
      error: (err) => {
        this.paying.set(false);
        this.cardError.set(err?.error?.message ?? 'Payment failed. Please check your details and try again.');
      }
    });
  }
}
