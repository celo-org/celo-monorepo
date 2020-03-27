import { privateKeyToAddress } from '@celo/utils/lib/address'
import debugFactory from 'debug'
import Web3 from 'web3'
import { provider, Tx } from 'web3-core'
import { Callback, JsonRpcPayload, JsonRpcResponse } from 'web3-core-helpers'
import { CeloProvider } from '../providers/celo-provider'
import { recoverTransaction } from './signing-utils'

const debug = debugFactory('kit:txtest:sign')

// Random private keys
const PRIVATE_KEY1 = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
const ACCOUNT_ADDRESS1 = privateKeyToAddress(PRIVATE_KEY1)
const PRIVATE_KEY2 = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890fdeccc'
const ACCOUNT_ADDRESS2 = privateKeyToAddress(PRIVATE_KEY2)

debug(`Private key 1: ${PRIVATE_KEY1}`)
debug(`Account Address 1: ${ACCOUNT_ADDRESS1}`)
debug(`Private key 2: ${PRIVATE_KEY2}`)
debug(`Account Address 2: ${ACCOUNT_ADDRESS2}`)

async function verifyLocalSigning(web3: Web3, celoTransaction: Tx): Promise<void> {
  debug('Signer Testing using Account: %s', celoTransaction.from)
  const signedTransaction = await web3.eth.signTransaction(celoTransaction)
  debug('Singer Testing: Signed transaction %o', signedTransaction)
  const rawTransaction: string = signedTransaction.raw
  const [signedCeloTransaction, recoveredSigner] = recoverTransaction(rawTransaction)
  debug(
    'Transaction was signed by "%s", recovered signer is "%s"',
    celoTransaction.from,
    recoveredSigner
  )
  expect(recoveredSigner.toLowerCase()).toEqual(celoTransaction.from!.toString().toLowerCase())

  if (celoTransaction.nonce != null) {
    debug(
      'Checking nonce actual: %o expected: %o',
      signedCeloTransaction.nonce,
      parseInt(celoTransaction.nonce.toString(), 16)
    )
    expect(signedCeloTransaction.nonce).toEqual(parseInt(celoTransaction.nonce.toString(), 16))
  }
  if (celoTransaction.gas != null) {
    debug(
      'Checking gas actual %o expected %o',
      signedCeloTransaction.gas,
      parseInt(celoTransaction.gas.toString(), 16)
    )
    expect(signedCeloTransaction.gas).toEqual(parseInt(celoTransaction.gas.toString(), 16))
  }
  if (celoTransaction.gasPrice != null) {
    debug(
      'Checking gas price actual %o expected %o',
      signedCeloTransaction.gasPrice,
      parseInt(celoTransaction.gasPrice.toString(), 16)
    )
    expect(signedCeloTransaction.gasPrice).toEqual(
      parseInt(celoTransaction.gasPrice.toString(), 16)
    )
  }
  if (celoTransaction.feeCurrency != null) {
    debug(
      'Checking fee currency actual %o expected %o',
      signedCeloTransaction.feeCurrency,
      celoTransaction.feeCurrency
    )
    expect(signedCeloTransaction.feeCurrency!.toLowerCase()).toEqual(
      celoTransaction.feeCurrency.toLowerCase()
    )
  }
  if (celoTransaction.gatewayFeeRecipient != null) {
    debug(
      'Checking gateway fee recipient actual ' +
        `${signedCeloTransaction.gatewayFeeRecipient} expected ${celoTransaction.gatewayFeeRecipient}`
    )
    expect(signedCeloTransaction.gatewayFeeRecipient!.toLowerCase()).toEqual(
      celoTransaction.gatewayFeeRecipient.toLowerCase()
    )
  }
  if (celoTransaction.gatewayFee != null) {
    debug(
      'Checking gateway fee value actual %o expected %o',
      signedCeloTransaction.gatewayFee,
      celoTransaction.gatewayFee.toString()
    )
    expect(signedCeloTransaction.gatewayFee).toEqual(celoTransaction.gatewayFee.toString())
  }
  if (celoTransaction.data != null) {
    debug(`Checking data actual ${signedCeloTransaction.data} expected ${celoTransaction.data}`)
    expect(signedCeloTransaction.data!.toLowerCase()).toEqual(celoTransaction.data.toLowerCase())
  }
}

