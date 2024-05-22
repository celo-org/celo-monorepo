pragma solidity >=0.5.13 <0.8.20;

/// XXX: Adding this library here instead of importing as a submodule, because of a version incompatibility,
/// causing foundry to not build the contract when testing contracts with versions < 0.8.17.
/// copied from https://github.com/0xcyphered/secp256k1-solidity/blob/main/contracts/SECP256K1.sol

interface ISECP256K1 {
  function recover(
    uint256 digest,
    uint8 v,
    uint256 r,
    uint256 s
  ) external pure returns (uint256, uint256);
}

/**
 * @title SECPK256K1 public key recovery Library
 * @dev Library providing arithmetic operations over signed `secpk256k1` signed message due to recover the signer public key EC point in `Solidity`.
 * @author cyphered.eth
 */
library SECP256K1 {
  // Elliptic curve Constants
  uint256 private constant U255_MAX_PLUS_1 =
    57896044618658097711785492504343953926634992332820282019728792003956564819968;

  // Curve Constants
  uint256 private constant A = 0;
  uint256 private constant B = 7;
  uint256 private constant GX = 0x79BE667EF9DCBBAC55A06295CE870B07029BFCDB2DCE28D959F2815B16F81798;
  uint256 private constant GY = 0x483ADA7726A3C4655DA4FBFC0E1108A8FD17B448A68554199C47D08FFB10D4B8;
  uint256 private constant P = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2F;
  uint256 private constant N = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141;

  /// @dev recovers signer public key point value.
  /// @param digest hashed message
  /// @param v recovery
  /// @param r first 32 bytes of signature
  /// @param v last 32 bytes of signature
  /// @return (x, y) EC point
  function recover(
    uint256 digest,
    uint8 v,
    uint256 r,
    uint256 s
  ) public pure returns (uint256, uint256) {
    uint256 x = addmod(r, P * (v >> 1), P);
    if (x > P || s > N || r > N || s == 0 || r == 0 || v > 1) {
      return (0, 0);
    }
    uint256 rInv = invMod(r, N);

    uint256 y2 = addmod(mulmod(x, mulmod(x, x, P), P), addmod(mulmod(x, A, P), B, P), P);
    y2 = expMod(y2, (P + 1) / 4);
    uint256 y = ((y2 + v + 2) & 1 == 0) ? y2 : P - y2;

    (uint256 qx, uint256 qy, uint256 qz) = jacMul(mulmod(rInv, N - digest, N), GX, GY, 1);
    (uint256 qx2, uint256 qy2, uint256 qz2) = jacMul(mulmod(rInv, s, N), x, y, 1);
    (uint256 qx3, uint256 qy3) = ecAdd(qx, qy, qz, qx2, qy2, qz2);

    return (qx3, qy3);
  }

  /// @dev Modular exponentiation, b^e % P.
  /// Source: https://github.com/witnet/elliptic-curve-solidity/blob/master/contracts/EllipticCurve.sol
  /// Source: https://github.com/androlo/standard-contracts/blob/master/contracts/src/crypto/ECCMath.sol
  /// @param _base base
  /// @param _exp exponent
  /// @return r such that r = b**e (mod P)
  function expMod(uint256 _base, uint256 _exp) internal pure returns (uint256) {
    if (_base == 0) return 0;
    if (_exp == 0) return 1;

    uint256 r = 1;
    uint256 bit = U255_MAX_PLUS_1;
    assembly {
      for {

      } gt(bit, 0) {

      } {
        r := mulmod(mulmod(r, r, P), exp(_base, iszero(iszero(and(_exp, bit)))), P)
        r := mulmod(mulmod(r, r, P), exp(_base, iszero(iszero(and(_exp, div(bit, 2))))), P)
        r := mulmod(mulmod(r, r, P), exp(_base, iszero(iszero(and(_exp, div(bit, 4))))), P)
        r := mulmod(mulmod(r, r, P), exp(_base, iszero(iszero(and(_exp, div(bit, 8))))), P)
        bit := div(bit, 16)
      }
    }

    return r;
  }

  /// @dev Adds two points (x1, y1, z1) and (x2 y2, z2).
  /// Source: https://github.com/witnet/elliptic-curve-solidity/blob/master/contracts/EllipticCurve.sol
  /// @param _x1 coordinate x of P1
  /// @param _y1 coordinate y of P1
  /// @param _z1 coordinate z of P1
  /// @param _x2 coordinate x of square
  /// @param _y2 coordinate y of square
  /// @param _z2 coordinate z of square
  /// @return (qx, qy, qz) P1+square in Jacobian
  function jacAdd(
    uint256 _x1,
    uint256 _y1,
    uint256 _z1,
    uint256 _x2,
    uint256 _y2,
    uint256 _z2
  ) internal pure returns (uint256, uint256, uint256) {
    if (_x1 == 0 && _y1 == 0) return (_x2, _y2, _z2);
    if (_x2 == 0 && _y2 == 0) return (_x1, _y1, _z1);

    // We follow the equations described in https://pdfs.semanticscholar.org/5c64/29952e08025a9649c2b0ba32518e9a7fb5c2.pdf Section 5
    uint256[4] memory zs; // z1^2, z1^3, z2^2, z2^3
    zs[0] = mulmod(_z1, _z1, P);
    zs[1] = mulmod(_z1, zs[0], P);
    zs[2] = mulmod(_z2, _z2, P);
    zs[3] = mulmod(_z2, zs[2], P);

    // u1, s1, u2, s2
    zs = [
      mulmod(_x1, zs[2], P),
      mulmod(_y1, zs[3], P),
      mulmod(_x2, zs[0], P),
      mulmod(_y2, zs[1], P)
    ];

    // In case of zs[0] == zs[2] && zs[1] == zs[3], double function should be used
    require(zs[0] != zs[2] || zs[1] != zs[3], "Use jacDouble function instead");

    uint256[4] memory hr;
    //h
    hr[0] = addmod(zs[2], P - zs[0], P);
    //r
    hr[1] = addmod(zs[3], P - zs[1], P);
    //h^2
    hr[2] = mulmod(hr[0], hr[0], P);
    // h^3
    hr[3] = mulmod(hr[2], hr[0], P);
    // qx = -h^3  -2u1h^2+r^2
    uint256 qx = addmod(mulmod(hr[1], hr[1], P), P - hr[3], P);
    qx = addmod(qx, P - mulmod(2, mulmod(zs[0], hr[2], P), P), P);
    // qy = -s1*z1*h^3+r(u1*h^2 -x^3)
    uint256 qy = mulmod(hr[1], addmod(mulmod(zs[0], hr[2], P), P - qx, P), P);
    qy = addmod(qy, P - mulmod(zs[1], hr[3], P), P);
    // qz = h*z1*z2
    uint256 qz = mulmod(hr[0], mulmod(_z1, _z2, P), P);
    return (qx, qy, qz);
  }

  /// @dev Multiply point (x, y, z) times d.
  /// Source: https://github.com/witnet/elliptic-curve-solidity/blob/master/contracts/EllipticCurve.sol
  /// @param _d scalar to multiply
  /// @param _x coordinate x of P1
  /// @param _y coordinate y of P1
  /// @param _z coordinate z of P1
  /// @return (qx, qy, qz) d*P1 in Jacobian
  function jacMul(
    uint256 _d,
    uint256 _x,
    uint256 _y,
    uint256 _z
  ) internal pure returns (uint256, uint256, uint256) {
    // Early return in case that `_d == 0`
    if (_d == 0) {
      return (_x, _y, _z);
    }

    uint256 remaining = _d;
    uint256 qx = 0;
    uint256 qy = 0;
    uint256 qz = 1;

    // Double and add algorithm
    while (remaining != 0) {
      if ((remaining & 1) != 0) {
        (qx, qy, qz) = jacAdd(qx, qy, qz, _x, _y, _z);
      }
      remaining = remaining / 2;
      (_x, _y, _z) = jacDouble(_x, _y, _z);
    }
    return (qx, qy, qz);
  }

  /// @dev Doubles a points (x, y, z).
  /// Source: https://github.com/witnet/elliptic-curve-solidity/blob/master/contracts/EllipticCurve.sol
  /// @param _x coordinate x of P1
  /// @param _y coordinate y of P1
  /// @param _z coordinate z of P1
  /// @return (qx, qy, qz) 2P in Jacobian
  function jacDouble(
    uint256 _x,
    uint256 _y,
    uint256 _z
  ) internal pure returns (uint256, uint256, uint256) {
    if (_z == 0) return (_x, _y, _z);

    // We follow the equations described in https://pdfs.semanticscholar.org/5c64/29952e08025a9649c2b0ba32518e9a7fb5c2.pdf Section 5
    // Note: there is a bug in the paper regarding the m parameter, M=3*(x1^2)+a*(z1^4)
    // x, y, z at this point represent the squares of _x, _y, _z
    uint256 x = mulmod(_x, _x, P); //x1^2
    uint256 y = mulmod(_y, _y, P); //y1^2
    uint256 z = mulmod(_z, _z, P); //z1^2

    // s
    uint256 s = mulmod(4, mulmod(_x, y, P), P);
    // m
    uint256 m = addmod(mulmod(3, x, P), mulmod(A, mulmod(z, z, P), P), P);

    // x, y, z at this point will be reassigned and rather represent qx, qy, qz from the paper
    // This allows to reduce the gas cost and stack footprint of the algorithm
    // qx
    x = addmod(mulmod(m, m, P), P - addmod(s, s, P), P);
    // qy = -8*y1^4 + M(S-T)
    y = addmod(mulmod(m, addmod(s, P - x, P), P), P - mulmod(8, mulmod(y, y, P), P), P);
    // qz = 2*y1*z1
    z = mulmod(2, mulmod(_y, _z, P), P);

    return (x, y, z);
  }

  /// @dev Add two points (x1, y1) and (x2, y2) in affine coordinates.
  /// Source: https://github.com/witnet/elliptic-curve-solidity/blob/master/contracts/EllipticCurve.sol
  /// @param _x1 coordinate x of P1
  /// @param _y1 coordinate y of P1
  /// @param _x2 coordinate x of P2
  /// @param _y2 coordinate y of P2
  /// @return (qx, qy) = P1+P2 in affine coordinates
  function ecAdd(
    uint256 _x1,
    uint256 _y1,
    uint256 _z1,
    uint256 _x2,
    uint256 _y2,
    uint256 _z2
  ) internal pure returns (uint256, uint256) {
    uint256 x = 0;
    uint256 y = 0;
    uint256 z = 0;

    // Double if x1==x2 else add
    if (_x1 == _x2) {
      // y1 = -y2 mod p
      if (addmod(_y1, _y2, P) == 0) {
        return (0, 0);
      } else {
        // P1 = P2
        (x, y, z) = jacDouble(_x1, _y1, _z1);
      }
    } else {
      (x, y, z) = jacAdd(_x1, _y1, _z1, _x2, _y2, _z2);
    }
    // Get back to affine
    return toAffine(x, y, z);
  }

  /// @dev Converts a point (x, y, z) expressed in Jacobian coordinates to affine coordinates (x', y', 1).
  /// Source: https://github.com/witnet/elliptic-curve-solidity/blob/master/contracts/EllipticCurve.sol
  /// @param _x coordinate x
  /// @param _y coordinate y
  /// @param _z coordinate z
  /// @return (x', y') affine coordinates
  function toAffine(uint256 _x, uint256 _y, uint256 _z) internal pure returns (uint256, uint256) {
    uint256 zInv = invMod(_z, P);
    uint256 zInv2 = mulmod(zInv, zInv, P);
    uint256 x2 = mulmod(_x, zInv2, P);
    uint256 y2 = mulmod(_y, mulmod(zInv, zInv2, P), P);

    return (x2, y2);
  }

  /// @dev Modular euclidean inverse of a number (mod p).
  /// Source: https://github.com/witnet/elliptic-curve-solidity/blob/master/contracts/EllipticCurve.sol
  /// @param _x The number
  /// @param _pp The modulus
  /// @return q such that x*q = 1 (mod _pp)
  function invMod(uint256 _x, uint256 _pp) internal pure returns (uint256) {
    require(_x != 0 && _x != _pp && _pp != 0, "Invalid number");
    uint256 q = 0;
    uint256 newT = 1;
    uint256 r = _pp;
    uint256 t;
    while (_x != 0) {
      t = r / _x;
      (q, newT) = (newT, addmod(q, (_pp - mulmod(t, newT, _pp)), _pp));
      (r, _x) = (_x, r - t * _x);
    }

    return q;
  }
}
