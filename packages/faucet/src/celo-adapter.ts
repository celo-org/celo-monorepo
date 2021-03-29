import { CeloTransactionObject } from '@celo/connect'
import { ContractKit, newKitFromWeb3 } from '@celo/contractkit'
import { CeloTokenWrapper } from '@celo/contractkit/lib/wrappers/CeloTokenWrapper'
import { ensureLeading0x, privateKeyToAddress } from '@celo/utils/lib/address'
import Web3 from 'web3'

export class CeloAdapter {
  public readonly defaultAddress: string
  public readonly kit: ContractKit
  private readonly privateKey: string

  constructor({ pk, nodeUrl }: { pk: string; nodeUrl: string }) {
    // To add more logging:
    // Use the debug of the contractkit. Run it with DEBUG=* (or the options)

    this.kit = newKitFromWeb3(new Web3(nodeUrl))
    console.info(`New kit from url: ${nodeUrl}`)
    this.privateKey = ensureLeading0x(pk)
    this.defaultAddress = privateKeyToAddress(this.privateKey)
    console.info(`Using address ${this.defaultAddress} to send transactions`)
    this.kit.connection.addAccount(this.privateKey)
    this.kit.connection.defaultAccount = this.defaultAddress
  }

  async transferGold(to: string, amount: string): Promise<CeloTransactionObject<boolean>> {
    const goldToken = await this.kit.contracts.getGoldToken()
    return goldToken.transfer(to, amount)
  }

  async transferDollars(to: string, amount: string): Promise<CeloTransactionObject<boolean>> {
    const stableToken = await this.kit.contracts.getStableToken()
    return stableToken.transfer(to, amount)
  }

  async transferTokens(to: string, amount: string) {
    // : Promise<CeloTransactionObject<boolean>[]> {

    // this.kit.celoTokens.forEachCeloToken
    // await this.kit.celoTokens.forEachCeloToken(
    //   (info) => info.contract // text name of contract --> need to get the contract + transfer
    //   // maybe best to include this logic within transferDollars (keep amounts the same across stables)
    //   // TODO: get the contract, then transfer
    //   // this.registry.addressFor(info.contract)
    // )
    // TODO fix all of this, none of it probably works
    // TODO --> decide if we want this only for stable tokens or for other tokens as well (i.e. stables + CELO, or all as "tokens")
    // --> if so, use new forEachStableToken or whatever it's called (part of Ponti's PR)
    // --> or add getStableWrappers?
    const wrappers = await this.kit.celoTokens.getWrappers()
    // should return list of txObjects (or object keyed by name)
    return Object.values(wrappers).map((token: CeloTokenWrapper<any> | undefined) => {
      return token!.transfer(to, amount)
    })
  }

  async escrowDollars(
    phoneHash: string,
    tempWallet: string,
    amount: string,
    expirySeconds: number,
    minAttestations: number
  ): Promise<CeloTransactionObject<boolean>> {
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
    this.kit.connection.stop()
  }
}
