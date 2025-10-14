import { useState, useCallback, useMemo } from 'react';

export interface UseSelectionOptions<T> {
  items: T[];
  getItemId: (item: T) => string;
}

export const useSelection = <T>({ items, getItemId }: UseSelectionOptions<T>) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const selectedItems = useMemo(() => {
    return items.filter(item => selectedIds.has(getItemId(item)));
  }, [items, selectedIds, getItemId]);

  const isSelected = useCallback((item: T) => {
    return selectedIds.has(getItemId(item));
  }, [selectedIds, getItemId]);

  const isAllSelected = useMemo(() => {
    return items.length > 0 && items.every(item => selectedIds.has(getItemId(item)));
  }, [items, selectedIds, getItemId]);

  const isPartiallySelected = useMemo(() => {
    return selectedIds.size > 0 && !isAllSelected;
  }, [selectedIds.size, isAllSelected]);

  const toggleItem = useCallback((item: T) => {
    const id = getItemId(item);
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, [getItemId]);

  const toggleAll = useCallback(() => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map(getItemId)));
    }
  }, [items, getItemId, isAllSelected]);

  const selectItems = useCallback((itemsToSelect: T[]) => {
    setSelectedIds(new Set(itemsToSelect.map(getItemId)));
  }, [getItemId]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  return {
    selectedIds,
    selectedItems,
    selectedCount: selectedIds.size,
    isSelected,
    isAllSelected,
    isPartiallySelected,
    toggleItem,
    toggleAll,
    selectItems,
    clearSelection,
  };
};
