import { IdentityMetadataWrapper } from '@celo/contractkit'
import { ClaimTypes } from '@celo/contractkit/lib/identity'
import { Validator } from '@celo/contractkit/lib/wrappers/Validators'
import { eqAddress } from '@celo/utils/lib/address'
import { cli } from 'cli-ux'
import fetch from 'cross-fetch'
import { BaseCommand } from '../../base'

export default class AttestationServicesCurrent extends BaseCommand {
  static description =
    "Outputs the set of validators currently participating in BFT and which ones are participating in Celo's lightweight identity protocol"

  static flags = {
    ...BaseCommand.flagsWithoutLocalAddresses(),
  }

  async getStatus(validator: Validator) {
    const accounts = await this.kit.contracts.getAccounts()
    const hasAttestationSigner = await accounts.hasAuthorizedAttestationSigner(validator.address)
    const metadataURL = await accounts.getMetadataURL(validator.address)

    let attestationServiceURL: string

    const ret = {
      ...validator,
      hasAttestationSigner,
      attestationServiceURL: 'N/A',
      okStatus: false,
      error: 'N/A',
      smsProviders: [],
      blacklistedRegionCodes: [],
      rightAccount: false,
    }

    try {
      const metadata = await IdentityMetadataWrapper.fetchFromURL(this.kit, metadataURL)
      const attestationServiceURLClaim = metadata.findClaim(ClaimTypes.ATTESTATION_SERVICE_URL)

      if (!attestationServiceURLClaim) {
        return ret
      }

      attestationServiceURL = attestationServiceURLClaim.url
    } catch (error) {
      ret.error = error
      return ret
    }

    ret.attestationServiceURL = attestationServiceURL

    try {
      const statusResponse = await fetch(attestationServiceURL + '/status')

      if (!statusResponse.ok) {
        return ret
      }

      const statusResponseBody = await statusResponse.json()
      ret.smsProviders = statusResponseBody.smsProviders
      ret.blacklistedRegionCodes = statusResponseBody.blacklistedRegionCodes
      ret.rightAccount = eqAddress(validator.address, statusResponseBody.accountAddress)
      return ret
    } catch (error) {
      ret.error = error
      return ret
    }
  }

  async run() {
    const res = this.parse(AttestationServicesCurrent)
    cli.action.start('Fetching currently elected Validators')
    const election = await this.kit.contracts.getElection()
    const validators = await this.kit.contracts.getValidators()
    const signers = await election.getCurrentValidatorSigners()
    const validatorList = await Promise.all(
      signers.map((addr) => validators.getValidatorFromSigner(addr))
    )
    const validatorInfo = await Promise.all(validatorList.map(this.getStatus.bind(this)))

    cli.action.stop()
    cli.table(
      validatorInfo,
      {
        address: {},
        name: {},
        hasAttestationSigner: {},
        attestationServiceURL: {},
        okStatus: {},
        smsProviders: {},
        blacklistedRegionCodes: {},
        rightAccount: {},
      },
      { 'no-truncate': !res.flags.truncate }
    )
  }
}
