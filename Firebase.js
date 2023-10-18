
import { initializeApp } from "firebase/app";
import { getFirestore, setDoc, doc } from 'firebase/firestore';
import { getAuth, signOut, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';


const firebaseConfig = {
  apiKey: "AIzaSyBBFG7FPp3zvkwszT8MNeb9gP9egXJ5JUg",
  authDomain: "ryfit-9d400.firebaseapp.com",
  databaseURL: "https://ryfit-9d400-default-rtdb.firebaseio.com",
  projectId: "ryfit-9d400",
  storageBucket: "ryfit-9d400.appspot.com",
  messagingSenderId: "114253978358",
  appId: "1:114253978358:web:699a1723bbfeb574366ad7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const firestore = getFirestore();

const auth = getAuth();

onAuthStateChanged(auth, user => {
  if (user != null) {
    console.log('We are authenticated now!');
  }
  // Do other things

});

export const handleSignUp = (email, password, name) => {
  createUserWithEmailAndPassword(auth, email, password)
    .then(async (userCredential) => {
      userCredential.user.displayName = name
    })
    .catch((error) => {
      const errorCode = error.code;
      const errorMessage = error.message;
    });
};

export const handleSignIn = async (email, password, name) => {
  await signInWithEmailAndPassword(auth, email, password)
    .then(function (result) {
    })
    .catch((error) => {
      console.error(error);
    });

};

export const handleSignout = async () => {
  await signOut(auth)
    .then(() => {
      console.log("Signed Out");
    })
    .catch((error) => {
      console.error(error);
    });
};

const makeDocName = () => {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < 25; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}

export { firestore, auth }