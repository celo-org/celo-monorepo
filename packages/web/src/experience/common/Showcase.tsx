import * as React from 'react'
import { Image, StyleSheet, Text, View } from 'react-native'
import DownloadButton from 'src/experience/brandkit/DownloadButton'
import { AssetTypes } from 'src/experience/brandkit/tracking'
import { brandStyles } from 'src/experience/common/constants'
import AspectRatio from 'src/shared/AspectRatio'
import Fade from 'src/shared/AwesomeFade'
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
    <View style={[brandStyles.gap, standardStyles.elementalMarginTop, { width: size }]}>
      <Fade duration={FADE_MS}>
        <View>
          <View style={styles.previewContainer}>
            <AspectRatio ratio={ratio}>
              {loading ? (
                <Spinner color={colors.primary} size="small" />
              ) : (
                <Image
                  resizeMode="contain"
                  accessibilityLabel={`Preview of ${name}`}
                  source={{ uri: preview }}
                  style={[standardStyles.image, styles[`variant-${variant}`]]}
                />
              )}
            </AspectRatio>
          </View>
          <View style={styles.text}>
            {name && <Text style={titleStyle}>{name.trimLeft()}</Text>}
            {description && <Text style={fonts.legal}>{description}</Text>}
          </View>
          {uri && <DownloadButton uri={uri} trackingData={trackingData} />}
        </View>
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
