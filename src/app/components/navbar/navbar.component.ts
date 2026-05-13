import { Component, computed, effect, ElementRef, HostListener, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Home, Search, Menu, X, Sun, Moon } from 'lucide-angular';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '@/app/services/auth.service';
import { ThemeService } from '@/app/services/theme.service';
import { UserTypeModalComponent } from '../user-type-modal/user-type-modal.component';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, RouterLink, UserTypeModalComponent],
  templateUrl: './navbar.component.html'
})
export class NavbarComponent {


  loginUrl = '/.auth/login/google?post_login_redirect_uri=/';
  logoutUrl = '/.auth/logout?post_login_redirect_uri=/';
  HomeIcon = Home;
  SearchIcon = Search;
  MenuIcon = Menu;
  CloseIcon = X;
  SunIcon = Sun;
  MoonIcon = Moon;
  confirmPassword = signal('');

  showOtpStep = signal(false);
  otp = signal('');
  pendingEmail = signal('');   // captured when OTP step activates
  otpSent = signal(false);

  isMenuOpen = false;
  showAuthModal = signal(false);
  authMode = signal<'signin' | 'signup'>('signin');

  email = signal('');
  password = signal('');
  name = signal('');
  isLoading = signal(false);
  errorMessage = signal('');

  showResetOtpStep = signal(false);
  resetOtp = signal('');
  resetEmail = signal('');
  newPassword = signal('');
  confirmNewPassword = signal('');

  authService = inject(AuthService);
  themeService = inject(ThemeService);
  private router = inject(Router);
  private host: ElementRef<HTMLElement> = inject(ElementRef);

  // Desktop "List Property" dropdown
  isListMenuOpen = signal(false);

  // Desktop Buy/Rent mega-menus. Only one open at a time so they swap when
  // the user moves between them rather than stacking.
  openMegaMenu = signal<null | 'buy' | 'rent'>(null);

  /**
   * The mega-menu shape is identical for Buy and Rent — only the intent
   * suffix in the route and the budget brackets differ. Defining once
   * here keeps the template a single template branch instead of two
   * near-duplicate ones.
   *
   * Each entry navigates to /buy or /rent with the corresponding query
   * param set. The listing page reads intent from the route data and
   * the rest from queryParams.
   */
  readonly propertyTypes = [
    { label: 'Apartment / Flat', value: 'Apartment', emoji: '🏢' },
    { label: 'Villa / House',    value: 'Villa',     emoji: '🏡' },
    { label: 'Plot / Land',      value: 'Plot',      emoji: '🌳' },
    { label: 'Commercial',       value: 'Commercial', emoji: '🏬' },
  ];

  readonly buyBudgets = [
    { label: 'Under ₹50L',  min: 0,        max: 5_000_000 },
    { label: '₹50L – ₹1Cr', min: 5_000_000, max: 10_000_000 },
    { label: '₹1 – ₹2Cr',   min: 10_000_000, max: 20_000_000 },
    { label: '₹2 – ₹5Cr',   min: 20_000_000, max: 50_000_000 },
    { label: '₹5Cr +',      min: 50_000_000, max: null as number | null },
  ];

  readonly rentBudgets = [
    { label: 'Under ₹15K',     min: 0,      max: 15_000 },
    { label: '₹15K – ₹30K',    min: 15_000, max: 30_000 },
    { label: '₹30K – ₹60K',    min: 30_000, max: 60_000 },
    { label: '₹60K – ₹1L',     min: 60_000, max: 100_000 },
    { label: '₹1L +',          min: 100_000, max: null as number | null },
  ];

  // UP cities — hardcoded for now since the project is UP-focused. Swap
  // this for a "top cities by listing count" API call when the dataset is
  // big enough that a fixed list feels limiting.
  readonly cities = [
    'Lucknow', 'Noida', 'Ghaziabad', 'Agra', 'Kanpur', 'Varanasi',
  ];

  /** Open / toggle a mega-menu, closing the other if needed. */
  toggleMega(menu: 'buy' | 'rent', ev: MouseEvent) {
    ev.stopPropagation();
    this.openMegaMenu.update(curr => curr === menu ? null : menu);
  }

  /** Navigate to /buy or /rent with the chosen filter param set. */
  goToListings(
    intent: 'buy' | 'rent',
    params: { type?: string; minPrice?: number; maxPrice?: number | null; city?: string } = {},
  ) {
    this.openMegaMenu.set(null);
    this.isMenuOpen = false;

    const queryParams: Record<string, string> = {};
    if (params.type) queryParams['type'] = params.type;
    if (params.city) queryParams['city'] = params.city;
    if (params.minPrice != null) queryParams['minPrice'] = String(params.minPrice);
    if (params.maxPrice != null) queryParams['maxPrice'] = String(params.maxPrice);

    this.router.navigate([`/${intent}`], { queryParams });
  }

  constructor() {
    // Listen for global requests to open the auth modal (e.g. from the home page)
    effect(() => {
      const requested = this.authService.authModalRequest();
      if (requested) {
        this.openAuthModal(requested);
        this.authService.authModalRequest.set(null);
      }
    });
  }

