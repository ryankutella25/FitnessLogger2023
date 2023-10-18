import React, { useState, useEffect } from 'react';
import { StyleSheet, LogBox, Text, StatusBar, Dimensions, View, TouchableOpacity } from 'react-native';
import { firestore, auth } from './Firebase';
import { HomeScreen } from './Screens/HomeScreen';
import SetScreen from './Screens/SetScreen';
import { SignUp } from './Screens/SignUp';
import { SignIn } from "./Screens/SignIn";
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { getAuth, signOut, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithCredential, currentUser } from 'firebase/auth';
import WorkoutScreen from './Screens/WorkoutScreen';
import Graph from './Screens/Graph';
import History from './Screens/History';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { COLORS } from './components/colors';
import { ToDo } from './Screens/ToDo';
import Settings from './Screens/Settings'

const Stack = createStackNavigator();
const Stack2 = createStackNavigator();
const Tab = createBottomTabNavigator();
 
const {
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
} = Dimensions.get('window');

// based on iphone 5s's scale
const scale = SCREEN_WIDTH / 390;
const heightScale = SCREEN_HEIGHT / 844;


export function normalize(size) {
  const newSize = size * scale
  const newSize2 = size * heightScale
  if (newSize < newSize2) {
      if (Platform.OS === 'ios') {
          return Math.round(PixelRatio.roundToNearestPixel(newSize))
      } else {
          return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 2
      }
  }
  else {
      if (Platform.OS === 'ios') {
          return Math.round(PixelRatio.roundToNearestPixel(newSize2))
      } else {
          return Math.round(PixelRatio.roundToNearestPixel(newSize2)) - 2
      }
  }

}
export function normalizeHeight(size) {
  const newSize = size * heightScale
  return newSize
}
export function normalizeWidth(size) {
  const newSize = size * scale
  return newSize
}

export default function App() {
  LogBox.ignoreLogs([
    "[react-native-gesture-handler] Seems like you\'re using an old API with gesture components, check out new Gestures system!",
    'AsyncStorage has been extracted from react-native core and will be removed in a future release',
    'Non-serializable values were found in the navigation state',
  ]);
  LogBox.ignoreLogs(['AsyncStorage: ...']);


  // const test = async () => {
  //   await setDoc(doc(firestore, "characters", "ddaisyy"), {
  //     employment: "plumber",
  //     outfitColor: "red",
  //     specialAttack: "fireball"
  //   });
  //   console.log('Pushed Character')
  // }
  // const getCollection = async () => {
  //   const q = query(collection(firestore, "characters"));
  //   const querySnapshot = await getDocs(q);
  //   querySnapshot.forEach((doc) => {
  //     // doc.data() is never undefined for query doc snapshots
  //     console.log(doc.id, " => ", doc.data());
  //   });
  // }
  // const getOneDoc = async () => {
  //   const docRef = doc(firestore, "characters", "ddaisyy");
  //   const docSnap = await getDoc(docRef);
  //   if (docSnap.exists()) {
  //     console.log("Document data:", docSnap.data());
  //   } else {
  //     // doc.data() will be undefined in this case
  //     console.log("No such document!");
  //   }
  // }

  onAuthStateChanged(auth, (user) => {
    setUser(user);
  });
  


//   useEffect(() =>{
//     const unlisten = firebase.auth.onAuthStateChanged(
//        user => {
//         user
//            ? setUser(user)
//            : setUser(null);
//        },
//     );
//     return () => {
//         unlisten();
//     }
//  }, []);

//   useEffect(() => {
//     firebaseObserver.subscribe('authStateChanged', data => {
//         setAuthenticated(data);
//         setIsLoading(false);
//     });
//     return () => { firebaseObserver.unsubscribe('authStateChanged'); }
// }, []);

  const forFade = ({ current, closing }) => ({
    cardStyle: {
      opacity: current.progress,
    },
  });

  const [user, setUser] = React.useState(auth.currentUser);

  return (
    <View style={styles.container}>{
      user ? <NavigationContainer>
        <StatusBar barStyle='light-content' />
        <Stack.Navigator
          screenOptions={{
            /*presentation: 'modal',*/
            headerShown: false
          }}>
          <Stack.Group>
            <Stack.Screen name='Tab' component={HomeTabs} options={{ cardStyleInterpolator: forFade }} />
            <Stack.Screen name='Settings' component={Settings} options={{ cardStyleInterpolator: forFade }} />
            <Stack.Screen name='Workout' component={WorkoutScreen} options={{ cardStyleInterpolator: forFade }} />
          </Stack.Group>
          <Stack.Group>
            <Stack.Screen name='OneSet' component={SetScreen} options={{ cardStyleInterpolator: forFade }} />
            <Stack.Screen name='Graph' component={Graph} options={{ cardStyleInterpolator: forFade }} />
          </Stack.Group>
        </Stack.Navigator>
      </NavigationContainer>
        :
        <NavigationContainer>
          <Stack.Navigator
            screenOptions={{
              headerShown: false
            }}>
            <Stack.Screen name='SignIn' component={SignIn} />
            <Stack.Screen name='SignUp' component={SignUp} />
          </Stack.Navigator>
        </NavigationContainer>
    }</View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  tabBarContainer: {
    height: normalizeHeight(60),
    paddingBottom: normalizeHeight(5),
    borderTopWidth: 0,
    borderWidth: 0,
    bottom: normalizeHeight(30),
    borderRadius: 15,
    width: '90%',
    alignSelf: 'center',
    backgroundColor: COLORS.itemBackground,
  },
  test: {
    height: normalizeHeight(300),
    marginTop: normalizeHeight(200),
    alignSelf: 'center'
  },
  historyContainer: {
    height: '95%'
  }
});


export function HomeTabs() {
  const forFade = ({ current, closing }) => ({
    cardStyle: {
      opacity: current.progress,
    },
  });

  return (
    <View style={styles.container}>
      <Tab.Navigator
        initialRouteName='Home'
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;
            if (route.name === 'Home') {
              iconName = 'home-outline';
            } else if (route.name === 'Graphs') {
              iconName = "analytics-outline"
            } else if (route.name === 'To-Do') {
              iconName = "list-outline";
            }
            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: COLORS.tertiary,
          tabBarInactiveTintColor: COLORS.secondaryText,
          headerShown: false,
          tabBarStyle: styles.tabBarContainer,
        })}
      >
        {/*<Tab.Screen name="Fake Data" component={myFitnessScreen} />*/}
        <Tab.Screen name="To-Do" component={ToDo} />
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Graphs" component={HistoryStack} />
      </Tab.Navigator>
    </View>

  )
}

export function HistoryStack() {
  const forFade = ({ current }) => ({
    cardStyle: {
      opacity: current.progress,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.historyContainer}>
        <Stack2.Navigator
          initialRouteName='History'
          screenOptions={{
            /*presentation: 'modal',*/
            headerShown: false
          }}>
          <Stack2.Screen name='History' component={History} options={{ cardStyleInterpolator: forFade }} />
          <Stack2.Screen name='Graph' component={Graph} options={{ cardStyleInterpolator: forFade }} />
        </Stack2.Navigator>
      </View>
    </View>
  )
}
