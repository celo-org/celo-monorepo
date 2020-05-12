import * as React from 'react'
import { Image, StyleSheet, Text, View } from 'react-native'
import Fade from 'react-reveal/Fade'
import { brandStyles } from 'src/brandkit/common/constants'
import DownloadButton from 'src/brandkit/common/DownloadButton'
import { AssetTypes } from 'src/brandkit/tracking'
import AspectRatio from 'src/shared/AspectRatio'
import Spinner from 'src/shared/Spinner'
import { colors, fonts, standardStyles } from 'src/styles'

interface Props {
  name: string
  description: string
  preview?: string
  uri: string
  ratio: number
  loading: boolean
  size: number | '100%'
  assetType: AssetTypes
  variant?: 'circle' | 'circle-white' | 'circle-black'
}

export default React.memo(function Showcase({
  name,
  description,
  preview,
  loading,
  uri,
  assetType,
  size,
  ratio,
  variant,
}: Props) {
  const trackingData = React.useMemo(() => ({ name: `${name} ${assetType}`, type: assetType }), [
    name,
    assetType,
  ])
  const titleStyle = [fonts.h6, styles.title]
  return (
    <View
      style={[
        brandStyles.gap,
        standardStyles.elementalMarginTop,
        styles.container,
        { width: size },
      ]}
    >
      <Fade duration={FADE_MS}>
        <View style={styles.previewContainer}>
          <AspectRatio ratio={ratio}>
            {loading ? (
              <Spinner color={colors.primary} size="small" />
            ) : (
              <Image
                // onLoadEnd={load}
                resizeMode="contain"
                accessibilityLabel={`Preview of ${name}`}
                source={{ uri: preview }}
                style={[standardStyles.image, styles[`variant-${variant}`]]}
              />
            )}
          </AspectRatio>
        </View>
        <View style={styles.text}>
          <Text style={titleStyle}>{name}</Text>
          <Text style={fonts.legal}>{description}</Text>
        </View>
        <DownloadButton uri={uri} trackingData={trackingData} />
      </Fade>
    </View>
  )
})

const FADE_MS = 400

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
  'variant-circle': {
    borderRadius: 60,
  },
  'variant-circle-white': {
    borderRadius: 60,
    boxShadow: `inset 0 0 0 1px ${colors.placeholderGray}`,
  },
  'variant-circle-black': {
    borderRadius: 60,
    backgroundColor: '#000000',
  },
})
