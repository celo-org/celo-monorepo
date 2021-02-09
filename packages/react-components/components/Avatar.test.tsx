import Avatar from '@celo/react-components/components/Avatar'
import * as React from 'react'
import * as renderer from 'react-test-renderer'

const mockName = 'mockName'
const mockCountryCode = '+1'
const mockNumber = '+14155556666'
const mockAccount = '0x0000000000000000000000000000000000007E57'
const mockContact = {
  recordID: 'mockRecordId',
  displayName: mockName,
  phoneNumbers: [{ label: 'mockLabel', number: mockNumber }],
  thumbnailPath: 'mockThumbpath',
}

describe(Avatar, () => {
  it('renders correctly without contact and number', () => {
    const tree = renderer.create(
      <Avatar name={mockName} defaultCountryCode={mockCountryCode} iconSize={40} />
    )
    expect(tree).toMatchSnapshot()
  })
  it('renders correctly with number but without contact', () => {
    const tree = renderer.create(
      <Avatar
        name={mockName}
        defaultCountryCode={mockCountryCode}
        iconSize={40}
        e164Number={mockNumber}
      />
    )
    expect(tree).toMatchSnapshot()
  })
  it('renders correctly with address but without contact', () => {
    const tree = renderer.create(
      <Avatar
        name={mockName}
        defaultCountryCode={mockCountryCode}
        iconSize={40}
        address={mockAccount}
      />
    )
    expect(tree).toMatchSnapshot()
  })
  it('renders correctly with contact', () => {
    const tree = renderer.create(
      <Avatar
        name={mockName}
        defaultCountryCode={mockCountryCode}
        iconSize={40}
        e164Number={mockNumber}
        contact={mockContact}
      />
    )
    expect(tree).toMatchSnapshot()
  })
})
