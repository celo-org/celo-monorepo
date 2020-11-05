import { ensureLeading0x } from '@celo/utils/lib/address'
import { flags } from '@oclif/command'
import fs from 'fs'
import { BaseCommand } from '../../base'
import { displayWeb3Tx } from '../../utils/cli'
import { Flags } from '../../utils/command'

const DKG = require('./DKG.json')

export default class DKGRegister extends BaseCommand {
  static description = 'Register a public key in the DKG'

  static flags = {
    ...BaseCommand.flags,
    blsKey: flags.string({ required: true }),
    address: Flags.address({ required: true, description: 'DKG Contract Address' }),
    from: Flags.address({ required: true, description: 'Address of the sender' }),
  }

  async run() {
    const res = this.parse(DKGRegister)
    const web3 = this.kit.web3

    const dkg = new web3.eth.Contract(DKG.abi, res.flags.address)

    // read the pubkey and publish it
    const blsKey = fs.readFileSync(res.flags.blsKey).toString('hex')
    await displayWeb3Tx('registerBlsKey', dkg.methods.register(ensureLeading0x(blsKey)), {
      from: res.flags.from,
    })
  }
}
