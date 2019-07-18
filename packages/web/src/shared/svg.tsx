import { GProps, LineProps, PathProps } from 'react-native-svg'
import { createElement } from 'react-native-web'

export function Path(props: PathProps) {
  return createElement('path', { ...props, onClick: props.onPress })
}

export function G(props: GProps & { children: React.ReactNode }) {
  return createElement('g', props)
}

export function Line(props: LineProps) {
  return createElement('line', props)
}
