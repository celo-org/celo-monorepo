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

  function extract(bytes memory a, uint256 offset, uint256 len)
    internal
    pure
    returns (bytes memory)
  {
    bytes memory res = new bytes(len);
    for (uint256 i = 0; i < len; i++) {
      res[i] = a[i + offset];
    }
    return res;
  }

  struct DataArg {
    bytes extra;
    bytes bhhash;
    uint256 bitmap;
    bytes sig;
    bytes hint;
  }

  function decodeDataArg(bytes memory a) internal pure returns (DataArg memory) {
    return
      DataArg(
        extract(a, 0, 8),
        extract(a, 8, 8 + 48),
        getUint256FromBytes(a, 56),
        extract(a, 88, 88 + 128),
        extract(a, 216, 216 + 128)
      );
  }

  function slash(
    address signer,
    uint256 index,
    bytes memory arg1,
    bytes memory arg2,
    uint256 groupMembershipHistoryIndex,
    address[] memory validatorElectionLessers,
    address[] memory validatorElectionGreaters,
    uint256[] memory validatorElectionIndices,
    address[] memory groupElectionLessers,
    address[] memory groupElectionGreaters,
    uint256[] memory groupElectionIndices
  ) public {
    slash0(
      signer,
      index,
      decodeDataArg(arg1),
      decodeDataArg(arg2),
      groupMembershipHistoryIndex,
      validatorElectionLessers,
      validatorElectionGreaters,
      validatorElectionIndices,
      groupElectionLessers,
      groupElectionGreaters,
      groupElectionIndices
    );
  }

  function checkSigner(address signer, uint256 index, uint256 blockNumber) internal view {
    require(index < numberValidatorsInSet(blockNumber), "Bad validator index");
    require(
      signer == validatorSignerAddressFromSet(index, blockNumber),
      "Wasn't a signer with given index"
    );
  }

  function checkBitmap(uint256 idx, uint256 bitmap) internal pure {
    require((1 << idx) & bitmap != 0, "Signer not in bitmap");
  }

  function slash0(
    address signer,
    uint256 index,
    DataArg memory arg1,
    DataArg memory arg2,
    uint256 groupMembershipHistoryIndex,
    address[] memory validatorElectionLessers,
    address[] memory validatorElectionGreaters,
    uint256[] memory validatorElectionIndices,
    address[] memory groupElectionLessers,
    address[] memory groupElectionGreaters,
    uint256[] memory groupElectionIndices
  ) internal {
    checkIfAlreadySlashed(signer, abi.encodePacked(arg1.extra, arg1.bhhash));
    checkIfAlreadySlashed(signer, abi.encodePacked(arg2.extra, arg2.bhhash));
    checkBitmap(index, arg1.bitmap);
    checkBitmap(index, arg2.bitmap);
    uint256 blockNumber = checkSlash0(arg1, arg2);
    checkSigner(signer, index, blockNumber);
    address validator = getAccounts().signerToAccount(signer);
    performSlashing(
      validator,
      msg.sender,
      blockNumber,
      groupMembershipHistoryIndex,
      validatorElectionLessers,
      validatorElectionGreaters,
      validatorElectionIndices,
      groupElectionLessers,
      groupElectionGreaters,
      groupElectionIndices
    );
    emit SnarkEpochDataSlashPerformed(validator, blockNumber);
  }

  function checkSlash0(DataArg memory arg1, DataArg memory arg2) internal view returns (uint256) {
    uint16 epoch1 = epochFromExtraData(arg1.extra);
    uint16 epoch2 = epochFromExtraData(arg2.extra);
    require(epoch1 == epoch2, "Not on same epoch");
    checkSlash1(epoch1, arg1);
    checkSlash1(epoch1, arg2);
    return getEpochLastBlock(epoch1 - 1); // check which epoch is in the data
  }

  function checkSlash1(uint16 epoch, DataArg memory arg) internal view {
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
    // The point iat infinity is represented as (0,0)
    require(!(q.X.a == 0 && q.X.b == 0 && q.Y.a == 0 && q.Y.b == 0), "Point q cannot be zero");
    return q;
  }

  function getBLSPublicKey(uint256 blockNumber, uint256 i)
    internal
    view
    returns (B12.G2Point memory)
  {
    bytes memory data = validatorBLSPublicKeyFromSet(i, blockNumber);
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
    uint256 blockNumber = getEpochLastBlock(epoch - 1);
    uint256 num = 0;
    for (uint256 i = 0; i < 150; i++) {
      if (bitmap & 1 == 1) {
        num++;
        B12.G2Point memory public_key = getBLSPublicKey(blockNumber, i);
        if (!prev) {
          agg = public_key;
        } else {
          agg = CeloB12_377Lib.g2Add(agg, public_key);
        }
      }
      bitmap = bitmap >> 1;
    }
    require(num >= minQuorumSize(blockNumber), "not enough signature");
    B12.G1Point memory sig_point = B12.parseG1(sig, 0);
    B12.PairingArg[] memory args = new B12.PairingArg[](2);
    args[0] = B12.PairingArg(sig_point, negativeP2());
    args[1] = B12.PairingArg(p, agg);
    return CeloB12_377Lib.pairing(args);
  }

}
