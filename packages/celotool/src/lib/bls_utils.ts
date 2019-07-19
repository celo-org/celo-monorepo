const keccak256 = require('keccak256')
const ecurve = require('ecurve')
const BigInteger = require('bigi')
const reverse = require('buffer-reverse')

const Curve = ecurve.Curve
const Point = ecurve.Point

const p = BigInteger.fromHex(
  '01ae3a4617c510eac63b05c06ca1493b1a22d9f300f5138f1ef3622fba094800170b5d44300000008508c00000000001'
)
const a = new BigInteger('0')
const b = new BigInteger('1')
const Gx = BigInteger.fromHex(
  '8848defe740a67c8fc6225bf87ff5485951e2caa9d41bb188282c8bd37cb5cd5481512ffcd394eeab9b16eb21be9ef'
)
const Gy = BigInteger.fromHex(
  '01914a69c5102eff1f674f5d30afeec4bd7fb348ca3e52d96d182ad44fb82305c2fe3d3634a9591afd82de55559c8ea6'
)
const n = BigInteger.fromHex('12ab655e9a2ca55660b44d1e5c37b00159aa76fed00000010a11800000000001', 16)
const h = new BigInteger('30631250834960419227450344600217059328')
const curve = new Curve(p, a, b, Gx, Gy, n, h)
const g = Point.fromAffine(curve, Gx, Gy)

export const BLSPrivateKeyToProcessedPrivateKey = (privateKeyHex: string) => {
  const originalPrivateKeyBytes = Buffer.from(privateKeyHex, 'hex')
  //console.log(`original private key: ${originalPrivateKeyBytes.toString('hex')}`);

  const part1Bytes = Buffer.concat([Buffer.from('01', 'hex'), originalPrivateKeyBytes])

  const part2Bytes = Buffer.concat([Buffer.from('02', 'hex'), originalPrivateKeyBytes])

  const privateKeyBeforeMod = Buffer.concat([keccak256(part1Bytes), keccak256(part2Bytes)])

  const privateKeyNum = BigInteger.fromBuffer(privateKeyBeforeMod)

  const privateKey = privateKeyNum.mod(n)
  const privateKeyBytes = reverse(privateKey.toBuffer())
  //console.log(`private key: ${privateKeyBytes.toString('hex')}`);

  return privateKeyBytes
}

export const BLSPrivateKeyToPublic = (privateKeyHex: string) => {
  const privateKeyBytes = BLSPrivateKeyToProcessedPrivateKey(privateKeyHex)
  const privateKey = BigInteger.fromBuffer(reverse(privateKeyBytes))

  const publicKey = g.multiply(privateKey)
  const publicKeyXBytes = reverse(publicKey.affineX.toBuffer())
  const publicKeyYBytes = reverse(publicKey.affineY.toBuffer())

  let publicKeyXHex = publicKeyXBytes.toString('hex')
  while (publicKeyXHex.length < 96) {
    publicKeyXHex = publicKeyXHex + '00'
  }
  //console.log(publicKeyXHex);

  let publicKeyYHex = publicKeyYBytes.toString('hex')
  while (publicKeyYHex.length < 96) {
    publicKeyYHex = publicKeyYHex + '00'
  }
  //console.log(publicKeyYHex);

  let publicKeyHex = publicKeyXHex + publicKeyYHex
  //console.log(`public key: ${publicKeyHex}`);

  return publicKeyHex
}
