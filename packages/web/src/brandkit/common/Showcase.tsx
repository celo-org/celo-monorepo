import * as React from 'react'
import { Image, ImageURISource, StyleSheet, Text, View } from 'react-native'
import { brandStyles } from 'src/brandkit/common/constants'
import DownloadButton from 'src/brandkit/common/DownloadButton'
import AspectRatio from 'src/shared/AspectRatio'
import Spinner from 'src/shared/Spinner'
import { colors, fonts, standardStyles } from 'src/styles'

interface Props {
  name: string
  description: string
  preview?: ImageURISource
  uri: string
  ratio: number
  loading: boolean
  size: number
}

export default React.memo(function Showcase({
  name,
  description,
  preview,
  loading,
  uri,
  size,
  ratio,
}: Props) {
  return (
    <View
      style={[
        brandStyles.gap,
        standardStyles.elementalMarginTop,
        styles.container,
        { width: size },
      ]}
    >
      <View style={styles.previewContainer}>
        <AspectRatio ratio={ratio}>
          {loading ? (
            <Spinner color={colors.dark} size={'small'} />
          ) : (
            <Image resizeMode="contain" source={preview} style={standardStyles.image} />
          )}
        </AspectRatio>
      </View>
      <View style={styles.text}>
        <Text style={[fonts.h6, styles.title]}>{name}</Text>
        <Text style={fonts.legal}>{description}</Text>
      </View>
      <DownloadButton uri={uri} />
    </View>
  )
})

const styles = StyleSheet.create({
  title: { marginVertical: 5 },
  previewContainer: {
    marginVertical: 20,
    marginRight: 40,
  },
  text: { flex: 1 },
  pullStart: { paddingLeft: 0 },
  container: {
    justifyContent: 'space-between',
  },
})
