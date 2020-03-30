import { TFunction } from 'next-i18next'
import * as React from 'react'
import LazyFade from 'react-lazyload-fadein'
import { Image, StyleSheet, Text, View } from 'react-native'
import Ally from 'src/alliance/AllianceMember'
import { Category as CategoryEnum } from 'src/alliance/CategoryEnum'
import gatherAllies from 'src/alliance/gatherAllies'
import { H2, H4 } from 'src/fonts/Fonts'
import { NameSpaces, Trans, useTranslation } from 'src/i18n'
import { Cell, GridRow, Spans } from 'src/layout/GridRow'
import { useScreenSize } from 'src/layout/ScreenSize'
import { ListItem } from 'src/shared/DropDown'
import DropDownGroup from 'src/shared/DropDownGroup'
import Outbound, { externalizeURL } from 'src/shared/Outbound'
import { colors, fonts, standardStyles, textStyles } from 'src/styles'

function buildDropDownProps(t: TFunction, currentFilter: string): ListItem[] {
  return Object.keys(CategoryEnum).map((key) => {
    return {
      id: key,
      selected: key === currentFilter,
      label: t(`members.categoryTitle.${key.toLocaleLowerCase()}`),
    }
  })
}

function initialState() {
  return Object.keys(CategoryEnum).map((key: CategoryEnum) => {
    return {
      name: key,
      records: [],
    }
  })
}

const ALL = 'all'

export default function Members() {
  const { t } = useTranslation(NameSpaces.alliance)
  const [alliesByCategory, setAllies] = React.useState(initialState())
  const [selectedFilter, setFilter] = React.useState(ALL)

  const { isTablet, isMobile } = useScreenSize()

  React.useEffect(() => {
    const signal = { aborted: false }
    // sometimes it is nessessary to break a rule
    // https://github.com/facebook/react/issues/14326
    // tslint:disable-next-line: no-floating-promises
    gatherAllies(setAllies, signal)

    return () => {
      signal.aborted = true
    }
  }, [])

  const onClear = React.useCallback(() => setFilter(ALL), [])

  const displayedCategories = React.useMemo(
    () =>
      selectedFilter === ALL
        ? alliesByCategory
        : alliesByCategory.filter(({ name }) => name === selectedFilter),
    [alliesByCategory, selectedFilter]
  )

  return (
    <View nativeID={'members'}>
      <GridRow
        desktopStyle={[standardStyles.sectionMarginTop, standardStyles.centered]}
        tabletStyle={[standardStyles.sectionMarginTopTablet, { justifyContent: 'flex-end' }]}
        mobileStyle={standardStyles.sectionMarginTopMobile}
      >
        <Cell span={Spans.half} tabletSpan={Spans.three4th}>
          <H2 style={[styles.memberTitle, !isTablet && textStyles.center]}>{t('members.title')}</H2>
          <H4 style={[standardStyles.blockMarginBottomMobile, isMobile && textStyles.center]}>
            <Trans i18nKey={'members.subtitle'} ns={NameSpaces.alliance}>
              <Text style={textStyles.italic}>{}</Text>
            </Trans>
          </H4>
        </Cell>
      </GridRow>
      <GridRow
        allStyle={styles.membersArea}
        desktopStyle={standardStyles.sectionMarginBottom}
        tabletStyle={standardStyles.sectionMarginBottomTablet}
        mobileStyle={standardStyles.sectionMarginBottomMobile}
      >
        <Cell span={Spans.fourth}>
          <View style={styles.selectionArea}>
            <Text style={[fonts.h6, styles.filterLabel]}>{t('filterLabel')}</Text>
            <DropDownGroup
              data={[
                {
                  name: t(`members.categoryTitle.all`),
                  list: React.useMemo(() => buildDropDownProps(t, selectedFilter), [
                    t,
                    selectedFilter,
                  ]),
                  onSelect: setFilter,
                  onClear,
                },
              ]}
            />
          </View>
        </Cell>
        <Cell span={Spans.three4th}>
          {displayedCategories.map((category) => (
            <Category key={category.name} name={category.name} members={category.records} />
          ))}
        </Cell>
      </GridRow>
    </View>
  )
}

interface CategoryProps {
  name: string
  members: Ally[]
}

const Category = React.memo(function _Category({ name, members }: CategoryProps) {
  const key = name.toLowerCase()
  const { t } = useTranslation(NameSpaces.alliance)
  const { isDesktop, isMobile } = useScreenSize()
  return (
    <View>
      <H4>{t(`members.categoryTitle.${key}`)}</H4>
      <View style={styles.grayLine} />
      <Text style={fonts.p}>{t(`members.categoryText.${key}`)}</Text>
      <View
        style={[
          styles.categoryContainer,
          isMobile ? styles.categoryContainerMobile : isDesktop && styles.categoryContainerDesktop,
        ]}
      >
        {members.map(({ name: memberName, logo, url }) => (
          <Member key={memberName} name={memberName} logo={logo} url={url} />
        ))}
      </View>
    </View>
  )
})

const Member = React.memo(function _Member({ logo, name, url }: Ally) {
  const divisor = logo.height / ROW_HEIGHT
  const href = url ? externalizeURL(url) : null
  return logo.uri ? (
    <LazyFade>
      {(onLoad: () => void) => (
        <View style={styles.member}>
          <a target={'_blank'} href={href}>
            <Image
              resizeMode="contain"
              resizeMethod="resize"
              onLoad={onLoad}
              source={{ uri: logo.uri }}
              accessibilityLabel={name}
              style={[styles.logo, { width: logo.width / divisor }]}
            />
          </a>
          {href && <Outbound url={href} />}
        </View>
      )}
    </LazyFade>
  ) : (
    <FallBack text={name} url={href} />
  )
})

function FallBack({ text, url }) {
  return (
    <View style={styles.member}>
      <View style={[standardStyles.centered, styles.logo]}>
        <Text href={url} target="_blank" style={[fonts.micro, textStyles.center]}>
          {text}
        </Text>
      </View>
    </View>
  )
}

const ROW_HEIGHT = 50
const COLUMN_WIDTH = 180

const styles = StyleSheet.create({
  selectionArea: { maxWidth: 220 },
  membersArea: { minHeight: 650 },
  memberTitle: { marginBottom: 5 },
  grayLine: {
    marginTop: 2,
    borderBottomColor: colors.gray,
    borderBottomWidth: 1,
    marginBottom: 10,
  },
  categoryContainer: {
    justifyContent: 'space-between',
    marginVertical: 30,
    flexDirection: 'row',
    flexWrap: 'wrap',
    minHeight: 90,
  },
  categoryContainerMobile: {
    alignItems: 'center',
    flexDirection: 'column',
  },
  categoryContainerDesktop: {
    display: 'grid',
    gridTemplateColumns: `repeat(3, ${COLUMN_WIDTH}px)`,
  },
  member: {
    flexDirection: 'row',
    alignItems: 'center',
    alignContent: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginVertical: 30,
    width: COLUMN_WIDTH,
    height: ROW_HEIGHT,
  },
  logo: {
    backgroundColor: colors.white,
    marginHorizontal: 10,
    padding: 5,
    maxWidth: 150,
    height: ROW_HEIGHT,
  },
  filterLabel: {
    marginBottom: 5,
  },
})
