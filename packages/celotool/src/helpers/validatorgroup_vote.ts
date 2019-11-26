import Web3 from 'web3'
import { newKitFromWeb3 } from '@celo/contractkit'
import { displaySendTx } from '@celo/celocli/lib/utils/cli'
import { importAndUnlockAccount } from './utils'
import BigNumber from 'bignumber.js'

const web3 = new Web3('http://localhost:8543')
const keystorePath: string = process.env.KEYSTORE || ''
const group: string = process.env.GROUP || ''
const amount: BigNumber = new BigNumber(process.env.AMOUNT || 1e22)
;(async () => {
  const kit = newKitFromWeb3(web3)
  const account = await importAndUnlockAccount(web3, keystorePath)
  const from = account.address
  kit.defaultAccount = from
  const electionContract = await kit.contracts.getElection()
  const voteTx = await electionContract.vote(group, amount)
  await displaySendTx('vote', voteTx, { from: from })
})()
