// Map of linked library -> contracts that depend on it.
// Previously defined in migrationsConfig.js, which was removed together with Truffle.
// Only libraries with external/public functions produce link placeholders. The 0.8
// AddressSortedLinkedList is internal-only (inlined into Election), and Signatures was
// replaced by OpenZeppelin ECDSA during the 0.8 migration, so neither is linked anymore;
// listing them would make make-release prompt to deploy libraries no bytecode references.
export const linkedLibraries: { [library: string]: string[] } = {
  Proposals: ['Governance'],
  AddressLinkedList: ['Validators'],
  IntegerSortedLinkedList: ['Governance', 'IntegerSortedLinkedListMock'],
  AddressSortedLinkedListWithMedian: ['SortedOracles', 'AddressSortedLinkedListWithMedianMock'],
}
