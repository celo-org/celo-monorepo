// Map of linked library -> contracts that depend on it.
// Previously defined in migrationsConfig.js, which was removed together with Truffle.
// All core implementations are now Solidity 0.8 and link the 0.8 libraries; Signatures
// and AddressSortedLinkedList are no longer linked (0.8 uses OpenZeppelin ECDSA, and
// Election embeds the address sorted list).
export const linkedLibraries: { [library: string]: string[] } = {
  Proposals: ['Governance'],
  AddressLinkedList: ['Validators'],
  IntegerSortedLinkedList: ['Governance'],
  AddressSortedLinkedListWithMedian: ['SortedOracles'],
}
