import { inputNumberKeypad } from './utils/utils'
import { DEFAULT_RECIPIENT_ADDRESS } from './utils/consts'

const AMOUNT_TO_SEND = '0.1'
const RANDOM_COMMENT = 'poker night winnings'

export default Send = () => {
  it('Wallet Home->Send', async () => {
    await element(by.id('SendOrRequestBar/SendButton')).tap()

    await element(by.id('SearchInput')).tap()
    await element(by.id('SearchInput')).replaceText(DEFAULT_RECIPIENT_ADDRESS)
    await element(by.id('SearchInput')).tapReturnKey()

    await element(by.id('RecipientItem')).tap()
  })

  it('Send -> SendAmount', async () => {
    await inputNumberKeypad(AMOUNT_TO_SEND)
    await element(by.id('Review')).tap()
  })

  it('SendAmount -> SendConfirmation', async () => {
    await element(by.id('commentInput/send')).replaceText(RANDOM_COMMENT)
    await element(by.id('commentInput/send')).tapReturnKey()

    if (device.getPlatform() === 'android') {
      // Workaround keyboard remaining open on Android (tapReturnKey doesn't work there and just adds a new line)
      // so we tap something else in the scrollview to hide the soft keyboard
      await element(by.id('HeaderText')).tap()
    }

    await element(by.id('ConfirmButton')).tap()

    await enterPinUiIfNecessary()
  })

  // TODO(erdal): implement Request path

  it('SendConfirmation -> Home', async () => {
    await expect(element(by.id('SendOrRequestBar'))).toBeVisible()

    // TODO(erdal): look for the latest transaction and
    // make sure it was successful
  })
}
