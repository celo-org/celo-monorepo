// tslint:disable:no-console
import { newKitFromWeb3 } from '@celo/contractkit'
import Web3 from 'web3'
import { add0x } from '../lib/generate_utils'
import {
  delay,
  displaySendTx,
  generatePublicKeyFromPrivateKey,
  importAndUnlockAccount,
} from './utils'

const web3 = new Web3('http://localhost:8543')
const keystorePath: string = process.env.KEYSTORE || ''
void (async () => {
  const kit = newKitFromWeb3(web3)
  const account = await importAndUnlockAccount(web3, keystorePath)
  const from = account.address
  const accountContract = await kit.contracts.getAccounts()
  const isAccount = await accountContract.isAccount(from)
  if (!isAccount) {
    // register
    await displaySendTx('register', accountContract.createAccount(), { from })
    // set name
    const accountName: string = process.env.NAME || `account-${account.address}`
    await delay(1000)
    await displaySendTx('setName', accountContract.setName(accountName), { from })
    // set encryption key
    const publicKey = add0x(generatePublicKeyFromPrivateKey(account.privateKey.slice(2)))
    const registerDataEncryptionKeyTx = accountContract.setAccountDataEncryptionKey(
      publicKey as any
    )
    await displaySendTx('encryption', registerDataEncryptionKeyTx, { from })
  }
  console.log(account)
})()
