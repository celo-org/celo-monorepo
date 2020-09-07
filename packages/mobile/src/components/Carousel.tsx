import Card from '@celo/react-components/components/Card'
import Pagination from '@celo/react-components/components/Pagination'
import fontStyles from '@celo/react-components/styles/fonts.v2'
import progressDots from '@celo/react-components/styles/progressDots'
import { Spacing } from '@celo/react-components/styles/styles.v2'
import variables from '@celo/react-components/styles/variables'
import React, { useState } from 'react'
import {
  Image,
  ImageSourcePropType,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native'

const ITEM_WIDTH = variables.width - Spacing.Thick24 * 2
const ITEM_HEIGHT = ITEM_WIDTH * (211 / 292)
// Visible width of items which are on the left/right of the active item
const ITEM_PARTIAL_VISIBLE_WIDTH = Spacing.Smallest8
const ITEM_HORIZONTAL_SPACING = Spacing.Regular16
const ITEM_SNAP_INTERVAL = ITEM_WIDTH + ITEM_HORIZONTAL_SPACING

export interface CarouselItem {
  text: string
  icon: ImageSourcePropType
}

interface Props {
  style: StyleProp<ViewStyle>
  items: CarouselItem[]
}

function Carousel({ items, style }: Props) {
  const [activeIndex, setActiveIndex] = useState(0)

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const newActiveIndex = Math.round(event.nativeEvent.contentOffset.x / ITEM_SNAP_INTERVAL)

    if (newActiveIndex === activeIndex) {
      return
    }

    setActiveIndex(newActiveIndex)
  }

  return (
    <View style={style}>
      <ScrollView
        horizontal={true}
        showsHorizontalScrollIndicator={false}
        snapToInterval={ITEM_SNAP_INTERVAL}
        decelerationRate="fast"
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        onScroll={onScroll}
      >
        {items.map((item, index) => (
          <Card key={index} rounded={true} style={styles.card}>
            <Image source={item.icon} />
            <Text style={styles.itemText}>{item.text}</Text>
          </Card>
        ))}
      </ScrollView>
      <Pagination
        count={items.length}
        activeIndex={activeIndex}
        dotStyle={progressDots.circlePassiveOnboarding}
        activeDotStyle={progressDots.circleActiveOnboarding}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  scrollView: {
    overflow: 'visible',
  },
  scrollViewContent: {
    paddingHorizontal: ITEM_HORIZONTAL_SPACING / 2 + ITEM_PARTIAL_VISIBLE_WIDTH,
    // top and bottom padding are needed
    // on Android so the shadow is not clipped
    paddingTop: 10,
    paddingBottom: 25,
  },
  card: {
    padding: Spacing.Thick24,
    width: ITEM_WIDTH,
    height: ITEM_HEIGHT,
    marginHorizontal: ITEM_HORIZONTAL_SPACING / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemText: {
    ...fontStyles.regular,
    textAlign: 'center',
    marginTop: Spacing.Small12,
  },
})

export default React.memo(Carousel)
