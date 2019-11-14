import Web3 from 'web3'
import fs from 'fs'
import * as bls12377js from 'bls12377js'
import { displaySendTx } from '@celo/celocli/lib/utils/cli'
import { newKitFromWeb3 } from '@celo/contractkit'
import {
  generateAccountAddressFromPrivateKey,
  generatePublicKeyFromPrivateKey,
} from '@celo/protocol/lib/web3-utils'
import { blsPrivateKeyToProcessedPrivateKey } from '@celo/utils/lib/bls'
import { add0x } from '../lib/generate_utils'
import BigNumber from 'bignumber.js'

export async function importAndUnlockAccount(
  web3: Web3,
  keystorePath: string,
  password: string = ''
) {
  console.log(keystorePath)
  const keystore = fs.readFileSync(keystorePath, 'utf8')
  // @ts-ignore
  const account = web3.eth.accounts.decrypt(keystore, password)
  await web3.eth.personal.unlockAccount(account.address, password, 300000)
  return account
}

export function getPublicKeysData(validatorPrivateKey: string) {
  const validatorPrivateKeyHexStripped = validatorPrivateKey.slice(2)
  const address = generateAccountAddressFromPrivateKey(validatorPrivateKey)
  const publicKey = generatePublicKeyFromPrivateKey(validatorPrivateKeyHexStripped)
  const blsValidatorPrivateKeyBytes = blsPrivateKeyToProcessedPrivateKey(
    validatorPrivateKeyHexStripped
  )
  const blsPublicKey = bls12377js.BLS.privateToPublicBytes(blsValidatorPrivateKeyBytes).toString(
    'hex'
  )
  const blsPoP = bls12377js.BLS.signPoP(
    blsValidatorPrivateKeyBytes,
    Buffer.from(address.slice(2), 'hex')
  ).toString('hex')
  return add0x(publicKey + blsPublicKey + blsPoP)
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
