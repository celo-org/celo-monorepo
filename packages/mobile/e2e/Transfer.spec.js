import { enterPinUi, inputNumberKeypad, sleep } from './utils'

const ENABLE_CONTACT_IMPORT = false

// skip import because it's timing out for some reason
// anyways the emulator currently has no contacts

const SAMPLE_BACKUP_KEY =
  'general debate dial flock want basket local machine effort monitor stomach purity attend brand extend salon obscure soul open floor useful like cause exhaust'
const SAMPLE_SAFEGUARD_PHRASE =
  'general debate dial flock want basket local machine effort monitor stomach purity celo'
const SAMPLE_SAFEGUARD_PHRASE_SECONDARY =
  'celo attend brand extend salon obscure soul open floor useful like cause exhaust'
const VERIFICATION_COUNTRY = 'Germany'
const VERIFICATION_PHONE_NUMBER = '030 111111'
const EXAMPLE_NAME = 'Test Name'
const DEFAULT_RECIPIENT_PHONE_NUMBER = '+10000000000'
const DEFAULT_RECIPIENT_ADDRESS = '0x22c8a9178841ba95a944afd1a1faae517d3f5daa'
const AMOUNT_TO_SEND = '0.1'
const CELO_TO_SEND = '0.001'
const RANDOM_COMMENT = 'poker night winnings'

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

  it('Wallet Home->Send', async () => {
    await element(by.id('SendOrRequestBar/SendButton')).tap()

    await element(by.id('SearchInput')).tap()
    await element(by.id('SearchInput')).replaceText(DEFAULT_RECIPIENT_ADDRESS)
    await element(by.id('SearchInput')).tapReturnKey()

    await waitFor(element(by.id('RecipientPicker')))
      .toBeVisible()
      .withTimeout(4000)
    await waitFor(element(by.id('RecipientItem')))
      .toBeVisible()
      .withTimeout(4000)
    await element(by.id('RecipientItem')).tap()
  })

  it('Send -> SendAmount', async () => {
    await waitFor(element(by.id('Review')))
      .toBeVisible()
      .withTimeout(10000)

    await inputNumberKeypad(AMOUNT_TO_SEND)
    await element(by.id('Review')).tap()
  })

  it('SendAmount -> SendConfirmation', async () => {
    await waitFor(element(by.id('commentInput/send')))
      .toBeVisible()
      .withTimeout(10000)

    await element(by.id('commentInput/send')).replaceText(RANDOM_COMMENT)
    await element(by.id('commentInput/send')).tapReturnKey()

    if (device.getPlatform() === 'android') {
      // Workaround keyboard remaining open on Android (tapReturnKey doesn't work there and just adds a new line)
      // so we tap something else in the scrollview to hide the soft keyboard
      await element(by.id('HeaderText')).tap()
    }

    await element(by.id('ConfirmButton')).tap()
  })

  // TODO(erdal): implement Request path

  it('SendConfirmation -> Home', async () => {
    await waitFor(element(by.id('SendOrRequestBar')))
      .toBeVisible()
      .withTimeout(10000)

    // TODO(erdal): look for the latest transaction and
    // make sure it was successful
  })

  it('Wallet Home -> Exchange CELO', async () => {
    // Open Hamburguer menu and go to CELO screen.
    await element(by.id('Hamburguer')).tap()
    await waitFor(element(by.id('DrawerItem/CELO')))
      .toBeVisible()
      .withTimeout(10000)
    await element(by.id('DrawerItem/CELO')).tap()
    // Go through the education flow.
    await element(by.id('Education/progressButton')).tap()
    await element(by.id('Education/progressButton')).tap()
    await element(by.id('Education/progressButton')).tap()
    await element(by.id('Education/progressButton')).tap()
    await waitFor(element(by.id('WithdrawCELO')))
      .toBeVisible()
      .withTimeout(10000)
    // Go to the Withdraw Celo screen and fill the data.
    await element(by.id('WithdrawCELO')).tap()
    await waitFor(element(by.id('AccountAddress')))
      .toBeVisible()
      .withTimeout(10000)
    await element(by.id('AccountAddress')).replaceText(DEFAULT_RECIPIENT_ADDRESS)
    await element(by.id('CeloAmount')).replaceText(CELO_TO_SEND)
    // Tap review to go to the review screen and confirm.
    await element(by.id('WithdrawReviewButton')).tap()
    await waitFor(element(by.id('ConfirmWithdrawButton')))
      .toBeVisible()
      .withTimeout(10000)
    await element(by.id('ConfirmWithdrawButton')).tap()
    // Make sure we return to the Exchange CELO screen after confirming.
    await waitFor(element(by.id('WithdrawCELO')))
      .toBeVisible()
      .withTimeout(10000)
  })

  // TODO(erdal): generate a new invite
})
