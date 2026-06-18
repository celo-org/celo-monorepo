// Map of linked library -> contracts that depend on it.
// Previously defined in migrationsConfig.js, which was removed together with Truffle.
export const linkedLibraries: { [library: string]: string[] } = {
  Proposals: ['Governance'],
  AddressLinkedList: ['Validators'],
  AddressSortedLinkedList: ['Election', 'ElectionTest'],
  IntegerSortedLinkedList: ['Governance', 'IntegerSortedLinkedListMock'],
  AddressSortedLinkedListWithMedian: ['SortedOracles', 'AddressSortedLinkedListWithMedianMock'],
  Signatures: [
    'Accounts',
    'Attestations',
    'AttestationsTest',
    'LockedGold',
    'Escrow',
    'FederatedAttestations',
  ],
}
