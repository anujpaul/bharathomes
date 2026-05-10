import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '@/app/services/auth.service';
import { appConfig } from '@/app/config/app-config';
import { UserRole, KycStatus } from '@/types';

// type KycStatus = 'pending' | 'pending' | 'submitted' | 'verified' | 'rejected';
// type UserRole = 'owner' | 'agent' | 'builder' | 'developer';

@Component({
  selector: 'app-kyc',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  template: `
    <div class="kyc-wrapper">

      <!-- STATUS BANNER — shown if already submitted/verified/rejected -->
      @if (kycStatus() === 'verified') {
        <div class="status-screen verified animate-in">
          <div class="status-icon">✅</div>
          <h2>Identity Verified</h2>
          <p>Your KYC is complete. You can now list properties on BharatHomes.</p>
          <a [routerLink]="returnUrl" class="btn-primary">Continue to Listing →</a>
        </div>
      }

      @if (kycStatus() === 'submitted') {
        <div class="status-screen submitted animate-in">
          <div class="status-icon">⏳</div>
          <h2>Verification In Progress</h2>
          <p>We've received your documents and are reviewing them. This usually takes <strong>1–2 business days</strong>.</p>
          <p class="status-sub">We'll notify you at <strong>{{ userEmail() }}</strong> once verified.</p>
          <a routerLink="/" class="btn-secondary">Back to Home</a>
        </div>
      }

      @if (kycStatus() === 'rejected') {
        <div class="status-screen rejected animate-in">
          <div class="status-icon">❌</div>
          <h2>Verification Failed</h2>
          <p>{{ rejectionReason() || 'Your documents could not be verified. Please resubmit.' }}</p>
          <button class="btn-primary" (click)="kycStatus.set('pending')">Resubmit Documents</button>
        </div>
      }

      <!-- MAIN KYC FORM -->
      @if (kycStatus() === 'pending' || kycStatus() === 'pending') {

        <div class="kyc-header animate-in">
          <div class="kyc-badge">🪪 Identity Verification</div>
          <h1 class="kyc-title">Complete your KYC</h1>
          <p class="kyc-subtitle">Required to list properties on BharatHomes. Takes less than 2 minutes.</p>
        </div>

        <!-- PROGRESS -->
        <div class="progress-track animate-in">
          @for (s of kycSteps; track s.id) {
            <div class="progress-step" [class.active]="kycStep() === s.id" [class.done]="kycStep() > s.id">
              <div class="progress-dot">
                @if (kycStep() > s.id) { ✓ } @else { {{ s.id }} }
              </div>
              <span>{{ s.label }}</span>
            </div>
            @if (s.id < kycSteps.length) {
              <div class="progress-line" [class.done]="kycStep() > s.id"></div>
            }
          }
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()">

          <!-- ── STEP 1: ROLE ── -->
          @if (kycStep() === 1) {
            <div class="kyc-card animate-in">
              <div class="card-head">
                <span class="card-icon">👤</span>
                <div>
                  <h2 class="card-title">Who are you?</h2>
                  <p class="card-desc">This determines what documents you need to provide</p>
                </div>
              </div>

              <div class="role-grid">
                @for (role of roles; track role.value) {
                  <div class="role-card" [class.selected]="form.get('role')?.value === role.value"
                    (click)="selectRole(role.value)">
                    <div class="role-icon">{{ role.icon }}</div>
                    <div class="role-name">{{ role.label }}</div>
                    <div class="role-desc">{{ role.desc }}</div>
                    <div class="role-docs">{{ role.docs }}</div>
                  </div>
                }
              </div>
              @if (isInvalid('role')) {
                <span class="error-msg">Please select your role</span>
              }
            </div>
          }

          <!-- ── STEP 2: PAN ── -->
          @if (kycStep() === 2) {
            <div class="kyc-card animate-in">
              <div class="card-head">
                <span class="card-icon">🪪</span>
                <div>
                  <h2 class="card-title">PAN Verification</h2>
                  <p class="card-desc">Your PAN is verified instantly against the NSDL database</p>
                </div>
              </div>

              <div class="field-group">
                <label class="field-label">Full Name (as on PAN) <span class="req">*</span></label>
                <input class="field-input" [class.invalid]="isInvalid('name')"
                  formControlName="name" type="text" placeholder="e.g. Priya Verma"
                  style="text-transform: uppercase">
                @if (isInvalid('name')) { <span class="error-msg">Name is required</span> }
              </div>

              <div class="field-group">
                <label class="field-label">PAN Number <span class="req">*</span></label>
                <div class="pan-wrap">
                  <input class="field-input pan-input" [class.invalid]="isInvalid('pan')"
                    formControlName="pan" type="text" maxlength="10"
                    placeholder="e.g. ABCDE1234F"
                    style="text-transform: uppercase; letter-spacing: 0.15em; font-weight: 600">
                  @if (panVerifying()) {
                    <span class="pan-spinner"></span>
                  }
                  @if (panVerified()) {
                    <span class="pan-check">✓</span>
                  }
                </div>
                @if (isInvalid('pan')) {
                  <span class="error-msg">Enter a valid PAN (e.g. ABCDE1234F)</span>
                }
                @if (panError()) {
                  <span class="error-msg">{{ panError() }}</span>
                }
                <span class="field-hint">Format: 5 letters · 4 digits · 1 letter</span>
              </div>

              <div class="info-box">
                🔒 Your PAN is verified securely and only the masked version is stored (e.g. ABCDE****F).
                We never share your PAN with third parties.
              </div>
            </div>
          }

          <!-- ── STEP 3: ROLE-SPECIFIC DOCS ── -->
          @if (kycStep() === 3) {
            <div class="kyc-card animate-in">

              <!-- Owner — no extra docs needed -->
              @if (selectedRole() === 'owner') {
                <div class="card-head">
                  <span class="card-icon">✅</span>
                  <div>
                    <h2 class="card-title">You're all set!</h2>
                    <p class="card-desc">As a property owner, PAN verification is sufficient. Review and submit below.</p>
                  </div>
                </div>
                <div class="summary-box">
                  <div class="summary-row">
                    <span class="summary-label">Role</span>
                    <span class="summary-val">🏠 Property Owner</span>
                  </div>
                  <div class="summary-row">
                    <span class="summary-label">PAN</span>
                    <span class="summary-val">{{ maskedPan() }}</span>
                  </div>
                  <div class="summary-row">
                    <span class="summary-label">Name</span>
                    <span class="summary-val">{{ form.get('name')?.value }}</span>
                  </div>
                  <div class="summary-row">
                    <span class="summary-label">Listing Limit</span>
                    <span class="summary-val">Up to 2 properties</span>
                  </div>
                </div>
              }

              <!-- Agent — needs RERA -->
              @if (selectedRole() === 'agent') {
                <div class="card-head">
                  <span class="card-icon">🏢</span>
                  <div>
                    <h2 class="card-title">RERA Registration</h2>
                    <p class="card-desc">Agents must be RERA registered. Enter your UP-RERA number.</p>
                  </div>
                </div>

                <div class="field-group">
                  <label class="field-label">RERA Registration Number <span class="req">*</span></label>
                  <input class="field-input" [class.invalid]="isInvalid('reraNumber')"
                    formControlName="reraNumber" type="text"
                    placeholder="e.g. UPRERAAGT12345">
                  @if (isInvalid('reraNumber')) {
                    <span class="error-msg">RERA number is required for agents</span>
                  }
                </div>

                <div class="field-group">
                  <label class="field-label">RERA State</label>
                  <select class="field-input" formControlName="reraState">
                    <option value="UP">Uttar Pradesh</option>
                    <option value="MH">Maharashtra</option>
                    <option value="DL">Delhi</option>
                    <option value="HR">Haryana</option>
                    <option value="RJ">Rajasthan</option>
                  </select>
                </div>

                <div class="info-box">
                  📋 Your RERA number will be manually verified against the UP-RERA portal within 1–2 business days.
                  <a href="https://www.up-rera.in" target="_blank" class="info-link">Check UP-RERA →</a>
                </div>

                <!-- Document Upload — add inside agent @if block -->
                <div class="field-group">
                  <label class="field-label">RERA Certificate <span class="req">*</span></label>
                  <div class="doc-upload-zone"
                    [class.has-file]="uploadedDocs().length > 0"
                    (click)="docInput.click()"
                    (dragover)="$event.preventDefault()"
                    (drop)="onDocDrop($event)">
                    <input #docInput type="file" accept=".pdf,.jpg,.jpeg,.png" style="display:none"
                      (change)="onDocSelect($event)">
                    @if (uploadedDocs().length === 0) {
                      <div class="doc-upload-content">
                        <div class="doc-upload-icon">📄</div>
                        <p class="doc-upload-label">Click or drag to upload RERA certificate</p>
                        <p class="doc-upload-hint">PDF, JPG, PNG · Max 5MB</p>
                      </div>
                    } @else {
                      <div class="doc-preview">
                        @for (doc of uploadedDocs(); track doc.name) {
                          <div class="doc-file">
                            <span class="doc-file-icon">{{ doc.type === 'application/pdf' ? '📋' : '🖼️' }}</span>
                            <span class="doc-file-name">{{ doc.name }}</span>
                            <button type="button" class="doc-remove" (click)="removeDoc($event, doc.name)">✕</button>
                          </div>
                        }
                        <p class="doc-add-more" (click)="docInput.click()">+ Add another</p>
                      </div>
                    }
                  </div>
                  @if (docError()) {
                    <span class="error-msg">{{ docError() }}</span>
                  }
                </div>
              }

              <!-- Builder / Developer — needs RERA + GST -->
              @if (selectedRole() === 'builder' || selectedRole() === 'developer') {
                <div class="card-head">
                  <span class="card-icon">🏗️</span>
                  <div>
                    <h2 class="card-title">Business Verification</h2>
                    <p class="card-desc">Builders and developers require RERA and GST verification</p>
                  </div>
                </div>

                <div class="field-group">
                  <label class="field-label">Company / Project Name <span class="req">*</span></label>
                  <input class="field-input" [class.invalid]="isInvalid('companyName')"
                    formControlName="companyName" type="text"
                    placeholder="e.g. Sunshine Developers Pvt Ltd">
                  @if (isInvalid('companyName')) {
                    <span class="error-msg">Company name is required</span>
                  }
                </div>

                <div class="two-col">
                  <div class="field-group">
                    <label class="field-label">RERA Number <span class="req">*</span></label>
                    <input class="field-input" [class.invalid]="isInvalid('reraNumber')"
                      formControlName="reraNumber" type="text"
                      placeholder="e.g. UPRERAPRJ12345">
                    @if (isInvalid('reraNumber')) {
                      <span class="error-msg">Required</span>
                    }
                  </div>
                  <div class="field-group">
                    <label class="field-label">GST Number <span class="req">*</span></label>
                    <input class="field-input" [class.invalid]="isInvalid('gstNumber')"
                      formControlName="gstNumber" type="text"
                      placeholder="e.g. 09ABCDE1234F1Z5"
                      style="text-transform: uppercase">
                    @if (isInvalid('gstNumber')) {
                      <span class="error-msg">Required</span>
                    }
                  </div>
                </div>

                <!-- After the RERA + GST fields in builder/developer block -->
                <div class="field-group">
                  <label class="field-label">Business Documents <span class="req">*</span></label>
                  <p class="field-hint" style="margin-bottom: 8px">Upload RERA certificate + GST registration certificate</p>
                  <div class="doc-upload-zone"
                    [class.has-file]="uploadedDocs().length > 0"
                    (click)="docInput.click()"
                    (dragover)="$event.preventDefault()"
                    (drop)="onDocDrop($event)">
                    <input #docInput type="file" accept=".pdf,.jpg,.jpeg,.png" multiple style="display:none"
                      (change)="onDocSelect($event)">
                    @if (uploadedDocs().length === 0) {
                      <div class="doc-upload-content">
                        <div class="doc-upload-icon">📁</div>
                        <p class="doc-upload-label">Click or drag to upload documents</p>
                        <p class="doc-upload-hint">PDF, JPG, PNG · Max 5MB each · Up to 5 files</p>
                      </div>
                    } @else {
                      <div class="doc-preview">
                        @for (doc of uploadedDocs(); track doc.name) {
                          <div class="doc-file">
                            <span class="doc-file-icon">{{ doc.type === 'application/pdf' ? '📋' : '🖼️' }}</span>
                            <span class="doc-file-name">{{ doc.name }}</span>
                            <button type="button" class="doc-remove" (click)="removeDoc($event, doc.name)">✕</button>
                          </div>
                        }
                        <p class="doc-add-more" (click)="docInput.click()">+ Add more</p>
                      </div>
                    }
                  </div>
                  @if (docError()) { <span class="error-msg">{{ docError() }}</span> }
                </div>



                <div class="info-box">
                  📋 RERA and GST will be verified manually within 1–2 business days. 
                  You'll receive an email at <strong>{{ userEmail() }}</strong> once approved.
                </div>
              }

            </div>

            
          }

          <!-- ERROR BANNER -->
          @if (submitError()) {
            <div class="error-banner">⚠️ {{ submitError() }}</div>
          }

          <!-- FOOTER NAV -->
          <div class="kyc-footer">
            @if (kycStep() > 1) {
              <button type="button" class="btn-back" (click)="prevStep()">← Back</button>
            } @else {
              <a class="btn-back" routerLink="/">Cancel</a>
            }

            <div class="footer-right">
              <span class="step-counter">Step {{ kycStep() }} of {{ kycSteps.length }}</span>
              @if (kycStep() < kycSteps.length) {
                <button type="button" class="btn-next" (click)="nextStep()">Continue →</button>
              } @else {
                <button type="submit" class="btn-submit" [disabled]="submitting()">
                  @if (submitting()) {
                    <span class="btn-spinner"></span> Submitting...
                  } @else {
                    🚀 Submit for Verification
                  }
                </button>
              }
            </div>
          </div>

        </form>
      }

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
      --red: #dc2626;
      --green: #16a34a;
      --amber: #d97706;
      --radius: 12px;
      --shadow: 0 2px 16px rgba(0,0,0,0.07);
    }

    .kyc-wrapper { max-width: 680px; margin: 0 auto; padding: 32px 20px 120px; }

    /* HEADER */
    .kyc-header { margin-bottom: 24px; }
    .kyc-badge { display: inline-block; background: var(--blue-light); color: var(--blue); font-size: 0.78rem; font-weight: 700; padding: 4px 12px; border-radius: 20px; margin-bottom: 12px; letter-spacing: 0.04em; }
    .kyc-title { font-size: 1.7rem; font-weight: 800; color: var(--navy); margin: 0 0 6px; }
    .kyc-subtitle { font-size: 0.9rem; color: var(--muted); margin: 0; }

    /* PROGRESS */
    .progress-track { display: flex; align-items: center; margin-bottom: 28px; }
    .progress-step { display: flex; align-items: center; gap: 8px; }
    .progress-dot { width: 28px; height: 28px; border-radius: 50%; border: 2px solid var(--border); background: var(--surface); display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 700; color: var(--muted); transition: all 0.2s; flex-shrink: 0; }
    .progress-step.active .progress-dot { border-color: var(--blue); background: var(--blue); color: #fff; }
    .progress-step.done .progress-dot { border-color: var(--green); background: var(--green); color: #fff; }
    .progress-step span { font-size: 0.8rem; color: var(--muted); font-weight: 500; }
    .progress-step.active span { color: var(--blue); font-weight: 600; }
    .progress-step.done span { color: var(--green); }
    .progress-line { flex: 1; height: 2px; background: var(--border); margin: 0 8px; transition: background 0.2s; }
    .progress-line.done { background: var(--green); }

    /* CARD */
    .kyc-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 24px; box-shadow: var(--shadow); margin-bottom: 16px; }
    .card-head { display: flex; align-items: flex-start; gap: 14px; margin-bottom: 24px; }
    .card-icon { font-size: 1.6rem; line-height: 1; margin-top: 2px; }
    .card-title { font-size: 1.05rem; font-weight: 700; color: var(--navy); margin: 0 0 2px; }
    .card-desc { font-size: 0.83rem; color: var(--muted); margin: 0; }

    /* ROLE GRID */
    .role-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .role-card { border: 2px solid var(--border); border-radius: 10px; padding: 16px; cursor: pointer; transition: all 0.15s; }
    .role-card:hover { border-color: var(--blue); background: var(--blue-light); }
    .role-card.selected { border-color: var(--blue); background: var(--blue-light); }
    .role-icon { font-size: 1.6rem; margin-bottom: 8px; }
    .role-name { font-size: 0.95rem; font-weight: 700; color: var(--navy); margin-bottom: 4px; }
    .role-desc { font-size: 0.78rem; color: var(--muted); margin-bottom: 6px; }
    .role-docs { font-size: 0.72rem; color: var(--blue); font-weight: 600; background: rgba(44,123,229,0.08); padding: 3px 8px; border-radius: 4px; display: inline-block; }

    /* FIELDS */
    .field-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 18px; }
    .field-label { font-size: 0.78rem; font-weight: 600; color: #555; text-transform: uppercase; letter-spacing: 0.05em; }
    .req { color: var(--red); margin-left: 2px; }
    .field-input { padding: 10px 12px; border: 1.5px solid var(--border); border-radius: 8px; font-size: 0.95rem; outline: none; transition: border-color 0.15s; width: 100%; box-sizing: border-box; }
    .field-input:focus { border-color: var(--blue); }
    .field-input.invalid { border-color: var(--red); }
    .error-msg { font-size: 0.78rem; color: var(--red); }
    .field-hint { font-size: 0.75rem; color: var(--muted); }
    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

    /* PAN INPUT */
    .pan-wrap { position: relative; display: flex; align-items: center; }
    .pan-input { padding-right: 40px !important; }
    .pan-spinner { position: absolute; right: 12px; width: 16px; height: 16px; border: 2px solid var(--border); border-top-color: var(--blue); border-radius: 50%; animation: spin 0.8s linear infinite; }
    .pan-check { position: absolute; right: 12px; color: var(--green); font-size: 1rem; font-weight: 700; }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* INFO BOX */
    .info-box { background: #f8faff; border: 1px solid #dce8fb; border-radius: 8px; padding: 12px 14px; font-size: 0.82rem; color: #4a6fa5; line-height: 1.5; margin-top: 4px; }
    .info-link { color: var(--blue); font-weight: 600; text-decoration: none; margin-left: 4px; }
    .info-link:hover { text-decoration: underline; }

    /* SUMMARY */
    .summary-box { background: #f8f9fa; border-radius: 10px; padding: 16px; display: flex; flex-direction: column; gap: 0; }
    .summary-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid var(--border); }
    .summary-row:last-child { border-bottom: none; }
    .summary-label { font-size: 0.78rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.04em; }
    .summary-val { font-size: 0.9rem; color: var(--navy); font-weight: 600; }

    /* STATUS SCREENS */
    .animate-in { animation: fadeUp 0.3s ease both; }
    @keyframes fadeUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
    .status-screen { text-align: center; padding: 60px 24px; max-width: 480px; margin: 60px auto; background: var(--surface); border: 1px solid var(--border); border-radius: 16px; box-shadow: var(--shadow); }
    .status-icon { font-size: 3rem; margin-bottom: 16px; }
    .status-screen h2 { font-size: 1.4rem; font-weight: 800; color: var(--navy); margin: 0 0 10px; }
    .status-screen p { font-size: 0.9rem; color: var(--muted); line-height: 1.6; margin: 0 0 8px; }
    .status-sub { font-size: 0.82rem !important; }

    /* ERROR BANNER */
    .error-banner { background: #fef2f2; border: 1px solid #fecaca; color: var(--red); padding: 12px 16px; border-radius: 8px; font-size: 0.88rem; margin-bottom: 16px; }

    /* FOOTER */
    .kyc-footer { position: fixed; bottom: 0; left: 0; right: 0; background: rgba(255,255,255,0.96); backdrop-filter: blur(8px); border-top: 1px solid var(--border); padding: 14px 24px; display: flex; align-items: center; justify-content: space-between; z-index: 100; }
    .footer-right { display: flex; align-items: center; gap: 14px; }
    .step-counter { font-size: 0.82rem; color: var(--muted); }
    .btn-back { padding: 9px 18px; border-radius: 8px; border: 1.5px solid var(--border); background: var(--surface); color: #444; cursor: pointer; font-size: 0.9rem; font-weight: 500; text-decoration: none; display: inline-flex; align-items: center; }
    .btn-next { padding: 9px 22px; border-radius: 8px; border: none; background: var(--blue); color: #fff; cursor: pointer; font-size: 0.9rem; font-weight: 600; transition: background 0.15s; }
    .btn-next:hover { background: var(--blue-hover); }
    .btn-submit { padding: 9px 22px; border-radius: 8px; border: none; background: var(--green); color: #fff; cursor: pointer; font-size: 0.9rem; font-weight: 600; display: flex; align-items: center; gap: 8px; }
    .btn-submit:disabled { opacity: 0.55; cursor: not-allowed; }
    .btn-primary { display: inline-block; margin-top: 20px; padding: 11px 28px; background: var(--blue); color: #fff; border-radius: 10px; font-weight: 700; text-decoration: none; font-size: 0.9rem; border: none; cursor: pointer; }
    .btn-secondary { display: inline-block; margin-top: 20px; padding: 11px 28px; background: #f0f0f0; color: #444; border-radius: 10px; font-weight: 700; text-decoration: none; font-size: 0.9rem; }
    .btn-spinner { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.4); border-top-color: #fff; border-radius: 50%; animation: spin 0.8s linear infinite; display: inline-block; }
    .doc-upload-zone { border: 2px dashed var(--border); border-radius: 10px; padding: 24px; cursor: pointer; transition: all 0.2s; }
    .doc-upload-zone:hover, .doc-upload-zone.has-file { border-color: var(--blue); background: var(--blue-light); }
    .doc-upload-content { display: flex; flex-direction: column; align-items: center; gap: 6px; text-align: center; }
    .doc-upload-icon { font-size: 1.8rem; }
    .doc-upload-label { font-size: 0.88rem; color: #444; margin: 0; }
    .doc-upload-hint { font-size: 0.75rem; color: var(--muted); margin: 0; }
    .doc-preview { display: flex; flex-direction: column; gap: 8px; }
    .doc-file { display: flex; align-items: center; gap: 10px; background: #fff; border: 1px solid var(--border); border-radius: 8px; padding: 8px 12px; }
    .doc-file-icon { font-size: 1.1rem; }
    .doc-file-name { flex: 1; font-size: 0.85rem; color: var(--navy); font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .doc-remove { background: none; border: none; color: var(--red); cursor: pointer; font-size: 0.8rem; padding: 2px 6px; border-radius: 4px; }
    .doc-remove:hover { background: #fef2f2; }
    .doc-add-more { font-size: 0.78rem; color: var(--blue); cursor: pointer; margin: 4px 0 0; font-weight: 600; }

    @media (max-width: 600px) {
      .role-grid { grid-template-columns: 1fr; }
      .two-col { grid-template-columns: 1fr; }
    }
  `]
})
export class Kyc implements OnInit {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);

  private apiUrl = `${appConfig.baseUrl}/api`;

  readonly roles: { value: UserRole; icon: string; label: string; desc: string; docs: string }[] = [
    { value: 'owner',     icon: '🏠', label: 'Property Owner',    desc: 'Selling or renting your own property',  docs: 'PAN only' },
    { value: 'agent',     icon: '🤝', label: 'Real Estate Agent',  desc: 'Licensed broker or agent',              docs: 'PAN + RERA' },
    { value: 'builder',   icon: '🏗️', label: 'Builder',            desc: 'Construction company or contractor',    docs: 'PAN + RERA + GST' },
    { value: 'developer', icon: '🏢', label: 'Developer',           desc: 'Real estate development company',       docs: 'PAN + RERA + GST' },
  ];

  readonly kycSteps = [
    { id: 1, label: 'Role' },
    { id: 2, label: 'PAN' },
    { id: 3, label: 'Documents' },
  ];

  kycStep = signal(1);
  kycStatus = signal<KycStatus>('pending');
  selectedRole = signal<UserRole>('owner');
  panVerifying = signal(false);
  panVerified = signal(false);
  panError = signal('');
  submitting = signal(false);
  submitError = signal('');
  returnUrl = '/property/create';
  userEmail = signal('');
  rejectionReason = signal('');

  uploadedDocs = signal<File[]>([]);
  docError = signal('');

  form: FormGroup = this.fb.group({
    role:        ['', Validators.required],
    name:        ['', Validators.required],
    pan:         ['', [Validators.required, Validators.pattern(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/)]],
    reraNumber:  [''],
    reraState:   ['UP'],
    gstNumber:   [''],
    companyName: [''],
  });

  ngOnInit() {
    // Grab returnUrl from query params
    this.route.queryParams.subscribe(p => {
      if (p['returnUrl']) {
        console.log("Return URL ");
        this.returnUrl = p['returnUrl'];
      }
    });

    // Load current KYC status from backend
    this.http.get<any>(`${this.apiUrl}/kyc/status`).subscribe({
      next: (res) => {
        const fresh = res.status ?? 'pending';
        this.kycStatus.set(fresh);
        this.userEmail.set(res.email ?? '');
        this.rejectionReason.set(res.rejectionReason ?? '');

        // The cached authService.authResponse() snapshot was taken at sign-in
        // and doesn't see admin-side changes. If our fresh /kyc/status doesn't
        // match the cache (e.g. admin just approved → DB says verified, cache
        // still says submitted), refresh the profile so kycGuard reads truth
        // on the next navigation. Without this the user gets stuck in a
        // /kyc → /property/create → /kyc loop after approval.
        const cachedStatus = this.authService.authResponse()?.kycStatus;
        if (cachedStatus !== fresh) {
          this.authService.fetchUserProfile();
        }
      }
    });

    // Auto-uppercase PAN as user types
    this.form.get('pan')!.valueChanges.subscribe(v => {
      if (v) {
        const upper = v.toUpperCase();
        if (v !== upper) this.form.get('pan')!.setValue(upper, { emitEvent: false });
      }
      this.panVerified.set(false);
      this.panError.set('');
    });
  }

  selectRole(role: UserRole) {
    this.selectedRole.set(role);
    this.form.get('role')!.setValue(role);

    // Set validators dynamically based on role
    const reraCtrl = this.form.get('reraNumber')!;
    const gstCtrl = this.form.get('gstNumber')!;
    const companyCtrl = this.form.get('companyName')!;

    if (role === 'agent') {
      reraCtrl.setValidators(Validators.required);
      gstCtrl.clearValidators();
      companyCtrl.clearValidators();
    } else if (role === 'builder' || role === 'developer') {
      reraCtrl.setValidators(Validators.required);
      gstCtrl.setValidators([Validators.required, Validators.pattern(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/)]);
      companyCtrl.setValidators(Validators.required);
    } else {
      reraCtrl.clearValidators();
      gstCtrl.clearValidators();
      companyCtrl.clearValidators();
    }

    [reraCtrl, gstCtrl, companyCtrl].forEach(c => c.updateValueAndValidity());
  }

  isInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl?.invalid && ctrl?.touched);
  }

  maskedPan(): string {
    const pan = this.form.get('pan')?.value ?? '';
    return pan.length === 10 ? pan.slice(0, 5) + '****' + pan.slice(9) : pan;
  }

  // ── Verify PAN against backend before proceeding ──────────────────────
  private verifyPan(): Promise<boolean> {
    const pan = this.form.get('pan')?.value;
    const name = this.form.get('name')?.value;

    if (!pan || !name) return Promise.resolve(false);

    this.panVerifying.set(true);
    this.panError.set('');

    return this.http.post<any>(`${this.apiUrl}/kyc/verify-pan`, { panNumber: pan, name })
      .toPromise()
      .then(() => {
        this.panVerifying.set(false);
        this.panVerified.set(true);
        return true;
      })
      .catch(err => {
        this.panVerifying.set(false);
        this.panVerified.set(false);
        this.panError.set(err?.error?.message ?? 'PAN verification failed. Please check and try again.');
        return false;
      });
  }

  // ── Navigation ────────────────────────────────────────────────────────
  async nextStep() {
    const step = this.kycStep();

    if (step === 1) {
      this.form.get('role')?.markAsTouched();
      if (!this.form.get('role')?.value) return;
    }

    if (step === 2) {
      this.form.get('name')?.markAsTouched();
      this.form.get('pan')?.markAsTouched();
      if (this.form.get('name')?.invalid || this.form.get('pan')?.invalid) return;

      // Verify PAN before moving to step 3
      const verified = await this.verifyPan();
      if (!verified) return;
    }

    this.kycStep.set(step + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  prevStep() {
    this.kycStep.set(this.kycStep() - 1);
    this.panVerified.set(false);
  }

  // ── Submit ────────────────────────────────────────────────────────────
  onSubmit() {
    this.form.markAllAsTouched();
    const role = this.selectedRole();
  
    // Require at least one document for non-owners
    if (role !== 'owner' && this.uploadedDocs().length === 0) {
      this.docError.set('Please upload at least one document.');
      return;
    }
  
    const fieldsToCheck = ['reraNumber', 'gstNumber', 'companyName'];
    if (fieldsToCheck.some(f => this.form.get(f)?.invalid)) return;
  
    this.submitting.set(true);
    this.submitError.set('');
  
    // Use FormData so files can be sent alongside text fields
    const formData = new FormData();
    formData.append('role', role);
    formData.append('pan', this.form.get('pan')?.value);
    formData.append('name', this.form.get('name')?.value);
    if (this.form.get('reraNumber')?.value) formData.append('reraNumber', this.form.get('reraNumber')?.value);
    if (this.form.get('reraState')?.value)  formData.append('reraState',  this.form.get('reraState')?.value);
    if (this.form.get('gstNumber')?.value)  formData.append('gstNumber',  this.form.get('gstNumber')?.value);
    if (this.form.get('companyName')?.value) formData.append('companyName', this.form.get('companyName')?.value);
    this.uploadedDocs().forEach(f => formData.append('documents', f, f.name));
  
    this.http.post(`${this.apiUrl}/kyc/submit`, formData).subscribe({
      next: () => {
        this.submitting.set(false);
        this.kycStatus.set('submitted');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
      error: (err) => {
        this.submitting.set(false);
        this.submitError.set(err?.error?.message ?? 'Submission failed. Please try again.');
      }
    });
  }

  onDocSelect(e: Event) {
    const input = e.target as HTMLInputElement;
    if (!input.files?.length) return;
    this.addDocs(Array.from(input.files));
    input.value = '';
  }
  
  onDocDrop(e: DragEvent) {
    e.preventDefault();
    const files = Array.from(e.dataTransfer?.files ?? []);
    this.addDocs(files);
  }
  
  private addDocs(files: File[]) {
    const allowed = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    const valid = files.filter(f => allowed.includes(f.type) && f.size <= 5 * 1024 * 1024);
  
    if (valid.length !== files.length)
      this.docError.set('Some files were skipped. Only PDF/JPG/PNG under 5MB allowed.');
    else
      this.docError.set('');
  
    const remaining = 5 - this.uploadedDocs().length;
    this.uploadedDocs.update(docs => [...docs, ...valid.slice(0, remaining)]);
  }
  
  removeDoc(e: Event, name: string) {
    e.stopPropagation();
    this.uploadedDocs.update(docs => docs.filter(d => d.name !== name));
  }
}