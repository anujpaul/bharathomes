import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Star, MessageSquare, Phone } from 'lucide-angular';
import { Agent } from '../../../types';

@Component({
  selector: 'app-agent-card',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-lg transition-all">
      <div class="flex items-center gap-4 mb-6">
        <div class="relative">
          <img
            [src]="agent.image"
            [alt]="agent.name"
            class="w-16 h-16 rounded-2xl object-cover"
            referrerPolicy="no-referrer"
          />
          <div class="absolute -bottom-2 -right-2 bg-yellow-400 text-white p-1 rounded-lg shadow-sm">
            <lucide-icon [name]="StarIcon" class="w-3 h-3 fill-current"></lucide-icon>
          </div>
        </div>
        <div>
          <h4 class="font-bold text-gray-900">{{agent.name}}</h4>
          <p class="text-xs text-gray-500 font-medium">{{agent.role}}</p>
          <div class="flex items-center gap-1 mt-1">
            <span class="text-sm font-bold text-gray-900">{{agent.rating}}</span>
            <div class="flex">
              @for (star of [1,2,3,4,5]; track star; let i = $index) {
                <lucide-icon 
                  [name]="StarIcon" 
                  class="w-3 h-3"
                  [class.text-yellow-400]="i < agent.rating"
                  [class.fill-current]="i < agent.rating"
                  [class.text-gray-200]="i >= agent.rating"
                ></lucide-icon>
              }
            </div>
          </div>
        </div>
      </div>

      <div class="space-y-3 mb-6">
        <div class="flex justify-between text-sm">
          <span class="text-gray-500">Specialization</span>
          <span class="font-semibold text-gray-900">{{agent.specialization}}</span>
        </div>
        <div class="flex justify-between text-sm">
          <span class="text-gray-500">Listings</span>
          <span class="font-semibold text-gray-900">{{agent.listingsCount}} Properties</span>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <button class="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-100 text-gray-700 font-bold text-sm hover:bg-gray-50 transition-colors">
          <lucide-icon [name]="MessageSquareIcon" class="w-4 h-4"></lucide-icon>
          Chat
        </button>
        <button
          (click)="togglePhone()"
          class="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-50 text-blue-600 font-bold text-sm hover:bg-blue-100 transition-colors"
          [class.col-span-2]="showPhone"
        >
          <lucide-icon [name]="PhoneIcon" class="w-4 h-4 shrink-0"></lucide-icon>
          {{ showPhone ? agent.phone : 'Call' }}
        </button>
      </div>
    </div>
  `
})
export class AgentCardComponent {
  @Input() agent!: Agent;

  StarIcon = Star;
  MessageSquareIcon = MessageSquare;
  PhoneIcon = Phone;

  showPhone = false;

  togglePhone(): void {
    this.showPhone = !this.showPhone;
  }
}