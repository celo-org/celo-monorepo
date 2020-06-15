import colors from '@celo/react-components/styles/colors.v2'
import { elevationShadowStyle } from '@celo/react-components/styles/styles'
import * as React from 'react'
import { StyleSheet, View } from 'react-native'
import MenuBurger from 'src/icons/MenuBurger'

interface Props {
  length: number
}

function MenuBurgerCard({ length }: Props) {
  return (
    <View style={[styles.container, { height: length, width: length }]}>
      <MenuBurger height={length * 1.75} width={length * 1.75} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.light,
    ...elevationShadowStyle(12),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
  },
})

export default React.memo(MenuBurgerCard)
