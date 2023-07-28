import { newKit } from '@celo/contractkit'
import { OdisUtils } from '@celo/identity-prev'
import { getServiceContext } from '@celo/identity-prev/lib/odis/query'
import { ErrorMessages } from '@celo/identity/lib/odis/query'
import { ensureLeading0x } from '@celo/utils/lib/address'
import 'isomorphic-fetch'
import {
  ACCOUNT_ADDRESS,
  ACCOUNT_ADDRESS_NO_QUOTA,
  DEFAULT_FORNO_URL,
  dekAuthSigner,
  deks,
  getTestContextName,
  PHONE_NUMBER,
  PRIVATE_KEY,
  PRIVATE_KEY_NO_QUOTA,
} from './resources'

require('dotenv').config()

jest.setTimeout(60000)

const contractKit = newKit(DEFAULT_FORNO_URL)
contractKit.addAccount(PRIVATE_KEY_NO_QUOTA)
contractKit.addAccount(PRIVATE_KEY)
contractKit.defaultAccount = ACCOUNT_ADDRESS

const SERVICE_CONTEXT = getServiceContext(getTestContextName())

const fullNodeUrl = process.env.ODIS_BLOCKCHAIN_PROVIDER

describe(`Running against service deployed at ${SERVICE_CONTEXT.odisUrl} w/ blockchain provider ${fullNodeUrl}`, () => {
  beforeAll(async () => {
    const dek0 = ensureLeading0x(deks[0].publicKey)
    const accountsWrapper = await contractKit.contracts.getAccounts()
    if ((await accountsWrapper.getDataEncryptionKey(ACCOUNT_ADDRESS)) !== dek0) {
      await accountsWrapper
        .setAccountDataEncryptionKey(dek0)
        .sendAndWaitForReceipt({ from: ACCOUNT_ADDRESS })
    }
    if ((await accountsWrapper.getDataEncryptionKey(ACCOUNT_ADDRESS_NO_QUOTA)) !== dek0) {
      await accountsWrapper
        .setAccountDataEncryptionKey(dek0)
        .sendAndWaitForReceipt({ from: ACCOUNT_ADDRESS_NO_QUOTA })
    }
  })
  describe('Returns ODIS_QUOTA_ERROR', () => {
    it('When querying out of quota', async () => {
      await expect(
        OdisUtils.PhoneNumberIdentifier.getPhoneNumberIdentifier(
          PHONE_NUMBER,
          ACCOUNT_ADDRESS_NO_QUOTA,
          dekAuthSigner(0),
          SERVICE_CONTEXT
        )
      ).rejects.toThrow(ErrorMessages.ODIS_QUOTA_ERROR)
    })
  })
})
