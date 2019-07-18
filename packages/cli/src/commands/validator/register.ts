import { flags } from '@oclif/command'
import { BaseCommand } from '../../base'
import { Validators } from '../../generated/contracts'
import { displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'

export default class ValidatorRegister extends BaseCommand {
  static description = 'Register a new Validator'

  static flags = {
    ...BaseCommand.flags,
    from: Flags.address({ required: true, description: 'Address for the Validator' }),
    id: flags.string({ required: true }),
    name: flags.string({ required: true }),
    url: flags.string({ required: true }),
    publicKey: Flags.publicKey({ required: true }),
    noticePeriod: flags.string({
      required: true,
      description: 'Notice Period for the Bonded deposit to use',
    }),
  }

  static examples = [
    'register --from 0x47e172F6CfB6c7D01C1574fa3E2Be7CC73269D95 --id myID --name myNAme --noticePeriod 5184000 --url "http://validator.com" --publicKey 0xc52f3fab06e22a54915a8765c4f6826090cfac5e40282b43844bf1c0df83aaa632e55b67869758f2291d1aabe0ebecc7cbf4236aaa45e3e0cfbf997eda082ae1',
  ]
  async run() {
    const res = this.parse(ValidatorRegister)
    const contract = await Validators(this.web3, res.flags.from)
    await displaySendTx(
      'registerValidator',
      contract.methods.registerValidator(
        res.flags.id,
        res.flags.name,
        res.flags.url,
        res.flags.publicKey as any,
        res.flags.noticePeriod
      )
    )
  }
}
