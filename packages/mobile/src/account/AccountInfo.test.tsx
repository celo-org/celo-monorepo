import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import AccountInfo from 'src/account/AccountInfo'
import { createMockStore } from 'test/utils'

describe('AccountInfo', () => {
  it('renders correctly', () => {
    const store = createMockStore({
      account: { photosNUXClicked: true },
    })
    const tree = renderer.create(
      <Provider store={store}>
        <AccountInfo />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })

  it('renders correctly', () => {
    const store = createMockStore({
      account: { name: '' },
    })
    const tree = renderer.create(
      <Provider store={store}>
        <AccountInfo />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })

  it('renders correctly', () => {
    const store = createMockStore({
      account: { e164PhoneNumber: '' },
    })
    const tree = renderer.create(
      <Provider store={store}>
        <AccountInfo />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })

  it('renders correctly', () => {
    const store = createMockStore({
      account: { name: '', e164PhoneNumber: '' },
    })
    const tree = renderer.create(
      <Provider store={store}>
        <AccountInfo />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
})
