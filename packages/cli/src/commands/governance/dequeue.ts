import { flags } from '@oclif/command'
import { BaseCommand } from '../../base'
import { newCheckBuilder } from '../../utils/checks'
import { displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'

export default class Dequeue extends BaseCommand {
  static description = 'Try to dequeue governance proposal'

  static flags = {
    ...BaseCommand.flags,
    from: Flags.address({ required: true, description: 'From address' }),
  }

  static examples = [
    'approve --proposalID 99 --from 0x5409ed021d9299bf6814279a6a1411a7e866a631',
    'approve --proposalID 99 --from 0x5409ed021d9299bf6814279a6a1411a7e866a631 --useMultiSig',
  ]

  async run() {
    const res = this.parse(Dequeue)
    const account = res.flags.from
    this.kit.defaultAccount = account
    const governance = await this.kit.contracts.getGovernance()
    const election = await this.kit.contracts.getElection()
    const governance_ = await this.kit._web3Contracts.getGovernance()
    const lgold = await this.kit._web3Contracts.getLockedGold()
    const multisig = await this.kit._web3Contracts.getMultiSig(
      '0x8b37e943Cd776353c1892D677B4B0260773aaF33'
    )
    console.log('signers', await election.getCurrentValidatorSigners(100000))
    /*
    console.log(await multisig.methods.owners(0).call())
    console.log(await multisig.methods.owners(1).call())
    console.log(await multisig.methods.owners(2).call())
    console.log(await multisig.methods.owners(3).call())
    console.log("required", await multisig.methods.required().call())
    console.log("internalRequired", await multisig.methods.internalRequired().call())
    console.log("tx count", await multisig.methods.transactionCount().call())
    console.log("event", await multisig.getPastEvents("OwnerAddition", {fromBlock: 0}))
    console.log("confirm", await multisig.getPastEvents("Confirmation", {fromBlock: 0}))
    console.log("submit", await multisig.getPastEvents("Submission", {fromBlock: 0}))
    console.log("exec", await multisig.getPastEvents("Execution", {fromBlock: 0}))
    console.log("tx", await multisig.methods.transactions(2).call())
    console.log("tx", await multisig.methods.isConfirmed(2).call())
    // await governance.dequeueProposalsIfReady().sendAndWaitForReceipt()
    console.log(await governance_.getPastEvents("ProposalApproved", {fromBlock: 0}))
    console.log("participation", await governance_.methods.getParticipationParameters().call())
    console.log("is passing?", await governance.isProposalPassing(4))
    console.log("locked gold", await lgold.methods.getTotalLockedGold().call())
    */
  }
}
