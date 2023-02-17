import { ClaimTypes, IdentityMetadataWrapper } from '@celo/contractkit/lib/identity'
import { sleep } from '@celo/utils/lib/async'
import { appendPath } from '@celo/utils/lib/string'
import { flags as oFlags } from '@oclif/command'
import { cli } from 'cli-ux'
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
    provider: oFlags.string({
      required: false,
      description: 'Test a specific provider (try "twilio" or "nexmo")',
    }),
  }

  static examples = ['test-attestation-service --from 0x97f7333c51897469E8D98E7af8653aAb468050a3']

  requireSynced = false
  async run() {
    const { flags } = this.parse(TestAttestationService)
    const address = flags.from
    const { phoneNumber, message, provider } = flags

    await newCheckBuilder(this, flags.from).isSignerOrAccount().canSign(address).runChecks()

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
      metadata = await IdentityMetadataWrapper.fetchFromURL(accounts, metadataURL)
    } catch (error: any) {
      console.error(`Metadata could not be retrieved from ${metadataURL}: ${error.toString()}`)
      return
    }

    const attestationServiceUrlClaim = metadata.findClaim(ClaimTypes.ATTESTATION_SERVICE_URL)
    if (!attestationServiceUrlClaim) {
      console.error('No attestation service claim could be found')
      return
    }

    const signature = await this.kit.connection.sign(phoneNumber + message, address)

    try {
      const testUrl = appendPath(attestationServiceUrlClaim.url, 'test_attestations')
      cli.action.start(`Sending request to ${testUrl}`)

      console.info()

      const response = await fetch(testUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, signature, message, provider }),
      })

      if (!response.ok) {
        console.error('Request was not successful')
        console.error(`Status: ${response.status}`)
        console.error(`Response: ${await response.text()}`)
      }

      cli.action.stop()

      const testRes = JSON.parse(await response.text())
      if (!testRes.success) {
        console.error('Request was not successful')
        cli.styledJSON(testRes)
        return
      }

      console.info('Request successful')

      if (testRes.salt) {
        // Service supports tracking attestation delivery status.
        const getUrl = appendPath(attestationServiceUrlClaim.url, 'get_attestations')
        cli.action.start(`Checking for delivery status at ${getUrl}`)
        let latestGet = null
        for (let i = 0; i < 6; i++) {
          await sleep(5 * 1000)
          const getResponse = await fetch(
            getUrl +
              '?' +
              new URLSearchParams({
                phoneNumber,
                salt: testRes.salt,
                issuer: testRes.issuer,
                account: testRes.account,
              }),
            {
              method: 'GET',
              headers: { 'Content-Type': 'application/json' },
            }
          )

          if (!getResponse.ok) {
            console.error('Request was not successful')
            console.error(`Status: ${getResponse.status}`)
            console.error(`Response: ${await getResponse.text()}`)
          }

          latestGet = JSON.parse(await getResponse.text())

          if (latestGet!.status === 'Delivered') {
            break
          }
        }

        cli.action.stop()
        if (latestGet) {
          cli.styledJSON(latestGet)
        }
      }
    } catch (error) {
      console.error(`Something went wrong`)
      console.error(error)
    }
  }
}
