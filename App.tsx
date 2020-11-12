import React from 'react';
import { StyleSheet, SafeAreaView, Alert, Button, StatusBar, Platform } from 'react-native';

export default function App() {

  return (
    <SafeAreaView style={styles.container}>
      <Button title="Click me"
        onPress={() => Alert.prompt("my title", "my message", text => console.log(text)) } />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
});
