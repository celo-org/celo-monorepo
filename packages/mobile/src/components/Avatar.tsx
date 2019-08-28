import { Avatar as PlainAvatar } from '@celo/react-components/components/Avatar'
import * as React from 'react'
import { Image, StyleSheet } from 'react-native'
import { unknownUserIcon } from 'src/images/Images'
import { getRecipientThumbnail, Recipient } from 'src/recipients/recipient'

interface Props {
  recipient: Recipient
  address?: string
  defaultCountryCode: string
  iconSize?: number
}

export default class Avatar extends React.PureComponent<Props> {
  render() {
    const { recipient, address, defaultCountryCode, iconSize } = this.props

    return recipient ? (
      <PlainAvatar
        name={recipient.displayName}
        thumbnailPath={getRecipientThumbnail(recipient)}
        address={address}
        e164Number={recipient.e164PhoneNumber}
        defaultCountryCode={defaultCountryCode}
        iconSize={iconSize || 40}
      />
    ) : (
      <PlainAvatar
        address={address}
        defaultCountryCode={defaultCountryCode}
        iconSize={iconSize || 40}
      >
        <Image source={unknownUserIcon} style={[style.defaultIcon]} />
      </PlainAvatar>
    )
  }
}

const style = StyleSheet.create({
  defaultIcon: {
    height: 40,
    width: 40,
    alignSelf: 'center',
    margin: 'auto',
  },
})
