import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Platform } from '../../src/platform/Platform';

describe('smoke', () => {
  it('a főmenüből megnyitja a Könyvkalandot', async () => {
    const user = userEvent.setup();
    render(<Platform />);
    expect(screen.getByRole('main', { name: 'Főmenü' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Új kaland' }));
    expect(screen.getByRole('heading', { name: 'Könyvkaland' })).toBeInTheDocument();
  });
});
