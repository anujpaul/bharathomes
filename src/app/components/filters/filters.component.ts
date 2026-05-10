import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Filter, ChevronDown } from 'lucide-angular';
import { FormsModule } from '@angular/forms';
import { parsePriceInput } from '@/app/pipes/inr-price.pipe';

@Component({
  selector: 'app-filters',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, FormsModule],
  template: `
    <div class="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 sticky top-16 z-40 py-4 shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex flex-wrap items-center gap-4">
          <div class="flex items-center gap-2 text-gray-900 dark:text-gray-100 font-bold mr-4">
            <lucide-icon [name]="FilterIcon" class="w-5 h-5 text-blue-600 dark:text-blue-400"></lucide-icon>
            Filters
          </div>

          <div class="relative group">
            <select
              [ngModel]="selectedCity"
              (ngModelChange)="selectedCityChange.emit($event)"
              class="appearance-none bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 pr-10 text-sm font-semibold text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
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
              class="appearance-none bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 pr-10 text-sm font-semibold text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
            >
              @for (type of types; track type) {
                <option [value]="type">{{type}}</option>
              }
            </select>
            <lucide-icon [name]="ChevronDownIcon" class="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"></lucide-icon>
          </div>

          <!-- ── Price: dual-handle slider + two text inputs ──────────── -->
          <div class="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 flex flex-col gap-2 min-w-[280px]">

            <!-- Top row: label + Min/Max inputs -->
            <div class="flex items-center gap-2">
              <span class="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-tighter">Price</span>

              <input
                type="text"
                inputmode="decimal"
                [(ngModel)]="minDraft"
                (blur)="commitMin()"
                (keyup.enter)="commitMin(); $any($event.target).blur()"
                [class.invalid]="minError"
                placeholder="Min"
                aria-label="Minimum price"
                class="w-20 bg-transparent text-sm font-semibold text-gray-700 dark:text-gray-100 placeholder:text-gray-400 placeholder:font-normal focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1.5 py-0.5"
              />

              <span class="text-gray-400 dark:text-gray-600 select-none">—</span>

              <input
                type="text"
                inputmode="decimal"
                [(ngModel)]="maxDraft"
                (blur)="commitMax()"
                (keyup.enter)="commitMax(); $any($event.target).blur()"
                [class.invalid]="maxError"
                placeholder="Any"
                aria-label="Maximum price"
                class="w-20 bg-transparent text-sm font-semibold text-gray-700 dark:text-gray-100 placeholder:text-gray-400 placeholder:font-normal focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1.5 py-0.5"
              />
            </div>

            <!-- Dual-handle range slider — two stacked native ranges sharing a track -->
            <div class="dual-slider">
              <div class="track"></div>
              <div class="track-fill" [style.left.%]="trackFillLeftPct()" [style.right.%]="trackFillRightPct()"></div>
              <input
                type="range"
                min="0"
                [max]="priceMax"
                [step]="step"
                [(ngModel)]="sliderMin"
                (input)="onSliderMin()"
                (change)="commitFromSlider()"
                aria-label="Minimum price slider"
                class="thumb"
              />
              <input
                type="range"
                min="0"
                [max]="priceMax"
                [step]="step"
                [(ngModel)]="sliderMax"
                (input)="onSliderMax()"
                (change)="commitFromSlider()"
                aria-label="Maximum price slider"
                class="thumb"
              />
            </div>

            <!-- Hint / parsed value preview / error -->
            @if (minError || maxError) {
              <p class="text-[11px] text-red-600 dark:text-red-400 px-1">
                Couldn't read that. Try formats like <strong>50L</strong>, <strong>1.5Cr</strong> or <strong>5000000</strong>.
              </p>
            } @else if (rangeError) {
              <p class="text-[11px] text-red-600 dark:text-red-400 px-1">
                Min must be less than max.
              </p>
            } @else {
              <p class="text-[11px] text-gray-400 dark:text-gray-500 px-1">
                {{ rangeSummary() }} · Type like <strong>50L</strong> or drag the handles
              </p>
            }
          </div>

          <button
            (click)="reset.emit()"
            class="text-sm font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 ml-auto"
          >
            Reset All
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    input.invalid {
      box-shadow: inset 0 0 0 1px rgb(220 38 38);
    }

    /* ── Dual-handle slider ─────────────────────────────────────────────
       Two native range inputs stacked on top of each other share a single
       visual track. The track is a plain div behind them; the thumbs poke
       through because the inputs themselves have transparent backgrounds
       and pointer-events:none — only the thumb pseudo-element re-enables
       pointer-events:auto so both handles stay independently grabbable.
    */
    .dual-slider {
      position: relative;
      height: 24px;
      width: 100%;
    }

    .dual-slider .track {
      position: absolute;
      left: 0;
      right: 0;
      top: 50%;
      transform: translateY(-50%);
      height: 4px;
      background: rgb(229 231 235);   /* gray-200 */
      border-radius: 9999px;
    }
    :host-context(.dark) .dual-slider .track { background: rgb(55 65 81); /* gray-700 */ }

    .dual-slider .track-fill {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      height: 4px;
      background: rgb(37 99 235);     /* blue-600 */
      border-radius: 9999px;
      pointer-events: none;
    }

    .dual-slider .thumb {
      position: absolute;
      left: 0;
      right: 0;
      top: 0;
      bottom: 0;
      width: 100%;
      height: 100%;
      margin: 0;
      background: transparent;
      pointer-events: none;
      -webkit-appearance: none;
      appearance: none;
    }
    .dual-slider .thumb:focus { outline: none; }

    /* WebKit thumb */
    .dual-slider .thumb::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 18px;
      height: 18px;
      background: rgb(37 99 235);
      border-radius: 9999px;
      border: 2px solid white;
      box-shadow: 0 1px 3px rgba(0,0,0,0.2);
      cursor: pointer;
      pointer-events: auto;
      position: relative;
      z-index: 2;
    }
    :host-context(.dark) .dual-slider .thumb::-webkit-slider-thumb {
      border-color: rgb(31 41 55);    /* gray-800 to match chip bg */
    }

    /* Firefox thumb */
    .dual-slider .thumb::-moz-range-thumb {
      width: 18px;
      height: 18px;
      background: rgb(37 99 235);
      border-radius: 9999px;
      border: 2px solid white;
      box-shadow: 0 1px 3px rgba(0,0,0,0.2);
      cursor: pointer;
      pointer-events: auto;
    }
    :host-context(.dark) .dual-slider .thumb::-moz-range-thumb {
      border-color: rgb(31 41 55);
    }

    /* Hide the default track on both engines so only our .track div shows */
    .dual-slider .thumb::-webkit-slider-runnable-track {
      background: transparent;
      height: 4px;
    }
    .dual-slider .thumb::-moz-range-track {
      background: transparent;
      height: 4px;
    }
  `],
})
export class FiltersComponent implements OnChanges {
  @Input() selectedCity = 'All Cities';
  @Output() selectedCityChange = new EventEmitter<string>();

