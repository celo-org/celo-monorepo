import { eqAddress, NULL_ADDRESS } from '@celo/base'
import { AttestationStat } from '@celo/contractkit/lib/wrappers/Attestations'
import { expectSaga } from 'redux-saga-test-plan'
import { throwError } from 'redux-saga-test-plan/providers'
import { call, select } from 'redux-saga/effects'
import { setUserContactDetails } from 'src/account/actions'
import { defaultCountryCodeSelector, e164NumberSelector } from 'src/account/selectors'
import { showError } from 'src/alert/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import {
  requireSecureSend,
  updateE164PhoneNumberAddresses,
  updateWalletToAccountAddress,
} from 'src/identity/actions'
import { doImportContactsWrapper, fetchAddressesAndValidateSaga } from 'src/identity/contactMapping'
import { fetchPhoneHashPrivate } from 'src/identity/privateHashing'
import {
  AddressValidationType,
  e164NumberToAddressSelector,
  secureSendPhoneNumberMappingSelector,
} from 'src/identity/reducer'
import { setPhoneRecipientCache } from 'src/recipients/actions'
import { contactsToRecipients } from 'src/recipients/recipient'
import { getAllContacts } from 'src/utils/contacts'
import { getContractKitAsync } from 'src/web3/contracts'
import { getConnectedAccount } from 'src/web3/saga'
import { currentAccountSelector } from 'src/web3/selectors'
import {
  mockAccount,
  mockAccount2,
  mockAccount3,
  mockAccountInvite,
  mockContactList,
  mockContactWithPhone2,
  mockE164Number,
  mockE164NumberHash,
} from 'test/values'

const recipients = contactsToRecipients(mockContactList, '+1')

describe('Import Contacts Saga', () => {
  it('imports contacts and creates contact mappings correctly', async () => {
    await expectSaga(doImportContactsWrapper, { doMatchmaking: false })
      .provide([
        [call(getConnectedAccount), null],
        [call(getAllContacts), mockContactList],
        [select(defaultCountryCodeSelector), '+1'],
        [select(e164NumberSelector), mockE164Number],
      ])
      .put(
        setUserContactDetails(
          mockContactWithPhone2.recordID,
          mockContactWithPhone2.thumbnailPath || null
        )
      )
      .put(setPhoneRecipientCache(recipients))
      .run()
  })

  it('shows errors correctly', async () => {
    await expectSaga(doImportContactsWrapper, { doMatchmaking: false })
      .provide([
        [call(getConnectedAccount), null],
        [call(getAllContacts), throwError(new Error('fake error'))],
        [select(defaultCountryCodeSelector), '+1'],
        [select(e164NumberSelector), mockE164Number],
      ])
      .put(showError(ErrorMessages.IMPORT_CONTACTS_FAILED))
      .run()
  })
})

