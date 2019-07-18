import { shallow } from 'enzyme'
import toJson from 'enzyme-to-json'
import * as React from 'react'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import Pincode, { Pincode as PincodeUnwrapped } from 'src/pincode/Pincode'
import { createMockStore, getMockI18nProps } from 'test/utils'

describe('Pincode', () => {
  it('renders correctly for education', () => {
    const store = createMockStore()
    const tree = renderer.create(
      <Provider store={store}>
        <Pincode />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })

  it('renders correctly for pin enter', () => {
    const wrapper = shallow(
      <PincodeUnwrapped
        showError={jest.fn()}
        hideAlert={jest.fn()}
        pincodeSet={jest.fn()}
        setPin={jest.fn()}
        {...getMockI18nProps()}
      />
    )
    wrapper.find('Button').simulate('press')
    expect(toJson(wrapper)).toMatchSnapshot()
  })

  it('renders correctly for pin re-enter', () => {
    const wrapper = shallow(
      <PincodeUnwrapped
        showError={jest.fn()}
        hideAlert={jest.fn()}
        pincodeSet={jest.fn()}
        setPin={jest.fn()}
        {...getMockI18nProps()}
      />
    )
    wrapper.find('Button').simulate('press')
    wrapper.find('Button').simulate('press')
    expect(toJson(wrapper)).toMatchSnapshot()
  })
})
