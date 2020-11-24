import React from 'react';

import { Button, StyleSheet, View } from 'react-native';

import { TextInput } from 'react-native-gesture-handler';

import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from './NavigationParams';

type SignInScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'SignIn'>;

type SignInScreenProps = {
    navigation: SignInScreenNavigationProp;
}

type SignInScreenState = {
    email: string;
    password: string;
}
class SignInScreen extends React.Component<SignInScreenProps, SignInScreenState>{

    constructor(props: SignInScreenProps) {
        super(props);
        this.state = { email: "", password: "" }
    }

    onSignInPress = () => {

    }

    onSignUpPress = () => {
        this.props.navigation.navigate('SignUp');
    }

    render() {
        return(
            <View style={styles.signInForm}>
                <TextInput
                    style={styles.emailInput}
                    value={this.state.email}
                    onChangeText={(text) => {this.setState({email: text})}} />
                <TextInput
                    style={styles.passwordInput}
                    value={this.state.password}
                    onChangeText={(text) => {this.setState({password: text})}} />

                <Button title="Sign In" onPress={this.onSignInPress} />
                <Button title="Sign Up" onPress={this.onSignUpPress} />
            </View>
        )
    }

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