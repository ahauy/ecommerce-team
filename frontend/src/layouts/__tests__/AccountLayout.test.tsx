import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/components/AccountSidebar', () => ({ default: () => <aside data-testid="account-sidebar" /> }));

import AccountLayout from '../AccountLayout';

describe('AccountLayout', () => {
  it('renders the account sidebar next to the routed page, full width', () => {
    render(
      <MemoryRouter initialEntries={['/account/orders']}>
        <Routes>
          <Route element={<AccountLayout />}>
            <Route path="/account/orders" element={<div data-testid="page" />} />
          </Route>
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByTestId('account-sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('page')).toBeInTheDocument();
    const layout = screen.getByTestId('account-layout');
    expect(layout).toHaveClass('bg-canvas-cream');
    expect(layout.innerHTML).not.toContain('max-w-');
  });
});
