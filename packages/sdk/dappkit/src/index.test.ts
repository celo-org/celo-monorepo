import {
  normalizeAddressWith0x,
  privateKeyToAddress,
  privateKeyToPublicKey,
} from '@celo/utils/lib/address'
import { waitForAccountAuth } from './index'

const CHAIN_ID = 44378

const PRIVATE_KEY1 = '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
const PUBLIC_KEY1 = privateKeyToPublicKey(PRIVATE_KEY1)
const ACCOUNT_ADDRESS1 = normalizeAddressWith0x(privateKeyToAddress(PRIVATE_KEY1))

describe(waitForAccountAuth, () => {
  test('blah', async () => {
    console.log(CHAIN_ID, PUBLIC_KEY1, ACCOUNT_ADDRESS1, waitForAccountAuth('blah'))
  })
})
