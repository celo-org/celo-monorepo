import { Address } from '@celo/connect'
import { newKitFromWeb3 } from '@celo/contractkit'
import { GovernanceWrapper } from '@celo/contractkit/lib/wrappers/Governance'
import { NetworkConfig, testWithGanache, timeTravel } from '@celo/dev-utils/lib/ganache-test'
import BigNumber from 'bignumber.js'
import Web3 from 'web3'
import Register from '../account/register'
import Lock from '../lockedgold/lock'
import Approve from './approve'
import Dequeue from './dequeue'
import VotePartially from './votePartially'

process.env.NO_SYNCCHECK = 'true'

const expConfig = NetworkConfig.governance

testWithGanache('governance:vote-partially cmd', (web3: Web3) => {
  const minDeposit = web3.utils.toWei(expConfig.minDeposit.toString(), 'ether')
  const kit = newKitFromWeb3(web3)
  const proposalID = new BigNumber(1)

  let accounts: Address[] = []
  let governance: GovernanceWrapper

  beforeEach(async () => {
    accounts = await web3.eth.getAccounts()
    kit.defaultAccount = accounts[0]
    governance = await kit.contracts.getGovernance()
    await governance
      .propose([], 'URL')
      .sendAndWaitForReceipt({ from: accounts[0], value: minDeposit })
    await timeTravel(expConfig.dequeueFrequency, web3)
    await Dequeue.run(['--from', accounts[0]])
    await Approve.run([
      '--from',
      accounts[0],
      '--proposalID',
      proposalID.toString(10),
      '--useMultiSig',
    ])
    await Register.run(['--from', accounts[0]])
    await Lock.run(['--from', accounts[0], '--value', '100'])
  })

  test('can vote partially yes and no', async () => {
    await VotePartially.run([
      '--from',
      accounts[0],
      '--proposalID',
      proposalID.toString(10),
      '--values',
      'Yes,No',
      '--weights',
      '10,20',
    ])
    const votes = await governance.getVotes(proposalID)
    expect(votes.Yes.toNumber()).toEqual(10)
    expect(votes.No.toNumber()).toEqual(20)
  })
})
