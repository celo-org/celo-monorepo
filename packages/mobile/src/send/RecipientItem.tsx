import ContactCircle from '@celo/react-components/components/ContactCircle'
import colors from '@celo/react-components/styles/colors'
import { fontStyles } from '@celo/react-components/styles/fonts'
import * as React from 'react'
import { StyleSheet, Text, TouchableHighlight, View } from 'react-native'
import { getRecipientThumbnail, Recipient } from 'src/utils/recipient'

interface Props {
  recipient: Recipient
  onSelectRecipient(recipient: Recipient): void
}

class RecipientItem extends React.PureComponent<Props> {
  onPress = () => {
    this.props.onSelectRecipient(this.props.recipient)
  }

  render() {
    const { recipient } = this.props

    return (
      <TouchableHighlight onPress={this.onPress} underlayColor={colors.altDarkBg}>
        <View style={style.row}>
          <ContactCircle
            style={style.avatar}
            name={recipient.displayName}
            thumbnailPath={getRecipientThumbnail(recipient)}
            address={recipient.address}
            size={40}
          />
          <View style={style.nameContainer}>
            <Text
              numberOfLines={1}
              ellipsizeMode={'tail'}
              style={[fontStyles.bodySmallSemiBold, style.name]}
            >
              {recipient.displayName}
            </Text>
          </View>
          <Text style={[fontStyles.bodySmallSemiBold, fontStyles.light, style.phone]}>
            {recipient.displayPhoneNumber}
          </Text>
        </View>
      </TouchableHighlight>
    )
  }
}

const style = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 50,
    paddingHorizontal: 10,
    flex: 1,
  },
  avatar: {
    marginRight: 10,
  },
  nameContainer: {
    flex: 1,
    flexDirection: 'row',
    paddingRight: 5,
  },
  name: {
    lineHeight: 41,
  },
  invite: {
    color: colors.celoGreen,
    lineHeight: 41,
    alignSelf: 'center',
    paddingHorizontal: 10,
  },
  phone: {
    textAlign: 'right',
    lineHeight: 41,
  },
})

export default RecipientItem
