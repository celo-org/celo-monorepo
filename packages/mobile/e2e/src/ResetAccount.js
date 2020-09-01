import { enterPinUi } from './utils/utils'
import { SAMPLE_BACKUP_KEY } from './utils/consts'

export default ResetAccount = () => {
  it('Go to Settings, scroll to bottom and press the Reset Account button', async () => {
    await element(by.id('Hamburguer')).tap()
    await waitFor(element(by.id('DrawerItem/Settings')))
      .toBeVisible()
      .withTimeout(10000)
    await element(by.id('DrawerItem/Settings')).tap()
    await element(by.id('SettingsScrollView')).scrollTo('bottom')
    await element(by.id('ResetAccount')).tap()
    await element(by.id('RemoveAccountModal/PrimaryAction')).tap()
  })

  it('Write down Account Key and complete quiz', async () => {
    // Uncomment if running this file only.
    // await enterPinUi()
    await element(by.id('backupKeySavedSwitch')).tap()
    await element(by.id('backupKeyContinue')).tap()
    for (const word of SAMPLE_BACKUP_KEY.split(' ')) {
      await element(by.id(`backupQuiz/${word}`)).tap()
    }
    await element(by.id('QuizSubmit')).tap()
  })

  // We can't actually confirm because the app will restart and Detox will hang.
  it('Confirm Account Removal', async () => {
    // TODO: Figure out a way to confirm and test that the app goes to the onboarding
    // screen on next open.
    // await element(by.id('ConfirmAccountRemovalModal/PrimaryAction')).tap()
    await expect(element(by.id('ConfirmAccountRemovalModal/PrimaryAction'))).toBeVisible()
  })
}
