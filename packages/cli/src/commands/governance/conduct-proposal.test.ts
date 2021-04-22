import { newKitFromWeb3 } from '@celo/contractkit'
import { GovernanceWrapper } from '@celo/contractkit/lib/wrappers/Governance'
import { testWithGanache, timeTravel } from '@celo/dev-utils/lib/ganache-test'

import BigNumber from 'bignumber.js'
import fs from 'fs'
import Web3 from 'web3'

import Register from '../account/register'
import Lock from '../lockedgold/lock'
import Approve from './approve'
import Execute from './execute'
import Propose from './propose'
import Vote from './vote'

process.env.NO_SYNCCHECK = 'true'
const proposalFile = process.env.TEST_PROPOSAL ?? '.tmp/proposal.json'

const DEFAULT_PROPOSAL = [
  {
    contract: 'Election',
    function: 'setElectableValidators',
    args: [1, 120],
    value: 0,
  },
]

testWithGanache('conduct proposal lifecycle', (web3: Web3) => {
  const kit = newKitFromWeb3(web3)
  const proposalID = '1'

  let governance: GovernanceWrapper
  let dequeueFrequency: BigNumber
  let minDeposit: BigNumber
  let stageDurations: any
  let args: string[]

  beforeAll(async () => {
    const accounts = await web3.eth.getAccounts()
    args = ['--from', accounts[0]]

    // setup locked celo for voting
    await Register.run(args)
    await Lock.run(args.concat(['--value', '10000000000']))

    governance = await kit.contracts.getGovernance()
    stageDurations = await governance.stageDurations()
    minDeposit = await governance.minDeposit()
    dequeueFrequency = await governance.dequeueFrequency()

    if (!fs.existsSync(proposalFile)) {
      fs.writeFileSync(proposalFile, JSON.stringify(DEFAULT_PROPOSAL, null, 2))
    }
  })

  test('can execute provided proposal', async () => {
    // conduct proposal and upvote dequeue
    await Propose.run(
      args.concat([
        '--jsonTransactions',
        proposalFile,
        '--deposit',
        minDeposit.toFixed(),
        '--descriptionURL',
        'URL',
      ])
    )
    expect(await governance.proposalExists(proposalID)).toBeTruthy()
    await timeTravel(dequeueFrequency.toNumber(), web3)

    args.push('--proposalID', proposalID)

    // conduct approval stage
    await Approve.run(args.concat(['--useMultiSig']))
    expect(await governance.isApproved(proposalID)).toBeTruthy()
    await timeTravel(stageDurations.Approval.toNumber(), web3)

    // conduct referendum stage
    await Vote.run(args.concat(['--value', 'Yes']))
    expect(await governance.isProposalPassing(proposalID)).toBeTruthy()
    await timeTravel(stageDurations.Referendum.toNumber(), web3)

    // conduct execution stage
    await Execute.run(args)
    expect(await governance.proposalExists(proposalID)).toBeFalsy()
  })
})
