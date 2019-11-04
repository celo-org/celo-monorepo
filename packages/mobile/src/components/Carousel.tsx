/**
 * A custom style carousel based on react-native-snap-carousel
 */

import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import variables from '@celo/react-components/styles/variables'
import * as React from 'react'
import { StyleSheet, Text, View, ViewStyle } from 'react-native'
import { BoxShadow } from 'react-native-shadow'
import RNCarousel, { Pagination } from 'react-native-snap-carousel'

const ITEM_WIDTH = variables.width - 70
const ITEM_HEIGHT = 250

interface OwnProps {
  containerStyle: ViewStyle
  items: CarouselItem[]
}

export interface CarouselItem {
  text: string
  icon?: React.ComponentType
}

function renderItem({ item, index }: { item: CarouselItem; index: number }) {
  return (
    <View style={{ position: 'relative' }}>
      <BoxShadow setting={shadowOpt}>
        <View style={styles.itemContainer}>
          {item.icon}
          <Text style={styles.itemText}>{item.text}</Text>
        </View>
      </BoxShadow>
    </View>
  )
}

export function Carousel(props: OwnProps) {
  const ref = React.useRef(null)
  const [activeItem, setActiveItem] = React.useState(0)

  return (
    <View style={props.containerStyle}>
      {/* For some reason the carousel is adding a bunch of item height, wrapping to cut it off*/}
      <View style={{ height: ITEM_HEIGHT }}>
        <RNCarousel
          ref={ref}
          data={props.items}
          renderItem={renderItem}
          sliderWidth={variables.width}
          sliderHeight={ITEM_HEIGHT}
          itemWidth={ITEM_WIDTH}
          itemHeight={ITEM_HEIGHT}
          inactiveSlideScale={0.9}
          inactiveSlideOpacity={1}
          onSnapToItem={setActiveItem}
        />
      </View>
      <Pagination
        dotsLength={props.items.length}
        activeDotIndex={activeItem}
        containerStyle={styles.paginationContainer}
        dotColor={colors.dark}
        inactiveDotColor={colors.lightGray}
        dotStyle={styles.paginationDot}
        inactiveDotOpacity={1}
        inactiveDotScale={0.8}
        carouselRef={ref as any}
        tappableDots={false}
      />
    </View>
  )
}

const shadowOpt = {
  width: ITEM_WIDTH,
  height: ITEM_HEIGHT,
  color: '#6b7b8b',
  opacity: 0.03,
  border: 1,
  radius: 12,
  x: 0,
  y: 0,
  style: {
    padding: 3,
  },
}

const styles = StyleSheet.create({
  itemContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 12,
    width: ITEM_WIDTH - 6,
    height: ITEM_HEIGHT - 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemText: {
    ...fontStyles.bodyLarge,
  },
  paginationContainer: {
    marginVertical: 10,
  },
  paginationDot: {},
})

export default React.memo(Carousel)
