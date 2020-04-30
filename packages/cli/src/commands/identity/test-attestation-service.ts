import { ClaimTypes, IdentityMetadataWrapper } from '@celo/contractkit/lib/identity'
import { flags as oFlags } from '@oclif/command'
import fetch from 'cross-fetch'
import { BaseCommand } from '../../base'
import { newCheckBuilder } from '../../utils/checks'
import { Flags } from '../../utils/command'

export default class TestAttestationService extends BaseCommand {
  static description =
    'Tests whether the account has setup the attestation service properly by calling the test endpoint on it'

  static flags = {
    ...BaseCommand.flags,
    from: Flags.address({
      required: true,
      description: "Your validator's signer or account address",
    }),
    phoneNumber: Flags.phoneNumber({
      required: true,
      description: 'The phone number to send the test message to',
    }),
    message: oFlags.string({ required: true, description: 'The message of the SMS' }),
  }

  static examples = ['test-attestation-service --from 0x97f7333c51897469E8D98E7af8653aAb468050a3']

  requireSynced = false
  async run() {
    const { flags } = this.parse(TestAttestationService)
    const address = flags.from
    const { phoneNumber, message } = flags

    await newCheckBuilder(this, flags.from)
      .isSignerOrAccount()
      .canSign(address)
      .runChecks()

    const accounts = await this.kit.contracts.getAccounts()
    const account = await accounts.signerToAccount(address)

    const hasAuthorizedAttestationSigner = await accounts.hasAuthorizedAttestationSigner(account)
    if (!hasAuthorizedAttestationSigner) {
      console.info('Account has not authorized an attestation signer')
      return
    }

    const metadataURL = await accounts.getMetadataURL(account)

    if (!metadataURL) {
      console.info('No metadata set for address')
      return
    }

    let metadata: IdentityMetadataWrapper
    try {
      metadata = await IdentityMetadataWrapper.fetchFromURL(this.kit, metadataURL)
    } catch (error) {
      console.error(`Metadata could not be retrieved from ${metadataURL}: ${error.toString()}`)
      return
    }

    const attestationServiceUrlClaim = metadata.findClaim(ClaimTypes.ATTESTATION_SERVICE_URL)
    if (!attestationServiceUrlClaim) {
      console.error('No attestation service claim could be found')
      return
    }

    const signature = await this.kit.web3.eth.sign(phoneNumber + message, address)

    try {
      const response = await fetch(attestationServiceUrlClaim.url + '/test_attestations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, signature, message }),
      })

      if (!response.ok) {
        console.error('Request was not successful')
        console.error(`Status: ${response.status}`)
        console.error(`Response: ${await response.text()}`)
      }

      console.info('Request successful')
    } catch (error) {
      console.error(`Something went wrong`)
      console.error(error)
    }
  }
}
