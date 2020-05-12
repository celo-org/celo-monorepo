import { BaseCommand } from '../../base'
import { displayWeb3Tx } from '../../utils/cli'
import { flags } from '@oclif/command'
import { Flags } from '../../utils/command'

const DKG = require('./DKG.json')

export default class DKGDeploy extends BaseCommand {
  static description = 'Deploys the DKG'

  static flags = {
    ...BaseCommand.flags,
    phaseDuration: flags.integer({ required: true }),
    threshold: flags.integer({ required: true }),
    from: Flags.address({ required: true, description: 'Address of the sender' }),
  }

  async run() {
    const res = this.parse(DKGDeploy)
    const web3 = this.kit.web3
    const dkg = new web3.eth.Contract(DKG.abi)

    await displayWeb3Tx(
      'deployDKG',
      dkg.deploy({ data: DKG.bytecode, arguments: [res.flags.threshold, res.flags.phaseDuration] }),
      { from: res.flags.from }
    )
  }
}
