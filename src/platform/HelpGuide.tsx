import { useEffect, useRef } from 'react';
import { ComicIcon } from '../ui/components/ComicIcon';
import { helpTopics } from './helpContent';
import { useLanguage } from './language';

export function HelpGuide({ onClose }: { onClose: () => void }) {
  const { t } = useLanguage();
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (dialog.current && !dialog.current.open) dialog.current.showModal();
  }, []);

  return (
    <dialog
      ref={dialog}
      className="help-guide"
      aria-labelledby="help-guide-title"
      onClose={onClose}
    >
      <header className="help-guide__header">
        <h1 id="help-guide-title">{t('Súgó', 'Help')}</h1>
        <button
          type="button"
          className="btn btn--secondary"
          onClick={() => dialog.current?.close()}
        >
          {t('Bezárás', 'Close')}
        </button>
      </header>
      <div className="help-guide__topics">
        {helpTopics.map(({ title, steps }) => (
          <details key={title[0]}>
            <summary>{t(...title)}</summary>
            <dl>
              {steps.map((step) => (
                <div key={step.title[0]}>
                  <dt>
                    {step.icon && <ComicIcon name={step.icon} />}
                    {t(...step.title)}
                  </dt>
                  <dd>{t(...step.text)}</dd>
                </div>
              ))}
            </dl>
          </details>
        ))}
      </div>
    </dialog>
  );
}
