import { privateKeyToAddress, trimLeading0x } from '@celo/utils/lib/address'
import { InMemoryKeystore } from './inmemory-keystore'
import { ErrorMessages } from './keystore-base'
import {
  ADDRESS1,
  ADDRESS2,
  GETH_GEN_KEYSTORE1,
  GETH_GEN_KEYSTORE2,
  KEYSTORE_NAME1,
  KEYSTORE_NAME2,
  PASSPHRASE1,
  PASSPHRASE2,
  PK1,
} from './test-constants'

jest.setTimeout(20000)

describe('KeystoreBase functionality via InMemoryKeystore (mock)', () => {
  let keystore: InMemoryKeystore
  beforeEach(() => {
    keystore = new InMemoryKeystore()
  })

  describe('checks with an empty keystore', () => {
    it('lists no addresses', async () => {
      expect(await keystore.listKeystoreAddresses()).toEqual([])
    })
    it('imports keystore (can decrypt, can list addresses)', async () => {
      await keystore.importPrivateKey(PK1, PASSPHRASE1)
      expect(await keystore.listKeystoreAddresses()).toEqual([ADDRESS1])
      expect(trimLeading0x(await keystore.getPrivateKey(ADDRESS1, PASSPHRASE1))).toEqual(PK1)
    })
    it('gets empty address map', async () => {
      expect(await keystore.getAddressMap()).toEqual({})
    })
    it('fails when address is not in the keystore', async () => {
      await expect(keystore.getPrivateKey(ADDRESS1, PK1)).rejects.toThrow(
        ErrorMessages.NO_MATCHING_ENTRY
      )
    })
  })

  describe('checks with a populated keystore', () => {
    beforeEach(() => {
      keystore.persistKeystore(KEYSTORE_NAME1, GETH_GEN_KEYSTORE1)
    })

    it('decrypts and returns raw private key from keystore blob', async () => {
      expect(trimLeading0x(await keystore.getPrivateKey(ADDRESS1, PASSPHRASE1))).toBe(PK1)
    })

    it('decrypts when non-normalized address is passed in', async () => {
      expect(
        trimLeading0x(await keystore.getPrivateKey(privateKeyToAddress(PK1), PASSPHRASE1))
      ).toBe(PK1)
    })

    it('does not decrypt keystore with incorrect passphrase', async () => {
      await expect(keystore.getPrivateKey(ADDRESS1, PASSPHRASE1 + '!')).rejects.toThrow(
        'Key derivation failed - possibly wrong passphrase'
      )
    })

    it('gets keystore name from address', async () => {
      expect(await keystore.getKeystoreName(ADDRESS1)).toBe(KEYSTORE_NAME1)
    })

    it('changes keystore passphrase successfully', async () => {
      await keystore.changeKeystorePassphrase(ADDRESS1, PASSPHRASE1, PASSPHRASE2)
      await expect(keystore.getPrivateKey(ADDRESS1, PASSPHRASE1)).rejects.toThrow()
      expect(trimLeading0x(await keystore.getPrivateKey(ADDRESS1, PASSPHRASE2))).toBe(PK1)
    })

    it('does not import same private key twice', async () => {
      await expect(keystore.importPrivateKey(PK1, PASSPHRASE2)).rejects.toThrow(
        ErrorMessages.KEYSTORE_ENTRY_EXISTS
      )
    })

    it('lists addresses', async () => {
      expect(await keystore.listKeystoreAddresses()).toEqual([ADDRESS1])
    })

    it('deletes keystore', async () => {
      await keystore.deleteKeystore(ADDRESS1)
      expect(await keystore.listKeystoreAddresses()).toEqual([])
    })

    it('maps address to keystore name', async () => {
      keystore.persistKeystore(KEYSTORE_NAME2, GETH_GEN_KEYSTORE2)
      const expectedMap: Record<string, string> = {}
      expectedMap[ADDRESS1] = KEYSTORE_NAME1
      expectedMap[ADDRESS2] = KEYSTORE_NAME2
      expect(await keystore.getAddressMap()).toEqual(expectedMap)
    })
  })
})
