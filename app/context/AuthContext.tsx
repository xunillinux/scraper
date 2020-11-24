import React, { useContext, useEffect, useState } from 'react';
import { auth } from '../config/firebase';

type AuthContextProps = {
    user: firebase.User | null;
    authenticated: boolean;
    loadingAuthState: boolean;
    signUp: (email:string, password:string) => Promise<firebase.auth.UserCredential>;
}

export function useAuth() {
    return useContext(AuthContext);
}

const signUp = (email: string, password: string) => {
    return auth.createUserWithEmailAndPassword(email, password);
}

const AuthContext = React.createContext<AuthContextProps>({user: null, authenticated: false, loadingAuthState: true, signUp: signUp });

export function AuthProvider({ children }: any ){

    const [user, setUser] = useState(null as firebase.User | null);
    const [loadingAuthState, setLoadingAuthState] = useState(true);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged( user => {
            setUser(user);
            setLoadingAuthState(false);
        });

        return unsubscribe;
    },[])

    return (
        <AuthContext.Provider value={{ user: user, authenticated: user !== null, loadingAuthState: loadingAuthState, signUp: signUp }}>
            { !loadingAuthState && children }
        </AuthContext.Provider>
    )

}