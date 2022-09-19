import { flags } from '@oclif/command'
import { BaseCommand } from '../../base'
import { displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'

export default class Deauthorize extends BaseCommand {
  static description =
    'Validators who can no longer serve Attestation Service requests should deauthorize their attestation signer. Please note that Attestation Services are important to the health of the Celo network, and validators should only use this command when troubleshooting their service is not an option.'

  static flags = {
    ...BaseCommand.flags,
    from: Flags.address({ required: true }),
    role: flags.string({
      char: 'r',
      options: ['attestation'],
      description: 'Role to remove',
      required: true,
    }),
    signer: Flags.address({ required: true }),
  }

  static args = []

  static examples = [
    'deauthorize --from 0x5409ED021D9299bf6814279A6A1411A7e866A631 --role attestation --signer 0x6ecbe1db9ef729cbe972c83fb886247691fb6beb',
  ]

  async run() {
    const res = this.parse(Deauthorize)

    const accounts = await this.kit.contracts.getAccounts()

    if (res.flags.role !== 'attestation') {
      this.error(`Invalid role provided`)
      return
    }

    const attestationSigner = await accounts.getAttestationSigner(res.flags.from)

    if (res.flags.signer !== attestationSigner) {
      this.error(
        `Invalid signer argument: ${res.flags.signer}. The current signer for this role is: ${attestationSigner}`
      )
      return
    }

    const tx = await accounts.removeAttestationSigner()

    await displaySendTx('deauthorizeTx', tx)
  }
}
