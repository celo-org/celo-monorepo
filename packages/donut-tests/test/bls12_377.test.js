const { assert } = require('chai')

const g1Add = require('./bls12377G1Add_matter.json')
const g1Mul = require('./bls12377G1Mul_matter.json')
const g1MultiExp = require('./bls12377G1MultiExp_matter.json')
const g2Add = require('./bls12377G2Add_matter.json')
const g2Mul = require('./bls12377G2Mul_matter.json')
const g2MultiExp = require('./bls12377G2MultiExp_matter.json')

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

describe('BLS12-377', function() {
  let instance
  this.timeout(60000)

  before(async () => {
    const Passthrough = await ethers.getContractFactory('Passthrough')
    // instance = Passthrough.attach('0x5d432D9AA925210DfbCfd967E884C216853dC017');
    instance = await Passthrough.deploy()
  })

  it('fpNormal works', async () => {
    let base = 0x1ae3a4617c510eac63b05c06ca1493b1a22d9f300f5138f1ef3622fba094800170b5d44300000008508c00000000001n
    let cases = [
      0x5d432d9aa925210dfbcfd967e884c2168n,
      0x5d432d9aa925210dfbcfd967e884c216853dc0175d432d9aa934343434343434343434342521e0dfbcfd967e884c216853dc017n,
      0x1235d432d9aa925210dfbcfd967e884c216853dc0175d432d9aa934343434343434343434342521e0dfbcfd967e884c216853dc017n,
    ]
    for (let a of cases) {
      let [a1, a2] = split(a)
      let [r1, r2] = await instance.fpNormalTest(a1, a2)
      let r = combine(r1, r2)
      assert(a % base == r)
    }
  })

  it('fpNormal2 works', async () => {
    let base = 0x1ae3a4617c510eac63b05c06ca1493b1a22d9f300f5138f1ef3622fba094800170b5d44300000008508c00000000001n
    let cases = [
      [0x5d432d9aa925210dfbcfd967e884c2168n, 0n],
      [0x5d432d9aa925210dfbcfd967e884c2168n, 16n],
      [0x5d432d9aa925210dfbcfd967e884c2168n, 32n],
      [0x5d432d9aa925210dfbcfd967e884c2168n, 64n],
    ]
    for (let [a, idx] of cases) {
      let [r1, r2] = await instance.fpNormal2Test(a, idx.toString())
      let r = combine(r1, r2)
      assert((a * 2n ** (8n * idx)) % base == r)
    }
  })

  it('fpMul works', async () => {
    let base = 0x1ae3a4617c510eac63b05c06ca1493b1a22d9f300f5138f1ef3622fba094800170b5d44300000008508c00000000001n
    let cases = [
      [0x17n, 0xc017n],
      [0x12323232327n, 0xc02323232317n],
      [0x1232323adadadad2327n, 0xc023adadadad23232317n],
      [0x1232323adadadad2327e3e3e3e3en, 0xc023adae3e3e3e3dadad23232317n],
      [0x12323231234567890adadadad2327e3e3e3e3en, 0xc023ada1234567890e3e3e3e3dadad23232317n],
      [
        0x5d432d9aa925210dfbcfd967e884c216853dc0175d432d9aa92521e0dfbcfd967e884c216853dc017n,
        0x5d432d9aa925210dfbcfd967e884600853dc0175d432d9aa9252e10dfbcfd967e884c216853dc017n,
      ],
    ]
    for (let [a, b] of cases) {
      let [a1, a2] = split(a)
      let [b1, b2] = split(b)
      let [r1, r2] = await instance.fpMulTest(a1, a2, b1, b2)
      let r = combine(r1, r2)
      // console.log((a*b)%base, r)
      assert((a * b) % base == r)
    }
  })

  it('fp2Mul works', async () => {
    let base = 0x1ae3a4617c510eac63b05c06ca1493b1a22d9f300f5138f1ef3622fba094800170b5d44300000008508c00000000001n
    let u = base - 5n
    let cases = [
      [
        0x018480be71c785fec89630a2a3841d01c565f071203e50317ea501f557db6b9b71889f52bb53540274e3e48f7c005196n,
        0x00ea6040e700403170dc5a51b1b140d5532777ee6651cecbe7223ece0799c9de5cf89984bff76fe6b26bfefa6ea16afen,
        0x01452cdfba80a16eecda9254a0ee59863c1eec808c4079363a9a9facc1d675fb243bd4bbc27383d19474b6bbf602b222n,
        0x00b623a64541bbd227e6681d5786d890b833c846c39bf79dfa8fb214eb26433dd491a504d1add8f4ab66f22e7a14706en,
      ],
    ]
    for (let [a, au, b, bu] of cases) {
      let [a1, a2] = split(a)
      let [b1, b2] = split(b)
      let [au1, au2] = split(au)
      let [bu1, bu2] = split(bu)
      let [r1, r2, ru1, ru2] = await instance.fp2MulTest([a1, a2, au1, au2, b1, b2, bu1, bu2])
      let r = combine(r1, r2)
      let ru = combine(ru1, ru2)
      // console.log((a*b)%base, r)
      assert((a * b + u * au * bu) % base == r)
      assert(((a + au) * (b + bu) - au * bu - a * b) % base == ru)
    }
    /*
    let [a1, a2, b1, b2] = await instance.fp2MulTest()
    console.log(combine(a1,a2), combine(b1,b2))
    */
  })

  it.skip('uncompressing works', async () => {
    let [a1, a2] = await instance.testUncompress()
    console.log(combine(a1, a2))
  })

  it.skip('deserialization works', async () => {
    let buf = Buffer.from(
      'efe91bb26eb1b9ea4e39cdff121548d55ccb37bdc8828218bb419daa2c1e958554ff87bf2562fcc8670a74fede488800',
      'hex'
    )
    let [a1, a2, b] = await instance.testDeserialize(buf)
    console.log(combine(a1, a2), b)
  })

  it('should g1Add', async () => {
    for (const test of g1Add) {
      assert.include(await instance.g1Add(`0x${test.Input}`), `0x${test.Expected}`)
    }
  })

  it('should g1Mul', async () => {
    for (const test of g1Mul) {
      assert.include(await instance.g1Mul(`0x${test.Input}`), `0x${test.Expected}`)
    }
  })

  it('should g1MultiExp', async () => {
    for (const test of g1MultiExp) {
      assert.include(await instance.g1MultiExp(`0x${test.Input}`), `0x${test.Expected}`)
    }
  })

  it('should g2Add', async () => {
    for (const test of g2Add) {
      assert.include(await instance.g2Add(`0x${test.Input}`), `0x${test.Expected}`)
    }
  })

  it('should g2Mul', async () => {
    for (const test of g2Mul) {
      assert.include(await instance.g2Mul(`0x${test.Input}`), `0x${test.Expected}`)
    }
  })

  it('should g2MultiExp', async () => {
    for (const test of g2MultiExp) {
      assert.include(await instance.g2MultiExp(`0x${test.Input}`), `0x${test.Expected}`)
    }
  })

  it.skip('should parseG1', async () => {
    for (const test of g1Add) {
      console.log(test.Input)
      let res = await instance.testParseG1(`0x${test.Input}`)
      console.log(res)
    }
  })

  it.skip('should serializeG1', async () => {
    console.log(await instance.testSerializeG1(1, 2, 3, 4))
  })

  it.skip('should parseG2', async () => {
    for (const test of g2Add) {
      console.log(test.Input)
      let res = await instance.testParseG2(`0x${test.Input}`)
      console.log(res)
    }
  })

  it.skip('should serializeG2', async () => {
    console.log(await instance.testSerializeG2(1, 2, 3, 4))
  })
})
