/* tslint:disable no-console */
import * as fs from 'fs'
import { AccountType, generatePrivateKey, privateKeyToAddress } from 'src/lib/generate_utils'
import { getIndexForLoadTestThread } from 'src/lib/geth'
import yargs from 'yargs'

interface Bip32Argv {
  mnemonic: string
  index: number
  threads: number
}

export const command = 'prepare-load-test'

export const describe =
  'command for generating public and private keys for a load test instance. Expected to run inside the loadtest pod'

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

export const handler = (argv: Bip32Argv) => {
  const accountType = AccountType.LOAD_TESTING_ACCOUNT
  // Empty address file if there is any address (i.e.: Used a snapshot with addresses already generated)
  fs.writeFileSync(`/root/.celo/address`, ``)
  // Generate private keys and addresses for each thread
  for (let t = 0; t < argv.threads; t++) {
    const index = getIndexForLoadTestThread(argv.index, t)
    console.info(`Index for thread ${t} --> ${index}`)

    const privateKey = generatePrivateKey(argv.mnemonic, accountType, index)
    const address = privateKeyToAddress(privateKey)
    fs.writeFileSync(`/root/.celo/pkey${t}`, `${privateKey}\n`)
    fs.appendFileSync(`/root/.celo/address`, `${address}\n`)
    console.info(`Address for index ${argv.index} and thread ${t} --> ${address}`)
  }
}
