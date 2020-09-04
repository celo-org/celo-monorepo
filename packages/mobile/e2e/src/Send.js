import { enterPinUi, inputNumberKeypad } from './utils/utils'
import { DEFAULT_RECIPIENT_ADDRESS } from './utils/consts'

const AMOUNT_TO_SEND = '0.1'
const RANDOM_COMMENT = 'poker night winnings'

export default Send = () => {
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

    // Uncomment if running this file only.
    // await enterPinUi()
  })

  // TODO(erdal): implement Request path

  it('SendConfirmation -> Home', async () => {
    await waitFor(element(by.id('SendOrRequestBar')))
      .toBeVisible()
      .withTimeout(10000)

    // TODO(erdal): look for the latest transaction and
    // make sure it was successful
  })
}
