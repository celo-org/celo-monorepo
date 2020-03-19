import * as React from 'react'
import { Image, StyleSheet, Text } from 'react-native'
import { H1, H3 } from 'src/fonts/Fonts'
import GoldStone from 'src/home/roadmap/GoldStone'
import milestones, { Status } from 'src/home/roadmap/milestones'
import { NameSpaces, useTranslation } from 'src/i18n'
import valueOFGold from 'src/icons/value-of-gold-no-axis.png'
import { Cell, GridRow, Spans } from 'src/layout/GridRow'
import { hashNav } from 'src/shared/menu-items'
import { fonts, standardStyles } from 'src/styles'

const upcoming = milestones.filter((milestone) => milestone.status !== Status.complete)
const past = milestones.filter((milestone) => milestone.status === Status.complete).reverse()

export default function TimeLine() {
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
        <Cell span={Spans.half} tabletSpan={Spans.three4th}>
          <Image source={valueOFGold} style={styles.rising} resizeMode="contain" />
          <H3>{t('timeline.subtitle')}</H3>
          <H1 ariaLevel="2">{t('timeline.title')}</H1>
          <Text style={fonts.p}>{t('timeline.intro')}</Text>
        </Cell>
      </GridRow>
      <GridRow allStyle={styles.container}>
        <Cell span={Spans.half}>
          <Text style={[fonts.h5, standardStyles.elementalMargin]}>{t('timeline.pastTitle')}</Text>
          {past.map(({ key, date, status }, index) => {
            return (
              <GoldStone
                status={status}
                key={key}
                index={index}
                date={date}
                title={t(`timeline.milestones.${key}.title`)}
                text={t(`timeline.milestones.${key}.text`)}
                isLast={index === past.length - 1}
              />
            )
          })}
        </Cell>
        <Cell span={Spans.half}>
          <Text style={[fonts.h5, standardStyles.elementalMargin]}>
            {t('timeline.upcomingTitle')}
          </Text>
          {upcoming.map(({ key, status }, index) => (
            <GoldStone
              status={status}
              key={key}
              index={index}
              title={t(`timeline.milestones.${key}.title`)}
              text={t(`timeline.milestones.${key}.text`)}
              isLast={index === past.length - 1}
            />
          ))}
        </Cell>
      </GridRow>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    marginLeft: 10,
  },
  upcoming: {
    marginBottom: 30,
    marginRight: 40,
    maxWidth: 400,
  },
  rising: {
    width: 75,
    height: 55,
  },
})
