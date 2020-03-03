import { newReleaseGold } from '@celo/contractkit/src/generated/ReleaseGold'
import { ReleaseGoldWrapper } from '@celo/contractkit/src/wrappers/ReleaseGold'
import { flags } from '@oclif/command'
import { BaseCommand } from '../../base'
import { newCheckBuilder } from '../../utils/checks'
import { displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'

export default class Authorize extends BaseCommand {
  static description =
    'Authorize an alternative key to be used for a given action (Vote, Validate, Attest) on behalf of the ReleaseGold instance contract.'

  // TODO(lucas): BLS key?
  // TODO(lucas): Can't test because of 'delegate or account exists' issue
  static flags = {
    ...BaseCommand.flags,
    contract: Flags.address({ required: true, description: 'Address of the ReleaseGold Contract' }),
    action: flags.string({ required: true, options: ['vote', 'validator', 'attestation'] }),
    signer: Flags.address({
      required: true,
      description: 'The signer key that is to be used for voting through the ReleaseGold instance',
    }),
    pop: flags.string({
      description: 'Proof-of-possession of the signer key',
      required: true,
    }),
  }

  static args = []

  static examples = [
    'authorize --contract 0x5409ED021D9299bf6814279A6A1411A7e866A631 --action vote --signer 0x6ecbe1db9ef729cbe972c83fb886247691fb6beb --pop 0x1b9fca4bbb5bfb1dbe69ef1cddbd9b4202dcb6b134c5170611e1e36ecfa468d7b46c85328d504934fce6c2a1571603a50ae224d2b32685e84d4d1a1eebad8452eb',
    'authorize --contract 0x5409ED021D9299bf6814279A6A1411A7e866A631 --action validator --signer 0x6ecbe1db9ef729cbe972c83fb886247691fb6beb --pop 0x1b9fca4bbb5bfb1dbe69ef1cddbd9b4202dcb6b134c5170611e1e36ecfa468d7b46c85328d504934fce6c2a1571603a50ae224d2b32685e84d4d1a1eebad8452eb',
    'authorize --contract 0x5409ED021D9299bf6814279A6A1411A7e866A631 --action attestation --signer 0x6ecbe1db9ef729cbe972c83fb886247691fb6beb --pop 0x1b9fca4bbb5bfb1dbe69ef1cddbd9b4202dcb6b134c5170611e1e36ecfa468d7b46c85328d504934fce6c2a1571603a50ae224d2b32685e84d4d1a1eebad8452eb',
  ]

  async run() {
    // tslint:disable-next-line
    const { flags } = this.parse(Authorize)
    const contractAddress = flags.contract
    const action = flags.action
    const releaseGoldWrapper = new ReleaseGoldWrapper(
      this.kit,
      newReleaseGold(this.kit.web3, contractAddress)
    )

    await newCheckBuilder(this)
      .isAccount(releaseGoldWrapper.address)
      .runChecks()

    const accounts = await this.kit.contracts.getAccounts()
    const sig = accounts.parseSignatureOfAddress(
      releaseGoldWrapper.address,
      flags.signer,
      flags.pop
    )

    const isRevoked = await releaseGoldWrapper.isRevoked()
    this.kit.defaultAccount = isRevoked
      ? await releaseGoldWrapper.getReleaseOwner()
      : await releaseGoldWrapper.getBeneficiary()
    let tx: any
    switch (action) {
      case 'vote': {
        tx = await releaseGoldWrapper.authorizeVoteSigner(flags.signer, sig)
        break
      }
      case 'validator': {
        tx = await releaseGoldWrapper.authorizeValidatorSigner(flags.signer, sig)
        break
      }
      case 'attestation': {
        tx = await releaseGoldWrapper.authorizeAttestationSigner(flags.signer, sig)
        break
      }
      default: {
        return this.error('Invalid action provided')
      }
    }
    await displaySendTx('authorize' + action + 'Tx', tx)
  }
}
