// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.5.13 <0.8.20;

contract Precompiles {
  address public constant TRANSFER = address(0xff - 2);
  address public constant FRACTION_MUL = address(0xff - 3);
  address public constant PROOF_OF_POSSESSION = address(0xff - 4);
  address public constant GET_VALIDATOR = address(0xff - 5);
  address public constant NUMBER_VALIDATORS = address(0xff - 6);
  address public constant EPOCH_SIZE = address(0xff - 7);
  address public constant BLOCK_NUMBER_FROM_HEADER = address(0xff - 8);
  address public constant HASH_HEADER = address(0xff - 9);
  address public constant GET_PARENT_SEAL_BITMAP = address(0xff - 10);
  address public constant GET_VERIFIED_SEAL_BITMAP = address(0xff - 11);
}