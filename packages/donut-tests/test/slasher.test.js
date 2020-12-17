const { assert } = require('chai')
const { tonelli } = require('./tonelli')

function split(n) {
  let str = n.toString(16).padStart(128, '0')
  return ['0x' + str.substr(-128, 64), '0x' + str.substr(-64)]
}

function split2(n) {
  let str = n.toString(16).padStart(96, '0')
  console.log(`B12.Fp(0x${str.substr(0, 32)}, 0x${str.substr(32, 64)})`)
}

function combine(a, b) {
  let aa = a._hex.substr(2).padStart(64, '0')
  let bb = b._hex.substr(2).padStart(64, '0')
  return BigInt('0x' + aa + bb)
}

let base = 0x1ae3a4617c510eac63b05c06ca1493b1a22d9f300f5138f1ef3622fba094800170b5d44300000008508c00000000001n
let y1 = 0x001cefdc52b4e1eba6d3b6633bf15a765ca326aa36b6c0b5b1db375b6a5124fa540d200dfb56a6e58785e1aaaa63715bn
let y2 = 0x01914a69c5102eff1f674f5d30afeec4bd7fb348ca3e52d96d182ad44fb82305c2fe3d3634a9591afd82de55559c8ea6n
let x = 0x008848defe740a67c8fc6225bf87ff5485951e2caa9d41bb188282c8bd37cb5cd5481512ffcd394eeab9b16eb21be9efn

function max(a, b) {
  if (a < b) return b
  else return a
}

function min(a, b) {
  if (a > b) return b
  else return a
}

function findY(x, greatest) {
  let [a, b] = tonelli((x ** 3n + 1n) % base, base)
  return [max(a, b), min(a, b)]
}

function conv(arg) {
  return Buffer.from(arg.split(' ').map((a) => parseInt(a, 10))).toString('hex')
}

function make(a) {
  return uncompressSig([...Buffer.from(conv(a), 'hex')])
}

function uncompressSig(comp) {
  let sig = [...comp].reverse()
  let greatest = (sig[0] & 0x80) != 0
  sig[0] = sig[0] & 0x7f
  let x = BigInt('0x' + Buffer.from(sig).toString('hex'))
  let [a, b] = tonelli((x ** 3n + 1n) % base, base)
  let y = greatest ? max(a, b) : min(a, b)
  // console.log(x, a, b, greatest ? max(a,b) : min(a,b), a < b, greatest)
  return `0x${x.toString(16).padStart(128, 0)}${y.toString(16).padStart(128, 0)}`
}

async function makeHint(instance, { inner, extra }) {
  let inner_hash = inner
  let extra_data = extra // counter, max nonsigners, epoch
  let [epoch, res, res2] = await instance.testHashing(extra_data, inner_hash)
  let arr = [...Buffer.from(res.substr(2), 'hex')]
  let needed = arr.slice(0, 48).reverse()
  needed[0] = needed[0] & 0x01
  let x = BigInt('0x' + Buffer.from(needed).toString('hex'))
  let [y1, y2] = findY(x)
  let hints = `0x${y1.toString(16).padStart(128, 0)}${y2.toString(16).padStart(128, 0)}`
  return hints
}

async function infoToData(instance, info) {
  let hint = await makeHint(instance, info)
  let sig = uncompressSig(info.sig)
  // console.log(sig, info.sig)
  const header = `0x${info.extra.substr(2)}${info.inner.substr(2)}${'1'.padStart(
    64,
    '0'
  )}${sig.substr(2)}${hint.substr(2)}`
  return header
}

