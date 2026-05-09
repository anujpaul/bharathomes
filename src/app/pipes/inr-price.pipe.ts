import { Pipe, PipeTransform } from '@angular/core';

/**
 * Formats a rupee amount in Indian-style short notation:
 *   85_000_000  → "₹8.5 Cr"
 *   12_50_000   → "₹12.5 L"
 *   45_000      → "₹45,000"
 *   0 / null    → "—"
 *
 * Trailing zeros are stripped — 50_000_000 becomes "₹5 Cr", not "₹5.00 Cr".
 *
 * Use as `{{ price | inrPrice }}` in templates.
 *
 * Optional second argument controls maximum decimals on the Lakh/Crore form
 * (default 2). Pass `1` for tighter chips, `0` for whole-number displays.
 */
@Pipe({
  name: 'inrPrice',
  standalone: true,
})
export class InrPricePipe implements PipeTransform {
  private static readonly ONE_CRORE = 10_000_000;
  private static readonly ONE_LAKH  = 100_000;

  transform(value: number | null | undefined, maxDecimals: number = 2): string {
    if (value == null || isNaN(value as number)) return '—';
    if (value === 0) return '₹0';

    const abs = Math.abs(value);
    const sign = value < 0 ? '-' : '';

    if (abs >= InrPricePipe.ONE_CRORE) {
      return `${sign}₹${this.trim(abs / InrPricePipe.ONE_CRORE, maxDecimals)} Cr`;
    }
    if (abs >= InrPricePipe.ONE_LAKH) {
      return `${sign}₹${this.trim(abs / InrPricePipe.ONE_LAKH, maxDecimals)} L`;
    }

    // Sub-lakh values render in Indian comma grouping ("₹85,000" / "₹4,500").
    return `${sign}₹${abs.toLocaleString('en-IN')}`;
  }

  /** Round to `maxDecimals` places, then strip trailing zeros and a dangling dot. */
  private trim(num: number, maxDecimals: number): string {
    return num
      .toFixed(maxDecimals)
      .replace(/\.?0+$/, '');
  }
}
