import { ClaimTypes } from '@celo/contractkit/lib/identity'
import { verifyDomainRecord } from '@celo/contractkit/lib/identity/claims/verify'
import { flags } from '@oclif/command'
import chalk from 'chalk'
import { ClaimCommand } from '../../utils/identity'

export default class TestDomainClaim extends ClaimCommand {
  static description =
    'Tests whether the account has setup the TXT record required for a domain claim'
  static flags = {
    ...ClaimCommand.flags,
    domain: flags.string({
      required: true,
      description: 'The domain you want to claim',
    }),
  }
  static args = ClaimCommand.args
  static examples = [
    'test-domain-claim ~/metadata.json --domain test.com --from 0x47e172F6CfB6c7D01C1574fa3E2Be7CC73269D95',
  ]
  self = TestDomainClaim
  async run() {
    const res = this.parse(TestDomainClaim)
    const metadata = this.readMetadata()

    const existingClaims = metadata
      .filterClaims(ClaimTypes.DOMAIN)
      .filter((el: any) => el.domain === res.flags.domain)

    if (existingClaims.length < 1) {
      console.error(`The domain ${res.flags.domain} is not part of your metadata`)
      return
    }

    const claim = existingClaims[0]
    console.info(`Fetching domain ${res.flags.domain} TXT records for verification`)

    const output = await verifyDomainRecord(claim, res.flags.from)

    if (output === undefined)
      console.info(
        chalk.green('✓') +
          ` TXT Record celo-site-verification correctly found in ${res.flags.domain}`
      )
    else
      console.info(
        chalk.red('x') +
          ` Unable to find a valid celo-site-verification TXT record in ${res.flags.domain} domain`
      )
  }
}
