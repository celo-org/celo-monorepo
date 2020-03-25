import { BaseCommand } from '../../base'

export default class ReserveStatus extends BaseCommand {
  static description = 'Shows information about reserve'

  static flags = {
    ...BaseCommand.flags,
  }

  static examples = ['status']

  async run() {
    const reserve = await this.kit.contracts.getReserve()
    const reserve_ = await this.kit._web3Contracts.getReserve()
    const whitelist = await this.kit._web3Contracts.getTransferWhitelist()
    console.log('Reserve address', reserve.address)
    console.log('Spenders', await reserve.getSpenders())
    console.log('Other reserves', await reserve_.methods.getOtherReserveAddresses().call())
    console.log('Whitelist', await whitelist.methods.getWhitelist().call())
    console.log('Frozen', await reserve_.methods.getFrozenReserveGoldBalance().call())
  }
}
