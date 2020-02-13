import { ContractKit, newKit } from '@celo/contractkit'
import { getAddress } from './tx'

export class CeloAdapter {
  public readonly defaultAddress: string
  public readonly kit: ContractKit
  private readonly privateKey: string

  constructor({ pk, nodeUrl }: { pk: string; nodeUrl: string }) {
    // To add more logging:
    // Uncomment when in need for debug
    // injectDebugProvider(this.kit.web3)

    this.kit = newKit(nodeUrl)
    console.log(`New kit from url: ${nodeUrl}`)
    this.privateKey = this.kit.web3.utils.isHexStrict(pk) ? pk : '0x' + pk
    this.defaultAddress = getAddress(this.kit.web3, this.privateKey)
    this.kit.addAccount(this.privateKey)
    this.kit.defaultAccount = this.defaultAddress
  }

  async transferGold(to: string, amount: string) {
    const goldToken = await this.kit.contracts.getGoldToken()
    return goldToken.transfer(to, amount)
  }

  async transferDollars(to: string, amount: string) {
    const stableToken = await this.kit.contracts.getStableToken()
    return stableToken.transfer(to, amount)
  }

  async escrowDollars(
    phoneHash: string,
    tempWallet: string,
    amount: string,
    expirarySeconds: number,
    minAttestations: number
  ) {
    const escrow = await this.kit.contracts.getEscrow()
    const stableToken = await this.kit.contracts.getStableToken()

    await stableToken.approve(escrow.address, amount).sendAndWaitForReceipt()
    return escrow.transfer(
      phoneHash,
      stableToken.address,
      amount,
      expirarySeconds,
      tempWallet,
      minAttestations
    )
  }

  async getDollarsBalance(accountAddress: string = this.defaultAddress) {
    const stableToken = await this.kit.contracts.getStableToken()
    return stableToken.balanceOf(accountAddress)
  }

  async getGoldBalance(accountAddress: string = this.defaultAddress) {
    const goldToken = await this.kit.contracts.getStableToken()
    return goldToken.balanceOf(accountAddress)
  }
}
