import { Address } from '@celo/base/lib/address'
import { concurrentMap } from '@celo/base/lib/async'
import { NetworkConfig, testWithGanache, timeTravel } from '@celo/dev-utils/lib/ganache-test'
import BigNumber from 'bignumber.js'
import Web3 from 'web3'
import { ContractKit, newKitFromWeb3 } from '../kit'
import { AccountsWrapper } from './Accounts'
import { Proposal, ProposalTransaction } from './Governance'
import { GrandaMentoWrapper } from './GrandaMento'

const expConfig = NetworkConfig.grandaMento // replace me
const expConfigGovernance = NetworkConfig.governance

// TODO test this once Governance migrations work again
export async function assumeOwnership(
  kit: ContractKit,
  web3: Web3,
  // contractsToOwn: string[],
  // proposer: string,
  to: string,
  proposalId: number = 1
  // dequeuedIndex: number = 0
) {
  const ONE_CGLD = web3.utils.toWei('1', 'ether')
  const accounts = await web3.eth.getAccounts()
  let accountWrapper: AccountsWrapper
  accountWrapper = await kit.contracts.getAccounts()
  const lockedGold = await kit.contracts.getLockedGold()

  await concurrentMap(4, accounts.slice(0, 4), async (account) => {
    await accountWrapper.createAccount().sendAndWaitForReceipt({ from: account })
    await lockedGold.lock().sendAndWaitForReceipt({ from: account, value: ONE_CGLD })
  })

  // const registry = await kit._web3Contracts.getRegistry()
  const grandaMento = await kit._web3Contracts.getGrandaMento()
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
    to: (grandaMento as any)._address,
    input: grandaMento.methods.transferOwnership(to).encodeABI(),
  }
  const proposal: Proposal = [ownershiptx]

  await governance.propose(proposal, 'URL').sendAndWaitForReceipt({
    from: accounts[0],
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

  const tx = await governance.upvote(proposalId, accounts[1])
  await tx.sendAndWaitForReceipt()
  await timeTravel(expConfigGovernance.dequeueFrequency, web3)
  await governance.dequeueProposalsIfReady().sendAndWaitForReceipt()

  // await timeTravel(config.governance.dequeueFrequency, web3)
  // // @ts-ignore
  // const txData = governance.contract.methods.approve(proposalId, dequeuedIndex).encodeABI()
  const tx2 = await governance.approve(proposalId)
  const multisigTx = await multiSig.submitOrConfirmTransaction(governance.address, tx2.txo)
  await multisigTx.sendAndWaitForReceipt({ from: accounts[0] })
  await timeTravel(expConfigGovernance.approvalStageDuration, web3)
  // await multiSig.submitTransaction(governance.address, 0, txData)
  // await timeTravel(config.governance.approvalStageDuration, web3)
  // await governance.vote(proposalId, dequeuedIndex, VoteValue.Yes)
  const tx3 = await governance.vote(proposalId, 'Yes')
  await tx3.sendAndWaitForReceipt({ from: accounts[2] })
  await timeTravel(expConfigGovernance.referendumStageDuration, web3)
  // await timeTravel(config.governance.referendumStageDuration, web3)
  // await governance.execute(proposalId, dequeuedIndex)
  const tx4 = await governance.execute(proposalId)
  await tx4.sendAndWaitForReceipt()
  // console.log('proposal passed: ' + propo.toString())

  const exists = await governance.proposalExists(proposalId)
  expect(exists).toBeFalsy()
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
  })

  const newLimitMin = new BigNumber('1000')
  const newLimitMax = new BigNumber('1000000000000')
  const increaseLimits = async () => {
    await (
      await grandaMento.setStableTokenExchangeLimits(
        'StableToken',
        newLimitMin.toString(),
        newLimitMax.toString()
      )
    ).sendAndWaitForReceipt()
  }

  describe('Active proposals', () => {
    it('gets the proposals', async () => {
      const activeProposals = await grandaMento.getActiveProposals()
      expect(activeProposals).toEqual([])
    })
    it('increases limits', async () => {
      //  await assumeOwnership(kit, web3, accounts[0])
      // not sure if this should be here as it is owed by governance
      // console.log('owner is ' + (await grandaMento.owner()))
      // console.log('account #0 is ' + accounts[0])
      // console.log('governance contract is' + (await kit.contracts.getGovernance()).address)
      let limits = await grandaMento.stableTokenExchangeLimits('StableToken') // TODO change this for an enum
      expect(limits.minExchangeAmount).toEqBigNumber(new BigNumber(0))
      expect(limits.maxExchangeAmount).toEqBigNumber(new BigNumber(0))

      await increaseLimits()

      limits = await grandaMento.stableTokenExchangeLimits('StableToken')
      expect(limits.minExchangeAmount).toEqBigNumber(newLimitMin)
      expect(limits.maxExchangeAmount).toEqBigNumber(newLimitMax)
    })

    describe.only('Has more has a proposal', () => {
      beforeAll(async () => {})

      it('Can submit a proposal', async () => {
        await increaseLimits() // this should be in the before all but for some reason not working
        // console.log(await grandaMento.stableTokenExchangeLimits('StableToken'))

        const celoToken = await kit.contracts.getGoldToken()
        await (
          await celoToken.increaseAllowance(grandaMento.address, '100000000')
        ).sendAndWaitForReceipt()

        await (
          await grandaMento.createExchangeProposal('StableToken', '100000000', true)
        ).sendAndWaitForReceipt()

        const activeProposals = await grandaMento.getActiveProposals()
        expect(activeProposals).not.toEqual([])
        console.log('Active proposals')

        const proposal = await grandaMento.exchangeProposals(activeProposals[0])
        console.log(proposal)
      })
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
