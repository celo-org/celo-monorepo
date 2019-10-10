import * as React from 'react'
import { Image, ImageSourcePropType, StyleSheet, Text, View } from 'react-native'
import { H4 } from 'src/fonts/Fonts'
import AspectRatio from 'src/shared/AspectRatio'
import { colors, fonts, standardStyles } from 'src/styles'
import { withScreenSize, ScreenProps } from 'src/layout/ScreenSize'

interface FellowProps {
  image: ImageSourcePropType
  name: string
  location: string
  role: string
  quote: string
  text: string | React.ReactNode
  flip: boolean
}
class Fellow extends React.PureComponent<FellowProps & ScreenProps> {
  containerStyle = () => {
    if (this.props.isMobile) {
      return styles.containerMobile
    } else if (this.props.flip && this.props.isDesktop) {
      return styles.flip
    } else {
      return styles.container
    }
  }

  render() {
    const { image, name, location, role, quote, text } = this.props

    return (
      <View style={[standardStyles.blockMarginBottom, this.containerStyle()]}>
        <View style={this.props.isTablet && styles.tabletImageArea}>
          <AspectRatio style={styles.imageContainer} ratio={225 / 330}>
            <Image source={image} style={styles.image} />
          </AspectRatio>
          {this.props.isTablet && (
            <View style={{ width: '100%', padding: 10, flex: 1 }}>
              <NameAndQuote
                name={name}
                role={role}
                quote={quote}
                isTablet={true}
                location={location}
              />
            </View>
          )}
        </View>
        <View style={[styles.content, this.props.isMobile && styles.contentMobile]}>
          {!this.props.isTablet && (
            <View style={{ maxWidth: 450 }}>
              <NameAndQuote
                name={name}
                role={role}
                quote={quote}
                isTablet={false}
                location={location}
              />
            </View>
          )}
          <Text style={[fonts.p, standardStyles.elementalMarginTop]}>{text}</Text>
        </View>
      </View>
    )
  }
}

function NameAndQuote({ role, quote, isTablet, location, name }) {
  return (
    <>
      <H4>{name}</H4>
      <Text style={fonts.p}>
        {location} | {role}
      </Text>
      <H4 style={[standardStyles.elementalMarginTop, isTablet ? styles.quoteTablet : styles.quote]}>
        {quote}
      </H4>
    </>
  )
}

const styles = StyleSheet.create({
  quote: {
    color: colors.purpleScreen,
  },
  quoteTablet: {
    color: colors.purpleScreen,
    fontSize: 24,
    lineHeight: 28,
  },
  tabletImageArea: { flexDirection: 'row', width: '100%' },
  image: {
    height: '100%',
    width: '100%',
  },
  imageContainer: {
    width: 225,
    height: 330,
    marginHorizontal: 10,
    marginBottom: 10,
  },
  contentMobile: { paddingTop: 10, alignItems: 'center' },
  content: { flex: 1, marginHorizontal: 10, minWidth: 290 },
  flip: { flexDirection: 'row-reverse', flexWrap: 'wrap', flex: 1 },
  container: { flexDirection: 'row', flexWrap: 'wrap', flex: 1 },
  containerMobile: { alignItems: 'center' },
})

export default withScreenSize<FellowProps>(Fellow)
