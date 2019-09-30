import * as React from 'react'
import * as renderer from 'react-test-renderer'
import QRCode from 'src/qrcode/QRGen'

describe('QRCode', () => {
  it('renders correctly', () => {
    const tree = renderer.create(<QRCode value="celo" getRef={jest.fn()} />).toJSON()
    expect(tree).toMatchSnapshot()
  })

  it('renders with logo correctly', () => {
    const tree = renderer.create(<QRCode logo={{ uri: 'fakeUri' }} />).toJSON()
    expect(tree).toMatchSnapshot()
  })

  // Let's simulate too big data passed to QRCode and check if onError Callback
  // Called properly
  it('calls onError in case of issue with code generating', () => {
    const onErrorMock = jest.fn()
    // Let's try to render with too big amount of data that should
    // throw an exception
    renderer.create(
      <QRCode value={new Array(1000000).join('123')} onError={onErrorMock} getRef={jest.fn()} />
    )
    expect(onErrorMock.mock.calls.length).toBe(2)
  })

  it('does not call onError in case if value is fine', () => {
    const onErrorMock = jest.fn()
    renderer.create(<QRCode value="123" onError={onErrorMock} getRef={jest.fn()} />)
    expect(onErrorMock.mock.calls.length).toBe(0)
  })
})
