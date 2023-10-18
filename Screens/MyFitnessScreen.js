import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View, TextInput, Alert, Modal, ScrollView, TouchableOpacity } from 'react-native';
import { firestore, auth, handleSignout } from '../Firebase';
import { getFirestore, deleteDoc, query, getDoc, where, getDocs, setDoc, doc, collection } from 'firebase/firestore';
import { Dimensions, Platform, PixelRatio } from 'react-native';
import { COLORS } from '../components/colors';

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

export function dateDifference(date2, date1) {
    const _MS_PER_DAY = 1000 * 60 * 60 * 24;

    // Discard the time and time-zone information.
    const utc1 = Date.UTC(date1.getFullYear(), date1.getMonth(), date1.getDate());
    const utc2 = Date.UTC(date2.getFullYear(), date2.getMonth(), date2.getDate());

    return Math.floor((utc2 - utc1) / _MS_PER_DAY);
}



export default function MyFitnessScreen({ navigation }) {
    const user = auth.currentUser.uid;

    const makeDocName = () => {
        var text = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

        for (var i = 0; i < 25; i++)
            text += possible.charAt(Math.floor(Math.random() * possible.length));

        return text;
    }

    const oneRepMax = (weight, reps) => {
        weight = parseFloat(weight)
        reps = parseFloat(reps)
        const oneRM = weight / (1.0278 - 0.0278 * reps);
        const oneRM2 = (weight * reps * .0333) + weight;
        if (weight <= 0) {
            return 0;
        }
        else if (reps <= 0) {
            return 0;
        }
        return Math.round(oneRM2 * 10) / 10;
    }

    const [text, setText] = useState("HELLO")

    const sendData = async() => {
        console.log(nameText+" "+dateText+" "+repText+" "+weightText+" ")
        //see if workout exists in WorkoutHistory and if not adds it
        var workoutExists = false;
        var workoutName;
        const q2 = query(collection(firestore, 'users/' + user + '/WorkoutHistory'));
        const querySnapshot3 = await getDocs(q2);
        querySnapshot3.forEach((doc) => {
            if (doc.data().shownName == nameText) {
                workoutExists = true;
                workoutName = doc.data().name
            }
        });
        const random = makeDocName()
        if (workoutExists) {
            console.log('Exists: workout into workoutHistory')

        }
        else {
            console.log('Pushed workout into workoutHistory')
            await setDoc(doc(firestore, 'users/' + user + '/WorkoutHistory', random), {
                shownName: nameText,
                name: random
            });
            workoutName = random;
        };
        //see if date exists in DateHistory and if not adds it
        var dateExists5 = false;
        var dateName5;
        const q5 = query(collection(firestore, 'users/' + user + '/DateHistory'));
        const querySnapshot5 = await getDocs(q5);
        querySnapshot5.forEach((doc) => {
            if (doc.data().date == dateText) {
                dateExists5 = true;
                dateName5 = doc.data().name
            }
        });
        const random5 = makeDocName()
        if (dateExists5) {
            console.log('Exists: date in DateHistory')
        }
        else {
            console.log('Pushed date into dateHistory')
            await setDoc(doc(firestore, 'users/' + user + '/DateHistory', random5), {
                date: dateText,
                name: random5
            });
            dateName5 = random5;
        };
        //See if workout is in DateHistory/date/Workout
        var workoutExists1 = false;
        var workoutName1;
        const q1 = query(collection(firestore, 'users/' + user + '/DateHistory/' + dateName5 + '/Workouts'));
        const querySnapshot2 = await getDocs(q1);
        querySnapshot2.forEach((doc) => {
            if (doc.data().shownName == nameText) {
                workoutExists1 = true
                workoutName1 = doc.data().name
            }
        });
        if (workoutExists1) {
            console.log('Exists: workout in DateHistory/date/Workouts')
        }
        else {
            console.log('Pushed workout into DateHistory/date/Workouts')
            const random = makeDocName()
            workoutName1=random;
            await setDoc(doc(firestore, 'users/' + user + '/DateHistory/' + dateName5 + '/Workouts', random), {
                name: random,
                shownName: nameText
            });
        }
        //check if date exists in WorkoutHistory/Workout/Dates if not adds
        var dateExists = false;
        var dateName;
        const q4 = query(collection(firestore, 'users/' + user + '/WorkoutHistory/' + workoutName + '/Dates'));
        const querySnapshot4 = await getDocs(q4);
        querySnapshot4.forEach((doc) => {
            if (doc.data().date == dateText) {
                dateExists = true
                dateName = doc.data().name
            }
        })
        if (dateExists) {
            console.log('Exists: date in WorkoutHistory/workout/Dates')
        }
        else {
            console.log('Pushed date into WorkoutHistory/workout/Dates')
            const random3 = makeDocName()
            dateName=random3;
            await setDoc(doc(firestore, 'users/' + user + '/WorkoutHistory/' + workoutName + '/Dates', random3), {
                name: random3,
                date: dateText,
            });
        }
        //Now push 1 set into /WorkoutHistory/workout/Dates/date/Sets
        //and into /DateHistory/date/Workouts/workout/Sets
        const random6 = makeDocName()
        await setDoc(doc(firestore, 'users/' + user + '/WorkoutHistory/' + workoutName + '/Dates/'+dateName+'/Sets', random6), {
            oneRM: oneRepMax(weightText, repText),
            weight: weightText,
            reps: repText
        });
        const random7 = makeDocName()
        await setDoc(doc(firestore, 'users/' + user + '/DateHistory/' + dateName5 + '/Workouts/'+workoutName1+'/Sets', random7), {
            oneRM: oneRepMax(weightText, repText),
            weight: weightText,
            reps: repText
        });
    }

    const [repText, setRepText] = useState('')
    const [weightText, setWeightText] = useState('')
    const [dateText, setDateText] = useState('')
    const [nameText, setNameText] = useState('')


    return (
        <View style={styles.container}>
            <TouchableOpacity style={styles.graphButton} onPress={() => sendData()}>
                <Text style={styles.text}>
                    SEND DATA
                </Text>
            </TouchableOpacity>
            <TextInput value={nameText} color={COLORS.tertiary} onChangeText={(text)=>setNameText(text)} placeholder='Workout Name' placeholderTextColor={COLORS.secondaryText} style={styles.textInput} >
            </TextInput>
            <TextInput value={dateText} color={COLORS.tertiary} onChangeText={(text)=>setDateText(text)} placeholder='Workout Date' placeholderTextColor={COLORS.secondaryText} style={styles.textInput}>
            </TextInput>
            <View flexDirection='row' top={100} >
                <TextInput value={repText} color={COLORS.tertiary} onChangeText={(text)=>setRepText(text)} placeholder='Reps' placeholderTextColor={COLORS.secondaryText} style={styles.textInput}>
                </TextInput>
                <TextInput value={weightText} color={COLORS.tertiary} onChangeText={(text)=>setWeightText(text)} placeholder='Weight' placeholderTextColor={COLORS.secondaryText} style={styles.textInput}>
                </TextInput>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
        alignItems: 'center'
    },
    graphButton: {
        top: 50,
        width: 300,
        height: 200,
        backgroundColor: COLORS.tertiary,
        alignItems: 'center'
    },
    text: {
        top: normalizeHeight(50),
        position: 'absolute',
        fontFamily: "Times New Roman",
        color: COLORS.black,
        fontSize: normalize(30),
        alignSelf: 'center',
    },
    textInput: {
        top: 100,
        marginBottom: 10,
        width: 200,
        borderRadius: 15,
        height: 100,
        backgroundColor: COLORS.itemBackground,
        alignItems: 'center',
        textAlign: 'center'
    }
})