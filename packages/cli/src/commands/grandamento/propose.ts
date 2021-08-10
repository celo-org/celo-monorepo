import { StableToken } from '@celo/contractkit'
import { flags } from '@oclif/command'
import { BaseCommand } from '../../base'
import { displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'
import { enumEntriesDupWithLowercase } from '../../utils/helpers'

const stableTokenOptions = enumEntriesDupWithLowercase(Object.entries(StableToken))

export default class Propse extends BaseCommand {
  static description = 'Proposes a Granda Mento exchange Celo to Stable Token'

  static flags = {
    ...BaseCommand.flags,
    from: Flags.address({ required: true, description: 'The address with CELO to exchange' }),
    value: Flags.wei({
      required: true,
      description: 'The value of CELO to exchange for a StableToken',
    }),
    stableToken: flags.enum({
      options: Object.keys(stableTokenOptions),
      description: 'Name of the stable to receive',
      default: 'cUSD',
    }),
  }

  async run() {
    const celoToken = await this.kit.contracts.getGoldToken()
    const grandaMento = await this.kit.contracts.getGrandaMento()

    const res = this.parse(Propse)
    const sellAmount = res.flags.value
    const stableToken = stableTokenOptions[res.flags.stableToken]

    await displaySendTx(
      'increaseAllowance',
      celoToken.increaseAllowance(grandaMento.address, sellAmount.toFixed())
    )

    await displaySendTx(
      'proposeTx',
      await grandaMento.createExchangeProposal(
        this.kit.celoTokens.getContract(stableToken),
        sellAmount,
        true
      ), // TODO make the last flag explicit?
      { value: sellAmount.toString() },
      'ProposalQueued'
    )
  }
}
