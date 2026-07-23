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
