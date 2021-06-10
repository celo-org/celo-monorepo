// import { CeloTx, EncodedTransaction } from '@celo/connect'
import { trimLeading0x } from '@celo/utils/lib/address'
import { promises as fspromises } from 'fs'
import path from 'path'
// import { Encrypt } from '@celo/utils/lib/ecies'
// import { verifySignature } from '@celo/utils/lib/signatureUtils'
// import { recoverTransaction, verifyEIP712TypedDataSigner } from '@celo/wallet-base'
// import Web3 from 'web3'
import { KeystoreWalletWrapper, LocalKeystore } from './local-keystore'

// const CHAIN_ID = 44378

// Sample data from the official EIP-712 example:
// https://github.com/ethereum/EIPs/blob/master/assets/eip-712/Example.js

// const PRIVATE_KEY1 = '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
// const PUBLIC_KEY1 = privateKeyToPublicKey(PRIVATE_KEY1)
// const ACCOUNT_ADDRESS1 = normalizeAddressWith0x(privateKeyToAddress(PRIVATE_KEY1))
// const PRIVATE_KEY2 = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890fdeccc'
// const ACCOUNT_ADDRESS2 = normalizeAddressWith0x(privateKeyToAddress(PRIVATE_KEY2))

// const FEE_ADDRESS = ACCOUNT_ADDRESS1
// const CURRENCY_ADDRESS = ACCOUNT_ADDRESS2

// TODO remove later once tests are back to normal speed
jest.setTimeout(15000)

const TEST_PASSWORD = 'test-password2'
const TEST_PK = '477651e4d34628765680270958b2e4f4724c505ce2443939ac5363b8a2b129ba'
// TODO change this
const TEST_DIRECTORY =
  '/Users/eelanagaraj/celo/celo-monorepo/packages/sdk/wallets/wallet-keystore/test-keystore-dir'

describe('local keystore tests', () => {
  // let keystore: LocalKeystore

  // beforeEach(() => {
  //   keystore = new LocalKeystore()
  // })
  // test('generate keystore file contents from private key', async () => {
  //   const x = await keystore.getPrivateKey('', '')
  //   console.log(x)
  //   await keystore.importPrivateKey(
  //     TEST_PK,
  //     TEST_PASSWORD
  //   )
  // })

  xit('decrypts and returns raw private key from keystore file', async () => {
    const testPk = await LocalKeystore.getPrivateKeyFromFile(
      path.join(
        TEST_DIRECTORY,
        'UTC--2021-06-08T15-15-22.742Z--be3908acec362af0382ebc56e06b82ce819b19e8'
      ),
      TEST_PASSWORD
    )
    expect(trimLeading0x(testPk)).toBe(TEST_PK)
  })

  xit('fails to decrypt keystore file with wrong password', async () => {
    try {
      await LocalKeystore.getPrivateKeyFromFile(
        path.join(
          TEST_DIRECTORY,
          'UTC--2021-06-08T15-15-22.742Z--be3908acec362af0382ebc56e06b82ce819b19e8'
        ),
        TEST_PASSWORD + '!'
      )
      throw new Error('Expected exception to be thrown')
    } catch (e) {
      expect(e.message).toBe('Key derivation failed - possibly wrong passphrase')
    }
  })

  xit('gets account address from file', async () => {
    console.log(
      (await fspromises.readdir(TEST_DIRECTORY)).map((file) =>
        LocalKeystore.getAddressFromFile(path.join(TEST_DIRECTORY, file))
      )
    )
    // for (let file of await fspromises.readdir(TEST_DIRECTORY)) {
    //   console.log(LocalKeystore.getAddressFromFile(path.join(TEST_DIRECTORY, file)))
    // }
  })
})

describe('keystore wallet wrapper tests', () => {
  let keystoreWallet: KeystoreWalletWrapper

  beforeEach(() => {
    keystoreWallet = new KeystoreWalletWrapper()
  })

  it('imports private key into keystore file and lists properly', async () => {
    await keystoreWallet.importPrivateKey(TEST_PK, TEST_PASSWORD)
    // expect(await keystoreWallet.listKeystoreAccounts()).toEqual([privateKeyToAddress(TEST_PK)])
    // TODO mock the file creation +
    // TODO check if a file has been created -->
  })

  // xit('fails to decrypt keystore file with wrong password', async () => {
  //   try {
  //     await LocalKeystore.getPrivateKeyFromFile(
  //       path.join(
  //         TEST_DIRECTORY,
  //         'UTC--2021-06-08T15-15-22.742Z--be3908acec362af0382ebc56e06b82ce819b19e8'
  //       ),
  //       TEST_PASSWORD + '!'
  //     )
  //     throw new Error('Expected exception to be thrown')
  //   } catch (e) {
  //     expect(e.message).toBe('Key derivation failed - possibly wrong passphrase')
  //   }
  // })
})
