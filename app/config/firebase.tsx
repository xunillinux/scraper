import firebase from 'firebase/app'
import "firebase/auth"

// prod env not set up yet
const prodConfig = {
    apiKey: "AIzaSyBPRKxfn9jC3R04IYFfKBdLiJj6Qoe4PZ4",
    authDomain: "scraper-d1c1e.firebaseapp.com",
    databaseURL: "https://scraper-d1c1e.firebaseio.com",
    projectId: "scraper-d1c1e",
    storageBucket: "scraper-d1c1e.appspot.com",
    messagingSenderId: "595614922147",
    appId: "1:595614922147:web:2fae1c57fa514e8e2f1616",
    measurementId: "G-GHN5LGB631"
};

const devConfig = {
    apiKey: "AIzaSyBPRKxfn9jC3R04IYFfKBdLiJj6Qoe4PZ4",
    authDomain: "scraper-d1c1e.firebaseapp.com",
    databaseURL: "https://scraper-d1c1e.firebaseio.com",
    projectId: "scraper-d1c1e",
    storageBucket: "scraper-d1c1e.appspot.com",
    messagingSenderId: "595614922147",
    appId: "1:595614922147:web:2fae1c57fa514e8e2f1616",
    measurementId: "G-GHN5LGB631"
};

const fireBaseConfig = process.env.NODE_ENV === 'production' ? prodConfig : devConfig;

if(!firebase.apps.length) {
    firebase.initializeApp(fireBaseConfig);
}

export const auth = firebase.auth();
export default firebase;