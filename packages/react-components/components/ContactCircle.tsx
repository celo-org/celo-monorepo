import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import { getContactNameHash } from '@celo/utils/src/contacts'
import * as React from 'react'
import { Image, StyleSheet, Text, View, ViewStyle } from 'react-native'
import { MinimalContact } from 'react-native-contacts'

interface Props {
  style?: ViewStyle
  contact?: MinimalContact
  name?: string
  address?: string
  size: number
  preferNameInitial?: boolean
  thumbnailPath?: string | null
}

export const contactIconColors = [colors.teal, colors.orange, colors.purple]

const getAddressColor = (address: string) =>
  contactIconColors[parseInt(address.substring(0, 3), 16) % contactIconColors.length]
const getContactColor = (contact: MinimalContact) => getAddressColor(getContactNameHash(contact))
const getContactInitial = (contact: MinimalContact) => getNameInitial(contact.displayName)
const getNameInitial = (name: string) => name.charAt(0).toLocaleUpperCase()

export default class ContactCircle extends React.PureComponent<Props> {
  getContactCircleInner = () => {
    const { contact, name, size, preferNameInitial, thumbnailPath } = this.props
    const resolvedThumbnail = thumbnailPath || (contact && contact.thumbnailPath)
    if (resolvedThumbnail) {
      return (
        <Image
          source={{ uri: resolvedThumbnail }}
          style={[style.image, { height: size, width: size, borderRadius: size / 2.0 }]}
          resizeMode={'cover'}
        />
      )
    }
    const fontSize = size / 2.0
    const textStyle = [fontStyles.iconText, { fontSize }]
    const initials =
      (preferNameInitial && name && getNameInitial(name)) ||
      (contact && getContactInitial(contact)) ||
      (name && getNameInitial(name)) ||
      '#'

    return <Text style={textStyle}>{initials.toLocaleUpperCase()}</Text>
  }

  render() {
    const { address, contact, size } = this.props
    const iconColor =
      (contact && getContactColor(contact)) ||
      (address && getAddressColor(address)) ||
      contactIconColors[0]

    return (
      <View style={[style.row, this.props.style]}>
        <View
          style={[
            style.icon,
            { backgroundColor: iconColor, height: size, width: size, borderRadius: size / 2 },
          ]}
        >
          {this.getContactCircleInner()}
        </View>
      </View>
    )
  }
}

const style = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    marginLeft: 'auto',
    marginRight: 'auto',
  },
})
