import * as React from 'react'
import { StyleSheet, View } from 'react-native'
import { NameSpaces, useTranslation } from 'src/i18n'
import RingsGlyph from 'src/logos/RingsGlyph'
import Button, { BTN } from 'src/shared/Button.3'
import menu, { MAIN_MENU } from 'src/shared/menu-items'
import { standardStyles } from 'src/styles'
const MENU = [menu.HOME, ...MAIN_MENU]
interface Props {
  currentPage: string
}

export default function MobileMenu({ currentPage }: Props) {
  const { t } = useTranslation(NameSpaces.common)
  return (
    <View style={styles.root}>
      <View style={styles.menu}>
        {MENU.map((item) => {
          const linkIsToCurrentPage = currentPage === item.link
          const btnKind = linkIsToCurrentPage ? BTN.TERTIARY : BTN.NAV

          return (
            <View key={item.name} style={styles.menuItem}>
              {/* 
              // @ts-ignore */}
              <Button
                href={item.link}
                text={t(item.name)}
                kind={btnKind}
                key={item.name}
                align={'center'}
                style={styles.buttonText}
              />
            </View>
          )
        })}
      </View>
      <View style={[standardStyles.centered, styles.rings]}>
        <RingsGlyph height={30} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    flex: 1,
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  rings: { paddingVertical: 30 },
  menu: {
    alignItems: 'center',
    paddingHorizontal: 20,
    flexDirection: 'column',
    justifyContent: 'space-around',
  },
  menuItem: {
    marginHorizontal: 10,
    marginVertical: 25,
  },
  buttonText: {
    fontSize: 20,
    alignItems: 'center',
  },
})
