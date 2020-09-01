import { AttestationServiceStatusState } from '@celo/contractkit/lib/wrappers/Attestations'
import { concurrentMap } from '@celo/utils/lib/async'
import chalk from 'chalk'
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
      5,
      validatorList,
      attestations.getAttestationServiceStatus.bind(this)
    )

    cli.action.stop()
    cli.table(
      validatorInfo.sort((a, b) => {
        if (a.affiliation === b.affiliation) {
          return 0
        } else if (a.affiliation === null) {
          return 1
        } else if (b.affiliation === null) {
          return -1
        }
        return a.affiliation.toLowerCase().localeCompare(b.affiliation.toLowerCase())
      }),
      {
        address: {},
        affiliation: {},
        name: {},
        state: {
          get: (r) => {
            switch (r.state) {
              case AttestationServiceStatusState.NoMetadataURL:
              case AttestationServiceStatusState.InvalidMetadata:
              case AttestationServiceStatusState.UnreachableAttestationService:
              case AttestationServiceStatusState.WrongAccount:
              case AttestationServiceStatusState.Unhealthy:
                return chalk.red(r.state)
              case AttestationServiceStatusState.Valid:
                return chalk.green(r.state)
              case AttestationServiceStatusState.NoAttestationSigner:
                return r.state
              default:
                return chalk.yellow(r.state)
            }
          },
        },
        version: {},
        attestationServiceURL: {},
        smsProviders: {},
      },
      { 'no-truncate': !res.flags.truncate }
    )
  }
}
