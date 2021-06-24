import { normalizeAddressWith0x, privateKeyToAddress } from '@celo/utils/lib/address'
import { InMemoryKeystore } from './inmemory-keystore'
import { KeystoreWalletWrapper } from './keystore-wallet-wrapper'

const PASSPHRASE1 = 'test- passwøörd1!'
const PK1 = 'd72f6c0b0d7348a72eaa7d3c997bd49293bdc7d4bf79eba03e9f7ca9c5ac6b7f'
const GETH_GEN_KEYSTORE1 = `{"address":"8233d802bdc645d0d1b9b2e6face6e5825905081","blspublickey":"ed2ed9b2670458d01df329a4c750e7a6f89ec0e86676d4e093b2f32b4f3b603b6927b8dfe12e9fdf5c9f4bbbc504770052d816dbcaae90f4ef0af19333965b29f29b069c1f28eaa4bcaa62b27459855e4ad201aac245de05c3cb51dcab118080","crypto":{"cipher":"aes-128-ctr","ciphertext":"7b2ccdede461b9f7cc33fbbd7a9bfe23fdf455f3d4a8558cb10e86c5a4c5cc39","cipherparams":{"iv":"a78b8382da088a544edef093e922947b"},"kdf":"scrypt","kdfparams":{"dklen":32,"n":262144,"p":1,"r":8,"salt":"2007752e0c72eed75a793cddba6a9e3c698b95a259002b32443d8c0430038505"},"mac":"e1599623f8957e538e17512e39693bf1a85fc4eab10fdb243c7d33fd18f9c766"},"id":"3b9465ac-eca1-4923-84e6-4624bd41ab0b","version":3}`
const KEYSTORE_NAME1 = 'PK1 keystore name'
const ADDRESS1 = normalizeAddressWith0x(privateKeyToAddress(PK1))

describe('KeystoreWalletWrapper using InMemoryKeystore', () => {
  let keystoreWalletWrapper: KeystoreWalletWrapper

  beforeEach(() => {
    keystoreWalletWrapper = new KeystoreWalletWrapper(new InMemoryKeystore())
  })

  describe('checks with an empty keystore', () => {
    it('imports private key into keystore wallet', async () => {
      await keystoreWalletWrapper.importPrivateKey(PK1, PASSPHRASE1)
      expect(keystoreWalletWrapper.getLocalWallet().getAccounts()).toEqual([ADDRESS1])
    })
  })

  describe('checks with a populated keystore', () => {
    beforeEach(() => {
      keystoreWalletWrapper.getKeystore().persistKeystore(KEYSTORE_NAME1, GETH_GEN_KEYSTORE1)
    })

    it('lists no accounts pre-unlock', async () => {
      expect(keystoreWalletWrapper.getLocalWallet().getAccounts()).toEqual([])
    })

    it('lists account post-unlock', async () => {
      await keystoreWalletWrapper.unlockAccount(ADDRESS1, PASSPHRASE1)
      expect(keystoreWalletWrapper.getLocalWallet().getAccounts()).toEqual([ADDRESS1])
    })
  })
})
