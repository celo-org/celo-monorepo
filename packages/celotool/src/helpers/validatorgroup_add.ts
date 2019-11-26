import Web3 from 'web3'
import { newKitFromWeb3 } from '@celo/contractkit'
import { displaySendTx } from '@celo/celocli/lib/utils/cli'
import { importAndUnlockAccount } from './utils'

const web3 = new Web3('http://localhost:8543')
const keystorePath: string = process.env.KEYSTORE || ''
const member: string = process.env.MEMBER || ''
;(async () => {
  const kit = newKitFromWeb3(web3)
  const account = await importAndUnlockAccount(web3, keystorePath)
  const from = account.address
  const validatorContract = await kit.contracts.getValidators()
  if (await validatorContract.isValidatorGroup(from)) {
    const addTx = await validatorContract.addMember(from, member)
    await displaySendTx('addMember', addTx, { from: from })
  }
})()
