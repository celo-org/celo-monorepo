import throttle from 'lodash.throttle'
import * as React from 'react'
import { LayoutChangeEvent, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import Hoverable from 'src/shared/Hoverable'
import Responsive from 'src/shared/Responsive'
import Triangle, { Direction } from 'src/shared/Triangle'
import { colors, fonts } from 'src/styles'
export interface ListItem {
  id: string
  selected: boolean
  label: string
}

export interface Props {
  name: string
  list?: ListItem[]
  onSelect: (key: string) => void
  onClear: () => void
  isOpen: boolean
  index: number
  toggleOpen: (index: number | null) => void
}

interface State {
  width: number
  offset: number
}

export default class DropDown extends React.Component<Props, State> {
  state = { isOpen: false, width: 0, offset: 0 }

  onLayout = throttle(({ nativeEvent }: LayoutChangeEvent) => {
    this.setState({
      width: nativeEvent.layout.width,
      offset: nativeEvent.layout.height + 5,
    })
  }, 100)

  onSelectAll = () => {
    this.props.onClear()
    this.props.toggleOpen(null)
  }

  toggleOpen = () => {
    this.props.toggleOpen(this.props.isOpen ? null : this.props.index)
  }

  onSelectItem = (key: string) => {
    this.props.onSelect(key)
    this.props.toggleOpen(null)
  }

  getTitle = () => {
    const selected = this.props.list.find((item) => item.selected)
    return (selected && selected.label) || this.props.name
  }

  render() {
    const { list, name } = this.props
    const nonSelected = this.props.list.filter((item) => item.selected).length === 0

    const listStyles = [
      styles.pill,
      styles.list,
      { width: this.state.width, top: this.state.offset },
      this.props.isOpen ? styles.listOpen : styles.listClosed,
    ]
    const listStylesMobile = [
      styles.pill,
      styles.list,
      this.props.isOpen ? styles.listOpenMobile : styles.listClosed,
    ]
    return (
      <View style={this.props.isOpen ? styles.containerOpen : styles.containerClosed}>
        <TouchableOpacity onPress={this.toggleOpen}>
          <View style={[styles.pill, styles.label]} onLayout={this.onLayout}>
            <Text accessibilityRole="label" style={[fonts.p, styles.text]}>
              {this.getTitle()}
            </Text>
            <Triangle direction={this.props.isOpen ? Direction.up : Direction.down} />
          </View>
        </TouchableOpacity>
        <Responsive medium={listStyles}>
          <View style={listStylesMobile}>
            <Text
              key={'all'}
              style={[fonts.p, styles.item, nonSelected && styles.selected]}
              onPress={this.onSelectAll}
            >
              {name}
            </Text>
            {list
              .sort((a, b) => (a.id > b.id ? 1 : -1))
              .map(({ id, label, selected }) => {
                return (
                  <DropDownElement
                    key={id}
                    id={id}
                    label={label}
                    selected={selected}
                    onSelect={this.onSelectItem}
                  />
                )
              })}
          </View>
        </Responsive>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  containerOpen: {
    position: 'relative',
    zIndex: 2,
  },
  containerClosed: {
    position: 'static',
    zIndex: -1,
  },
  label: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flex: 1,
    padding: 10,
  },
  selected: {
    backgroundColor: colors.goldSelect,
  },
  hovering: {
    backgroundColor: colors.goldSubtle,
  },
  item: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: colors.white,
    // @ts-ignore
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    cursor: 'pointer',
  },
  pill: {
    borderColor: colors.gray,
    borderWidth: 1,
    borderRadius: 3,
    marginVertical: 5,
    backgroundColor: colors.white,
  },
  text: {
    textTransform: 'none',
    paddingRight: 15,
    // @ts-ignore
    wordBreak: 'break-word',
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
  },
  list: {
    flex: 1,
  },
  listOpen: {
    position: 'absolute',
    zIndex: 10,
  },
  listOpenMobile: {
    position: 'relative',
  },
  listClosed: {
    display: 'none',
  },
})

interface DropDownElementProps {
  onSelect: (s: string) => void
}

interface DropDownElementState {
  isHovering: boolean
}

type DDEProps = ListItem & DropDownElementProps

class DropDownElement extends React.PureComponent<DDEProps, DropDownElementState> {
  state = {
    isHovering: false,
  }

  onSelect = () => {
    this.props.onSelect(this.props.id)
  }

  onHover = () => {
    this.setState({ isHovering: true })
  }

  onExit = () => {
    this.setState({ isHovering: false })
  }

  render() {
    const { id, selected, label } = this.props
    return (
      <Hoverable key={id} onHoverIn={this.onHover} onHoverOut={this.onExit} onPress={this.onSelect}>
        <Text
          style={[
            fonts.p,
            styles.item,
            selected && styles.selected,
            this.state.isHovering && styles.hovering,
          ]}
        >
          {label}
        </Text>
      </Hoverable>
    )
  }
}
