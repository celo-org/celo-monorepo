import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import { componentStyles } from '@celo/react-components/styles/styles'
import * as React from 'react'
import { Animated, StyleSheet, View } from 'react-native'

interface Props {
  heading: string
  children: React.ReactNode
  stickyHeaderIndices?: number[]
  headerChild?: React.ReactNode
  testID?: string
  refresh?: any
}

class ScrollContainer extends React.Component<Props> {
  animatedValue = new Animated.Value(0)
  onScroll = Animated.event([{ nativeEvent: { contentOffset: { y: this.animatedValue } } }], {
    useNativeDriver: true,
  })

  headerOpacity = () => {
    return {
      opacity: this.animatedValue.interpolate({
        inputRange: [0, 100],
        outputRange: [0, 1],
        extrapolate: 'clamp',
      }),
    }
  }

  render() {
    return (
      <View style={style.container}>
        <View style={[componentStyles.topBar, style.head]}>
          <Animated.Text style={[fontStyles.headerTitle, this.headerOpacity()]}>
            {this.props.heading}
          </Animated.Text>
          {this.props.headerChild}
        </View>
        <Animated.ScrollView
          refreshControl={this.props.refresh}
          onScroll={this.onScroll}
          style={style.background}
          testID={this.props.testID}
          stickyHeaderIndices={this.props.stickyHeaderIndices}
          contentContainerStyle={style.contentContainer}
        >
          {this.props.children}
        </Animated.ScrollView>
      </View>
    )
  }
}

const style = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
  },
  head: {
    backgroundColor: colors.background,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  background: {
    backgroundColor: colors.background,
  },
})

export default ScrollContainer
