import {
  generateKeys,
  generateMnemonic,
  MnemonicLanguages,
  MnemonicStrength,
  validateMnemonic,
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
    mnemonic: flags.string({
      description:
        'Instead of generating a new mnemonic (seed phrases) the user can set the mnemonic to be used. It is required to set it as a string with all the words in order, separated by spaces (example: "word1 word2 word3 ... word24"). If the words are in other language than enaglish, the --language flag must be used. Should be a bip39 mnemonic',
    }),
    derivationPath: flags.string({
      hidden: true,
      description:
        "Choose a different derivation Path (Celo's default is \"m/44'/52752'/0/0\"). This flags is hidden because is required only to help with specific problems (Example: A user that used in a transfer an Ethereum address and wants to recover its funds). NON technical users that don't understand the danger of changing it, SHOULDN'T use it",
    }),
  }

  static examples = [
    'new',
    'new --password 12341234',
    'new --language spanish',
    'new --password 12341234 --language japanese --indexAddress 5',
    'new --password 12341234 --mnemonic "word1 word2 word3 ... word24" --indexAddress 5',
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
    let mnemonic: string
    if (res.flags.mnemonic) {
      mnemonic = res.flags.mnemonic
      if (!validateMnemonic(mnemonic, NewAccount.languageOptions(res.flags.language!))) {
        throw Error('Invalid mnemonic. Should be a bip39 mnemonic')
      }
    } else {
      mnemonic = await generateMnemonic(
        MnemonicStrength.s256_24words,
        NewAccount.languageOptions(res.flags.language!)
      )
    }
    const keys = await generateKeys(
      mnemonic,
      res.flags.password,
      res.flags.indexAddress,
      undefined,
      res.flags.derivationPath
    )
    const accountAddress = toChecksumAddress(privateKeyToAddress(keys.privateKey))
    this.log(
      'This is not being stored anywhere. Save the mnemonic somewhere to use this account at a later point.\n'
    )
    printValueMap({ mnemonic, accountAddress, ...keys })
  }
}
