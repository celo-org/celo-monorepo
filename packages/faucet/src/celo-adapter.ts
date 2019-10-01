import Web3 from 'web3'
import getEscrowInstance from './contracts/Escrow'
import getGoldTokenInstance from './contracts/GoldToken'
import getStableTokenInstance from './contracts/StableToken'
import { Escrow } from './contracts/types/Escrow'
import { GoldToken } from './contracts/types/GoldToken'
import { StableToken } from './contracts/types/StableToken'
import { getAddress, sendTx } from './tx'

export class CeloAdapter {
  public readonly defaultAddress: string
  private readonly goldToken: GoldToken
  private readonly stableToken: StableToken
  private readonly escrow: Escrow
  private readonly privateKey: string

  constructor(
    private readonly web3: Web3,
    pk: string,
    private readonly stableTokenAddress: string,
    private readonly escrowAddress: string,
    private readonly goldTokenAddress: string
  ) {
    // To add more logging:
    // Uncomment when in need for debug
    // injectDebugProvider(web3)

    this.privateKey = this.web3.utils.isHexStrict(pk) ? pk : '0x' + pk
    this.defaultAddress = getAddress(this.web3, this.privateKey)
    this.goldToken = getGoldTokenInstance(this.web3, goldTokenAddress)
    this.stableToken = getStableTokenInstance(this.web3, stableTokenAddress)
    this.escrow = getEscrowInstance(this.web3, escrowAddress)
  }

  async transferGold(to: string, amount: string) {
    return sendTx(this.web3, this.goldToken.methods.transfer(to, amount), this.privateKey, {
      to: this.goldTokenAddress,
    })
  }

  async transferDollars(to: string, amount: string) {
    return sendTx(this.web3, this.stableToken.methods.transfer(to, amount), this.privateKey, {
      to: this.stableTokenAddress,
    })
  }

  async escrowDollars(
    phoneHash: string,
    tempWallet: string,
    amount: string,
    expirarySeconds: number,
    minAttestations: number
  ) {
    // Wait to approve escrow transfer
    const approveTx = await sendTx(
      this.web3,
      this.stableToken.methods.approve(this.escrowAddress, amount),
      this.privateKey,
      { to: this.stableTokenAddress }
    )
    await approveTx.waitReceipt()
    return sendTx(
      this.web3,
      this.escrow.methods.transfer(
        phoneHash,
        this.stableTokenAddress,
        amount,
        expirarySeconds,
        tempWallet,
        minAttestations
      ),
      this.privateKey,
      {
        to: this.escrowAddress,
      }
    )
  }

  getDollarsBalance(accountAddress: string = this.defaultAddress) {
    return this.stableToken.methods.balanceOf(accountAddress).call()
  }
  getGoldBalance(accountAddress: string = this.defaultAddress) {
    return this.web3.eth.getBalance(accountAddress)
  }
}
