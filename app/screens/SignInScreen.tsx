import React, { useState } from 'react';

import { Button, StyleSheet, View } from 'react-native';

import { TextInput } from 'react-native-gesture-handler';

import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from './NavigationParams';
import { useAuth } from '../context/AuthContext';

type SignInScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'SignIn'>;

type SignInScreenProps = {
    navigation: SignInScreenNavigationProp;
}


function  SignInScreen(props: SignInScreenProps) {

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');    

    const { signIn } = useAuth();

    function onSignInPress () {

        if (email === ''){

        }

        signIn(email,password).catch(() => {
            //TODO
        });
    }

    function onSignUpPress() {
        props.navigation.navigate('SignUp');
    }

    return(
        <View style={styles.signInForm}>
            <TextInput
                style={styles.emailInput}
                value={email}
                onChangeText={(text) => {setEmail(text)}} />
            <TextInput
                style={styles.passwordInput}
                secureTextEntry={true}
                value={password}
                onChangeText={(text) => {setPassword(text)}} />

            <Button title="Sign In" onPress={onSignInPress} />
            <Button title="Sign Up" onPress={onSignUpPress} />
        </View>
    )

}

const styles = StyleSheet.create({
    signInForm: {
        alignItems: "center",
    },
    emailInput: {
        width: 200,
        height: 40,
        borderBottomWidth: 2
    },
    passwordInput: {
        width: 200,
        height: 40,
        borderBottomWidth: 2
    },
})


export default SignInScreen;