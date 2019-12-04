import Web3 from 'web3'
import BigNumber from 'bignumber.js'
import { newKitFromWeb3 } from '@celo/contractkit'
import { displaySendTx } from '../../../cli/lib/utils/cli'
import { delay, importAndUnlockAccount, lockGoldIfNeeded } from './utils'

const web3 = new Web3('http://localhost:8543')
const keystorePath: string = process.env.KEYSTORE || ''
;(async () => {
  const kit = newKitFromWeb3(web3)
  const account = await importAndUnlockAccount(web3, keystorePath)
  const from = account.address
  const validatorContract = await kit.contracts.getValidators()
  console.log(await validatorContract.isValidatorGroup(from))
  if (!(await validatorContract.isValidatorGroup(from))) {
    await lockGoldIfNeeded(web3, from)
    await delay(1000)
    const txRegisterVG = await validatorContract.registerValidatorGroup(new BigNumber(0.1))
    await displaySendTx('registerValidatorGroup', txRegisterVG, { from: from })
  }
})()
