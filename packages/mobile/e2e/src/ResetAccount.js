import { enterPinUiIfNecessary, waitForElementId } from './utils/utils'
import { SAMPLE_BACKUP_KEY } from './utils/consts'

export default ResetAccount = () => {
  it('Reset Account by doing hte Account Key quiz', async () => {
    // Go to Settings
    await element(by.id('Hamburguer')).tap()
    await element(by.id('DrawerItem/Settings')).tap()

    // Scroll to bottom and start the reset process.
    await waitForElementId('SettingsScrollView')
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
    await expect(element(by.id('ConfirmAccountRemovalModal/PrimaryAction'))).toBeVisible()
  })
}
