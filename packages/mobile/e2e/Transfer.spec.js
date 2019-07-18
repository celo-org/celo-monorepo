import { exec } from 'child_process'
import { enterPin, skipTo, sleep } from './utils'

const SAMPLE_BACKUP_KEY =
  'nose inherit merry deal scout boss siren soul piece become better unit observe another horn ranch velvet kid frog pretty powder convince identify guilt'
const VERIFICATION_COUNTRY = 'Germany'
const VERIFICATION_PHONE_NUMBER = '+14155555555'

describe('Transfer Works', () => {
  it('NUX->Language', async () => {
    // TEMP: until the sync issue is resolved where
    //       if you don't wait a bit in language screen, sync fails
    await sleep(15000)
    await element(by.id('ChooseLanguage/en-US')).tap()
    await element(by.id('ChooseLanguageButton')).tap()
  })

  it('NUX->Sync', async () => {
    await waitFor(element(by.id('SystemAuthContinue')))
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
    await expect(element(by.id('InviteWallTitle'))).toBeVisible()
    await waitFor(element(by.id('ImportExistingUsingBackupKey')))
      .toBeVisible()
      .withTimeout(2000)
    await element(by.id('ImportExistingUsingBackupKey')).tap()
    await waitFor(element(by.id('ImportWalletBakcupKeyInputField')))
      .toBeVisible()
      .withTimeout(2000)
    await element(by.id('ImportWalletBakcupKeyInputField')).replaceText(SAMPLE_BACKUP_KEY)
    await expect(element(by.id('ImportWalletButton'))).toBeVisible()
    await element(by.id('ImportWalletButton')).tap()
    await waitFor(element(by.id('ImportWalletButton')))
      .toBeNotVisible()
      .withTimeout(20000)
    await waitFor(element(by.id('ImportWalletLoadingCircle')))
      .toBeNotVisible()
      .withTimeout(20000)
    await waitFor(element(by.id('VerifyContinueButton')))
      .toBeVisible()
      .withTimeout(5000)
    await expect(element(by.id('VerifyContinueButton'))).toBeVisible()
    // await expect(element(by.id('CancelButton'))).toBeVisible()
    // await element(by.id('CancelButton')).tap()
  })

  it('NUX->Verify', async () => {
    // TODO: uncomment when verification works again
    // await expect(element(by.id('VerifyContinueButton'))).toBeVisible()
    // await element(by.id('VerifyContinueButton')).tap()
    // await expect(element(by.id('CountryNameField'))).toBeVisible()
    // await element(by.id('CountryNameField')).replaceText(VERIFICATION_COUNTRY)
    // await expect(element(by.id('PhoneNumberField'))).toBeVisible()
    // await element(by.id('PhoneNumberField')).replaceText(VERIFICATION_PHONE_NUMBER)
    // await expect(element(by.id('PhoneNumberField'))).toHaveText("(415) 555-5555")
    // await expect(element(by.id('VerifyInputAutomaticButton'))).toBeVisible()
    // await element(by.id('VerifyInputAutomaticButton')).tap()
    // Wait for the three messages
    await skipTo('WalletHome')
  })

  it('NUX->Home', async () => {
    await expect(element(by.id('SendNavigator'))).toBeVisible()
    await element(by.id('SendNavigator')).tap()
  })
})
