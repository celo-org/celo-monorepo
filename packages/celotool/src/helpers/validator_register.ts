import Web3 from 'web3'
import { newKitFromWeb3 } from '@celo/contractkit'
import { displaySendTx } from '@celo/celocli/lib/utils/cli'
import { delay, getPublicKeysData, importAndUnlockAccount, lockGoldIfNeeded } from './utils'

const web3 = new Web3('http://localhost:8543')
const keystorePath: string = process.env.KEYSTORE || ''
const validatorGroup: string = process.env.GROUP || '0x0'
;(async () => {
  const kit = newKitFromWeb3(web3)
  const account = await importAndUnlockAccount(web3, keystorePath)
  const from = account.address
  const pubkey = getPublicKeysData(account.privateKey)
  const validatorContract = await kit.contracts.getValidators()
  if (!(await validatorContract.isValidator(from))) {
    await lockGoldIfNeeded(web3, from)
    await delay(1000)
    console.log(pubkey)

    // todo: generate blsPublicKey & blsPop
    const blsPublicKey = ''
    const blsPop = ''
    const txRegisterVal = validatorContract.registerValidator(pubkey as any, blsPublicKey, blsPop)
    await displaySendTx('registerValidator', await txRegisterVal, { from: from })
    await delay(1000)
  }
  const me = await validatorContract.getValidator(from)
  console.log('affiliation', validatorGroup)
  if (me.affiliation === '0x0000000000000000000000000000000000000000') {
    const txAffiliate = validatorContract.affiliate(validatorGroup)
    await displaySendTx('affiliate', txAffiliate, { from: from })
  }

  console.log(await validatorContract.getValidator(from))
})()
