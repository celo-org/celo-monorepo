import * as functions from 'firebase-functions'

const Web3 = require('web3')
const ContractKit = require('@celo/contractkit')

const DEFAULT_TESTNET = 'pilot'

const provider = new Web3.providers.HttpProvider(
  `https://${DEFAULT_TESTNET}-forno.celo-testnet.org`
)
const web3 = new Web3(provider)
const contractKit = ContractKit.newKitFromWeb3(web3)

const bankPrivateKey = functions.config().envs ? functions.config().envs.bank_private_key : ''
const bankAddress = '0x7ad47f026f3a758ab6ed0625455de8d9486a414f'

export const transferDollars = async (amount: number, address: string) => {
  if (!bankPrivateKey) {
    console.error(`Missing private key in firebase env. Can't transfer dollars.`)
    return false
  }
  const weiTransferAmount = contractKit.web3.utils.toWei(amount.toString(), 'ether')
  console.log(`About to get stable token wrapper`)
  const stableTokenWrapper = await contractKit.contracts.getStableToken()
  console.log(`Got stable token wrapper`)
  const bankBalance = await stableTokenWrapper.balanceOf(bankAddress)
  if (amount > bankBalance) {
    console.error(`Not enough funds in bank balance to fulfill request: ${amount} > ${bankBalance}`)
    return false
  }
  console.log(
    `Bank balance of ${bankBalance.toString()} is sufficient to fulfill ${weiTransferAmount}`
  )

  contractKit.addAccount(bankPrivateKey)
  const stableTokenContract = await contractKit._web3Contracts.getStableToken()
  console.log(`Got web3 stableToken contract`)
  const txo = await stableTokenContract.methods.transfer(address, weiTransferAmount)
  console.log(`Created transfer object`)
  const tx = await contractKit.sendTransactionObject(txo, { from: bankAddress })
  console.log(`Sent tx object`)
  const hash = await tx.getHash()
  console.log(`Transferred ${amount} dollars to ${address}. Hash: ${hash}`)
  return true
}
