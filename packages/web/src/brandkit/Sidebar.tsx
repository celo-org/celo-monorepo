import * as React from 'react'
import { Text, StyleSheet, View } from 'react-native'
import Button, { BTN } from 'src/shared/Button.3'
import OvalCoin from 'src/shared/OvalCoin'
import { colors, standardStyles } from 'src/styles'

interface Section {
  title: string
  href: string
  active: boolean
}

interface Page {
  title: string
  href: string
  active: boolean
  sections: Section[]
}

interface Props {
  pages: Page[]
}

export default React.memo<Props>(function Sidebar({ pages }: Props) {
  return (
    <View style={styles.stay}>
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
        style={!props.active && { fontWeight: 'normal' }}
      />
    </View>
  )
})

function color(kind: Kind) {
  return kind === Kind.page ? colors.primary : colors.gold
}

const styles = StyleSheet.create({
  stay: {
    // @ts-ignore
    position: 'fixed',
    // backgroundColor: colors.gray,
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
    transitionDuration: '200ms',
  },
  activeSection: {
    transform: [{ scaleY: 1 }],
  },
})
