import { StableToken } from '@celo/contractkit'
import { flags } from '@oclif/command'
import { BaseCommand } from '../../base'
import { newCheckBuilder } from '../../utils/checks'
import { displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'
import { enumEntriesDupWithLowercase } from '../../utils/helpers'

const stableTokenOptions = enumEntriesDupWithLowercase(Object.entries(StableToken))

export default class Propse extends BaseCommand {
  static description = 'Proposes a Granda Mento exchange'

  static flags = {
    ...BaseCommand.flags,
    from: Flags.address({ required: true, description: 'The address with CELO to exchange' }),
    value: Flags.wei({
      required: true,
      description: 'The value of CELO to exchange for a StableToken',
    }),
    stableToken: flags.enum({
      required: true,
      options: Object.keys(stableTokenOptions),
      description: 'Name of the stable to receive',
      default: 'cUSD',
    }),
    sellCelo: flags.boolean({
      required: true,
      description: 'Name of the stable to receive',
    }),
  }

  async run() {
    const celoToken = await this.kit.contracts.getGoldToken()
    const grandaMento = await this.kit.contracts.getGrandaMento()

    const res = this.parse(Propse)
    const signer = res.flags.from
    const sellAmount = res.flags.value
    const stableToken = stableTokenOptions[res.flags.stableToken]
    const sellCelo = res.flags.sellCelo

    this.kit.defaultAccount = signer

    const tokenToSell = sellCelo ? celoToken : await this.kit.contracts.getStableToken(stableToken)

    await newCheckBuilder(this, signer).hasEnoughErc20(signer, sellAmount, celoToken.address)

    await displaySendTx(
      'increaseAllowance',
      tokenToSell.increaseAllowance(grandaMento.address, sellAmount.toFixed())
    )

    await displaySendTx(
      'propose',
      await grandaMento.createExchangeProposal(
        this.kit.celoTokens.getContract(stableToken),
        sellAmount,
        sellCelo
      )
    )
  }
}
