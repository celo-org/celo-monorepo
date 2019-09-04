import debugFactory from 'debug'
import Web3 from 'web3'
import { testWithGanache } from '../test-utils/ganache-test'
import { recoverTransaction } from './signing-utils'
import { CeloTx, getRawTransaction } from './tx-signing'
import { addLocalAccount } from './web3-utils'

// Run this test with --forceExit on completion.
// jest src/utils/tx-signing.test.ts --forceExit

const debug = debugFactory('kit:txtest:sign')

// A random private key
const PRIVATE_KEY = '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
const accountAddress = generateAccountAddressFromPrivateKey(PRIVATE_KEY)

function generateAccountAddressFromPrivateKey(privateKey: string): string {
  if (!privateKey.toLowerCase().startsWith('0x')) {
    privateKey = '0x' + privateKey
  }
  // @ts-ignore-next-line
  return new Web3.modules.Eth().accounts.privateKeyToAccount(privateKey).address
}

testWithGanache('Transaction Utils', (web3: Web3) => {
  // describe('Transaction Utils', () => {
  describe.skip('Signer Testing', () => {
    it('should be able to sign and get the signer back', async () => {
      jest.setTimeout(20 * 1000)
      await addLocalAccount(web3, PRIVATE_KEY)
      debug('Signer Testing using Account: %s', accountAddress)
      const gasPrice = await web3.eth.getGasPrice()
      debug('Signer Testing, gas price is %s', gasPrice)
      const from = accountAddress
      const to = accountAddress
      const amountInWei: string = Web3.utils.toWei('1', 'ether')
      const gasFees: string = Web3.utils.toWei('1', 'mwei')
      debug('Signer Testing, getting nonce for %s...', from)
      const nonce = await web3.eth.getTransactionCount(from)
      debug('Signer Testing, nonce is %s', nonce)

      const celoTransaction: CeloTx = {
        nonce,
        from,
        to,
        value: amountInWei,
        gas: gasFees,
        gasPrice: gasPrice.toString(),
      }
      const rawTransaction: string = await getRawTransaction(web3, celoTransaction)
      const recoveredSigner = recoverTransaction(rawTransaction)
      debug('Transaction was signed by "%s", recovered signer is "%s"', from, recoveredSigner)
      expect(recoveredSigner).toEqual(from)
    })
  })
})
