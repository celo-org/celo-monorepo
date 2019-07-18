import SmallButton from '@celo/react-components/components/SmallButton'
import fonts from '@celo/react-components/styles/fonts'
import variables from '@celo/react-components/styles/variables'
import * as React from 'react'
import { Image, ImageSourcePropType, StyleSheet, Text, View } from 'react-native'
import componentWithAnalytics from 'src/analytics/wrapper'

export interface HomeActionProps {
  title: string
  subtitle: string
  icon: ImageSourcePropType
  cta?: string
  ctaOnPress?: () => void
}

export class HomeAction extends React.Component<HomeActionProps> {
  render() {
    const { title, subtitle, icon, cta, ctaOnPress } = this.props

    return (
      <View style={styles.container} testID={`Notification/${title}`}>
        <Image source={icon} style={styles.image} />
        <View style={styles.textContainer}>
          <Text style={[fonts.bodySmallBold, styles.title]}>{title}</Text>
          <Text style={[fonts.bodySmall, styles.subtitle]}>{subtitle}</Text>
          {cta && ctaOnPress && <SmallButton solid={true} text={cta} onPress={ctaOnPress} />}
        </View>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    height: 150,
    flexDirection: 'row',
    width: variables.width,
  },
  image: {
    marginLeft: 20,
    marginTop: 20,
    height: 30,
    width: 30,
  },
  textContainer: {
    flexDirection: 'column',
    marginLeft: 13,
    marginRight: 23,
    flex: 1,
  },
  title: {
    marginTop: 18,
  },
  subtitle: {
    marginTop: 6,
    marginBottom: 15,
  },
})

export default componentWithAnalytics(HomeAction)
