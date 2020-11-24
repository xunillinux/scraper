import 'react-native-gesture-handler';
import React from 'react';

import AppContainer from './app/AppContainer';
import { AuthProvider, useAuth } from './app/context/AuthContext';

export default function App() {

  return (
    <AuthProvider>
      <AppContainer />
    </AuthProvider>
  );

}