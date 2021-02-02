import Touchable from '@celo/react-components/components/Touchable'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import variables from '@celo/react-components/styles/variables'
import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import ContactCircle from 'src/components/ContactCircle'
import { getRecipientThumbnail, Recipient } from 'src/recipients/recipient'

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
      <Touchable onPress={this.onPress} testID="RecipientItem">
        <View style={styles.row}>
          <ContactCircle
            style={styles.avatar}
            name={recipient.displayName}
            thumbnailPath={getRecipientThumbnail(recipient)}
            address={recipient.address}
          />
          <View style={styles.contentContainer}>
            <Text numberOfLines={1} ellipsizeMode={'tail'} style={styles.name}>
              {recipient.displayName}
            </Text>
            <Text style={styles.phone}>{recipient.displayId}</Text>
          </View>
        </View>
      </Touchable>
    )
  }
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 64,
    paddingHorizontal: variables.contentPadding,
    flex: 1,
  },
  avatar: {
    marginRight: 12,
  },
  contentContainer: {
    flex: 1,
  },
  name: { ...fontStyles.regular500, color: colors.dark },
  phone: {
    ...fontStyles.small,
    color: colors.gray4,
  },
})

export default RecipientItem
