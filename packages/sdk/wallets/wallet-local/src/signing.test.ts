import {
  Callback,
  CeloTx,
  Connection,
  JsonRpcPayload,
  JsonRpcResponse,
  Provider,
} from '@celo/connect'
import { privateKeyToAddress } from '@celo/utils/lib/address'
import { recoverTransaction } from '@celo/wallet-base'
import debugFactory from 'debug'
import Web3 from 'web3'
import { LocalWallet } from './local-wallet'

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

// These tests verify the signTransaction WITHOUT the ParamsPopulator
describe('Transaction Utils', () => {
  // only needed for the eth_coinbase rcp call
  let connection: Connection
  let web3: Web3
  const mockProvider: Provider = {
    send: (payload: JsonRpcPayload, callback: Callback<JsonRpcResponse>): void => {
      if (payload.method === 'eth_coinbase') {
        const response: JsonRpcResponse = {
          jsonrpc: payload.jsonrpc,
          id: Number(payload.id),
          result: '0xc94770007dda54cF92009BFF0dE90c06F603a09f',
        }
        callback(null, response)
      } else if (payload.method === 'eth_gasPrice') {
        const response: JsonRpcResponse = {
          jsonrpc: payload.jsonrpc,
          id: Number(payload.id),
          result: '0x09184e72a000',
        }
        callback(null, response)
      } else {
        callback(new Error(payload.method))
      }
    },
  }

  const setupConnection = async () => {
    web3 = new Web3()
    web3.setProvider(mockProvider as any)
    connection = new Connection(web3)
    connection.wallet = new LocalWallet()
  }
  async function verifyLocalSigning(celoTransaction: CeloTx): Promise<void> {
    let recoveredSigner: string
    let signedCeloTransaction: CeloTx
    beforeAll(async () => {
      const signedTransaction = await web3.eth.signTransaction(celoTransaction)
      const recovery = recoverTransaction(signedTransaction.raw)
      signedCeloTransaction = recovery[0]
      recoveredSigner = recovery[1]
    })

    test('Signer matches recovered signer', () => {
      expect(recoveredSigner.toLowerCase()).toEqual(celoTransaction.from!.toString().toLowerCase())
    })

    test('Checking nonce', () => {
      if (celoTransaction.nonce != null) {
        expect(signedCeloTransaction.nonce).toEqual(parseInt(celoTransaction.nonce.toString(), 16))
      }
    })

    test('Checking gas', () => {
      if (celoTransaction.gas != null) {
        expect(signedCeloTransaction.gas).toEqual(parseInt(celoTransaction.gas.toString(), 16))
      }
    })
    test('Checking gas price', () => {
      if (celoTransaction.gasPrice != null) {
        expect(signedCeloTransaction.gasPrice).toEqual(
          parseInt(celoTransaction.gasPrice.toString(), 16)
        )
      }
    })
    test('Checking maxFeePerGas', () => {
      if (celoTransaction.maxFeePerGas != null) {
        expect(signedCeloTransaction.maxFeePerGas).toEqual(
          parseInt(celoTransaction.maxFeePerGas.toString(), 16)
        )
      }
    })
    test('Checking maxPriorityFeePerGas', () => {
      if (celoTransaction.maxPriorityFeePerGas != null) {
        debug(
          'Checking gas price',
          signedCeloTransaction.maxPriorityFeePerGas,
          parseInt(celoTransaction.maxPriorityFeePerGas.toString(), 16)
        )
        expect(signedCeloTransaction.maxPriorityFeePerGas).toEqual(
          parseInt(celoTransaction.maxPriorityFeePerGas.toString(), 16)
        )
      }
    })
    test('Checking feeCurrency', () => {
      if (celoTransaction.feeCurrency != null) {
        debug(
          'Checking fee currency',
          signedCeloTransaction.feeCurrency,
          celoTransaction.feeCurrency
        )
        expect(signedCeloTransaction.feeCurrency!.toLowerCase()).toEqual(
          celoTransaction.feeCurrency.toLowerCase()
        )
      }
    })
    test('gatewayFeeRecipient', () => {
      if (celoTransaction.gatewayFeeRecipient != null) {
        debug(
          'Checking gateway fee recipient actual ' +
            `${signedCeloTransaction.gatewayFeeRecipient} expected ${celoTransaction.gatewayFeeRecipient}`
        )
        expect(signedCeloTransaction.gatewayFeeRecipient!.toLowerCase()).toEqual(
          celoTransaction.gatewayFeeRecipient.toLowerCase()
        )
      }
    })
    test('Checking gateway fee value', () => {
      if (celoTransaction.gatewayFee != null) {
        debug(
          'Checking gateway fee value',
          signedCeloTransaction.gatewayFee,
          celoTransaction.gatewayFee.toString()
        )
        expect(signedCeloTransaction.gatewayFee).toEqual(celoTransaction.gatewayFee.toString())
      }
    })
    test('Checking data', () => {
      if (celoTransaction.data != null) {
        debug(`Checking data actual ${signedCeloTransaction.data} expected ${celoTransaction.data}`)
        expect(signedCeloTransaction.data!.toLowerCase()).toEqual(
          celoTransaction.data.toLowerCase()
        )
      }
    })
  }

  async function verifyLocalSigningInAllPermutations(from: string, to: string): Promise<void> {
    const amountInWei: string = Web3.utils.toWei('1', 'ether')
    const nonce = 0
    const badNonce = 100
    const gas = 10
    const gasPrice = 99
    const feeCurrency = ACCOUNT_ADDRESS1
    const gatewayFeeRecipient = ACCOUNT_ADDRESS2
    const gatewayFee = '0x5678'
    const data = '0xabcdef'
    const chainId = 1

    // tslint:disable:no-bitwise
    // Test all possible combinations for rigor.
    for (let i = 0; i < 16; i++) {
      const celoTransaction: CeloTx = {
        from,
        to,
        value: amountInWei,
        nonce,
        gasPrice: i % 2 === 0 ? gasPrice : undefined,
        maxFeePerGas: i % 2 === 1 ? gasPrice : undefined,
        maxPriorityFeePerGas: i % 2 === 1 ? gasPrice : undefined,
        chainId,
        gas,
        feeCurrency: i % 3 === 0 ? feeCurrency : undefined,
        gatewayFeeRecipient: i % 7 === 0 ? gatewayFeeRecipient : undefined,
        gatewayFee: i % 7 === 0 ? gatewayFee : undefined,
        data: i & 8 ? data : undefined,
      }
      describe(transactionDescription(celoTransaction), () => {
        verifyLocalSigning(celoTransaction)
      })
    }

    function transactionDescription(celoTransaction: CeloTx) {
      const description: string[] = []
      if (celoTransaction.gasPrice != undefined) {
        description.push('Testing Legacy with')
      } else if (
        (celoTransaction.maxFeePerGas != undefined && celoTransaction.feeCurrency != undefined) ||
        celoTransaction.gatewayFeeRecipient !== undefined
      ) {
        description.push('Testing CIP42 with')
      } else {
        console.warn(
          'FEE DATA',
          celoTransaction.maxFeePerGas,
          celoTransaction.maxPriorityFeePerGas,
          celoTransaction.gasPrice
        )
        description.push('Testing EIP1559 with')
      }
      if (celoTransaction.data != undefined) {
        description.push(`data: ${celoTransaction.data}`)
      }

      if (celoTransaction.feeCurrency != undefined) {
        description.push(`fee currency: ${celoTransaction.feeCurrency}`)
      }

      if (celoTransaction.gatewayFeeRecipient != undefined) {
        description.push(`gateway fee recipient: ${celoTransaction.gatewayFeeRecipient}`)
      }
      if (celoTransaction.gatewayFee != undefined) {
        description.push(`gateway fee: ${celoTransaction.gatewayFee}`)
      }

      return description.join(' ')
    }
    // tslint:enable:no-bitwise

    // A special case.
    // An incorrect nonce  will only work, if no implict calls to estimate gas are required.
    describe('Testing with bad nonce', () => {
      verifyLocalSigning({ from, to, nonce: badNonce, gas, gasPrice, chainId })
    })
  }

  describe('Signer Testing with single local account and pay gas in CELO', () => {
    describe('Test1 should be able to sign and get the signer back with single local account', () => {
      beforeAll(async () => {
        await setupConnection()
        // jest.setTimeout(60 * 1000)
        connection.addAccount(PRIVATE_KEY1)
      })
      verifyLocalSigningInAllPermutations(ACCOUNT_ADDRESS1, ACCOUNT_ADDRESS2)
      afterAll(() => connection.stop())
    })
  })

  describe('Signer Testing with multiple local accounts', () => {
    describe('Test2 should be able to sign with first account and get the signer back with multiple local accounts', () => {
      beforeAll(async () => {
        await setupConnection()
        // jest.setTimeout(60 * 1000)
        connection.addAccount(PRIVATE_KEY1)
        connection.addAccount(PRIVATE_KEY2)
      })
      verifyLocalSigningInAllPermutations(ACCOUNT_ADDRESS1, ACCOUNT_ADDRESS2)
      afterAll(() => connection.stop())
    })

    describe('Test3 should be able to sign with second account and get the signer back with multiple local accounts', () => {
      beforeAll(async () => {
        await setupConnection()
        // jest.setTimeout(60 * 1000)
        connection.addAccount(PRIVATE_KEY1)
        connection.addAccount(PRIVATE_KEY2)
      })
      verifyLocalSigningInAllPermutations(ACCOUNT_ADDRESS2, ACCOUNT_ADDRESS1)
      afterAll(() => connection.stop())
    })
  })
})
