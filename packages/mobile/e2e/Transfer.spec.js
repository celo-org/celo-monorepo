import { exec } from 'child_process'
import { enterPin, skipTo, sleep } from './utils'

const SAMPLE_BACKUP_KEY =
  'nose inherit merry deal scout boss siren soul piece become better unit observe another horn ranch velvet kid frog pretty powder convince identify guilt'
const VERIFICATION_COUNTRY = 'Germany'
const VERIFICATION_PHONE_NUMBER = '030 901820'
const EXAMPLE_NAME = 'Test Name'

describe('Transfer Works', () => {
  it('NUX->Language', async () => {
    await element(by.id('ChooseLanguage/en-US')).tap()
    await element(by.id('ChooseLanguageButton')).tap()
  })

  it('NUX->Join', async () => {
    await waitFor(element(by.id('JoinCeloContinueButton')))
      .toBeVisible()
      .withTimeout(2000)

    await element(by.id('NameEntry')).replaceText(EXAMPLE_NAME)

    await element(by.id('CountryNameField')).replaceText(VERIFICATION_COUNTRY)

    await expect(element(by.id('PhoneNumberField'))).toBeVisible()
    await element(by.id('PhoneNumberField')).replaceText(VERIFICATION_PHONE_NUMBER)

    await element(by.id('JoinCeloContinueButton')).tap()

    await waitFor(element(by.id('JoinCeloContinueButton')))
      .toBeNotVisible()
      .withTimeout(2000)
  })

  it('NUX->Pin', async () => {
    await expect(element(by.id('SystemAuthTitle'))).toBeVisible()
    await expect(element(by.id('SystemAuthContinue'))).toBeVisible()
    enterPin()
    await element(by.id('SystemAuthContinue')).tap()
    await waitFor(element(by.id('SystemAuthContinue')))
      .toBeNotVisible()
      .withTimeout(2000)
  })

  it('NUX->Invite', async () => {
    await waitFor(element(by.id('InviteCodeTitle')))
      .toBeVisible()
      .withTimeout(2000)

    await element(by.id('ImportExistingUsingBackupKey')).tap()

    await waitFor(element(by.id('ImportWalletBackupKeyInputField')))
      .toBeVisible()
      .withTimeout(2000)

    await element(by.id('ImportWalletBackupKeyInputField')).tap()

    await element(by.id('ImportWalletBackupKeyInputField')).replaceText(SAMPLE_BACKUP_KEY)

    await element(by.id('ImportWalletButton')).tap()

    await waitFor(element(by.id('InviteCodeTitle')))
      .toBeVisible()
      .withTimeout(10000)

    // await expect(element(by.id('ImportWalletButton'))).toBeVisible()

    // await waitFor(element(by.id('ImportWalletButton')))
    //   .toBeNotVisible()
    //   .withTimeout(2000)

    // await element(by.id('ImportWalletButton')).tap()

    // await waitFor(element(by.id('ImportWalletLoadingCircle')))
    //   .toBeNotVisible()
    //   .withTimeout(20000) // have to remoeve this, for some reason it's not shown instantly

    // await waitFor(element(by.id('VerifyContinueButton')))
    //   .toBeVisible()
    //   .withTimeout(5000)
    // await expect(element(by.id('VerifyContinueButton'))).toBeVisible()
  })

  // it('NUX->Verify', async () => {
  //   // TODO: uncomment when verification works again
  //   // await expect(element(by.id('VerifyContinueButton'))).toBeVisible()
  //   // await element(by.id('VerifyContinueButton')).tap()
  //   // await expect(element(by.id('CountryNameField'))).toBeVisible()
  //   // await element(by.id('CountryNameField')).replaceText(VERIFICATION_COUNTRY)
  //   // await expect(element(by.id('PhoneNumberField'))).toBeVisible()
  //   // await element(by.id('PhoneNumberField')).replaceText(VERIFICATION_PHONE_NUMBER)
  //   // await expect(element(by.id('PhoneNumberField'))).toHaveText("(415) 555-5555")
  //   // await expect(element(by.id('VerifyInputAutomaticButton'))).toBeVisible()
  //   // await element(by.id('VerifyInputAutomaticButton')).tap()
  //   // Wait for the three messages
  //   await skipTo('WalletHome')
  // })

  // it('NUX->Home', async () => {
  //   await expect(element(by.id('SendNavigator'))).toBeVisible()
  //   await element(by.id('SendNavigator')).tap()
  // })
})
