import { DrawerItem as NavigationDrawerItem } from '@react-navigation/drawer'
import * as React from 'react'
import { ExtractProps } from 'src/utils/typescript'

type Props = ExtractProps<typeof NavigationDrawerItem> & {
  testID?: string
}

export default function DrawerItem(props: Props) {
  return <NavigationDrawerItem {...props} />
}