describe('Fetch Addresses Saga', () => {
  it('fetches and caches addresses correctly when walletAddress === accountAddress', async () => {
    const contractKit = await getContractKitAsync()

    const mockWallet = mockAccount

    const mockE164NumberToAddress = {
      [mockE164Number]: [mockAccount.toLowerCase()],
    }

    const mockAccountsForIdentifier: string[] = [mockAccount]

    const mockStats: AttestationStat = {
      completed: 3,
      total: 3,
    }

    const mockAttestationsWrapper = {
      lookupAccountsForIdentifier: jest.fn(() => mockAccountsForIdentifier),
      getAttestationStat: jest.fn(() => mockStats),
    }

    const mockAccountsWrapper = {
      getWalletAddress: jest.fn(() => mockWallet),
    }

    await expectSaga(fetchAddressesAndValidateSaga, {
      e164Number: mockE164Number,
    })
      .provide([
        [select(e164NumberToAddressSelector), mockE164NumberToAddress],
        [call(fetchPhoneHashPrivate, mockE164Number), { phoneHash: mockE164NumberHash }],
        [
          call([contractKit.contracts, contractKit.contracts.getAttestations]),
          mockAttestationsWrapper,
        ],
        [call([contractKit.contracts, contractKit.contracts.getAccounts]), mockAccountsWrapper],
        [select(currentAccountSelector), mockAccount],
        [select(secureSendPhoneNumberMappingSelector), {}],
      ])
      .put(updateE164PhoneNumberAddresses({ [mockE164Number]: undefined }, {}))
      .put(updateWalletToAccountAddress({ [mockWallet.toLowerCase()]: mockAccount.toLowerCase() }))
      .put(
        updateE164PhoneNumberAddresses(
          {
            [mockE164Number]: [mockWallet.toLowerCase()],
          },
          {
            [mockWallet.toLowerCase()]: mockE164Number,
          }
        )
      )
      .run()
  })

  it('fetches and caches addresses correctly when walletAddress !== accountAddress', async () => {
    const contractKit = await getContractKitAsync()

    const mockWallet = mockAccount2

    const mockE164NumberToAddress = {
      [mockE164Number]: [mockAccount.toLowerCase()],
    }

    const mockAccountsForIdentifier: string[] = [mockAccount]

    const mockStats: AttestationStat = {
      completed: 3,
      total: 3,
    }

    const mockAttestationsWrapper = {
      lookupAccountsForIdentifier: jest.fn(() => mockAccountsForIdentifier),
      getAttestationStat: jest.fn(() => mockStats),
    }

    const mockAccountsWrapper = {
      getWalletAddress: jest.fn(() => mockWallet),
    }

    await expectSaga(fetchAddressesAndValidateSaga, {
      e164Number: mockE164Number,
    })
      .provide([
        [select(e164NumberToAddressSelector), mockE164NumberToAddress],
        [call(fetchPhoneHashPrivate, mockE164Number), { phoneHash: mockE164NumberHash }],
        [
          call([contractKit.contracts, contractKit.contracts.getAttestations]),
          mockAttestationsWrapper,
        ],
        [call([contractKit.contracts, contractKit.contracts.getAccounts]), mockAccountsWrapper],
        [select(currentAccountSelector), mockAccount],
        [select(secureSendPhoneNumberMappingSelector), {}],
      ])
      .put(updateE164PhoneNumberAddresses({ [mockE164Number]: undefined }, {}))
      .put(updateWalletToAccountAddress({ [mockWallet.toLowerCase()]: mockAccount.toLowerCase() }))
      .put(
        updateE164PhoneNumberAddresses(
          {
            [mockE164Number]: [mockWallet.toLowerCase()],
          },
          {
            [mockWallet.toLowerCase()]: mockE164Number,
          }
        )
      )
      .run()
  })

  it('fetches and caches addresses correctly when there is not a registered walletAddress', async () => {
    const contractKit = await getContractKitAsync()

    const mockE164NumberToAddress = {
      [mockE164Number]: [mockAccount.toLowerCase()],
    }

    const mockAccountsForIdentifier: string[] = [mockAccount]

    const mockStats: AttestationStat = {
      completed: 3,
      total: 3,
    }

    const mockAttestationsWrapper = {
      lookupAccountsForIdentifier: jest.fn(() => mockAccountsForIdentifier),
      getAttestationStat: jest.fn(() => mockStats),
    }

    const mockAccountsWrapper = {
      getWalletAddress: jest.fn(() => NULL_ADDRESS),
    }

    await expectSaga(fetchAddressesAndValidateSaga, {
      e164Number: mockE164Number,
    })
      .provide([
        [select(e164NumberToAddressSelector), mockE164NumberToAddress],
        [call(fetchPhoneHashPrivate, mockE164Number), { phoneHash: mockE164NumberHash }],
        [
          call([contractKit.contracts, contractKit.contracts.getAttestations]),
          mockAttestationsWrapper,
        ],
        [call([contractKit.contracts, contractKit.contracts.getAccounts]), mockAccountsWrapper],
        [select(currentAccountSelector), mockAccount],
        [select(secureSendPhoneNumberMappingSelector), {}],
      ])
      .put(updateE164PhoneNumberAddresses({ [mockE164Number]: undefined }, {}))
      .put(updateWalletToAccountAddress({ [mockAccount.toLowerCase()]: mockAccount.toLowerCase() }))
      .put(
        updateE164PhoneNumberAddresses(
          {
            [mockE164Number]: [mockAccount.toLowerCase()],
          },
          {
            [mockAccount.toLowerCase()]: mockE164Number,
          }
        )
      )
      .run()
  })

  it('requires SecureSend with partial verification when a new adddress is added and last 4 digits are unique', async () => {
    const contractKit = await getContractKitAsync()

    const mockWallet = mockAccount
    const mockWallet2 = mockAccount2

    const mockAccountsForIdentifier: string[] = [mockAccount, mockAccount2]

    const mockStats: AttestationStat = {
      completed: 3,
      total: 3,
    }

    const mockAttestationsWrapper = {
      lookupAccountsForIdentifier: jest.fn(() => mockAccountsForIdentifier),
      getAttestationStat: jest.fn(() => mockStats),
    }

    const mockAccountsWrapper = {
      getWalletAddress: jest.fn((address) => {
        if (eqAddress(address, mockAccount)) {
          return mockWallet
        }

        if (eqAddress(address, mockAccount2)) {
          return mockWallet2
        }

        return NULL_ADDRESS
      }),
    }

    await expectSaga(fetchAddressesAndValidateSaga, {
      e164Number: mockE164Number,
    })
      .provide([
        [select(e164NumberToAddressSelector), {}],
        [call(fetchPhoneHashPrivate, mockE164Number), { phoneHash: mockE164NumberHash }],
        [
          call([contractKit.contracts, contractKit.contracts.getAttestations]),
          mockAttestationsWrapper,
        ],
        [call([contractKit.contracts, contractKit.contracts.getAccounts]), mockAccountsWrapper],
        [select(currentAccountSelector), mockAccountInvite],
        [select(secureSendPhoneNumberMappingSelector), {}],
      ])
      .put(updateE164PhoneNumberAddresses({ [mockE164Number]: undefined }, {}))
      .put(
        updateWalletToAccountAddress({
          [mockWallet.toLowerCase()]: mockAccount.toLowerCase(),
          [mockWallet2.toLowerCase()]: mockAccount2.toLowerCase(),
        })
      )
      .put(requireSecureSend(mockE164Number, AddressValidationType.PARTIAL))
      .put(
        updateE164PhoneNumberAddresses(
          {
            [mockE164Number]: [mockWallet.toLowerCase(), mockWallet2.toLowerCase()],
          },
          {
            [mockWallet.toLowerCase()]: mockE164Number,
            [mockWallet2.toLowerCase()]: mockE164Number,
          }
        )
      )
      .run()
  })

  it('requires SecureSend with full verification when a new adddress is added and last 4 digits are not unique', async () => {
    const contractKit = await getContractKitAsync()

    const mockWallet = mockAccount
    const mockWallet3 = mockAccount3

    const mockAccountsForIdentifier: string[] = [mockAccount, mockAccount3]

    const mockStats: AttestationStat = {
      completed: 3,
      total: 3,
    }

    const mockAttestationsWrapper = {
      lookupAccountsForIdentifier: jest.fn(() => mockAccountsForIdentifier),
      getAttestationStat: jest.fn(() => mockStats),
    }

    const mockAccountsWrapper = {
      getWalletAddress: jest.fn((address) => {
        if (eqAddress(address, mockAccount)) {
          return mockWallet
        }

        if (eqAddress(address, mockAccount3)) {
          return mockWallet3
        }

        return NULL_ADDRESS
      }),
    }

    await expectSaga(fetchAddressesAndValidateSaga, {
      e164Number: mockE164Number,
    })
      .provide([
        [select(e164NumberToAddressSelector), {}],
        [call(fetchPhoneHashPrivate, mockE164Number), { phoneHash: mockE164NumberHash }],
        [
          call([contractKit.contracts, contractKit.contracts.getAttestations]),
          mockAttestationsWrapper,
        ],
        [call([contractKit.contracts, contractKit.contracts.getAccounts]), mockAccountsWrapper],
        [select(currentAccountSelector), mockAccountInvite],
        [select(secureSendPhoneNumberMappingSelector), {}],
      ])
      .put(updateE164PhoneNumberAddresses({ [mockE164Number]: undefined }, {}))
      .put(
        updateWalletToAccountAddress({
          [mockWallet.toLowerCase()]: mockAccount.toLowerCase(),
          [mockWallet3.toLowerCase()]: mockAccount3.toLowerCase(),
        })
      )
      .put(requireSecureSend(mockE164Number, AddressValidationType.FULL))
      .put(
        updateE164PhoneNumberAddresses(
          {
            [mockE164Number]: [mockWallet.toLowerCase(), mockWallet3.toLowerCase()],
          },
          {
            [mockWallet.toLowerCase()]: mockE164Number,
            [mockWallet3.toLowerCase()]: mockE164Number,
          }
        )
      )
      .run()
  })
})
