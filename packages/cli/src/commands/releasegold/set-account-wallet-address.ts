import { flags } from '@oclif/command'
import { newCheckBuilder } from '../../utils/checks'
import { displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'
import { ReleaseGoldCommand } from './release-gold'

export default class SetAccountWalletAddress extends ReleaseGoldCommand {
  static description = "Set the ReleaseGold contract account's wallet address"

  static flags = {
    ...ReleaseGoldCommand.flags,
    walletAddress: Flags.address({
      required: true,
      description:
        "Address of wallet to set for contract's account and signer of PoP. 0x0 if owner wants payers to contact them directly.",
    }),
    pop: flags.string({
      required: false,
      description: "ECDSA PoP for signer over contract's account",
    }),
  }

  static args = []

  static examples = [
    'set-account-wallet-address --contract 0x5409ED021D9299bf6814279A6A1411A7e866A631 --walletAddress 0xE36Ea790bc9d7AB70C55260C66D52b1eca985f84 --pop 0x1b3e611d05e46753c43444cdc55c2cc3d95c54da0eba2464a8cc8cb01bd57ae8bb3d82a0e293ca97e5813e7fb9b624127f42ef0871d025d8a56fe2f8f08117e25b',
  ]

  async run() {
    // tslint:disable-next-line
    const { flags } = this.parse(SetAccountWalletAddress)
    const isRevoked = await this.releaseGoldWrapper.isRevoked()

    const checkBuilder = newCheckBuilder(this)
      .isAccount(this.releaseGoldWrapper.address)
      .addCheck('Contract is not revoked', () => !isRevoked)

    let sig: any
    if (flags.walletAddress !== '0x0000000000000000000000000000000000000000') {
      const accounts = await this.kit.contracts.getAccounts()
      checkBuilder.addCheck(
        'Wallet address is provided and PoP is provided',
        () => flags.pop !== undefined
      )
      await checkBuilder.runChecks()
      const pop = String(flags.pop)
      sig = accounts.parseSignatureOfAddress(
        this.releaseGoldWrapper.address,
        flags.walletAddress,
        pop
      )
    } else {
      await checkBuilder.runChecks()
      sig = {}
      sig.v = '0'
      sig.r = '0x0'
      sig.s = '0x0'
    }

    this.kit.defaultAccount = await this.releaseGoldWrapper.getBeneficiary()
    await displaySendTx(
      'setAccountWalletAddressTx',
      this.releaseGoldWrapper.setAccountWalletAddress(flags.walletAddress, sig.v, sig.r, sig.s)
    )
  }
}
