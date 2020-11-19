import 'react-native-gesture-handler';
import React, { useState } from 'react';

import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import SplashScreen from './app/screens/SplashScreen';
import SignInScreen from './app/screens/SignInScreen';
import SignUpScreen from './app/screens/SignUpScreen';
import HomeScreen from './app/screens/HomeScreen';

import firebase from 'firebase';
import {firebaseConfig} from './app/config/config';
import { AuthStackParamList, HomeStackParamList } from './app/screens/NavigationParams';

if (!firebase.apps.length){
  firebase.initializeApp(firebaseConfig);
}

const AuthStack = createStackNavigator<AuthStackParamList>();
const HomeStack = createStackNavigator<HomeStackParamList>();

export default function App() {

  const [isSignedIn, setIsSignedIn] = useState<boolean>();

  if(firebase.auth().onAuthStateChanged(function(user){
    if(user){
       setIsSignedIn(true);
    }
  }))

  /*
  if (state.isLoading) {
    // We haven't finished checking for the token yet
    return <SplashScreen />;
  }*/
  
  return (
    <NavigationContainer>

      {!isSignedIn ? (
        <AuthStack.Navigator>
          <AuthStack.Screen name="SignIn" component={SignInScreen} />
          <AuthStack.Screen name="SignUp" component={SignUpScreen} />
        </AuthStack.Navigator>
      ) : (
        <HomeStack.Navigator>
          <HomeStack.Screen name="Home" component={HomeScreen} />
        </HomeStack.Navigator>
      )}
      
    </NavigationContainer>
  );

}