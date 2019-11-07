import BigNumber from 'bignumber.js'

import { concurrentMap } from '@celo/utils/lib/async'

import { Address, CeloContract } from '../base'
import { Registry } from '../generated/types/Registry'
import { newKitFromWeb3 } from '../kit'
import { NetworkConfig, testWithGanache, timeTravel } from '../test-utils/ganache-test'
import { AccountsWrapper } from './Accounts'
import { GovernanceWrapper, Transaction, VoteValue } from './Governance'
import { LockedGoldWrapper } from './LockedGold'
import { TransactionBuilder } from './TransactionBuilder'

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

    await concurrentMap(4, accounts.slice(0, 4), async (account) => {
      await accountWrapper.createAccount().sendAndWaitForReceipt({ from: account })
      await lockedGold.lock().sendAndWaitForReceipt({ from: account, value: ONE_USD })
    })
  })

  type Repoint = [CeloContract, Address]

  const registryRepointTransactionBuilder = (repoints: Repoint[], _registry: Registry) => {
    const txBuilder = new TransactionBuilder(kit)
    repoints.map((repoint) =>
      txBuilder.appendWeb3Tx(new BigNumber(0), _registry._address, registry.methods.setAddressFor, [
        repoint[0],
        repoint[1],
      ])
    )
    return txBuilder
  }

  it('#getConfig', async () => {
    const config = await governance.getConfig()
    expect(config.concurrentProposals).toEqBigNumber(expConfig.concurrentProposals)
    expect(config.dequeueFrequency).toEqBigNumber(expConfig.dequeueFrequency)
    expect(config.minDeposit).toEqBigNumber(minDeposit)
    expect(config.queueExpiry).toEqBigNumber(expConfig.queueExpiry)
    expect(config.stageDurations.approval).toEqBigNumber(expConfig.approvalStageDuration)
    expect(config.stageDurations.referendum).toEqBigNumber(expConfig.referendumStageDuration)
    expect(config.stageDurations.execution).toEqBigNumber(expConfig.executionStageDuration)
  })

  describe.only('Proposals', () => {
    const repoints: Repoint[] = [
      [CeloContract.Random, '0x0000000000000000000000000000000000000001'],
      [CeloContract.Attestations, '0x0000000000000000000000000000000000000002'],
      [CeloContract.Escrow, '0x0000000000000000000000000000000000000003'],
    ]
    const proposalID = new BigNumber(1)

    let proposalTransactions: Transaction[]
    beforeAll(() =>
      (proposalTransactions = registryRepointTransactionBuilder(repoints, registry).transactions))

    const proposeFn = async (proposer: Address) => {
      const tx = governance.propose(proposalTransactions)
      await tx.sendAndWaitForReceipt({ from: proposer, value: minDeposit })
    }

    const upvoteFn = async (upvoter: Address, shouldTimeTravel = true) => {
      const tx = await governance.upvote(proposalID, upvoter)
      await tx.sendAndWaitForReceipt({ from: upvoter })
      if (shouldTimeTravel) {
        await timeTravel(expConfig.dequeueFrequency, web3)
        await governance.dequeueProposalsIfReady().send()
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

      const proposal = await governance.getProposal(proposalID)
      expect(proposal.metadata.proposer).toBe(accounts[0])
      expect(proposal.metadata.transactionCount).toBe(proposalTransactions.length)
      expect(proposal.transactions).toStrictEqual(proposalTransactions)
    })

    it('#upvote', async () => {
      await proposeFn(accounts[0])
      await upvoteFn(accounts[1])

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
      expect(after).toEqBigNumber(before.minus(upvoteRecord.weight))
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
      const yesVotes = (await governance.getVotes(proposalID)).yes
      expect(yesVotes).toEqBigNumber(voteWeight)
    })

    it('#execute', async () => {
      await proposeFn(accounts[0])
      await upvoteFn(accounts[1])
      await approveFn()
      await voteFn(accounts[2])

      const tx = await governance.execute(proposalID)
      await tx.sendAndWaitForReceipt()

      await concurrentMap(repoints.length, repoints, async (repoint) =>
        expect(await kit.registry.addressFor(repoint[0])).toBe(repoint[1])
      )
    })
  })

  describe('Hotfixes', () => {
    const repoints: Repoint[] = [
      [CeloContract.Random, '0x0000000000000000000000000000000000000004'],
      [CeloContract.Attestations, '0x0000000000000000000000000000000000000005'],
      [CeloContract.Escrow, '0x0000000000000000000000000000000000000006'],
    ]

    let hotfixTransactions: Transaction[]
    let hash: Buffer

    beforeAll(() => {
      const txBuilder = registryRepointTransactionBuilder(repoints, registry)
      hotfixTransactions = txBuilder.transactions
      hash = txBuilder.hash
    })

    const whitelistFn = async (whitelister: Address) => {
      const tx = governance.whitelistHotfix(hash)
      await tx.sendAndWaitForReceipt({ from: whitelister })
    }

    // protocol/truffle-config defines approver address as accounts[0]
    const approveFn = async () => {
      const tx = governance.approveHotfix(hash)
      await tx.sendAndWaitForReceipt({ from: accounts[0] })
    }

    const prepareFn = async () => {
      const tx = governance.prepareHotfix(hash)
      await tx.sendAndWaitForReceipt()
    }

    it('#whitelistHotfix', async () => {
      await whitelistFn(accounts[1])

      const whitelisted = await governance.isHotfixWhitelistedBy(hash, accounts[1])
      expect(whitelisted).toBeTruthy()
    })

    it('#approveHotfix', async () => {
      await approveFn()

      const record = await governance.getHotfixRecord(hash)
      expect(record.approved).toBeTruthy()
    })

    it('#prepareHotfix', async () => {
      await whitelistFn(accounts[1])
      await prepareFn()

      const validators = await kit.contracts.getValidators()
      const record = await governance.getHotfixRecord(hash)
      expect(record.preparedEpoch).toBe(await validators.getEpochNumber())
    })

    it('#executeHotfix', async () => {
      await whitelistFn(accounts[1])
      await prepareFn()
      await approveFn()

      const tx = governance.executeHotfix(hotfixTransactions)
      await tx.sendAndWaitForReceipt()

      const record = await governance.getHotfixRecord(hash)
      expect(record.executed).toBeTruthy()

      await concurrentMap(repoints.length, repoints, async (repoint) =>
        expect(repoint[1]).toBe(await kit.registry.addressFor(repoint[0]))
      )
    })
  })
})