async function verifyLocalSigningInAllPermutations(
  web3: Web3,
  from: string,
  to: string
): Promise<void> {
  const amountInWei: string = Web3.utils.toWei('1', 'ether')
  const nonce = 0
  const badNonce = 100
  const gas = 10
  const gasPrice = 99
  const feeCurrency = '0x124356'
  const gatewayFeeRecipient = '0x1234'
  const gatewayFee = '0x5678'
  const data = '0xabcdef'
  const chainId = 1

  // tslint:disable:no-bitwise
  // Test all possible combinations for rigor.
  for (let i = 0; i < 16; i++) {
    const celoTransaction: Tx = {
      from,
      to,
      value: amountInWei,
      nonce,
      gasPrice,
      chainId,
      gas,
      feeCurrency: i & 1 ? feeCurrency : undefined,
      gatewayFeeRecipient: i & 2 ? gatewayFeeRecipient : undefined,
      gatewayFee: i & 4 ? gatewayFee : undefined,
      data: i & 8 ? data : undefined,
    }
    await verifyLocalSigning(web3, celoTransaction)
  }
  // tslint:enable:no-bitwise

  // A special case.
  // An incorrect nonce  will only work, if no implict calls to estimate gas are required.
  await verifyLocalSigning(web3, { from, to, nonce: badNonce, gas, gasPrice, chainId })
}

// These tests verify the signTransaction WITHOUT the ParamsPopulator
describe('Transaction Utils', () => {
  // only needed for the eth_coinbase rcp call
  let celoProvider: CeloProvider
  const mockProvider: provider = {
    host: '',
    connected: true,
    send: (payload: JsonRpcPayload, callback: Callback<JsonRpcResponse>): void => {
      if (payload.method === 'eth_coinbase') {
        const response: JsonRpcResponse = {
          jsonrpc: payload.jsonrpc,
          id: Number(payload.id),
          result: '0xc94770007dda54cF92009BFF0dE90c06F603a09f',
        }
        callback(null, response)
      } else {
        callback(new Error(payload.method))
      }
    },
    supportsSubscriptions: (): boolean => true,
    disconnect: (): boolean => true,
  }
  const web3: Web3 = new Web3()

  beforeEach(() => {
    celoProvider = new CeloProvider(mockProvider)
    web3.setProvider(celoProvider as any)
  })

  afterEach(() => {
    if (web3.currentProvider instanceof CeloProvider) {
      web3.currentProvider.stop()
    }
  })

  describe('Signer Testing with single local account and pay gas in Celo Gold', () => {
    it('Test1 should be able to sign and get the signer back with single local account', async () => {
      jest.setTimeout(60 * 1000)
      celoProvider.addAccount(PRIVATE_KEY1)
      await verifyLocalSigningInAllPermutations(web3, ACCOUNT_ADDRESS1, ACCOUNT_ADDRESS2)
    })
  })

  describe('Signer Testing with multiple local accounts', () => {
    it('Test2 should be able to sign with first account and get the signer back with multiple local accounts', async () => {
      jest.setTimeout(60 * 1000)
      celoProvider.addAccount(PRIVATE_KEY1)
      celoProvider.addAccount(PRIVATE_KEY2)
      await verifyLocalSigningInAllPermutations(web3, ACCOUNT_ADDRESS1, ACCOUNT_ADDRESS2)
    })

    it('Test3 should be able to sign with second account and get the signer back with multiple local accounts', async () => {
      jest.setTimeout(60 * 1000)
      celoProvider.addAccount(PRIVATE_KEY1)
      celoProvider.addAccount(PRIVATE_KEY2)
      await verifyLocalSigningInAllPermutations(web3, ACCOUNT_ADDRESS2, ACCOUNT_ADDRESS1)
    })
  })
})
