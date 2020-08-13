import { flags } from '@oclif/command'
import { BaseCommand } from '../../base'
import { newCheckBuilder } from '../../utils/checks'

export default class Revoke extends BaseCommand {
  static description = 'Revoke an account address'

  static flags = {
    ...BaseCommand.flags,
    from: flags.string({ required: true }),
    identifiers: flags.string({ required: true }),
  }

  static examples = [
    'revoke --from 0x5409ed021d9299bf6814279a6a1411a7e866a631 --identifiers \'["0x411a7e866a6315409ed021d9299bf6814275409ed021d9299bf6814279a6a1","0x411a7e866a6315409ed021d9299bf6814275409ed021d9299bf6814279a6a2"]\'',
  ]

  async run() {
    const res = this.parse(Revoke)
    const identifiers: string[] = JSON.parse(res.flags.identifiers)
    const account = res.flags.from
    const attestations = await this.kit.contracts.getAttestations()
    await newCheckBuilder(this)
      .isAccount(account)
      .runChecks()
    for (const identifier of identifiers) {
      try {
        await newCheckBuilder(this)
          .hasAccountForIdentifier(account, identifier)
          .runChecks()
        await (await attestations.revoke(identifier, account)).sendAndWaitForReceipt({
          from: account,
        })
        console.log('revoked ' + identifier)
      } catch (e) {
        console.log('could not revoke ' + identifier, e)
      }
    }
  }
}
