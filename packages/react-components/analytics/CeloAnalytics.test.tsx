import CeloAnalytics from '@celo/react-components/analytics/CeloAnalytics'
import ReactNativeLogger from '@celo/react-components/services/ReactNativeLogger'

const c = new CeloAnalytics(new ReactNativeLogger(), ['navigation.state.routeName', 'title'])

jest.mock('@segment/analytics-react-native', () => undefined)
jest.mock('@segment/analytics-react-native-firebase', () => undefined)

it('filters correctly', () => {
  const allProps = {
    dummyprop: 5,
    navigation: {
      state: {
        routeName: 'someroute',
      },
    },
    title: 'some title',
  }
  expect(c.applyWhitelist(allProps)).toHaveProperty(
    'navigation.state.routeName',
    allProps.navigation.state.routeName
  )
  expect(c.applyWhitelist(allProps)).toHaveProperty('title', allProps.title)
  expect(c.applyWhitelist(allProps)).not.toHaveProperty('dummyProps')
})
