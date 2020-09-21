import { enterPinUi } from '../utils/utils'

export default SetAccountKey = () => {
  it('Go to the Account Key tab and set it up', async () => {
    // Android doesn't support the getAttributes method, so we can't get the account key.
    if (device.getPlatform() === 'android') {
      return
    }
    await element(by.id('Hamburguer')).tap()
    await element(by.id('DrawerItem/Account Key')).tap()

    await enterPinUi()

    await element(by.id('SetUpAccountKey')).tap()

    // Go through education
    for (let i = 0; i < 4; i++) {
      await element(by.id('Education/progressButton')).tap()
    }

    const attributes = await element(by.id('AccountKeyWords')).getAttributes()
    const accountKey = attributes.text

    await element(by.id('backupKeySavedSwitch')).longPress()
    await element(by.id('backupKeyContinue')).tap()
    for (const word of accountKey.split(' ')) {
      await element(by.id(`backupQuiz/${word}`)).tap()
    }
    await element(by.id('QuizSubmit')).tap()
  })
}
