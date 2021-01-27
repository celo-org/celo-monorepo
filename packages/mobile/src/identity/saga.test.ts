import { expectSaga } from 'redux-saga-test-plan'
import { select } from 'redux-saga/effects'
import { showErrorInline } from 'src/alert/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import {
  Actions,
  ValidateRecipientAddressAction,
  validateRecipientAddressSuccess,
} from 'src/identity/actions'
import { AddressValidationType, e164NumberToAddressSelector } from 'src/identity/reducer'
import { watchValidateRecipientAddress } from 'src/identity/saga'
import { currentAccountSelector } from 'src/web3/selectors'
import {
  mockAccount,
  mockAccount2,
  mockAccountInvite,
  mockE164NumberInvite,
  mockE164NumberToAddress,
  mockInvitableRecipient2,
} from 'test/values'

describe(watchValidateRecipientAddress, () => {
  beforeAll(() => {
    jest.useRealTimers()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('full validation fails if the inputted address does not belong to the recipient', async () => {
    const validateAction: ValidateRecipientAddressAction = {
      type: Actions.VALIDATE_RECIPIENT_ADDRESS,
      userInputOfFullAddressOrLastFourDigits: mockAccount2,
      addressValidationType: AddressValidationType.FULL,
      recipient: mockInvitableRecipient2,
    }

    await expectSaga(watchValidateRecipientAddress)
      .provide([
        [select(currentAccountSelector), mockAccount],
        [select(e164NumberToAddressSelector), mockE164NumberToAddress],
      ])
      .dispatch(validateAction)
      .put(showErrorInline(ErrorMessages.ADDRESS_VALIDATION_NO_MATCH))
      .run()
  })

  it('full validation succeeds if the inputted address belongs to the recipient', async () => {
    const validateAction: ValidateRecipientAddressAction = {
      type: Actions.VALIDATE_RECIPIENT_ADDRESS,
      userInputOfFullAddressOrLastFourDigits: mockAccountInvite,
      addressValidationType: AddressValidationType.FULL,
      recipient: mockInvitableRecipient2,
    }

    await expectSaga(watchValidateRecipientAddress)
      .provide([
        [select(currentAccountSelector), mockAccount],
        [select(e164NumberToAddressSelector), mockE164NumberToAddress],
      ])
      .dispatch(validateAction)
      .put(validateRecipientAddressSuccess(mockE164NumberInvite, mockAccountInvite.toLowerCase()))
      .run()
  })

  it('partial validation fails if the inputted address does not belong to the recipient', async () => {
    const validateAction: ValidateRecipientAddressAction = {
      type: Actions.VALIDATE_RECIPIENT_ADDRESS,
      userInputOfFullAddressOrLastFourDigits: mockAccount2.slice(-4),
      addressValidationType: AddressValidationType.PARTIAL,
      recipient: mockInvitableRecipient2,
    }

    await expectSaga(watchValidateRecipientAddress)
      .provide([
        [select(currentAccountSelector), mockAccount],
        [select(e164NumberToAddressSelector), mockE164NumberToAddress],
      ])
      .dispatch(validateAction)
      .put(showErrorInline(ErrorMessages.ADDRESS_VALIDATION_NO_MATCH))
      .run()
  })

  it('partial validation succeeds if the inputted address belongs to the recipient', async () => {
    const validateAction: ValidateRecipientAddressAction = {
      type: Actions.VALIDATE_RECIPIENT_ADDRESS,
      userInputOfFullAddressOrLastFourDigits: mockAccountInvite.slice(-4),
      addressValidationType: AddressValidationType.PARTIAL,
      recipient: mockInvitableRecipient2,
    }

    await expectSaga(watchValidateRecipientAddress)
      .provide([
        [select(currentAccountSelector), mockAccount],
        [select(e164NumberToAddressSelector), mockE164NumberToAddress],
      ])
      .dispatch(validateAction)
      .put(validateRecipientAddressSuccess(mockE164NumberInvite, mockAccountInvite.toLowerCase()))
      .run()
  })
})
