import { flags } from '@oclif/command'
import { ClaimCommand } from '../../utils/identity'
import { resolveTxt } from 'dns'
import chalk from 'chalk'

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

    const signature = JSON.parse(metadata).meta.signature
    const signatureBase64 = Buffer.from(signature.toString(), 'binary').toString('base64')
    console.info('Fetching domain ' + res.flags.domain + ' TXT records for verification')

    resolveTxt(res.flags.domain, (error, domainRecords) => {
      console.info('Reading TXT records for domain ' + res.flags.domain)

      domainRecords.forEach((record) => {
        record.forEach((entry) => {
          if (entry === 'celo-site-verification=' + signatureBase64) {
            console.info(
              chalk.green('✓') +
                ' TXT Record celo-site-verification correctly found in ' +
                res.flags.domain
            )
            process.exit(0)
          }
        })
      })

      console.info(
        chalk.red('x') +
          ' Unable to find a valid celo-site-verification TXT record in ' +
          res.flags.domain +
          ' domain'
      )
    })
  }
}
