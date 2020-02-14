import * as React from 'react'
import { View } from 'react-native'
import Sweep from 'src/collective/Sweep'
import { H4 } from 'src/fonts/Fonts'
import OpenGraph from 'src/header/OpenGraph'
import menuItems from 'src/shared/menu-items'
import { colors, textStyles } from 'src/styles'
import CollectiveMission from 'src/collective/CollectiveMission'

export default function Collective() {
  return (
    <>
      <OpenGraph title="Collective" description="" path={menuItems.ALLIANCE_COLLECTIVE.link} />
      <View style={{ backgroundColor: colors.dark, height: '100vh' }}>
        <View style={{ transform: [{ translateY: -200 }] }}>
          <Sweep>
            <H4 style={textStyles.invert}>Money can be beautiful</H4>
          </Sweep>
          <CollectiveMission />
        </View>
      </View>
    </>
  )
}
