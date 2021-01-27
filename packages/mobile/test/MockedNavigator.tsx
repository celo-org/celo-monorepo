import { NavigationContainer } from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack'
import React from 'react'
import { SafeAreaProvider } from 'react-native-safe-area-context'

const Stack = createStackNavigator()
const MockedNavigator = ({
  component,
  params = {},
}: {
  component: React.ComponentType
  params?: object
}) => {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName={'MockedScreen'}>
          <Stack.Screen name="MockedScreen" component={component} initialParams={params} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  )
}

export default MockedNavigator
