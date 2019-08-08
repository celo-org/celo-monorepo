// inserts the new item at the first index and makes sure it's not present twice
export const insertAtBeginning = <T>(item: T, items: T[]) => {
  return [
    item,
    ...items.filter(
      (existingItem) =>
        existingItem !== item && JSON.stringify(existingItem) !== JSON.stringify(item)
    ),
  ]
}
