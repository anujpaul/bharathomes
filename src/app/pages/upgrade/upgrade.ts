import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  subscriptionExpiry?: string;
}

@Component({
  selector: 'app-upgrade',
  standalone: true,
  imports: [CommonModule, RouterLink],
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
          @if (reason() === 'limit') {
            Pick a plan below to keep listing properties and stay visible to thousands of serious buyers across UP.
          } @else {
            Pick the plan that fits how you list. Upgrade or cancel any time.
          }
        </p>
      </div>

      <!-- BILLING TOGGLE -->
      <div class="billing-toggle animate-in">
        <button
          class="toggle-btn"
          [class.active]="billingCycle() === 'monthly'"
          (click)="billingCycle.set('monthly')">Monthly</button>
        <button
          class="toggle-btn"
          [class.active]="billingCycle() === 'yearly'"
          (click)="billingCycle.set('yearly')">
          Yearly <span class="save-pill">Save ~17%</span>
        </button>
      </div>

      <!-- LOADING -->
      @if (loadingPlans()) {
        <div class="loading">Loading plans…</div>
      }

      <!-- PLAN GRID -->
      @if (!loadingPlans() && visiblePlans().length > 0) {
        <div class="plan-grid animate-in">
          @for (plan of visiblePlans(); track plan.code) {
            <div class="plan-card" [class.featured]="plan.tier === 'pro'">
              @if (plan.tier === 'pro') {
                <div class="ribbon">Most popular</div>
              }
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

              <button
                class="cta-btn"
                [class.cta-primary]="plan.tier === 'pro'"
                [disabled]="payingCode() !== null"
                (click)="pay(plan)">
                @if (payingCode() === plan.code) {
                  Processing…
                } @else {
                  Choose {{ plan.tier === 'pro' ? 'Pro' : 'Basic' }}
                }
              </button>
            </div>
          }
        </div>
      }

      <!-- ERROR -->
      @if (errorMessage()) {
        <div class="error-banner animate-in">⚠️ {{ errorMessage() }}</div>
      }

      <!-- SUCCESS -->
      @if (successResult(); as result) {
        <div class="success-card animate-in">
          <div class="success-icon">🎉</div>
          <h2 class="success-title">You're upgraded!</h2>
          <p class="success-msg">{{ result.message }}</p>
          @if (result.subscriptionExpiry) {
            <p class="success-sub">Your subscription is active until
              <strong>{{ result.subscriptionExpiry | date:'mediumDate' }}</strong>.
            </p>
          }
          <a class="success-cta" [routerLink]="returnUrl()">
            Continue → {{ returnUrl() === '/property/create' ? 'List your property' : 'Continue' }}
          </a>
        </div>
      }

      <!-- TRUST FOOTER -->
      <p class="trust-line">
        🔒 This is a demo checkout — no real card is charged.
        We'll wire up a real payment gateway once plans are finalized.
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
    .billing-toggle { display: inline-flex; background: #f4f6f9; border-radius: 999px; padding: 4px; margin: 0 auto 28px; gap: 4px; }
    .billing-toggle { display: flex; justify-content: center; }
    .billing-toggle { width: fit-content; margin-left: auto; margin-right: auto; }
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

    /* STATES */
    .loading { text-align: center; color: var(--muted); padding: 40px 0; font-size: 0.95rem; }
    .error-banner { background: #fef2f2; border: 1px solid #fecaca; color: var(--red); padding: 12px 16px; border-radius: 10px; font-size: 0.9rem; margin-bottom: 16px; }

    /* SUCCESS */
    .success-card { background: var(--surface); border: 1.5px solid var(--green); border-radius: 16px; padding: 36px; text-align: center; box-shadow: var(--shadow); margin-top: 16px; }
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
  payingCode = signal<string | null>(null);
  errorMessage = signal('');
  successResult = signal<PaymentResult | null>(null);

  // 'limit' = arrived here after hitting LISTING_LIMIT_REACHED
  // 'browse' = came on their own
  reason = signal<'limit' | 'browse'>('browse');
  returnUrl = signal<string>('/property/create');

  visiblePlans = computed(() =>
    this.plans().filter(p => p.cycle === this.billingCycle())
  );

  ngOnInit(): void {
    // Read context from query params
    this.route.queryParams.subscribe(p => {
      if (p['reason'] === 'limit') this.reason.set('limit');
      if (p['returnUrl']) this.returnUrl.set(p['returnUrl']);
    });

    // Anyone can browse plans, but you must be signed in to pay.
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

  pay(plan: Plan) {
    this.errorMessage.set('');

    if (!this.authService.isAuthenticated()) {
      // Bounce them through sign-in first; bring them back here after.
      this.authService.requestAuthModal('signin');
      this.errorMessage.set('Please sign in to continue with payment.');
      return;
    }

    this.payingCode.set(plan.code);

    // Mock payment: in a real integration we'd open Razorpay/Stripe here, then
    // call /confirm only after the gateway returned success. For now we just
    // simulate a brief delay so the button shows feedback.
    setTimeout(() => {
      this.http.post<PaymentResult>(`${this.apiUrl}/confirm`, { planCode: plan.code }).subscribe({
        next: (result) => {
          this.payingCode.set(null);
          this.successResult.set(result);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        },
        error: (err) => {
          this.payingCode.set(null);
          this.errorMessage.set(err?.error?.message ?? 'Payment failed. Please try again.');
        }
      });
    }, 800);
  }
}
