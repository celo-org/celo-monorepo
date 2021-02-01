import { enterPinUi, sleep, waitForElementId } from '../utils/utils'
import { SAMPLE_BACKUP_KEY } from '../utils/consts'

const EXAMPLE_NAME = 'Test Name'

export default NewAccountOnboarding = () => {
  it('Create a new account', async () => {
    // Onboading education has 3 steps
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
    await element(by.id('NameAndPictureContinueButton')).tap()

    // Set & Verify pin
    await enterPinUi()
    await enterPinUi()

    // Skip Phone Number verification
    await element(by.id('VerificationEducationSkipHeader')).tap()
    await element(by.id('VerificationSkipDialog/PrimaryAction')).tap()

    // Arrived to Home screen
    await expect(element(by.id('SendOrRequestBar'))).toBeVisible()
  })
}
