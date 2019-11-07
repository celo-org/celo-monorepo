import BigNumber from 'bignumber.js'

import { concurrentMap } from '@celo/utils/lib/async'

import { Address, CeloContract, NULL_ADDRESS } from '../base'
import { Registry } from '../generated/types/Registry'
import { newKitFromWeb3 } from '../kit'
import { NetworkConfig, testWithGanache, timeTravel } from '../test-utils/ganache-test'
import { AccountsWrapper } from './Accounts'
import { GovernanceWrapper, JSONTransaction, Transaction, VoteValue } from './Governance'
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

    await concurrentMap(4, accounts.slice(0, 4), async (account) => {
      await accountWrapper.createAccount().sendAndWaitForReceipt({ from: account })
      await lockedGold.lock().sendAndWaitForReceipt({ from: account, value: ONE_USD })
    })
  })

  type Repoint = [CeloContract, Address]

  const buildRegistryRepointTransactions = (repoints: Repoint[], _registry: Registry) =>
    repoints.map<Transaction>((repoint) => ({
      value: new BigNumber(0),
      destination: _registry._address,
      data: governance.toTransactionData(_registry.methods.setAddressFor, [repoint[0], repoint[1]]),
    }))

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

  it('#buildTransactionsFromJSON', async () => {
    const jsonTransactions: JSONTransaction[] = JSON.parse(`[{
      "value": 0,
      "celoContractName": "StableToken",
      "methodName": "balanceOf(address)",
      "args": ["${NULL_ADDRESS}"]
    }]`)
    const transactions = await governance.buildTransactionsFromJSON(jsonTransactions)
    const stableToken = await kit._web3Contracts.getStableToken()
    const constructedTransactions: Transaction[] = [
      {
        value: new BigNumber(0),
        destination: stableToken._address,
        data: governance.toTransactionData(stableToken.methods.balanceOf, [NULL_ADDRESS]),
      },
    ]
    expect(transactions).toStrictEqual(constructedTransactions)
  })

  describe.only('Proposals', () => {
    const repoints: Repoint[] = [
      [CeloContract.Random, '0x0000000000000000000000000000000000000001'],
      [CeloContract.Attestations, '0x0000000000000000000000000000000000000002'],
      [CeloContract.Escrow, '0x0000000000000000000000000000000000000003'],
    ]
    const proposalID = new BigNumber(1)

    let proposalTransactions: Transaction[]
    beforeAll(() => (proposalTransactions = buildRegistryRepointTransactions(repoints, registry)))

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

    it.only('#propose', async () => {
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
        expect(repoint[1]).toBe(await kit.registry.addressFor(repoint[0]))
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
      hotfixTransactions = buildRegistryRepointTransactions(repoints, registry)
      hash = governance.getTransactionsHash(hotfixTransactions)
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
