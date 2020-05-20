import { testWithGanache } from '@celo/dev-utils/lib/ganache-test'
import { normalizeAddressWith0x, privateKeyToAddress } from '@celo/utils/src/address'
import { RpcWallet } from './rpc-wallet'

export const CHAIN_ID = 44378

// Sample data from the official EIP-712 example:
// https://github.com/ethereum/EIPs/blob/master/assets/eip-712/Example.js
export const TYPED_DATA = {
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

export const PRIVATE_KEY1 = '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
export const ACCOUNT_ADDRESS1 = normalizeAddressWith0x(privateKeyToAddress(PRIVATE_KEY1))
export const PRIVATE_KEY2 = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890fdeccc'
export const ACCOUNT_ADDRESS2 = normalizeAddressWith0x(privateKeyToAddress(PRIVATE_KEY2))

const PASSPHRASE = 'ce10'
const DURATION = 100

testWithGanache('rpc-wallet', (web3) => {
  const provider = web3.currentProvider
  const rpcWallet = new RpcWallet(provider)

  describe('with ganache web3 provider', () => {
    let web3Accounts: string[]

    beforeAll(async () => {
      web3Accounts = (await web3.eth.getAccounts()).map(normalizeAddressWith0x)
      await rpcWallet.init()
    })

    test('initalizes with default accounts', async () => {
      const accounts = rpcWallet.getAccounts()
      expect(accounts).toEqual(web3Accounts)
    })

    test('fails if you add an invalid private key', async () => {
      try {
        await rpcWallet.addAccount('this is not a valid private key', PASSPHRASE)
        throw new Error('Expected exception to be thrown')
      } catch (e) {
        expect(e.message).toBe('private key length is invalid')
      }
    })

    test('succeeds if you add a private key without 0x', async () => {
      await rpcWallet.addAccount(PRIVATE_KEY1, PASSPHRASE)
      expect(rpcWallet.hasAccount(ACCOUNT_ADDRESS1)).toBeTruthy()
    })

    test('fails if you add a private key twice', async () => {
      try {
        await rpcWallet.addAccount(PRIVATE_KEY1, PASSPHRASE)
        throw new Error('Expected exception to be thrown')
      } catch (e) {
        expect(e.message).toBe(`RpcWallet: account already exists`)
      }
    })

    test('succeeds if you add a private key with 0x', async () => {
      await rpcWallet.addAccount(PRIVATE_KEY2, PASSPHRASE)
      expect(rpcWallet.hasAccount(ACCOUNT_ADDRESS2)).toBeTruthy()
    })

    describe('with added accounts', () => {
      test('all addresses can be retrieved', () => {
        expect(rpcWallet.getAccounts()).toEqual(
          web3Accounts.concat([ACCOUNT_ADDRESS1, ACCOUNT_ADDRESS2])
        )
      })

      describe('unlocking', () => {
        test('fails if you use an invalid passphrase', async () => {
          try {
            await rpcWallet.unlockAccount(ACCOUNT_ADDRESS1, 'wrong_passphrase', DURATION)
          } catch (e) {
            expect(e.message).toContain('RpcSigner unlock failed')
          }
        })
      })

      // TODO(yorke): ENABLE WHEN GANACHE SUPPORTS THESE METHODS PROPERLY
      // describe('signing', () => {
      //   describe('using a locked address', () => {
      //     const lockedAddress: string = ACCOUNT_ADDRESS2
      //     const celoTransaction: Tx = {
      //       from: lockedAddress,
      //       to: ACCOUNT_ADDRESS1,
      //       chainId: 2,
      //       value: web3.utils.toWei('1', 'ether'),
      //       nonce: 0,
      //       gas: '10',
      //       gasPrice: '99',
      //       feeCurrency: '0x124356',
      //       gatewayFeeRecipient: '0x1234',
      //       gatewayFee: '0x5678',
      //       data: '0xabcdef',
      //     }

      //     test('fails calling signTransaction', async () => {
      //       await expect(await rpcWallet.signTransaction(celoTransaction)).rejects.toThrowError()
      //     })

      //     test('fails calling signPersonalMessage', async () => {
      //       const hexStr: string = '0xa1'
      //       await expect(
      //         await rpcWallet.signPersonalMessage(lockedAddress, hexStr)
      //       ).rejects.toThrowError()
      //     })

      //     test('fails calling signTypedData', async () => {
      //       await expect(
      //         await rpcWallet.signTypedData(lockedAddress, TYPED_DATA)
      //       ).rejects.toThrowError()
      //     })
      //   })

      //   describe('using an unlocked address', () => {
      //     beforeAll(async () => {
      //       await rpcWallet.unlockAccount(ACCOUNT_ADDRESS1, PASSPHRASE, DURATION)
      //     })

      //     describe('when calling signTransaction', () => {
      //       let celoTransaction: Tx

      //       beforeEach(() => {
      //         celoTransaction = {
      //           from: ACCOUNT_ADDRESS1,
      //           to: ACCOUNT_ADDRESS2,
      //           chainId: CHAIN_ID,
      //           value: web3.utils.toWei('1', 'ether'),
      //           nonce: 0,
      //           gas: '10',
      //           gasPrice: '99',
      //           feeCurrency: '0x',
      //           gatewayFeeRecipient: '0x1234',
      //           gatewayFee: '0x5678',
      //           data: '0xabcdef',
      //         }
      //       })

      //       test('succeeds', async () => {
      //         await expect(
      //           await rpcWallet.signTransaction(celoTransaction)
      //         ).resolves.not.toBeUndefined()
      //       })

      //       test('with same signer', async () => {
      //         const signedTx: EncodedTransaction = await rpcWallet.signTransaction(celoTransaction)
      //         const [, recoveredSigner] = recoverTransaction(signedTx.raw)
      //         expect(normalizeAddressWith0x(recoveredSigner)).toBe(
      //           normalizeAddressWith0x(ACCOUNT_ADDRESS1)
      //         )
      //       })

      //       // https://github.com/ethereum/go-ethereum/blob/38aab0aa831594f31d02c9f02bfacc0bef48405d/rlp/decode.go#L664
      //       test('signature with 0x00 prefix is canonicalized', async () => {
      //         // This tx is carefully constructed to produce an S value with the first byte as 0x00
      //         const celoTransactionZeroPrefix = {
      //           from: ACCOUNT_ADDRESS1,
      //           to: ACCOUNT_ADDRESS2,
      //           chainId: CHAIN_ID,
      //           value: web3.utils.toWei('1', 'ether'),
      //           nonce: 65,
      //           gas: '10',
      //           gasPrice: '99',
      //           feeCurrency: '0x',
      //           gatewayFeeRecipient: '0x1234',
      //           gatewayFee: '0x5678',
      //           data: '0xabcdef',
      //         }

      //         const signedTx: EncodedTransaction = await rpcWallet.signTransaction(
      //           celoTransactionZeroPrefix
      //         )
      //         expect(signedTx.tx.s.startsWith('0x00')).toBeFalsy()
      //         const [, recoveredSigner] = recoverTransaction(signedTx.raw)
      //         expect(normalizeAddressWith0x(recoveredSigner)).toBe(
      //           normalizeAddressWith0x(ACCOUNT_ADDRESS1)
      //         )
      //       })
      //     })

      //     describe('when calling signPersonalMessage', () => {
      //       test('succeeds', async () => {
      //         const hexStr: string = ACCOUNT_ADDRESS2
      //         const signedMessage = await rpcWallet.signPersonalMessage(ACCOUNT_ADDRESS1, hexStr)
      //         expect(signedMessage).not.toBeUndefined()
      //         const valid = verifySignature(hexStr, signedMessage, ACCOUNT_ADDRESS1)
      //         expect(valid).toBeTruthy()
      //       })
      //     })

      //     describe('when calling signTypedData', () => {
      //       test('succeeds', async () => {
      //         const signedMessage = await rpcWallet.signTypedData(ACCOUNT_ADDRESS1, TYPED_DATA)
      //         expect(signedMessage).not.toBeUndefined()
      //         const valid = verifyEIP712TypedDataSigner(TYPED_DATA, signedMessage, ACCOUNT_ADDRESS1)
      //         expect(valid).toBeTruthy()
      //       })
      //     })
      //   })
      // })
    })
  })
})
