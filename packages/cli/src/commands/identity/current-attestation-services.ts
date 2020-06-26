import { concurrentMap } from '@celo/utils/lib/async'
import { cli } from 'cli-ux'
import { BaseCommand } from '../../base'

export default class AttestationServicesCurrent extends BaseCommand {
  static description =
    "Outputs the set of validators currently participating in BFT and which ones are participating in Celo's lightweight identity protocol"

  static flags = {
    ...BaseCommand.flagsWithoutLocalAddresses(),
  }

  async run() {
    const res = this.parse(AttestationServicesCurrent)
    cli.action.start('Fetching currently elected Validators')
    const election = await this.kit.contracts.getElection()
    const validators = await this.kit.contracts.getValidators()
    const attestations = await this.kit.contracts.getAttestations()
    const signers = await election.getCurrentValidatorSigners()
    const validatorList = await Promise.all(
      signers.map((addr) => validators.getValidatorFromSigner(addr))
    )
    const validatorInfo = await concurrentMap(
      10,
      validatorList,
      attestations.getAttestationServiceStatus.bind(this)
    )

    cli.action.stop()
    cli.table(
      validatorInfo,
      {
        address: {},
        affiliation: {},
        name: {},
        state: {},
        attestationServiceURL: {},
        smsProviders: {},
        blacklistedRegionCodes: {},
        rightAccount: {},
      },
      { 'no-truncate': !res.flags.truncate }
    )
  }
}
