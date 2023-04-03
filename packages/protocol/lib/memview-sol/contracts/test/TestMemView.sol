// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity >=0.5.10;

import {TypedMemView} from "../TypedMemView.sol";

contract TestMemView {
    using TypedMemView for bytes29;

    event DEBUG(bytes29 indexed a, bytes29 indexed b);

    function sameBody() public pure {
        // 38 bytes
        // Same body, different locations
        bytes memory one = hex"ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
        bytes memory two = hex"ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";

        bytes29 v1 = TypedMemView.ref(one, 1);
        bytes29 v2 = TypedMemView.ref(two, 2);
        require(v1.isValid(), "1 ought to be valid");
        require(v2.isValid(), "2 ought to be valid");
        require(v1.len() == 38, "1 ought to be length 32");
        require(v2.len() == 38, "2 ought to be length 32");
        require(v1.typeOf() == 1, "1 ought to be type 1");
        require(v2.typeOf() == 2, "2 ought to be type 2");
        require(v1.castTo(2).equal(v2), "1 cast to 2 ought to equal 2");

        require(v1.words() == 2, "1 ought to have words 2");
        require(v1.footprint() == 64, "1 ought to have foortprint 64");
        require(v2.words() == 2, "2 ought to have words 2");
        require(v2.footprint() == 64, "2 ought to have foortprint 64");

        require(keccak256(one) == v1.keccak(), "1 hash mismatch");
        require(keccak256(two) == v2.keccak(), "2 hash mismatch");

        require(v1 != v2, "1 & 2 ought not be identical");
        require(v1.notEqual(v2), "1 & 2 ought not be equal");
        require(v1.untypedEqual(v2), "1 & 2 ought be untyped equal");
        require(v1.loc() != v2.loc(), "1 & 2 ought not be at same loc");
        require(v1.len() == v2.len(), "1 & 2 ought be the same len");

        // A second TypedMemView.ref to two, with a different type
        bytes29 v3 = TypedMemView.ref(two, 1);

        require(v3.typeOf() == 1, "3 ought to be type 1");
        require(keccak256(two) == v3.keccak(), "3 hash mismatch");
        require(v3.words() == 2, "3 ought to have words 2");
        require(v3.footprint() == 64, "3 ought to have foortprint 64");

        require(v1 != v3, "1 & 3 ought not be identical");
        require(v1.equal(v3), "1 & 3 ought be equal");
        require(v1.untypedEqual(v3), "1 & 3 ought be untyped equal");
        require(v1.loc() != v3.loc(), "1 & 3 ought not be at same loc");
        require(v1.len() == v3.len(), "1 & 3 ought be the same len");

        require(v3 != v2, "2 & 3 ought not be identical");
        require(v3.notEqual(v2), "2 & 3 ought not be equal");
        require(v3.untypedEqual(v2), "2 & 3 ought be untyped equal");
        require(v3.loc() == v2.loc(), "2 & 3 ought be at same loc");
        require(v3.len() == v2.len(), "2 & 3 ought be the same len");
    }

    function differentBody() public pure {
        // 16 bytes with some identical segments
        bytes memory one = hex"abcdffff1111ffffffffffffffffffff";
        bytes memory two = hex"ffffabcdffff1111ffffffffffffffff";

        bytes29 v1 = TypedMemView.ref(one, 0);
        bytes29 v2 = TypedMemView.ref(two, 0);

        require(
            v1.slice(0, 2, 0).equal(v2.slice(2, 2, 0)),
            "abcd"
        );

        require(
            v1.slice(0, 4, 0).equal(v2.slice(2, 4, 0)),
            "abcdffff"
        );

        require(
            v1.slice(2, 4, 0).equal(v2.slice(4, 4, 0)),
            "ffff1111"
        );

        require(
            v1.slice(2, 6, 0).equal(v2.slice(4, 6, 0)),
            "ffff1111ffff"
        );

        require(
            v1.postfix(8, 0).equal(v2.postfix(8, 0)),
            "ffffffffffffffff"
        );

        require(
            v1.prefix(14, 0).equal(v2.postfix(14, 0)),
            "abcdffff1111ffffffffffffffff"
        );

        require(
            v1.postfix(2, 0).equal(v2.prefix(2, 0)),
            "ffff"
        );
    }

    function slicing() public view {
        // 76 bytes - 3 words

        // solium-disable-next-line max-len
        bytes memory one = hex"000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f202122232425262728292a2b2c2d2e2f303132333435363738393a3b3c3d3e3f404142434445464748494a4b";

        bytes29 v1 = TypedMemView.ref(one, 1);
        require(
            v1.slice(1, 13, 0).keccak() == keccak256(hex"0102030405060708090a0b0c0d"),
            "slice(1, 13) -- keccak mismatch"
        );

        bytes29 v2 = v1.slice(76, 0, 255);
        require(v2.keccak() == keccak256(hex""), "v2 slice not null");

        bytes29 v3 = v1.slice(1, 25, 0).slice(13, 12, 0);
        require(
            v3.keccak() == keccak256(hex"0e0f10111213141516171819"),
            "multiple slice hash mismatch"
        );
        require(
            v3.sha2() == sha256(hex"0e0f10111213141516171819"),
            "multiple slice sha2 mismatch"
        );

        require(
            keccak256(v3.clone()) == v3.keccak(),
            "clone slice hash mismatch"
        );

        require(
            sha256(v3.clone()) == v3.sha2(),
            "clone slice sha2 mismatch"
        );

        require(
            v1.slice(25, 33, 0).slice(19, 14, 0) == v1.slice(20, 43, 0).slice(24, 14, 0),
            "expected equivalent slices"
        );

        require(
            v1.index(0, 32) == hex"000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f",
            "index mismatch 32 bytes"
        );

        require(
            v1.index(0, 14) == hex"000102030405060708090a0b0c0d000000000000000000000000000000000000",
            "index mismatch 14 bytes"
        );

        require(
            v1.indexUint(0, 14) == 0x000102030405060708090a0b0c0d,
            "index mismatch 14 byte uint"
        );

        require(
            v1.indexLEUint(0, 14) == 0x0d0c0b0a09080706050403020100,
            "index mismatch 14 byte uint le"
        );

        require(
            v1.indexAddress(12) == 0x0c0D0E0F101112131415161718191a1B1c1D1E1F,
            "index mismatch address"
        );

        require(v1.slice(0, 76, 1).equal(v1), "full slice not equal");
        require(v1.slice(0, 77, 1).isNull(), "Non-null on slice overrun");
    }

    function typeError() public pure {
        bytes memory one = hex"00";
        bytes29 v1 = TypedMemView.ref(one, 33);
        require(v1.isType(33), "isType should pass");
        v1.assertType(44);
    }

    function testInvalidMemOverrung() public pure {
        bytes memory buf = new bytes(0);
        assembly {
            mstore(buf, 0xffffffff)
        }
        bytes29 inv = TypedMemView.ref(buf, 150);
        require(!inv.isValid(), "inv ought not be valid");
    }
}
