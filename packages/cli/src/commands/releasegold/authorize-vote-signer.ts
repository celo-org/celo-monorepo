import { newReleaseGold } from '@celo/contractkit/src/generated/ReleaseGold'
import { ReleaseGoldWrapper } from '@celo/contractkit/src/wrappers/ReleaseGold'
import { flags } from '@oclif/command'
import { BaseCommand } from '../../base'
import { newCheckBuilder } from '../../utils/checks'
import { displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'

export default class AuthorizeVoteSigner extends BaseCommand {
  static description =
    'Authorize an alternative key to be used for signing voting through a ReleaseGold instance contract.'

  static flags = {
    ...BaseCommand.flags,
    contract: Flags.address({ required: true, description: 'Address of the ReleaseGold Contract' }),
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
    'authorize-vote-signer --contract 0x5409ED021D9299bf6814279A6A1411A7e866A631 --signer 0x6ecbe1db9ef729cbe972c83fb886247691fb6beb --pop 0x1b9fca4bbb5bfb1dbe69ef1cddbd9b4202dcb6b134c5170611e1e36ecfa468d7b46c85328d504934fce6c2a1571603a50ae224d2b32685e84d4d1a1eebad8452eb',
  ]

  async run() {
    // tslint:disable-next-line
    const { flags } = this.parse(AuthorizeVoteSigner)
    const contractAddress = flags.contract
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
    await displaySendTx(
      'authorizeVoteSigner',
      await releaseGoldWrapper.authorizeVoteSigner(flags.signer, sig)
    )
  }
}