describe('SnarkEpochDataSlasher', function() {
  let instance
  this.timeout(60000)

  before(async () => {
    const Passthrough = await ethers.getContractFactory('TestSlasher')
    instance = await Passthrough.deploy()
  })

  it('blake2xs hash works', async () => {
    let data =
      '0x1ae3a4617c510eac63b05c06ca1493b1a22d9f300f5138f1ef3622fba094800170b5d44300000008508c000000000010'
    let res = await instance.testHash(data)
    assert(
      res ==
        '0x58c64608363b3d7f29e6502799625253ea7ddfafac86701f251215113d5c7c0b8a1907e541658e785a6e892c636193280f703ed74dc10a7d7749385f8be43277'
    )
  })

  it('getting BLS public key', async () => {
    let res = await instance.validatorBLSPublicKeyFromSet(0, 123)
    assert(
      res ==
        '0x0000000000000000000000000000000000b776302a4f1511de7b3d3f77a608c494480df288a80fa2365abe8d98bfd31349c5ddcda11f8d068b8713c97ff6a34f0000000000000000000000000000000000ff9afc060bdbad7a5d3fbef42ce043a7caec1c5759e9d3eff2d895cd5320ac7979ac8655dbf4835e0e5ad22fa445d3000000000000000000000000000000000011437e87ba00d150098f1c22cc7987b9376e6e0fe4b87190b24c2d970bd7c999c7217ef096e110d80979b2e89aca8800000000000000000000000000000000009cc04c559d4f8286a6ac425b4dd7793a28bd2a09d2787cccece08041db5e9387589225435475915a027c35bbea5724'
    )
  })

  it('parsing BLS key works', async () => {
    let [x1, x2, xu1, xu2, y1, y2, yu1, yu2] = await instance.testBLSPublicKey(1, 0)
    let x = combine(x1, x2)
    let y = combine(y1, y2)
    let xu = combine(xu1, xu2)
    let yu = combine(yu1, yu2)
    assert(
      x ==
        0xb776302a4f1511de7b3d3f77a608c494480df288a80fa2365abe8d98bfd31349c5ddcda11f8d068b8713c97ff6a34fn
    )
    assert(
      xu ==
        0xff9afc060bdbad7a5d3fbef42ce043a7caec1c5759e9d3eff2d895cd5320ac7979ac8655dbf4835e0e5ad22fa445d3n
    )
    assert(
      y ==
        0x11437e87ba00d150098f1c22cc7987b9376e6e0fe4b87190b24c2d970bd7c999c7217ef096e110d80979b2e89aca88n
    )
    assert(
      yu ==
        0x9cc04c559d4f8286a6ac425b4dd7793a28bd2a09d2787cccece08041db5e9387589225435475915a027c35bbea5724n
    )
  })

  const info1 = {
    epoch: 33,
    inner:
      '0xcd24f5a3be8f5306767c25e2ef565810f76b96887302a246462dfc7575ad4a7d8ea18220a731e942f3b5eaa5b3f47501',
    extra: '0x0100000000000084',
    sig: [
      255,
      16,
      101,
      16,
      206,
      86,
      53,
      253,
      109,
      149,
      69,
      64,
      239,
      73,
      187,
      11,
      70,
      172,
      157,
      120,
      9,
      158,
      73,
      47,
      177,
      127,
      203,
      96,
      139,
      125,
      177,
      170,
      114,
      179,
      194,
      243,
      184,
      237,
      86,
      255,
      171,
      74,
      145,
      90,
      162,
      213,
      140,
      129,
    ],
  }

  const info2 = {
    epoch: 33,
    inner:
      '0xe2ff5106f792bb53d97d035a7e9e7b4616acbb06b57a6a13d8cebd974a581e604bfeeb71ae78c46aa32f7fad4a325c00',
    extra: '0x0400000000000084',
    sig: [
      229,
      250,
      227,
      43,
      229,
      82,
      245,
      110,
      165,
      20,
      37,
      182,
      226,
      91,
      223,
      215,
      187,
      70,
      115,
      225,
      32,
      43,
      120,
      250,
      44,
      137,
      216,
      236,
      210,
      240,
      57,
      188,
      28,
      224,
      161,
      231,
      138,
      215,
      154,
      7,
      240,
      104,
      166,
      105,
      159,
      165,
      80,
      129,
    ],
  }

  const info3 = {
    epoch: 30,
    inner:
      '0x66bf77133dd2f20f56c8260b3700f74e16df62be968466027bd6ec37a8623641b3e903ef5fce6a3b0b0c565b2eebbd00',
    extra: '0x0000000000000078',
    sig: [
      158,
      72,
      75,
      77,
      22,
      142,
      29,
      140,
      254,
      187,
      120,
      168,
      130,
      101,
      64,
      42,
      52,
      228,
      184,
      126,
      98,
      5,
      138,
      79,
      140,
      175,
      201,
      239,
      204,
      135,
      133,
      91,
      112,
      23,
      38,
      184,
      7,
      175,
      137,
      12,
      90,
      119,
      71,
      93,
      221,
      106,
      246,
      128,
    ],
  }

  const info4 = {
    epoch: 30,
    inner:
      '0x100da31ae27858efbbca0704c60831f3630d68defc194e26d25189d7097b5f1ea09231d47c3a74eb3f1daaeb27e3e400',
    extra: '0x0000000000000078',
    sig: [
      245,
      247,
      108,
      37,
      25,
      163,
      158,
      240,
      233,
      83,
      140,
      198,
      51,
      22,
      28,
      56,
      80,
      16,
      154,
      12,
      124,
      84,
      128,
      131,
      42,
      234,
      125,
      138,
      195,
      252,
      138,
      116,
      194,
      102,
      180,
      206,
      106,
      86,
      25,
      66,
      101,
      132,
      233,
      210,
      225,
      7,
      14,
      0,
    ],
  }

  const info5 = {
    epoch: 320,
    inner:
      '0xdde0fe1df0eaffa6c326a60fd624d3217b506d19fd7f65d7101c1ac2c8cca06b24fe740bab5fd39a610257c60d998c01',
    extra: '0x0100000000008002',
    sig: [
      245,
      29,
      224,
      84,
      151,
      73,
      123,
      172,
      29,
      168,
      222,
      245,
      199,
      229,
      235,
      216,
      53,
      0,
      59,
      28,
      192,
      12,
      142,
      216,
      224,
      93,
      93,
      79,
      62,
      94,
      70,
      246,
      234,
      29,
      127,
      157,
      146,
      69,
      52,
      19,
      102,
      210,
      223,
      52,
      201,
      240,
      43,
      128,
    ],
  }

  const info6 = {
    epoch: 320,
    inner:
      '0xb92cad226bbc34cf100a033c6f9ea5d68878762c3a08af22fb889a5c454d5852114ae18abc25c9eae914282c72355c01',
    extra: '0x0300000000008002',
    sig: [
      11,
      0,
      154,
      125,
      65,
      178,
      12,
      115,
      45,
      250,
      147,
      247,
      49,
      196,
      67,
      212,
      108,
      253,
      142,
      34,
      223,
      161,
      146,
      137,
      107,
      57,
      97,
      87,
      133,
      211,
      125,
      25,
      192,
      255,
      122,
      239,
      162,
      160,
      232,
      187,
      17,
      125,
      51,
      161,
      142,
      145,
      27,
      0,
    ],
  }

  const cases = [info1, info2, info3, info4, info5, info6]

  it('getting signature', async () => {
    for (const el of cases) {
      let data = uncompressSig(el.sig) // `0x${x.toString(16).padStart(128,0)}${y.toString(16).padStart(128,0)}`
      let [x1, x2, y1, y2] = await instance.testParseG1(data)
      let rx = combine(x1, x2)
      let ry = combine(y1, y2)
      assert((rx ** 3n + 1n) % base == ry ** 2n % base)
    }
  })

  it('test signature validity', async () => {
    for (const info of cases) {
      let sig_point = uncompressSig(info.sig)
      let inner_hash = info.inner
      let extra_data = info.extra
      let hint = await makeHint(instance, info)
      assert(await instance.testValid(extra_data, inner_hash, sig_point, hint))
    }
  })

  it('test decoding', async () => {
    for (const info of cases) {
      const header = await infoToData(instance, info)
      let [extra, bhhash, bitmap, sig, hint] = await instance.testDecode(header)
      let a_hint = await makeHint(instance, info)
      let a_sig = uncompressSig(info.sig)
      assert(info.extra == extra)
      assert(info.inner == bhhash)
      assert(a_sig == sig)
      assert(a_hint == hint)
    }
  })

  it('test decoding epoch number', async () => {
    for (const info of cases) {
      const header = await infoToData(instance, info)
      let res = await instance.getEpochFromData(header)
      assert(res.toNumber() == info.epoch)
    }
  })

  it('test slashing', async () => {
    for (const info of cases) {
      const header = await infoToData(instance, info)
      assert(await instance.testSlash(header))
    }
  })

  it('test from RPC', async () => {
    let res = await ethers.provider.send('istanbul_getEpochValidatorSetData', ['0xa'])
    let info = {
      inner: '0x' + Buffer.from(res.bhhash, 'base64').toString('hex'),
      extra:
        '0x' +
        res.attempts.toString(16).padStart(2, '0') +
        Buffer.from(res.extraData, 'base64').toString('hex'),
      sig: Buffer.from(res.sig, 'base64'),
    }
    let header = await infoToData(instance, info)
    assert(await instance.testSlash(header))
  })
})
