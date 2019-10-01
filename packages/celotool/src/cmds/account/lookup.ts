/* tslint:disable no-console */

import { newKit } from '@celo/contractkit'
import { IdentityUtils } from '@celo/utils'
import { switchToClusterFromEnv } from 'src/lib/cluster'
import { portForwardAnd } from 'src/lib/port_forward'
import { Argv } from 'yargs'
import { AccountArgv } from '../account'

export const command = 'lookup'

export const describe = 'command for lookup of accounts for a given identifier'

interface LookupArgv extends AccountArgv {
  identifier: string
  identifierType: string
}

export const builder = (yargs: Argv) => {
  return yargs
    .option('identifier', {
      type: 'string',
      description: 'Identifier to lookup eg: <a phone number>',
      demand: 'Please specify the identifier to lookup',
      alias: 'i',
    })
    .option('identifierType', {
      type: 'string',
      description: 'The type of identifer',
      default: 'phone_number',
      alias: 'itype',
    })
}

export const handler = async (argv: LookupArgv) => {
  await switchToClusterFromEnv(false)
  console.log(`Looking up addresses attested to ${argv.identifier}`)
  const cb = async () => {
    const kit = newKit('http://localhost:8545')
    const identifierHash = await IdentityUtils.identityHash(argv.identifier, argv.identifierType)
    const attestations = await kit.contracts.getAttestations()
    const lookupResult = await attestations.lookupPhoneNumbers([identifierHash])

    const matchingAddresses = lookupResult[identifierHash]

    if (matchingAddresses === undefined) {
      console.info(`No addresses attested to ${argv.identifier}`)
      return
    }

    Object.keys(matchingAddresses).map((address) => {
      const attestationsStats = matchingAddresses[address]
      console.info(
        `${address} is attested to ${argv.identifier} with ${
          attestationsStats.completed
        } completed attestations out of ${attestationsStats.total} total`
      )
    })
  }
  try {
    await portForwardAnd(argv.celoEnv, cb)
  } catch (error) {
    console.error(`Unable to lookup addresses attested to ${argv.identifier}`)
    console.error(error)
    process.exit(1)
  }
}
