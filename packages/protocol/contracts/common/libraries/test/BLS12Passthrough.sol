pragma solidity ^0.5.13;

import { B12_377Lib, B12_381Lib, B12 } from "../B12.sol";
import { TypedMemView } from "../TypedMemView.sol";

contract Common {
  using B12 for B12.G1Point;
  using B12 for B12.G2Point;
  using B12 for B12.Fp;
  using B12 for B12.Fp2;
  using B12 for bytes;

  using TypedMemView for bytes;
  using TypedMemView for bytes29;

  event MEMDUMP(uint256 a, uint256 b, uint256 c, uint256 d);

  constructor() public {}

  function fpMulTest(
    uint256 a1,
    uint256 a2,
    uint256 b1,
    uint256 b2
  ) external view returns (uint256, uint256) {
    B12.Fp memory a = B12.Fp(a1, a2);
    B12.Fp memory b = B12.Fp(b1, b2);
    B12.Fp memory res = B12.fpMul(a, b);
    return (res.a, res.b);
  }

  function fpNormalTest(uint256 a1, uint256 a2) external view returns (uint256, uint256) {
    B12.Fp memory a = B12.Fp(a1, a2);
    B12.Fp memory res = B12.fpNormal(a);
    return (res.a, res.b);
  }

  function fpNormal2Test(uint256 a, uint256 idx) external view returns (uint256, uint256) {
    B12.Fp memory res = B12.fpNormal2(B12.Fp(0, a), idx);
    return (res.a, res.b);
  }

  function fp2MulTest(
    uint256[] calldata arr
  ) external view returns (uint256, uint256, uint256, uint256) {
    B12.Fp2 memory x = B12.Fp2(B12.Fp(arr[0], arr[1]), B12.Fp(arr[2], arr[3]));
    B12.Fp2 memory y = B12.Fp2(B12.Fp(arr[4], arr[5]), B12.Fp(arr[6], arr[7]));
    B12.Fp2 memory res = B12.fp2Mul(x, y);
    return (res.a.a, res.a.b, res.b.a, res.b.b);
  }

  function testUncompress() external view returns (uint256, uint256) {
    B12.Fp memory x = B12.Fp(
      0x008848defe740a67c8fc6225bf87ff54,
      0x85951e2caa9d41bb188282c8bd37cb5cd5481512ffcd394eeab9b16eb21be9ef
    );
    B12.Fp memory y1 = B12.Fp(
      0x001cefdc52b4e1eba6d3b6633bf15a76,
      0x5ca326aa36b6c0b5b1db375b6a5124fa540d200dfb56a6e58785e1aaaa63715b
    );
    B12.Fp memory y2 = B12.Fp(
      0x01914a69c5102eff1f674f5d30afeec4,
      0xbd7fb348ca3e52d96d182ad44fb82305c2fe3d3634a9591afd82de55559c8ea6
    );
    B12.G1Point memory res = B12.mapToG1(x, y2, y1, true);
    return (res.Y.a, res.Y.b);
  }

  function testParseG1(bytes calldata arg) external pure returns (uint256[4] memory ret) {
    B12.G1Point memory a = arg.parseG1(0);
    ret[0] = a.X.a;
    ret[1] = a.X.b;
    ret[2] = a.Y.a;
    ret[3] = a.Y.b;
  }

  function testSerializeG1(
    uint256 w,
    uint256 x,
    uint256 y,
    uint256 z
  ) external pure returns (bytes memory) {
    B12.G1Point memory a;
    a.X.a = w;
    a.X.b = x;
    a.Y.a = y;
    a.Y.b = z;

    return a.serializeG1();
  }

  function testParseG2(bytes calldata arg) external pure returns (uint256[8] memory ret) {
    B12.G2Point memory a = arg.parseG2(0);
    ret[0] = a.X.a.a;
    ret[1] = a.X.a.b;
    ret[2] = a.X.b.a;
    ret[3] = a.X.b.b;
    ret[4] = a.Y.a.a;
    ret[5] = a.Y.a.b;
    ret[6] = a.Y.b.a;
    ret[7] = a.Y.b.b;
  }

  function testSerializeG2(
    uint256 xaa,
    uint256 xab,
    uint256 xba,
    uint256 xbb,
    uint256 yaa,
    uint256 yab,
    uint256 yba,
    uint256 ybb
  ) external pure returns (bytes memory) {
    B12.G2Point memory a;
    a.X.a.a = xaa;
    a.X.a.b = xab;
    a.X.b.a = xba;
    a.X.b.b = xbb;
    a.Y.a.a = yaa;
    a.Y.a.b = yab;
    a.Y.b.a = yba;
    a.Y.b.b = ybb;

    return a.serializeG2();
  }

  function testDeserialize(bytes memory h) public pure returns (uint256, uint256, bool) {
    (B12.Fp memory p, bool b) = B12.parsePoint(h);
    return (p.a, p.b, b);
  }

  function dumpMem(uint256 idx) internal {
    uint256 a;
    uint256 b;
    uint256 c;
    uint256 d;

    assembly {
      a := mload(add(idx, 0x00))
      b := mload(add(idx, 0x20))
      c := mload(add(idx, 0x40))
      d := mload(add(idx, 0x60))
    }
    emit MEMDUMP(a, b, c, d);
  }

  function executePrecompile(
    bytes memory input,
    uint8 addr,
    uint256 output_len
  ) internal view returns (bytes memory output) {
    bool success;
    assembly {
      success := staticcall(
        sub(gas, 2000),
        addr,
        add(input, 0x20), // location
        mload(input), // length
        add(output, 0x20), // location
        output_len // length
      )
      mstore(output, output_len)
    }

    require(success, "failed");
  }
}

