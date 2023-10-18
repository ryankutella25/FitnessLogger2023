import React, { useEffect, useState, useRef } from 'react';
import { FlatList, Image, StyleSheet, Text, View, TextInput, Alert, Modal, ScrollView, TouchableOpacity } from 'react-native';
import { firestore, auth, handleSignout } from '../Firebase';
import { getFirestore, deleteDoc, query, getDoc, where, getDocs, setDoc, doc, collection } from 'firebase/firestore';
import { Dimensions, Platform, PixelRatio, InteractionManager, ActivityIndicator } from 'react-native';
import { COLORS } from '../components/colors';
import moment from 'moment';
import { useIsFocused } from '@react-navigation/native';

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



export default function History({navigation }) {

    const scrollViewRef = useRef()
    const user = auth.currentUser.uid;
    const [input, setInput] = useState('')
    const [workoutRay, setWorkoutRay] = useState([])
    const [selectedStartDate, setSelectedStartDate] = useState('')
    const [value, onChange] = useState(new Date());


    const changeInput = (text1) => {
        const text = text1.substring(0, 20)
        setInput(text)
        var index = [];
        for (let i = 0; i < workoutRay.length; i++) {
            const text = workoutRay[i].shownName;
            if (text.includes(text1)) {
                index.push(i)
            }
        }
        scrollViewRef.current.scrollTo({ y: index[0] * 110 - 10 });
    }

    const scrollHandler = (itemIndex) => {
        var index = [];
        for (let i = 0; i < workoutRay.length; i++) {
            const text = workoutRay[i].shownName;
            if (text.includes(itemIndex)) {
                index.push(i)
            }
        }
        scrollViewRef.current.scrollTo({ y: index[0] * 110 - 10 });
    }

    const clickOnWorkout = (item) => {
        const workout = { name: item.name, shownName: item.shownName }
        const h = 100;
        navigation.navigate('Graph', { workout, h })
    }

    const pathway = 'users/' + user + '/WorkoutHistory'
    const [isReady, setIsReady] = useState(false)
    const [customDatesStyles, setCustomDateStyles] = useState([{}])
    useEffect(() => {
        async function doStuff(){
            setWorkoutRay([]);
            const q = query(collection(firestore, pathway));
            const querySnapshot = await getDocs(q);
            var tempRay = [];
            querySnapshot.forEach((doc) => {
                if(tempRay.length==0){
                    tempRay.push({ id: workoutRay.length, name: doc.data().name, shownName: doc.data().shownName })
                }else{
                    var indexLessThan = 0;
                    for (let index = 0; index < tempRay.length; index++) {
                        const rayLetter = tempRay[index].shownName.substring(0,1)
                        const checkLetter = doc.data().shownName.substring(0,1)
                        if(rayLetter<checkLetter){
                            indexLessThan=index+1
                        }
                        if(rayLetter>checkLetter){
                        }
                    }
                    tempRay.splice(indexLessThan,0,{ id: workoutRay.length, name: doc.data().name, shownName: doc.data().shownName })
                }
                // doc.data() is never undefined for query doc snapshots
                setWorkoutRay(tempRay)
            });
            InteractionManager.runAfterInteractions(() => {
                setIsReady(true)
            })
            const q5 = query(collection(firestore, 'users/' + user + '/DateHistory'));
            const querySnapshot5 = await getDocs(q5)
            //for each date
            var tempRay5 = []
            querySnapshot5.forEach(async (doc) => {
                tempRay5.push(doc.data().date)
            })
            for (let index = 0; index < tempRay5.length; index++) {
                const temp = new Date(tempRay5[index])
                //console.log(moment(temp))
                setCustomDateStyles(customDatesStyles, [...customDatesStyles, {
                    date: moment(temp),
                    // Random colors
                    style: { backgroundColor: '#' + ('#00000' + (Math.random() * (1 << 24) | 0).toString(16)).slice(-6) },
                    textStyle: { color: 'black' }, // sets the font color
                    containerStyle: [], // extra styling for day container
                    allowDisabled: true, // allow custom style to apply to disabled dates
                }])
            }
            changeMonth()
        }
        doStuff();
        
    }, [useIsFocused()])

    const onDateChange = (date) => {
        setSelectedStartDate(date)
    }

    const setCurrentType = (id) => {
        setCurrentGraphType(id)
    }

    const graphTypeRay = [{ name: 'History', id: 0 }, { name: 'Graphs', id: 1 }];
    const [currentGraphType, setCurrentGraphType] = useState(0)
    const [counter, setCounter] = useState()
    const [rowDay, setRowDay] = useState([])
    const weekInitials = [{ n: 'S', id: 0 }, { n: 'M', id: 1 }, { n: 'T', id: 2 }, { n: 'W', id: 3 }, { n: 'T', id: 4 }, { n: 'F', id: 5 }, { n: 'S', id: 6 }]
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const months = ['January', 'February', 'March', 'April', 'May', 'June', "July", 'August', 'September', 'October', 'November', 'December']

    const changeMonth = async (text) => {
        var tempMonth = month;
        var tempYear = year;
        if (text == 'left') {
            if (tempMonth != 1) {
                tempMonth = tempMonth - 1
            } else {
                tempMonth = 12;
                tempYear = tempYear - 1
            }
        }
        else if (text == 'right') {
            if (tempMonth != 12) {
                tempMonth = tempMonth + 1
            } else {
                tempMonth = 1;
                tempYear = tempYear + 1
            }
        }
        else if (text == 'today') {
            tempMonth = new Date().getMonth() + 1
            tempYear = new Date().getFullYear()
        }
        var writtenMonth = tempMonth;
        if (writtenMonth < 10) {
            writtenMonth = '0' + writtenMonth
        }
        var day = new Date(tempYear + "-" + writtenMonth + "-01").getDay();
        var daysInMonth = new Date(tempYear, writtenMonth, 0).getDate();
        // 0 == Monday
        // 6 == Sunday
        day = day + 1
        if (day == 7) {
            day = 0
        }
        var workoutList = [];
        const q = query(collection(firestore, "users/" + user + '/DateHistory'));
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
            // doc.data() is never undefined for query doc snapshots
            const date = doc.data().date;
            if (date.substring(6, 10) == tempYear) {
                if (date.substring(0, 2) == tempMonth) {
                    workoutList.push(date.substring(3, 5))
                }
            }
        });
        var tempRay = []
        for (let index = 0; index < day; index++) {
            tempRay.push({ n: 1, id: tempRay.length })
        }
        const todayDay = new Date().getDate()
        const todayMonth = new Date().getMonth() + 1
        for (let index = 0; index < daysInMonth; index++) {
            var found = false;
            workoutList.forEach(element => {
                if (index + 1 == parseInt(element)) {
                    found = true
                }
            });
            if (index + 1 == todayDay && todayMonth == tempMonth) {
                if (found) {
                    tempRay.push({ n: 3, i: index + 1, id: tempRay.length })
                } else {
                    tempRay.push({ n: 4, i: index + 1, id: tempRay.length })
                }
            }
            else if (found) {
                tempRay.push({ n: 2, i: index + 1, id: tempRay.length })
            }
            else {
                tempRay.push({ n: 0, i: index + 1, id: tempRay.length })
            }
        }
        while (tempRay.length < 42) {
            tempRay.push({ n: 1, id: tempRay.length })
        }
        var tempRowDay = [];
        tempRowDay.push({ ray: tempRay.slice(0, 7), id: 0 })
        tempRowDay.push({ ray: tempRay.slice(7, 14), id: 1 })
        tempRowDay.push({ ray: tempRay.slice(14, 21), id: 2 })
        tempRowDay.push({ ray: tempRay.slice(21, 28), id: 3 })
        tempRowDay.push({ ray: tempRay.slice(28, 35), id: 4 })
        tempRowDay.push({ ray: tempRay.slice(35, 42), id: 5 })
        setRowDay(tempRowDay)
        setYear(tempYear)
        setMonth(tempMonth)
        setCounter(counter + 1)
    }

    const selectDay = async (index) => {
        //gets path name of the date we selected
        var docName = '';
        const q = query(collection(firestore, "users/" + user + '/DateHistory'));
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
            const date = doc.data().date
            // doc.data() is never undefined for query doc snapshots
            if (date.substring(6, 10) == year) {
                if (date.substring(0, 2) == month) {
                    if (date.substring(3, 5) == index) {
                        docName = doc.data().name
                    }
                }
            }
        });
        //pushes each workout name and shown name into workoutRay
        var workoutRay = [];
        setDayWorkouts([])
        setCounter(counter + 1)
        if (docName != '') {
            const q1 = query(collection(firestore, "users/" + user + '/DateHistory/' + docName + '/Workouts'));
            const querySnapshot1 = await getDocs(q1);
            querySnapshot1.forEach((doc) => {
                workoutRay.push({ shownName: doc.data().shownName, name: doc.data().name })
            });
        }
        //after we have each workout in workoutRay we now go through and get each set from each path and push into tempRay1
        var tempRay1 = []
        for (let index = 0; index < workoutRay.length; index++) {
            const q2 = query(collection(firestore, "users/" + user + '/DateHistory/' + docName + '/Workouts/' + workoutRay[index].name + '/Sets'));
            const querySnapshot2 = await getDocs(q2);
            querySnapshot2.forEach((doc) => {
                tempRay1.push({ name: workoutRay[index].shownName, reps: doc.data().reps, weight: doc.data().weight })
            });
            if (index == workoutRay.length - 1) {
                addToDayWorkout(tempRay1)
            }
        }
    }

    const [dayWorkouts, setDayWorkouts] = useState([])
    const addToDayWorkout = (rayOne) => {
        var tempDayWorkouts = [];
        for (let index = 0; index < rayOne.length; index++) {
            var location = -1;
            for (let i = 0; i < tempDayWorkouts.length; i++) {
                if (tempDayWorkouts[i].name == rayOne[index].name) {
                    location = i
                }
            }
            if (location >= 0) {
                tempDayWorkouts[location].ray.push({ reps: rayOne[index].reps, weight: rayOne[index].weight, id: tempDayWorkouts[location].ray.length })
            } else {
                var tempRay = [{ reps: rayOne[index].reps, weight: rayOne[index].weight, id: 0 }]
                tempDayWorkouts.push({ name: rayOne[index].name, ray: tempRay })
            }
        }
        setDayWorkouts(tempDayWorkouts)
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
            <View style={styles.chartOptions}>
                {graphTypeRay.map(item => {
                    return (
                        <View key={item.id} flex={1}>
                            {item.id == currentGraphType ?
                                <TouchableOpacity style={styles.chartOptionsButton5}>
                                    <Text allowFontScaling={false} style={styles.chartOptionsText}>
                                        {item.name}
                                    </Text>
                                </TouchableOpacity>
                                :
                                <TouchableOpacity style={styles.chartOptionsButton} onPress={() => setCurrentType(item.id)}>
                                    <Text allowFontScaling={false} style={styles.chartOptionsText}>
                                        {item.name}
                                    </Text>
                                </TouchableOpacity>
                            }
                        </View>
                    )
                })}
            </View>
            {currentGraphType == 0 ?
                <View height='100%' flex={1} >
                    <View style={styles.calendarContainer}>
                        <View style={styles.row}>
                            <TouchableOpacity style={styles.flexOne} onPress={() => changeMonth('left')}>
                                <Text allowFontScaling={false} style={styles.arrowLeft}>
                                    {'<'}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.flexTwo} onPress={() => changeMonth('today')}>
                                <Text allowFontScaling={false} style={styles.monthText}>
                                    {months[month - 1]} {year}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.flexOne} onPress={() => changeMonth('right')}>
                                <Text allowFontScaling={false} style={styles.arrowRight}>
                                    {'>'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.row}>
                            {weekInitials.map(item => {
                                return (
                                    <View key={item.id} style={styles.initial}>
                                        <Text style={styles.initialText}>{item.n}</Text>
                                    </View>
                                )
                            })}
                        </View>
                        {rowDay.map(item => {
                            return (
                                <View key={item.id} style={styles.row}>
                                    {item.ray.map(i => {
                                        if (i.n == 0) {
                                            return (
                                                <TouchableOpacity key={i.id} style={styles.day} onPress={() => selectDay(i.i)}>
                                                    <Text allowFontScaling={false} style={styles.dayText}>{i.i}</Text>
                                                </TouchableOpacity>
                                            )
                                        } else if (i.n == 1) {
                                            return (
                                                <TouchableOpacity key={i.id} style={styles.day1} />
                                            )
                                        } else if (i.n == 3) {
                                            return (
                                                <TouchableOpacity key={i.id} style={styles.day3} onPress={() => selectDay(i.i)} >
                                                    <Text allowFontScaling={false} style={styles.dayText2}>{i.i}</Text>
                                                </TouchableOpacity>
                                            )
                                        } else if (i.n == 4) {
                                            return (
                                                <TouchableOpacity key={i.id} style={styles.day4} onPress={() => selectDay(i.i)} >
                                                    <Text allowFontScaling={false} style={styles.dayText2}>{i.i}</Text>
                                                </TouchableOpacity>
                                            )
                                        } else {
                                            return (
                                                <TouchableOpacity key={i.id} style={styles.day2} onPress={() => selectDay(i.i)} >
                                                    <Text allowFontScaling={false} style={styles.dayText}>{i.i}</Text>
                                                </TouchableOpacity>
                                            )
                                        }

                                    })}
                                </View>
                            )
                        })}
                    </View>
                    <View style={styles.dayInfoHolder}>
                        <ScrollView borderRadius={15}>
                            {dayWorkouts.map(i => {
                                return (
                                    <View key={i.name} style={styles.dayWorkoutHolder}>
                                        <View borderWidth={2} borderRadius={10} backgroundColor={COLORS.itemBackground2}>
                                            <Text style={styles.workoutName}>
                                                {i.name}
                                            </Text>
                                        </View>
                                        <View style={styles.workoutMap}>
                                            {i.ray.map(l => {
                                                return (
                                                    <View key={l.id} style={styles.workoutInfo}>
                                                        <Text style={styles.repWeight}>Reps: {l.reps}    </Text>
                                                        <Text style={styles.repWeight}>Weight: {l.weight}   </Text>
                                                    </View>
                                                )
                                            })}
                                        </View>
                                    </View>
                                )
                            })}
                        </ScrollView>
                    </View>
                </View>
                :
                <View height='100%' width='90%' flex={1} alignItems='center'>
                    {/* <TextInput
                        style={styles.textInput}
                        onChangeText={text => changeInput(text)}
                        value={input}
                        placeholder='Search'
                        placeholderTextColor={COLORS.secondaryText}
                        /> */}
                    <View style={styles.scrollViewHolder}>
                        <ScrollView ref={scrollViewRef} style={styles.ScrollView}>
                            {workoutRay.length != 0 ?
                                <Text style={styles.noWorkoutsText}></Text>
                                :
                                <Text style={styles.noWorkoutsText}>No Workouts Completed</Text>
                            }
                            {
                                workoutRay.map((item) => {
                                    return (
                                        <TouchableOpacity key={item.name} style={styles.eachDayHolder} onPress={() => clickOnWorkout(item)}>
                                            <Text allowFontScaling={false} style={styles.titleText}>
                                                {item.shownName}
                                            </Text>
                                        </TouchableOpacity>
                                    )
                                })
                            }
                        </ScrollView>
                    </View>
                </View>
            }

            {/*
            <TextInput
                style={styles.textInput}
                onChangeText={text => changeInput(text)}
                value={input}
                placeholder='hi'
                onSubmitEditing={() => scrollHandler(input)}
            />
            <View style={styles.scrollViewHolder}>
                <ScrollView ref={scrollViewRef} style={styles.ScrollView}>
                    {
                        workoutRay.map((item) => {
                            return (
                                <TouchableOpacity key={item.name} style={styles.eachDayHolder} onPress={() => clickOnWorkout(item)}>
                                    <Text style={styles.titleText}>
                                        {item.shownName}
                                    </Text>
                                </TouchableOpacity>
                            )
                        })
                    }
                </ScrollView>
            </View>
                */}

        </View>
    )
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
        alignItems: 'center'
    },
    workoutMap: {
        flex: 1,
    },
    workoutInfo: {
        height: normalizeHeight(30),
        flexDirection: 'row',
        alignSelf: 'center'
    },
    repWeight: {
        fontFamily: "Times New Roman",
        color: COLORS.primary,
        fontSize: normalize(20),
        alignSelf: 'center',
        textAlign: 'center',
        textAlignVertical: 'center',
    },
    workoutName: {
        fontFamily: "Times New Roman",
        color: COLORS.primary,
        fontSize: normalize(20),
        alignSelf: 'center',
        textAlign: 'center',
        textAlignVertical: 'center',
        paddingVertical: 5,
    },
    noWorkoutsText: {
        fontFamily: "Times New Roman",
        position: 'absolute',
        color: COLORS.primary,
        fontSize: normalize(24),
        top: normalizeHeight(10),
        alignSelf: 'center',
        textAlign: 'center',
        textAlignVertical: 'center',
    },
    calendarContainer: {
        flex: 3.6,
        width: normalizeWidth(360),
        height: normalizeHeight(600),
        top: normalizeHeight(7),
        borderRadius: 10,
        borderWidth: 1,
        borderColor: COLORS.borderColor,
        backgroundColor: COLORS.itemBackground,
        alignItems: 'center'
    },
    initial: {
        flex: 1,
        alignItems: 'center',
    },
    initialText: {
        fontFamily: "Times New Roman",
        color: COLORS.primary,
        fontSize: normalize(24),
        top: normalizeHeight(5),
        alignSelf: 'center',
        textAlign: 'center',
        textAlignVertical: 'center',
    },
    monthText: {
        fontFamily: "Times New Roman",
        color: COLORS.primary,
        fontSize: normalize(24),
        top: normalizeHeight(5),
        alignSelf: 'center',
        textAlign: 'center',
        textAlignVertical: 'center',
    },
    arrowLeft: {
        fontFamily: "Times New Roman",
        color: COLORS.primary,
        fontSize: normalize(24),
        top: normalizeHeight(5),
        alignSelf: 'center',
        textAlign: 'center',
        textAlignVertical: 'center',
    },
    arrowRight: {
        fontFamily: "Times New Roman",
        color: COLORS.primary,
        fontSize: normalize(24),
        top: normalizeHeight(5),
        alignSelf: 'center',
        textAlign: 'center',
        textAlignVertical: 'center',
    },
    row: {
        width: '98%',
        flex: 1,
        flexDirection: 'row'
    },
    flexOne: {
        flex: 1,
    },
    flexTwo: {
        flex: 2,
    },
    dayText: {
        color: COLORS.primary,
        fontSize: normalize(14),
        height: '100%',
        top: normalizeHeight(6),
        alignSelf: 'center',
        textAlign: 'center',
        textAlignVertical: 'center',
    },
    dayText2: {
        color: COLORS.tertiary,
        fontSize: normalize(14),
        height: '100%',
        top: normalizeHeight(6),
        alignSelf: 'center',
        textAlign: 'center',
        textAlignVertical: 'center',
    },
    day: {
        flex: 1,
        borderRadius: 6,
        borderWidth: 1,
        alignSelf: 'center',
        height: normalizeHeight(32),
        marginHorizontal: normalizeWidth(8),
        backgroundColor: COLORS.background,
    },
    day1: {
        flex: 1,
        borderRadius: 6,
        alignSelf: 'center',
        height: normalizeHeight(32),
        marginHorizontal: normalizeWidth(8),
        backgroundColor: COLORS.itemBackground,
    },
    day2: {
        flex: 1,
        borderRadius: 6,
        borderWidth: 1,
        alignSelf: 'center',
        height: normalizeHeight(32),
        marginHorizontal: normalizeWidth(8),
        backgroundColor: COLORS.itemBackground3,
    },
    day3: {
        flex: 1,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: COLORS.tertiary,
        alignSelf: 'center',
        height: normalizeHeight(32),
        marginHorizontal: normalizeWidth(8),
        backgroundColor: COLORS.itemBackground3,
    },
    day4: {
        flex: 1,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: COLORS.tertiary,
        alignSelf: 'center',
        height: normalizeHeight(32),
        marginHorizontal: normalizeWidth(8),
        backgroundColor: COLORS.background,
    },
    lastNextTitle: {
        fontFamily: "Times New Roman",
        color: COLORS.primary,
        fontSize: normalize(22),
        top: normalizeHeight(4),
        alignSelf: 'center',
        textAlign: 'center'
    },
    selectedText: {
        fontFamily: "Times New Roman",
        color: COLORS.black,
        fontSize: normalize(18),
        alignSelf: 'center',
        textAlign: 'center'
    },
    graphButton: {
        top: normalizeHeight(50),
        width: normalizeWidth(300),
        height: normalizeHeight(100),
        backgroundColor: COLORS.tertiary,
        alignItems: 'center'
    },
    textHolder: {
        flex: 0.9,
        alignItems: 'center'
    },
    text: {
        fontFamily: "Times New Roman",
        color: COLORS.primary,
        fontSize: normalize(34),
        top: normalizeHeight(48),
        width: '100%',
        alignSelf: 'center',
        textAlign: 'center'
    },
    scrollViewHolder: {
        flex: 3,
        width: '90%',
    },
    ScrollView: {
        flex: 1,
        backgroundColor: COLORS.itemBackground,
        fontWeight: 'bold',
        borderRadius: 15,
        textAlign: 'center',
        color: '#34495e',
    },
    textInput: {
        width: normalizeWidth(300),
        marginBottom: normalizeHeight(10),
        paddingVertical: normalizeHeight(8),
        borderRadius: 15,
        borderWidth: 1,
        top: normalizeHeight(5),
        flex: 0.3,
        borderColor: COLORS.tertiary,
        alignSelf: 'center',
        fontFamily: "Times New Roman",
        color: COLORS.primary,
        fontSize: normalize(24),
        backgroundColor: COLORS.itemBackground,
        textAlign: 'center',
    },
    dayInfoHolder: {
        flex: 3,
        borderRadius: 15,
        borderWidth: 2,
        marginHorizontal: normalizeWidth(30),
        marginVertical: normalizeHeight(20),
        backgroundColor: COLORS.itemBackground
    },
    eachDayHolder: {
        width: '95%',
        height: normalizeHeight(100),
        top: normalizeHeight(5),
        borderRadius: 15,
        borderWidth: 1,
        alignContent: 'center',
        borderColor: COLORS.primaryBorder,
        marginBottom: normalizeHeight(10),
        alignSelf: 'center',
        backgroundColor: COLORS.itemBackground2,

    },
    titleText: {
        fontFamily: "Times New Roman",
        color: COLORS.primary,
        fontSize: normalize(34),
        width: '100%',
        alignSelf: 'center',
        textAlign: 'center',
        marginVertical: normalizeHeight(28),
    },
    chartOptions: {
        backgroundColor: COLORS.itemBackground,
        borderRadius: 15,
        marginTop: normalizeHeight(45),
        marginBottom: normalizeHeight(5),
        height: normalizeHeight(50),
        width: normalizeWidth(200),
        flexDirection: 'row',
        borderWidth: 1,
    },
    chartOptionsButton: {
        flex: 1,
        backgroundColor: COLORS.itemBackground2,
        marginHorizontal: normalizeWidth(10),
        borderRadius: 15,
        marginVertical: normalizeHeight(10),
        borderWidth: 1,
        borderColor: COLORS.primaryBorder
    },
    chartOptionsButton5: {
        flex: 1,
        backgroundColor: COLORS.itemBackground2,
        marginHorizontal: normalizeWidth(10),
        borderRadius: 15,
        marginVertical: normalizeHeight(10),
        borderWidth: 1,
        borderColor: COLORS.tertiary
    },
    chartOptionsText: {
        position: 'relative',
        top: normalizeHeight(2),
        fontFamily: "Times New Roman",
        color: COLORS.primary,
        fontSize: normalize(18),
        alignSelf: 'center',
    },
    dayWorkoutHolder: {
        backgroundColor: COLORS.itemBackground,
        flex: 1
    }
})