import 'react-native-gesture-handler';
import React from 'react';

import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import SplashScreen from './app/screens/SplashScreen';
import SignInScreen from './app/screens/SignInScreen';
import HomeScreen from './app/screens/HomeScreen';

import firebase from 'firebase';
import {firebaseConfig} from './app/config/config';

firebase.initializeApp(firebaseConfig);

const Stack = createStackNavigator();

export default function App() {

  if (state.isLoading) {
    // We haven't finished checking for the token yet
    return <SplashScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
          isSignedIn ? (
            <Stack.Screen name="Home" component={HomeScreen} />
          ) : (
            <Stack.Screen name="SignIn" component={SignInScreen} />
          )
      </Stack.Navigator>
    </NavigationContainer>
  );

}