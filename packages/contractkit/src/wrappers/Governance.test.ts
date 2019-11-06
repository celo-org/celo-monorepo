import BigNumber from 'bignumber.js'

import { Address, CeloContract, NULL_ADDRESS } from '../base'
import { Registry } from '../generated/types/Registry'
import { newKitFromWeb3 } from '../kit'
import { NetworkConfig, testWithGanache } from '../test-utils/ganache-test'
// import { parseBuffer } from './BaseWrapper'
import { GovernanceWrapper, JSONTransaction, Transaction, VoteValue } from './Governance'

const expConfig = NetworkConfig.governance

testWithGanache('Governance Wrapper', (web3) => {
  const kit = newKitFromWeb3(web3)
  const minDeposit = web3.utils.toWei(expConfig.minDeposit.toString(), 'ether')

  let accounts: Address[] = []
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

  it.only('#buildTransactionsFromJSON', async () => {
    const jsonTransactions: JSONTransaction[] = JSON.parse(`[{
      "value": 0,
      "celoContractName": "StableToken",
      "methodName": "balanceOf(address)",
      "args": ["${NULL_ADDRESS}"]
    }]`)
    const transactions = await governance.buildTransactionsFromJSON(jsonTransactions)
    const stableToken = await kit._web3Contracts.getStableToken()
    const constructedTransactions = [{
      value: new BigNumber(0),
      destination: stableToken._address,
      data: governance.toTransactionData(stableToken.methods.balanceOf, [NULL_ADDRESS]),
    }]
    expect(transactions).toStrictEqual(constructedTransactions)
  })

  describe('Proposals', () => {
    let proposalTransactions: Transaction[]
    let proposeFn: () => Promise<any>

    beforeAll(() => {
      proposalTransactions = buildRegistryRepointTransactions(
        [
          [CeloContract.Random, '0x0000000000000000000000000000000000000004'],
          [CeloContract.Attestations, '0x0000000000000000000000000000000000000005'],
          [CeloContract.Escrow, '0x0000000000000000000000000000000000000006'],
        ],
        registry
      )
      proposeFn = () =>
        governance
          .propose(proposalTransactions)
          .sendAndWaitForReceipt({ from: accounts[0], value: minDeposit })
    })

    const proposalID = new BigNumber(1)

    it('#propose', async () => {
      await proposeFn()

      const proposal = await governance.getProposal(proposalID)
      expect(proposal.metadata.proposer).toBe(accounts[0])
      expect(proposal.metadata.transactionCount).toBe(proposalTransactions.length)
      expect(proposal.transactions).toStrictEqual(proposalTransactions)
    })

    it('#upvote', async () => {
      await proposeFn()

      const tx = await governance.upvote(proposalID, accounts[0])
      await tx.sendAndWaitForReceipt()

      const voteWeight = await governance.getVoteWeight(accounts[0])
      const upvotes = await governance.getUpvotes(proposalID)
      expect(upvotes).toEqBigNumber(voteWeight)
    })

    it('#approve', async () => {
      const tx = await governance.approve(proposalID)
      await tx.sendAndWaitForReceipt()
    })

    it('#vote', async () => {
      const tx = await governance.vote(proposalID, VoteValue.Yes)
      await tx.sendAndWaitForReceipt()
    })

    it('#execute', async () => {
      const tx = await governance.execute(proposalID)
      await tx.sendAndWaitForReceipt()
    })
  })

  describe('Hotfixes', () => {
    const hotfixTransactions = buildRegistryRepointTransactions(
      [
        [CeloContract.Random, '0x0000000000000000000000000000000000000004'],
        [CeloContract.Attestations, '0x0000000000000000000000000000000000000005'],
        [CeloContract.Escrow, '0x0000000000000000000000000000000000000006'],
      ],
      registry
    )
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