contract BLS12_381Passthrough is Common {
  using B12_381Lib for B12.G1Point;
  using B12_381Lib for B12.G2Point;
  using B12_381Lib for B12.Fp;
  using B12_381Lib for B12.Fp2;
  using B12 for B12.G1Point;
  using B12 for B12.G2Point;
  using B12 for B12.Fp;
  using B12 for B12.Fp2;
  using B12_381Lib for bytes;
  using B12 for bytes;

  using TypedMemView for bytes;
  using TypedMemView for bytes29;

  constructor() public {}

  function g1Add(bytes calldata args) external view returns (bytes memory) {
    B12.G1Point memory a = args.parseG1(0);
    B12.G1Point memory b = args.parseG1(4 * 32);
    return a.g1Add(b).serializeG1();
  }

  function g1Mul(bytes calldata args) external view returns (bytes memory) {
    B12.G1Point memory a = args.parseG1(0);
    uint256 scalar = args.ref(0).indexUint(4 * 32, 32);
    return a.g1Mul(scalar).serializeG1();
  }

  function g1MultiExp(bytes calldata args) external view returns (bytes memory) {
    bytes29 ref = args.ref(0);

    B12.G1MultiExpArg[] memory input = new B12.G1MultiExpArg[](args.length / 160);

    for (uint256 i = 0; i < args.length / 160; i += 1) {
      uint256 idx = i * 160;

      input[i].point.X.a = ref.indexUint(idx + 0x00, 32);
      input[i].point.X.b = ref.indexUint(idx + 0x20, 32);
      input[i].point.Y.a = ref.indexUint(idx + 0x40, 32);
      input[i].point.Y.b = ref.indexUint(idx + 0x60, 32);
      input[i].scalar = ref.indexUint(idx + 0x80, 32);
    }

    return B12_381Lib.g1MultiExp(input).serializeG1();
  }

  function g2Add(bytes calldata args) external view returns (bytes memory) {
    B12.G2Point memory a = args.parseG2(0);
    B12.G2Point memory b = args.parseG2(8 * 32);
    return a.g2Add(b).serializeG2();
  }

  function g2Mul(bytes calldata args) external view returns (bytes memory) {
    B12.G2Point memory a = args.parseG2(0);
    uint256 scalar = args.ref(0).indexUint(8 * 32, 32);
    a.g2Mul(scalar);
    return a.serializeG2();
  }

  function g2MultiExp(bytes calldata args) external view returns (bytes memory) {
    bytes29 ref = args.ref(0);

    B12.G2MultiExpArg[] memory input = new B12.G2MultiExpArg[](args.length / 288);

    for (uint256 i = 0; i < args.length / 288; i += 1) {
      uint256 idx = i * 288;

      input[i].point.X.a.a = ref.indexUint(idx + 0x00, 32);
      input[i].point.X.a.b = ref.indexUint(idx + 0x20, 32);
      input[i].point.X.b.a = ref.indexUint(idx + 0x40, 32);
      input[i].point.X.b.b = ref.indexUint(idx + 0x60, 32);
      input[i].point.Y.a.a = ref.indexUint(idx + 0x80, 32);
      input[i].point.Y.a.b = ref.indexUint(idx + 0xa0, 32);
      input[i].point.Y.b.a = ref.indexUint(idx + 0xc0, 32);
      input[i].point.Y.b.b = ref.indexUint(idx + 0xe0, 32);
      input[i].scalar = ref.indexUint(idx + 0x100, 32);
    }

    return B12_381Lib.g2MultiExp(input).serializeG2();
  }
}

