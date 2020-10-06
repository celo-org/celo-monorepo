import { GProps, LineProps, PathProps } from 'react-native-svg'
import { unstable_createElement as createElement } from 'react-native-web'

export function Path(props: PathProps) {
  return createElement('path', { ...props, onClick: props.onPress })
}

export function G(props: GProps & { children: React.ReactNode; filter?: string }) {
  return createElement('g', props)
}

export function Line(props: LineProps) {
  return createElement('line', props)
}
