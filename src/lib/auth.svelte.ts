import { auth } from './firebase';
import { onAuthStateChanged, signOut as firebaseSignOut, type User } from 'firebase/auth';

let _user = $state<User | null>(null);
let _loading = $state(true);

onAuthStateChanged(auth, (u) => {
	_user = u;
	_loading = false;
});

export const authStore = {
	get user() {
		return _user;
	},
	get loading() {
		return _loading;
	},
	signOut: () => firebaseSignOut(auth)
};
