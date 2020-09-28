import { unknownUserIcon } from '@celo/react-components/images/Images'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts.v2'
import { getContactNameHash } from '@celo/utils/src/contacts'
import * as React from 'react'
import { Image, StyleSheet, Text, View, ViewStyle } from 'react-native'
import { MinimalContact } from 'react-native-contacts'

interface Props {
  style?: ViewStyle
  contact?: MinimalContact
  name: string | null // Requiring a value so we need to be explicit if we dont have it
  address?: string
  size?: number
  thumbnailPath?: string | null
}

const DEFAULT_ICON_SIZE = 40
export const contactIconColors = [colors.teal, colors.orange, colors.purple]

const getAddressColor = (address: string) =>
  contactIconColors[parseInt(address.substring(0, 3), 16) % contactIconColors.length]
const getContactColor = (contact: MinimalContact) => getAddressColor(getContactNameHash(contact))
const getContactInitial = (contact: MinimalContact) => getNameInitial(contact.displayName)
const getNameInitial = (name: string) => name.charAt(0).toLocaleUpperCase()

export default class ContactCircle extends React.PureComponent<Props> {
  getInitials = (): string => {
    const { name, contact } = this.props
    return (contact && getContactInitial(contact)) || (name && getNameInitial(name)) || '#'
  }

  renderThumbnail = () => {
    const { contact, size, thumbnailPath, name } = this.props
    const resolvedThumbnail = thumbnailPath || (contact && contact.thumbnailPath)
    const iconSize = size || DEFAULT_ICON_SIZE

    if (resolvedThumbnail) {
      return (
        <Image
          source={{ uri: resolvedThumbnail }}
          style={[style.image, { height: iconSize, width: iconSize, borderRadius: iconSize / 2.0 }]}
          resizeMode={'cover'}
        />
      )
    }

    // Mobile # is what default display name when contact isn't saved
    if (name && name !== 'Mobile #') {
      const initials = this.getInitials()
      return (
        <Text style={[fontStyles.iconText, { fontSize: iconSize / 2.0 }]}>
          {initials.toLocaleUpperCase()}
        </Text>
      )
    }

    return (
      <Image
        source={unknownUserIcon}
        style={[style.image, { height: iconSize, width: iconSize }]}
      />
    )
  }

  render() {
    const { address, contact, size } = this.props
    const iconSize = size || DEFAULT_ICON_SIZE
    const iconColor =
      (contact && getContactColor(contact)) ||
      (address && getAddressColor(address)) ||
      contactIconColors[0]

    return (
      <View style={[style.container, this.props.style]}>
        <View
          style={[
            style.icon,
            {
              backgroundColor: iconColor,
              height: iconSize,
              width: iconSize,
              borderRadius: iconSize / 2,
            },
          ]}
        >
          {this.renderThumbnail()}
        </View>
      </View>
    )
  }
}

const style = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    margin: 'auto',
    alignSelf: 'center',
  },
})
