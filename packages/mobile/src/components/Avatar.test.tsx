import * as React from 'react'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import Avatar from 'src/components/Avatar'
import { createMockStore } from 'test/utils'

const mockName = 'mockName'
const mockNumber = '+14155556666'
const mockAccount = '0x0000000000000000000000000000000000007E57'

const store = createMockStore({
  account: {
    defaultCountryCode: '+1',
  },
})

describe(Avatar, () => {
  it('renders correctly with number and name', () => {
    const tree = renderer.create(
      <Provider store={store}>
        <Avatar recipient={{ name: mockName, e164PhoneNumber: mockNumber }} iconSize={40} />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
  it('renders correctly with just number', () => {
    const tree = renderer.create(
      <Provider store={store}>
        <Avatar recipient={{ e164PhoneNumber: mockNumber }} iconSize={40} />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
  it('renders correctly with address and name but no number', () => {
    const tree = renderer.create(
      <Provider store={store}>
        <Avatar recipient={{ name: mockName, address: mockAccount }} iconSize={40} />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
  it('renders correctly with address but no name nor number', () => {
    const tree = renderer.create(
      <Provider store={store}>
        <Avatar recipient={{ address: mockAccount }} iconSize={40} />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
})
