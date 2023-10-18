import React, { useEffect, useState, useRef } from 'react';
import { Image, StyleSheet, Text, View, TextInput, Alert, Modal, ScrollView, TouchableOpacity } from 'react-native';
import { firestore, auth, handleSignout } from '../Firebase';
import { getFirestore, deleteDoc, query, getDoc, where, getDocs, setDoc, doc, collection, LoadBundleTask } from 'firebase/firestore';
import { Dimensions, Platform, PixelRatio, InteractionManager, ActivityIndicator } from 'react-native';
import { COLORS } from '../components/colors';
import Ionicons from 'react-native-vector-icons/Ionicons';



const {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
} = Dimensions.get('window');

// based on iphone 5s's scale
const scale = SCREEN_WIDTH / 390;
const heightScale = SCREEN_HEIGHT / 920;



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

export default function ToDo({ navigation }) {

    const user = auth.currentUser.uid
    const [dailyItem, setDailyItem] = useState(false)
    const [taskInput, setTaskInput] = useState('')
    const [planModalVisible, setPlanModalVisible] = useState(false);
    const [counter, setCounter] = useState(0)
    const [dailyRay, setDailyRay] = useState([])
    const [otherRay, setOtherRay] = useState([{ id: 0, name: 'red', bool: false, ray: 'other' }, { id: 1, name: 'blue', bool: true, ray: 'other' }])

    useEffect(() => {
        async function doStuff(){
            setDailyRay([])
            setOtherRay([])
            const q0 = query(collection(firestore, "users/" + user + '/ToDo'));
            const querySnapshot0 = await getDocs(q0);
            querySnapshot0.forEach((doc) => {
                // doc.data() is never undefined for query doc snapshots
                loadTask(doc.data().name, doc.data().ray, doc.data().shownName, doc.data().date)
            });
            InteractionManager.runAfterInteractions(() => {
                setDailyRay(tempoRay)
                setOtherRay(tempo1Ray)
            })
        }
        doStuff();
    }, [])

    var tempoRay = []
    var tempo1Ray = []

    //adds task from use efeect
    const loadTask = (name, ray, sn, date) => {
        const today = new Date()
        const yyyy1 = today.getFullYear();
        let mm1 = today.getMonth() + 1; // Months start at 0!
        let dd1 = today.getDate();
        if (dd1 < 10) dd1 = '0' + dd1;
        if (mm1 < 10) mm1 = '0' + mm1;
        const final = mm1 + '/' + dd1 + '/' + yyyy1;
        if (ray == 'daily') {
            if(final==date){
                tempoRay.push({ id: tempoRay.length, name: name, shownName: sn, date: date, bool: date == final, ray: ray })
            }else{
                tempoRay.unshift({ id: tempoRay.length, name: name, shownName: sn, date: date, bool: date == final, ray: ray })
            }
        } else {
            if(final==date){
                tempo1Ray.push({ id: tempo1Ray.length, name: name, date: date, shownName: sn, bool: date == final, ray: ray })
            }else{
                tempo1Ray.unshift({ id: tempo1Ray.length, name: name, date: date, shownName: sn, bool: date == final, ray: ray })
            }
        }
    }

    //receives full item {name: '', bool: true/false, ray: 'daily'/'other'}
    const completeTask = async (item) => {
        const today = new Date()
        const yyyy1 = today.getFullYear();
        let mm1 = today.getMonth() + 1; // Months start at 0!
        let dd1 = today.getDate();
        if (dd1 < 10) dd1 = '0' + dd1;
        if (mm1 < 10) mm1 = '0' + mm1;
        const final = mm1 + '/' + dd1 + '/' + yyyy1;
        var tempRay = [{}];
        if (item.ray == 'daily') {
            tempRay = dailyRay
        }
        else {
            tempRay = otherRay
        }
        var spot;
        for (let index = 0; index < tempRay.length; index++) {
            if (tempRay[index].id == item.id) {
                spot = index
            }
        }
        tempRay[spot].date = final
        tempRay[spot].bool = !tempRay[spot].bool;
        //push item to bottom of array
        var object = tempRay[spot];
        tempRay.splice(spot, 1);
        tempRay.push(object)
        if (item.ray == 'daily') {
            setCounter(counter + 1)
            setDailyRay(tempRay)
        }
        else {
            setOtherRay(tempRay)
            setCounter(counter + 1)
        }
        await setDoc(doc(firestore, "users/" + user + '/ToDo', item.name), {
            shownName: item.shownName,
            name: item.name,
            ray: item.ray,
            date: final
        });
        setCounter(counter + 1)
    }

    const addTask = async () => {
        setPlanModalVisible(false)
        var tempRay = []
        if (dailyItem) {
            tempRay = dailyRay
            const random1 = makeDocName();
            const date = 'N/A'
            tempRay.unshift({ id: tempRay.length, name: random1, shownName: taskInput, date: date, bool: false, ray: 'daily' })
            await setDoc(doc(firestore, "users/" + user + '/ToDo', random1), {
                shownName: taskInput,
                name: random1,
                ray: 'daily',
                date: date
            });
        } else {
            tempRay = otherRay
            const random1 = makeDocName();
            const date = 'N/A'
            tempRay.unshift({ id: tempRay.length, name: random1, shownName: taskInput, date: date, bool: false, ray: 'other' })
            await setDoc(doc(firestore, "users/" + user + '/ToDo', random1), {
                shownName: taskInput,
                name: random1,
                ray: 'other',
                date: date
            });
        }
        setTaskInput('')
    }

    const deleteTask = async (item) => {
        var tempRay = []
        if (item.ray == 'daily') {
            tempRay = dailyRay
        } else {
            tempRay = otherRay
        }
        var spot;
        for (let index = 0; index < tempRay.length; index++) {
            if (tempRay[index].id == item.id) {
                spot = index
            }
        }
        tempRay.splice(spot, 1)
        if (item.ray == 'daily') {
            setCounter(counter + 1)
            setDailyRay(tempRay)
        } else {
            setCounter(counter + 1)
            setOtherRay(tempRay)
        }
        await deleteDoc(doc(firestore, "users/" + user + '/ToDo', item.name))
    }

    const makeDocName = () => {
        var text = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

        for (var i = 0; i < 25; i++)
            text += possible.charAt(Math.floor(Math.random() * possible.length));

        return text;
    }

    return (
        <View style={styles.container}>
            <Modal
                animationType="fade"
                visible={planModalVisible}
                transparent={true}
                backgroundColor='#000000'
                onRequestClose={() => {
                    setPlanModalVisible(!planModalVisible)
                }}
            >
                <TouchableOpacity style={styles.modalContainer} onPress={() => { setPlanModalVisible(!planModalVisible) }}>
                    <TouchableOpacity style={styles.modal} activeOpacity={1} >
                        <View style={styles.planView}>
                            <View style={styles.addDayHolder}>
                                <TextInput allowFontScaling={false} value={taskInput} placeholderTextColor="rgba(154,154,154,1)" placeholder='Task Name' onChangeText={text => setTaskInput(text.substring(0, 18))} style={styles.modalTextInput2} />
                                <View style={styles.underline2} />
                                <View style={styles.itemHolder2}>
                                    <TouchableOpacity style={dailyItem ? styles.trueButton : styles.falseButton} onPress={() => setDailyItem(!dailyItem)} />
                                    <Text allowFontScaling={false} style={styles.taskText}>
                                        Daily Task
                                    </Text>
                                </View>
                                <TouchableOpacity style={styles.AddDayButton}>
                                    <Text allowFontScaling={false} onPress={() => addTask()} style={styles.AddDayText}>Add</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                    </TouchableOpacity>
                </TouchableOpacity>


            </Modal>
            <View style={styles.TitleView}>
                <Text allowFontScaling={false} style={styles.TitleText}>
                    To-Do List
                </Text>
            </View>
            <View style={styles.dailyTasks}>
                <Text allowFontScaling={false} style={styles.dailyText}>
                    Daily Tasks:
                </Text>
                <ScrollView style={styles.scrollview}>
                    {dailyRay.map((item) => {
                        return (
                            <View key={item.id} style={styles.itemHolder}>
                                <TouchableOpacity style={item.bool ? styles.trueButton : styles.falseButton} onPress={() => completeTask(item)} />
                                <Text allowFontScaling={false} style={styles.taskText}>
                                    {item.shownName}
                                </Text>
                                <Text allowFontScaling={false} style={styles.taskText}>
                                    {item.date}
                                </Text>
                                <TouchableOpacity style={styles.garbage} onPress={() => deleteTask(item)}>
                                    <Ionicons name="trash-outline" size={normalize(36)} color={COLORS.tertiary} />
                                </TouchableOpacity>
                            </View>
                        )
                    })}
                </ScrollView>
            </View>
            <View style={styles.oneTimeTasks}>
                <Text allowFontScaling={false} style={styles.dailyText}>
                    Other Tasks:
                </Text>
                <ScrollView style={styles.scrollview}>
                    {otherRay.map((item) => {
                        return (
                            <View key={item.id} style={styles.itemHolder}>
                                <TouchableOpacity style={item.bool ? styles.trueButton : styles.falseButton} onPress={() => completeTask(item)} />
                                <Text allowFontScaling={false} style={styles.taskText}>
                                    {item.shownName}
                                </Text>
                                <Text allowFontScaling={false} style={styles.taskText}>
                                    {item.date}
                                </Text>
                                <TouchableOpacity style={styles.garbage} onPress={() => deleteTask(item)}>
                                    <Ionicons name="trash-outline" size={normalize(36)} color={COLORS.tertiary} />
                                </TouchableOpacity>
                            </View>
                        )
                    })}
                </ScrollView>
            </View>
            <TouchableOpacity style={styles.addTaskBtn} onPress={() => setPlanModalVisible(true)}>
                <Text allowFontScaling={false} style={styles.buttonText}>
                    Add Task
                </Text>
            </TouchableOpacity>
        </View>
    )
}
export { ToDo }
const styles = StyleSheet.create({

    container: {
        backgroundColor: COLORS.background,
        flex: 1,
        alignContent: 'center',
    },
    TitleView: {
        marginTop: normalizeHeight(50),
        height: normalizeHeight(75),
        alignItems: 'center'
    },
    underline2:{
        borderWidth: 1,
        borderColor: COLORS.secondaryText,
        left: normalizeWidth(44),
        width: normalizeWidth(160),
        position: 'absolute',
        alignSelf: 'center',
        top: normalizeHeight(37),
    },
    TitleText: {
        fontFamily: 'Times New Roman',
        fontSize: normalize(50),
        color: COLORS.primary,
        textAlign: 'center',
        alignSelf: 'center',
    },
    dailyTasks: {
        backgroundColor: COLORS.itemBackground,
        height: normalizeHeight(355),
        width: '90%',
        borderRadius: 15,
        alignSelf: 'center',
    },
    oneTimeTasks: {
        backgroundColor: COLORS.itemBackground,
        height: normalizeHeight(250),
        width: '90%',
        marginTop: normalizeHeight(20),
        borderRadius: 15,
        alignSelf: 'center',
    },
    dailyText: {
        fontFamily: 'Times New Roman',
        fontSize: normalize(24),
        marginTop: normalizeHeight(10),
        marginLeft: normalizeWidth(15),
        color: COLORS.primary,
    },
    scrollview: {
        marginTop: normalizeHeight(5),
    },
    itemHolder: {
        backgroundColor: COLORS.itemBackground2,
        height: normalizeHeight(50),
        width: '95%',
        alignSelf: 'center',
        marginVertical: normalizeHeight(5),
        borderRadius: 15,
        flexDirection: 'row',
        borderWidth: 1,
    },
    garbage: {
        position: 'absolute',
        height: normalizeHeight(40),
        width: normalizeWidth(30),
        top: normalizeHeight(7),
        right: normalizeWidth(10),
    },
    itemHolder2: {
        backgroundColor: COLORS.itemBackground2,
        height: normalizeHeight(50),
        width: normalizeWidth(200),
        alignSelf: 'center',
        marginVertical: normalizeHeight(5),
        borderRadius: 15,
        flexDirection: 'row',
        marginBottom: normalizeHeight(12),
    },
    trueButton: {
        backgroundColor: COLORS.tertiary,
        borderColor: COLORS.primaryBorder,
        borderWidth: 1,
        width: normalizeWidth(30),
        height: normalizeHeight(30),
        top: normalizeHeight(10),
        left: normalizeWidth(10),
        borderRadius: 5,
    },
    falseButton: {
        backgroundColor: COLORS.itemBackground,
        borderColor: COLORS.primaryBorder,
        borderWidth: 1,
        width: normalizeWidth(30),
        height: normalizeHeight(30),
        top: normalizeHeight(10),
        left: normalizeWidth(10),
        borderRadius: 5,
    },
    taskText: {
        fontFamily: 'Times New Roman',
        fontSize: normalize(24),
        marginLeft: normalizeWidth(20),
        width: normalizeWidth(110),
        top: normalizeHeight(11),
        color: COLORS.primary,
    },
    addTaskBtn: {
        borderColor: COLORS.black,
        borderWidth: 1,
        backgroundColor: COLORS.tertiary,
        borderRadius: 15,
        height: normalizeHeight(40),
        width: normalizeWidth(150),
        marginTop: normalizeHeight(14),
        alignSelf: 'center',
        alignItems: 'center'
    },
    buttonText: {
        fontFamily: 'Times New Roman',
        fontSize: normalize(24),
        top: normalizeHeight(7),
        color: COLORS.black,
    },
    modalContainer: {
        flex: 1,
        backgroundColor: '#00000090',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modal: {
        width: '75%',
        height: '70%',
        borderColor: COLORS.tertiary,
        borderWidth: 3,
        borderRadius: 15,
        backgroundColor: COLORS.background
    },
    planView: {
        paddingVertical: normalizeHeight(30),
        paddingHorizontal: normalizeWidth(30),
        flexDirection: 'column'
    },
    addDayHolder: {
        top: normalizeHeight(10),
        marginBottom: normalizeHeight(20),
        alignSelf: 'center',
        alignContent: 'center'
    },
    modalTextInput2: {
        width: normalizeWidth(250),
        marginBottom: normalizeHeight(10),
        paddingVertical: normalizeHeight(5),
        borderRadius: 15,
        borderWidth: 1,
        borderColor: COLORS.tertiary,
        alignSelf: 'center',
        fontFamily: "Times New Roman",
        color: COLORS.primary,
        fontSize: normalize(28),
        backgroundColor: COLORS.itemBackground,
        textAlign: 'center',
    },
    AddDayButton: {
        color: COLORS.primary,
        alignSelf: 'center',
        fontFamily: "Times New Roman",
        fontSize: normalize(24),
        height: normalizeHeight(40),
        width: normalizeWidth(100),
        borderWidth: 1,
        marginBottom: normalizeHeight(10),
        marginLeft: normalizeWidth(5),
        backgroundColor: COLORS.tertiary,
        borderRadius: 15,
    },
    AddDayText: {
        fontFamily: "Times New Roman",
        color: COLORS.black,
        fontSize: normalize(24),
        margin: normalizeHeight(5),
        borderRadius: 15,
        alignSelf: 'center',
    },

})