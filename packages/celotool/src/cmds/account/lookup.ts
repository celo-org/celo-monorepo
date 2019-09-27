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
}

export const builder = (yargs: Argv) => {
  return yargs.option('phone', {
    type: 'string',
    description: 'Phone number to lookup,',
    demand: 'Please specify phone number to lookup',
  })
}

export const handler = async (argv: LookupArgv) => {
  await switchToClusterFromEnv(false)
  console.log(`Looking up addresses attested to ${argv.phone}`)
  const cb = async () => {
    const kit = newKit('http://localhost:8545')
    const phoneHash = PhoneNumberUtils.getPhoneHash(argv.phone)
    const attestations = await kit.contracts.getAttestations()
    const lookupResult = await attestations.lookupPhoneNumbers([phoneHash])

    const matchingAddresses = lookupResult[phoneHash]

    if (matchingAddresses === undefined) {
      console.info(`No addresses attested to ${argv.phone}`)
      return
    }

    Object.keys(matchingAddresses).map((address) => {
      const attestationsStats = matchingAddresses[address]
      console.info(
        `${address} is attested to ${argv.phone} with ${
          attestationsStats.completed
        } completed attestations out of ${attestationsStats.total} total`
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
