import * as React from 'react'
import { Text, StyleSheet, View } from 'react-native'
import Button, { BTN } from 'src/shared/Button.3'
import OvalCoin from 'src/shared/OvalCoin'
import { colors, standardStyles } from 'src/styles'
import { withScreenSize, ScreenProps, ScreenSizes } from 'src/layout/ScreenSize'

interface Section {
  title: string
  href: string
  active: boolean
}

export interface Page {
  title: string
  href: string
  active: boolean
  sections: Section[]
}

interface Props {
  pages: Page[]
}

export default withScreenSize(
  React.memo<Props>(function Sidebar({ pages, screen }: Props & ScreenProps) {
    return (
      <View style={screen === ScreenSizes.MOBILE ? styles.mobileContainer : styles.container}>
        {pages.map((page) => {
          return (
            <>
              <Link
                key={page.title}
                kind={Kind.page}
                href={page.href}
                title={page.title}
                active={page.active}
              />
              {page.sections && <SectionNav sections={page.sections} active={page.active} />}
            </>
          )
        })}
      </View>
    )
  })
)

const SectionNav = React.memo(function SectionNav_({
  sections,
  active,
}: {
  sections: Section[]
  active: boolean
}) {
  return (
    <View style={[styles.section, active && styles.activeSection]}>
      {active &&
        sections.map((section) => {
          return (
            <>
              <Link
                key={section.title}
                kind={Kind.section}
                href={section.href}
                title={section.title}
                active={section.active}
              />
            </>
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
}

const COIN_SIZE = 12

const Link = React.memo(function _Link(props: LinkProps & Section) {
  return (
    <View style={[standardStyles.row, styles.item]}>
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
        text={props.title}
        style={!props.active && styles.inactiveText}
      />
    </View>
  )
})

function color(kind: Kind) {
  return kind === Kind.page ? colors.primary : colors.gold
}

const styles = StyleSheet.create({
  mobileContainer: {
    width: '100%',
    zIndex: 10,
  },
  container: {
    // @ts-ignore
    position: 'fixed',
  },
  iconPlaceholder: { width: COIN_SIZE },
  item: {
    padding: 5,
    margin: 5,
  },
  section: {
    // @ts-ignore
    transformOrigin: 'top',
    transform: [{ scaleY: 0 }],
    marginLeft: 20,
    transitionProperty: 'transform',
    transitionDuration: '100ms',
  },
  activeSection: {
    transform: [{ scaleY: 1 }],
  },
  inactiveText: { fontWeight: 'normal' },
})
