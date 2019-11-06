import debugFactory from 'debug'
import * as util from 'util'
import Web3 from 'web3'
import { Provider } from 'web3/providers'
import { generateAccountAddressFromPrivateKey } from '../providers/celo-private-keys-subprovider'
import { CeloProvider } from '../providers/celo-provider'
import { testWithGanache } from '../test-utils/ganache-test'
import { recoverTransaction } from './signing-utils'
import { CeloTx } from './tx-signing'
import { addLocalAccount } from './web3-utils'

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

async function verifyLocalSigning(web3: Web3, celoTransaction: CeloTx): Promise<void> {
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
  expect(recoveredSigner.toLowerCase()).toEqual(celoTransaction.from!.toLowerCase())

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
  if (celoTransaction.gasCurrency != null) {
    debug(
      'Checking gas Currency actual %o expected %o',
      signedCeloTransaction.gasCurrency,
      celoTransaction.gasCurrency
    )
    expect(signedCeloTransaction.gasCurrency!.toLowerCase()).toEqual(
      celoTransaction.gasCurrency.toLowerCase()
    )
  }
  if (celoTransaction.gasFeeRecipient != null) {
    debug(
      'Checking gas fee recipient actual ' +
        `${signedCeloTransaction.gasFeeRecipient} expected ${celoTransaction.gasFeeRecipient}`
    )
    expect(signedCeloTransaction.gasFeeRecipient!.toLowerCase()).toEqual(
      celoTransaction.gasFeeRecipient.toLowerCase()
    )
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
  const gasCurrency = '0x124356'
  const gasFeeRecipient = '0x1234'
  const data = '0xabcdef'

  // Test all possible combinations for rigor.
  for (let i = 0; i < 128; i++) {
    const celoTransaction: CeloTx = {
      from,
      to,
      value: amountInWei,
      nonce: i % 2 === 0 ? nonce : undefined,
      gas: i % 4 === 0 ? gas : undefined,
      gasPrice: i % 8 === 0 ? gasPrice : undefined,
      gasCurrency: i % 16 === 0 ? gasCurrency : undefined,
      gasFeeRecipient: i % 32 === 0 ? gasFeeRecipient : undefined,
      data: i % 64 === 0 ? data : undefined,
    }
    await verifyLocalSigning(web3, celoTransaction)
  }

  // A special case.
  // An incorrect nonce  will only work, if no implict calls to estimate gas are required.
  await verifyLocalSigning(web3, { from, to, nonce: badNonce, gas, gasPrice })
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
      jest.setTimeout(60 * 1000)
      addLocalAccount(web3, PRIVATE_KEY1)
      await verifyLocalSigningInAllPermutations(web3, ACCOUNT_ADDRESS1, ACCOUNT_ADDRESS2)
    })
  })

  describe('Signer Testing with multiple local accounts', () => {
    it('Test2 should be able to sign with first account and get the signer back with multiple local accounts', async () => {
      jest.setTimeout(60 * 1000)
      addLocalAccount(web3, PRIVATE_KEY1)
      addLocalAccount(web3, PRIVATE_KEY2)
      await verifyLocalSigningInAllPermutations(web3, ACCOUNT_ADDRESS1, ACCOUNT_ADDRESS2)
    })

    it('Test3 should be able to sign with second account and get the signer back with multiple local accounts', async () => {
      jest.setTimeout(60 * 1000)
      addLocalAccount(web3, PRIVATE_KEY1)
      addLocalAccount(web3, PRIVATE_KEY2)
      await verifyLocalSigningInAllPermutations(web3, ACCOUNT_ADDRESS2, ACCOUNT_ADDRESS1)
    })
  })
})
