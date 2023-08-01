import { getPhoneHash } from '@celo/base'
import { soliditySha3 } from '@celo/utils/lib/solidity'
import { OdisUtils as OdisUtilsOld } from 'old-identity-sdk'
import { OdisUtils } from '../../lib'
import { WasmBlsBlindingClient } from './bls-blinding-client'
import { AuthenticationMethod, AuthSigner, getServiceContext, OdisContextName } from './query'
import fetchMock from '../__mocks__/cross-fetch'

const { getBlindedIdentifier, getIdentifierHash, getObfuscatedIdentifier, IdentifierPrefix } =
  OdisUtils.Identifier

const mockE164Number = '+14155550000'
const mockAccount = '0x755dB5fF7B82e9a96e0dDDD143293dc2ADeC0050'
// const mockPrivateKey = '0x2cacaf965ae80da49d5b1fc4b4c9b08ffc35971a584aedcc1cb8322b9d5fd9c9'

// this DEK has been registered to the above account on alfajores
const dekPrivateKey = '0xc2bbdabb440141efed205497a41d5fb6114e0435fd541e368dc628a8e086bfee'

const authSigner: AuthSigner = {
  authenticationMethod: AuthenticationMethod.ENCRYPTION_KEY,
  rawKey: dekPrivateKey,
}
const oldServiceContext = OdisUtilsOld.Query.getServiceContext('alfajores')
const currentServiceContext = getServiceContext(OdisContextName.ALFAJORES)

const expectedObfuscatedIdentifier =
  '0xf82c6272fd57d3e5d4e291be16b3ebac5c616084a5e6f3730c73f62efd39c6ae'
const expectedPepper = 'Pi4Z1NQnfsdvJ'

describe('backwards compatibility of phone number identifiers', () => {
  beforeAll(() => {
    fetchMock.reset()
    // disables the mock, lets all calls fall through to the actual network
    fetchMock.spy()
  })

  it('should match when using EncryptionSigner', async () => {
    const oldRes = await OdisUtilsOld.PhoneNumberIdentifier.getPhoneNumberIdentifier(
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
    expect(oldRes.phoneHash).toEqual(expectedObfuscatedIdentifier)
    expect(currRes.obfuscatedIdentifier).toEqual(expectedObfuscatedIdentifier)
    expect(oldRes.pepper).toEqual(expectedPepper)
    expect(currRes.pepper).toEqual(expectedPepper)
  }, 20000)

  it('blinded identifier should match', async () => {
    const blsBlindingClient = new WasmBlsBlindingClient('')
    const seed = Buffer.from(
      '44714c0a2b2bacec757a67822a4fbbdfe043cca8c6ae936545ef992f246df1a9',
      'hex'
    )
    const oldRes = await OdisUtilsOld.PhoneNumberIdentifier.getBlindedPhoneNumber(
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

    const expectedBlindedIdentifier =
      'fuN6SmbxkYBqVbKZu4SizdyDjavNLK/XguIlwsWUhsWA0hQDoZtsZjQCbXqTnUiA'

    expect(oldRes).toEqual(expectedBlindedIdentifier)
    expect(currentRes).toEqual(expectedBlindedIdentifier)
  })

  it('obfuscated identifier should match', async () => {
    const sha3 = (v: string) => soliditySha3({ type: 'string', value: v })
    const oldRes = getPhoneHash(sha3, mockE164Number, expectedPepper)

    const currRes = getIdentifierHash(mockE164Number, IdentifierPrefix.PHONE_NUMBER, expectedPepper)

    expect(oldRes).toEqual(expectedObfuscatedIdentifier)
    expect(currRes).toEqual(expectedObfuscatedIdentifier)
  })

  it('should not match when different prefix used', async () => {
    const oldRes = await OdisUtilsOld.PhoneNumberIdentifier.getPhoneNumberIdentifier(
      mockE164Number,
      mockAccount,
      authSigner,
      oldServiceContext
    )

    const currRes = await getObfuscatedIdentifier(
      mockE164Number,
      '' as typeof IdentifierPrefix.PHONE_NUMBER,
      mockAccount,
      authSigner,
      currentServiceContext
    )

    expect(oldRes.e164Number).toEqual(currRes.plaintextIdentifier)
    expect(oldRes.phoneHash).not.toEqual(currRes.obfuscatedIdentifier)
    expect(oldRes.pepper).not.toEqual(currRes.pepper)
  })
})
