import * as React from 'react'
import LazyLoadFadin from 'react-lazyload-fadein'
import { Image, ImageSourcePropType, StyleSheet, View } from 'react-native'
import AspectRatio from 'src/shared/AspectRatio'
import { standardStyles } from 'src/styles'

interface Props {
  ratio: number
  image: ImageSourcePropType
  preview: ImageSourcePropType // should be very small like 35x35
}

type voidFunc = () => void

// Provides blured lazy fade-in for images, use for photographic images, not icons or illos
export default React.memo(function Photo({ ratio, image, preview }: Props) {
  return (
    <View>
      <AspectRatio ratio={ratio}>
        <Image source={preview} style={styles.imagePreview} />
      </AspectRatio>
      <View style={styles.realImageContainer}>
        <LazyLoadFadin>
          {(onLoad: voidFunc) => (
            <AspectRatio ratio={ratio}>
              <Image onLoadEnd={onLoad} source={image} style={standardStyles.image} />
            </AspectRatio>
          )}
        </LazyLoadFadin>
      </View>
    </View>
  )
})

const styles = StyleSheet.create({
  imagePreview: {
    opacity: 0.5,
    filter: `blur(20px)`,
    height: '100%',
    width: '100%',
  },
  realImageContainer: { position: 'absolute', height: '100%', width: '100%' },
})
