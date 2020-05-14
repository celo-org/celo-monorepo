import { eqAddress } from '@celo/utils/src/address'
import { flags } from '@oclif/command'
import { cli } from 'cli-ux'
import { BaseCommand } from '../../base'
import { validatorTable } from '../validator/list'

export const otherValidatorTable = {
  address: {},
  name: {},
  currentSigner: {},
  signer: {},
  changed: {},
}
export default class ElectionCurrent extends BaseCommand {
  static description =
    'Outputs the set of validators currently participating in BFT to create blocks. An election is run to select the validator set at the end of every epoch.'

  static flags = {
    ...BaseCommand.flagsWithoutLocalAddresses(),
    valset: flags.boolean({
      description:
        'Show currently used signers from valset (by default the authorized validator signers are shown). Useful for checking if keys have been rotated.',
    }),
  }

  async run() {
    const res = this.parse(ElectionCurrent)
    cli.action.start('Fetching currently elected Validators')
    const election = await this.kit.contracts.getElection()
    const validators = await this.kit.contracts.getValidators()
    const signers = await election.getCurrentValidatorSigners()
    if (res.flags.valset) {
      const validatorList = await Promise.all(
        signers.map(async (addr) => {
          const v = await validators.getValidatorFromSigner(addr)
          return { ...v, currentSigner: addr, changed: eqAddress(addr, v.signer) ? '' : 'CHANGING' }
        })
      )
      cli.action.stop()
      cli.table(validatorList, otherValidatorTable, { 'no-truncate': !res.flags.truncate })
    } else {
      const validatorList = await Promise.all(
        signers.map((addr) => validators.getValidatorFromSigner(addr))
      )
      cli.action.stop()
      cli.table(validatorList, validatorTable, { 'no-truncate': !res.flags.truncate })
    }
  }
}
