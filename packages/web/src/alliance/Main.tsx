import * as React from 'react'
import { StyleSheet, View } from 'react-native'
import Fade from 'react-reveal/Fade'
import Affirmations from 'src/alliance/Affirmations'
import Benefits from 'src/alliance/Benefits'
import CollectiveMission from 'src/alliance/CollectiveMission'
import PinWheel from 'src/alliance/PinWheel'
import WheelWithForm from 'src/alliance/RisingPinWheelForm'
import SignupForm from 'src/alliance/SignupForm'
import { H4 } from 'src/fonts/Fonts'
import OpenGraph from 'src/header/OpenGraph'
import { NameSpaces, useTranslation } from 'src/i18n'
import { Cell, GridRow, Spans } from 'src/layout/GridRow'
import { useScreenSize } from 'src/layout/ScreenSize'
import ConnectionFooter from 'src/shared/ConnectionFooter'
import menuItems from 'src/shared/menu-items'
import { colors, standardStyles } from 'src/styles'

export default function Main() {
  const { t } = useTranslation(NameSpaces.alliance)
  const { isDesktop } = useScreenSize()
  return (
    <View>
      <OpenGraph
        title="Celo Alliance"
        description="TODO"
        path={menuItems.ALLIANCE_COLLECTIVE.link}
      />
      <View style={standardStyles.darkBackground}>
        <View
          style={[
            standardStyles.centered,
            isDesktop ? styles.sweepContainer : styles.sweepContainerMobile,
          ]}
        >
          <PinWheel mobileContainerStyle={styles.mobileSweepInner}>
            <View
              style={{
                // @ts-ignore
                animationDuration: '4000ms',
                animationIterationCount: 1,
                animationFillMode: 'forwards',
                animationTimingFunction: 'cubic-bezier(1,.06,1,.35)',
                animationKeyframes: [
                  {
                    '0%': {
                      opacity: 0.1,
                      background: `linear-gradient(90deg, rgba(12,218,110,1) 21%, rgba(255,101,83,1) 40%, rgba(159,105,255,1) 60%, rgba(82,182,255,1) 80%)`,
                    },
                    '15%': {
                      background: `linear-gradient(90deg, rgba(82,182,255,1) 18%, rgba(12,218,110,1) 39%, rgba(255,101,83,1) 63%, rgba(159,105,255,1) 80%)`,
                    },
                    '30%': {
                      background: `linear-gradient(90deg, rgba(159,105,255,1) 22%, rgba(82,182,255,1) 38%, rgba(12,218,110,1) 62%, rgba(255,101,83,1) 81%)`,
                    },
                    '45%': {
                      background: `linear-gradient(90deg, rgba(255,101,83,1) 20%, rgba(159,105,255,1) 40%, rgba(82,182,255,1) 62%, rgba(12,218,110,1) 84%)`,
                    },
                    '60%': {
                      background: `linear-gradient(90deg, rgba(12,218,110,1) 21%, rgba(255,101,83,1) 40%, rgba(159,105,255,1) 60%, rgba(82,182,255,1) 80%)`,
                    },
                    '75%': {
                      background: `linear-gradient(90deg, rgba(255,255,255,1) 0%, rgba(12,218,110,1) 23%, rgba(255,101,83,1) 44%, rgba(159,105,255,1) 68%, rgba(82,182,255,1) 90%)`,
                    },
                    '80%': {
                      background: `linear-gradient(90deg, rgba(255,255,255,1) 22%, rgba(12,218,110,1) 43%, rgba(255,101,83,1) 66%, rgba(159,105,255,1) 88%, rgba(82,182,255,1) 100%)`,
                    },
                    '85%': {
                      background: `linear-gradient(90deg, rgba(255,255,255,1) 42%, rgba(12,218,110,1) 65%, rgba(255,101,83,1) 87%, rgba(159,105,255,1) 100%, rgba(82,182,255,1) 100%)`,
                    },
                    '90%': {
                      background: `linear-gradient(90deg, rgba(255,255,255,1) 64%, rgba(12,218,110,1) 81%, rgba(255,101,83,1) 98%, rgba(159,105,255,1) 100%, rgba(82,182,255,1) 100%)`,
                    },
                    '95%': {
                      background: `linear-gradient(90deg, rgba(255,255,255,1) 86%, rgba(12,218,110,1) 97%, rgba(255,101,83,1) 98%, rgba(159,105,255,1) 100%, rgba(82,182,255,1) 100%)`,
                    },
                    '100%': {
                      opacity: 1,
                      backgroundColor: colors.white,
                    },
                  },
                ],
              }}
            >
              <H4 style={[styles.thematicTitle, { mixBlendMode: 'darken' }]}>
                {t('thematicStatement')}
              </H4>
            </View>
          </PinWheel>
        </View>
        <GridRow
          desktopStyle={standardStyles.sectionMarginBottom}
          tabletStyle={standardStyles.sectionMarginBottomTablet}
          mobileStyle={standardStyles.sectionMarginBottomMobile}
          allStyle={standardStyles.centered}
        >
          <Cell span={Spans.half}>
            <Fade>
              <CollectiveMission />
              <SignupForm />
            </Fade>
          </Cell>
        </GridRow>
      </View>
      <Affirmations />
      <Benefits />
      <WheelWithForm />
      <ConnectionFooter includeDividerLine={false} />
    </View>
  )
}

const styles = StyleSheet.create({
  thematicTitle: {
    color: colors.white,
    backgroundColor: colors.dark,
  },
  sweepContainer: {
    transform: [
      {
        translateY: -100,
      } as any,
    ],
  },
  sweepContainerMobile: {
    transform: [
      {
        translateY: -200,
      } as any,
    ],
  },
  mobileSweepInner: {
    height: '100vh',
    width: '95vw',
    justifyContent: 'space-evenly',
  },
})
