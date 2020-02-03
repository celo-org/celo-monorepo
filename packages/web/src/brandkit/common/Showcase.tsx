import * as React from 'react'
import FadeIn from 'react-lazyload-fadein'
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
  size: number | '100%'
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
      <FadeIn>
        {(load) => (
          <View style={styles.previewContainer}>
            <AspectRatio ratio={ratio}>
              {loading ? (
                <Spinner color={colors.primary} size="small" />
              ) : (
                <Image
                  onLoadEnd={load}
                  resizeMode="contain"
                  accessibilityLabel={`Preview of ${name}`}
                  source={preview}
                  style={standardStyles.image}
                />
              )}
            </AspectRatio>
          </View>
        )}
      </FadeIn>
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
