//SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity >=0.5.8;

import { TypedMemView } from "@summa-tx/memview.sol/contracts/TypedMemView.sol";

import { CIP20Lib } from "@celo/bls-sol/contracts/CIP20Lib.sol";
import { CeloB12_377Lib } from "@celo/bls-sol/contracts/B12.sol";
import { B12 } from "@celo/bls-sol/contracts/B12.sol";
import "../common/interfaces/ICeloVersionedContract.sol";

import "./SlasherUtil.sol";

contract SnarkEpochDataSlasher is ICeloVersionedContract, SlasherUtil {
  using TypedMemView for bytes;
  using TypedMemView for bytes29;

  // For each signer address, check if a block header has already been slashed
  mapping(address => mapping(bytes32 => bool)) isSlashed;

  event SnarkEpochDataSlashPerformed(address indexed validator, uint256 indexed blockNumber);

  /**
   * @notice Returns the storage, major, minor, and patch version of the contract.
   * @return The storage, major, minor, and patch version of the contract.
   */
  function getVersionNumber() external pure returns (uint256, uint256, uint256, uint256) {
    return (1, 1, 1, 0);
  }

  function reverse(uint8 a) internal pure returns (uint8) {
    uint8 res = 0;
    for (uint8 i = 0; i < 8; i++) {
      res = res | ((a & 1) << (7 - i));
      a = a >> 1;
    }
    return res;
  }

  function epochFromExtraData(bytes memory extra) internal pure returns (uint16) {
    uint8 b1 = uint8(extra[extra.length - 1]);
    uint8 b2 = uint8(extra[extra.length - 2]);
    return uint16(reverse(b2)) * 256 + uint16(reverse(b1));
  }

  function checkIfAlreadySlashed(address signer, bytes memory header) internal {
    bytes32 bhash = keccak256(header);
    require(!isSlashed[signer][bhash], "Already slashed");
    isSlashed[signer][bhash] = true;
  }

  struct DataArg {
    bytes extra;
    bytes bhhash;
    uint256 bitmap;
    bytes sig;
    bytes hint;
  }

  struct SlashArg {
    uint256 groupMembershipHistoryIndex;
    address[] validatorElectionLessers;
    address[] validatorElectionGreaters;
    uint256[] validatorElectionIndices;
    address[] groupElectionLessers;
    address[] groupElectionGreaters;
    uint256[] groupElectionIndices;
  }

  function decodeDataArg(bytes memory a) internal view returns (DataArg memory) {}

  function decodeSlashArg(bytes memory a) internal view returns (SlashArg memory) {}

  function slash(
    address signer,
    uint256 index,
    bytes memory arg1,
    bytes memory arg2,
    bytes memory arg
  ) public {
    slash0(signer, index, decodeDataArg(arg1), decodeDataArg(arg2), decodeSlashArg(arg));
  }

  function slash0(
    address signer,
    uint256 index,
    DataArg memory arg1,
    DataArg memory arg2,
    SlashArg memory arg
  ) internal {
    checkIfAlreadySlashed(signer, abi.encodePacked(arg1.extra, arg1.bhhash));
    checkIfAlreadySlashed(signer, abi.encodePacked(arg2.extra, arg2.bhhash));
    uint256 blockNumber = checkSlash0(arg1, arg2);
    address validator = getAccounts().signerToAccount(signer);
    performSlashing(
      validator,
      msg.sender,
      blockNumber,
      arg.groupMembershipHistoryIndex,
      arg.validatorElectionLessers,
      arg.validatorElectionGreaters,
      arg.validatorElectionIndices,
      arg.groupElectionLessers,
      arg.groupElectionGreaters,
      arg.groupElectionIndices
    );
    emit SnarkEpochDataSlashPerformed(validator, blockNumber);
  }

  function checkSlash0(DataArg memory arg1, DataArg memory arg2) internal view returns (uint256) {
    uint16 epoch1 = epochFromExtraData(arg1.extra);
    uint16 epoch2 = epochFromExtraData(arg2.extra);
    require(epoch1 == epoch2, "Not on same epoch");
    checkSlash1(epoch1, arg1);
    checkSlash1(epoch1, arg2);
  }

  function checkSlash1(uint16 epoch, DataArg memory arg) internal view returns (uint256) {
    bytes memory data = abi.encodePacked(arg.extra, arg.bhhash);
    require(isValid(epoch, data, arg.bitmap, arg.sig, arg.hint));
  }

  function negativeP2() internal pure returns (B12.G2Point memory) {
    B12.Fp2 memory x = B12.Fp2(
      B12.Fp(
        0x018480be71c785fec89630a2a3841d01,
        0xc565f071203e50317ea501f557db6b9b71889f52bb53540274e3e48f7c005196
      ),
      B12.Fp(
        0x00ea6040e700403170dc5a51b1b140d5,
        0x532777ee6651cecbe7223ece0799c9de5cf89984bff76fe6b26bfefa6ea16afe
      )
    );
    B12.Fp2 memory y = B12.Fp2(
      B12.Fp(
        0x01452cdfba80a16eecda9254a0ee5986,
        0x3c1eec808c4079363a9a9facc1d675fb243bd4bbc27383d19474b6bbf602b222
      ),
      B12.Fp(
        0x00b623a64541bbd227e6681d5786d890,
        0xb833c846c39bf79dfa8fb214eb26433dd491a504d1add8f4ab66f22e7a14706e
      )
    );
    return B12.G2Point(x, y);
  }

  function mapToG1Scaled(B12.Fp memory x, B12.Fp memory hint1, B12.Fp memory hint2, bool greatest)
    internal
    view
    returns (B12.G1Point memory)
  {
    B12.G1Point memory p = B12.mapToG1(x, hint1, hint2, !greatest);
    B12.G1Point memory q = CeloB12_377Lib.g1Mul(p, 30631250834960419227450344600217059328);
    // TODO: check that q != 0
    return q;
  }

  function getBLSPublicKey(uint16 epoch, uint256 i) internal view returns (B12.G2Point memory) {
    bytes memory data = validatorBLSPublicKeyFromSet(i, epoch);
    return B12.readG2(data, 0);
  }

  function doHash(bytes memory data) internal view returns (bytes memory) {
    bytes32 config1 = CIP20Lib.createConfig(
      32, /* digest size */
      0,
      0,
      0,
      32, /* leaf length */
      0, /* node offset */
      64, /* xof digest length*/
      0,
      32, /* inner length */
      bytes8(0),
      "ULforxof"
    );
    bytes32 config2 = CIP20Lib.createConfig(
      32, /* digest size */
      0,
      0,
      0,
      32, /* leaf length */
      1,
      64, /* xof digest length*/
      0,
      32, /* inner length */
      bytes8(0),
      "ULforxof"
    );
    return
      abi.encodePacked(
        CIP20Lib.blake2sWithConfig(config1, "", data),
        CIP20Lib.blake2sWithConfig(config2, "", data)
      );
  }

  function parseToG1(bytes memory h, bytes memory hints, uint256 idx)
    internal
    view
    returns (B12.G1Point memory)
  {
    bool greatest;
    B12.Fp memory x;
    (x, greatest) = B12.parsePoint(h);
    return B12.mapToG1(x, B12.parseFp(hints, 0 + idx), B12.parseFp(hints, 64 + idx), greatest);
  }

  function parseToG1Scaled(bytes memory h, bytes memory hints)
    internal
    view
    returns (B12.G1Point memory)
  {
    bool greatest;
    B12.Fp memory x;
    (x, greatest) = B12.parseRandomPoint(h);
    return mapToG1Scaled(x, B12.parseFp(hints, 0), B12.parseFp(hints, 64), greatest);
  }

  function isValid(
    uint16 epoch,
    bytes memory data,
    uint256 bitmap,
    bytes memory sig,
    bytes memory hints
  ) internal view returns (bool) {
    B12.G1Point memory p = parseToG1Scaled(doHash(data), hints);
    bool prev = false;
    B12.G2Point memory agg = B12.G2Point(
      B12.Fp2(B12.Fp(0, 0), B12.Fp(0, 0)),
      B12.Fp2(B12.Fp(0, 0), B12.Fp(0, 0))
    );
    uint256 num = 0;
    for (uint256 i = 0; i < 150; i++) {
      if (bitmap & 1 == 1) {
        num++;
        B12.G2Point memory public_key = getBLSPublicKey(epoch, i);
        if (!prev) {
          agg = public_key;
        } else {
          agg = CeloB12_377Lib.g2Add(agg, public_key);
        }
      }
      bitmap = bitmap >> 1;
    }
    // TODO: check that there were enough signatures
    B12.G1Point memory sig_point = B12.parseG1(sig, 0);
    B12.PairingArg[] memory args = new B12.PairingArg[](2);
    args[0] = B12.PairingArg(sig_point, negativeP2());
    args[1] = B12.PairingArg(p, agg);
    return CeloB12_377Lib.pairing(args);
  }

}
