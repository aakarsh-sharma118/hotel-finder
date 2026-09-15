/**
 * @fileoverview App base-path utility.
 * Reads VITE_REPO_BASE from the .env file so the repo name never needs
 * to be hard-coded inside any component or hook.
 *
 * Usage in vite.config.ts / GitHub Pages:
 *   VITE_REPO_BASE=hotel-finder   ← set this to your new repo name
 *
 * How it works:
 *   - In development (npm run dev) the base is always '' so URLs are '/'
 *   - In production builds on GitHub Pages the base becomes '/hotel-finder'
 *   - Anywhere in the code, import getAppBasePath() instead of a hard-coded string
 *
 * © 2026 Aakarsh Sharma. All rights reserved.
 */

/**
 * Returns the URL base path for this deployment.
 * Empty string in local dev, '/repo-name' on GitHub Pages.
 */
export function getAppBasePath(): string {
  if (typeof window === 'undefined') return '';

  // Read the env variable injected by Vite at build time
  const repoBase = (import.meta as any).env?.VITE_REPO_BASE as string | undefined;
  const isProd =
    Boolean((import.meta as any).env?.PROD) ||
    (typeof process !== 'undefined' && process.env?.NODE_ENV === 'production');

  // If repoBase is explicitly configured, use it when current pathname matches
  if (repoBase) {
    const prefix = `/${repoBase.replace(/^\/+|\/+$/g, '')}`;
    if (window.location.pathname.startsWith(prefix)) {
      return prefix;
    }
  }

  // Dynamic detection for GitHub Pages or subfolder deployments:
  // Extracts the leading repository subpath (e.g. '/hotel-finder')
  if (isProd && window.location.pathname.length > 1) {
    const match = window.location.pathname.match(/^(\/[a-zA-Z0-9_-]+)(?:\/.*)?$/);
    if (match && match[1] && !['/bookings', '/search', '/api'].includes(match[1])) {
      return match[1];
    }
  }

  return '';
}
