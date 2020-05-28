import * as React from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { NameSpaces, useTranslation } from 'src/i18n'
import Octocat from 'src/icons/Octocat'
import { useScreenSize } from 'src/layout/ScreenSize'
import LogoLightBg from 'src/logos/LogoLightBg'
import Button, { BTN } from 'src/shared/Button.3'
import { CeloLinks } from 'src/shared/menu-items'
import { colors, fonts, standardStyles } from 'src/styles'

interface Props {
  title: string
  link: string
}

export default function TopBar({ title, link }: Props) {
  const { isMobile } = useScreenSize()
  const { t } = useTranslation(NameSpaces.common)
  return (
    <View style={standardStyles.centered}>
      <View style={[standardStyles.row, styles.container]}>
        <a href={link}>
          <TouchableOpacity style={styles.logo}>
            <LogoLightBg height={30} />
            {!isMobile && (
              <Text
                // @ts-ignore -- added initial to the aug but it still isnt liking it
                style={[fonts.h3, styles.title]}
              >
                {title}
              </Text>
            )}
          </TouchableOpacity>
        </a>
        <Button
          kind={BTN.NAV}
          href={CeloLinks.gitHub}
          text={t('github')}
          target={'_blank'}
          iconRight={<Octocat size={22} color={colors.dark} />}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  title: {
    marginLeft: 15,
    lineHeight: 'initial', // fixes the vertical alignment
  },
  container: {
    maxWidth: 1600,
    backgroundColor: colors.white,
    justifyContent: 'space-between',
    padding: 20,
    alignItems: 'center',
    width: '100%',
    flex: 1,
  },
  logo: {
    alignContent: 'center',
    flexDirection: 'row',
  },
})
