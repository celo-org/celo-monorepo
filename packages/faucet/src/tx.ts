// tslint:disable: max-classes-per-file
// TODO: investigate tslint issues

import Web3 from 'web3'

export function getAddress(web3: Web3, pk: string) {
  pk = Web3.utils.isHexStrict(pk) ? pk : '0x' + pk
  return web3.eth.accounts.privateKeyToAccount(pk).address
}
