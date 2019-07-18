import BigNumber from 'bignumber.js'
import * as React from 'react'
import { fireEvent, render } from 'react-native-testing-library'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import sleep from 'sleep-promise'
import { INPUT_DEBOUNCE_TIME } from 'src/config'
import { fetchPhoneAddresses } from 'src/identity/actions'
import SendAmount, { SendAmount as SendAmountClass } from 'src/send/SendAmount'
import { createMockStore, getMockI18nProps } from 'test/utils'
import {
  mockAccount,
  mockAccount2,
  mockE164Number,
  mockE164Number2,
  mockNavigation,
} from 'test/values'
const AMOUNT_ZERO = '0.00'
const AMOUNT_VALID = '4.93'
const AMOUNT_TOO_MUCH = '106.98'
const BALANCE_VALID = '23.85'

const numeral = require('numeral')

const storeData = {
  stableToken: { balance: BALANCE_VALID },
  send: { suggestedFee: '1' },
}

const TEXT_PLACEHOLDER = 'groceriesRent'
const AMOUNT_PLACEHOLDER = 'amount'

jest.mock('src/send/actions', () => ({
  ...jest.requireActual('src/send/actions'),
  updateSuggestedFee: jest.fn(() => ({ type: 'b' })),
}))

const { updateSuggestedFee } = require('src/send/actions')

describe('SendAmount', () => {
  beforeAll(() => {
    jest.useRealTimers()
  })

  describe('when commenting', () => {
    beforeEach(() => {
      updateSuggestedFee.mockClear()
    })

    const store = createMockStore(storeData)
    const getWrapper = () =>
      render(
        <Provider store={store}>
          {/*
          // @ts-ignore */}
          <SendAmount navigation={mockNavigation} />
        </Provider>
      )

    it('calculateFee debouncing works', async () => {
      const wrapper = render(
        <Provider store={createMockStore()}>
          <SendAmountClass
            navigation={mockNavigation}
            {...getMockI18nProps()}
            fetchDollarBalance={jest.fn()}
            showMessage={jest.fn()}
            showError={jest.fn()}
            hideAlert={jest.fn()}
            updateSuggestedFee={updateSuggestedFee}
            fetchPhoneAddresses={fetchPhoneAddresses}
            dollarBalance={new BigNumber(1)}
            suggestedFeeDollars={new BigNumber(1)}
            e164NumberToAddress={{ [mockE164Number]: mockAccount }}
            defaultCountryCode={'+1'}
          />
        </Provider>
      )
      const input = wrapper.getByPlaceholder(TEXT_PLACEHOLDER)
      const comment1 = 'first'
      const comment2 = 'second'
      fireEvent.changeText(input, comment1)
      fireEvent.changeText(input, comment2)
      fireEvent.changeText(input, comment1)
      await sleep(INPUT_DEBOUNCE_TIME)

      // Called once for debounce
      expect(updateSuggestedFee).toHaveBeenCalledTimes(1)
    })

    it('updates the comment/reason', () => {
      const wrapper = getWrapper()
      const input = wrapper.getByPlaceholder(TEXT_PLACEHOLDER)
      const comment = 'A comment!'
      fireEvent.changeText(input, comment)
      expect(wrapper.queryAllByDisplayValue(comment)).toHaveLength(1)
    })

    it('limits the comment/reason to 70 characters', () => {
      const longComment =
        'This is a long comment with 🌈👏.It will be longer than most comments.In fact, it will be far more than our limit.'

      const showMessage = jest.fn()
      const wrapper = render(
        <Provider store={createMockStore()}>
          <SendAmountClass
            navigation={mockNavigation}
            {...getMockI18nProps()}
            fetchDollarBalance={jest.fn()}
            showMessage={showMessage}
            showError={jest.fn()}
            hideAlert={jest.fn()}
            updateSuggestedFee={jest.fn()}
            fetchPhoneAddresses={fetchPhoneAddresses}
            dollarBalance={new BigNumber(1)}
            suggestedFeeDollars={new BigNumber(1)}
            e164NumberToAddress={{ [mockE164Number2]: mockAccount2 }}
            defaultCountryCode={'+1'}
          />
        </Provider>
      )
      const input = wrapper.getByPlaceholder(TEXT_PLACEHOLDER)
      fireEvent.changeText(input, longComment)
      expect(wrapper.queryAllByDisplayValue(longComment)).toHaveLength(1)
      expect(showMessage).toHaveBeenCalledTimes(1)
    })
  })

  describe('enter amount with balance', () => {
    afterAll(() => {
      numeral.locale('en')
    })

    const store = createMockStore(storeData)
    const getWrapper = () =>
      render(
        <Provider store={store}>
          {/*
          // @ts-ignore */}
          <SendAmount navigation={mockNavigation} />
        </Provider>
      )

    it('updates the amount', () => {
      const wrapper = getWrapper()
      const input = wrapper.getByPlaceholder(AMOUNT_PLACEHOLDER)
      fireEvent.changeText(input, AMOUNT_VALID)
      expect(wrapper.queryAllByDisplayValue(AMOUNT_VALID)).toHaveLength(1)
    })

    it('handles commas', () => {
      numeral.locale('es')
      const wrapper = getWrapper()
      const input = wrapper.getByPlaceholder(AMOUNT_PLACEHOLDER)
      fireEvent.changeText(input, '4,0')
      expect(wrapper.queryAllByDisplayValue('4,0')).toHaveLength(1)
    })

    it('handles decimals', () => {
      numeral.locale('en')
      const wrapper = getWrapper()
      const input = wrapper.getByPlaceholder(AMOUNT_PLACEHOLDER)
      fireEvent.changeText(input, '4.0')
      expect(wrapper.queryAllByDisplayValue('4.0')).toHaveLength(1)
    })
  })

  describe('enter amount ', () => {
    const store = createMockStore(storeData)
    const getWrapper = () =>
      render(
        <Provider store={store}>
          {/*
          // @ts-ignore */}
          <SendAmount navigation={mockNavigation} />
        </Provider>
      )

    it('is disabled with not enough balance', () => {
      const wrapper = getWrapper()
      const input = wrapper.getByPlaceholder(AMOUNT_PLACEHOLDER)
      fireEvent.changeText(input, AMOUNT_TOO_MUCH)
      expect(wrapper.queryAllByProps({ disabled: true }).length).toBeGreaterThan(0)
    })

    it('is disabled with 0 as amount', () => {
      const wrapper = getWrapper()
      const input = wrapper.getByPlaceholder(AMOUNT_PLACEHOLDER)
      fireEvent.changeText(input, AMOUNT_ZERO)
      expect(wrapper.queryAllByProps({ disabled: true }).length).toBeGreaterThan(0)
    })
  })

  it('renders correctly for request payment confirmation', () => {
    const store = createMockStore({
      ...storeData,
      stableToken: { balance: AMOUNT_ZERO },
    })
    const tree = renderer.create(
      <Provider store={store}>
        <SendAmount navigation={mockNavigation} />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
})
