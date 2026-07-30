// SPDX-License-Identifier: MIT
pragma solidity >=0.8.7 <0.8.20;

/**
 * @title EnumerableSet (storage-compatible port)
 * @notice Solidity 0.8 port of OpenZeppelin 2.5's EnumerableSet.
 * @dev Deployed proxies (FeeHandler, LockedGold, UniswapFeeHandlerSeller) hold
 * AddressSet data written with the OpenZeppelin 2.5 layout, which stores the
 * index mapping in the struct's first slot and the values array in the second.
 * OpenZeppelin 4.x reverses that order, so upgrading an implementation to the
 * 4.x library would make every persisted set read as empty. This port keeps
 * the 2.5 storage layout (member order and names) while exposing the richer
 * 4.x-style API (length/at/getValues) that the migrated contracts use.
 *
 * `getValues` is deliberately not named `values` because the struct member of
 * that name (required for layout compatibility) would shadow the function.
 *
 * Why the sets would read as empty, concretely: a mapping stores nothing at its
 * own slot, so under the 2.5 layout the struct's first slot holds zero. Point
 * the 4.x layout at that same slot and it is interpreted as `_values.length`,
 * i.e. an empty array. The real entries are not corrupted, they are orphaned:
 * the old array data sits at keccak(slot+1) while the new code reads
 * keccak(slot), and old index entries live at keccak(address . slot) while new
 * lookups go to keccak(bytes32 . slot+1). Nothing lines up, and the stranded
 * data is unreachable through the new ABI.
 *
 * Alternative considered and rejected (for now): keep the 4.x library and
 * migrate the persisted data into the new layout with a storage setter. That is
 * workable for the bounded sets -- FeeHandler's two singletons (`activeTokens`,
 * `otherBeneficiariesAddresses`) and UniswapFeeHandlerSeller's per-token
 * `routerAddresses` are small and reconstructible from config and events. It
 * breaks down on LockedGold: `delegatees` is nested per delegator inside the
 * `delegatorInfo` mapping, so there is one set per delegating account and no
 * on-chain way to enumerate them (Solidity mappings are not enumerable). A
 * migration would therefore need an off-chain indexer to reconstruct the full
 * delegator list, a permissioned batched entrypoint, raw-assembly reads of the
 * stranded slots, and unbounded gas -- with every missed delegator silently
 * losing their delegation, and an inconsistent window while the batches run.
 *
 * The failure mode is also partial rather than clean, which makes it worse:
 * sibling fields are laid out separately and survive the change, so a broken
 * upgrade leaves self-contradicting state -- LockedGold would report a non-zero
 * `totalDelegatedCeloFraction` alongside an empty delegatee set, and FeeHandler
 * would keep `totalFractionOfOtherBeneficiaries` while the beneficiary set
 * reads empty, skewing the burn/distribute split.
 *
 * Porting the 2.5 layout is one file with no migration, no off-chain
 * dependency and no state risk, so it is the chosen trade-off. Revisit only if
 * the sets ever need to be rebuilt anyway, or if a future change already
 * requires a full delegator enumeration.
 *
 * INVARIANT FOR MAINTAINERS: the member order below (`index` first, `values`
 * second) is load-bearing and must not be "tidied" to match upstream
 * OpenZeppelin 4.x/5.x. Reordering them silently detaches every deployed set.
 */
library EnumerableSet {
  struct AddressSet {
    // Position of the value in the `values` array, plus 1 because index 0
    // means a value is not in the set.
    mapping(address => uint256) index;
    address[] values;
  }

  /**
   * @dev Add a value to a set. O(1).
   * Returns true if the value was added to the set, that is if it was not
   * already present.
   */
  function add(AddressSet storage set, address value) internal returns (bool) {
    if (contains(set, value)) {
      return false;
    }
    set.values.push(value);
    set.index[value] = set.values.length;
    return true;
  }

  /**
   * @dev Removes a value from a set. O(1).
   * Returns true if the value was removed from the set, that is if it was
   * present.
   */
  function remove(AddressSet storage set, address value) internal returns (bool) {
    uint256 valueIndex = set.index[value];
    if (valueIndex == 0) {
      return false;
    }
    uint256 toDeleteIndex = valueIndex - 1;
    uint256 lastIndex = set.values.length - 1;
    if (toDeleteIndex != lastIndex) {
      address lastValue = set.values[lastIndex];
      set.values[toDeleteIndex] = lastValue;
      set.index[lastValue] = valueIndex;
    }
    set.values.pop();
    delete set.index[value];
    return true;
  }

  /**
   * @dev Returns true if the value is in the set. O(1).
   */
  function contains(AddressSet storage set, address value) internal view returns (bool) {
    return set.index[value] != 0;
  }

  /**
   * @dev Returns the number of values in the set. O(1).
   */
  function length(AddressSet storage set) internal view returns (uint256) {
    return set.values.length;
  }

  /**
   * @dev Returns the value stored at position `index` in the set. O(1).
   * Note that there are no guarantees on the ordering of values inside the
   * array, and it may change when more values are added or removed.
   *
   * Requirements:
   * - `index` must be strictly less than {length}.
   */
  function at(AddressSet storage set, uint256 index) internal view returns (address) {
    return set.values[index];
  }

  /**
   * @dev Returns the entire set as a memory array. O(n).
   *
   * WARNING: This operation copies the whole storage array to memory, which
   * can be expensive. It is designed for view accessors queried without gas
   * fees; using it in state-changing functions may make the function
   * uncallable if the set grows large.
   */
  function getValues(AddressSet storage set) internal view returns (address[] memory) {
    return set.values;
  }
}
