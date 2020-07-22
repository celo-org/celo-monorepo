/* tslint:disable no-console */
import * as fs from 'fs'
import { AccountType, generatePrivateKey, privateKeyToAddress } from 'src/lib/generate_utils'
import yargs from 'yargs'

interface Bip32Argv {
  mnemonic: string
  index: number
  threads: number
}

export const command = 'prepare-load-test'

export const describe = 'command for generating public and private keys for a load test instance'

export const builder = (argv: yargs.Argv) => {
  return argv
    .option('mnemonic', {
      type: 'string',
      description: 'BIP-39 mnemonic',
      demandOption: 'Please specify a mnemonic from which to derive a private key',
      alias: 'm',
    })
    .option('index', {
      type: 'number',
      description: 'Index of key to generate',
      demandOption: 'Please specify a key index',
      alias: 'i',
    })
    .option('threads', {
      type: 'number',
      description: 'The number of threads',
      demandOption: 'Please specify the number of threads of this node',
      alias: 't',
    })
}

/*
 * Given a BIP-39 mnemonic, we generate a level 1 child private key using the
 * BIP-32 standard.
 * https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki
 * https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki
 */
export const handler = async (argv: Bip32Argv) => {
  const accountType = AccountType.LOAD_TESTING_ACCOUNT
  for (let t = 0; t < argv.threads; t++) {
    const index = argv.index * 10000 + t

    const privateKey = generatePrivateKey(argv.mnemonic, accountType, index)
    const address = privateKeyToAddress(privateKey)
    fs.writeFileSync(`/root/.celo/pkey${t}`, `${privateKey}\n`)
    fs.appendFileSync(`/root/.celo/address`, `${address}\n`)
    console.log(`Address for index ${argv.index} and thread ${t} --> ${address}`)
  }
}
