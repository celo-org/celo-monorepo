import * as React from 'react'
import { Image, ImageSourcePropType, StyleSheet, Text, View } from 'react-native'
import { H2 } from 'src/fonts/Fonts'
import { NameSpaces, useTranslation } from 'src/i18n'
import {
  buildWithCeloOnLight,
  coinTalkOnLight,
  connectPeopleOnLight,
  educateOnLight,
  expandReachOnLight,
} from 'src/icons'
import { Cell, GridRow, Spans } from 'src/layout/GridRow'
import { useScreenSize } from 'src/layout/ScreenSize'
import { fonts, standardStyles, textStyles } from 'src/styles'

const OFFERINGS = [
  connectPeopleOnLight,
  buildWithCeloOnLight,
  coinTalkOnLight,
  educateOnLight,
  expandReachOnLight,
]

export default React.memo(function Benefits() {
  const { t } = useTranslation(NameSpaces.alliance)
  const { isMobile } = useScreenSize()
  return (
    <GridRow
      desktopStyle={standardStyles.blockMargin}
      tabletStyle={standardStyles.blockMarginTablet}
      mobileStyle={standardStyles.blockMarginMobile}
    >
      <Cell span={Spans.full}>
        <Text style={[fonts.h3Mobile, isMobile && textStyles.center]}>
          {t('benefits.headline')}
        </Text>
        <H2 style={[standardStyles.elementalMargin, isMobile && textStyles.center]}>
          {t('benefits.title')}
        </H2>
        <View
          style={[
            styles.offeringsArea,
            standardStyles.centered,
            standardStyles.blockMarginTopTablet,
          ]}
        >
          {OFFERINGS.map((img, index) => (
            <Offering key={index} text={t(`benefits.offerings.${index}`)} icon={img} />
          ))}
        </View>
      </Cell>
    </GridRow>
  )
})

interface OfferingProps {
  icon: ImageSourcePropType
  text: string
}

const Offering = React.memo(function _Offering({ icon, text }: OfferingProps) {
  return (
    <View style={standardStyles.centered}>
      <Image resizeMode="contain" source={icon} style={styles.offeringImage} />
      <Text style={[fonts.p, styles.offeringText, textStyles.center]}>{text}</Text>
    </View>
  )
})

const styles = StyleSheet.create({
  offeringText: {
    maxWidth: 240,
    marginHorizontal: 50,
    marginVertical: 30,
  },
  offeringImage: {
    width: 100,
    height: 100,
  },
  offeringsArea: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
})
