import { ContractKit } from '@celo/contractkit/lib'
import { cli } from 'cli-ux'
import { BaseCommand } from '../../base'
import { validatorTable } from '../validator/list'

async function performElections(kit: ContractKit) {
  const election = await kit.contracts.getElection()
  try {
    const signers = await election.electValidatorSigners()
    return signers
  } catch (err) {
    console.warn('Warning: error running actual elections, retrying with minimum validators at 0')
    return election.electValidatorSigners(0)
  }
}

export default class ElectionRun extends BaseCommand {
  static description =
    'Runs a "mock" election and prints out the validators that would be elected if the epoch ended right now.'

  static flags = {
    ...BaseCommand.flagsWithoutLocalAddresses(),
  }

  async run() {
    const res = this.parse(ElectionRun)
    cli.action.start('Running mock election')
    const validators = await this.kit.contracts.getValidators()

    const signers = await performElections(this.kit)

    const validatorList = await Promise.all(
      signers.map((addr) => validators.getValidatorFromSigner(addr))
    )
    cli.action.stop()
    cli.table(validatorList, validatorTable, { 'no-truncate': !res.flags.truncate })
  }
}
