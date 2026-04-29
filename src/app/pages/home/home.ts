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
import { Agent, Property } from '@/types';

@Component({
  selector: 'app-home',
  imports: [
    CommonModule,
    HeroComponent,
    FiltersComponent,
    PropertyCardComponent,
    AgentCardComponent
],
  templateUrl: `./home.page.html`,
  styles: ``,
})
export class HomePageComponent implements OnInit {

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
