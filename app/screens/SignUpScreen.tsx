import React, { useContext, useEffect, useState } from 'react';

import { Button, StyleSheet, Text, View } from 'react-native';

import { TextInput } from 'react-native-gesture-handler';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from './NavigationParams';

import { useAuth } from '../context/AuthContext';
import colors from '../config/colors';

type SignUpScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'SignUp'>;

type SignUpScreenProps = {
    navigation: SignUpScreenNavigationProp;
}

export default function SignUpScreen(props: SignUpScreenProps) {

    const [ email, setEmail ] = useState<string>();
    const [ password, setPassword ] = useState<string>();
    const [ passwordConfirm, setPasswordConfirm ] = useState<string>();
    const [ error, setError ] = useState<string>();
    const [ loading, setLoading ] = useState<boolean>();

    const { signUp } = useAuth();

    function onSignUpPress() {
        
        if(password !== passwordConfirm){
            return setError("Passwords don't match!");
        }

        if(!email){
            return setError("Email can't be empty!");
        }

        if(!password){
            return setError("Password can't be empty!");
        }

        setError("");
        setLoading(true);

        signUp(email, password);

    }

    function onBackToSignInPress() {
        props.navigation.navigate('SignIn');
    }

    return(
        <View style={styles.signUpForm}>
            { error && <Text style={styles.errorMessage}>{error}</Text>}
            <TextInput
                style={styles.emailInput}
                value={email}
                onChangeText={(text) => {setEmail(text)}} />
            <TextInput
                style={styles.passwordInput}
                value={password}
                onChangeText={(text) => {setPassword(text)}} />
            <TextInput
                style={styles.passwordInput}
                value={passwordConfirm}
                onChangeText={(text) => {setPasswordConfirm(text)}} />

            <Button disabled={loading} title="Sign Up" onPress={onSignUpPress} />
            <Button title="Back to Sign In" onPress={onBackToSignInPress} />
        </View>
    )

}

const styles = StyleSheet.create({
    signUpForm: {
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
    errorMessage: {
        width: 200,
        height: 40,
        color: colors.error,
    },
})