import { enterPinUiIfNecessary, waitForElementId, sleep } from './utils/utils'
import { SAMPLE_BACKUP_KEY } from './utils/consts'

// Yes, the try-catch looks weird. It's here to avoid flakiness on the scroll. Without it the scroll
// line intermittently fails with a ~"Can't find view" error even though the SettingsScrollView is visible.
// This probably doesn't reduce flakiness 100%, but in practive it reduces it from ~50% to a very
// small % of the time.
const scrollToBottomWithRetry = async (elementId) => {
  try {
    await element(by.id(elementId)).scrollTo('bottom')
  } catch (err) {
    await element(by.id(elementId)).scrollTo('bottom')
  }
}

export default ResetAccount = () => {
  it('Reset Account by doing the Account Key quiz', async () => {
    // Go to Settings
    await element(by.id('Hamburguer')).tap()
    await element(by.id('DrawerItem/Settings')).tap()

    // Scroll to bottom and start the reset process.
    await waitForElementId('SettingsScrollView')
    await scrollToBottomWithRetry('SettingsScrollView')
    await element(by.id('ResetAccount')).tap()
    await element(by.id('RemoveAccountModal/PrimaryAction')).tap()

    await enterPinUiIfNecessary()

    // Go through the quiz.
    await element(by.id('backupKeySavedSwitch')).longPress()
    await element(by.id('backupKeyContinue')).tap()
    for (const word of SAMPLE_BACKUP_KEY.split(' ')) {
      await element(by.id(`backupQuiz/${word}`)).tap()
    }
    await element(by.id('QuizSubmit')).tap()

    // We can't actually confirm because the app will restart and Detox will hang.
    // TODO: Figure out a way to confirm and test that the app goes to the onboarding
    // screen on next open.
    // await element(by.id('ConfirmAccountRemovalModal/PrimaryAction')).tap()
    await expect(element(by.id('ConfirmAccountRemovalModal/PrimaryAction'))).toBeVisible()
  })
}
