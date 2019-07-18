/* tslint:disable no-console */
import { generateAccountAddressFromPrivateKey } from 'src/lib/generate_utils'
import * as yargs from 'yargs'

interface AccountAddressArgv {
  privateKey: string
}

export const command = 'account-address'

export const describe = 'command for generating account address from private key'

export const builder = (argv: yargs.Argv) => {
  return argv.option('private-key', {
    type: 'string',
    description: 'private key',
    demand: 'Please, specify an account private key',
  })
}

export const handler = async (argv: AccountAddressArgv) => {
  console.log(generateAccountAddressFromPrivateKey(argv.privateKey))
}
