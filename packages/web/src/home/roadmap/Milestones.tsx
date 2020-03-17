import * as React from 'react'
import { Image, StyleSheet, Text, View } from 'react-native'
import Fade from 'react-reveal/Fade'
import { H1, H3 } from 'src/fonts/Fonts'
import GoldStone from 'src/home/roadmap/GoldStone'
import { NameSpaces, useTranslation } from 'src/i18n'
import valueOFGold from 'src/icons/value-of-gold-no-axis.png'
import { Cell, GridRow, Spans } from 'src/layout/GridRow'
import { hashNav } from 'src/shared/menu-items'
import { fonts, standardStyles, textStyles } from 'src/styles'

const upcoming = new Array(8).fill('')
const past = new Array(6).fill('')

export default function MileStones() {
  const { t } = useTranslation(NameSpaces.home)
  return (
    <>
      <GridRow
        allStyle={styles.container}
        desktopStyle={standardStyles.sectionMarginTop}
        tabletStyle={standardStyles.sectionMarginTopTablet}
        mobileStyle={standardStyles.sectionMarginTopMobile}
        nativeID={hashNav.home.timeline}
      >
        <Cell span={Spans.half}>
          <Image source={valueOFGold} style={styles.rising} resizeMode="contain" />
          <H3>{t('milestones.subtitle')}</H3>
          <H1 ariaLevel="2">{t('milestones.title')}</H1>
          <Text style={fonts.p}>{t('milestones.intro')}</Text>
        </Cell>
      </GridRow>
      <GridRow allStyle={styles.container}>
        <Cell span={Spans.half}>
          <Text style={[fonts.h5, standardStyles.elementalMargin]}>
            {t('milestones.upcomingTitle')}
          </Text>
          {upcoming.map((_, index) => (
            <Upcoming
              key={index}
              title={t(`milestones.upcoming.${index}.title`)}
              text={t(`milestones.upcoming.${index}.text`)}
            />
          ))}
        </Cell>
        <Cell span={Spans.half}>
          <Text style={[fonts.h5, standardStyles.elementalMargin]}>
            {t('milestones.pastTitle')}
          </Text>
          {past.map((_, index) => {
            return (
              <GoldStone
                key={index}
                index={index}
                date={t(`milestones.past.${index}.date`)}
                title={t(`milestones.past.${index}.title`)}
                text={t(`milestones.past.${index}.text`)}
                isLast={index === past.length - 1}
              />
            )
          })}
        </Cell>
      </GridRow>
    </>
  )
}

function Upcoming({ title, text }) {
  return (
    <View style={styles.upcoming}>
      <Fade delay={200}>
        <Text style={[fonts.p, textStyles.heavy]}>{title}</Text>
        <Text style={fonts.p}>{text}</Text>
      </Fade>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginLeft: 10,
  },
  upcoming: {
    marginBottom: 40,
    marginRight: 20,
  },
  rising: {
    width: 75,
    height: 55,
  },
})
