import * as React from 'react'
import { Image, ImageProps, ImageURISource, StyleSheet } from 'react-native'
import { ScreenProps, ScreenSizes, withScreenSize } from 'src/layout/ScreenSize'
import AspectRatio from 'src/shared/AspectRatio'

interface Props {
  ratio: number
  sources: { large?: ImageURISource; medium?: ImageURISource; small?: ImageURISource }
  source?: ImageURISource
}

class ResponsiveImage extends React.PureComponent<
  Props & Omit<ImageProps, 'source'> & ScreenProps
> {
  getSource = () => {
    switch (this.props.screen) {
      case ScreenSizes.DESKTOP:
        return this.props.sources.large || this.props.source
      case ScreenSizes.TABLET:
        return this.props.sources.medium || this.props.source
      case ScreenSizes.MOBILE:
        return this.props.sources.small || this.props.source
      default:
        return this.props.source
    }
  }

  render() {
    const { ratio, resizeMode, onLoad } = this.props
    return (
      <AspectRatio ratio={ratio}>
        <Image
          style={styles.image}
          source={this.getSource()}
          resizeMode={resizeMode}
          onLoad={onLoad}
        />
      </AspectRatio>
    )
  }
}

export default withScreenSize(ResponsiveImage)

const styles = StyleSheet.create({
  image: {
    height: '100%',
    width: '100%',
  },
})
