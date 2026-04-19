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
import { PropertyDetailsComponent } from './pages/property-details/property-details';
import { RouterOutlet } from '@angular/router';

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
    FooterComponent,
    PropertyDetailsComponent,
    RouterOutlet
  ],
  templateUrl: `./app.component.html`
})
export class AppComponent  {
  
  
}
