import { ContractKit, newKit } from '@celo/contractkit'
import { ensureLeading0x, privateKeyToAddress } from '@celo/utils/lib/address'

export class CeloAdapter {
  public readonly defaultAddress: string
  public readonly kit: ContractKit
  private readonly privateKey: string

  constructor({ pk, nodeUrl }: { pk: string; nodeUrl: string }) {
    // To add more logging:
    // Uncomment when in need for debug
    // injectDebugProvider(this.kit.web3)

    this.kit = newKit(nodeUrl)
    console.info(`New kit from url: ${nodeUrl}`)
    this.privateKey = ensureLeading0x(pk)
    this.defaultAddress = privateKeyToAddress(this.privateKey)
    console.info(`Using address ${this.defaultAddress} to send transactions`)
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
    expirySeconds: number,
    minAttestations: number
  ) {
    const escrow = await this.kit.contracts.getEscrow()
    const stableToken = await this.kit.contracts.getStableToken()

    await stableToken.approve(escrow.address, amount).sendAndWaitForReceipt()
    return escrow.transfer(
      phoneHash,
      stableToken.address,
      amount,
      expirySeconds,
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

  stop() {
    this.kit.stop()
  }
}