  @Input() selectedType = 'All Types';
  @Output() selectedTypeChange = new EventEmitter<string>();

  @Input() priceRange: [number, number] = [0, 50_000_000];
  @Output() priceRangeChange = new EventEmitter<[number, number]>();

  /**
   * Upper limit of the price range from the parent. We treat the maximum
   * being ≥ this as "no upper bound" — empty maxDraft maps to priceMax,
   * and a maxDraft of priceMax shows as the "Any" placeholder.
   */
  @Input() priceMax: number = 50_000_000;

  @Output() reset = new EventEmitter<void>();

  FilterIcon = Filter;
  ChevronDownIcon = ChevronDown;

  // cities = ['All Cities', 'Agra', 'Noida', 'Greater Noida'];
  @Input() cities: string[] = ['All Cities'];
  types  = ['All Types', 'Apartment', 'Villa', 'Plot', 'Commercial'];

  // Slider step — 10 Lakh granularity is plenty for property prices.
  readonly step = 1_000_000;

  // Local "draft" strings for the two text inputs. Kept separate from
  // priceRange so the user can type intermediate values like "1." or "8c"
  // without us overwriting their input on every keystroke.
  minDraft = '';
  maxDraft = '';

  // Local mirrors of priceRange that the dual-handle slider binds to.
  // We commit to the parent on `change` (drag end) rather than every
  // `input` event so we don't refilter on every pixel of drag.
  sliderMin = 0;
  sliderMax = 0;

