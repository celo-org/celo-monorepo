import { normalizeAddressWith0x, privateKeyToAddress, trimLeading0x } from '@celo/utils/lib/address'
import { ErrorMessages, InMemoryKeystore, KeystoreWalletWrapper } from './local-keystore'

jest.setTimeout(20000)

const PASSPHRASE1 = 'test- passwøörd1!'
const PK1 = 'd72f6c0b0d7348a72eaa7d3c997bd49293bdc7d4bf79eba03e9f7ca9c5ac6b7f'
const GETH_GEN_KEYSTORE1 = `{"address":"8233d802bdc645d0d1b9b2e6face6e5825905081","blspublickey":"ed2ed9b2670458d01df329a4c750e7a6f89ec0e86676d4e093b2f32b4f3b603b6927b8dfe12e9fdf5c9f4bbbc504770052d816dbcaae90f4ef0af19333965b29f29b069c1f28eaa4bcaa62b27459855e4ad201aac245de05c3cb51dcab118080","crypto":{"cipher":"aes-128-ctr","ciphertext":"7b2ccdede461b9f7cc33fbbd7a9bfe23fdf455f3d4a8558cb10e86c5a4c5cc39","cipherparams":{"iv":"a78b8382da088a544edef093e922947b"},"kdf":"scrypt","kdfparams":{"dklen":32,"n":262144,"p":1,"r":8,"salt":"2007752e0c72eed75a793cddba6a9e3c698b95a259002b32443d8c0430038505"},"mac":"e1599623f8957e538e17512e39693bf1a85fc4eab10fdb243c7d33fd18f9c766"},"id":"3b9465ac-eca1-4923-84e6-4624bd41ab0b","version":3}`
const KEYSTORE_NAME1 = 'PK1 keystore name'
const ADDRESS1 = normalizeAddressWith0x(privateKeyToAddress(PK1))
const PASSPHRASE2 = 'test-password2 !!'
const PK2 = 'bb6f3fa4a83b7b06e72e580a3b09df5dd6fb4fa745ee2b0d865413ad6299e64e'
const KEYSTORE_NAME2 = 'PK2 keystore name'
const GETH_GEN_KEYSTORE2 = `{"address":"b81a82696018fd9d8b43431966b60c31bdcdc2e8","blspublickey":"b9f862e2ced58bb2eef8ffde7020189ab2bb050603630eceec9b80c1636d98f8c3b9bd517d673937a0551c3a0698a00086bda4db1f0d859912a91988775ae388886013e7eb254d195871f9ced6643e288755da0b483ebe6dda448fea2eb75481","crypto":{"cipher":"aes-128-ctr","ciphertext":"6f3cd02b2d3d81b2bbf76743396c9c3c1685ddc6cfafbba34195ab03476831d3","cipherparams":{"iv":"af1f9853e0ff20ee5d495cf7d9461e1c"},"kdf":"scrypt","kdfparams":{"dklen":32,"n":262144,"p":1,"r":8,"salt":"cf0446914e5d214f2a312c08ef24e7e3dd15e948d2ca67d59b3bb97903a96147"},"mac":"58348f6d843d28b3ac8cf40542d10da198016f28f132c32389ab56a945c858e1"},"id":"b224dac6-c089-4b47-8557-e04ae60b3506","version":3}`
const ADDRESS2 = normalizeAddressWith0x(privateKeyToAddress(PK2))

describe('test keystore functionality via in-memory (mock) keystore', () => {
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

    it('maps address to keystore name', async () => {
      keystore.persistKeystore(KEYSTORE_NAME2, GETH_GEN_KEYSTORE2)
      const expectedMap: Record<string, string> = {}
      expectedMap[ADDRESS1] = KEYSTORE_NAME1
      expectedMap[ADDRESS2] = KEYSTORE_NAME2
      expect(await keystore.getAddressMap()).toEqual(expectedMap)
    })
  })
})

describe('keystore wallet wrapper tests', () => {
  let keystoreWallet: KeystoreWalletWrapper

  beforeEach(() => {
    keystoreWallet = new KeystoreWalletWrapper(new InMemoryKeystore())
  })

  describe('checks with an empty keystore', () => {
    it('imports private key into keystore wallet', async () => {
      await keystoreWallet.importPrivateKey(PK1, PASSPHRASE1)
      expect(keystoreWallet.getLocalWallet().getAccounts()).toEqual([ADDRESS1])
    })
  })

  describe('checks with a populated keystore', () => {
    beforeEach(() => {
      keystoreWallet.getKeystore().persistKeystore(KEYSTORE_NAME1, GETH_GEN_KEYSTORE1)
    })

    it('lists no accounts pre-unlock', async () => {
      expect(keystoreWallet.getLocalWallet().getAccounts()).toEqual([])
    })

    it('lists account post-unlock', async () => {
      await keystoreWallet.unlockAccount(ADDRESS1, PASSPHRASE1)
      expect(keystoreWallet.getLocalWallet().getAccounts()).toEqual([ADDRESS1])
    })
  })
})
