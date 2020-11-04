import * as React from 'react'
import * as renderer from 'react-test-renderer'
import QRCode, { genMatrix } from 'src/qrcode/QRGen'
import { UriData, urlFromUriData } from 'src/qrcode/schema'

describe('QRCode', () => {
  it('renders correctly', () => {
    const tree = renderer.create(<QRCode value="celo" svgRef={{ current: null }} />).toJSON()
    expect(tree).toMatchSnapshot()
  })

  // Simulate big data passed to QRCode and check if onError Callback
  // Called properly
  it('calls onError in case of issue with code generating', () => {
    const onErrorMock = jest.fn()
    // Rendering with big amount of data that should
    // throw an exception
    renderer.create(
      <QRCode
        value={new Array(1000000).join('123')}
        onError={onErrorMock}
        svgRef={{ current: null }}
      />
    )
    expect(onErrorMock).toBeCalledTimes(1)
  })

  it('does not call onError in case if value is fine', () => {
    const onErrorMock = jest.fn()
    renderer.create(<QRCode value="123" onError={onErrorMock} svgRef={{ current: null }} />)
    expect(onErrorMock).not.toHaveBeenCalled()
  })

  it('does not call onError in case of valid BeamAndGo data', () => {
    const onErrorMock = jest.fn()
    const data: UriData = {
      address: '0xf7f551752A78Ce650385B58364225e5ec18D96cB',
      e164PhoneNumber: undefined,
      displayName: 'Super 8',
      currencyCode: 'PHP',
      amount: '500',
      comment: '92a53156-c0f2-11ea-b3de-0242ac13000',
      token: undefined,
    }
    renderer.create(
      <QRCode value={urlFromUriData(data)} onError={onErrorMock} svgRef={{ current: null }} />
    )
    expect(onErrorMock).not.toHaveBeenCalled()
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
