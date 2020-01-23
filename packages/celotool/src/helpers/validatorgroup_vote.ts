import { newKitFromWeb3 } from '@celo/contractkit'
import BigNumber from 'bignumber.js'
import Web3 from 'web3'
import { displaySendTx, importAndUnlockAccount } from './utils'

const web3 = new Web3('http://localhost:8543')
const keystorePath: string = process.env.KEYSTORE || ''
const group: string = process.env.GROUP || ''
const amount: BigNumber = new BigNumber(process.env.AMOUNT || 1e22)
void (async () => {
  const kit = newKitFromWeb3(web3)
  const account = await importAndUnlockAccount(web3, keystorePath)
  const from = account.address
  kit.defaultAccount = from
  const electionContract = await kit.contracts.getElection()
  const voteTx = await electionContract.vote(group, amount)
  await displaySendTx('vote', voteTx, { from })
})()
