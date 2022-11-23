import { getPhoneHash } from '@celo/base'
import { soliditySha3 } from '@celo/utils/lib/solidity'
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

describe('backwards compatibility of phone number identifiers', () => {
  beforeAll(() => {
    fetchMock.reset()
    // disables the mock, lets all calls fall through to the actual network
    fetchMock.spy()
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

    expect(oldRes.e164Number).toEqual(currRes.plaintextIdentifier)
    expect(oldRes.phoneHash).toEqual(currRes.obfuscatedIdentifier)
    expect(oldRes.pepper).toEqual(currRes.pepper)
  }, 20000)

  it('blinded identifier should match', async () => {
    const blsBlindingClient = new WasmBlsBlindingClient('')
    const seed = Buffer.from(
      '44714c0a2b2bacec757a67822a4fbbdfe043cca8c6ae936545ef992f246df1a9',
      'hex'
    )
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

    expect(oldRes).toEqual(currentRes)
  })

  it('obfuscated identifier should match', async () => {
    const pepper = 'randomPepper'

    const sha3 = (v: string) => soliditySha3({ type: 'string', value: v })
    const oldRes = getPhoneHash(sha3, mockE164Number, pepper)

    const currRes = getIdentifierHash(mockE164Number, IdentifierPrefix.PHONE_NUMBER, pepper)

    expect(oldRes).toEqual(currRes)
  })

  it('should not match when different prefix used', async () => {
    const oldRes = await OdisUtils.PhoneNumberIdentifier.getPhoneNumberIdentifier(
      mockE164Number,
      mockAccount,
      authSigner,
      oldServiceContext
    )

    const currRes = await getObfuscatedIdentifier(
      mockE164Number,
      'badPrefix',
      mockAccount,
      authSigner,
      currentServiceContext
    )

    expect(oldRes.e164Number).toEqual(currRes.plaintextIdentifier)
    expect(oldRes.phoneHash).not.toEqual(currRes.obfuscatedIdentifier)
    expect(oldRes.pepper).not.toEqual(currRes.pepper)
  })
})
