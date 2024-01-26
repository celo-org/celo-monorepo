import {
  coerceMnemonicAccountType,
  generateAddress,
  MNEMONIC_ACCOUNT_TYPE_CHOICES,
  privateKeyToAddress,
} from 'src/lib/generate_utils'
import yargs from 'yargs'

interface AccountAddressArgv {
  privateKey: string
  mnemonic: string
  accountType: string
  index: number
}

export const command = 'account-address'

export const describe = 'command for generating account address from private key'

export const builder = (argv: yargs.Argv) => {
  return argv
    .option('private-key', {
      type: 'string',
      description: 'private key',
      required: false,
    })
    .option('mnemonic', {
      type: 'string',
      description: 'BIP-39 mnemonic',
      alias: 'm',
      required: false,
    })
    .option('accountType', {
      alias: 'a',
      type: 'string',
      choices: MNEMONIC_ACCOUNT_TYPE_CHOICES,
      required: false,
    })
    .option('index', {
      type: 'number',
      description: 'Index of key to generate',
      alias: 'i',
      required: false,
    })
}

export const handler = (argv: AccountAddressArgv) => {
  if (argv.privateKey) {
    console.info(privateKeyToAddress(argv.privateKey))
  } else if (argv.mnemonic && argv.accountType && argv.index != null) {
    console.info(
      generateAddress(argv.mnemonic, coerceMnemonicAccountType(argv.accountType), argv.index)
    )
  } else {
    console.error('The --private-key or --mnemonic, --accountType and --index must be provided')
  }
}
