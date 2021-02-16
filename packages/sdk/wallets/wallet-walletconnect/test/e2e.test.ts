import {
  ensureLeading0x,
  eqAddress,
  privateKeyToAddress,
  privateKeyToPublicKey,
  trimLeading0x,
} from '@celo/utils/lib/address'
import { computeSharedSecret as computeECDHSecret } from '@celo/utils/lib/ecdh'
import { ECIES } from '@celo/utils/lib/ecies'
import { verifyEIP712TypedDataSigner, verifySignature } from '@celo/utils/src/signatureUtils'
import { recoverTransaction } from '@celo/wallet-base'
import Web3 from 'web3'
import { WalletConnectWallet } from '../src'
import { getTestWallet, testAddress, testPrivateKey } from './in-memory-wallet'

const CHAIN_ID = 44378
const TYPED_DATA = {
  types: {
    EIP712Domain: [
      { name: 'name', type: 'string' },
      { name: 'version', type: 'string' },
      { name: 'chainId', type: 'uint256' },
      { name: 'verifyingContract', type: 'address' },
    ],
    Person: [
      { name: 'name', type: 'string' },
      { name: 'wallet', type: 'address' },
    ],
    Mail: [
      { name: 'from', type: 'Person' },
      { name: 'to', type: 'Person' },
      { name: 'contents', type: 'string' },
    ],
  },
  primaryType: 'Mail',
  domain: {
    name: 'Ether Mail',
    version: '1',
    chainId: 1,
    verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
  },
  message: {
    from: {
      name: 'Cow',
      wallet: '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826',
    },
    to: {
      name: 'Bob',
      wallet: '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB',
    },
    contents: 'Hello, Bob!',
  },
}

describe('e2e tests', () => {
  const wallet = new WalletConnectWallet({
    name: 'Example Dapp',
    description: 'Example Dapp for WalletConnect',
    url: 'https://example.org/',
    icons: ['https://example.org/favicon.ico'],
  })
  const testWallet = getTestWallet()

  beforeAll(async () => {
    wallet.getUri().then((uri) => testWallet.init(uri))
    await wallet.init()
  }, 5000)

  afterAll(async () => {
    await testWallet.close()
    await wallet.close()

    // todo: asked in WC discord why .disconnect()
    // is not closing connections
    setTimeout(() => {
      process.exit(0)
    }, 2000)
  })

  it('getAccounts()', async () => {
    const accounts = await wallet.getAccounts()

    expect(accounts.length).toBe(1)
    expect(eqAddress(accounts[0], testAddress)).toBe(true)
  })

  it('hasAccount()', async () => {
    expect(wallet.hasAccount(testAddress)).toBeTruthy()
  })

  it('signPersonalMessage()', async () => {
    const hexString = ensureLeading0x(Buffer.from('hello').toString('hex'))
    const signedMessage = await wallet.signPersonalMessage(testAddress, hexString)

    expect(signedMessage).not.toBeUndefined()
    const valid = verifySignature(hexString, signedMessage, testAddress)
    expect(valid).toBeTruthy()
  })

  it('signTypedData()', async () => {
    const signedMessage = await wallet.signTypedData(testAddress, TYPED_DATA)

    expect(signedMessage).not.toBeUndefined()
    const valid = verifyEIP712TypedDataSigner(TYPED_DATA, signedMessage, testAddress)
    expect(valid).toBeTruthy()
  })

  it('signTransaction()', async () => {
    const tx = {
      from: testAddress,
      to: privateKeyToAddress('1234567890abcdef1234567890abcdef1234567890abcdef1234567890abbdef'),
      chainId: CHAIN_ID,
      value: Web3.utils.toWei('1', 'ether'),
      nonce: 0,
      gas: '10',
      gasPrice: '99',
      feeCurrency: '0x',
      gatewayFeeRecipient: '0x',
      gatewayFee: '0x',
      data: '0xabcdef',
    }
    const signedTx = await wallet.signTransaction(tx)
    const [, recoveredSigner] = recoverTransaction(signedTx.raw)
    console.log(recoveredSigner)
    expect(eqAddress(recoveredSigner, testAddress)).toBe(true)
  })

  it('decrypt()', async () => {
    const message = 'Hello'
    const encrypted = ECIES.Encrypt(
      Buffer.from(trimLeading0x(privateKeyToPublicKey(testPrivateKey)), 'hex'),
      Buffer.from(message)
    )

    const decrypted = await wallet.decrypt(testAddress, encrypted)
    expect(decrypted.toString()).toBe(message)
  })

  it('computeSharedSecret()', async () => {
    const otherPubKey = privateKeyToPublicKey(
      '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abbdef'
    )
    const sharedSecret = await wallet.computeSharedSecret(testAddress, otherPubKey)
    expect(sharedSecret).toEqual(computeECDHSecret(testPrivateKey, otherPubKey))
  })

  it.skip('sendTransaction', () => {})
})
