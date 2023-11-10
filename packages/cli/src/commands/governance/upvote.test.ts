import { Address } from '@celo/connect'
import { newKitFromWeb3 } from '@celo/contractkit'
import { GovernanceWrapper } from '@celo/contractkit/lib/wrappers/Governance'
import { NetworkConfig, testWithGanache, timeTravel } from '@celo/dev-utils/lib/ganache-test'
import BigNumber from 'bignumber.js'
import Web3 from 'web3'
import { testLocally } from '../../test-utils/cliUtils'
import Register from '../account/register'
import Lock from '../lockedgold/lock'
import Dequeue from './dequeue'
import Upvote from './upvote'

process.env.NO_SYNCCHECK = 'true'

const expConfig = NetworkConfig.governance

testWithGanache('governance:upvote cmd', (web3: Web3) => {
  const minDeposit = web3.utils.toWei(expConfig.minDeposit.toString(), 'ether')
  const kit = newKitFromWeb3(web3)
  const proposalID = new BigNumber(1)
  const proposalID2 = new BigNumber(2)
  const proposalID3 = new BigNumber(3)
  const proposalID4 = new BigNumber(4)
  const proposalID5 = new BigNumber(5)
  const proposalID6 = new BigNumber(6)
  const proposalID7 = new BigNumber(7)

  let accounts: Address[] = []
  let governance: GovernanceWrapper

  beforeEach(async () => {
    accounts = await web3.eth.getAccounts()
    kit.defaultAccount = accounts[0]
    governance = await kit.contracts.getGovernance()
    const dequeueFrequency = (await governance.dequeueFrequency()).toNumber()

    await governance
      .propose([], 'URL')
      .sendAndWaitForReceipt({ from: accounts[0], value: minDeposit })
    // this will reset lastDequeue to now
    // there is 5 concurrent proposals possible to be dequeued
    await testLocally(Dequeue, ['--from', accounts[0]])
    await governance
      .propose([], 'URL2')
      .sendAndWaitForReceipt({ from: accounts[0], value: minDeposit })
    await governance
      .propose([], 'URL3')
      .sendAndWaitForReceipt({ from: accounts[0], value: minDeposit })
    await governance
      .propose([], 'URL4')
      .sendAndWaitForReceipt({ from: accounts[0], value: minDeposit })
    await governance
      .propose([], 'URL5')
      .sendAndWaitForReceipt({ from: accounts[0], value: minDeposit })
    await governance
      .propose([], 'URL6')
      .sendAndWaitForReceipt({ from: accounts[0], value: minDeposit })
    await governance
      .propose([], 'URL7')
      .sendAndWaitForReceipt({ from: accounts[0], value: minDeposit })

    await timeTravel(dequeueFrequency, web3)
    await testLocally(Register, ['--from', accounts[0]])
    await testLocally(Lock, ['--from', accounts[0], '--value', '100'])
  })

  test('will dequeue proposal if ready', async () => {
    await testLocally(Upvote, ['--proposalID', proposalID2.toString(10), '--from', accounts[0]])

    const queue = await governance.getQueue()
    expect(queue.map((k) => k.proposalID)).toEqual([proposalID7])

    const dequeue = await governance.getDequeue()
    expect(dequeue).toEqual([
      proposalID,
      proposalID2,
      proposalID3,
      proposalID4,
      proposalID5,
      proposalID6,
    ])
  })

  test('can upvote proposal which cannot be dequeued', async () => {
    await testLocally(Upvote, ['--proposalID', proposalID7.toString(10), '--from', accounts[0]])

    const queue = await governance.getQueue()
    expect(queue).toEqual([{ proposalID: proposalID7, upvotes: new BigNumber(100) }])
  })
})
