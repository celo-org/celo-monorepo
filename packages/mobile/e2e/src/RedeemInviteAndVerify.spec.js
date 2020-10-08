import dismissBanners from './utils/banners'
import { enterPinUi, enterPinUiIfNecessary, sleep, waitForElementId } from './utils/utils'
import { receiveSms } from './utils/twilio'

const VERIFICATION_COUNTRY = 'US'
const VERIFICATION_PHONE_NUMBER = '2057368924'
const EXAMPLE_NAME = 'Test Name'

describe('Redeem invite code and verify number', () => {
  beforeEach(dismissBanners)

  it('Onboard and redeem invite code', async () => {
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

    await element(by.id('inviteCodeInput')).replaceText(process.env.INVITE_CODE)

    await waitForElementId('VerificationEducationContinue', 100000)
    await expect(element(by.id('VerificationEducationContinue'))).toBeVisible()
  })

  it('Verify Phone Number', async () => {
    await element(by.id('VerificationEducationContinue')).tap()

    // Wait for the countdown to finish.
    await sleep(45000)
    await enterPinUiIfNecessary()
    await waitForElementId('VerificationCode0', 120000)

    const codes = await receiveSms()
    for (let i = 0; i < 3; i++) {
      await element(by.id(`VerificationCode${i}`)).replaceText(codes[i])
    }

    await waitForElementId('ImportContactsSkip')
    await element(by.id('ImportContactsSkip')).tap()

    await sleep(3000)
    await expect(element(by.id('SendOrRequestBar'))).toBeVisible()
  })
})
