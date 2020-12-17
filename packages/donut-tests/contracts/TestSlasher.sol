//SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity >=0.5.10;

import {
  SnarkEpochDataSlasher
} from "@celo/protocol/contracts/governance/SnarkEpochDataSlasher.sol";

import { CeloB12_377Lib } from "@celo/protocol/contracts/common/libraries/B12.sol";
import { B12 } from "@celo/protocol/contracts/common/libraries/B12.sol";
import { CIP20Lib } from "@celo/protocol/contracts/common/libraries/CIP20Lib.sol";
import { TypedMemView } from "@summa-tx/memview.sol/contracts/TypedMemView.sol";

contract TestSlasher is SnarkEpochDataSlasher {
  constructor() public {}

  function getEpochFromData(bytes memory data) public pure returns (uint256) {
    return epochFromExtraData(decodeDataArg(data).extra);
  }

  function testConfig() public pure returns (bytes32) {
    return
      CIP20Lib.createConfig(
        32, /* digest size */
        0,
        0,
        0,
        32, /* leaf length */
        0,
        64, /* xof digest length*/
        0,
        32, /* inner length */
        bytes8(0),
        "ULforxof"
      );
  }

  function testHash(bytes memory data) public view returns (bytes memory) {
    return doHash(data);
  }

  function testBLSPublicKey(uint16 epoch, uint256 i)
    public
    view
    returns (uint256, uint256, uint256, uint256, uint256, uint256, uint256, uint256)
  {
    B12.G2Point memory p = getBLSPublicKey(epoch, i);
    return (p.X.a.a, p.X.a.b, p.X.b.a, p.X.b.b, p.Y.a.a, p.Y.a.b, p.Y.b.a, p.Y.b.b);
  }

  function testParseG1(bytes memory data) public pure returns (uint256, uint256, uint256, uint256) {
    B12.G1Point memory p = B12.parseG1(data, 0);
    return (p.X.a, p.X.b, p.Y.a, p.Y.b);
  }

  function testHashing(bytes memory extra, bytes memory message)
    public
    view
    returns (uint16, bytes memory, bytes memory)
  {
    return (
      epochFromExtraData(extra),
      doHash(abi.encodePacked(extra, message)),
      abi.encodePacked(extra, message)
    );
  }

  function testAggregation(bytes memory sig0, bytes memory sig1, bytes memory sig2)
    public
    view
    returns (uint256, uint256, uint256, uint256)
  {
    B12.G1Point memory sig0_point = B12.parseG1(sig0, 0);
    B12.G1Point memory sig1_point = B12.parseG1(sig1, 0);
    B12.G1Point memory sig2_point = B12.parseG1(sig2, 0);
    B12.G1Point memory res = CeloB12_377Lib.g1Add(
      CeloB12_377Lib.g1Add(sig0_point, sig1_point),
      sig2_point
    );
    return (res.X.a, res.X.b, res.Y.a, res.Y.b);
  }

  function testKeyAggregation(bytes memory sig0, bytes memory sig1, bytes memory sig2)
    public
    view
    returns (uint256, uint256, uint256, uint256, uint256, uint256, uint256, uint256)
  {
    B12.G2Point memory p0 = B12.readG2(sig0, 0);
    B12.G2Point memory p1 = B12.readG2(sig1, 0);
    B12.G2Point memory p2 = B12.readG2(sig2, 0);
    B12.G2Point memory p = CeloB12_377Lib.g2Add(p0, CeloB12_377Lib.g2Add(p1, p2));
    return (p.X.a.a, p.X.a.b, p.X.b.a, p.X.b.b, p.Y.a.a, p.Y.a.b, p.Y.b.a, p.Y.b.b);
  }

  function testParseToG1Scaled(bytes memory extra, bytes memory message, bytes memory hints)
    public
    view
    returns (uint256, uint256, uint256, uint256)
  {
    B12.G1Point memory p = parseToG1Scaled(doHash(abi.encodePacked(extra, message)), hints);
    return (p.X.a, p.X.b, p.Y.a, p.Y.b);
  }

  function testParseToRandom(bytes memory extra, bytes memory message)
    public
    view
    returns (uint256, uint256, bool)
  {
    bool greatest;
    B12.Fp memory x;
    (x, greatest) = B12.parseRandomPoint(doHash(abi.encodePacked(extra, message)));
    return (x.a, x.b, greatest);
  }

  function testValid(bytes memory extra, bytes memory message, bytes memory sig, bytes memory hints)
    public
    view
    returns (bool)
  {
    B12.G1Point memory p = parseToG1Scaled(doHash(abi.encodePacked(extra, message)), hints);
    B12.G2Point memory public_key = getBLSPublicKey(100, 0);
    B12.G1Point memory sig_point = B12.parseG1(sig, 0);
    B12.PairingArg[] memory args = new B12.PairingArg[](2);
    args[0] = B12.PairingArg(sig_point, negativeP2());
    args[1] = B12.PairingArg(p, public_key);
    return CeloB12_377Lib.pairing(args);
  }

  function testDecode(bytes memory data)
    public
    pure
    returns (bytes memory, bytes memory, uint256, bytes memory, bytes memory)
  {
    DataArg memory arg = decodeDataArg(data);
    return (arg.extra, arg.bhhash, arg.bitmap, arg.sig, arg.hint);
  }

  function testSlash(bytes memory arg_data) public view returns (bool) {
    DataArg memory arg = decodeDataArg(arg_data);
    bytes memory data = abi.encodePacked(arg.extra, arg.bhhash);
    uint16 epoch = epochFromExtraData(arg.extra);
    return isValid(epoch, data, arg.bitmap, arg.sig, arg.hint);
  }

}
