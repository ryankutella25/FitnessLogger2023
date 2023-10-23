import React, { Component, useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, TextInput, FlatList, Picker, ScrollView, TouchableHighlight } from 'react-native';
import { firestore } from '../Firebase';
import { getFirestore, query, getDoc, deleteDoc, getDocs, setDoc, doc, collection } from 'firebase/firestore';
import { Dimensions, Platform, PixelRatio, InteractionManager, ActivityIndicator } from 'react-native';
import { COLORS } from '../components/colors';
import Ionicons from 'react-native-vector-icons/Ionicons';

const {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
} = Dimensions.get('window');

// based on iphone 13's scale
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

export default function SetScreen({ route, navigation }) {

    const { user, item, currentPlan, currentDay, randomDate } = route.params;
    const [workoutHistoryStuff, setWorkoutHistoryStuff] = useState()
    const [DateHistoryWorkout, setDateHistoryWorkout] = useState()
    const [WorkoutHistoryDate, setWorkoutHistoryDate] = useState()

    const plan = currentPlan;
    const day = currentDay;
    const pathway = 'users/' + user + '/Program/' + plan.name + '/Days/' + day.name + '/Workouts/' + item.name + '/Sets'
    const [setRay, setSetRay] = useState([]);
    const [setCompleted, setSetCompleted] = useState(0);
    const [workingSetValues, setWorkingSetValues] = useState({ weight: '10', reps: '10' });
    const scrollViewRef = useRef();
    const [volume, setVolume] = useState(0);

    const backBtn = () => {
        route.params.onGoBack(item, setCompleted, volume, setRay.length)
        navigation.goBack()
    }

    const goToGraph = () => {
        const workout = workoutHistoryStuff;
        const h = 100;
        navigation.navigate('Graph', { workout, h })
    }

    const [isReady, setIsReady] = useState(false)
    const [counter1, setCounter1] = useState()
    var count;
    const [timer, setTimer] = useState(60);
    function startTimer(duration) {
        count=duration;
        setCounter1(setInterval(timer, 1000));
        function timer(){
          count=count-1;
          setTimer(count)
          if (count <= 0){
            clearInterval(counter1);
            return;  }
        }
    }

    const endTimer = () => {
        console.log(counter1)
        setTimer(60)
        clearInterval(counter1)
        setTimerActive(false)
    }

    useEffect(() => {
        async function doStuff(){
            setSetCompleted(item.sc)
            setSetRay([]);
            const q = query(collection(firestore, pathway));
            const querySnapshot = await getDocs(q);
            var tempRay = []
            querySnapshot.forEach((doc) => {
                // doc.data() is never undefined for query doc snapshots
                tempRay.push({ reps: doc.data().reps, weight: doc.data().weight, timer: doc.data().timer, id: doc.data().id })
            });
            tempRay.sort(function (a, b) {
                return a.id - b.id
            });
            tempRay.forEach(element => {
                onLoadSetRay(element.reps, element.weight, element.timer, element.id)
            });
            InteractionManager.runAfterInteractions(() => {
                setIsReady(true)
            })
            onLoadCheckHistory()
            setWorkingSetValues({ weight: tempRay[item.sc].weight.toString(), reps: tempRay[item.sc].reps.toString() })
        }
        doStuff();
    }, [])

    useEffect(() => {
        async function doStuff(){
            if (isReady) {
                scrollViewRef.current.scrollTo({ y: (normalizeHeight(35) * (setCompleted - 1)) })
            }
        }
        doStuff();
    }, [isReady])

    const onLoadCheckHistory = async () => {
        //CHECK IF '.../WorkoutHistory/workout.name exists and if it does sets it to workoutHistory
        //if doesnt exist it makes it and sets it to workoutHistory
        var workoutExists = false;
        var workoutName;
        const q2 = query(collection(firestore, 'users/' + user + '/WorkoutHistory'));
        const querySnapshot3 = await getDocs(q2);
        querySnapshot3.forEach((doc) => {
            if (doc.data().shownName == item.shownName) {
                workoutExists = true;
                workoutName = doc.data().name
            }
        });
        const random = makeDocName()
        if (workoutExists) {
            setWorkoutHistoryStuff({ shownName: item.shownName, name: workoutName })
        }
        else {
            await setDoc(doc(firestore, 'users/' + user + '/WorkoutHistory', random), {
                shownName: item.shownName,
                name: random
            });
            workoutName = random;
            setWorkoutHistoryStuff({ name: random, shownName: item.shownName })
        };
        //CHECK IF '.../DateHistory/date/Workouts/workout.name exists and if it does sets it to DateHistoryWorkout
        //if doesnt exist it makes it and sets it to DateHistoryWorkout
        var workoutExists1 = false;
        var workoutName1;
        const q1 = query(collection(firestore, 'users/' + user + '/DateHistory/' + randomDate.name + '/Workouts'));
        const querySnapshot2 = await getDocs(q1);
        querySnapshot2.forEach((doc) => {
            if (doc.data().shownName == item.shownName) {
                workoutExists1 = true
                workoutName1 = doc.data().name
            }
        });
        if (workoutExists1) {
            setDateHistoryWorkout({ name: workoutName1, shownName: item.shownName })
        }
        else {
            const random = makeDocName()
            await setDoc(doc(firestore, 'users/' + user + '/DateHistory/' + randomDate.name + '/Workouts', random), {
                name: random,
                shownName: item.shownName
            });
            setDateHistoryWorkout({ name: random, shownName: item.shownName })
        }
        //Check if date exist in .../WorkoutHistory/workout/Dates/ and if it does set it to WorkoutHistoryDate
        //and if it doesnt make it and then set it to WorkoutHistoryDates
        var dateExists = false;
        var dateName;
        const q5 = query(collection(firestore, 'users/' + user + '/WorkoutHistory/' + workoutName + '/Dates'));
        const querySnapshot5 = await getDocs(q5);
        querySnapshot5.forEach((doc) => {
            if (doc.data().date == randomDate.date) {
                dateExists = true
                dateName = doc.data().name
            }
        })
        if (dateExists) {
            setWorkoutHistoryDate({ name: dateName })
        }
        else {
            const random3 = makeDocName()
            await setDoc(doc(firestore, 'users/' + user + '/WorkoutHistory/' + workoutName + '/Dates', random3), {
                name: random3,
                date: randomDate.date,
            });
            setWorkoutHistoryDate({ name: random3 })
        }
    }

    //NEED TO FIX ALL BELOW
    const onLoadSetRay = (reps, weight, timer, id) => {
        setSetRay(setRay => [...setRay, { id: id, weight: weight, reps: reps, oneRM: oneRepMax(weight, reps), timer: timer }])
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

    const addSet = async () => {
        setSetRay(setRay => [...setRay, { id: setRay.length, weight: 10, reps: 10, timer: 60, oneRM: oneRepMax(10, 10) }])
        await setDoc(doc(firestore, pathway, 'Set' + setRay.length), {
            reps: 10,
            weight: 10,
            timer: 60,
            id: setRay.length
        });
        if (setCompleted == setRay.length) {
            setWorkingSetValues({ weight: String(10), reps: String(10) })
        }
        scrollViewRef.current.scrollToEnd()
    }


    const deleteSet = async () => {
        if (setRay.length == 0) {
            return
        }
        else if ((setCompleted - 1 == setRay.length - 1)) {
            setSetCompleted(setCompleted - 1)

        }
        const lastSetID = setRay.pop().id
        await deleteDoc(doc(firestore, pathway, 'Set' + lastSetID));
        setSetRay(setRay.filter(item => item.id !== lastSetID))
        if (setCompleted == setRay.length) {
            setWorkingSetValues({ weight: String('DO'), reps: String('NE') })
        }
    }

    const [timerActive, setTimerActive] = useState(false)
    //Complete set is called when btn is pressed and will change database to show new data
    const completeSet = async () => {
        startTimer(60)
        setTimerActive(true)
        if (setCompleted >= setRay.length) {
            console.log('cant raise sc')
            return
        }
        if (setCompleted < setRay.length - 1) {
            scrollViewRef.current.scrollTo({ y: (normalizeHeight(35) * (setCompleted)) })
        }
        if (setCompleted + 2 <= setRay.length) {
            setWorkingSetValues({ weight: String(setRay[setCompleted + 1].weight), reps: String(setRay[setCompleted + 1].reps) })
        }
        else {
            setWorkingSetValues({ weight: String('DO'), reps: String('NE') })
        }
        await setDoc(doc(firestore, pathway, 'Set' + (setCompleted)), {
            reps: parseInt(setRay[setCompleted].reps),
            weight: parseInt(setRay[setCompleted].weight),
            id: setRay[setCompleted].id,
            timer: setRay[setCompleted].timer
        });
        completeSetHistory()
        console.log('Pushed Complete Set')
        setSetCompleted(setCompleted + 1)
    }

    //called from complete set, does history pathes
    const completeSetHistory = async () => {
        setVolume(parseInt(volume) + parseInt(setRay[setCompleted].weight))
        const random = makeDocName()
        await setDoc(doc(firestore, 'users/' + user + '/DateHistory/' + randomDate.name + '/Workouts/' + DateHistoryWorkout.name + '/Sets', random), {
            reps: parseInt(setRay[setCompleted].reps),
            weight: parseInt(setRay[setCompleted].weight),
            oneRM: parseInt(oneRepMax(setRay[setCompleted].weight, setRay[setCompleted].reps))
        });
        const random2 = makeDocName()
        await setDoc(doc(firestore, 'users/' + user + '/WorkoutHistory/' + workoutHistoryStuff.name + '/Dates/' + WorkoutHistoryDate.name + '/Sets', random2), {
            reps: parseInt(setRay[setCompleted].reps),
            weight: parseInt(setRay[setCompleted].weight),
            oneRM: parseInt(oneRepMax(setRay[setCompleted].weight, setRay[setCompleted].reps))
        });
        // await setDoc(doc(firestore, 'users/' + user + '/DateHistory/'+random+'/Workout/'+item.shownName+'/Sets', random), {
        //     reps: parseInt(setRay[setCompleted].reps),
        //     weight: parseInt(setRay[setCompleted].weight),
        //     oneRM: parseInt(setRay[setCompleted].oneRM)
        // });
    }

    const makeDocName = () => {
        var text = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

        for (var i = 0; i < 25; i++)
            text += possible.charAt(Math.floor(Math.random() * possible.length));

        return text;
    }

    const changeCurrentWeight = (text1) => {
        const text = text1.replace(/[^0-9]/g, '').substring(0, 3)
        setWorkingSetValues({ weight: text, reps: workingSetValues.reps })
        const tempSet = setRay;
        tempSet[setCompleted].weight = text;
        setSetRay(tempSet)
    }

    const changeCurrentReps = (text1) => {
        const text = text1.replace(/[^0-9]/g, '').substring(0, 3)
        setWorkingSetValues({ reps: text, weight: workingSetValues.weight })
        const tempSet = setRay;
        tempSet[setCompleted].reps = text;
        setSetRay(tempSet)
    }

    if (!isReady) {
        return (
            <View flex={1} backgroundColor="#0C0C1C" justifyContent='center'>
                <ActivityIndicator />
            </View>
        )
    }

    return (
        <View style={styles.container}>
            <View
                style={styles.backgroundImage}
            >
                <Text allowFontScaling={false} style={styles.Title}>{item.shownName}</Text>
                <TouchableOpacity style={styles.Back} onPress={() => backBtn()}>
                    <Ionicons name="arrow-back-circle-outline" size={normalize(40)} color={COLORS.tertiary} />
                </TouchableOpacity>
                <View style={styles.imageHolder}>
                    {/* <Image style={styles.image} resizeMode='stretch' source={require('../components/benchCartoon.png')} /> */}
                </View>
                <Text allowFontScaling={false} style={styles.Set}> Sets </Text>
                <View
                    style={styles.setHolder}
                >
                    <View style={styles.subtitles}>
                        <View style={styles.topRow}>
                            <Text allowFontScaling={false} style={styles.setNumTitle}>#</Text>
                            <Text allowFontScaling={false} style={styles.RWOTitles}>Weight</Text>
                            <Text allowFontScaling={false} style={styles.RWOTitles}>Reps</Text>
                            <Text allowFontScaling={false} style={styles.RWOTitles}>1RM</Text>
                        </View>
                        <Ionicons name="stopwatch-outline" style={styles.timer} size={normalizeWidth(24)} color={COLORS.primary} />
                    </View>

                    <View style={styles.holdScrollview}>
                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            style={styles.scrollview}
                            ref={scrollViewRef}
                        >
                            {
                                setRay.map((item) => {
                                    return (
                                        <View key={item.id} style={styles.setContainer}>
                                            {item.id == setCompleted ?
                                                <View style={styles.holdEachSetCurrent}>
                                                    <Ionicons name="arrow-forward-outline" style={styles.icon} size={normalize(20)} color={COLORS.tertiary} />
                                                    <Text allowFontScaling={false} style={styles.setNumCurrent1}>
                                                        {item.id + 1}
                                                    </Text>

                                                    <Text allowFontScaling={false} style={styles.RWOcurrent1}>
                                                        {item.weight}
                                                    </Text>

                                                    <Text allowFontScaling={false} style={styles.RWOcurrent1}>
                                                        {item.reps}
                                                    </Text>

                                                    <Text allowFontScaling={false} style={styles.RWOcurrent1}>
                                                        {oneRepMax(item.weight, item.reps)}
                                                    </Text>

                                                </View>
                                                :
                                                <View style={styles.holdEachSet}>
                                                    {item.id <= setCompleted ?
                                                        <View flex={1} flexDirection='row'>
                                                            <Ionicons name="checkmark-outline" style={styles.icon} size={normalize(20)} color={COLORS.primary} />
                                                            <Text allowFontScaling={false} style={styles.setNumCurrent}>
                                                                {item.id + 1}
                                                            </Text>

                                                            <Text allowFontScaling={false} style={styles.RWOcurrent}>
                                                                {item.weight}
                                                            </Text>

                                                            <Text allowFontScaling={false} style={styles.RWOcurrent}>
                                                                {item.reps}
                                                            </Text>

                                                            <Text allowFontScaling={false} style={styles.RWOcurrent}>
                                                                {oneRepMax(item.weight, item.reps)}
                                                            </Text>
                                                        </View>
                                                        :
                                                        <View flex={1} flexDirection='row'>
                                                            <Text allowFontScaling={false} style={styles.setNum}>
                                                                {item.id + 1}
                                                            </Text>

                                                            <Text allowFontScaling={false} style={styles.RWO}>
                                                                {item.weight}
                                                            </Text>

                                                            <Text allowFontScaling={false} style={styles.RWO}>
                                                                {item.reps}
                                                            </Text>

                                                            <Text allowFontScaling={false} style={styles.RWO}>
                                                                {oneRepMax(item.weight, item.reps)}
                                                            </Text>
                                                        </View>
                                                    }
                                                </View>
                                            }
                                            <View style={styles.holdEachTimer}>
                                                <Text allowFontScaling={false} style={styles.setTimer}>
                                                    {item.timer}
                                                </Text>
                                            </View>
                                        </View>

                                    )
                                })
                            }
                        </ScrollView>
                    </View>
                    <View style={styles.adddeleteholder}>
                        <TouchableOpacity onPress={() => addSet()} style={styles.basicButton}>
                            <Text allowFontScaling={false} style={styles.addSet} > ADD SET</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => deleteSet()} style={styles.basicButton}>
                            <Text allowFontScaling={false} style={styles.deleteSet} > DELETE</Text>
                        </TouchableOpacity>
                    </View>
                </View>
                <View
                    {...setCompleted == setRay.length ? { borderColor: '#f00' } : { borderColor: '#1da' }}
                    style={styles.workingSet}
                >
                    <View style={styles.workingWeightRep}>
                        <Text allowFontScaling={false} style={styles.WRText}>Weight</Text>
                        <Text allowFontScaling={false} style={styles.WRText}></Text>
                        <Text allowFontScaling={false} style={styles.WRText}>Reps</Text>
                    </View>
                    <View style={styles.workingRW}>
                        <TextInput allowFontScaling={false} keyboardType='numeric' editable={setCompleted != setRay.length && setRay.length != 0} {...setCompleted == setRay.length ? { color: '#f00' } : { color: '#1da' }} placeholder={workingSetValues.weight} placeholderTextColor="rgba(154,154,154,1)" style={styles.RWText} value={workingSetValues.weight} onChangeText={text => changeCurrentWeight(text)} />
                        <TextInput allowFontScaling={false} keyboardType='numeric' editable={setCompleted != setRay.length && setRay.length != 0} {...setCompleted == setRay.length ? { color: '#f00' } : { color: '#1da' }} placeholder={workingSetValues.reps} placeholderTextColor="rgba(154,154,154,1)" style={styles.RWText} value={workingSetValues.reps} onChangeText={text => changeCurrentReps(text)} />
                    </View>
                    <View style={styles.underlineHolder}>
                        <View style={styles.underline} />
                        <View style={styles.underline} />
                    </View>
                    {timerActive ?
                        <TouchableOpacity
                            onPress={() => completeSet()}
                            style={styles.roundButton}
                            disabled={true}
                        >
                            <Text allowFontScaling={false} style={styles.completeText}>
                                {timer}
                            </Text>
                            <TouchableOpacity style={styles.endTimer} onPress={() => endTimer()}>
                                <Text allowFontScaling={false} style={styles.completeText1}>
                                    X
                                </Text>
                            </TouchableOpacity>
                        </TouchableOpacity>
                        :
                        setCompleted != setRay.length && setRay.length != 0 ?
                            <TouchableOpacity
                                onPress={() => completeSet()}
                                style={styles.roundButton}
                                disabled={setCompleted == setRay.length || setRay.length == 0}
                            >
                                <Text allowFontScaling={false} style={styles.completeText}>
                                    Log
                                </Text>
                                <Text allowFontScaling={false} style={styles.setText}>
                                    Set
                                </Text>
                            </TouchableOpacity>
                            :
                            <TouchableOpacity
                                onPress={() => completeSet()}
                                style={styles.roundButtonRed}
                                disabled={setCompleted == setRay.length || setRay.length == 0}
                            >
                                <Text allowFontScaling={false} style={styles.completeTextRed}>
                                    Add
                                </Text>
                                <Text allowFontScaling={false} style={styles.setTextRed}>
                                    Sets
                                </Text>
                            </TouchableOpacity>
                    }

                </View>
                <TouchableOpacity
                    style={styles.graphsHolder}
                    onPress={() => goToGraph()}
                >
                    <Text allowFontScaling={false} style={styles.Graph}>
                        Go To Graph
                    </Text>
                </TouchableOpacity>
            </View>
        </View>

    )
}
export { SetScreen }

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    backgroundImage: {
        width: '100%',
        height: '100%',
        backgroundColor: COLORS.background,
    },
    endTimer: {
        alignSelf: 'center',
        top: normalizeHeight(20),
        height: normalizeHeight(50),
        borderRadius: 10,
        borderWidth: 1,
        width: normalizeWidth(50),
    },
    icon: {
        position: 'absolute',
        left: normalizeWidth(6),
        top: normalizeHeight(4),
    },
    subtitles: {
        position: 'relative',
        flexDirection: 'row',
        width: '95%',
        alignSelf: 'center'
    },
    Title: {
        top: normalizeHeight(50),
        position: 'absolute',
        fontFamily: "Times New Roman",
        color: COLORS.primary,
        fontSize: normalize(30),
        alignSelf: 'center',
    },
    Back: {
        top: normalizeHeight(48),
        height: normalize(40),
        width: normalize(40),
        alignSelf: 'center',
        position: 'absolute',
        fontFamily: "Times New Roman",
        color: COLORS.primary,
        fontSize: normalize(20),
        left: normalizeWidth(10),
    },
    imageHolder: {
        top: normalizeHeight(95),
        alignSelf: 'center',
        width: normalize(300),
        height: normalize(170),
        backgroundColor: COLORS.itemBackground,
        borderRadius: 15,
        borderWidth: 1,
        shadowColor: '#171717',
        shadowOffset: { width: -2, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 3,
    },
    image: {
        flex: 1,
        width: null,
        height: null,
        borderRadius: 15,
    },
    Set: {
        position: 'relative',
        top: normalizeHeight(105),
        fontFamily: "Times New Roman",
        color: COLORS.primary,
        fontSize: normalize(30),
        alignSelf: 'center',
    },
    Graph: {
        fontFamily: "Times New Roman",
        color: COLORS.primary,
        height: '100%',
        fontSize: normalize(30),
        top: normalizeHeight(9),
        alignSelf: 'center',
        textAlign: 'center',
    },
    setHolder: {
        alignSelf: 'center',
        top: normalizeHeight(105),
        height: normalizeHeight(240),
        width: '95%',
        backgroundColor: COLORS.itemBackground,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: COLORS.primaryBorder,
    },
    setContainer: {
        alignSelf: 'center',
        height: normalizeHeight(35),
        width: '100%',
        flexDirection: 'row',
    },
    holdScrollview: {
        position: 'relative',
        alignSelf: 'center',
        marginTop: normalizeHeight(5),
        height: normalizeHeight(150),
        width: '100%',

    },
    scrollview: {
        height: '100%',
        width: '95%',
        alignSelf: 'center'
    },
    setImage: {
        width: '100%',
        height: '100%',
        borderRadius: 15,
        borderWidth: 1,
        borderColor: COLORS.tertiary
    },
    topRow: {
        flex: 5,
        marginTop: normalizeHeight(8),
        flexDirection: 'row',

    },
    RWO: {
        fontFamily: "Times New Roman",
        color: COLORS.secondaryText,
        fontSize: normalize(20),
        width: '20%',
        marginLeft: normalizeWidth(20),
        alignSelf: 'center',
        textAlign: 'center',
    },
    RWOTitles: {
        fontFamily: "Times New Roman",
        color: COLORS.primary,
        fontSize: normalize(20),
        width: '20%',
        marginLeft: normalizeWidth(20),
        alignSelf: 'center',
        textAlign: 'center',
    },
    RWOcurrent: {
        fontFamily: "Times New Roman",
        color: COLORS.primary,
        fontSize: normalize(20),
        width: '20%',
        marginLeft: normalizeWidth(20),
        alignSelf: 'center',
        textAlign: 'center',
    },
    RWOcurrent1: {
        fontFamily: "Times New Roman",
        color: COLORS.tertiary,
        fontSize: normalize(20),
        width: '20%',
        marginLeft: normalizeWidth(20),
        alignSelf: 'center',
        textAlign: 'center',
    },
    setNum: {
        fontFamily: "Times New Roman",
        color: COLORS.secondaryText,
        fontSize: normalize(20),
        width: '8%',
        marginLeft: normalizeWidth(25),
        alignSelf: 'center',
        textAlign: 'center',
    },
    setNumTitle: {
        fontFamily: "Times New Roman",
        color: COLORS.primary,
        fontSize: normalize(20),
        width: '8%',
        marginLeft: normalizeWidth(25),
        alignSelf: 'center',
        textAlign: 'center',
    },
    setNumCurrent: {
        fontFamily: "Times New Roman",
        color: COLORS.primary,
        fontSize: normalize(20),
        width: '8%',
        marginLeft: normalizeWidth(25),
        alignSelf: 'center',
        textAlign: 'center',
    },
    setNumCurrent1: {
        fontFamily: "Times New Roman",
        color: COLORS.tertiary,
        fontSize: normalize(20),
        width: '8%',
        marginLeft: normalizeWidth(25),
        alignSelf: 'center',
        textAlign: 'center',
    },
    timer: {
        marginTop: normalizeHeight(10),
        flex: .8,
        fontFamily: "Times New Roman",
        color: COLORS.primary,
        fontSize: normalize(28),
        width: '100%',
        textAlign: 'center',
    },
    workingSet: {
        alignSelf: 'center',
        marginTop: normalizeHeight(150),
        height: normalizeHeight(75),
        width: '80%',
        backgroundColor: COLORS.itemBackground,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: COLORS.tertiary,
    },
    roundButton: {
        borderColor: COLORS.tertiary,
        borderWidth: 2,
        position: 'absolute',
        top: normalizeHeight(-25),
        alignSelf: 'center',
        width: normalize(125),
        height: normalize(125),
        borderRadius: 100,
        backgroundColor: COLORS.itemBackground,
    },
    roundButtonRed: {
        borderColor: "#f00",
        borderWidth: 2,
        position: 'absolute',
        top: normalizeHeight(-25),
        alignSelf: 'center',
        width: normalize(125),
        height: normalize(125),
        borderRadius: 100,
        backgroundColor: COLORS.itemBackground,
    },
    setText: {
        position: 'relative',
        top: normalizeHeight(20),
        fontFamily: "Times New Roman",
        color: COLORS.tertiary,
        fontSize: normalize(36),
        alignSelf: 'center',
    },
    setTextRed: {
        position: 'relative',
        top: normalizeHeight(20),
        fontFamily: "Times New Roman",
        color: "#f00",
        fontSize: normalize(36),
        alignSelf: 'center',
    },
    completeText: {
        position: 'relative',
        top: normalizeHeight(20),
        fontFamily: "Times New Roman",
        color: COLORS.tertiary,
        fontSize: normalize(36),
        alignSelf: 'center',
    },
    completeText1: {
        position: 'relative',
        top: normalizeHeight(3),
        fontFamily: "Times New Roman",
        color: COLORS.tertiary,
        fontSize: normalize(36),
        alignSelf: 'center',
    },
    completeTextRed: {
        position: 'relative',
        top: normalizeHeight(20),
        fontFamily: "Times New Roman",
        color: "#f00",
        fontSize: normalize(36),
        alignSelf: 'center',
    },
    graphsHolder: {
        alignSelf: 'center',
        alignContent: 'center',
        marginTop: normalizeHeight(65),
        height: normalizeHeight(55),
        width: '60%',
        backgroundColor: COLORS.itemBackground,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: COLORS.primaryBorder,
    },
    holdEachSet: {
        flex: 5,
        flexDirection: 'row',
        height: '90%',
        backgroundColor: COLORS.itemBackground2,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: COLORS.primaryBorder,
        alignSelf: 'center',
        width: '100%',
    },
    holdEachSetCurrent: {
        flex: 5,
        flexDirection: 'row',
        height: '90%',
        backgroundColor: COLORS.itemBackground2,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: COLORS.primaryBorder,
        alignSelf: 'center',
        width: '100%',
        borderColor: COLORS.tertiary
    },
    holdEachTimer: {
        flex: .8,
        height: '100%',
        flexDirection: 'row',
        borderColor: COLORS.primaryBorder,
        alignSelf: 'center',
        width: '100%'
    },
    setTimer: {
        fontFamily: "Times New Roman",
        color: COLORS.primary,
        textAlign: 'center',
        fontSize: normalize(20),
        width: '100%',
        alignSelf: 'center',
    },
    adddeleteholder: {
        flexDirection: 'row',
        alignSelf: 'center',
    },
    addSet: {
        fontFamily: "Times New Roman",
        color: "#000",
        fontSize: normalize(20),
    },
    deleteSet: {
        fontFamily: "Times New Roman",
        color: "#000",
        fontSize: normalize(20),
    },
    basicButton: {
        marginHorizontal: normalizeWidth(10),
        paddingHorizontal: normalizeWidth(5),
        marginVertical: normalizeHeight(5),
        paddingVertical: normalizeHeight(5),
        backgroundColor: COLORS.tertiary,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: COLORS.primaryBorder,
    },
    workingWeightRep: {
        flexDirection: 'row',
        top: normalizeHeight(-30),
        alignSelf: 'center',
        alignContent: 'center',
        alignItems: 'center'
    },
    WRText: {
        position: 'relative',
        fontFamily: "Times New Roman",
        color: COLORS.primary,
        fontSize: normalize(24),
        flex: 1,
        textAlign: 'center',
    },
    underlineHolder: {
        top: normalizeHeight(-9),
        flexDirection: 'row',
        alignSelf: 'center',
        alignContent: 'center',
    },
    underline: {
        height: 1,
        width: normalizeWidth(65),
        marginHorizontal: normalizeWidth(72),
        backgroundColor: COLORS.primary,
    },
    workingRW: {
        flexDirection: 'row',
        alignSelf: 'center',
        alignContent: 'center',
    },
    RWText: {
        top: normalizeHeight(-13),
        width: normalizeWidth(60),
        textAlign: 'center',
        marginHorizontal: normalizeWidth(75),
        fontFamily: "Times New Roman",
        color: COLORS.tertiary,
        fontSize: normalize(36),
    }
})
