import Web3 from 'web3'
import fs from 'fs'
import { displaySendTx } from '../../../cli/lib/utils/cli'
import { newKitFromWeb3 } from '@celo/contractkit'
import BigNumber from 'bignumber.js'
import { ec as EC } from 'elliptic'

const ec = new EC('secp256k1')

export function generatePublicKeyFromPrivateKey(privateKey: string) {
  const ecPrivateKey = ec.keyFromPrivate(Buffer.from(privateKey, 'hex'))
  const ecPublicKey: string = ecPrivateKey.getPublic('hex')
  return ecPublicKey.slice(2)
}

export function generateAccountAddressFromPrivateKey(web3: Web3, privateKey: string) {
  if (!privateKey.startsWith('0x')) {
    privateKey = '0x' + privateKey
  }
  // @ts-ignore-next-line
  return web3.eth.accounts.privateKeyToAccount(privateKey).address
}

export async function importAndUnlockAccount(
  web3: Web3,
  keystorePath: string,
  password: string = '/dev/null'
) {
  console.log(keystorePath)
  const keystore = fs.readFileSync(keystorePath, 'utf8')
  // @ts-ignore
  const account = web3.eth.accounts.decrypt(keystore, password)
  await web3.eth.personal.unlockAccount(account.address, password, 300000)
  return account
}

export async function lockGoldIfNeeded(web3: Web3, from: string) {
  const minLockedGold = new BigNumber(20000000000000000000000)
  const kit = newKitFromWeb3(web3)
  const lockedGoldContract = await kit.contracts.getLockedGold()
  const nonvotingGold = await lockedGoldContract.getAccountNonvotingLockedGold(from)
  if (nonvotingGold.lt(minLockedGold)) {
    const txLock = lockedGoldContract.lock()
    await displaySendTx('lock', txLock, {
      from: from,
      value: minLockedGold.toString(),
    })
  }
}

export function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
