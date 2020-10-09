import dismissBanners from './utils/banners'
import { enterPinUi, enterPinUiIfNecessary, sleep, waitForElementId } from './utils/utils'
import { receiveSms } from './utils/twilio'

const VERIFICATION_COUNTRY = 'US'
const VERIFICATION_PHONE_NUMBER = '2057368924'
const EXAMPLE_NAME = 'Test Name'

const RUN_VERIFICATION_TEST = !!process.env.INVITE_CODE

describe('Redeem invite code and verify number', () => {
  beforeEach(dismissBanners)

  it('Redeem invite code and verify number', async () => {
    if (!RUN_VERIFICATION_TEST) {
      return
    }
    for (let i = 0; i < 3; i++) {
      await element(by.id('Education/progressButton')).tap()
    }

    await element(by.id('CreateAccountButton')).tap()

    // Accept Terms
    await element(by.id('scrollView')).scrollTo('bottom')
    await expect(element(by.id('AcceptTermsButton'))).toBeVisible()
    await element(by.id('AcceptTermsButton')).tap()

    // Set name and number
    await element(by.id('NameEntry')).replaceText(EXAMPLE_NAME)
    await expect(element(by.id('PhoneNumberField'))).toBeVisible()
    await element(by.id('PhoneNumberField')).replaceText(VERIFICATION_PHONE_NUMBER)
    await element(by.id('NameAndNumberContinueButton')).tap()

    // Set & Verify pin
    await enterPinUi()
    await enterPinUi()

    // Write invite code!
    await element(by.id('inviteCodeInput')).replaceText(process.env.INVITE_CODE)

    // Wait for invite to finish and start verification.
    await waitForElementId('VerificationEducationContinue', 100000)
    await expect(element(by.id('VerificationEducationContinue'))).toBeVisible()
    await element(by.id('VerificationEducationContinue')).tap()

    // Wait for the countdown to finish.
    await sleep(45000)
    await enterPinUiIfNecessary()
    await waitForElementId('VerificationCode0', 120000)

    // Write the verification codes.
    const codes = await receiveSms()
    for (let i = 0; i < 3; i++) {
      await element(by.id(`VerificationCode${i}`)).replaceText(codes[i])
    }

    // Skip contacts.
    await waitForElementId('ImportContactsSkip')
    await element(by.id('ImportContactsSkip')).tap()

    // Arrived to the Home screen!
    await sleep(3000)
    await expect(element(by.id('SendOrRequestBar'))).toBeVisible()
  })
})