  minError = false;
  maxError = false;
  rangeError = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['priceRange'] || changes['priceMax']) {
      this.syncFromInputs();
    }
  }

  /** Refresh the inputs and slider thumbs to match the bound values. */
  private syncFromInputs(): void {
    const [lo, hi] = this.priceRange;
    this.minDraft = lo > 0 ? this.format(lo) : '';
    this.maxDraft = hi >= this.priceMax ? '' : this.format(hi);
    this.sliderMin = this.clamp(lo);
    this.sliderMax = this.clamp(hi);
    this.minError = false;
    this.maxError = false;
    this.rangeError = false;
  }

  private clamp(n: number): number {
    return Math.max(0, Math.min(this.priceMax, n));
  }

  /** Format a rupee value as a short editable string ("85L", "8.5Cr", "5000"). */
  private format(value: number): string {
    if (value >= 10_000_000) return `${this.trim(value / 10_000_000)}Cr`;
    if (value >= 100_000)    return `${this.trim(value / 100_000)}L`;
    return String(value);
  }

  private trim(n: number): string {
    return n.toFixed(2).replace(/\.?0+$/, '');
  }

  // ── Text input handlers ──────────────────────────────────────────────
  commitMin(): void {
    const parsed = this.parseDraft(this.minDraft);
    if (parsed === 'invalid') { this.minError = true; return; }
    this.minError = false;

    const lo = parsed ?? 0;
    const hi = this.priceRange[1];
    if (lo >= hi) { this.rangeError = true; return; }
    this.rangeError = false;
    this.priceRangeChange.emit([lo, hi]);
  }

  commitMax(): void {
    const parsed = this.parseDraft(this.maxDraft);
    if (parsed === 'invalid') { this.maxError = true; return; }
    this.maxError = false;

    const hi = parsed ?? this.priceMax;
    const lo = this.priceRange[0];
    if (hi <= lo) { this.rangeError = true; return; }
    this.rangeError = false;
    this.priceRangeChange.emit([lo, hi]);
  }

  /** Parsed rupee number; null = "no constraint"; 'invalid' = unparseable. */
  private parseDraft(raw: string): number | null | 'invalid' {
    if (!raw || !raw.trim()) return null;
    const parsed = parsePriceInput(raw);
    return parsed == null ? 'invalid' : parsed;
  }

  // ── Slider handlers ──────────────────────────────────────────────────
  /** While dragging the min thumb: prevent it from crossing max, refresh draft text. */
  onSliderMin(): void {
    if (this.sliderMin > this.sliderMax - this.step) {
      this.sliderMin = Math.max(0, this.sliderMax - this.step);
    }
    this.minDraft = this.sliderMin > 0 ? this.format(this.sliderMin) : '';
    this.minError = false;
    this.rangeError = false;
  }

  /** While dragging the max thumb: prevent it from crossing min, refresh draft text. */
  onSliderMax(): void {
    if (this.sliderMax < this.sliderMin + this.step) {
      this.sliderMax = Math.min(this.priceMax, this.sliderMin + this.step);
    }
    this.maxDraft = this.sliderMax >= this.priceMax ? '' : this.format(this.sliderMax);
    this.maxError = false;
    this.rangeError = false;
  }

  /** Drag finished — commit both ends in one emit. */
  commitFromSlider(): void {
    this.priceRangeChange.emit([this.sliderMin, this.sliderMax]);
  }

  // ── Track-fill positioning (the blue bar between the thumbs) ─────────
  trackFillLeftPct(): number {
    return this.priceMax > 0 ? (this.sliderMin / this.priceMax) * 100 : 0;
  }

  trackFillRightPct(): number {
    return this.priceMax > 0 ? 100 - (this.sliderMax / this.priceMax) * 100 : 0;
  }

  /** Friendly description of the active range for the hint line. */
  rangeSummary(): string {
    const [lo, hi] = this.priceRange;
    const noLow  = lo <= 0;
    const noHigh = hi >= this.priceMax;
    if (noLow && noHigh)  return 'Any price';
    if (noLow)            return `Up to ${this.format(hi)}`;
    if (noHigh)           return `From ${this.format(lo)}`;
    return `${this.format(lo)} – ${this.format(hi)}`;
  }
}
