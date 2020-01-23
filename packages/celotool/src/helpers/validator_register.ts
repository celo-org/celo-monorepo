import { newKitFromWeb3 } from '@celo/contractkit'
import { blsPrivateKeyToProcessedPrivateKey } from '@celo/utils/lib/bls'
import * as bls12377js from 'bls12377js'
import Web3 from 'web3'
import { add0x } from '../lib/generate_utils'
import {
  delay,
  displaySendTx,
  generateAccountAddressFromPrivateKey,
  importAndUnlockAccount,
  lockGoldIfNeeded,
} from './utils'

const web3 = new Web3('http://localhost:8543')
const keystorePath: string = process.env.KEYSTORE || ''
const validatorGroup: string = process.env.GROUP || '0x0'
void (async () => {
  const kit = newKitFromWeb3(web3)
  const account = await importAndUnlockAccount(web3, keystorePath)
  const from = account.address
  const validatorPrivateKeyHexStripped = account.privateKey.slice(2)
  const address = generateAccountAddressFromPrivateKey(web3, account.privateKey)
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
  const validatorContract = await kit.contracts.getValidators()
  if (!(await validatorContract.isValidator(from))) {
    await lockGoldIfNeeded(web3, from)
    await delay(1000)
    const txRegisterVal = validatorContract.registerValidator(
      // @ts-ignore incorrect typing for bytes type
      account.address,
      add0x(blsPublicKey),
      add0x(blsPoP)
    )
    await displaySendTx('registerValidator', txRegisterVal, { from })
    await delay(1000)
  }
  const me = await validatorContract.getValidator(from)
  // tslint:disable-next-line:no-console
  console.log('affiliation', validatorGroup)
  if (me.affiliation === '0x0000000000000000000000000000000000000000') {
    const txAffiliate = validatorContract.affiliate(validatorGroup)
    await displaySendTx('affiliate', txAffiliate, { from })
  }

  // tslint:disable-next-line:no-console
  console.log(await validatorContract.getValidator(from))
})()
