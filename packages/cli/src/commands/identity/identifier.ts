import { OdisUtils } from '@celo/contractkit'
import { AuthSigner, ServiceContext } from '@celo/contractkit/lib/identity/odis/query'
import { flags as oFlags } from '@oclif/command'
import { cli } from 'cli-ux'
import { BaseCommand } from '../../base'
import { newCheckBuilder } from '../../utils/checks'
import { printValueMap } from '../../utils/cli'
import { Flags } from '../../utils/command'
export default class IdentifierQuery extends BaseCommand {
  static description =
    'Queries ODIS for the on-chain identifier and pepper corresponding to a given phone number.'

  static flags = {
    ...BaseCommand.flags,
    from: Flags.address({
      required: true,
      description: 'The address from which to perform the query',
    }),
    phoneNumber: Flags.phoneNumber({
      required: true,
      description: 'The phone number for which to query the identifier (w/ country code)',
    }),
    env: oFlags.string({
      required: false,
      description: 'mainnet (default), alfajores, or alfajores_staging',
    }),
  }

  static examples = [
    'identifier --phoneNumber +14151231234 --from 0x5409ed021d9299bf6814279a6a1411a7e866a631 --env alfajores',
  ]

  async run() {
    const { flags } = this.parse(IdentifierQuery)
    const { phoneNumber, from, env } = flags

    await newCheckBuilder(this, flags.from)
      .isSignerOrAccount()
      .runChecks()

    cli.action.start('Querying ODIS for identifier')

    const authSigner: AuthSigner = {
      authenticationMethod: OdisUtils.Query.AuthenticationMethod.WALLET_KEY,
      contractKit: this.kit,
    }

    let serviceContext: ServiceContext
    switch (env) {
      case 'alfajores':
        serviceContext = {
          odisUrl: 'https://us-central1-celo-phone-number-privacy.cloudfunctions.net',
          odisPubKey:
            'kPoRxWdEdZ/Nd3uQnp3FJFs54zuiS+ksqvOm9x8vY6KHPG8jrfqysvIRU0wtqYsBKA7SoAsICMBv8C/Fb2ZpDOqhSqvr/sZbZoHmQfvbqrzbtDIPvUIrHgRS0ydJCMsA',
        }
      case 'staging':
        serviceContext = {
          odisUrl: 'https://us-central1-celo-phone-number-privacy-stg.cloudfunctions.net',
          odisPubKey:
            '7FsWGsFnmVvRfMDpzz95Np76wf/1sPaK0Og9yiB+P8QbjiC8FV67NBans9hzZEkBaQMhiapzgMR6CkZIZPvgwQboAxl65JWRZecGe5V3XO4sdKeNemdAZ2TzQuWkuZoA',
        }
      default:
        serviceContext = {
          odisUrl: 'https://us-central1-celo-pgpnp-mainnet.cloudfunctions.net',
          odisPubKey:
            'FvreHfLmhBjwxHxsxeyrcOLtSonC9j7K3WrS4QapYsQH6LdaDTaNGmnlQMfFY04Bp/K4wAvqQwO9/bqPVCKf8Ze8OZo8Frmog4JY4xAiwrsqOXxug11+htjEe1pj4uMA',
        }
    }

    const res = await OdisUtils.PhoneNumberIdentifier.getPhoneNumberIdentifier(
      phoneNumber,
      from,
      authSigner,
      serviceContext
    )

    cli.action.stop()

    printValueMap({
      identifier: res.phoneHash,
      pepper: res.pepper,
    })
  }
}
