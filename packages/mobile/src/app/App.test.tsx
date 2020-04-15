import { shallow } from 'enzyme'
import * as React from 'react'
import { ApolloProvider } from 'react-apollo'
import { StatusBar } from 'react-native'
import App from 'src/app/App'
import ErrorBoundary from 'src/app/ErrorBoundary'

jest.mock('react-apollo', () => {
  return {
    _esModule: true,
    ApolloProvider: 'ApolloProvider',
  }
})

jest.mock('src/navigator/NavigatorWrapper')
// Dont start the sagas
jest.mock('src/redux/sagas', () => {
  return {
    rootSaga: function* rootSaga() {
      yield true
    },
  }
})

describe('App', () => {
  it('renders an ApolloProvider', () => {
    const wrapper = shallow(<App />)
    expect(wrapper.find(ApolloProvider).exists()).toBe(true)
  })

  it('renders an ErrorBoundary', () => {
    const wrapper = shallow(<App />)
    expect(wrapper.find(ErrorBoundary).exists()).toBe(true)
  })

  it('renders an StatusBar', () => {
    const wrapper = shallow(<App />)
    expect(wrapper.find(StatusBar).exists()).toBe(true)
  })

  it('renders an WrappedNavigator', () => {
    const wrapper = shallow(<App />)
    expect(wrapper.find('WrappedNavigator').exists()).toBe(true)
  })
})
