import * as React from 'react'
import { StyleSheet, View } from 'react-native'
import Benefits from 'src/collective/Benefits'
import CollectiveMission from 'src/collective/CollectiveMission'
import Sweep from 'src/collective/Sweep'
import { H4 } from 'src/fonts/Fonts'
import OpenGraph from 'src/header/OpenGraph'
import { NameSpaces, useTranslation } from 'src/i18n'
import menuItems from 'src/shared/menu-items'
import { textStyles, standardStyles } from 'src/styles'

export default function Collective() {
  const { t } = useTranslation(NameSpaces.collective)
  return (
    <View>
      <OpenGraph
        title="Celo Collective"
        description="TODO"
        path={menuItems.ALLIANCE_COLLECTIVE.link}
      />
      <View style={standardStyles.darkBackground}>
        <View style={styles.sweepContainer}>
          <Sweep>
            <H4 style={textStyles.invert}>{t('thematicStatement')}</H4>
          </Sweep>
        </View>
        <CollectiveMission />
      </View>
      <Benefits />
    </View>
  )
}

const styles = StyleSheet.create({
  sweepContainer: {
    transform: [{ translateY: -200 }],
  },
})
