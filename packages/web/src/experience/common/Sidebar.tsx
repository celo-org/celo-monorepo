import * as React from 'react'
import { StyleSheet, View } from 'react-native'
import { ScreenProps, ScreenSizes, withScreenSize } from 'src/layout/ScreenSize'
import Button, { BTN } from 'src/shared/Button.3'
import OvalCoin from 'src/shared/OvalCoin'
import { HEADER_HEIGHT } from 'src/shared/Styles'
import { colors } from 'src/styles'

interface Section {
  title: string
  href: string
}

export interface Page {
  title: string
  href: string
  sections: Section[]
}

interface Props {
  pages: Page[]
  currentPathName: string
  routeHash: string
  onChangeRoute?: () => void
}

export default withScreenSize<Props>(
  React.memo<Props>(function Sidebar({
    pages,
    screen,
    currentPathName,
    routeHash,
    onChangeRoute,
  }: Props & ScreenProps) {
    const container = screen === ScreenSizes.MOBILE ? styles.mobileContainer : styles.container

    return (
      <View style={container} nativeID="sidebar">
        {pages.map((page) => {
          return (
            <React.Fragment key={page.href}>
              <Link
                onPress={onChangeRoute}
                key={page.title}
                kind={Kind.page}
                href={page.href}
                title={page.title}
                active={isActive(page.href, currentPathName)}
              />
              {!!page.sections.length && (
                <SectionNav
                  sections={page.sections}
                  active={isActive(page.href, currentPathName)}
                  routeHash={routeHash}
                  onChangeRoute={onChangeRoute}
                />
              )}
            </React.Fragment>
          )
        })}
      </View>
    )
  })
)

const SectionNav = React.memo(function SectionNav_({
  sections,
  active,
  routeHash,
  onChangeRoute,
}: {
  onChangeRoute?: () => void
  sections: Section[]
  active: boolean
  routeHash: string
}) {
  return (
    <View style={[styles.section, active && styles.activeSection]}>
      {active &&
        sections.map((section) => {
          return (
            <Link
              onPress={onChangeRoute}
              key={section.title}
              kind={Kind.section}
              href={section.href}
              title={section.title}
              active={isActiveSection(section.href, routeHash)}
            />
          )
        })}
    </View>
  )
})

enum Kind {
  page,
  section,
}

interface LinkProps {
  kind: Kind
  active: boolean
  onPress?: () => void
}

const COIN_SIZE = 12

const Link = React.memo(function _Link(props: LinkProps & Section) {
  return (
    <Button
      iconLeft={
        props.active ? (
          <OvalCoin color={color(props.kind)} size={COIN_SIZE} />
        ) : (
          <View style={styles.iconPlaceholder} />
        )
      }
      kind={BTN.NAV}
      href={props.href}
      onPress={props.onPress}
      text={props.title}
      style={[styles.item, !props.active && styles.inactiveText]}
    />
  )
})

function color(kind: Kind) {
  return kind === Kind.page ? colors.primary : colors.gold
}

function isActive(path: string, currentPath: string) {
  if (path === currentPath) {
    return true
  }

  return false
}

function isActiveSection(path: string, routeHash: string) {
  return routeHash.length ? path.endsWith(routeHash) : path.endsWith('overview')
}

const styles = StyleSheet.create({
  mobileContainer: {
    width: '100%',
    zIndex: 10,
  },
  container: {
    position: 'sticky',
    top: HEADER_HEIGHT + 100,
  },
  iconPlaceholder: { width: COIN_SIZE },
  item: {
    padding: 5,
    margin: 5,
  },
  section: {
    transformOrigin: 'top',
    transform: [{ scaleY: 0 }],
    marginLeft: 20,
    transitionProperty: 'transform,',
    transitionDuration: '500ms',
  },
  activeSection: {
    transform: [{ scaleY: 1 }],
  },
  inactiveText: { fontWeight: 'normal' },
})
