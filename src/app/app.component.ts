import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from './components/navbar/navbar.component';
import { HeroComponent } from './components/hero/hero.component';
import { FiltersComponent } from './components/filters/filters.component';
import { PropertyCardComponent } from './components/property-card/property-card.component';
import { AgentCardComponent } from './components/agent-card/agent-card.component';
import { FooterComponent } from './components/footer/footer.component';
// import { PROPERTIES, AGENTS } from '../data';
import { Agent, Property } from '../types';
import { PropertyService } from './services/property-service';
import { AgentService } from './services/agent-service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    NavbarComponent,
    HeroComponent,
    FiltersComponent,
    PropertyCardComponent,
    AgentCardComponent,
    FooterComponent
  ],
  template: `
    <div class="min-h-screen bg-white font-sans selection:bg-blue-100 selection:text-blue-900">
      <app-navbar></app-navbar>
      
      <main class="pt-16">
        <app-hero (search)="setSearchQuery($event)"></app-hero>
        
        <!-- <app-filters 
          [selectedCity]="selectedCity"
          (selectedCityChange)="selectedCity = $event"
          [selectedType]="selectedType"
          (selectedTypeChange)="selectedType = $event"
          [priceRange]="priceRange"
          (priceRangeChange)="priceRange = $event"
          (reset)="resetFilters()"
        ></app-filters> -->

        <app-filters 
          [selectedCity]="selectedCity()"
          (selectedCityChange)="selectedCity.set($event)"
          [selectedType]="selectedType()"
          (selectedTypeChange)="selectedType.set($event)"
          [priceRange]="priceRange()"
          (priceRangeChange)="priceRange.set($event)"
          (reset)="resetFilters()"
        ></app-filters>

        <!-- Featured Section -->
        <!-- @if (searchQuery === '' && selectedCity === 'All Cities') {
          <section class="py-20 bg-gray-50/50">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div class="flex justify-between items-end mb-12">
                <div>
                  <span class="text-blue-600 font-bold text-xs uppercase tracking-[0.2em] mb-2 block">Premium Selection</span>
                  <h2 class="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">Featured Properties</h2>
                </div>
                <button class="text-blue-600 font-bold hover:underline decoration-2 underline-offset-4">View All Featured</button>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                @for (property of featuredProperties; track property.id) {
                  <app-property-card [property]="property"></app-property-card>
                }
              </div>
            </div>
          </section>
        } -->

        

        <!-- Main Listings Grid -->
        <section class="py-20">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <!-- <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-12">
              <div>
                <h2 class="text-3xl font-black text-gray-900 tracking-tight">
                  {{selectedCity === 'All Cities' ? 'Properties in Uttar Pradesh' : 'Properties in ' + selectedCity}}
                </h2>
                <p class="text-gray-500 mt-1 font-medium">Found {{filteredProperties.length}} results matching your criteria</p>
              </div>
              
              <div class="flex items-center gap-2 bg-gray-100 p-1 rounded-xl">
                <button class="px-4 py-2 bg-white text-gray-900 font-bold text-sm rounded-lg shadow-sm">Grid View</button>
                <button class="px-4 py-2 text-gray-500 font-bold text-sm rounded-lg hover:text-gray-900">Map View</button>
              </div>
            </div> -->
            <div>
              <h2 class="text-3xl font-black text-gray-900 tracking-tight">
                {{selectedCity() === 'All Cities' ? 'Properties in Uttar Pradesh' : 'Properties in ' + selectedCity()}}
              </h2>
              <p class="text-gray-500 mt-1 font-medium">Found {{filteredProperties().length}} results</p>
            </div>
            @if (filteredProperties().length > 0) {
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                @for (property of filteredProperties(); track property.id) {
                  <app-property-card [property]="property"></app-property-card>
                }
              </div>
            } @else {
              <div class="py-20 text-center">
                <div class="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span class="text-4xl">🔍</span>
                </div>
                <h3 class="text-xl font-bold text-gray-900 mb-2">No properties found</h3>
                <p class="text-gray-500 max-w-xs mx-auto">Try adjusting your filters or search query to find more results.</p>
                <button 
                  (click)="resetFilters()"
                  class="mt-6 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors"
                >
                  Clear all filters
                </button>
              </div>
            }
          </div>
        </section>

        <!-- Agents Section -->
        <section class="py-24 bg-gray-900 overflow-hidden relative">
          <div class="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 blur-[120px] rounded-full -mr-48 -mt-48"></div>
          <div class="absolute bottom-0 left-0 w-96 h-96 bg-blue-600/10 blur-[120px] rounded-full -ml-48 -mb-48"></div>

          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div class="text-center mb-16">
              <span class="text-blue-400 font-bold text-xs uppercase tracking-[0.2em] mb-3 block">Expert Guidance</span>
              <h2 class="text-3xl md:text-5xl font-black text-white tracking-tight mb-4">Meet Our Top Agents</h2>
              <p class="text-gray-400 max-w-2xl mx-auto font-medium">
                Our certified experts specialize in the UP market, providing you with 
                unparalleled insights and professional service.
              </p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              @for (agent of agents(); track agent.id) {
                <app-agent-card [agent]="agent"></app-agent-card>
              }
            </div>
          </div>
        </section>

        <!-- CTA Section -->
        <section class="py-20">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="bg-blue-600 rounded-[40px] p-8 md:p-16 text-center relative overflow-hidden shadow-2xl shadow-blue-600/20">
              <div class="relative z-10">
                <h2 class="text-3xl md:text-5xl font-black text-white mb-6 tracking-tight">
                  List your property with <span class="text-blue-200">BharatHomes</span>
                </h2>
                <p class="text-blue-100 text-lg mb-10 max-w-2xl mx-auto font-medium">
                  Join thousands of property owners in Uttar Pradesh who trust us 
                  to find the right buyers for their homes and land.
                </p>
                <div class="flex flex-col sm:flex-row justify-center gap-4">
                  <button class="bg-white text-blue-600 px-8 py-4 rounded-2xl font-black hover:bg-blue-50 transition-colors shadow-lg">
                    Start Listing Now
                  </button>
                  <button class="bg-blue-700 text-white px-8 py-4 rounded-2xl font-black hover:bg-blue-800 transition-colors border border-blue-500/30">
                    Contact Support
                  </button>
                </div>
              </div>
              <div class="absolute inset-0 opacity-10 pointer-events-none">
                <div class="absolute top-0 left-0 w-full h-full" style="background-image: radial-gradient(circle at 2px 2px, white 1px, transparent 0); background-size: 40px 40px"></div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <app-footer></app-footer>
    </div>
  `
})
export class AppComponent implements OnInit {
  
  private propertyService = inject(PropertyService);
  private agentService = inject(AgentService);
  
  searchQuery = signal('');
  selectedCity = signal('All Cities');
  selectedType = signal('All Types');
  priceRange = signal<[number, number]>([0, 50000000]);

  // agents = AGENTS;

  private allProperties = signal<Property[]>([]);
  agents = signal<Agent[]>([]);

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
    const maxPrice = this.priceRange()[1];

    return this.allProperties().filter((p) => {
      const matchesSearch = query === '' || 
        p.title.toLowerCase().includes(query) ||
        p.location.toLowerCase().includes(query);
      
      const matchesCity = city === 'All Cities' || p.city === city;
      const matchesType = type === 'All Types' || p.type === type;
      const matchesPrice = p.price <= maxPrice;

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
    this.priceRange.set([0, 50000000]);
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
