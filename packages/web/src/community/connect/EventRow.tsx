import * as React from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { I18nProps, withNamespaces } from 'src/i18n'
import { ScreenProps, ScreenSizes, withScreenSize } from 'src/layout/ScreenSize'
import Button, { BTN } from 'src/shared/Button.3'
import OvalCoin from 'src/shared/OvalCoin'
import { parseDate, printDuration } from 'src/shared/PlaceDate'
import { colors, fonts, standardStyles } from 'src/styles'

import { EventProps } from 'fullstack/EventProps'
import Chevron from 'src/icons/chevron'

interface Section {
  section: string
}

type Props = EventProps & Section & ScreenProps & I18nProps

class EventRow extends React.PureComponent<Props> {
  visibleCoins() {
    const { celoHosted, celoSpeaking } = this.props
    const coins = []
    if (celoHosted) {
      coins.push({ color: colors.primary })
    }
    if (celoSpeaking) {
      coins.push({ color: colors.purple })
    }
    return coins
  }

  render() {
    const {
      name,
      startDate,
      location,
      link,

      endDate,
      section,
      description,
      screen,
      recap,
    } = this.props

    const isMobile = screen === ScreenSizes.MOBILE
    const isHighlightEvent = section === 'Highlight Event'
    const isPastEvent = section === 'Past Events'
    const filteredCoins = this.visibleCoins()
    return (
      <View style={styles.container}>
        <View style={styles.start}>
          <a href={link} target="_external">
            <TouchableOpacity style={styles.title}>
              <Text numberOfLines={1} style={[fonts.h5, styles.name]}>
                {name}
              </Text>
              {filteredCoins.map(({ color }, index) => {
                const transform = [{ translateX: (index * COIN_SIZE) / -2 }]
                return (
                  <React.Fragment key={color}>
                    <View style={{ transform }}>
                      <OvalCoin size={COIN_SIZE} color={color} mixBlendMode={'multiply'} />
                    </View>

                    {isMobile &&
                      index === filteredCoins.length - 1 && (
                        <View style={[styles.chevron, { transform }]}>
                          <Chevron color={colors.dark} opacity={1} size={9} />
                        </View>
                      )}
                  </React.Fragment>
                )
              })}
              {isMobile &&
                filteredCoins.length === 0 && <Chevron color={colors.dark} opacity={1} size={9} />}
            </TouchableOpacity>
          </a>
          {isHighlightEvent && (
            <Text style={[fonts.p, standardStyles.elementalMarginBottom]}>{description}</Text>
          )}
        </View>
        <View style={!isMobile && styles.row}>
          <Text style={fonts.p}>
            {location} — {printDuration(parseDate(startDate), parseDate(endDate))}
          </Text>
          <EventLink
            link={link}
            recap={recap}
            isMobile={isMobile}
            isPastEvent={isPastEvent}
            t={this.props.t}
          />
        </View>
      </View>
    )
  }
}

interface EventLinkProps {
  link: string
  recap?: string
  isPastEvent: boolean
  isMobile: boolean
  t: (key: string) => string
}
class EventLink extends React.PureComponent<EventLinkProps> {
  render() {
    const { link, recap, isPastEvent, t, isMobile } = this.props
    if (link && !isPastEvent && !isMobile) {
      return <Button text={t('events.eventPage')} kind={BTN.NAKED} href={link} target="_external" />
    }
    if (recap && recap.length) {
      return <Button text={t('events.recap')} kind={BTN.NAKED} href={recap} target="_external" />
    }
    return null
  }
}

export default withNamespaces('community')(withScreenSize(EventRow))

const COIN_SIZE = 12
const styles = StyleSheet.create({
  container: {
    marginVertical: 25,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  title: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    marginRight: 3,
  },
  start: {
    flex: 1,
  },
  chevron: {
    marginLeft: 3,
  },
})
