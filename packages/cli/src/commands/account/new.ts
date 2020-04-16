import { generateKeys, generateMnemonic, MnemonicLanguages } from '@celo/utils/lib/account'
import { privateKeyToAddress } from '@celo/utils/lib/address'
import { flags } from '@oclif/command'
import { LocalCommand } from '../../base'
import { printValueMap } from '../../utils/cli'

export default class NewAccount extends LocalCommand {
  static description =
    "Creates a new account locally using the Celo Derivation Path (m/44'/52752'/0/0) and print out the key information. Save this information for local transaction signing or import into a Celo node."

  static flags = {
    ...LocalCommand.flags,
    password: flags.string({
      description: 'Choose a password to generate the keys',
    }),
    indexAddress: flags.integer({
      default: 0,
      description: 'Choose the index address of the derivation path',
    }),
    language: flags.string({
      options: [
        'chinese_simplified',
        'chinese_traditional',
        'english',
        'french',
        'italian',
        'japanese',
        'korean',
        'spanish',
      ],
      default: 'english',
      description: 'Role to delegate',
    }),
  }

  static examples = ['new']

  static languageOptions(language: string): MnemonicLanguages | undefined {
    if (language) {
      return (MnemonicLanguages[language as any] as unknown) as MnemonicLanguages
    }
    return undefined
  }

  async run() {
    const res = this.parse(NewAccount)
    const mnemonic = generateMnemonic(undefined, NewAccount.languageOptions(res.flags.language!))
    const keys = generateKeys(mnemonic, res.flags.password, res.flags.indexAddress)
    const accountAddress = privateKeyToAddress(keys.privateKey)
    this.log(
      'This is not being stored anywhere. Save the mnemonic somewhere to use this account at a later point.\n'
    )
    printValueMap({ mnemonic, accountAddress, ...keys })
  }
}
