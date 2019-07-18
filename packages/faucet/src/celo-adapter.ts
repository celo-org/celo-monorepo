import Web3 from 'web3'
import getEscrowInstance from './contracts/Escrow'
import getStableTokenInstance from './contracts/StableToken'
import { Escrow } from './contracts/types/Escrow'
import { StableToken } from './contracts/types/StableToken'
import { getAddress, sendSimpleTx, sendTx } from './tx'

export class CeloAdapter {
  public readonly defaultAddress: string
  private readonly stableToken: StableToken
  private readonly escrow: Escrow
  private readonly privateKey: string

  constructor(
    private readonly web3: Web3,
    pk: string,
    private readonly stableTokenAddress: string,
    private readonly escrowAddress: string
  ) {
    this.privateKey = this.web3.utils.isHexStrict(pk) ? pk : '0x' + pk
    this.defaultAddress = getAddress(this.web3, this.privateKey)
    this.stableToken = getStableTokenInstance(this.web3, stableTokenAddress)
    this.escrow = getEscrowInstance(this.web3, escrowAddress)
  }

  getStableToken() {
    return
  }

  transferGold(to: string, amount: string) {
    return sendSimpleTx(this.web3, this.privateKey, {
      to,
      value: amount,
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

  async getDollarsBalance(accountAddress: string = this.defaultAddress) {
    return this.stableToken.methods.balanceOf(accountAddress).call()
  }
  getGoldBalance(accountAddress: string = this.defaultAddress) {
    return this.web3.eth.getBalance(accountAddress)
  }
}
