import { AgentCardComponent } from '@/app/components/agent-card/agent-card.component';
import { FiltersComponent } from '@/app/components/filters/filters.component';
import { FooterComponent } from '@/app/components/footer/footer.component';
import { HeroComponent } from '@/app/components/hero/hero.component';
import { NavbarComponent } from '@/app/components/navbar/navbar.component';
import { PropertyCardComponent } from '@/app/components/property-card/property-card.component';
import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { PropertyDetailsComponent } from '../property-details/property-details';
import { PropertyService } from '@/app/services/property-service';
import { AgentService } from '@/app/services/agent-service';
import { AuthService } from '@/app/services/auth.service';
import { Agent, Property } from '@/types';
import { Router, RouterLink } from '@angular/router';
import { CreateProperty } from '@/app/components/create-property/create-property';

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
    // Use the object syntax to avoid deprecation and fix the typo
    this.propertyService.getProperties().subscribe({
      next: (data: Property[]) => {
        this.allProperties.set(data);
        // Bump the slider's upper bound to the new ceiling — but only if the
        // user is still parked at the previous ceiling (i.e. they haven't
        // narrowed the range). Stops the slider from snapping out from under
        // them mid-interaction.
        const ceiling = this.priceCeiling();
        const [lo, hi] = this.priceRange();
        if (hi < ceiling && hi <= HomePageComponent.PRICE_CEILING_FLOOR) {
          this.priceRange.set([lo, ceiling]);
        }
      },
      error: (err) => console.error('Property API Error:', err)
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
