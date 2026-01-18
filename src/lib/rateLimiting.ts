/**
 * Client-side rate limiting for authentication endpoints
 * Implements exponential backoff to prevent brute force attacks
 */

interface RateLimitEntry {
  attempts: number;
  lastAttempt: number;
  lockedUntil: number | null;
}

const STORAGE_KEY = 'auth_rate_limit';
const MAX_ATTEMPTS = 5;
const BASE_LOCKOUT_MS = 30000; // 30 seconds
const MAX_LOCKOUT_MS = 900000; // 15 minutes

class AuthRateLimiter {
  private getEntry(identifier: string): RateLimitEntry {
    try {
      const stored = sessionStorage.getItem(`${STORAGE_KEY}_${identifier}`);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Ignore parsing errors
    }
    return { attempts: 0, lastAttempt: 0, lockedUntil: null };
  }

  private setEntry(identifier: string, entry: RateLimitEntry): void {
    try {
      sessionStorage.setItem(`${STORAGE_KEY}_${identifier}`, JSON.stringify(entry));
    } catch {
      // Ignore storage errors
    }
  }

  private calculateLockoutDuration(attempts: number): number {
    // Exponential backoff: 30s, 60s, 120s, 240s, up to 15 min
    const duration = BASE_LOCKOUT_MS * Math.pow(2, Math.min(attempts - MAX_ATTEMPTS, 4));
    return Math.min(duration, MAX_LOCKOUT_MS);
  }

  /**
   * Check if the identifier is currently rate limited
   * Returns null if not limited, or the number of seconds remaining if limited
   */
  checkLimit(identifier: string): { limited: boolean; remainingSeconds: number; message: string } {
    const entry = this.getEntry(identifier);
    const now = Date.now();

    // Check if currently locked out
    if (entry.lockedUntil && entry.lockedUntil > now) {
      const remainingSeconds = Math.ceil((entry.lockedUntil - now) / 1000);
      return {
        limited: true,
        remainingSeconds,
        message: `Too many failed attempts. Please try again in ${this.formatTime(remainingSeconds)}.`
      };
    }

    // Reset attempts if last attempt was more than 15 minutes ago
    if (now - entry.lastAttempt > MAX_LOCKOUT_MS) {
      this.clearLimit(identifier);
      return { limited: false, remainingSeconds: 0, message: '' };
    }

    return { limited: false, remainingSeconds: 0, message: '' };
  }

  /**
   * Record a failed authentication attempt
   */
  recordFailedAttempt(identifier: string): { locked: boolean; remainingSeconds: number; message: string } {
    const entry = this.getEntry(identifier);
    const now = Date.now();

    entry.attempts += 1;
    entry.lastAttempt = now;

    if (entry.attempts >= MAX_ATTEMPTS) {
      const lockoutDuration = this.calculateLockoutDuration(entry.attempts);
      entry.lockedUntil = now + lockoutDuration;
      this.setEntry(identifier, entry);

      const remainingSeconds = Math.ceil(lockoutDuration / 1000);
      return {
        locked: true,
        remainingSeconds,
        message: `Account temporarily locked due to too many failed attempts. Please try again in ${this.formatTime(remainingSeconds)}.`
      };
    }

    this.setEntry(identifier, entry);
    const attemptsRemaining = MAX_ATTEMPTS - entry.attempts;
    return {
      locked: false,
      remainingSeconds: 0,
      message: attemptsRemaining <= 2 
        ? `Warning: ${attemptsRemaining} attempt${attemptsRemaining === 1 ? '' : 's'} remaining before temporary lockout.`
        : ''
    };
  }

  /**
   * Record a successful authentication (clears rate limit)
   */
  recordSuccess(identifier: string): void {
    this.clearLimit(identifier);
  }

  /**
   * Clear rate limit for an identifier
   */
  clearLimit(identifier: string): void {
    try {
      sessionStorage.removeItem(`${STORAGE_KEY}_${identifier}`);
    } catch {
      // Ignore storage errors
    }
  }

  private formatTime(seconds: number): string {
    if (seconds < 60) {
      return `${seconds} second${seconds === 1 ? '' : 's'}`;
    }
    const minutes = Math.ceil(seconds / 60);
    return `${minutes} minute${minutes === 1 ? '' : 's'}`;
  }

  /**
   * Get remaining attempts before lockout
   */
  getRemainingAttempts(identifier: string): number {
    const entry = this.getEntry(identifier);
    return Math.max(0, MAX_ATTEMPTS - entry.attempts);
  }
}

export const authRateLimiter = new AuthRateLimiter();
