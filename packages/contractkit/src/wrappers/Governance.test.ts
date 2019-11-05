import BigNumber from 'bignumber.js'

import { CeloContract } from '../base'
import { Registry } from '../generated/types/Registry'
import { newKitFromWeb3 } from '../kit'
import { testWithGanache } from '../test-utils/ganache-test'
import migrationConfig from '../test-utils/migration-override.json'
import { GovernanceWrapper, Transaction, VoteValue } from './Governance'

const expConfig = migrationConfig.governance

testWithGanache('Governance Wrapper', (web3) => {
  const ONE_USD = web3.utils.toWei('1', 'ether')
  const kit = newKitFromWeb3(web3)

  let accounts: string[] = []
  let governance: GovernanceWrapper
  let transactions: Transaction[]

  const buildTransactions = (results: string[][], registry: Registry) =>
    results.map((repoint) => ({
      value: new BigNumber(0),
      destination: registry._address,
      data: governance.toTransactionData(registry.methods.setAddressFor, [repoint[0], repoint[1]]),
    }))

  beforeAll(async () => {
    accounts = await web3.eth.getAccounts()
    kit.defaultAccount = accounts[0]
    governance = await kit.contracts.getGovernance()
  })

  it('SBAT get config', async () => {
    const config = await governance.getConfig()
    expect(config.concurrentProposals).toEqBigNumber(expConfig.concurrentProposals)
    expect(config.dequeueFrequency).toEqBigNumber(expConfig.dequeueFrequency)
    expect(config.minDeposit).toEqBigNumber(ONE_USD)
    expect(config.queueExpiry).toEqBigNumber(expConfig.queueExpiry)
    expect(config.stageDurations.approval).toEqBigNumber(expConfig.approvalStageDuration)
    expect(config.stageDurations.referendum).toEqBigNumber(expConfig.referendumStageDuration)
    expect(config.stageDurations.execution).toEqBigNumber(expConfig.executionStageDuration)
  })

  describe('Proposals', () => {
    const proposalTransactionResults = [
      [CeloContract.Attestations, '0xproposal00000000000000000000000000000001'],
      [CeloContract.Escrow, '0xproposal00000000000000000000000000000002'],
      [CeloContract.Random, '0xproposal00000000000000000000000000000003'],
    ]

    beforeAll(async () => {
      const registry = await kit._web3Contracts.getRegistry()
      transactions = buildTransactions(proposalTransactionResults, registry)
    })

    let proposalID = new BigNumber(0)
    let proposalIndex = new BigNumber(0)

    it('#propose', async () => {
      const tx = governance.propose(transactions)
      await tx.sendAndWaitForReceipt({ from: accounts[0], value: ONE_USD })
      proposalID = proposalID.plus(1)

      const proposal = await governance.getProposal(proposalID)
      expect(proposal.metadata.proposer).toBe(accounts[0])
      expect(proposal.metadata.transactionCount).toBe(transactions.length)
      expect(proposal.transactions).toStrictEqual(transactions)
    })

    it('#upvote', async () => {
      const tx = await governance.upvote(proposalID, accounts[0])
      await tx.sendAndWaitForReceipt()

      const upvotes = await governance.getUpvotes(proposalID)
      console.log(upvotes)
    })

    it('#approve', async () => {
      const tx = governance.approve(proposalID, proposalIndex)
      await tx.sendAndWaitForReceipt()
    })

    it('#vote', async () => {
      const tx = governance.vote(proposalID, proposalIndex, VoteValue.Yes)
      await tx.sendAndWaitForReceipt()
    })

    it('#execute', async () => {
      const tx = governance.execute(proposalID, proposalIndex)
      await tx.sendAndWaitForReceipt()
    })
  })

  describe('Hotfixes', () => {
    const hotfixTransactionResults = [
      [CeloContract.Attestations, '0xhotfix0000000000000000000000000000000001'],
      [CeloContract.Escrow, '0xhotfix0000000000000000000000000000000002'],
      [CeloContract.Random, '0xhotfix0000000000000000000000000000000003'],
    ]

    let hash: Buffer

    beforeAll(async () => {
      const registry = await kit._web3Contracts.getRegistry()
      transactions = buildTransactions(hotfixTransactionResults, registry)
      hash = governance.getTransactionsHash(transactions)
    })

    it('#whitelistHotfix', async () => {
      const tx = governance.whitelistHotfix(hash)
      await tx.sendAndWaitForReceipt()
    })

    it('#approveHotfix', async () => {
      const tx = governance.approveHotfix(hash)
      await tx.sendAndWaitForReceipt()
    })

    it('#prepareHotfix', async () => {
      const tx = governance.prepareHotfix(hash)
      await tx.sendAndWaitForReceipt()
    })

    it('#executeHotfix', async () => {
      const tx = governance.executeHotfix(transactions)
      await tx.sendAndWaitForReceipt()
    })
  })
})
