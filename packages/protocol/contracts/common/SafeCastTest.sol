pragma solidity ^0.5.0;
// TODO: Remove this and use upstream when
// https://github.com/OpenZeppelin/openzeppelin-contracts/pull/1926/files gets merged

import "./SafeCast.sol";

contract SafeCastTest {
  using SafeCast for uint256;

  function toUint128(uint256 a) public pure returns (uint128) {
    return a.toUint128();
  }

  function toUint64(uint256 a) public pure returns (uint64) {
    return a.toUint64();
  }

  function toUint32(uint256 a) public pure returns (uint32) {
    return a.toUint32();
  }

  function toUint16(uint256 a) public pure returns (uint16) {
    return a.toUint16();
  }

  function toUint8(uint256 a) public pure returns (uint8) {
    return a.toUint8();
  }
}
