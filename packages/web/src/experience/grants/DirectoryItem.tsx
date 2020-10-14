import { Asset, Entry } from 'contentful'
import * as React from 'react'
import { Image, StyleSheet, Text, View } from 'react-native'
import AspectRatio from 'src/shared/AspectRatio'
import Outbound from 'src/shared/Outbound'
import { fonts, standardStyles, textStyles } from 'src/styles'

export interface Props {
  name: string
  headline: string
  description: string
  website: string
  repo: string
  logo: string
  logoHeight: number
  logoWidth: number
}

interface ContentFulItem {
  name: string
  headline: string
  description: string
  website: string
  repo: string
  logo: Asset
}

function useWidth() {
  const [width, setWidth] = React.useState()
  function onLayout(event) {
    setWidth(event.nativeEvent.layout.width)
  }
  return [width, onLayout]
}

export default React.memo(function DirectoryItem(props: Props) {
  return (
    <View>
      <View style={styles.logoAndLink}>
        <ContentfulImage
          image={props.logo}
          maxHeight={props.logoHeight}
          maxWidth={props.logoWidth}
        />
        <View style={styles.link}>
          <Outbound url={props.website} />
        </View>
      </View>
      <Text style={nameStyle}>{props.name}</Text>
      <Text style={headlineStyle}>{props.headline}</Text>
      <Text style={fonts.legal}>{props.description}</Text>
    </View>
  )
})

function ContentfulImage({ image, maxHeight, maxWidth }) {
  const [realWidth, onLayout] = useWidth()
  return (
    <AspectRatio
      style={{ width: '100%', maxWidth }}
      onLayout={onLayout}
      ratio={maxWidth / maxHeight}
    >
      {realWidth && (
        <Image source={{ uri: `${image}?w=${realWidth}` }} style={standardStyles.image} />
      )}
    </AspectRatio>
  )
}

export function contentfullToProps({ fields }: Entry<ContentFulItem>): Props {
  const file = fields.logo.fields.file
  const image = file.details.image
  return { ...fields, logo: file.url, logoHeight: image.height, logoWidth: image.width }
}

const styles = StyleSheet.create({
  name: { marginTop: 8 },
  headline: {
    marginBottom: 12,
  },
  logoAndLink: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  link: { marginHorizontal: 12 },
})

const nameStyle = [fonts.legal, textStyles.heavy, styles.name]
const headlineStyle = [fonts.legal, textStyles.italic, styles.headline]
