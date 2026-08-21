import { describe, it, expect } from 'vitest';
import { checkRateLimit } from '../../lib/rate-limit';

describe('/api/analyze-proposal Backend API Requirements', () => {
  it('Should rate limit requests after exceeding bucket tokens', () => {
    const testIp = '192.168.1.100';
    
    // First 5 requests should pass (limit is 5 for test)
    for (let i = 0; i < 5; i++) {
      const res = checkRateLimit(testIp, 5, 60000);
      expect(res.success).toBe(true);
    }

    // 6th request should fail
    const blockedRes = checkRateLimit(testIp, 5, 60000);
    expect(blockedRes.success).toBe(false);
    expect(blockedRes.remaining).toBe(0);
  });
});
