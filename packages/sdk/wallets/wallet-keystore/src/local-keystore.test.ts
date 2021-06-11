// import { CeloTx, EncodedTransaction } from '@celo/connect'
import { normalizeAddressWith0x, privateKeyToAddress, trimLeading0x } from '@celo/utils/lib/address'
import { rmdirSync } from 'fs'
import path from 'path'
import { KeystoreWalletWrapper, LocalKeystore } from './local-keystore'

// TODO remove later once tests are back to normal speed
jest.setTimeout(15000)

const TEST_PASSWORD = 'test-password2'
const TEST_PK = '477651e4d34628765680270958b2e4f4724c505ce2443939ac5363b8a2b129ba'
// TODO change this
const TEST_DIRECTORY =
  '/Users/eelanagaraj/celo/celo-monorepo/packages/sdk/wallets/wallet-keystore/test-keystore-dir'

describe('local keystore tests', () => {
  let keystore: LocalKeystore
  let keystoreTestDir: string

  // TODO improve mock the file creation +

  beforeAll(() => {
    keystoreTestDir = path.join(TEST_DIRECTORY, `test-keystores-${Date.now()}`)
  })

  beforeEach(() => {
    // TODO perhaps only create the LocalKeystore for limited cases (speed up static tests)
    const randString = (Math.random() + 1).toString().substring(2, 10)
    keystore = new LocalKeystore(path.join(keystoreTestDir, `test-keystore-${randString}`))
  })

  afterAll(() => {
    rmdirSync(keystoreTestDir, { recursive: true })
  })

  it('decrypts and returns raw private key from keystore file', async () => {
    const testPk = await LocalKeystore.getPrivateKeyFromFile(
      path.join(
        TEST_DIRECTORY,
        'UTC--2021-06-08T15-15-22.742Z--be3908acec362af0382ebc56e06b82ce819b19e8'
      ),
      TEST_PASSWORD
    )
    expect(trimLeading0x(testPk)).toBe(TEST_PK)
  })

  it('fails to decrypt keystore file with wrong password', async () => {
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

  it('imports private key into keystore file and lists properly', async () => {
    await keystore.importPrivateKey(TEST_PK, TEST_PASSWORD)
    expect(await keystore.listKeystoreAccounts()).toEqual([
      normalizeAddressWith0x(privateKeyToAddress(TEST_PK)),
    ])
  })
})

describe('keystore wallet wrapper tests', () => {
  let keystoreWallet: KeystoreWalletWrapper
  let keystoreTestDir: string

  beforeAll(() => {
    keystoreTestDir = path.join(TEST_DIRECTORY, `test-wallet-keystore-${Date.now()}`)
  })

  beforeEach(() => {
    const randString = (Math.random() + 1).toString().substring(2, 10)
    keystoreWallet = new KeystoreWalletWrapper(
      path.join(keystoreTestDir, `test-keystore-${randString}`)
    )
  })

  it('imports private key into keystore wallet properly', async () => {
    await keystoreWallet.importPrivateKey(TEST_PK, TEST_PASSWORD)
    expect(keystoreWallet.getLocalWallet().getAccounts()).toEqual([
      normalizeAddressWith0x(privateKeyToAddress(TEST_PK)),
    ])
  })
})
