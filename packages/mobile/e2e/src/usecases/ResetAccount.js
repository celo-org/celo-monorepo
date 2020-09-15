import { enterPinUiIfNecessary, waitForElementId, sleep } from '../utils/utils'
import { SAMPLE_BACKUP_KEY } from '../utils/consts'

export default ResetAccount = () => {
  it('Reset Account by doing the Account Key quiz', async () => {
    // This test has very high flakiness on Android. I did my best to fix it, but
    // locally it works every time but on CI it fails 50%+ of the time.
    // TODO: Keep investigating the source of flakiness of this test on Android.
    if (device.getPlatform() === 'android') {
      return
    }

    // Go to Settings
    await element(by.id('Hamburguer')).tap()
    await element(by.id('DrawerItem/Settings')).tap()

    // Scroll to bottom and start the reset process.
    await waitForElementId('SettingsScrollView')
    // The sleep is here to avoid flakiness on the scroll. Without it the scroll to bottom intermittently fails
    // with a ~"Can't find view" error even though the SettingsScrollView is visible.
    // This probably doesn't reduce flakiness 100%, but in practice it reduces it significantly.
    await sleep(2000)
    await element(by.id('SettingsScrollView')).scrollTo('bottom')
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
    await waitForElementId('ConfirmAccountRemovalModal/PrimaryAction')
    await expect(element(by.id('ConfirmAccountRemovalModal/PrimaryAction'))).toBeVisible()
  })
}
