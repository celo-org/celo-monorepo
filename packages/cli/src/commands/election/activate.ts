import { BaseCommand } from '../../base'
import { displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'

export default class ElectionActivate extends BaseCommand {
  static description = 'Activate Vote for a Validator Group in validator elections.'

  static flags = {
    ...BaseCommand.flags,
    from: Flags.address({ required: true, description: "Voter's address" }),
    for: Flags.address({
      description: "Activate vote for ValidatorGroup's address",
      required: true,
    })
  }

  static examples = [
    'activate --from 0x4443d0349e8b3075cba511a0a87796597602a0f1 --for 0x932fee04521f5fcb21949041bf161917da3f588b',
  ]
  async run() {
    const res = this.parse(ElectionActivate)

    this.kit.defaultAccount = res.flags.from
    const election = await this.kit.contracts.getElection()
    const tx = await election.activate(res.flags.for)
    await displaySendTx('activate', tx)
  }
}
