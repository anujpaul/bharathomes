import { Component, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '@/app/services/auth.service';

const USER_TYPES = [
  {
    value: 'buyer',
    label: 'Buyer',
    icon: '🏠',
    description: 'Looking to buy or rent a property'
  },
  {
    value: 'seller',
    label: 'Seller',
    icon: '💰',
    description: 'Want to list and sell your property'
  },
  {
    value: 'agent',
    label: 'Agent',
    icon: '🤝',
    description: 'Real estate professional managing listings'
  },
  {
    value: 'hybrid',
    label: 'Buy & Sell',
    icon: '🔄',
    description: 'Looking to both buy and sell'
  }
];

@Component({
  selector: 'app-user-type-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div class="bg-white rounded-2xl border border-gray-100 p-8 w-full max-w-md mx-4">

        <div class="text-center mb-6">
          <h2 class="text-xl font-bold text-gray-900">What are you looking for?</h2>
          <p class="text-sm text-gray-500 mt-1">Help us personalize your experience</p>
        </div>

        <div class="grid grid-cols-2 gap-3 mb-6">
          @for (type of userTypes; track type.value) {
            <button
              (click)="select(type.value)"
              [class.ring-2]="selected === type.value"
              [class.ring-blue-500]="selected === type.value"
              [class.bg-blue-50]="selected === type.value"
              class="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-200
                     hover:border-blue-300 hover:bg-blue-50 transition-all text-left">
              <span class="text-3xl">{{ type.icon }}</span>
              <span class="text-sm font-semibold text-gray-900">{{ type.label }}</span>
              <span class="text-xs text-gray-500 text-center">{{ type.description }}</span>
            </button>
          }
        </div>

        @if (errorMessage) {
          <p class="text-xs text-red-500 text-center mb-3">{{ errorMessage }}</p>
        }

        <button
          (click)="confirm()"
          [disabled]="!selected || isLoading"
          class="w-full bg-blue-600 text-white rounded-xl px-4 py-3 text-sm font-medium
                 hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          {{ isLoading ? 'Saving...' : 'Continue' }}
        </button>

      </div>
    </div>
  `
})
export class UserTypeModalComponent {
  authService = inject(AuthService);

  userTypes = USER_TYPES;
  selected = '';
  isLoading = false;
  errorMessage = '';

  done = output<string>(); // emits the chosen type to parent

  select(value: string) {
    this.selected = value;
  }

  async confirm() {
    if (!this.selected) return;
    this.isLoading = true;
    this.errorMessage = '';
    try {
      await this.authService.updateUserType(this.selected);
      this.done.emit(this.selected);
    } catch {
      this.errorMessage = 'Something went wrong, please try again';
    } finally {
      this.isLoading = false;
    }
  }
}