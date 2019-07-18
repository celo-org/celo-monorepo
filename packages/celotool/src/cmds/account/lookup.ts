/* tslint:disable no-console */
import { AccountArgv } from '@celo/celotool/src/cmds/account'
import { portForwardAnd } from '@celo/celotool/src/lib/port_forward'
// @ts-ignore
import { Attestations, lookupPhoneNumbers } from '@celo/contractkit'
import { PhoneNumberUtils } from '@celo/utils'
import { switchToClusterFromEnv } from 'src/lib/cluster'
import { Argv } from 'yargs'

const Web3 = require('web3')

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
    const web3 = new Web3('http://localhost:8545')
    const attestations = await Attestations(web3)
    const phoneHash = PhoneNumberUtils.getPhoneHash(argv.phone)
    const lookupResult = await lookupPhoneNumbers(attestations, [phoneHash])

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
