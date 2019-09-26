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

async function verifyLocalSigning(web3: Web3, from: string, to: string): Promise<void> {
  const amountInWei: string = Web3.utils.toWei('1', 'ether')
  const gasFees: string = Web3.utils.toWei('1', 'mwei')
  debug('Signer Testing using Account: %s', from)
  const celoTransaction: CeloTx = {
    from,
    to,
    value: amountInWei,
    gas: gasFees,
  }
  const signedTransaction = await web3.eth.signTransaction(celoTransaction)
  debug('Singer Testing: Signed transaction %o', signedTransaction)
  const rawTransaction: string = signedTransaction.raw
  const recoveredSigner = recoverTransaction(rawTransaction)
  debug('Transaction was signed by "%s", recovered signer is "%s"', from, recoveredSigner)
  expect(recoveredSigner).toEqual(from)
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

  describe('Signer Testing with single local account', () => {
    it('Test1 should be able to sign and get the signer back with single local account', async () => {
      jest.setTimeout(20 * 1000)
      addLocalAccount(web3, PRIVATE_KEY1)
      await verifyLocalSigning(web3, ACCOUNT_ADDRESS1, ACCOUNT_ADDRESS2)
    })
  })

  describe('Signer Testing with multiple local accounts', () => {
    it('Test2 should be able to sign with first account and get the signer back with multiple local accounts', async () => {
      jest.setTimeout(20 * 1000)
      addLocalAccount(web3, PRIVATE_KEY1)
      addLocalAccount(web3, PRIVATE_KEY2)
      await verifyLocalSigning(web3, ACCOUNT_ADDRESS1, ACCOUNT_ADDRESS2)
    })

    it('Test3 should be able to sign with second account and get the signer back with multiple local accounts', async () => {
      jest.setTimeout(20 * 1000)
      addLocalAccount(web3, PRIVATE_KEY1)
      addLocalAccount(web3, PRIVATE_KEY2)
      await verifyLocalSigning(web3, ACCOUNT_ADDRESS2, ACCOUNT_ADDRESS1)
    })
  })
})
