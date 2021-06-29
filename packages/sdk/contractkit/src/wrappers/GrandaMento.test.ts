import { Address } from '@celo/base/lib/address'
import { NetworkConfig, testWithGanache, timeTravel } from '@celo/dev-utils/lib/ganache-test'
import Web3 from 'web3'
import { ContractKit, newKitFromWeb3 } from '../kit'
import { Proposal, ProposalTransaction } from './Governance'
import { GrandaMentoWrapper } from './GrandaMento'

const expConfig = NetworkConfig.grandaMento // replace me
const expConfigGovernance = NetworkConfig.governance

// TODO test this once Governance migrations work again
export async function assumeOwnership(
  kit: ContractKit,
  web3: Web3,
  // contractsToOwn: string[],
  proposer: string,
  to: string,
  proposalId: number = 1
  // dequeuedIndex: number = 0
) {
  const lockedGold = await kit.contracts.getLockedGold()
  const grandaMento = await kit.contracts.getGrandaMento()
  const registry = await kit._web3Contracts.getRegistry()
  const governance = await kit.contracts.getGovernance()
  const multiSig = await kit.contracts.getMultiSig(await governance.getApprover())

  // const governance: GovernanceInstance = await getDeployedProxiedContract('Governance', artifacts)
  // const lockedGold: LockedGoldInstance = await getDeployedProxiedContract('LockedGold', artifacts)
  // const multiSig: GovernanceApproverMultiSigInstance = await getDeployedProxiedContract(
  // 	'GovernanceApproverMultiSig',
  // 	artifacts
  // )
  // const registry: RegistryInstance = await getDeployedProxiedContract('Registry', artifacts)
  // // Enough to pass the governance proposal unilaterally (and then some).
  const tenMillionCELO = '10000000000000000000000000'
  // // @ts-ignore
  await lockedGold.lock().sendAndWaitForReceipt({ value: tenMillionCELO })
  // // Any contract's `transferOwnership` function will work here as the function signatures are all the same.
  // // @ts-ignore
  // const transferOwnershipData = Buffer.from(stripHexEncoding(registry.contract.methods.transferOwnership(to).encodeABI()), 'hex')

  const ownershiptx: ProposalTransaction = {
    value: '0',
    to: (registry as any)._address,
    input: grandaMento.getContract().methods.transferOwnership(to).encodeABI(),
  }
  const proposal: Proposal = [ownershiptx]

  await governance.propose(proposal, 'URL').sendAndWaitForReceipt({
    from: proposer,
    value: (await governance.getConfig()).minDeposit.toNumber(),
  })

  // const proposalTransactions = await Promise.all(
  // 	contractsToOwn.map(async (contractName: string) => {
  // 		return {
  // 			value: 0,
  // 			destination: (await getDeployedProxiedContract(contractName, artifacts)).address,
  // 			data: transferOwnershipData,
  // 		}
  // 	})
  // )
  // await governance.propose(
  // 	proposalTransactions.map((tx: any) => tx.value),
  // 	proposalTransactions.map((tx: any) => tx.destination),
  // 	// @ts-ignore
  // 	Buffer.concat(proposalTransactions.map((tx: any) => tx.data)),
  // 	proposalTransactions.map((tx: any) => tx.data.length),
  // 	'URL',
  // 	// @ts-ignore: TODO(mcortesi) fix typings for TransactionDetails
  // 	{ value: web3.utils.toWei(config.governance.minDeposit.toString(), 'ether') }
  // )

  // await governance.upvote(proposalId, 0, 0)

  const tx = await governance.upvote(proposalId, proposer)
  await tx.sendAndWaitForReceipt({ from: proposer })
  await timeTravel(expConfigGovernance.dequeueFrequency, web3)
  await governance.dequeueProposalsIfReady().sendAndWaitForReceipt()

  // await timeTravel(config.governance.dequeueFrequency, web3)
  // // @ts-ignore
  // const txData = governance.contract.methods.approve(proposalId, dequeuedIndex).encodeABI()
  const tx2 = await governance.approve(proposalId)
  const multisigTx = await multiSig.submitOrConfirmTransaction(governance.address, tx2.txo)
  await multisigTx.sendAndWaitForReceipt({ from: proposer })
  await timeTravel(expConfigGovernance.approvalStageDuration, web3)
  // await multiSig.submitTransaction(governance.address, 0, txData)
  // await timeTravel(config.governance.approvalStageDuration, web3)
  // await governance.vote(proposalId, dequeuedIndex, VoteValue.Yes)
  const tx3 = await governance.vote(proposalId, 'Yes')
  await governance.getVoter(proposer)
  await tx3.sendAndWaitForReceipt({ from: proposer })
  await timeTravel(expConfigGovernance.referendumStageDuration, web3)
  // await timeTravel(config.governance.referendumStageDuration, web3)
  // await governance.execute(proposalId, dequeuedIndex)
  const tx4 = await governance.execute(proposalId)
  await tx4.sendAndWaitForReceipt()
}

testWithGanache('GrandaMento Wrapper', (web3: Web3) => {
  // const ONE_SEC = 1000
  const kit = newKitFromWeb3(web3)
  // const minDeposit = web3.utils.toWei(expConfig.minDeposit.toString(), 'ether')
  // const ONE_CGLD = web3.utils.toWei('1', 'ether')

  let accounts: Address[] = []
  let grandaMento: GrandaMentoWrapper
  // let governanceApproverMultiSig: MultiSigWrapper
  // let lockedGold: LockedGoldWrapper
  // let accountWrapper: AccountsWrapper
  // let registry: Registry

  beforeAll(async () => {
    accounts = await web3.eth.getAccounts()
    kit.defaultAccount = accounts[0]
    grandaMento = await kit.contracts.getGrandaMento()

    // const contractsToOwn = ['GrandaMento']

    // let's own Granda Mento
    //  await assumeOwnership(kit, web3, accounts[0], accounts[0])
  })

  describe('Active proposals', () => {
    it('gets the proposals', async () => {
      const activeProposals = await grandaMento.getActiveProposals()
      // console.log(activeProposals)
      // console.log(typeof activeProposals)
      expect(activeProposals).toEqual([])
    })

    it('submits proposal', async () => {
      // const stableTokenRegistryId = 'StableTokenUSD'
      // const sellAmount = new BigNumber(100000) // check the 18 zeros
      // const sellCelo = true
      // inspire in the oracle set up and sent a tx to increase the limits
      // createExchangeProposal()
    })
  })

  it('#getConfig', async () => {
    const config = await grandaMento.getConfig()
    console.log(config)
    expect(config.approver).toBe(expConfig.approver)
    expect(config.spread).toEqBigNumber(expConfig.spread)
    expect(config.vetoPeriodSeconds).toEqBigNumber(expConfig.vetoPeriodSeconds)
  })

  // it('#setStableTokenExchangeLimits', async () => {})
})
