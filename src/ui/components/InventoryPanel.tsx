import { useLanguage } from '../../platform/language';
import { ComicIcon } from './ComicIcon';
import type { Item } from '../../engine/schema';

export interface InventoryPanelProps {
  itemIds: readonly string[];
  allItems: readonly Item[];
}

export function InventoryPanel({ itemIds, allItems }: InventoryPanelProps) {
  const { t } = useLanguage();
  const held = itemIds
    .map((id) => allItems.find((item) => item.id === id))
    .filter((item): item is Item => item !== undefined);

  return (
    <section className="panel comic-equipment" aria-label={t('Tárgylista', 'Inventory')}>
      <h2 className="panel__title">{t('Eszközök', 'Equipment')}</h2>
      {held.length === 0 ? (
        <p className="muted">{t('Nincs nálad tárgy.', 'Your inventory is empty.')}</p>
      ) : (
        <ul className="inventory-list">
          {held.map((item) => (
            <li key={item.id} className="inventory-list__item">
              <ComicIcon name="bag" />
              <strong>{item.name}</strong>
              <span>{item.description}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