contract BLS12_377Passthrough is Common {
  using B12_377Lib for B12.G1Point;
  using B12_377Lib for B12.G2Point;
  using B12_377Lib for B12.Fp;
  using B12_377Lib for B12.Fp2;
  using B12 for B12.G1Point;
  using B12 for B12.G2Point;
  using B12 for B12.Fp;
  using B12 for B12.Fp2;
  using B12_377Lib for bytes;
  using B12 for bytes;

  using TypedMemView for bytes;
  using TypedMemView for bytes29;

  constructor() public {}

  function g1Add(bytes calldata args) external view returns (bytes memory) {
    B12.G1Point memory a = args.parseG1(0);
    B12.G1Point memory b = args.parseG1(4 * 32);
    return a.g1Add(b).serializeG1();
  }

  function g1Mul(bytes calldata args) external view returns (bytes memory) {
    B12.G1Point memory a = args.parseG1(0);
    uint256 scalar = args.ref(0).indexUint(4 * 32, 32);
    return a.g1Mul(scalar).serializeG1();
  }

  function g1MultiExp(bytes calldata args) external view returns (bytes memory) {
    bytes29 ref = args.ref(0);

    B12.G1MultiExpArg[] memory input = new B12.G1MultiExpArg[](args.length / 160);

    for (uint256 i = 0; i < args.length / 160; i += 1) {
      uint256 idx = i * 160;

      input[i].point.X.a = ref.indexUint(idx + 0x00, 32);
      input[i].point.X.b = ref.indexUint(idx + 0x20, 32);
      input[i].point.Y.a = ref.indexUint(idx + 0x40, 32);
      input[i].point.Y.b = ref.indexUint(idx + 0x60, 32);
      input[i].scalar = ref.indexUint(idx + 0x80, 32);
    }

    return B12_377Lib.g1MultiExp(input).serializeG1();
  }

  function g2Add(bytes calldata args) external view returns (bytes memory) {
    B12.G2Point memory a = args.parseG2(0);
    B12.G2Point memory b = args.parseG2(8 * 32);
    return a.g2Add(b).serializeG2();
  }

  function g2Mul(bytes calldata args) external view returns (bytes memory) {
    B12.G2Point memory a = args.parseG2(0);
    uint256 scalar = args.ref(0).indexUint(8 * 32, 32);
    a.g2Mul(scalar);
    return a.serializeG2();
  }

  function g2MultiExp(bytes calldata args) external view returns (bytes memory) {
    bytes29 ref = args.ref(0);

    B12.G2MultiExpArg[] memory input = new B12.G2MultiExpArg[](args.length / 288);

    for (uint256 i = 0; i < args.length / 288; i += 1) {
      uint256 idx = i * 288;

      input[i].point.X.a.a = ref.indexUint(idx + 0x00, 32);
      input[i].point.X.a.b = ref.indexUint(idx + 0x20, 32);
      input[i].point.X.b.a = ref.indexUint(idx + 0x40, 32);
      input[i].point.X.b.b = ref.indexUint(idx + 0x60, 32);
      input[i].point.Y.a.a = ref.indexUint(idx + 0x80, 32);
      input[i].point.Y.a.b = ref.indexUint(idx + 0xa0, 32);
      input[i].point.Y.b.a = ref.indexUint(idx + 0xc0, 32);
      input[i].point.Y.b.b = ref.indexUint(idx + 0xe0, 32);
      input[i].scalar = ref.indexUint(idx + 0x100, 32);
    }

    return B12_377Lib.g2MultiExp(input).serializeG2();
  }
}
