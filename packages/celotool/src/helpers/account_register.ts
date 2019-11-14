import Web3 from 'web3'
import { newKitFromWeb3 } from '@celo/contractkit'
import { displaySendTx } from '@celo/celocli/lib/utils/cli'
import { delay, importAndUnlockAccount } from './utils'
import { add0x, generatePublicKeyFromPrivateKey } from '@celo/protocol/lib/web3-utils'

const web3 = new Web3('http://localhost:8543')
const keystorePath: string = process.env.KEYSTORE || ''
;(async () => {
  const kit = newKitFromWeb3(web3)
  const account = await importAndUnlockAccount(web3, keystorePath)
  const from = account.address
  const accountContract = await kit.contracts.getAccounts()
  const isAccount = await accountContract.isAccount(from)
  if (!isAccount) {
    // register
    await displaySendTx('register', accountContract.createAccount(), { from: from })
    // set name
    const accountName: string = process.env.NAME || `account-${account.address}`
    await delay(1000)
    await displaySendTx('setName', accountContract.setName(accountName), { from: from })
    // set encryption key
    const publicKey = add0x(generatePublicKeyFromPrivateKey(account.privateKey.slice(2)))
    const registerDataEncryptionKeyTx = accountContract.setAccountDataEncryptionKey(
      publicKey as any
    )
    await displaySendTx('encryption', registerDataEncryptionKeyTx, { from: from })
  }
  console.log(account)
})()
