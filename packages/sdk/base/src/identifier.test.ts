import { soliditySha3 } from 'web3-utils'
import { getIdentifierHash, IdentifierPrefix } from './identifier'
const sha3 = (v: string) => soliditySha3({ type: 'string', value: v })

const TEST_SALT = 'abcdefg'
const TEST_PLAINTEXT_IDENTIFIER = '+testIdentifier@'

// TODO EN: create values dict to lookup the result
// this should cause a test failure if someone adds a prefix without adding a test case for it here
const TEST_PLAINTEXT_HASH_PAIRS: Record<IdentifierPrefix, [string, string]> = {
  [IdentifierPrefix.NULL]: [
    'testIdentifier',
    '0xc0d531071442cb575d933240d947a4de3f7d4ed213eacff8d3599d5b81aa1673',
  ],
  [IdentifierPrefix.PHONE_NUMBER]: [
    '+141555544444',
    '0xf08257f6b126597dbd090fecf4f5106cfb59c98ef997644cef16f9349464810c',
  ],
  [IdentifierPrefix.EMAIL]: [
    'test@identifier.com',
    '0x3c081343346ccd3ff1eb364d71607bd15cefbb8493bd8f6ef240b92b38b8b1e8',
  ],
  [IdentifierPrefix.TWITTER]: ['@testIdentifier', 'TODO'],
  [IdentifierPrefix.FACEBOOK]: ['testIdentifier', 'TODO'],
  [IdentifierPrefix.INSTAGRAM]: ['@testIdentifier', 'TODO'],
  [IdentifierPrefix.DISCORD]: ['@testIdentifier', 'TODO'],
  [IdentifierPrefix.TELEGRAM]: ['@testIdentifier', 'TODO'],
  [IdentifierPrefix.SIGNAL]: ['+141555544444', 'TODO'],
}

describe('Identifier hashing', () => {
  describe('Produces correct hash', () => {
    Object.values(IdentifierPrefix).forEach((prefix: IdentifierPrefix) => {
      it(`with IdentifierPrefix: ${prefix}`, () => {
        const [plaintextVal, expectedHash] = TEST_PLAINTEXT_HASH_PAIRS[prefix]
        expect(getIdentifierHash(sha3, TEST_PLAINTEXT_IDENTIFIER, prefix, TEST_SALT)).toBe(
          expectedHash
        )
      })
    })
  })
})
