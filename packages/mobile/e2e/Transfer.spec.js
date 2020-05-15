import { skipTo, sleep } from './utils'

const ENABLE_CONTACT_IMPORT = false

// skip import because it's timing out for some reason
// anyways the emulator currently has no contacts

const SAMPLE_BACKUP_KEY =
  'nose inherit merry deal scout boss siren soul piece become better unit observe another horn ranch velvet kid frog pretty powder convince identify guilt'
const VERIFICATION_COUNTRY = 'Germany'
const VERIFICATION_PHONE_NUMBER = '030 111111'
const EXAMPLE_NAME = 'Test Name'

// clicks an element if it sees it
async function bannerDismiss(inElement, tapElement) {
  try {
    await waitFor(element(inElement))
      .toBeVisible()
      .withTimeout(2000)
    if (tapElement) {
      await element(tapElement).tap()
    } else {
      await element(inElement).tap()
    }
  } catch (e) {
    // TODO take a screenshot
  }
}

describe('Transfer Works', () => {
  beforeEach(async () => {
    await bannerDismiss(by.id('errorBanner'))
    await bannerDismiss(by.id('SmartTopAlertButton'))
  })

  it('NUX->Language', async () => {
    await element(by.id('ChooseLanguage/en-US')).tap()
    await element(by.id('ChooseLanguageButton')).tap()
  })

  it('NUX->Join', async () => {
    await waitFor(element(by.id('JoinCeloContinueButton')))
      .toBeVisible()
      .withTimeout(2000)

    await element(by.id('NameEntry')).replaceText(EXAMPLE_NAME)

    await element(by.id('CountryNameFieldTextInput')).replaceText(VERIFICATION_COUNTRY)

    await expect(element(by.id('PhoneNumberField'))).toBeVisible()
    await element(by.id('PhoneNumberField')).replaceText(VERIFICATION_PHONE_NUMBER)

    await element(by.id('JoinCeloContinueButton')).tap()
  })

  it('NUX-Terms', async () => {
    await element(by.id('scrollView')).scrollTo('bottom')
    expect(element(by.id('AcceptTermsButton'))).toBeVisible()
    await element(by.id('AcceptTermsButton')).tap()
  })

  it('NUX->Pin', async () => {
    await expect(element(by.id('SystemAuthTitle'))).toBeVisible()
    await expect(element(by.id('SystemAuthContinue'))).toBeVisible()

    // TODO: enter pin using custom keypad

    await element(by.id('SystemAuthContinue')).tap()
  })

  it.skip('NUX->Invite', async () => {
    await waitFor(element(by.id('InviteCodeTitle')))
      .toBeVisible()
      .withTimeout(2000)

    await element(by.id('ImportExistingUsingBackupKey')).tap()

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

    // waits for button to be enabled
    await sleep(10000)

    await element(by.id('ImportWalletButton')).tap()

    // waits for import to finish
    await sleep(10000)
  })

  it.skip('NUX->VerifyEducation', async () => {
    await waitFor(element(by.id('VerifyEducationHeader')))
      .toBeVisible()
      .withTimeout(10000000)

    await waitFor(element(by.id('VerifyContinueButton')))
      .toBeVisible()
      .withTimeout(10000)

    await waitFor(element(by.id('VerifyLogo')))
      .toBeVisible()
      .withTimeout(1000)

    // will skip in next test
    // await element(by.id('VerifyContinueButton')).tap()
  })

  it.skip('NUX->Verify', async () => {
    // skipping for now
    skipTo('WalletHome')
    await sleep(10000)
  })

  it.skip('Wallet Home', async () => {
    await waitFor(element(by.id('AccountOverviewInHome/dollarBalance')))
      .toBeVisible()
      .withTimeout(10000)

    await waitFor(element(by.id('AccountOverviewInHome/goldBalance')))
      .toBeVisible()
      .withTimeout(10000)
  })

  it.skip('Wallet Home->Send', async () => {
    await element(by.id('SendNavigator')).tap()

    await waitFor(element(by.id('RecipientPicker')))
      .toBeVisible()
      .withTimeout(10000)
  })
})
