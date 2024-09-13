pragma solidity ^0.5.13;

import "../CIP20Lib.sol";

contract CIP20Test {
  using CIP20Lib for bytes;

  function sha3_256(bytes calldata input) external view returns (bytes memory) {
    return input.sha3_256();
  }

  function sha3_512(bytes calldata input) external view returns (bytes memory) {
    return input.sha3_512();
  }

  function keccak512(bytes calldata input) external view returns (bytes memory) {
    return input.keccak512();
  }

  function sha2_512(bytes calldata input) external view returns (bytes memory) {
    return input.sha2_512();
  }

  function blake2sWithConfig(
    bytes32 config,
    bytes calldata key,
    bytes calldata preimage
  ) external view returns (bytes memory) {
    return CIP20Lib.blake2sWithConfig(config, key, preimage);
  }

  function blake2s(bytes calldata input) external view returns (bytes memory) {
    return input.blake2s();
  }
}
