import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { H2 } from 'src/fonts/Fonts'
import preview from 'src/home/involvement/preview.png'
import { NameSpaces, useTranslation } from 'src/i18n'
import { Cell, GridRow, Spans } from 'src/layout/GridRow'
import { useScreenSize } from 'src/layout/ScreenSize'
import Button, { BTN, SIZE } from 'src/shared/Button.3'
import menuItems, { hashNav } from 'src/shared/menu-items'
import Navigation, { NavigationTheme } from 'src/shared/Navigation'
import Photo from 'src/shared/Photo'
import { fonts, standardStyles, textStyles } from 'src/styles'

enum Paths {
  build,
  grow,
  validate,
  partner,
  connect,
  work,
}

const MOVE_BY = {
  [Paths.build]: -15,
  [Paths.grow]: -30,
  [Paths.validate]: -80,
  [Paths.partner]: -140,
  [Paths.connect]: -160,
  [Paths.work]: -180,
}

export default function Involvement() {
  const [currentPath, setPath] = React.useState(Paths.build)

  const { isMobile } = useScreenSize()

  return (
    <View style={standardStyles.darkBackground}>
      <GridRow
        nativeID={hashNav.home.partnerships}
        desktopStyle={standardStyles.blockMarginBottomTablet}
        tabletStyle={standardStyles.blockMarginBottomTablet}
        mobileStyle={standardStyles.blockMarginBottomMobile}
      >
        <Cell span={Spans.three4th}>
          <View
            style={[
              standardStyles.row,
              styles.controls,
              {
                transform: [{ translateX: isMobile ? MOVE_BY[currentPath] : MOVE_BY[Paths.build] }],
              },
            ]}
          >
            <Control setPath={setPath} currentPath={currentPath} path={Paths.build} />
            <Control setPath={setPath} currentPath={currentPath} path={Paths.grow} />
            <Control setPath={setPath} currentPath={currentPath} path={Paths.validate} />
            <Control setPath={setPath} currentPath={currentPath} path={Paths.partner} />
            <Control setPath={setPath} currentPath={currentPath} path={Paths.connect} />
            <Control setPath={setPath} currentPath={currentPath} path={Paths.work} />
          </View>
        </Cell>
      </GridRow>
      <GridRow
        desktopStyle={standardStyles.sectionMarginBottom}
        tabletStyle={standardStyles.sectionMarginBottomTablet}
        mobileStyle={standardStyles.sectionMarginBottomMobile}
      >
        <Content path={currentPath} />
      </GridRow>
    </View>
  )
}

const styles = StyleSheet.create({
  buttons: {
    alignItems: 'center',
    flexWrap: 'wrap-reverse',
  },
  controls: {
    transitionProperty: 'transform',
    transitionDuration: '300ms',
    justifyContent: 'space-between',
  },
  content: {
    animationDelay: '250ms',
    animationIterationCount: 1,
    animationFillMode: 'both',
    animationDuration: '1200ms',
    animationKeyframes: [
      {
        from: { opacity: 0 },
        to: { opacity: 1 },
      },
    ],
  },
  textArea: {
    minHeight: 120,
  },
  primary: {
    marginRight: 20,
  },
  secondary: {
    paddingVertical: 20,
  },
})

interface ControlProps {
  path: Paths
  currentPath: Paths
  setPath: (p: Paths) => void
}

function Control({ path, currentPath, setPath }: ControlProps) {
  const { t } = useTranslation(NameSpaces.home)
  const onPress = React.useCallback(() => setPath(path), [path, setPath])

  return (
    <Navigation
      theme={NavigationTheme.DARKGREEN}
      text={t(`involve.paths.${path}.name`)}
      selected={path === currentPath}
      onPress={onPress}
    />
  )
}

const LINKS = {
  [Paths.build]: {
    primary: 'https://docs.celo.org/v/master/developer-guide/overview/introduction',
    secondary: 'https://www.crowdcast.io/e/celo-tech-talks-part-2',
    img: require(`src/home/involvement/build.jpg`),
  },
  [Paths.grow]: {
    primary: 'https://c-labs.typeform.com/to/gj9aUp',
    secondary: `${menuItems.COMMUNITY.link}#${hashNav.connect.fund}`,
    img: require(`src/home/involvement/grow.jpg`),
  },
  [Paths.validate]: {
    primary: 'https://docs.celo.org/getting-started/mainnet/running-a-validator-in-mainnet',
    secondary: 'https://chat.celo.org',
    img: require(`src/home/involvement/validate.png`),
  },
  [Paths.partner]: {
    primary: 'https://medium.com/celoorg/alliance/home',
    secondary: 'https://celo.org/alliance',
    img: require(`src/home/involvement/partner.jpg`),
  },
  [Paths.connect]: {
    primary: 'https://airtable.com/shrfUJWk1eKfFcZKb',
    secondary: `${menuItems.COMMUNITY.link}#${hashNav.connect.events}`,
    img: require(`src/home/involvement/connect.jpg`),
  },
  [Paths.work]: {
    primary: menuItems.JOBS.link,
    secondary: `${menuItems.COMMUNITY.link}#${hashNav.connect.fellowship}`,
    img: require(`src/home/involvement/work.jpg`),
  },
}

function Content({ path }) {
  const { t } = useTranslation(NameSpaces.home)
  const { isMobile } = useScreenSize()
  return (
    <>
      <Cell span={Spans.half}>
        <View key={path} style={styles.content} nativeID={Paths[path]}>
          <H2 style={textStyles.invert}>{t(`involve.paths.${path}.title`)}</H2>
          <Text
            style={[fonts.p, textStyles.invert, standardStyles.elementalMargin, styles.textArea]}
          >
            {t(`involve.paths.${path}.text`)}
          </Text>
          <View style={[standardStyles.row, styles.buttons]}>
            <Button
              kind={BTN.PRIMARY}
              text={t(`involve.paths.${path}.primary`)}
              style={styles.primary}
              href={LINKS[path].primary}
            />
            <Button
              kind={BTN.NAKED}
              text={t(`involve.paths.${path}.secondary`)}
              size={SIZE.normal}
              style={styles.secondary}
              href={LINKS[path].secondary}
            />
          </View>
        </View>
      </Cell>
      {!isMobile && (
        <Cell span={Spans.half}>
          <Photo key={path} image={LINKS[path].img} ratio={470 / 290} preview={preview} />
        </Cell>
      )}
    </>
  )
}
