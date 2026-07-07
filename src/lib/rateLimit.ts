// ============================================================================
// rateLimit.ts — Client-side rate limiting for form submissions
// ============================================================================
// Stores submission timestamps in sessionStorage (cleared when browser closes).
// Allows a maximum of MAX_ATTEMPTS submissions within WINDOW_MS milliseconds.
// This is a "defence-in-depth" layer — the real rate-limiting enforced on the
// Web3Forms API side — but this prevents accidental or scripted rapid clicks.
// ============================================================================

const KEY          = 'cd_form_attempts';
const MAX_ATTEMPTS = 3;      // max submissions per window
const WINDOW_MS    = 10 * 60 * 1000; // 10 minutes

interface RateLimitState {
  timestamps: number[];
}

function loadState(): RateLimitState {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return { timestamps: [] };
    return JSON.parse(raw) as RateLimitState;
  } catch {
    return { timestamps: [] };
  }
}

function saveState(state: RateLimitState): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // sessionStorage may be blocked — degrade gracefully
  }
}

/** Returns true if the user is allowed to submit, false if rate-limited */
export function canSubmit(): boolean {
  const now = Date.now();
  const state = loadState();

  // Purge timestamps outside the current window
  state.timestamps = state.timestamps.filter((t) => now - t < WINDOW_MS);

  return state.timestamps.length < MAX_ATTEMPTS;
}

/** Record a submission attempt */
export function recordSubmit(): void {
  const now = Date.now();
  const state = loadState();

  state.timestamps = state.timestamps.filter((t) => now - t < WINDOW_MS);
  state.timestamps.push(now);

  saveState(state);
}

/** How many seconds until the oldest attempt expires (for user-facing messages) */
export function secondsUntilReset(): number {
  const now = Date.now();
  const state = loadState();
  const oldest = state.timestamps[0];
  if (!oldest) return 0;
  return Math.max(0, Math.ceil((oldest + WINDOW_MS - now) / 1000));
}
