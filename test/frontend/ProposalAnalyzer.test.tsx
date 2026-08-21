import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ProposalAnalyzer } from '../../components/ProposalAnalyzer';

describe('ProposalAnalyzer Form Component', () => {
  it('renders form inputs correctly', () => {
    const handleSubmit = vi.fn();
    const handleDraftAi = vi.fn();

    render(
      <ProposalAnalyzer
        onSubmit={handleSubmit}
        onDraftAi={handleDraftAi}
      />
    );

    expect(screen.getByPlaceholderText(/AIP-4: Treasury Grant/i)).toBeInTheDocument();
    expect(screen.getByText(/Analyze Risk & Proceed/i)).toBeInTheDocument();
  });

  it('pre-fills synthetic malicious payload when Demo Mode button is clicked', async () => {
    const handleSubmit = vi.fn();
    const handleDraftAi = vi.fn();

    render(
      <ProposalAnalyzer
        onSubmit={handleSubmit}
        onDraftAi={handleDraftAi}
      />
    );

    const demoButton = screen.getByText(/Load Malicious Demo/i);
    fireEvent.click(demoButton);

    await waitFor(() => {
      expect(screen.getByText(/DEMO DATA \/ SYNTHETIC MALICIOUS PAYLOAD LOADED/i)).toBeInTheDocument();
      expect(screen.getByDisplayValue(/\[DEMO\] AIP-99: Liquidity Pool Optimization/i)).toBeInTheDocument();
    });
  });
});
