import * as React from 'react'
import { Text, View, StyleSheet, Image, ImageURISource } from 'react-native'
import { fonts, colors, standardStyles } from 'src/styles'
import { brandStyles } from 'src/brandkit/common/constants'
import Button, { BTN } from 'src/shared/Button.3'
import Spinner from 'src/shared/Spinner'
import Fade from 'react-reveal/Fade'

interface Props {
  name: string
  description: string
  preview?: ImageURISource
  uri?: string
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
      <Fade>
        <View
          style={[
            standardStyles.centered,
            brandStyles.fullBorder,
            styles.previewContainer,
            { width: size, height: size },
          ]}
        >
          {loading ? (
            <Spinner color={colors.dark} size={'small'} />
          ) : (
            <Image resizeMode="contain" source={preview} style={styles.image} />
          )}
        </View>
      </Fade>
      <View style={styles.text}>
        <Text style={[fonts.h6, styles.title]}>{name}</Text>
        <Text style={fonts.legal}>{description}</Text>
      </View>
      <View style={brandStyles.button}>
        <Button kind={BTN.TERTIARY} text={'Download Assets'} href={uri} />
      </View>
    </View>
  )
})

const styles = StyleSheet.create({
  title: { marginVertical: 5 },
  previewContainer: {
    padding: 20,
    marginBottom: 10,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  text: { flex: 1 },
  container: {
    justifyContent: 'space-between',
  },
})
