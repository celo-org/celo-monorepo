import BigNumber from 'bignumber.js'

import { Address, CeloContract } from '../base'
import { Registry } from '../generated/types/Registry'
import { newKitFromWeb3 } from '../kit'
import { NetworkConfig, testWithGanache } from '../test-utils/ganache-test'
import { GovernanceWrapper, Transaction, VoteValue } from './Governance'

const expConfig = NetworkConfig.governance

testWithGanache('Governance Wrapper', (web3) => {
  const kit = newKitFromWeb3(web3)
  const minDeposit = web3.utils.toWei(expConfig.minDeposit.toString(), 'ether')

  let accounts: string[] = []
  let governance: GovernanceWrapper
  let registry: Registry

  beforeAll(async () => {
    accounts = await web3.eth.getAccounts()
    kit.defaultAccount = accounts[0]
    governance = await kit.contracts.getGovernance()
    registry = await kit._web3Contracts.getRegistry()
  })

  const buildRegistryRepointTransactions = (
    repoints: Array<[Address, Address]>,
    _registry: Registry
  ) =>
    repoints.map<Transaction>((repoint) => ({
      value: new BigNumber(0),
      destination: _registry._address,
      data: governance.toTransactionData(_registry.methods.setAddressFor, [repoint[0], repoint[1]]),
    }))

  it('SBAT get config', async () => {
    const config = await governance.getConfig()
    expect(config.concurrentProposals).toEqBigNumber(expConfig.concurrentProposals)
    expect(config.dequeueFrequency).toEqBigNumber(expConfig.dequeueFrequency)
    expect(config.minDeposit).toEqBigNumber(minDeposit)
    expect(config.queueExpiry).toEqBigNumber(expConfig.queueExpiry)
    expect(config.stageDurations.approval).toEqBigNumber(expConfig.approvalStageDuration)
    expect(config.stageDurations.referendum).toEqBigNumber(expConfig.referendumStageDuration)
    expect(config.stageDurations.execution).toEqBigNumber(expConfig.executionStageDuration)
  })

  describe('Proposals', () => {
    let proposalTransactions: Transaction[]
    let proposeFn: () => Promise<any>

    beforeAll(() => {
      proposalTransactions = buildRegistryRepointTransactions([
        [CeloContract.Random, '0x0000000000000000000000000000000000000004'],
        [CeloContract.Attestations, '0x0000000000000000000000000000000000000005'],
        [CeloContract.Escrow, '0x0000000000000000000000000000000000000006'],
      ], registry)
      proposeFn = () => governance
        .propose(proposalTransactions)
        .sendAndWaitForReceipt({ from: accounts[0], value: minDeposit })
    })

    const proposalID = new BigNumber(1)
    const proposalIndex = new BigNumber(0)

    it.only('#propose', async () => {
      await proposeFn()

      const proposal = await governance.getProposal(proposalID)
      expect(proposal.metadata.proposer).toBe(accounts[0])
      expect(proposal.metadata.transactionCount).toBe(proposalTransactions.length)
      expect(proposal.transactions).toStrictEqual(proposalTransactions)
    })

    it.only('#upvote', async () => {
      await proposeFn()

      const queue = await governance.getQueue()
      console.log("queue[0]", queue[0].id.toString(), queue[0].upvotes.toString())

      const upvoteRecord = await governance.getUpvoteRecord(accounts[0])
      console.log("upvoteRecord", upvoteRecord.id.toString(), upvoteRecord.weight.toString())


      const o = await governance.findLesserAndGreaterAfterUpvote(proposalID, accounts[0])
      console.log("lesser", o.lesserID.toString(), "greater", o.greaterID.toString())

      // const tx = await governance.upvote(proposalID, accounts[0])
      // await tx.sendAndWaitForReceipt()

      // const upvotes = await governance.getUpvotes(proposalID)
      // console.log(upvotes)
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
    const hotfixTransactions = buildRegistryRepointTransactions([
      [CeloContract.Random, '0x0000000000000000000000000000000000000004'],
      [CeloContract.Attestations, '0x0000000000000000000000000000000000000005'],
      [CeloContract.Escrow, '0x0000000000000000000000000000000000000006'],
    ], registry)
    const hash = governance.getTransactionsHash(hotfixTransactions)

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
      const tx = governance.executeHotfix(hotfixTransactions)
      await tx.sendAndWaitForReceipt()
    })
  })
})
