import { render, screen } from '@testing-library/react';
import { Platform } from '../../src/platform/Platform';

describe('smoke', () => {
  it('megjeleníti a címet', () => {
    render(<Platform />);
    expect(screen.getByRole('heading', { name: 'Könyvespolc' })).toBeInTheDocument();
  });
});
