import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Filter, ChevronDown } from 'lucide-angular';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-filters',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, FormsModule],
  template: `
    <div class="bg-white border-b border-gray-100 sticky top-16 z-40 py-4 shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex flex-wrap items-center gap-4">
          <div class="flex items-center gap-2 text-gray-900 font-bold mr-4">
            <lucide-icon [name]="FilterIcon" class="w-5 h-5 text-blue-600"></lucide-icon>
            Filters
          </div>

          <div class="relative group">
            <select
              [ngModel]="selectedCity"
              (ngModelChange)="selectedCityChange.emit($event)"
              class="appearance-none bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 pr-10 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
            >
              @for (city of cities; track city) {
                <option [value]="city">{{city}}</option>
              }
            </select>
            <lucide-icon [name]="ChevronDownIcon" class="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"></lucide-icon>
          </div>

          <div class="relative group">
            <select
              [ngModel]="selectedType"
              (ngModelChange)="selectedTypeChange.emit($event)"
              class="appearance-none bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 pr-10 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
            >
              @for (type of types; track type) {
                <option [value]="type">{{type}}</option>
              }
            </select>
            <lucide-icon [name]="ChevronDownIcon" class="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"></lucide-icon>
          </div>

          <div class="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5">
            <span class="text-xs font-bold text-gray-400 uppercase tracking-tighter">Price Range</span>
            <input
              type="range"
              min="0"
              max="50000000"
              step="1000000"
              [ngModel]="priceRange[1]"
              (ngModelChange)="onPriceChange($event)"
              class="w-32 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <span class="text-sm font-bold text-gray-700">
              Up to ₹{{(priceRange[1] / 10000000).toFixed(1)}}Cr
            </span>
          </div>

          <button 
            (click)="reset.emit()"
            class="text-sm font-bold text-blue-600 hover:text-blue-700 ml-auto"
          >
            Reset All
          </button>
        </div>
      </div>
    </div>
  `
})
export class FiltersComponent {
  @Input() selectedCity = 'All Cities';
  @Output() selectedCityChange = new EventEmitter<string>();
  
  @Input() selectedType = 'All Types';
  @Output() selectedTypeChange = new EventEmitter<string>();
  
  @Input() priceRange: [number, number] = [0, 50000000];
  @Output() priceRangeChange = new EventEmitter<[number, number]>();
  
  @Output() reset = new EventEmitter<void>();

  FilterIcon = Filter;
  ChevronDownIcon = ChevronDown;

  cities = ['All Cities', 'Agra', 'Noida', 'Greater Noida'];
  types = ['All Types', 'Apartment', 'Villa', 'Plot', 'Commercial'];

  onPriceChange(value: number) {
    this.priceRangeChange.emit([0, value]);
  }
}
