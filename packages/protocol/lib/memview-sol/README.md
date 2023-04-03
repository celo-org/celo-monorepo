## TypedMemView

TypedMemView is a library for interacting with the EVM's linear memory in
Solidity. It provides safe access to contiguous portions of memory, in a
C-like style. Views are stored on the stack, and may be manipulated without
manipulating the underlying memory.

This library is particularly useful for writing solidity parsers. It is
currently used in [bitcoin-spv](https://github.com/summa-tx/bitcoin-spv) to
parse and manipulate Bitcoin data structures.

`npm i @summa-tx/memview-sol`

### Using Solidity v0.8?

The [`latest-solidity`](https://github.com/summa-tx/memview-sol/pull/6) branch
can be installed as a forge dependency!

### Why does this exist?

The Solidity `bytes memory` type has a few weaknesses.

1. It can't index ranges effectively
2. It can't be sliced without copying
3. The underlying data may represent any type
4. Solidity never deallocates memory, and memory costs grow superlinearly

By using a memory view we get the following advantages:

1. Slices are done on the stack via pointer arithmetic
2. We can index arbitrary ranges on the stack, without copying
3. We can associate type information with the pointer, and typecheck at runtime

The makes `TypedMemView` a useful tool for efficient zero-copy algorithms.

### Why bytes29?

Because Solidity does not allow stack type declaration, in order to have views
stored on the stack, we need to reuse an existing stack type. We want to avoid
confusion between views and other common types like digests, as well as
accidental arithmetic on the view structure. Therefore we chose a large and
uncommonly used stack type: `bytes29`.

The format of a memory view is as follows:

1. A 5-byte type flag.
   1. `0xff_ffff_fffe` is reserved for unknown type.
   1. `0xff_ffff_ffff` is reserved for invalid types, or errors.
2. A 12-byte memory address.
3. A 12-byte integer representing the length of the view in bytes.
4. 3 empty bytes.

Note that while bytes are left-aligned in a word, integers and addresses are
right-aligned. This means when working in assembly we have to account for the 3
unused bytes on the righthand side.

### Library guarantees

This library aims to be memory safe provided the following assumptions hold:

1. Other routines do not deallocate memory.
2. The freemem pointer is add memory address `0x40`.
3. The Solidity `bytes memory` representation is constant across versions.

If those assumptions hold:

1. `TypedMemView` will not modify allocated memory.
2. `TypedMemView` will explicitly mark functions that unsafely access
   unallocated memory.
3. `TypedMemView` will not allow view read overruns.

This library uses unallocated memory for internal functions and DOES NOT
guarantee that that memory will be cleaned after use. This means that
freshly-allocated memory may be dirty, and library consumers SHOULD NOT
assume that memory structs will be 0-initialized.

### Usage

The primary interface is:

- `ref` -- create a `view` referencing an underlying `bytes memory`.
- `loc` `len`, `typeof` -- inspect a view.
- `equal` and `notEqual` -- compare views.
- `untypedEqual` and `untypedNotEqual` -- compare the underlying memory.
- `slice` -- narrow the view without copying.
- `clone` -- explicitly copy the view to a new `bytes memory`.
- `keccak` and `sha2` -- return the hash of a view.
- `join` -- concatenate several views into a new `bytes memory`.

Many of these functions require a type argument. If typing is unimportant to the
applciation, use `0` or `0xff_ffff_fffe`. We recommend that you create a type
enum and use type assertions liberally. See [ViewBTC.sol](https://github.com/summa-tx/bitcoin-spv/blob/master/solidity/contracts/ViewBTC.sol)
for an example.

```solidity
contract MyThing {
    using TypedMemView for bytes;
    using TypedMemView for bytes29;

    function addressAtIndex(bytes memory arr, uint256 idx) internal pure returns (address) {
        return arr.ref(0).indexAddress(idx);
    }

    function hashSlice(bytes memory arr) internal pure returns (bytes32) {
        return arr
            .ref(0)
            .slice(15, 256, 0)  // 256 bytes from idx 15. type: 0
            .keccak();  // hash of those 256 bytes
    }

    // Extract 3 slices and create a new bytes memory with the concatenation
    function extractAndConcat(bytes memory arr) internal pure returns (bytes memory) {
        bytes29 view = arr.ref(0);
        bytes29[] memory slices = new bytes29[](3);

        slices[0] = view.slice(0, 32);
        slices[1] = view.slice(64, 32);
        slices[2] = view.slice(128, 32);

        return TypedMemView.join(slices);
    }
}
```
