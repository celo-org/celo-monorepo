import { NULL_ADDRESS } from '@celo/contractkit'
import { flags } from '@oclif/command'
import { BaseCommand } from '../../base'
import { newCheckBuilder } from '../../utils/checks'
import { displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'

export default class AuthorizeVoter extends BaseCommand {
  static description =
    'Authorize an alternative key to be used for signing voting through a vesting instance contract.'

  static flags = {
    ...BaseCommand.flags,
    from: Flags.address({ required: true, description: 'Beneficiary of the vesting' }),
    signer: Flags.address({
      required: true,
      description: 'The signer key that is to be used for voting through the vesting instance',
    }),
    pop: flags.string({
      description: 'Proof-of-possession of the signer key',
      required: true,
    }),
  }

  static args = []

  static examples = [
    'authorize-voter --from 0x5409ED021D9299bf6814279A6A1411A7e866A631 --signer 0x6ecbe1db9ef729cbe972c83fb886247691fb6beb --pop 0x1b9fca4bbb5bfb1dbe69ef1cddbd9b4202dcb6b134c5170611e1e36ecfa468d7b46c85328d504934fce6c2a1571603a50ae224d2b32685e84d4d1a1eebad8452eb',
  ]

  async run() {
    const res = this.parse(AuthorizeVoter)
    this.kit.defaultAccount = res.flags.from
    const vestingFactory = await this.kit.contracts.getVestingFactory()
    const vestingInstance = await vestingFactory.getVestedAt(this.kit.defaultAccount)

    await newCheckBuilder(this)
      .isAccount(vestingInstance.address)
      .addCheck(
        `No vested instance found under the given beneficiary ${res.flags.from}`,
        () => vestingInstance.address !== NULL_ADDRESS
      )
      .addCheck(
        `Vested instance has a different beneficiary`,
        async () => (await vestingInstance.getBeneficiary()) === res.flags.from
      )
      .runChecks()

    const accounts = await this.kit.contracts.getAccounts()
    const sig = accounts.parseSignatureOfAddress(
      vestingInstance.address,
      res.flags.signer,
      res.flags.pop
    )

    const tx = await vestingInstance.authorizeVoteSigner(res.flags.signer, sig)
    await displaySendTx('authorizeVoterTx', tx, { from: await vestingInstance.getBeneficiary() })
  }
}
