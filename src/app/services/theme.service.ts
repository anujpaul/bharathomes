import { Injectable, computed, effect, signal } from '@angular/core';

export type Theme = 'light' | 'dark';

/**
 * Single source of truth for the active UI theme.
 *
 * Resolution order on first load:
 *   1. Explicit user choice in localStorage (`theme` = 'light' | 'dark')
 *   2. OS preference via `prefers-color-scheme: dark`
 *   3. Fall back to 'light'
 *
 * Once the user toggles, we stop following the OS — their explicit choice
 * is persisted to localStorage and wins on every subsequent load.
 *
 * The `.dark` class on <html> is the bridge to Tailwind: index.css declares
 * `@custom-variant dark (&:where(.dark, .dark *))`, so adding/removing the
 * class flips every `dark:` utility in the app.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private static readonly STORAGE_KEY = 'theme';

  readonly theme = signal<Theme>(this.resolveInitialTheme());
  readonly isDark = computed(() => this.theme() === 'dark');

  constructor() {
    // Sync the DOM whenever theme changes (initial value + every toggle).
    effect(() => {
      const root = document.documentElement;
      if (this.theme() === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    });
  }

  toggle(): void {
    this.set(this.theme() === 'dark' ? 'light' : 'dark');
  }

  set(next: Theme): void {
    this.theme.set(next);
    try {
      localStorage.setItem(ThemeService.STORAGE_KEY, next);
    } catch {
      // localStorage can throw in private/incognito modes — swallow so the
      // toggle still works in-session.
    }
  }

  private resolveInitialTheme(): Theme {
    if (typeof window === 'undefined') return 'light'; // SSR safety

    try {
      const stored = localStorage.getItem(ThemeService.STORAGE_KEY);
      if (stored === 'dark' || stored === 'light') return stored;
    } catch {
      // ignore — fall through to OS preference
    }

    if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }
}
