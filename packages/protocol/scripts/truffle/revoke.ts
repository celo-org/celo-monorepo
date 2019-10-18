/* tslint:disable:no-console */

import { getDeployedProxiedContract } from '@celo/protocol/lib/web3-utils'
import { AttestationsInstance } from 'types'

/*
 * A simple script to revoke a verified user
 *
 * Expects the following flags:
 * phone: the phone number to revoke in E164 format
 * network: name of the network defined in truffle-config.js
 *
 * Run using truffle exec, e.g.:
 * truffle exec identity/scripts/revoke.js --network testnet --phone +18005882300
 *
 */
module.exports = async (callback: (error?: any) => number) => {
  try {
    const argv = require('minimist')(process.argv.slice(2), {
      string: ['network', 'phone'],
    })
    const phoneNumber: string = argv.phone
    // @ts-ignore soliditySha3 can take an object
    const phoneHash: string = web3.utils.soliditySha3({ type: 'string', value: phoneNumber })
    const attestations: AttestationsInstance = await getDeployedProxiedContract<
      AttestationsInstance
    >('Attestations', artifacts)

    const currentAccounts = await attestations.lookupAccountsForIdentifier(phoneHash)
    const account = (await web3.eth.getAccounts())[0]
    const index = currentAccounts.indexOf(account)

    if (index === -1) {
      console.log('Account is not attested to')
      callback()
    }

    console.log('Revoking verification')
    console.log((await attestations.revoke(phoneHash, index)).tx)
    callback()
  } catch (error) {
    callback(error)
  }
}
