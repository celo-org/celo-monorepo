// Map of linked library -> contracts that depend on it.
// Previously defined in migrationsConfig.js, which was removed together with Truffle.
// This map spans compiler eras: release tooling also re-deploys old tags whose 0.5
// bytecode still links libraries the 0.8 contracts replaced with internal code
// (Signatures -> OpenZeppelin ECDSA, AddressSortedLinkedList -> internal-only).
// make-release filters these entries against each artifact's actual link placeholders.
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
