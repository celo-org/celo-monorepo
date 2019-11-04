import BigNumber from 'bignumber.js';

import { CeloContract } from '../base';
import { newKitFromWeb3 } from '../kit';
import { testWithGanache } from '../test-utils/ganache-test';
import migrationConfig from '../test-utils/migration-override.json';
import { toBigNumber } from './BaseWrapper';
import { GovernanceWrapper, Transaction } from './Governance';

  /*
  TEST NOTES:
  - In migrations: The only account that has cUSD is accounts[0]
  */

  
const expConfig = migrationConfig.governance

testWithGanache('Governance Wrapper', (web3) => {
  const ONE_USD = web3.utils.toWei('1', 'ether')
  const kit = newKitFromWeb3(web3)
  const transactionResults = [
    [CeloContract.Attestations, '0x0000000000000000000000000000000000000001'],
    [CeloContract.Escrow, '0x0000000000000000000000000000000000000002'],
    [CeloContract.Random, '0x0000000000000000000000000000000000000003']
  ] 
  
  let accounts: string[] = []
  let governance: GovernanceWrapper
  let transactions: Transaction[]
  
  beforeAll(async () => {
    accounts = await web3.eth.getAccounts()
    kit.defaultAccount = accounts[0]
    governance = await kit.contracts.getGovernance()
    const registry = await kit._web3Contracts.getRegistry()
    
    transactions = transactionResults.map(
      (repoint) => ({
        value: new BigNumber(0),
        destination: registry._address,
        data: governance.toTransactionData(
          registry.methods.setAddressFor, 
          [repoint[0], repoint[1]]
        )
      })
    )
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
    let proposalID = new BigNumber(0)
    
    it('#propose', async () => {
      const tx = governance.propose(transactions, accounts[0], toBigNumber(ONE_USD))
      proposalID = proposalID.plus(1)
      await tx.sendAndWaitForReceipt()
      
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

    })

    it('#vote', async () => {

    })
    
    it('#execute', async () => {

    })
  })
  
  describe('Hotfixes', () => {

    it('#whitelistHotfix', async () => {

    })

    it('#approveHotfix', async () => {
      
    })

    it('#prepareHotfix', async () => {
      
    })

    it('#executeHotfix', async () => {
      
    })
  })
})
