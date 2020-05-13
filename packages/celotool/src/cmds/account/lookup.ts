/* tslint:disable no-console */

import { newKit } from '@celo/contractkit'
import { PhoneNumberUtils } from '@celo/utils'
import { switchToClusterFromEnv } from 'src/lib/cluster'
import { portForwardAnd } from 'src/lib/port_forward'
import { Argv } from 'yargs'
import { AccountArgv } from '../account'

export const command = 'lookup'

export const describe = 'command for lookup of accounts for a given identifier'

interface LookupArgv extends AccountArgv {
  phone: string
  salt?: string
}

export const builder = (yargs: Argv) => {
  return yargs
    .option('phone', {
      type: 'string',
      description: 'Phone number to lookup,',
      demandOption: true,
      demand: 'Please specify phone number to lookup',
    })
    .option('salt', {
      type: 'string',
      description: 'Salt to hash phone number with',
      demandOption: false,
    })
}

export const handler = async (argv: LookupArgv) => {
  await switchToClusterFromEnv(false)
  console.log(`Looking up addresses attested to ${argv.phone}`)
  if (!argv.salt) {
    console.warn(
      `Warning: you have not specified a salt so this phone number's hash will not be the same as the one used by the wallet app`
    )
  }
  const cb = async () => {
    const kit = newKit('http://localhost:8545')
    const phoneHash = PhoneNumberUtils.getPhoneHash(argv.phone, argv.salt)
    const attestations = await kit.contracts.getAttestations()
    const lookupResult = await attestations.lookupIdentifiers([phoneHash])

    const matchingAddresses = lookupResult[phoneHash]

    if (!matchingAddresses) {
      console.info(`No addresses attested to ${argv.phone}`)
      return
    }

    Object.keys(matchingAddresses).map((address) => {
      const attestationsStats = matchingAddresses[address]
      if (!attestationsStats) {
        console.warn('No attesatation stat for address: ', address)
        return
      }
      console.info(
        `${address} is attested to ${argv.phone} with ${attestationsStats.completed} completed attestations out of ${attestationsStats.total} total`
      )
    })
  }
  try {
    await portForwardAnd(argv.celoEnv, cb)
  } catch (error) {
    console.error(`Unable to lookup addresses attested to ${argv.phone}`)
    console.error(error)
    process.exit(1)
  }
}
