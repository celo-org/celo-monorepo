import colors from '@celo/react-components/styles/colors'
import { getContactNameHash } from '@celo/utils/src/contacts'
import * as React from 'react'
import { Image, StyleSheet, View } from 'react-native'
import { MinimalContact } from 'react-native-contacts'
import { unknownUserIcon } from 'src/images/Images'

interface Props {
  contact?: MinimalContact
  address?: string
  size?: number
  thumbnailPath?: string | null
}

const DEFAULT_ICON_SIZE = 40
export const contactIconColors = [colors.teal, colors.orange, colors.purple]

const getAddressColor = (address: string) =>
  contactIconColors[parseInt(address.substring(0, 3), 16) % contactIconColors.length]
const getContactColor = (contact: MinimalContact) => getAddressColor(getContactNameHash(contact))

export default class ContactCircle extends React.PureComponent<Props> {
  renderThumbnail = () => {
    const { contact, size, thumbnailPath } = this.props
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

    return (
      <Image
        source={unknownUserIcon}
        style={[style.defaultIcon, { height: iconSize, width: iconSize }]}
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
      <View style={style.row}>
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
  defaultIcon: {
    alignSelf: 'center',
    margin: 'auto',
  },
})
