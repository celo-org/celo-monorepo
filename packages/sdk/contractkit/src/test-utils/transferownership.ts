import { NetworkConfig, timeTravel } from '@celo/dev-utils/lib/ganache-test'
import Web3 from 'web3'
import { newKitFromWeb3 } from '../kit'
import { AccountsWrapper } from '../wrappers/Accounts'
import { Proposal, ProposalTransaction } from '../wrappers/Governance'

// Implements a transfer ownership function using only contractkit primitives

const expConfigGovernance = NetworkConfig.governance

export async function assumeOwnership(web3: Web3, to: string) {
  const kit = newKitFromWeb3(web3)
  const ONE_CGLD = web3.utils.toWei('1', 'ether')
  const accounts = await web3.eth.getAccounts()
  let accountWrapper: AccountsWrapper
  accountWrapper = await kit.contracts.getAccounts()
  const lockedGold = await kit.contracts.getLockedGold()

  try {
    await accountWrapper.createAccount().sendAndWaitForReceipt({ from: accounts[0] })
    await lockedGold.lock().sendAndWaitForReceipt({ from: accounts[0], value: ONE_CGLD })
  } catch (error) {
    console.log('Account already created')
  }

  const grandaMento = await kit._web3Contracts.getGrandaMento()
  const governance = await kit.contracts.getGovernance()
  const multiSig = await kit.contracts.getMultiSig(await governance.getApprover())

  const tenMillionCELO = web3.utils.toWei('10000000')

  await lockedGold.lock().sendAndWaitForReceipt({ value: tenMillionCELO })

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

  const proposalReceipt = await governance.propose(proposal, 'URL').sendAndWaitForReceipt({
    from: accounts[0],
    value: (await governance.getConfig()).minDeposit.toNumber(),
  })
  const proposalId = proposalReceipt.events!.ProposalQueued.returnValues.proposalId

  const tx = await governance.upvote(proposalId, accounts[1])
  await tx.sendAndWaitForReceipt()
  await timeTravel(expConfigGovernance.dequeueFrequency, web3)
  await governance.dequeueProposalsIfReady().sendAndWaitForReceipt()

  const tx2 = await governance.approve(proposalId)
  const multisigTx = await multiSig.submitOrConfirmTransaction(governance.address, tx2.txo)
  await multisigTx.sendAndWaitForReceipt({ from: accounts[0] })

  const tx3 = await governance.vote(proposalId, 'Yes')
  await tx3.sendAndWaitForReceipt({ from: accounts[0] })
  await timeTravel(expConfigGovernance.referendumStageDuration, web3)

  const tx4 = await governance.execute(proposalId)
  await tx4.sendAndWaitForReceipt()
}
