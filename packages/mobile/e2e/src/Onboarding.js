import { enterPinUi, sleep } from './utils/utils'
import { SAMPLE_BACKUP_KEY } from './utils/consts'

const VERIFICATION_COUNTRY = 'Germany'
const VERIFICATION_PHONE_NUMBER = '030 111111'
const EXAMPLE_NAME = 'Test Name'

export default Onboarding = () => {
  // Language is auto selected if it matches one of the available locale
  // it('Language', async () => {
  //   await element(by.id('ChooseLanguage/en-US')).tap()
  // })

  it('Onboarding Education', async () => {
    // Onboading education has 3 steps
    for (let i = 0; i < 3; i++) {
      await element(by.id('Education/progressButton')).tap()
    }
  })

  it('Welcome', async () => {
    await element(by.id('RestoreAccountButton')).tap()
  })

  it('Terms', async () => {
    await element(by.id('scrollView')).scrollTo('bottom')
    expect(element(by.id('AcceptTermsButton'))).toBeVisible()
    await element(by.id('AcceptTermsButton')).tap()
  })

  it('Name and Number', async () => {
    await waitFor(element(by.id('NameAndNumberContinueButton')))
      .toBeVisible()
      .withTimeout(2000)

    await element(by.id('NameEntry')).replaceText(EXAMPLE_NAME)

    await element(by.id('CountrySelectionButton')).tap()
    await element(by.id('SearchInput')).replaceText(VERIFICATION_COUNTRY)
    await element(by.id('Country_DE')).tap()

    await expect(element(by.id('PhoneNumberField'))).toBeVisible()
    await element(by.id('PhoneNumberField')).replaceText(VERIFICATION_PHONE_NUMBER)

    await element(by.id('NameAndNumberContinueButton')).tap()
  })

  it('Pin', async () => {
    // Set pin
    await enterPinUi()
    // Verify pin
    await enterPinUi()
  })

  // TODO(erdal) 2 new paths: using invite code, continue without
  // TODO(erdal) get rid of sleeps if possible to make the tests faster

  // Restore existing wallet
  it('Restore Wallet Backup', async () => {
    await waitFor(element(by.id('ImportWalletBackupKeyInputField')))
      .toBeVisible()
      .withTimeout(2000)

    await sleep(1000)

    // wait for connecting banner to go away
    // TODO measure how long this take
    await waitFor(element(by.id('connectingToCelo')))
      .toBeNotVisible()
      .withTimeout(20000)

    await element(by.id('ImportWalletBackupKeyInputField')).tap()
    await element(by.id('ImportWalletBackupKeyInputField')).replaceText(SAMPLE_BACKUP_KEY)
    if (device.getPlatform() === 'ios') {
      // On iOS, type one more space to workaround onChangeText not being triggered with replaceText above
      // and leaving the restore button disabled
      await element(by.id('ImportWalletBackupKeyInputField')).typeText(' ')
    } else if (device.getPlatform() === 'android') {
      // Press back button to close the keyboard
      await device.pressBack()
    }

    await element(by.id('ImportWalletButton')).tap()

    // Wait a little more as import can take some time
    // and triggers the firebase error banner
    // otherwise next step will tap the banner instead of the button
    await sleep(5000)
  })

  it('VerifyEducation', async () => {
    await waitFor(element(by.id('VerificationEducationContinue')))
      .toBeVisible()
      .withTimeout(30000)

    // skip
    await element(by.id('VerificationEducationSkip')).tap()
    // confirmation popup skip
    await element(by.id('VerificationSkipDialog/PrimaryAction')).tap()
  })

  it.skip('Verify', async () => {
    // skipping for now
    // TODO(erdal): implement
  })

  it('Wallet Home', async () => {
    await waitFor(element(by.id('SendOrRequestBar')))
      .toBeVisible()
      .withTimeout(10000)
  })

  // TODO(erdal): generate a new invite
}
