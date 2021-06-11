// import { CeloTx, EncodedTransaction } from '@celo/connect'
import { normalizeAddressWith0x, privateKeyToAddress, trimLeading0x } from '@celo/utils/lib/address'
import { rmdirSync } from 'fs'
import path from 'path'
import { ErrorMessages, KeystoreWalletWrapper, LocalKeystore } from './local-keystore'

// TODO remove later once tests are back to normal speed
jest.setTimeout(30000)

const TEST_PASSPHRASE = 'test-password1!'
const TEST_PK = '477651e4d34628765680270958b2e4f4724c505ce2443939ac5363b8a2b129ba'
const TEST_ADDR = normalizeAddressWith0x(privateKeyToAddress(TEST_PK))
const TEST_PASSPHRASE2 = 'test-password2!!'
const TEST_PK2 = '1fcef0e877cc7fcf3ef687f9ed74dc7ab983b602f3e08e088479a49b1e2e4113'
const TEST_ADDR2 = normalizeAddressWith0x(privateKeyToAddress(TEST_PK2))
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
    // TODO!!!! copy in hard-coded keystore file instead of importing in key before each test
  })

  afterAll(() => {
    rmdirSync(keystoreTestDir, { recursive: true })
  })

  it('decrypts and returns raw private key from keystore file', async () => {
    // TODO make this test replicable; purely for dev right now
    const testPk = await LocalKeystore.getPrivateKeyFromFile(
      path.join(
        TEST_DIRECTORY,
        'UTC--2021-06-08T15-15-22.742Z--be3908acec362af0382ebc56e06b82ce819b19e8'
      ),
      'test-password2'
    )
    expect(trimLeading0x(testPk)).toBe(TEST_PK)
  })

  it('fails to decrypt keystore file with wrong passphrase', async () => {
    // TODO make this test replicable; purely for dev right now
    await expect(
      LocalKeystore.getPrivateKeyFromFile(
        path.join(
          TEST_DIRECTORY,
          'UTC--2021-06-08T15-15-22.742Z--be3908acec362af0382ebc56e06b82ce819b19e8'
        ),
        TEST_PASSPHRASE + '!'
      )
    ).rejects.toThrow('Key derivation failed - possibly wrong passphrase')
  })

  it('imports private key into keystore file and lists properly', async () => {
    await keystore.importPrivateKey(TEST_PK, TEST_PASSPHRASE)
    expect(await keystore.listKeystoreAddresses()).toEqual([TEST_ADDR])
  })

  // TODO: this may be overkill but also could form basis of integration test
  it('maps address to file properly', async () => {
    await keystore.importPrivateKey(TEST_PK, TEST_PASSPHRASE)
    await keystore.importPrivateKey(TEST_PK2, TEST_PASSPHRASE2)
    const expectedAddresses = [TEST_ADDR, TEST_ADDR2]
    const addressToFileMap = await keystore.getAddressToFileMap()
    // Confirm unique file paths were created
    expect(new Set(Object.keys(addressToFileMap)).size).toEqual(expectedAddresses.length)
    expect(new Set(Object.values(addressToFileMap)).size).toEqual(expectedAddresses.length)
    expect((await keystore.listKeystoreAddresses()).sort()).toEqual(expectedAddresses.sort())
  })

  it('throws an error when importing the same private key twice', async () => {
    await keystore.importPrivateKey(TEST_PK, TEST_PASSPHRASE)
    await expect(keystore.importPrivateKey(TEST_PK, TEST_PASSPHRASE)).rejects.toThrow(
      ErrorMessages.ADDRESS_FILE_EXISTS
    )
  })

  it('retrieves private key from keystore by address', async () => {
    await keystore.importPrivateKey(TEST_PK, TEST_PASSPHRASE)
    expect(
      trimLeading0x(await keystore.getPrivateKeyFromAddress(TEST_ADDR, TEST_PASSPHRASE))
    ).toEqual(TEST_PK)
  })

  it('changes keystore passphrase successfully', async () => {
    await keystore.importPrivateKey(TEST_PK, TEST_PASSPHRASE)
    await keystore.changeKeystorePassphrase(TEST_ADDR, TEST_PASSPHRASE, TEST_PASSPHRASE2)
    await expect(keystore.getPrivateKeyFromAddress(TEST_ADDR, TEST_PASSPHRASE)).rejects.toThrow()
    expect(
      trimLeading0x(await keystore.getPrivateKeyFromAddress(TEST_ADDR, TEST_PASSPHRASE2))
    ).toBe(TEST_PK)
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
    await keystoreWallet.importPrivateKey(TEST_PK, TEST_PASSPHRASE)
    expect(keystoreWallet.getLocalWallet().getAccounts()).toEqual([TEST_ADDR])
  })
})