  /**
   * Entry point for "List for Sale" / "List for Rent" CTAs in the navbar.
   * If the user isn't signed in we pop the auth modal; otherwise we navigate
   * to the create-property page with the listing intent preselected.
   */
  startListing(intent: 'sell' | 'rent' = 'sell') {
    this.isListMenuOpen.set(false);
    this.isMenuOpen = false;

    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/property/create'], { queryParams: { intent } });
    } else {
      this.authService.requestAuthModal('signin');
    }
  }

  toggleListMenu() { this.isListMenuOpen.update(v => !v); }

  // Close any open dropdown when the user clicks outside the navbar.
  @HostListener('document:click', ['$event'])
  onDocumentClick(ev: MouseEvent) {
    if (this.host.nativeElement.contains(ev.target as Node)) return;
    this.isListMenuOpen.set(false);
    this.openMegaMenu.set(null);
  }

  // Close on Escape too.
  @HostListener('document:keydown.escape')
  onEscape() {
    this.isListMenuOpen.set(false);
    this.openMegaMenu.set(null);
  }

  toggleMenu() { this.isMenuOpen = !this.isMenuOpen; }
  
  openAuthModal(mode: 'signin' | 'signup' = 'signin') {
    this.authMode.set(mode);
    this.showAuthModal.set(true);
    this.isMenuOpen = false;
    this.resetForm();
  }

  /**
   * Close the auth modal when the user clicks the backdrop — but only when
   * the mousedown actually originated on the backdrop itself.
   *
   * Why mousedown and not click: if the user is selecting text inside an
   * input and releases the mouse outside the modal, a `click` event fires
   * on the backdrop (the common ancestor of mousedown and mouseup), which
   * would otherwise close the modal mid-selection. Listening to `mousedown`
   * with the target/currentTarget check avoids that entirely.
   */
  onBackdropMousedown(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closeAuthModal();
    }
  }

  closeAuthModal() {
    this.showAuthModal.set(false);
    this.showOtpStep.set(false);
    this.showResetOtpStep.set(false);
    this.otp.set('');
    this.resetOtp.set('');          
    this.resetEmail.set('');        
    this.newPassword.set('');       
    this.confirmNewPassword.set('');
    this.pendingEmail.set('');
    this.email.set('');
    this.password.set('');
    this.errorMessage.set('');
  }

  switchMode(mode: 'signin' | 'signup') {
    this.authMode.set(mode);
    this.resetForm();
  }

  resetForm() {
    this.email.set('');
    this.password.set('');
    this.name.set('');
    this.errorMessage.set('');
  }

  async signIn() {
    if (!this.email() || !this.password()) {
      this.errorMessage.set('Please enter email and password');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    try {
      await this.authService.signInWithEmail(this.email(), this.password());
      this.closeAuthModal();
    } catch (err: any) {
      this.errorMessage.set(err.message ?? 'Sign in failed');
    } finally {
      this.isLoading.set(false);
    }
  }

  async forgotPassword() {
  if (!this.email()) {
    this.errorMessage.set('Please enter your email address first');
    return;
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(this.email())) {
    this.errorMessage.set('Please enter a valid email address');
    return;
  }
  this.isLoading.set(true);
  this.errorMessage.set('');
  try {
    await this.authService.resetPassword(this.email());
    this.resetEmail.set(this.email())
    this.showResetOtpStep.set(true);
    this.errorMessage.set(''); 
    // show a success message instead
    // alert('Password reset email sent! Check your inbox.');
    } catch (err: any) {
      this.errorMessage.set(err.message ?? 'Failed to send reset code');
    } finally {
      this.isLoading.set(false);
    }
  }

  async submitResetOtp() {
    if (!this.resetOtp() || this.resetOtp().length !== 6) {
      this.errorMessage.set('Please enter the 6-digit code');
      return;
    }
    if (this.newPassword().length < 8) {
      this.errorMessage.set('Password must be at least 8 characters');
      return;
    }
    if (this.newPassword() !== this.confirmNewPassword()) {
      this.errorMessage.set('Passwords do not match');
      return;
    }
    this.isLoading.set(true);
    this.errorMessage.set('');
    try {
      await this.authService.verifyResetOtp(
        this.resetEmail(), this.resetOtp(), this.newPassword()
      );
      this.closeAuthModal();
      // Optionally switch to sign in after reset
      this.openAuthModal('signin');
    } catch (err: any) {
      this.errorMessage.set(err.message ?? 'Verification failed');
    } finally {
      this.isLoading.set(false);
    }
  }

async signUp() {
  if (!this.name() || !this.email() || !this.password()) {
    this.errorMessage.set('Please fill in all fields');
    return;
  }
  if (!this.email().includes('@') || !this.email().includes('.')) {
    this.errorMessage.set('Please enter a valid email address');
    return;
  }
  if (this.password().length < 8) {
    this.errorMessage.set('Password must be at least 8 characters');
    return;
  }
  if (this.password() !== this.confirmPassword()) {
    this.errorMessage.set('Passwords do not match.');
    return;
  }

  this.isLoading.set(true);
  this.errorMessage.set('');

  try {
    const result = await this.authService.signUpWithEmail(
      this.name(), this.email(), this.password()
    );

    if (result.requiresOtp) {
      this.pendingEmail.set(this.email());
      this.showOtpStep.set(true);
      return;
    }

    this.closeAuthModal();
  } catch (err: any) {
    this.errorMessage.set(err.message ?? 'Sign up failed');
  } finally {
    this.isLoading.set(false);
  }
}

  async submitOtp() {
    if (!this.otp() || this.otp().length !== 6) {
      this.errorMessage.set('Please enter the 6-digit code');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

      try {
        await this.authService.verifyAndMerge(
          this.pendingEmail(), this.otp(), this.password(), this.name()
        );
        this.closeAuthModal();
      } catch (err: any) {
        this.errorMessage.set(err.message ?? 'Verification failed');
      } finally {
        this.isLoading.set(false);
      }
    }

    async handleSignOut() {
    await this.authService.signOut();
  }

  showUserTypeModal = computed(() => {
    const profile = this.authService.authResponse();
    const user = this.authService.user();
    return !!user && !!profile && !profile.userRole;
  });

  onUserTypeSelected(type: string) {
    // modal will hide automatically because authResponse signal updated
    console.log('User type set:', type);
  }
}