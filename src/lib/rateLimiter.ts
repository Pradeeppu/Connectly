// Client-Side Traffic Control & Anti-Flood Rate Limiter
class RateLimiter {
  private messageTimestamps: number[] = [];
  private readonly maxMessages = 5; // Max 5 messages...
  private readonly windowMs = 3000; // ...per 3 seconds

  canSendMessage(): { allowed: boolean; waitSeconds?: number } {
    const now = Date.now();
    // Prune timestamps outside window
    this.messageTimestamps = this.messageTimestamps.filter((t) => now - t < this.windowMs);

    if (this.messageTimestamps.length >= this.maxMessages) {
      const oldest = this.messageTimestamps[0];
      const waitSeconds = Math.ceil((this.windowMs - (now - oldest)) / 1000);
      return { allowed: false, waitSeconds: Math.max(1, waitSeconds) };
    }

    this.messageTimestamps.push(now);
    return { allowed: true };
  }

  reset() {
    this.messageTimestamps = [];
  }
}

export const rateLimiter = new RateLimiter();
