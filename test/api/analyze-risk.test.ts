import { describe, it, expect } from 'vitest';
import { analyzeProposalHeuristics } from '../../lib/ai.ts';

describe('AegisDAO Heuristic Risk Rule Engine', () => {
  it('Should compute LOW risk for standard low-value proposals', () => {
    const result = analyzeProposalHeuristics({
      title: 'AIP-1: Community Documentation Grant',
      description: 'Standard grant request for community documentation.',
      targets: ['0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65'],
      values: ['500000000000000000'], // 0.5 ETH
      calldatas: ['0x9b3293ca'],
    });

    expect(result.riskScore).toBeLessThan(50);
    expect(result.riskLevel).toBe('LOW');
    expect(result.isMockFallback).toBe(true);
  });

  it('Should detect HIGH risk for massive ETH treasury transfers (>= 5 ETH)', () => {
    const result = analyzeProposalHeuristics({
      title: 'AIP-2: Massive Treasury Transfer',
      description: 'Requesting 10 ETH transfer from vault.',
      targets: ['0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65'],
      values: ['10000000000000000000'], // 10 ETH
      calldatas: ['0x9b3293ca'],
    });

    expect(result.riskScore).toBeGreaterThanOrEqual(50);
    expect(['HIGH', 'CRITICAL']).toContain(result.riskLevel);
    expect(result.threatVectors.some(t => t.category === 'Treasury Drain Risk')).toBe(true);
  });

  it('Should flag CRITICAL severity for transferOwnership call signatures', () => {
    const result = analyzeProposalHeuristics({
      title: 'AIP-3: Update Contract Owner',
      description: 'Attempting transferOwnership target call.',
      targets: ['0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC'],
      values: ['0'],
      calldatas: ['0xf2fde38b00000000000000000000000070997970c51812dc3a010c7d01b50e0d17dc79c8'],
    });

    expect(result.riskLevel).toBe('CRITICAL');
    expect(result.threatVectors.some(t => t.category === 'Ownership Transfer')).toBe(true);
  });
});
