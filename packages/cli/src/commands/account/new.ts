import {
  generateKeys,
  generateMnemonic,
  MnemonicLanguages,
  MnemonicStrength,
} from '@celo/utils/lib/account'
import { privateKeyToAddress } from '@celo/utils/lib/address'
import { flags } from '@oclif/command'
import { toChecksumAddress } from 'ethereumjs-util'
import { LocalCommand } from '../../base'
import { printValueMap } from '../../utils/cli'

export default class NewAccount extends LocalCommand {
  static description =
    "Creates a new account locally using the Celo Derivation Path (m/44'/52752'/0/0/indexAddress) and print out the key information. Save this information for local transaction signing or import into a Celo node. Ledger: this command has been tested swapping mnemonics with the Ledger successfully (only supports english)"

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
      description:
        "Language for the mnemonic words. **WARNING**, some hardware wallets don't support other languages",
    }),
  }

  static examples = [
    'new',
    'new --password 12341234',
    'new --language spanish',
    'new --password 12341234 --language japanese --indexAddress 5',
  ]

  static languageOptions(language: string): MnemonicLanguages | undefined {
    if (language) {
      // @ts-ignore
      const enumLanguage = MnemonicLanguages[language]
      return enumLanguage as MnemonicLanguages
    }
    return undefined
  }

  async run() {
    const res = this.parse(NewAccount)
    const mnemonic = await generateMnemonic(
      MnemonicStrength.s256_24words,
      NewAccount.languageOptions(res.flags.language!)
    )
    const keys = await generateKeys(mnemonic, res.flags.password, res.flags.indexAddress)
    const accountAddress = toChecksumAddress(privateKeyToAddress(keys.privateKey))
    this.log(
      'This is not being stored anywhere. Save the mnemonic somewhere to use this account at a later point.\n'
    )
    printValueMap({ mnemonic, accountAddress, ...keys })
  }
}
