import { getPhoneHash } from '@celo/base'
import { soliditySha3 } from '@celo/utils/lib/solidity'
import { randomBytes } from 'crypto'
import { OdisUtils } from 'old-identity-sdk'
import { WasmBlsBlindingClient } from './bls-blinding-client'
import {
  getBlindedIdentifier,
  getIdentifierHash,
  getObfuscatedIdentifier,
  IdentifierPrefix,
} from './identifier'
import { AuthenticationMethod, AuthSigner, getServiceContext } from './query'

const mockE164Number = '+14155550000'
const mockAccount = '0x755dB5fF7B82e9a96e0dDDD143293dc2ADeC0050'
// const mockPrivateKey = '0x2cacaf965ae80da49d5b1fc4b4c9b08ffc35971a584aedcc1cb8322b9d5fd9c9'

// this DEK has been registered to the above account on alfajores
const dekPrivateKey = '0xc2bbdabb440141efed205497a41d5fb6114e0435fd541e368dc628a8e086bfee'
// const dekPublicKey = '0xc2bbdabb440141efed205497a41d5fb6114e0435fd541e368dc628a8e086bfee'

const authSigner: AuthSigner = {
  authenticationMethod: AuthenticationMethod.ENCRYPTION_KEY,
  rawKey: dekPrivateKey,
}
const oldServiceContext = OdisUtils.Query.getServiceContext('alfajores')
const currentServiceContext = getServiceContext('alfajores')

describe('backwards compatibility', () => {
  beforeAll(() => {
    fetchMock.reset()
    // disables the mock, lets all calls fall through to the actual network
    fetchMock.spy()
    jest.setTimeout(20000)
  })

  it('should match when using EncryptionSigner', async () => {
    const oldRes = await OdisUtils.PhoneNumberIdentifier.getPhoneNumberIdentifier(
      mockE164Number,
      mockAccount,
      authSigner,
      oldServiceContext
    )

    const currRes = await getObfuscatedIdentifier(
      mockE164Number,
      IdentifierPrefix.PHONE_NUMBER,
      mockAccount,
      authSigner,
      currentServiceContext
    )

    expect(oldRes.e164Number).toMatch(currRes.plaintextIdentifier)
    expect(oldRes.phoneHash).toMatch(currRes.obfuscatedIdentifier)
    expect(oldRes.pepper).toMatch(currRes.pepper)
  })

  it('blinded identifier', async () => {
    const blsBlindingClient = new WasmBlsBlindingClient('')
    const seed = randomBytes(32)
    const oldRes = await OdisUtils.PhoneNumberIdentifier.getBlindedPhoneNumber(
      mockE164Number,
      blsBlindingClient,
      seed
    )
    const currentRes = await getBlindedIdentifier(
      mockE164Number,
      IdentifierPrefix.PHONE_NUMBER,
      blsBlindingClient,
      seed
    )

    expect(oldRes).toMatch(currentRes)
  })

  it('obfuscated identifier', async () => {
    const pepper = 'randomPepper'

    const sha3 = (v: string) => soliditySha3({ type: 'string', value: v })
    const oldRes = getPhoneHash(sha3, mockE164Number, pepper)

    const currRes = getIdentifierHash(mockE164Number, IdentifierPrefix.PHONE_NUMBER, pepper)

    expect(oldRes).toMatch(currRes)
  })
})
