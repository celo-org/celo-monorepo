import { flags } from '@oclif/command'
import { cli } from 'cli-ux'
import { BaseCommand } from '../../base'

export default class ExchangeShow extends BaseCommand {
  static description = 'Show the current exchange rates offered by the Exchange'

  static flags = {
    ...BaseCommand.flags,
    amount: flags.string({
      description: 'Amount of the token being exchanged to report rates for',
      default: '1000000000000000000',
    }),
  }

  static args = []

  static examples = ['list']

  async run() {
    const { flags: parsedFlags } = this.parse(ExchangeShow)

    cli.action.start('Fetching exchange rates...')
    const exchange = await this.kit.contracts.getExchange()
    const exchange_ = await this.kit._web3Contracts.getExchange()
    const reserve = await this.kit.contracts.getReserve()
    const reserve_ = await this.kit._web3Contracts.getReserve()
    // reserve_.options.address = '0xad60834e131599b58b151b4791374436e5cbba96'
    console.log('exchange', exchange.address)
    console.log('spenders', await reserve.getSpenders())
    // @ts-ignore
    console.log('update', await exchange_.methods.lastBucketUpdate().call({}, 130782), 1579356015)
    // @ts-ignore
    console.log(
      'update freq',
      await exchange_.methods.updateFrequency().call({}, 130782),
      1579356015
    )
    // @ts-ignore
    console.log(
      'reserve fraction',
      await exchange_.methods.reserveFraction().call({}, 130782),
      1579356015
    )
    // @ts-ignore
    console.log('others', await reserve_.methods.getOtherReserveAddresses().call({}, 130781))
    for (let i = 130700; i < 130782; i++) {
      // @ts-ignore
      console.log('reserve gold', i, await reserve_.methods.getReserveGoldBalance().call({}, i))
      // @ts-ignore
      console.log('bucket', i, (await exchange_.methods.getBuyAndSellBuckets(true).call({}, i))[1])
      // @ts-ignore
      console.log('last update', await exchange_.methods.lastBucketUpdate().call({}, i))
    }
    // @ts-ignore
    console.log('bocket', await reserve_.methods.getReserveGoldBalance().call({}, 130780))
    // @ts-ignore
    console.log('bocket', await reserve_.methods.getReserveGoldBalance().call({}, 130781))
    // @ts-ignore
    console.log('bocket', await reserve_.methods.getReserveGoldBalance().call({}, 130782))
    // @ts-ignore
    console.log('bocket', await reserve_.methods.getReserveGoldBalance().call({}, 130783))
    // @ts-ignore
    console.log('buckets', await exchange_.methods.getBuyAndSellBuckets(true).call({}, 130780))
    // @ts-ignore
    console.log('buckets', await exchange_.methods.getBuyAndSellBuckets(true).call({}, 130781))
    // @ts-ignore
    console.log('buckets', await exchange_.methods.getBuyAndSellBuckets(true).call({}, 130782))
    // @ts-ignore
    console.log('buckets', await exchange_.methods.getBuyAndSellBuckets(true).call({}, 130783))
    const dollarForGold = await exchange.getBuyTokenAmount(parsedFlags.amount as string, true)
    const goldForDollar = await exchange.getBuyTokenAmount(parsedFlags.amount as string, false)
    cli.action.stop()

    this.log(`${parsedFlags.amount} cGLD => ${dollarForGold.toFixed()} cUSD`)
    this.log(`${parsedFlags.amount} cUSD => ${goldForDollar.toFixed()} cGLD`)
  }
}
