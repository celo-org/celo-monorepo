import * as React from 'react'
import 'react-native'
import { fireEvent, render, waitForElement } from 'react-native-testing-library'
import { Provider } from 'react-redux'
import { CELO_REWARDS_LINK } from 'src/config'
import ConsumerIncentivesHomeScreen from 'src/consumerIncentives/ConsumerIncentivesHomeScreen'
import { fetchConsumerRewardsContent } from 'src/consumerIncentives/contentFetcher'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { createMockStore, getMockStackScreenProps } from 'test/utils'

const mockScreenProps = getMockStackScreenProps(Screens.ConsumerIncentivesHomeScreen)

const createStore = (numberVerified: boolean) =>
  createMockStore({
    app: { numberVerified },
  })

jest.mock('src/consumerIncentives/contentFetcher', () => ({
  fetchConsumerRewardsContent: jest.fn(() =>
    Promise.resolve({
      content: {
        en: {
          title: 'Title',
          description: 'Description',
          subtitle1: 'Subtitle 1',
          body1: 'Body 1',
          subtitle2: 'Subtitle 2',
          body2: 'Body 2',
        },
      },
      tiers: [
        { minBalanceCusd: 20, celoReward: 1 },
        { minBalanceCusd: 100, celoReward: 5 },
        { minBalanceCusd: 500, celoReward: 10 },
      ],
    })
  ),
}))

describe('ConsumerIncentivesHomeScreen', () => {
  beforeEach(() => jest.useRealTimers())

  it('renders correctly', async () => {
    const tree = render(
      <Provider store={createStore(true)}>
        <ConsumerIncentivesHomeScreen {...mockScreenProps} />
      </Provider>
    )

    expect(tree.queryByTestId('ConsumerIncentives/Loading')).toBeTruthy()
    expect(tree.queryByTestId('ConsumerIncentives/CTA')).toBeFalsy()

    await waitForElement(() => tree.queryByTestId('ConsumerIncentives/CTA'))

    expect(tree.queryByTestId('ConsumerIncentives/Loading')).toBeFalsy()
    expect(tree.queryByTestId('ConsumerIncentives/CTA')).toBeTruthy()
    expect(fetchConsumerRewardsContent).toHaveBeenCalledTimes(1)
    expect(tree).toMatchSnapshot()
  })

  it('navigates to cash in screen if user is verified and CTA is tapped', async () => {
    const { getByTestId } = render(
      <Provider store={createStore(true)}>
        <ConsumerIncentivesHomeScreen {...mockScreenProps} />
      </Provider>
    )
    await waitForElement(() => getByTestId('ConsumerIncentives/CTA'))

    fireEvent.press(getByTestId('ConsumerIncentives/CTA'))
    expect(navigate).toHaveBeenCalledWith(Screens.FiatExchangeOptions, { isCashIn: true })
  })

  it('navigates to Phone Confirmation screen if user is not verified and CTA is tapped', async () => {
    const { getByTestId } = render(
      <Provider store={createStore(false)}>
        <ConsumerIncentivesHomeScreen {...mockScreenProps} />
      </Provider>
    )
    await waitForElement(() => getByTestId('ConsumerIncentives/CTA'))

    fireEvent.press(getByTestId('ConsumerIncentives/CTA'))

    expect(navigate).toHaveBeenCalledWith(Screens.VerificationEducationScreen, {
      hideOnboardingStep: true,
    })
  })

  it('opens a WebView when Learn More is tapped', async () => {
    const { getByTestId } = render(
      <Provider store={createStore(true)}>
        <ConsumerIncentivesHomeScreen {...mockScreenProps} />
      </Provider>
    )
    await waitForElement(() => getByTestId('ConsumerIncentives/learnMore'))

    fireEvent.press(getByTestId('ConsumerIncentives/learnMore'))

    expect(navigate).toHaveBeenCalledWith(Screens.WebViewScreen, {
      uri: CELO_REWARDS_LINK,
    })
  })
})
