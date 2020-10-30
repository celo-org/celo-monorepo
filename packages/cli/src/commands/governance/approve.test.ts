import { newKitFromWeb3 } from '@celo/contractkit'
import { ProposalBuilder } from '@celo/contractkit/lib/governance'
import {
  GovernanceWrapper,
  Proposal,
  ProposalStage,
} from '@celo/contractkit/lib/wrappers/Governance'
import { NetworkConfig, testWithGanache, timeTravel } from '@celo/dev-utils/lib/ganache-test'
import { Address } from '@celo/utils/lib/address'
import BigNumber from 'bignumber.js'
import Web3 from 'web3'
import Approve from './approve'

process.env.NO_SYNCCHECK = 'true'

const expConfig = NetworkConfig.governance

testWithGanache('governance:approve cmd', (web3: Web3) => {
  const minDeposit = web3.utils.toWei(expConfig.minDeposit.toString(), 'ether')
  const kit = newKitFromWeb3(web3)
  const proposalID = new BigNumber(1)

  let accounts: Address[] = []
  let governance: GovernanceWrapper

  beforeEach(async () => {
    accounts = await web3.eth.getAccounts()
    kit.defaultAccount = accounts[0]
    governance = await kit.contracts.getGovernance()
    let proposal: Proposal
    proposal = await new ProposalBuilder(kit).build()
    await governance
      .propose(proposal, 'URL')
      .sendAndWaitForReceipt({ from: accounts[0], value: minDeposit })
    await timeTravel(expConfig.dequeueFrequency, web3)
    await governance.dequeueProposalsIfReady().sendAndWaitForReceipt()
  })
  test('approve fails if approver not passed in', async () => {
    await expect(
      Approve.run(['--from', accounts[0], '--proposalID', proposalID.toString(10)])
    ).rejects.toThrow("Some checks didn't pass!")
  })
  test('can approve with multisig option', async () => {
    await Approve.run([
      '--from',
      accounts[0],
      '--proposalID',
      proposalID.toString(10),
      '--useMultiSig',
    ])
    expect(await governance.getProposalStage(proposalID)).toEqual(ProposalStage.Approval)
    expect(await governance.isApproved(proposalID)).toBeTruthy()
  })
})
