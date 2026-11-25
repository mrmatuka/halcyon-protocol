import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SceneView } from '../../../src/ui/components/SceneView';
import { sampleStory } from '../../fixtures/sampleContent';
import type { Choice } from '../../../src/engine/schema';

describe('F5.2–F5.3 – SceneView', () => {
  const scene = sampleStory.nodes[1]; // n02_zarlat
  if (scene.kind !== 'scene') throw new Error('Expected scene');

  it('megjeleníti a csomópont címét, szövegét, illusztráció helyét és csak az elérhető választásokat', async () => {
    const user = userEvent.setup();
    const onChoose = vi.fn();
    const visibleOnly: Choice[] = [scene.choices[0]]; // c_kartya rejtve

    render(
      <SceneView
        node={scene}
        choices={visibleOnly}
        canUseCard={() => false}
        lastCheck={null}
        onChoose={onChoose}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Zárlat' })).toBeInTheDocument();
    expect(screen.getByText('Lezár az ajtó.')).toBeInTheDocument();
    expect(screen.getByTestId('scene-illustration')).toBeInTheDocument();

    expect(screen.getByRole('button', { name: /Futsz/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Kártyával nyitod/i })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Futsz/i }));
    expect(onChoose).toHaveBeenCalledWith('c_fut', false);
  });

  it('megjeleníti a kártya-bevetés gombot, ha a kártya használható az adott próbára', async () => {
    const user = userEvent.setup();
    const onChoose = vi.fn();

    render(
      <SceneView
        node={scene}
        choices={[scene.choices[0]]}
        canUseCard={(id) => id === 'c_fut'}
        cardName="Adrenalin"
        lastCheck={null}
        onChoose={onChoose}
      />,
    );

    const cardBtn = screen.getByRole('button', { name: /Adrenalin/i });
    await user.click(cardBtn);
    expect(onChoose).toHaveBeenCalledWith('c_fut', true);
  });

  it('F7.5 – lusta betöltés (loading="lazy") és hibakezelés sérült képnél', () => {
    render(
      <SceneView
        node={scene}
        choices={[scene.choices[0]]}
        canUseCard={() => false}
        lastCheck={null}
        imageUrl="/images/hianyzo.png"
        imageAlt="Zárlat illusztráció"
        onChoose={vi.fn()}
      />,
    );

    const img = screen.getByAltText('Zárlat illusztráció');
    expect(img).toHaveAttribute('loading', 'lazy');

    fireEvent.error(img);
    expect(screen.queryByAltText('Zárlat illusztráció')).not.toBeInTheDocument();
    expect(screen.getByText(/Illusztráció nem elérhető/i)).toBeInTheDocument();
  });
});
