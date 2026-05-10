import { Pipe, PipeTransform } from '@angular/core';

/**
 * Parses a user-typed price string into a rupee amount.
 *
 *   "85L"        → 8_500_000
 *   "8.5 Cr"     → 85_000_000
 *   "₹2,50,000"  → 250_000
 *   "8500000"    → 8_500_000   (bare number = raw rupees)
 *   ""           → null         (treat as "no constraint")
 *   "abc"        → null         (unparseable)
 *
 * Suffixes accepted (case-insensitive): cr, crore(s); l, lakh(s), lac;
 * k, thousand. Whitespace, commas and the ₹ symbol are stripped.
 *
 * Mirrors the formatting in InrPricePipe so users can copy-paste prices
 * the app shows back into a filter input and have them parse cleanly.
 */
export function parsePriceInput(raw: string | null | undefined): number | null {
  if (raw == null) return null;
  const cleaned = raw.toLowerCase().trim().replace(/[₹,\s]/g, '');
  if (!cleaned) return null;

  const match = cleaned.match(
    /^(\d+(?:\.\d+)?)(cr|crore|crores|l|lakh|lakhs|lac|k|thousand)?$/
  );
  if (!match) return null;

  const num = parseFloat(match[1]);
  if (isNaN(num) || num < 0) return null;

  switch (match[2]) {
    case 'cr':
    case 'crore':
    case 'crores':
      return Math.round(num * 10_000_000);
    case 'l':
    case 'lakh':
    case 'lakhs':
    case 'lac':
      return Math.round(num * 100_000);
    case 'k':
    case 'thousand':
      return Math.round(num * 1_000);
    default:
      return Math.round(num);
  }
}

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
  private static readonly ONE_LAKH = 100_000;

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
