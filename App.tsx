import 'react-native-gesture-handler';
import React from 'react';

import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import SplashScreen from './app/screens/SplashScreen';
import SignInScreen from './app/screens/SignInScreen';
import SignUpScreen from './app/screens/SignUpScreen';
import HomeScreen from './app/screens/HomeScreen';

import { AuthStackParamList, HomeStackParamList } from './app/screens/NavigationParams';
import { AuthProvider, useAuth } from './app/context/AuthContext';

const AuthStack = createStackNavigator<AuthStackParamList>();
const HomeStack = createStackNavigator<HomeStackParamList>();

export default function App() {

  const { authenticated } = useAuth();

  return (
    <AuthProvider>
      <NavigationContainer>

        {!authenticated ? (
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
    </AuthProvider>
  );

}