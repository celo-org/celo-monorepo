import { flags } from '@oclif/command'
import { BaseCommand } from '../../base'
import { Validators } from '../../generated/contracts'
import { displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'

export default class ValidatorAffiliate extends BaseCommand {
  static description = 'Manage affiliation to a ValidatorGroup'

  static flags = {
    ...BaseCommand.flags,
    from: Flags.address({ required: true, description: "Validator's address" }),
    unset: flags.boolean({ exclusive: ['set'], description: 'clear affiliation field' }),
    set: Flags.address({
      description: 'set affiliation to given address',
      exclusive: ['unset'],
    }),
  }

  static examples = [
    'affiliation --set 0x97f7333c51897469e8d98e7af8653aab468050a3 --from 0x47e172f6cfb6c7d01c1574fa3e2be7cc73269d95',
    'affiliation --unset --from 0x47e172f6cfb6c7d01c1574fa3e2be7cc73269d95',
  ]

  async run() {
    const res = this.parse(ValidatorAffiliate)
    const contract = await Validators(this.web3, res.flags.from)

    if (!(res.flags.set || res.flags.unset)) {
      this.error(`Specify action: --set or --unset`)
      return
    }

    if (res.flags.set) {
      await displaySendTx('affiliate', contract.methods.affiliate(res.flags.set))
    } else if (res.flags.unset) {
      await displaySendTx('deaffiliate', contract.methods.deaffiliate())
    }
  }
}
