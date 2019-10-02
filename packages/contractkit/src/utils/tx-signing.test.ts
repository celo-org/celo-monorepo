import debugFactory from 'debug'
import * as util from 'util'
import Web3 from 'web3'
import { Provider } from 'web3/providers'
import { ContractKit } from '../kit'
import { generateAccountAddressFromPrivateKey } from '../providers/celo-private-keys-subprovider'
import { CeloProvider } from '../providers/celo-provider'
import { testWithGanache } from '../test-utils/ganache-test'
import { recoverTransaction } from './signing-utils'
import { CeloTx } from './tx-signing'

const debug = debugFactory('kit:txtest:sign')

// Random private keys
const PRIVATE_KEY1 = '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
const ACCOUNT_ADDRESS1 = generateAccountAddressFromPrivateKey(PRIVATE_KEY1)
const PRIVATE_KEY2 = '1234567890abcdef1234567890abcdef1234567890abcdef1234567890fdeccc'
const ACCOUNT_ADDRESS2 = generateAccountAddressFromPrivateKey(PRIVATE_KEY2)

debug(`Private key 1: ${PRIVATE_KEY1}`)
debug(`Account Address 1: ${ACCOUNT_ADDRESS1}`)
debug(`Private key 2: ${PRIVATE_KEY2}`)
debug(`Account Address 2: ${ACCOUNT_ADDRESS2}`)

async function verifyLocalSigning(
  web3: Web3,
  from: string,
  to: string,
  nonce?: number,
  gas?: number,
  gasPrice?: number,
  gasCurrency?: string,
  gasFeeRecipient?: string,
  data?: string
): Promise<void> {
  const amountInWei: string = Web3.utils.toWei('1', 'ether')
  debug('Signer Testing using Account: %s', from)
  const celoTransaction: CeloTx = {
    from,
    to,
    nonce,
    value: amountInWei,
    gas,
    gasPrice,
    gasCurrency,
    gasFeeRecipient,
    data,
  }
  const signedTransaction = await web3.eth.signTransaction(celoTransaction)
  debug('Singer Testing: Signed transaction %o', signedTransaction)
  const rawTransaction: string = signedTransaction.raw
  const [retrievedCeloTransaction, recoveredSigner] = recoverTransaction(rawTransaction)
  debug('Transaction was signed by "%s", recovered signer is "%s"', from, recoveredSigner)
  expect(recoveredSigner).toEqual(from)

  if (nonce != null) {
    debug(`Checking nonce actual ${retrievedCeloTransaction.nonce} expected ${nonce}`)
    expect(retrievedCeloTransaction.nonce).toEqual(nonce)
  }
  if (gas != null) {
    debug(`Checking gas actual ${retrievedCeloTransaction.gas} expected ${gas}`)
    expect(retrievedCeloTransaction.gas).toEqual(gas)
  }
  if (gasPrice != null) {
    debug(`Checking gas price actual ${retrievedCeloTransaction.gasPrice} expected ${gasPrice}`)
    expect(retrievedCeloTransaction.gasPrice).toEqual(gasPrice)
  }
  if (gasCurrency != null) {
    debug(
      `Checking gas Currency actual ${retrievedCeloTransaction.gasCurrency} expected ${gasCurrency}`
    )
    expect(retrievedCeloTransaction.gasPrice).toEqual(gasPrice)
  }
  if (gasFeeRecipient != null) {
    debug(
      'Checking gas fee recipient actual ' +
        `${retrievedCeloTransaction.gasFeeRecipient} expected ${gasFeeRecipient}`
    )
    expect(retrievedCeloTransaction.gasPrice).toEqual(gasPrice)
  }
  if (data != null) {
    debug(`Checking data actual ${retrievedCeloTransaction.data} expected ${data}`)
    expect(retrievedCeloTransaction.gasPrice).toEqual(gasPrice)
  }
}

async function verifyLocalSigningInAllPermutations(
  web3: Web3,
  from: string,
  to: string
): Promise<void> {
  const nonce = 0
  const badNonce = 100
  const gas = 10
  const gasPrice = 99
  const gasCurrency = '0x124356'
  const gasFeeRecipient = '0x1234'
  const data = '0xabcdef'

  // Test all possible combinations for rigor.
  for (let i = 1; i <= 64; i++) {
    debug(`verifyLocalSigningInAllPermutations test case ${i}`)
    await verifyLocalSigning(
      web3,
      from,
      to,
      i % 2 === 0 ? nonce : undefined,
      i % 4 === 0 ? gas : undefined,
      i % 8 === 0 ? gasPrice : undefined,
      i % 16 === 0 ? gasCurrency : undefined,
      i % 32 === 0 ? gasFeeRecipient : undefined,
      i % 64 === 0 ? data : undefined
    )
  }

  // A special case.
  // An incorrect nonce  will only work, if no implict calls to estimate gas are required.
  await verifyLocalSigning(web3, from, to, badNonce, gas, gasPrice)
}

testWithGanache('Transaction Utils', (web3: Web3) => {
  let originalProvider: Provider
  beforeEach(() => {
    originalProvider = web3.currentProvider
  })
  afterEach(() => {
    if (web3.currentProvider instanceof CeloProvider) {
      ;(web3.currentProvider as CeloProvider).stop()
    } else {
      console.log(util.inspect(web3.currentProvider))
    }
    // Restore original provider
    web3.currentProvider = originalProvider
  })

  describe('Signer Testing with single local account and pay gas in Celo Gold', () => {
    it('Test1 should be able to sign and get the signer back with single local account', async () => {
      jest.setTimeout(20 * 1000)
      new ContractKit(web3).addAccount(PRIVATE_KEY1)
      await verifyLocalSigningInAllPermutations(web3, ACCOUNT_ADDRESS1, ACCOUNT_ADDRESS2)
    })
  })

  describe('Signer Testing with multiple local accounts', () => {
    it('Test2 should be able to sign with first account and get the signer back with multiple local accounts', async () => {
      jest.setTimeout(20 * 1000)
      new ContractKit(web3).addAccount(PRIVATE_KEY1)
      new ContractKit(web3).addAccount(PRIVATE_KEY2)
      await verifyLocalSigningInAllPermutations(web3, ACCOUNT_ADDRESS1, ACCOUNT_ADDRESS2)
    })

    it('Test3 should be able to sign with second account and get the signer back with multiple local accounts', async () => {
      jest.setTimeout(20 * 1000)
      new ContractKit(web3).addAccount(PRIVATE_KEY1)
      new ContractKit(web3).addAccount(PRIVATE_KEY2)
      await verifyLocalSigningInAllPermutations(web3, ACCOUNT_ADDRESS2, ACCOUNT_ADDRESS1)
    })
  })
})
