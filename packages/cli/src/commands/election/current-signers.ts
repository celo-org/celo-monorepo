import { eqAddress } from '@celo/utils/lib/address'
import { cli } from 'cli-ux'
import { BaseCommand } from '../../base'

export const validatorTable = {
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
  }

  async run() {
    const res = this.parse(ElectionCurrent)
    cli.action.start('Fetching currently elected Validators')
    const election = await this.kit.contracts.getElection()
    const validators = await this.kit.contracts.getValidators()
    const signers = await election.getCurrentValidatorSigners()
    const validatorList = await Promise.all(
      signers.map(async (addr) => {
        const v = await validators.getValidatorFromSigner(addr)
        return { ...v, currentSigner: addr, changed: eqAddress(addr, v.signer) ? '' : 'CHANGING' }
      })
    )
    cli.action.stop()
    cli.table(validatorList, validatorTable, { 'no-truncate': !res.flags.truncate })
  }
}
