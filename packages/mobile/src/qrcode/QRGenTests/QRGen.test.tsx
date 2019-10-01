import * as React from 'react'
import * as renderer from 'react-test-renderer'
import QRCode, { genMatrix } from 'src/qrcode/QRGen'

describe('QRCode', () => {
  it('renders correctly', () => {
    const tree = renderer.create(<QRCode value="celo" getRef={jest.fn()} />).toJSON()
    expect(tree).toMatchSnapshot()
  })

  // Simulate big data passed to QRCode and check if onError Callback
  // Called properly
  it('calls onError in case of issue with code generating', () => {
    const onErrorMock = jest.fn()
    // Rendering with big amount of data that should
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

describe('QRCode Matrix', () => {
  it('generates with ecl:M correctly', () => {
    const matrix = genMatrix('test', 'M')
    expect(matrix).toMatchSnapshot()
  })

  it('generates with ecl:L correctly', () => {
    const matrix = genMatrix('test', 'L')
    expect(matrix).toMatchSnapshot()
  })

  it('generates with ecl:H correctly', () => {
    const matrix = genMatrix('test', 'H')
    expect(matrix).toMatchSnapshot()
  })

  it('generates with ecl:Q correctly', () => {
    const matrix = genMatrix('test', 'Q')
    expect(matrix).toMatchSnapshot()
  })
})
