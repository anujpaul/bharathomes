import { AgentCardComponent } from '@/app/components/agent-card/agent-card.component';
import { FiltersComponent } from '@/app/components/filters/filters.component';
import { HeroComponent } from '@/app/components/hero/hero.component';
import { PropertyCardComponent } from '@/app/components/property-card/property-card.component';
import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { PropertyService } from '@/app/services/property-service';
import { AgentService } from '@/app/services/agent-service';
import { AuthService } from '@/app/services/auth.service';
import { Agent, Property } from '@/types';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { combineLatest } from 'rxjs';

@Component({
  selector: 'app-home',
  imports: [
    CommonModule,
    HeroComponent,
    FiltersComponent,
    PropertyCardComponent,
    AgentCardComponent,
    // CreateProperty,
    RouterLink
],
  templateUrl: `./home.page.html`,
  styles: ``,
})
export class HomePageComponent implements OnInit {

private propertyService = inject(PropertyService);
  private agentService = inject(AgentService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  /**
   * Locked intent for /buy and /rent. Set from `route.data.intent`. When
   * present, the component shows only listings of that intent and treats
   * it as non-removable (the existing in-page filters can refine type/
   * price/city on top, but cannot escape the intent scope).
   *
   * On the bare home page (`/`), this is null and all listings show.
   */
  lockedIntent = signal<'sell' | 'rent' | null>(null);
  
  // 1 Cr in INR — keeps the magic numbers below readable.
  private static readonly ONE_CR = 10_000_000;
  // Floor for the price slider: 10 Cr. Even with no listings, the slider
  // shouldn't max out at something tiny like 1 Cr.
  private static readonly PRICE_CEILING_FLOOR = 10 * HomePageComponent.ONE_CR;

  searchQuery = signal('');
  selectedCity = signal('All Cities');
  selectedType = signal('All Types');
  // Upper bound starts at the floor; bumped up in ngOnInit once listings load.
  priceRange = signal<[number, number]>([0, HomePageComponent.PRICE_CEILING_FLOOR]);

  // agents = AGENTS;

  private allProperties = signal<Property[]>([]);
  agents = signal<Agent[]>([]);

  /**
   * Dynamic max for the price-range slider. Always at least the floor (10 Cr),
   * but rounds up to the next crore above the most expensive listing in the
   * dataset so newly added high-value properties (e.g. 8 Cr, 25 Cr) don't get
   * filtered out by a stale hardcoded ceiling.
   */
  priceCeiling = computed(() => {
    const max = this.allProperties().reduce((m, p) => Math.max(m, p.price), 0);
    const roundedUp = Math.ceil(max / HomePageComponent.ONE_CR) * HomePageComponent.ONE_CR;
    return Math.max(HomePageComponent.PRICE_CEILING_FLOOR, roundedUp);
  });

  cities = computed(() => {
    const set = new Set<string>();
    for (const p of this.allProperties()) {
      const c = p.city?.trim();
      if (c) set.add(c);
    }
    return ['All Cities', ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  });

  // get filteredProperties(): Property[] {
  //   return PROPERTIES.filter((p) => {
  //     const matchesSearch = this.searchQuery === '' || 
  //       p.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
  //       p.location.toLowerCase().includes(this.searchQuery.toLowerCase());
      
  //     const matchesCity = this.selectedCity === 'All Cities' || p.city === this.selectedCity;
  //     const matchesType = this.selectedType === 'All Types' || p.type === this.selectedType;
  //     const matchesPrice = p.price <= this.priceRange[1];

  //     return matchesSearch && matchesCity && matchesType && matchesPrice;
  //   });
  // }

  // get featuredProperties(): Property[] {
  //   return PROPERTIES.filter(p => p.isFeatured);
  // }
  // ── Pagination ──────────────────────────────────────────────────────
  // Page state lives here so the pageSize and page-window logic stay in
  // one place. Resets to 1 whenever the underlying filtered set changes.
  readonly pageSize = 12;
  currentPage = signal(1);

  totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredProperties().length / this.pageSize))
  );

  pagedProperties = computed(() => {
    const page = Math.min(this.currentPage(), this.totalPages());
    const start = (page - 1) * this.pageSize;
    return this.filteredProperties().slice(start, start + this.pageSize);
  });

  /**
   * Show up to ~7 page numbers with "…" gaps, like:
   *   1 2 3 4 5 … 12         (when on early pages)
   *   1 … 5 6 7 … 12         (when in the middle)
   *   1 … 8 9 10 11 12       (when near the end)
   * Returns null entries to render as ellipses in the template.
   */
  pageWindow = computed<(number | null)[]>(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    const window: (number | null)[] = [1];
    const left = Math.max(2, current - 1);
    const right = Math.min(total - 1, current + 1);
    if (left > 2) window.push(null);
    for (let i = left; i <= right; i++) window.push(i);
    if (right < total - 1) window.push(null);
    window.push(total);
    return window;
  });

  goToPage(page: number) {
    const target = Math.max(1, Math.min(page, this.totalPages()));
    this.currentPage.set(target);
    // Scroll the listing area back into view so the user sees page 1 of
    // results, not the bottom of page 1 they were looking at.
    window.scrollTo({ top: document.querySelector('section')?.offsetTop ?? 0, behavior: 'smooth' });
  }

  // Reset to page 1 whenever the filtered dataset changes — otherwise the
  // user can be parked on page 5 with 0 results after narrowing filters.
  // Using an effect keeps this reactive without manually resetting in every
  // setter / route subscription.
  private _resetPageOnFilterChange = effect(() => {
    // Read the dependency we care about — length is the smallest signal that
    // changes when the underlying set does.
    const _ = this.filteredProperties().length;
    this.currentPage.set(1);
  });

  filteredProperties = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const city = this.selectedCity();
    const type = this.selectedType();
    const [minPrice, maxPrice] = this.priceRange();
    // When the upper bound sits at the dynamic ceiling, treat it as "no upper
    // bound" so listings that happen to be above the ceiling at any moment
    // still show. The lower bound is respected literally — 0 means no floor.
    const noUpperBound = maxPrice >= this.priceCeiling();

    return this.allProperties().filter((p) => {
      const matchesSearch = query === '' ||
        p.title.toLowerCase().includes(query) ||
        p.location.toLowerCase().includes(query);

      const matchesCity = city === 'All Cities' || p.city === city;
      const matchesType = type === 'All Types' || p.type === type;
      const matchesPrice = p.price >= minPrice && (noUpperBound || p.price <= maxPrice);

      return matchesSearch && matchesCity && matchesType && matchesPrice;
    });
  });

  featuredProperties = computed(() => 
    this.allProperties().filter(p => p.isFeatured)
  );

  ngOnInit(): void {
    // React to intent (from route.data) AND query params together, so
    // navigating Buy → Rent OR changing only a query param both refire the
    // API call. ActivatedRoute exposes both as observables, so combineLatest
    // gives us "fire whenever EITHER changes."
    combineLatest([this.route.data, this.route.queryParamMap]).subscribe(
      ([data, params]) => {
        const intent = (data['intent'] as 'sell' | 'rent' | undefined) ?? null;
        this.lockedIntent.set(intent);

        // Pre-fill in-page filter signals from query params so the visible
        // controls reflect the URL state. User can still tweak from there.
        const type = params.get('type');
        const city = params.get('city');
        const minPrice = params.get('minPrice');
        const maxPrice = params.get('maxPrice');

        if (type) this.selectedType.set(type);
        if (city) this.selectedCity.set(city);
        if (minPrice != null && maxPrice != null) {
          this.priceRange.set([Number(minPrice), Number(maxPrice)]);
        } else if (minPrice != null) {
          // "5Cr+" style brackets have no ceiling — keep the existing upper
          // bound from the slider's dynamic ceiling.
          this.priceRange.set([Number(minPrice), this.priceRange()[1]]);
        }

        // Build the server-side filter payload. Intent is the only one
        // strictly necessary on the server — type/city/price could be
        // applied client-side, but pushing them down keeps payloads small
        // when datasets grow.
        this.propertyService.getProperties({
          intent: intent ?? undefined,
          type: type ?? undefined,
          city: city ?? undefined,
          minPrice: minPrice != null ? Number(minPrice) : undefined,
          maxPrice: maxPrice != null ? Number(maxPrice) : undefined,
        }).subscribe({
          next: (data: Property[]) => {
            this.allProperties.set(data);
            // Bump the slider's upper bound to the new ceiling — but only if
            // the user is still parked at the previous ceiling (i.e. they
            // haven't narrowed the range).
            const ceiling = this.priceCeiling();
            const [lo, hi] = this.priceRange();
            if (hi < ceiling && hi <= HomePageComponent.PRICE_CEILING_FLOOR) {
              this.priceRange.set([lo, ceiling]);
            }
          },
          error: (err) => console.error('Property API Error:', err)
        });
      });

    this.agentService.getAgents().subscribe({
      next: (data: Agent[]) => {
        this.agents.set(data);
      },
      error: (err) => console.error('Agent API Error:', err)
    });
  }

  setSearchQuery(query: string) {
    this.searchQuery.set(query);
  }

  resetFilters() {
    this.searchQuery.set('');
    this.selectedCity.set('All Cities');
    this.selectedType.set('All Types');
    // Reset to "Any" — the top of whatever the current dynamic ceiling is.
    this.priceRange.set([0, this.priceCeiling()]);
  }

  startListing() {
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/property/create']);
    } else {
      this.authService.requestAuthModal('signin');
    }
  }

  // setSearchQuery(query: string) {
  //   this.searchQuery = query;
  // }

  // resetFilters() {
  //   this.searchQuery = '';
  //   this.selectedCity = 'All Cities';
  //   this.selectedType = 'All Types';
  //   this.priceRange = [0, 50000000];
  // }

}
