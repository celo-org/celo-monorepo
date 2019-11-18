import { BigNumber } from 'bignumber.js'
import { getGoldTokenAddress } from '../src/erc20-utils'
import { Logger, LogLevel } from '../src/logger'
import { recoverTransaction } from '../src/signing-utils'
import { getRawTransaction } from '../src/transaction-utils'
import { generateAccountAddressFromPrivateKey, getWeb3WithSigningAbilityForTesting } from './utils'

beforeAll(() => {
  Logger.setLogLevel(LogLevel.VERBOSE)
})

// A random private key
const privateKey = '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
const accountAddress = generateAccountAddressFromPrivateKey(privateKey)

describe('Transaction Utils V2', () => {
  describe('Signer Testing', () => {
    it('should be able to sign and get the signer back', async () => {
      jest.setTimeout(20 * 1000)
      const web3 = await getWeb3WithSigningAbilityForTesting(privateKey)
      Logger.debug('Signer Testing', `Testing using Account: ${accountAddress}`)
      const gasPrice = 1e11 // Note: "await web3.eth.getGasPrice()" deos not work for now
      Logger.debug('Signer Testing', `Gas price is ${gasPrice}`)
      const from = accountAddress
      const to = accountAddress
      const amountInWei = new BigNumber(1e18)
      const gasFees = new BigNumber(1000 * 1000)
      const gasCurrency = await getGoldTokenAddress(web3)
      const nonce = await web3.eth.getTransactionCount(from)

      const rawTransaction: string = await getRawTransaction(
        web3,
        from,
        to,
        nonce,
        amountInWei,
        gasFees,
        new BigNumber(gasPrice),
        await web3.eth.getCoinbase(),
        gasCurrency
      )
      const recoveredSigner = recoverTransaction(rawTransaction)
      expect(recoveredSigner).toEqual(from)
    })
  })
})
