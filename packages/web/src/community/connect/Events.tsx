import { EventProps } from 'fullstack/EventProps'
import * as React from 'react'
import { SectionList, StyleSheet, Text, View } from 'react-native'
import Fade from 'react-reveal/Fade'
import EventRow from 'src/community/connect/EventRow'
import { I18nProps, withNamespaces } from 'src/i18n'
import { Cell, GridRow, Spans } from 'src/layout/GridRow'
import Button, { BTN, SIZE } from 'src/shared/Button.3'
import OvalCoin from 'src/shared/OvalCoin'
import Spinner from 'src/shared/Spinner'
import { colors, fonts, standardStyles } from 'src/styles'
import { NoneFound, Radio, SectionHeader } from 'src/table/table'
interface OwnProps {
  upcomingEvents?: EventProps[]
  pastEvents?: EventProps[]
  topEvent?: EventProps | null
  loading?: boolean
}

type Props = I18nProps & OwnProps

enum Filter {
  'speaking',
  'hosting',
}

interface State {
  filter: Filter | null
}

class Events extends React.PureComponent<Props, State> {
  state = {
    filter: null,
  }

  // unset the filter when its pressed twice
  filterBy = (nextFilter: Filter | null) => {
    this.setState((state) => ({ filter: state.filter === nextFilter ? null : nextFilter }))
  }

  filterNone = () => {
    this.setState({ filter: null })
  }

  getSection = (events: EventProps[], title: string) => {
    if (hasEvents(events)) {
      const filteredEvents = filterEvents(events, this.state.filter)
      if (filteredEvents.length > 0) {
        return { title, data: filteredEvents }
      }
    }
  }

  getSections = () => {
    const { t, topEvent, upcomingEvents, pastEvents } = this.props
    return [
      this.getSection([topEvent], t('events.highlightEvent')),
      this.getSection(upcomingEvents, t('events.upcomingEvents')),
      this.getSection(pastEvents, t('events.pastEvents')),
    ].filter((section) => section)
  }

  renderNotFound = () => {
    if (this.props.loading) {
      return <PlaceHolder />
    }

    return (
      <NoneFound
        onPress={this.filterNone}
        actionText={'See All'}
        longText={'There are no events based on your search filtering'}
      />
    )
  }

  renderItem = ({ item, section }: { item: EventProps; section: { title?: string } }) => {
    return (
      <Fade bottom={true} distance="20px">
        <EventRow {...item} key={item.name} section={section.title} />
      </Fade>
    )
  }

  render() {
    const { t } = this.props
    return (
      <GridRow
        desktopStyle={standardStyles.blockMargin}
        tabletStyle={standardStyles.blockMarginTablet}
        mobileStyle={standardStyles.blockMarginMobile}
      >
        <Cell span={Spans.fourth}>
          <View style={standardStyles.blockMarginMobile}>
            <Text style={fonts.h5}>{t('events.refineBy')}</Text>
            <Radio
              icon={<OvalCoin size={14} color={colors.primary} />}
              selected={this.state.filter === Filter.hosting}
              label={'Hosting'}
              value={Filter.hosting}
              onValueSelected={this.filterBy}
            />
            <Radio
              icon={<OvalCoin size={14} color={colors.purple} />}
              selected={this.state.filter === Filter.speaking}
              label={'Speaking'}
              value={Filter.speaking}
              onValueSelected={this.filterBy}
            />
          </View>
          <Text style={[fonts.h5, standardStyles.elementalMarginBottom]}>
            {t('events.reppingCelo')}
          </Text>
          <Text style={fonts.p}>
            Send a note to{' '}
            <Button
              kind={BTN.INLINE}
              text={'community@celo.org'}
              href={'mailto:community@celo.org'}
            />{' '}
            before the event to learn more
          </Text>
        </Cell>
        <Cell span={Spans.three4th}>
          <SectionList
            sections={this.getSections()}
            renderSectionHeader={SectionHeader}
            // @ts-ignore
            renderItem={this.renderItem}
            keyExtractor={keyExtractor}
            ListEmptyComponent={this.renderNotFound}
            contentContainerStyle={styles.container}
          />
          {!this.props.pastEvents && (
            <View style={[standardStyles.centered, standardStyles.blockMarginTop]}>
              <Button
                kind={BTN.DARKNAKED}
                size={SIZE.normal}
                text={t('events.pastEvents')}
                href={'/past-events'}
                target={'_new'}
              />
            </View>
          )}
        </Cell>
      </GridRow>
    )
  }
}

function keyExtractor(item: EventProps) {
  return item.name
}

function hasEvents(events: EventProps[]) {
  return events && events.length > 0 && !!events[0]
}

function filterEvents(events: EventProps[], currentFilter: Filter | null) {
  if (currentFilter !== null) {
    const filterFunction = (event: EventProps) => {
      switch (currentFilter) {
        case Filter.hosting:
          return event.celoHosted
        case Filter.speaking:
          return event.celoSpeaking
      }
    }

    return events.filter(filterFunction)
  }
  return events
}

export default withNamespaces('community')(Events)

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  placeholder: {
    height: '90vh',
  },
})

function PlaceHolder() {
  return (
    <View style={[standardStyles.centered, styles.placeholder]}>
      <Spinner color={colors.primary} size="medium" />
    </View>
  )
}
