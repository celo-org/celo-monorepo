import { soliditySha3 } from 'web3-utils'
import { getIdentifierHash, IdentifierPrefix } from './identifier'
const sha3 = (v: string) => soliditySha3({ type: 'string', value: v })

const TEST_SALT = 'abcdefg'
const TEST_PLAINTEXT_IDENTIFIER = '+testIdentifier@'

const EXPECTED_HASH_FOR_PREFIX: Record<IdentifierPrefix, string> = {
  [IdentifierPrefix.NULL]: '0x9ba535838da6c3b9e5052e63261deb872451a45d24cbbc2e0153a02b151702e3',
  [IdentifierPrefix.PHONE_NUMBER]:
    '0x1c404f57b436d75c6c63547c795d1d475c87dcd7bce6413fb016483e815335ee',
  [IdentifierPrefix.EMAIL]: '0xaa47e9630a60f2e6667b310164b82d973124fc462e0361750fb36cf9f0e6ee16',
  [IdentifierPrefix.TWITTER]: '0x9bb3eedf112f5ff18ec50467e2422fa1c2df01550fd650970e7aec3d52bc5ea9',
  [IdentifierPrefix.FACEBOOK]: '0x883c8d998c5e75e7014fdcd1f75976032023fbfe89707d030f22367f501e08e8',
  [IdentifierPrefix.INSTAGRAM]:
    '0x3b212606f77d62fa85f636d76ab499306bed09f7f23e39db6aba348000c54d48',
  [IdentifierPrefix.DISCORD]: '0xce7834e8e3c84180fab3a97b099dd131a78f9c91c3ae9753412423dc7ffdbdaa',
  [IdentifierPrefix.TELEGRAM]: '0x65ecb839a118e293672aa7556dcff3f5d82dd142835e9d6f45b9539f252b3c6c',
  [IdentifierPrefix.SIGNAL]: '0x34702bc6c5253a4d9521da1f45cec9eac3969c9cae7380aac422e2b872019182',
}

describe('Identifier hashing', () => {
  describe('Produces correct hash', () => {
    Object.values(IdentifierPrefix).forEach((prefix: IdentifierPrefix) => {
      it(`with IdentifierPrefix: ${prefix}`, () => {
        const expectedHash = EXPECTED_HASH_FOR_PREFIX[prefix]
        expect(getIdentifierHash(sha3, TEST_PLAINTEXT_IDENTIFIER, prefix, TEST_SALT)).toBe(
          expectedHash
        )
      })
    })
  })
})
