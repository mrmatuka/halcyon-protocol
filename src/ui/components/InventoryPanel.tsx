import type { Item } from '../../engine/schema';

export interface InventoryPanelProps {
  itemIds: readonly string[];
  allItems: readonly Item[];
}

export function InventoryPanel({ itemIds, allItems }: InventoryPanelProps) {
  const held = itemIds
    .map((id) => allItems.find((item) => item.id === id))
    .filter((item): item is Item => item !== undefined);

  return (
    <section className="panel" aria-label="Tárgylista">
      <h2 className="panel__title">Tárgylista</h2>
      {held.length === 0 ? (
        <p className="muted">Nincs nálad tárgy.</p>
      ) : (
        <ul className="inventory-list">
          {held.map((item) => (
            <li key={item.id} className="inventory-list__item">
              <strong>{item.name}</strong>
              <span>{item.description}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
