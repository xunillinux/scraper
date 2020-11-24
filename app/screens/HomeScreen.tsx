import React from 'react';

import { Button, StyleSheet, View } from 'react-native';
import { useAuth } from '../context/AuthContext';

interface HomeScreenProps {
    
}
 
function HomeScreen(props: HomeScreenProps) {

    const { signOut } = useAuth();

    function onSignOutPress(){
        signOut();
    }

    return ( 
        <View>
            <Button title="Sign Out" onPress={onSignOutPress} />
        </View>
    );
}

const styles = StyleSheet.create({
    
})


export default HomeScreen;