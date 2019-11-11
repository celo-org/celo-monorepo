import BigNumber from 'bignumber.js'

import { concurrentMap } from '@celo/utils/lib/async'

import { Address, CeloContract } from '../base'
import { Registry } from '../generated/types/Registry'
import { Hotfix, ProposalTransactionFactory } from '../governance/proposals'
import { newKitFromWeb3 } from '../kit'
import { NetworkConfig, testWithGanache, timeTravel } from '../test-utils/ganache-test'
import { AccountsWrapper } from './Accounts'
import { GovernanceWrapper, Proposal, ProposalStage, VoteValue } from './Governance'
import { LockedGoldWrapper } from './LockedGold'

const expConfig = NetworkConfig.governance

testWithGanache('Governance Wrapper', (web3) => {
  const ONE_USD = web3.utils.toWei('1', 'ether')
  const kit = newKitFromWeb3(web3)
  const minDeposit = web3.utils.toWei(expConfig.minDeposit.toString(), 'ether')

  let accounts: Address[] = []
  let governance: GovernanceWrapper
  let lockedGold: LockedGoldWrapper
  let accountWrapper: AccountsWrapper
  let registry: Registry

  beforeAll(async () => {
    accounts = await web3.eth.getAccounts()
    kit.defaultAccount = accounts[0]
    governance = await kit.contracts.getGovernance()
    registry = await kit._web3Contracts.getRegistry()
    lockedGold = await kit.contracts.getLockedGold()
    accountWrapper = await kit.contracts.getAccounts()

    await concurrentMap(1, accounts.slice(0, 4), async (account) => {
      await accountWrapper.createAccount().sendAndWaitForReceipt({ from: account })
      await lockedGold.lock().sendAndWaitForReceipt({ from: account, value: ONE_USD })
    })
  })

  type Repoint = [CeloContract, Address]

  const registryRepointProposal = (repoints: Repoint[]) =>
    new Proposal(
      repoints.map((r) =>
        ProposalTransactionFactory.fromWeb3Txo(registry.methods.setAddressFor(...r), {
          to: registry._address,
          value: '0',
        })
      )
    )

  const verifyRepointResult = (repoints: Repoint[]) =>
    concurrentMap(1, repoints, async (repoint) => {
      const newAddress = await registry.methods.getAddressForStringOrDie(repoint[0]).call()
      expect(newAddress).toBe(repoint[1])
    })

  it('#getConfig', async () => {
    const config = await governance.getConfig()
    expect(config.concurrentProposals).toEqBigNumber(expConfig.concurrentProposals)
    expect(config.dequeueFrequency).toEqBigNumber(expConfig.dequeueFrequency)
    expect(config.minDeposit).toEqBigNumber(minDeposit)
    expect(config.queueExpiry).toEqBigNumber(expConfig.queueExpiry)
    expect(config.stageDurations.Approval).toEqBigNumber(expConfig.approvalStageDuration)
    expect(config.stageDurations.Referendum).toEqBigNumber(expConfig.referendumStageDuration)
    expect(config.stageDurations.Execution).toEqBigNumber(expConfig.executionStageDuration)
  })

  describe('Proposals', () => {
    const repoints: Repoint[] = [
      [CeloContract.Random, '0x0000000000000000000000000000000000000001'],
      [CeloContract.Escrow, '0x0000000000000000000000000000000000000002'],
    ]
    const proposalID = new BigNumber(1)

    let proposal: Proposal
    beforeAll(() => proposal = registryRepointProposal(repoints))

    const proposeFn = async (proposer: Address) => {
      const tx = governance.propose(proposal)
      await tx.sendAndWaitForReceipt({ from: proposer, value: minDeposit })
    }

    const upvoteFn = async (upvoter: Address, shouldTimeTravel = true) => {
      const tx = await governance.upvote(proposalID, upvoter)
      await tx.sendAndWaitForReceipt({ from: upvoter })
      if (shouldTimeTravel) {
        await timeTravel(expConfig.dequeueFrequency, web3)
        await governance.dequeueProposalsIfReady().sendAndWaitForReceipt()
      }
    }

    // protocol/truffle-config defines approver address as accounts[0]
    const approveFn = async () => {
      const tx = await governance.approve(proposalID)
      await tx.sendAndWaitForReceipt({ from: accounts[0] })
      await timeTravel(expConfig.approvalStageDuration, web3)
    }

    const voteFn = async (voter: Address) => {
      const tx = await governance.vote(proposalID, VoteValue.Yes)
      await tx.sendAndWaitForReceipt({ from: voter })
      await timeTravel(expConfig.referendumStageDuration, web3)
    }

    it('#propose', async () => {
      await proposeFn(accounts[0])

      const proposalRecord = await governance.getProposalRecord(proposalID)
      expect(proposalRecord.metadata.proposer).toBe(accounts[0])
      expect(proposalRecord.metadata.transactionCount).toBe(proposal.transactions.length)
      expect(proposalRecord.proposal.transactions).toStrictEqual(proposal.transactions)
      expect(proposalRecord.proposal.params).toStrictEqual(proposal.params)
      expect(proposalRecord.stage).toBe(ProposalStage.Queued)
    })

    it('#upvote', async () => {
      await proposeFn(accounts[0])
      // shouldTimeTravel is false so getUpvotes isn't on dequeued proposal
      await upvoteFn(accounts[1], false)

      const voteWeight = await governance.getVoteWeight(accounts[1])
      const upvotes = await governance.getUpvotes(proposalID)
      expect(upvotes).toEqBigNumber(voteWeight)
    })

    it('#revokeUpvote', async () => {
      await proposeFn(accounts[0])
      // shouldTimeTravel is false so revoke isn't on dequeued proposal
      await upvoteFn(accounts[1], false)

      const before = await governance.getUpvotes(proposalID)
      const upvoteRecord = await governance.getUpvoteRecord(accounts[1])

      const tx = await governance.revokeUpvote(accounts[1])
      await tx.sendAndWaitForReceipt({ from: accounts[1] })

      const after = await governance.getUpvotes(proposalID)
      expect(after).toEqBigNumber(before.minus(upvoteRecord.upvotes))
    })

    it('#approve', async () => {
      await proposeFn(accounts[0])
      await upvoteFn(accounts[1])
      await approveFn()

      const approved = await governance.isApproved(proposalID)
      expect(approved).toBeTruthy()
    })

    it('#vote', async () => {
      await proposeFn(accounts[0])
      await upvoteFn(accounts[1])
      await approveFn()
      await voteFn(accounts[2])

      const voteWeight = await governance.getVoteWeight(accounts[2])
      const yesVotes = (await governance.getVotes(proposalID))[VoteValue.Yes]
      expect(yesVotes).toEqBigNumber(voteWeight)
    })

    it('#execute', async () => {
      await proposeFn(accounts[0])
      await upvoteFn(accounts[1])
      await approveFn()
      await voteFn(accounts[2])

      const tx = await governance.execute(proposalID)
      await tx.sendAndWaitForReceipt()

      const exists = await governance.proposalExists(proposalID)
      expect(exists).toBeFalsy()

      await verifyRepointResult(repoints)
    })
  })

  describe('Hotfixes', () => {
    const repoints: Repoint[] = [
      [CeloContract.Random, '0x0000000000000000000000000000000000000003'],
      [CeloContract.Escrow, '0x0000000000000000000000000000000000000004'],
    ]

    let hotfix: Hotfix
    beforeAll(() => {
      const proposal = registryRepointProposal(repoints)
      hotfix = new Hotfix(proposal.transactions, kit)
    })

    const whitelistFn = async (whitelister: Address) => {
      const tx = governance.whitelistHotfix(hotfix.hash)
      await tx.sendAndWaitForReceipt({ from: whitelister })
    }

    const whitelistQuorumFn = () => concurrentMap(1, accounts.slice(1, 4), whitelistFn)

    // protocol/truffle-config defines approver address as accounts[0]
    const approveFn = async () => {
      const tx = governance.approveHotfix(hotfix.hash)
      await tx.sendAndWaitForReceipt({ from: accounts[0] })
    }

    const prepareFn = async () => {
      const tx = governance.prepareHotfix(hotfix.hash)
      await tx.sendAndWaitForReceipt()
    }

    it('#whitelistHotfix', async () => {
      await whitelistFn(accounts[1])

      const whitelisted = await governance.isHotfixWhitelistedBy(hotfix.hash, accounts[1])
      expect(whitelisted).toBeTruthy()
    })

    it('#approveHotfix', async () => {
      await approveFn()

      const record = await governance.getHotfixRecord(hotfix.hash)
      expect(record.approved).toBeTruthy()
    })

    it('#prepareHotfix', async () => {
      await whitelistQuorumFn()
      await approveFn()
      await prepareFn()

      const validators = await kit.contracts.getValidators()
      const record = await governance.getHotfixRecord(hotfix.hash)
      expect(record.preparedEpoch).toBe(await validators.getEpochNumber())
    })

    it('#executeHotfix', async () => {
      await whitelistQuorumFn()
      await approveFn()
      await prepareFn()

      const tx = governance.executeHotfix(hotfix)
      await tx.sendAndWaitForReceipt()

      const record = await governance.getHotfixRecord(hotfix.hash)
      expect(record.executed).toBeTruthy()

      await verifyRepointResult(repoints)
    })
  })
})
