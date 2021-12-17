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
import { WalletConnectWallet } from '.'
import { getTestWallet, testAddress, testPrivateKey } from './test/in-memory-wallet'
import { MockWalletConnectClient } from './test/mock-client'

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
const testTx = {
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
const decryptMessage = 'Hello'

const walletConnectBridge = process.env.WALLET_CONNECT_BRIDGE
const E2E = !!walletConnectBridge

describe('WalletConnectWallet tests', () => {
  let wallet: WalletConnectWallet
  let testWallet: any

  wallet = new WalletConnectWallet({
    init: {
      relayProvider: walletConnectBridge,
      logger: 'error',
    },
    connect: {
      metadata: {
        name: 'Example Dapp',
        description: 'Example Dapp for WalletConnect',
        url: 'https://example.org/',
        icons: [],
      },
    },
  })

  if (E2E) {
    testWallet = getTestWallet()
  } else {
    jest
      .spyOn<any, any>(wallet, 'getWalletConnectClient')
      .mockImplementation(() => new MockWalletConnectClient())
  }

  beforeAll(async () => {
    const uri = await wallet.getUri()
    await testWallet?.init(uri)
    await wallet.init()
  }, 10000)

  afterAll(async () => {
    await wallet.close()
    await testWallet?.close()

    // TODO: bug in WalletConnect V2
    setTimeout(() => {
      process.exit(0)
    }, 10000)
  }, 10000)

  it('getAccounts()', async () => {
    const accounts = await wallet.getAccounts()
    expect(accounts.length).toBe(1)
    expect(eqAddress(accounts[0], testAddress)).toBe(true)
  })

  describe('operations with an unknown address', () => {
    const unknownAddress = privateKeyToAddress(
      '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abbdef'
    )

    function assertInvalidAddress(e: Error) {
      // dealing with checksum addresses
      expect(e.message.toLowerCase()).toBe(`Could not find address ${unknownAddress}`.toLowerCase())
    }

    it('hasAccount()', async () => {
      expect(wallet.hasAccount(unknownAddress)).toBeFalsy()
    })

    it('signPersonalMessage()', async () => {
      const hexString = ensureLeading0x(Buffer.from('hello').toString('hex'))
      try {
        await wallet.signPersonalMessage(unknownAddress, hexString)
        throw new Error('Expected exception to be thrown')
      } catch (e: any) {
        assertInvalidAddress(e)
      }
    })

    it('signTypedData()', async () => {
      try {
        await wallet.signTypedData(unknownAddress, TYPED_DATA)
        throw new Error('Expected exception to be thrown')
      } catch (e: any) {
        assertInvalidAddress(e)
      }
    })

    it('signTransaction()', async () => {
      try {
        await wallet.signTransaction({
          ...testTx,
          from: unknownAddress,
        })
        throw new Error('Expected exception to be thrown')
      } catch (e: any) {
        assertInvalidAddress(e)
      }
    })

    it('decrypt()', async () => {
      const encrypted = ECIES.Encrypt(
        Buffer.from(trimLeading0x(privateKeyToPublicKey(testPrivateKey)), 'hex'),
        Buffer.from(decryptMessage)
      )

      try {
        await wallet.decrypt(unknownAddress, encrypted)
        throw new Error('Expected exception to be thrown')
      } catch (e: any) {
        assertInvalidAddress(e)
      }
    })

    it('computeSharedSecret()', async () => {
      const otherPubKey = privateKeyToPublicKey(
        '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abbdef'
      )
      try {
        await wallet.computeSharedSecret(unknownAddress, otherPubKey)
        throw new Error('Expected exception to be thrown')
      } catch (e: any) {
        assertInvalidAddress(e)
      }
    })
  })

  describe('with a known address', () => {
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
      const signedTx = await wallet.signTransaction(testTx)
      const [, recoveredSigner] = recoverTransaction(signedTx.raw)
      expect(eqAddress(recoveredSigner, testAddress)).toBe(true)
    })

    it('decrypt()', async () => {
      const encrypted = ECIES.Encrypt(
        Buffer.from(trimLeading0x(privateKeyToPublicKey(testPrivateKey)), 'hex'),
        Buffer.from(decryptMessage)
      )

      const decrypted = await wallet.decrypt(testAddress, encrypted)
      expect(decrypted.toString()).toBe(decryptMessage)
    })

    it('computeSharedSecret()', async () => {
      const otherPubKey = privateKeyToPublicKey(
        '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abbdef'
      )
      const sharedSecret = await wallet.computeSharedSecret(testAddress, otherPubKey)
      expect(sharedSecret).toEqual(computeECDHSecret(testPrivateKey, otherPubKey))
    })
  })
})
