import { OdisUtils } from '@celo/contractkit'
import { AuthSigner, ServiceContext } from '@celo/contractkit/lib/identity/odis/query'
import { flags as oFlags } from '@oclif/command'
import { cli } from 'cli-ux'
import { BaseCommand } from '../../base'
import { newCheckBuilder } from '../../utils/checks'
import { Flags } from '../../utils/command'
export default class IdentifierQuery extends BaseCommand {
  static description =
    'Queries ODIS for the matches between a given phone number and a list of contacts'

  static flags = {
    ...BaseCommand.flags,
    from: Flags.address({
      required: true,
      description: 'The address of the caller',
    }),
    phoneNumber: Flags.phoneNumber({
      required: true,
      description: 'The phone number of the caller',
    }),
    identifier: oFlags.string({
      required: true,
      description: 'The on-chain identifier of the caller address',
    }),
    contacts: Flags.contacts({
      required: true,
      description:
        'The list of contacts on which to perform matchmaking (comma-seperated, no spaces)',
    }),
    env: oFlags.string({
      required: false,
      description: 'mainnet (default), alfajores, or alfajores_staging',
    }),
  }

  static examples = [
    'identifier --phoneNumber +12345678910 --from 0x5409ed021d9299bf6814279a6a1411a7e866a631 --identifier 0xd1585105829d792c1519886f109bc3f9a815bdb75bd5c5500adfc93a809564c --contacts +14152223333,+14151231234 --env alfajores_staging',
  ]

  async run() {
    const { flags } = this.parse(IdentifierQuery)
    const { phoneNumber, from, env, contacts, identifier } = flags

    await newCheckBuilder(this, flags.from)
      .isSignerOrAccount()
      .runChecks()

    cli.action.start('Querying ODIS for contact matches')

    const authSigner: AuthSigner = {
      authenticationMethod: OdisUtils.Query.AuthenticationMethod.WALLET_KEY,
      contractKit: this.kit,
    }

    //TODO(Alec): move this to OdisUtils

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

    const res = await OdisUtils.Matchmaking.getContactMatches(
      phoneNumber,
      contacts,
      from,
      identifier,
      authSigner,
      serviceContext
    )

    cli.action.stop()

    console.info(res)

    // printValueMap({
    //   identifier: res.phoneHash,
    //   pepper: res.pepper,
    // })
  }
}
