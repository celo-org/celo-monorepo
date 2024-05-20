// From https://github.com/prestwich/cip20-sol
pragma solidity ^0.5.13;

library CIP20Lib {
  uint8 private constant CIP20_ADDRESS = 0xE2;

  uint8 private constant SHA3_256_SELECTOR = 0x00;
  uint8 private constant SHA3_512_SELECTOR = 0x01;
  uint8 private constant KECCAK_512_SELECTOR = 0x02;
  uint8 private constant SHA2_512_SELECTOR = 0x03;
  uint8 private constant BLAKE2S_SELECTOR = 0x10;

  // BLAKE2S_DEFAULT_CONFIG = createBlake2sConfig(32, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0)
  bytes32 private constant BLAKE2S_DEFAULT_CONFIG =
    0x2000010100000000000000000000000000000000000000000000000000000000;

  // Accepts a fully formed input blob. This should include any config
  // options and the preimage, but not the selector.
  function executeCIP20(
    bytes memory input,
    uint8 selector,
    uint256 output_len
  ) internal view returns (bytes memory) {
    uint8 addr = CIP20_ADDRESS;
    bytes memory output = new bytes(output_len);

    // To avoid copying the input array (an unbounded cost) we store its
    // length on the stack and then replace the length prefix for its
    // in-memory representation with the selector. We then replace the
    // length in memory after the precompile executes with it.
    uint256 len = input.length;

    bool success;
    assembly {
      mstore(input, selector) // selector

      success := staticcall(
        sub(gas, 2000),
        addr,
        add(input, 0x1F), // location is shifted 1 byte for selector
        add(len, 0x01), // length w/ selector
        add(output, 0x20), // location
        mload(output) // length
      )

      // Restore the input array length prefix
      mstore(input, len)
    }

    require(success, "CIP-20 hashing failed");
    return output;
  }

  function sha3_256(bytes memory input) internal view returns (bytes memory) {
    return executeCIP20(input, SHA3_256_SELECTOR, 32);
  }

  function sha3_512(bytes memory input) internal view returns (bytes memory) {
    return executeCIP20(input, SHA3_512_SELECTOR, 64);
  }

  function keccak512(bytes memory input) internal view returns (bytes memory) {
    return executeCIP20(input, KECCAK_512_SELECTOR, 64);
  }

  function sha2_512(bytes memory input) internal view returns (bytes memory) {
    return executeCIP20(input, SHA2_512_SELECTOR, 64);
  }

  function blake2sWithConfig(
    bytes32 config,
    bytes memory key,
    bytes memory preimage
  ) internal view returns (bytes memory) {
    require(
      key.length == uint256(config >> (8 * 30)) & 0xff,
      "CIP20Lib/blake2sWithConfig - Provided key length does not match key length in config"
    );
    bytes memory configuredInput = abi.encodePacked(config, preimage);
    return executeCIP20(configuredInput, BLAKE2S_SELECTOR, uint256(uint8(config[0])));
  }

  function blake2s(bytes memory preimage) internal view returns (bytes memory) {
    return blake2sWithConfig(BLAKE2S_DEFAULT_CONFIG, hex"", preimage);
  }

  function createBlake2sConfig(
    uint8 digestSize,
    uint8 keyLength,
    uint8 fanout,
    uint8 depth,
    uint32 leafLength,
    uint32 nodeOffset,
    uint16 xofDigestLength,
    uint8 nodeDepth,
    uint8 innerLength,
    bytes8 salt,
    bytes8 personalize
  ) internal pure returns (bytes32 config) {
    require(keyLength <= 32, "CIP20Lib/createBlake2sConfig -- keyLength must be 32 or less");
    config = writeU8(config, 0, digestSize);
    config = writeU8(config, 1, keyLength);

    config = writeU8(config, 2, fanout);
    config = writeU8(config, 3, depth);
    config = writeLEU32(config, 4, leafLength);
    config = writeLEU32(config, 8, nodeOffset);
    config = writeLEU16(config, 12, xofDigestLength);
    config = writeU8(config, 14, nodeDepth);
    config = writeU8(config, 15, innerLength);

    config |= bytes32(uint256(uint64(salt))) << (8 * 8);
    config |= bytes32(uint256(uint64(personalize))) << (8 * 0);
    return config;
  }

  // This function relies on alignment mechanics. Explicit conversion to
  // `bytes` types shorter than 32 results in left re-alignment. To avoid
  // that, we convert the bytes32 to uint256 instead of converting the uint8
  // to a bytes1.
  function writeU8(bytes32 b, uint8 offset, uint8 toWrite) private pure returns (bytes32) {
    require(offset <= 31, "CIP20Lib/writeU8 -- out of bounds write");
    uint8 shift = 8 * (32 - 1 - offset);
    bytes32 res = bytes32(uint256(b) | (uint256(toWrite) << shift));
    return res;
  }

  function writeLEU32(bytes32 b, uint8 offset, uint32 toWrite) private pure returns (bytes32) {
    b = writeU8(b, offset + 0, uint8(toWrite >> 0));
    b = writeU8(b, offset + 1, uint8(toWrite >> 8));
    b = writeU8(b, offset + 2, uint8(toWrite >> 16));
    b = writeU8(b, offset + 3, uint8(toWrite >> 24));
    return b;
  }

  function writeLEU16(bytes32 b, uint8 offset, uint16 toWrite) private pure returns (bytes32) {
    b = writeU8(b, offset + 0, uint8(toWrite >> 0));
    b = writeU8(b, offset + 1, uint8(toWrite >> 8));
    return b;
  }
}
