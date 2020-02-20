import { trimLeading0x } from '@celo/utils/lib/address'
import { ec as EC } from 'elliptic'
import Web3 from 'web3'
import { LocalCommand } from '../../base'
import { printValueMap } from '../../utils/cli'
import { ReactNativeBip39MnemonicGenerator } from '../../utils/key_generator'

export default class NewAccount extends LocalCommand {
  static description =
    'Creates a new account locally and print out the key information. Save this information for local transaction signing or import into a Celo node.'

  static flags = {
    ...LocalCommand.flags,
  }

  static examples = ['new']

  static getRandomMnemonic(): string {
    return ReactNativeBip39MnemonicGenerator.generateMnemonic()
  }

  // Do same as what the mobile wallet app does
  // https://github.com/celo-org/celo-monorepo/blob/16f01a14ef0b0a15c0ffe8bb7b940670a0654ad3/packages/mobile/src/import/saga.ts
  static getPrivateKey(mnemonic: string): string {
    return ReactNativeBip39MnemonicGenerator.mnemonicToSeedHex(mnemonic)
  }

  static getPublicKey(privateKey: string): string {
    const ec = new EC('secp256k1')
    const ecKeyPair: EC.KeyPair = ec.keyFromPrivate(
      Buffer.from(trimLeading0x(privateKey), 'hex'),
      'hex'
    )
    const ecPublicKey: string = ecKeyPair.getPublic('hex')
    return ecPublicKey
  }

  static generateAccountAddressFromPrivateKey(privateKey: string): string {
    if (!privateKey.startsWith('0x')) {
      privateKey = '0x' + privateKey
    }
    return new Web3().eth.accounts.privateKeyToAccount(privateKey).address
  }

  async run() {
    // Generate a random mnemonic (uses crypto.randomBytes under the hood), defaults to 128-bits of entropy
    const mnemonic: string = NewAccount.getRandomMnemonic()
    const privateKey = NewAccount.getPrivateKey(mnemonic)
    const publicKey = NewAccount.getPublicKey(privateKey)
    const accountAddress = NewAccount.generateAccountAddressFromPrivateKey(privateKey)
    this.log(
      'This is not being stored anywhere. Save the mnemonic somewhere to use this account at a later point.\n'
    )
    printValueMap({ mnemonic: mnemonic, privateKey, publicKey, accountAddress })
  }
}
