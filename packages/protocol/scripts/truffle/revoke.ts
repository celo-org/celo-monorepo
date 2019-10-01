/* tslint:disable:no-console */

import { getDeployedProxiedContract } from '@celo/protocol/lib/web3-utils'
import { IdentityUtils } from '@celo/utils'
import { AttestationsInstance } from 'types'

/*
 * A simple script to revoke a verified user
 *
 * Expects the following flags:
 * identifier: the identifier to revoke  eg. a phone number in E164 format
 * network: name of the network defined in truffle-config.js
 *
 * Run using truffle exec, e.g.:
 * truffle exec identity/scripts/revoke.js --network testnet --identifier +18005882300
 *
 */
module.exports = async (callback: (error?: any) => number) => {
  try {
    const argv = require('minimist')(process.argv.slice(2), {
      string: ['network', 'identifier'],
    })
    const identifier: string = argv.identifier
    // @ts-ignore soliditySha3 can take an object
    const identifierHash: string = await IdentityUtils.identityHash(identifier)
    const attestations: AttestationsInstance = await getDeployedProxiedContract<
      AttestationsInstance
    >('Attestations', artifacts)

    const currentAccounts = await attestations.lookupAccountsForIdentifier(identifierHash)
    const account = (await web3.eth.getAccounts())[0]
    const index = currentAccounts.indexOf(account)

    if (index === -1) {
      console.log('Account is not attested to')
      callback()
    }

    console.log('Revoking verification')
    console.log((await attestations.revoke(identifierHash, index)).tx)
    callback()
  } catch (error) {
    callback(error)
  }
}
