import { flags } from '@oclif/command'
import { BaseCommand } from '../../base'
import { displaySendTx } from '../../utils/cli'

export default class Deauthorize extends BaseCommand {
  static description = 'Validators who can no longer serve Attestation Service requests should deauthorize their attestation signer'

  static flags = {
    ...BaseCommand.flags,
    role: flags.string({
      char: 'r',
      options: ['vote', 'attestation'],
      description: 'Role to remove',
      required: true,
    }),
  }

  static args = []

  static examples = [
    'deauthorize --role vote',
    'deauthorize --role attestation',
  ]

  async run() {
    const res = this.parse(Deauthorize)

    const accounts = await this.kit.contracts.getAccounts()
    
    let tx: any
    if (res.flags.role === 'vote') {
      tx = await accounts.removeVoteSigner()
    } else if (res.flags.role === 'attestation') {
      tx = await accounts.removeAttestationSigner()
    } else {
      this.error(`Invalid role provided`)
      return
    }
    await displaySendTx('deauthorizeTx', tx)
  }
}
