import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ProposalCard } from '../../components/ui/ProposalCard';
import { IndexedProposal } from '../../lib/indexer/store';

const mockProposal: IndexedProposal = {
  id: '12345678901234567890',
  proposer: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
  targets: ['0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65'],
  values: ['1000000000000000000'],
  signatures: ['releaseGrant(address,uint256,string)'],
  calldatas: ['0x9b3293ca'],
  title: 'Test Governance Proposal',
  description: 'Test proposal description text for testing UI card rendering.',
  ipfsCid: 'QmTestHash12345',
  startBlock: 100,
  endBlock: 200,
  forVotes: '1000000000000000000000', // 1000 AGIS
  againstVotes: '500000000000000000000', // 500 AGIS
  abstainVotes: '0',
  state: 'Active',
  eta: 0,
  riskAnalysis: {
    riskScore: 25,
    riskLevel: 'LOW',
    summary: 'Low risk proposal test',
    threatVectors: [],
    auditChecklist: ['Verify target address'],
    recommendation: 'APPROVE',
    isMockFallback: true,
  },
  createdAt: Date.now(),
};

describe('ProposalCard Component', () => {
  it('renders proposal title, state badge, and vote totals correctly', () => {
    render(<ProposalCard proposal={mockProposal} />);

    expect(screen.getByText('Test Governance Proposal')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText(/1,000/)).toBeInTheDocument();
    expect(screen.getByText(/500/)).toBeInTheDocument();
  });
});
