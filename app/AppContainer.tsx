import 'react-native-gesture-handler';
import React from 'react';

import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import SplashScreen from './screens/SplashScreen';
import SignInScreen from './screens/SignInScreen';
import SignUpScreen from './screens/SignUpScreen';
import HomeScreen from './screens/HomeScreen';

import { AuthStackParamList, HomeStackParamList } from './screens/NavigationParams';
import { useAuth } from './context/AuthContext';

const AuthStack = createStackNavigator<AuthStackParamList>();
const HomeStack = createStackNavigator<HomeStackParamList>();

export default function App() {

  const { authenticated, user } = useAuth();

  return (
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
  );

}