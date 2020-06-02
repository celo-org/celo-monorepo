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
import * as fs from 'fs-extra'
import { LocalCommand } from '../../base'
import { printValueMap } from '../../utils/cli'

const ETHEREUM_DERIVATION_PATH = "m/44'/60'/0'/0"

export default class NewAccount extends LocalCommand {
  static description =
    "Creates a new account locally using the Celo Derivation Path (m/44'/52752'/0/0/indexAddress) and print out the key information. Save this information for local transaction signing or import into a Celo node. Ledger: this command has been tested swapping mnemonics with the Ledger successfully (only supports english)"

  static flags = {
    ...LocalCommand.flags,
    passwordPath: flags.string({
      description: 'Path to a file that contains the password to generate the keys',
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
    mnemonicPath: flags.string({
      description:
        'Instead of generating a new mnemonic (seed phrase), use the user-supplied mnemonic instead. Path to a file that contains all the mnemonic words separate by a space (example: "word1 word2 word3 ... word24"). If the words are a language other than English, the --language flag must be used. Only bip39 mnemonics are supported',
    }),
    derivationPath: flags.string({
      description:
        "Choose a different derivation Path (Celo's default is \"m/44'/52752'/0'/0\"). Allows to use \"eth\" as an alias of the Ethereum derivation path (\"m/44'/60'/0'/0/\"). Recreating the same account requires knowledge of both the mnemonic and derivation path",
    }),
  }

  static examples = [
    'new',
    'new --passwordPath myFolder/my_password_file',
    'new --language spanish',
    'new --passwordPath some_folder/my_password_file --language japanese --indexAddress 5',
    'new --passwordPath some_folder/my_password_file --mnemonicPath some_folder/my_mnemonic_file --indexAddress 5',
  ]

  static languageOptions(language: string): MnemonicLanguages | undefined {
    if (language) {
      // @ts-ignore
      const enumLanguage = MnemonicLanguages[language]
      return enumLanguage as MnemonicLanguages
    }
    return undefined
  }

  static sanitizeDerivationPath(derivationPath?: string) {
    if (derivationPath) {
      derivationPath = derivationPath.endsWith('/') ? derivationPath.slice(0, -1) : derivationPath
    }
    return derivationPath !== 'eth' ? derivationPath : ETHEREUM_DERIVATION_PATH
  }

  static readFile(file?: string): string | undefined {
    if (!file) {
      return undefined
    }
    if (fs.pathExistsSync(file)) {
      return fs
        .readFileSync(file)
        .toString()
        .replace(/(\r\n|\n|\r)/gm, '')
    }
    throw new Error(`Invalid path: ${file}`)
  }

  async run() {
    const res = this.parse(NewAccount)
    let mnemonic = NewAccount.readFile(res.flags.mnemonicPath)
    if (mnemonic) {
      if (!validateMnemonic(mnemonic, NewAccount.languageOptions(res.flags.language!))) {
        throw Error('Invalid mnemonic. Should be a bip39 mnemonic')
      }
    } else {
      mnemonic = await generateMnemonic(
        MnemonicStrength.s256_24words,
        NewAccount.languageOptions(res.flags.language!)
      )
    }
    const derivationPath = NewAccount.sanitizeDerivationPath(res.flags.derivationPath)
    const password = NewAccount.readFile(res.flags.passwordPath)
    const keys = await generateKeys(
      mnemonic,
      password,
      res.flags.indexAddress,
      undefined,
      derivationPath
    )
    const accountAddress = toChecksumAddress(privateKeyToAddress(keys.privateKey))
    this.log(
      'This is not being stored anywhere. Save the mnemonic somewhere to use this account at a later point.\n'
    )
    printValueMap({ mnemonic, accountAddress, ...keys })
  }
}
