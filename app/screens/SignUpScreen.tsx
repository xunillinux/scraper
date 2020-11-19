import React from 'react';

import { Button, StyleSheet, View } from 'react-native';

import firebase from 'firebase';
import { TextInput } from 'react-native-gesture-handler';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from './NavigationParams';

type SignUpScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'SignUp'>;

type SignUpScreenProps = {
    navigation: SignUpScreenNavigationProp;
}

type SignUpScreenState = {
    email: string;
    password: string;
    passwordConfirm: string;
}

class SignUpScreen extends React.Component<SignUpScreenProps, SignUpScreenState>{

    constructor(props: SignUpScreenProps) {
        super(props);
        this.state = { email: "", password: "", passwordConfirm: "" }
    }

    onSignUpPress = () => {

    }

    onBackToSignInPress = () => {
        this.props.navigation.navigate('SignIn');
    }

    render() {
        return(
            <View style={styles.signUpForm}>
                <TextInput
                    style={styles.emailInput}
                    value={this.state.email}
                    onChangeText={(text) => {this.setState({email: text})}} />
                <TextInput
                    style={styles.passwordInput}
                    value={this.state.password}
                    onChangeText={(text) => {this.setState({password: text})}} />
                <TextInput
                    style={styles.passwordInput}
                    value={this.state.passwordConfirm}
                    onChangeText={(text) => {this.setState({passwordConfirm: text})}} />

                <Button title="Sign Up" onPress={this.onSignUpPress} />
                <Button title="Back to Sign In" onPress={this.onBackToSignInPress} />
            </View>
        )
    }

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
})


export default SignUpScreen;