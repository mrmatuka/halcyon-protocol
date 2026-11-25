import { render, screen } from '@testing-library/react';
import { App } from '../../src/ui/App';

describe('smoke', () => {
  it('megjeleníti a címet', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Csendes Jel' })).toBeInTheDocument();
  });
});
