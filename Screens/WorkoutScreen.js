import React, { Component, useState, useEffect } from 'react';
import { Modal, StyleSheet, Alert, Image, TouchableOpacity, Text, View, TextInput, FlatList, Picker, ScrollView, TouchableHighlight } from 'react-native';
import { firestore } from '../Firebase';
import { deleteDoc, getFirestore, query, getDoc, where, getDocs, setDoc, doc, collection } from 'firebase/firestore';
import { Stopwatch, Timer } from "react-native-stopwatch-timer";
import { Dimensions, Platform, PixelRatio, InteractionManager, ActivityIndicator } from 'react-native';
import { COLORS } from '../components/colors';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useIsFocused } from '@react-navigation/native';

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

export default function WorkoutScreen({ route, navigation }) {

  const isFocused = useIsFocused();
  const { item, user, currentPlan } = route.params;
  const day = item;
  const [input, setInput] = useState('')
  const [editDayInput, setEditDayInput] = useState('')
  const currentDay = item;
  const [workoutRay, setWorkoutRay] = useState([]);
  const [editDayModalVisible, setEditDayModalVisible] = useState(false);
  const [dayClicked, setDayClicked] = useState({ shownName: '', name: '', id: 0 })
  const path = 'users/' + user + '/Program/' + currentPlan.name + '/Days/' + currentDay.name + '/Workouts'
  const [fullTime, setFullTime] = useState(400000)

  const backBtn = () => {
    navigation.goBack()
  }

  const [volume, setVolume] = useState(0)
  const fromSetScreen = async (item, sc, weight, sets) => {
    const tempRay = workoutRay;
    tempRay[item.id].sc = sc;
    tempRay[item.id].reps = sets;
    let time1 = 0;
    let weight1 = 0;
    const q = query(collection(firestore, path + '/' + item.name + '/Sets'));
    const querySnapshot1 = await getDocs(q);
    querySnapshot1.forEach((doc) => {
      time1 = time1 + parseInt(doc.data().timer) + 20;
      weight1 = weight1 + parseInt(doc.data().weight)
    });
    time1 = time1 / 60
    time1 = Math.floor(time1 * 10) / 10
    tempRay[item.id].time = time1;
    tempRay[item.id].weight = weight1;
    ray=tempRay
    setWorkoutRay(tempRay)
    setVolume(parseInt(volume) + parseInt(weight))
  }

  const [fullVolume, setFullVolume] = useState(0)
  const updateTime = () => {
    var time = 0;
    var volume = 0;
    ray.forEach(workout => {
      time += workout.time
      volume += workout.totalWeight
    });
    var hours = Math.floor(time / 60)
    var secs = Math.floor((time % 1) * 60)
    time = Math.floor(time)
    var h;
    var m;
    var s;
    if (hours < 10) {
      var h = 0 + '' + hours
    }
    else {
      var h = hours
    }
    if (time < 10) {
      var m = 0 + '' + time
    }
    else {
      var m = time
    }
    if (secs < 10) {
      var s = 0 + '' + secs
    }
    else {
      var s = secs
    }
    setFullVolume(volume)
    setFullTime(h + ':' + m + ':' + s)
  }
  const updateTime1 = () => {
    var time = 0;
    var volume = 0;
    workoutRay.forEach(workout => {
      time += workout.time
      volume += workout.totalWeight
    });
    var hours = Math.floor(time / 60)
    var secs = Math.floor((time % 1) * 60)
    time = Math.floor(time)
    var h;
    var m;
    var s;
    if (hours < 10) {
      var h = 0 + '' + hours
    }
    else {
      var h = hours
    }
    if (time < 10) {
      var m = 0 + '' + time
    }
    else {
      var m = time
    }
    if (secs < 10) {
      var s = 0 + '' + secs
    }
    else {
      var s = secs
    }
    setFullVolume(volume)
    setFullTime(h + ':' + m + ':' + s)
  }
  const [randomDate, setRandomDate] = useState({ date: '10/05/2003', name: '' })

  const [isReady, setIsReady] = useState(false)

  const [dt, setDt] = useState(0);

  useEffect(() => {
    var temp = 0
    let secTimer = setInterval(() => {
      temp += 1
      //console.log(temp)
      const hours = Math.floor(temp / 60 / 60)
      const minutes = Math.floor(temp / 60)
      var h;
      var m;
      var s;
      if (hours < 10) {
        var h = 0 + '' + hours
      }
      else {
        var h = hours
      }
      if (minutes < 10) {
        var m = 0 + '' + minutes
      }
      else {
        var m = minutes
      }
      if (temp % 60 < 10) {
        var s = 0 + '' + temp % 60
      }
      else {
        var s = temp % 60
      }
      setDt(h + ':' + m + ':' + s)
    }, 1000)

    return () => clearInterval(secTimer);
  }, []);

  useEffect(() => {
    async function doStuff(){
      ray = [];
      setWorkoutRay([]);
      const q = query(collection(firestore, path));
      const querySnapshot1 = await getDocs(q)
      querySnapshot1.forEach((doc) => {
        onLoadWorkoutRay(doc.data().name, doc.data().shownName, doc.data().time)
      });
      updateTime()
    }
    doStuff();
  },[])


  useEffect(() => {
    async function doStuff(){
      ray = workoutRay;
      startTimer()
      const today = new Date()
      const yyyy = today.getFullYear();
      let mm = today.getMonth() + 1; // Months start at 0!
      let dd = today.getDate();
      if (dd < 10) dd = '0' + dd;
      if (mm < 10) mm = '0' + mm;
      const final = mm + '/' + dd + '/' + yyyy;

      //see if in DateHistory if todays day exists and if it does set randomDate to it
      //and if now then make it and set random date to it
      var dateExists = false;
      var dateName;
      const q1 = query(collection(firestore, 'users/' + user + '/DateHistory'));
      const querySnapshot2 = await getDocs(q1);
      querySnapshot2.forEach((doc) => {
        if (doc.data().date == final) {
          dateExists = true;
          dateName = doc.data().name
        }
      });
      const random = makeDocName()
      if (dateExists) {
        setRandomDate({ name: dateName, date: final })
      }
      else {
        await setDoc(doc(firestore, 'users/' + user + '/DateHistory', random), {
          date: final,
          name: random
        });
        setRandomDate({ name: random, date: final })
      }

      InteractionManager.runAfterInteractions(() => {
        setIsReady(true)
        updateTime()
      })
    }
    doStuff();
    
  }, [isFocused])

  //Actually edit day name, input is editDayInput
  const editDayName = async (input) => {
    setEditDayModalVisible(false)
    const found = workoutRay.some(p => p.shownName == input)
    if (!found) {
      if (input != '') {
        let newRay = [...workoutRay];
        newRay[dayClicked.id].shownName = input;
        setWorkoutRay(newRay);
        await setDoc(doc(firestore, 'users/' + user + '/Program/' + currentPlan.name + '/Days/' + day.name + '/Workouts', dayClicked.name), {
          shownName: input,
          name: workoutRay[dayClicked.id].name,
          time: workoutRay[dayClicked.id].time
        });
        setDayClicked({ name: dayClicked.name, shownName: input, id: dayClicked.id })
        setEditDayInput('')
      }
    }
  }

  var ray = []
  const onLoadWorkoutRay = async (name, shownName, time, id) => {
    let reps = 0;
    let time1 = 0;
    let totalWeight = 0;
    const q = query(collection(firestore, path + '/' + name + '/Sets'));
    const querySnapshot1 = await getDocs(q);
    querySnapshot1.forEach((doc) => {
      
      totalWeight+= parseInt(doc.data().weight)

      if (reps != '') {
        reps = reps + 1;
      }
      else {
        reps = reps + 1;

      }
      time1 = time1 + parseInt(doc.data().timer) + 20;
      
    });
    time1 = time1 / 60
    time1 = Math.floor(time1 * 10) / 10
    ray.push({ id: workoutRay.length, name: name, shownName: shownName, time: time1, reps: reps, sc: 0, totalWeight: totalWeight })
    await setDoc(doc(firestore,  path, name), {
      name: name,
      shownName: shownName,
      time: time1
    });
    setWorkoutRay(workoutRay => [...workoutRay, { id: workoutRay.length, name: name, shownName: shownName, time: time1, reps: reps, sc: 0, totalWeight: totalWeight }])
    updateTime()
  }

  const deleteWorkout = async (item) => {
    const lastWorkoutName = item.name;
    setEditDayModalVisible(false)
    await deleteDoc(doc(firestore, 'users/' + user + '/Program/' + currentPlan.name + '/Days/' + day.name + '/Workouts', lastWorkoutName));
    setWorkoutRay(workoutRay.filter(item => item.name !== lastWorkoutName))
  }

  const addWorkout = async () => {
    const found = workoutRay.some(p => p.shownName == input)
    if (!found) {
      if (input != '') {
        setInput("")
        const randomName = makeDocName()
        setWorkoutRay(workoutRay => [...workoutRay, { id: workoutRay.length, name: randomName, shownName: input, time: 1.3, reps: 1, sc: 0 }])
        await setDoc(doc(firestore, path, randomName), {
          shownName: input,
          name: randomName,
          time: 1.3
        });
        console.log('Pushed Workout ' + randomName + " " + input)
        await setDoc(doc(firestore, path + '/' + randomName + '/Sets', 'Set0'), {
          reps: 10,
          weight: 10,
          timer: 60,
          id: 0
        });
        console.log('Pushed One Set into ' + randomName + " " + input)
      }
      else {
        console.log('Blank Input')
      }
    }
    else {
      console.log('Already used')
    }
    updateTime1()
  }

  const navigateToSets = (item) => {
    navigation.navigate('OneSet', { user, item, currentPlan, currentDay, randomDate, onGoBack: (item, sc, weight, sets) => fromSetScreen(item, sc, weight, sets) })
  }

  const makeDocName = () => {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (var i = 0; i < 25; i++)
      text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
  }

  const openModal = (item) => {
    setDayClicked(item),
      setEditDayModalVisible(true)
  }

  const changeInput = (text1) => {
    const text = text1.substring(0, 20)
    setInput(text)
  }

  const [stopwatchStart, setStopwatchStart] = useState(false);
  const startTimer = () => {
    setStopwatchStart(true)
  }

  const confirmDeleteWorkout = (item) => {
    return Alert.alert(
      "Are your sure?",
      "Are you sure you want to delete "+item.shownName+"?",
      [
        // The "Yes" button
        {
          text: "Yes",
          onPress: () => {
             deleteWorkout(item)
          },
        },
        // The "No" button
        // Does nothing but dismiss the dialog when tapped
        {
          text: "No",
        },
      ]
    );
   };

  if (!isReady) {
    return (
      <View flex={1} backgroundColor="#0C0C1C" justifyContent='center'>
        <ActivityIndicator />
      </View>
    )

  }
  return (
    <View style={styles.container}>
      <Modal
        animationType="slide"
        transparent={true}
        visible={editDayModalVisible}
        backgroundColor='#ffffff'
        onRequestClose={() => { setEditDayModalVisible(!editDayModalVisible) }}
      >
        <TouchableOpacity style={styles.modalContainer} onPress={() => { setEditDayModalVisible(!editDayModalVisible) & setEditDayInput('') }}>
          <TouchableOpacity style={styles.modal} onPress={() => console.log('do nothing')} activeOpacity={1} >
            <View style={styles.planView}>
              <View style={styles.modalTitleTextHolder}>
                <Text allowFontScaling={false} style={styles.modalTitleText}>Previous Name: </Text>
                <Text allowFontScaling={false} style={styles.modalTitleTextWhite}>{dayClicked.shownName}</Text>
              </View>
              <View style={styles.underline} />
              <TextInput allowFontScaling={false} placeholderTextColor="rgba(154,154,154,1)" value={editDayInput} placeholder='New Name' style={styles.modalTextInput} onChangeText={text => setEditDayInput(text)} />
              <TouchableOpacity style={styles.testButton} onPress={() => editDayName(editDayInput)}>
                <Text allowFontScaling={false} style={styles.planText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.testButton} onPress={() => confirmDeleteWorkout(dayClicked)}>
                <Text allowFontScaling={false} style={styles.planText}>Delete</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.testButton} onPress={() => setEditDayModalVisible(!editDayModalVisible) & setEditDayInput('')}>
                <Text allowFontScaling={false} style={styles.planText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
      <Text allowFontScaling={false} style={styles.Title}>{day.shownName}</Text>
      <TouchableOpacity style={styles.Back} onPress={() => backBtn()}>
        <Ionicons name="close-circle-outline" size={normalize(40)} color={COLORS.tertiary} />
      </TouchableOpacity>
      <View style={styles.infoHolder}>
        <View style={styles.infoContainer}>
          <Text allowFontScaling={false} style={styles.infoTitle}> Time: </Text>
          <View allowFontScaling={false} style={styles.infoLine} />
          <Text allowFontScaling={false} style={styles.infoSubtitle}>{dt}</Text>
          <Text allowFontScaling={false} style={styles.infoText}>{fullTime}</Text>
        </View>
        <View style={styles.infoContainer}>
          <Text allowFontScaling={false} style={styles.infoTitle}> Volume: </Text>
          <View style={styles.infoLine} />
          <Text allowFontScaling={false} style={styles.infoSubtitle}> {volume} </Text>
          <Text allowFontScaling={false} style={styles.infoText}>{fullVolume}</Text>
        </View>
      </View>
      <ScrollView style={styles.daysScrollHolder}>
        {
          workoutRay.map((item) => {
            return (
              <TouchableOpacity key={item.name} style={styles.eachDayHolder} onPress={() => navigateToSets(item)}>
                <View style={styles.dayContainer}>
                  <Text allowFontScaling={false} style={styles.dayTitle}>{item.shownName}</Text>
                  <View style={styles.bottomRow}>
                    <View style={styles.imageContainer}>
                      <View style={styles.imageHolder}>
                        {/* Put image here */}
                      </View>
                    </View>
                    <View style={styles.timeContainer}>
                      <Text allowFontScaling={false} style={styles.trTitle}> Time: </Text>
                      <View style={styles.holdTimeMin}>
                        <Text allowFontScaling={false} style={styles.trSubtitle}>{'~' + item.time}</Text>
                        <Text allowFontScaling={false} style={styles.trMinText}>min</Text>
                      </View>
                    </View>
                    <View style={styles.repsContainer}>
                      <Text allowFontScaling={false} style={styles.trTitle}> Sets: </Text>
                      <Text allowFontScaling={false} style={styles.trSubtitle}>{item.reps}</Text>
                    </View>
                  </View>
                  <View>
                    {/* Add edit day modal to this screen and make cicle button in right spot */}
                    <TouchableOpacity
                      onPress={() => openModal(item)}
                      style={styles.roundButton1}
                    >
                      <Ionicons style={styles.image} name="ellipsis-vertical-circle-outline" size={normalize(25)} color={COLORS.secondaryText} />
                    </TouchableOpacity>
                  </View>
                </View>


              </TouchableOpacity>
            )
          })
        }
        <View style={styles.addDayHolder}>
          <View style={styles.underline3} />
          <TextInput allowFontScaling={false} placeholderTextColor="rgba(154,154,154,1)" value={input} placeholder='workout name' style={styles.textInput} onChangeText={text => changeInput(text)}></TextInput>
          <TouchableOpacity onPress={() => addWorkout(input)} style={styles.AddDayButton}>
            <Text allowFontScaling={false} style={styles.AddDayText}>Add</Text></TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  )
}
export { WorkoutScreen }

const styles = StyleSheet.create({

  container: {
    flex: 1,
    height: '100%',
    backgroundColor: COLORS.background,
    alignItems: 'center'
  },
  Title: {
    top: normalizeHeight(40),
    position: 'absolute',
    fontFamily: "Times New Roman",
    color: COLORS.primary,
    fontSize: normalize(50),
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
  image: {
    flex: 1,
    width: null,
    height: null,
    borderRadius: 15,
  },
  infoHolder: {
    backgroundColor: COLORS.itemBackground,
    top: normalizeHeight(115),
    height: normalizeHeight(135),
    width: normalizeWidth(325),
    borderRadius: 15,
    borderColor: COLORS.primaryBorder,
    borderWidth: 1,
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: normalizeWidth(5),
  },
  infoContainer: {
    flex: 1,
    height: '100%',
    alignItems: 'center'
  },
  infoTitle: {
    fontFamily: "Times New Roman",
    color: COLORS.secondaryText,
    fontSize: normalize(24),
    top: normalizeHeight(15),
    textAlign: 'center'
  },
  infoSubtitle: {
    fontFamily: "Times New Roman",
    color: COLORS.tertiary,
    fontSize: normalize(36),
    top: normalizeHeight(18),
    textAlign: 'center'
  },
  infoText: {
    fontFamily: "Times New Roman",
    color: COLORS.secondaryText,
    fontSize: normalize(24),
    top: normalizeHeight(24),
    textAlign: 'center'
  },
  infoLine: {
    width: normalizeWidth(120),
    top: normalizeHeight(62),
    borderWidth: 1,
    borderColor: COLORS.secondaryText
  },
  daysScrollHolder: {
    borderRadius: 15,
    position: 'absolute',
    top: normalizeHeight(275),
    width: '95%',
    height: normalizeHeight(520),
    flex: 1,
    backgroundColor: COLORS.itemBackground,
    borderWidth: 1,
    alignSelf: 'center',
    alignContent: 'center',
  },
  eachDayHolder: {
    width: '95%',
    height: normalizeHeight(115),
    top: normalizeHeight(10),
    borderRadius: 15,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
    marginBottom: normalizeHeight(10),
    alignSelf: 'center',
    backgroundColor: COLORS.itemBackground2,
  },
  addDayHolder: {
    top: normalizeHeight(10),
    marginBottom: normalizeHeight(10),
    flexDirection: 'row',
    alignSelf: 'center',
    alignContent: 'center',
    paddingBottom: normalizeHeight(20),
  },
  AddDayText: {
    fontFamily: "Times New Roman",
    color: COLORS.black,
    fontSize: normalize(24),
    margin: normalizeHeight(5),
    borderRadius: 15,
    alignSelf: 'center',
  },
  textInput: {
    marginRight: normalizeWidth(10),
    width: normalizeWidth(175),
    marginBottom: normalizeHeight(10),
    paddingVertical: normalizeHeight(6),
    borderRadius: 15,
    borderWidth: 1,
    borderColor: COLORS.tertiary,
    alignSelf: 'center',
    fontFamily: "Times New Roman",
    color: "#fff",
    fontSize: normalize(24),
    backgroundColor: COLORS.itemBackground2,
    textAlign: 'center',
  },
  AddDayButton: {
    alignSelf: 'center',
    fontFamily: "Times New Roman",
    fontSize: normalize(24),
    height: normalizeHeight(40),
    width: normalizeWidth(60),
    borderWidth: 1,
    marginBottom: normalizeHeight(10),
    marginLeft: normalizeWidth(5),
    backgroundColor: COLORS.tertiary,
    borderRadius: 15,
  },
  dayContainer: {
    width: '100%',
    height: '100%',
    flexDirection: 'column'
  },
  dayTitle: {
    fontFamily: "Times New Roman",
    color: COLORS.primary,
    fontSize: normalize(28),
    top: normalizeHeight(4),
    textAlign: 'center'
  },
  roundButton1: {
    position: 'absolute',
    borderColor: COLORS.primaryBorder,
    zIndex: 10,
    right: normalizeWidth(6),
    top: normalizeHeight(-103),
    width: normalizeHeight(30),
    height: normalizeHeight(25),
    borderRadius: 100,
  },
  bottomRow: {
    flexDirection: 'row',
    height: normalizeHeight(80),
    top: normalizeHeight(8),
    width: '100%'
  },
  imageContainer: {
    flex: 1,
    height: '100%'
  },
  timeContainer: {
    flex: 1,
    height: '100%'
  },
  repsContainer: {
    flex: 1,
    height: '100%'
  },
  trTitle: {
    fontFamily: "Times New Roman",
    color: COLORS.secondaryText,
    fontSize: normalize(18),
    top: normalizeHeight(5),
    textAlign: 'center'
  },
  trSubtitle: {
    fontFamily: "Times New Roman",
    color: COLORS.primary,
    fontSize: normalize(28),
    top: normalizeHeight(10),
    textAlign: 'center'
  },
  imageHolder: {
    top: normalizeHeight(5),
    borderWidth: 1,
    borderRadius: 15,
    width: normalizeWidth(80),
    height: normalizeHeight(60),
    backgroundColor: COLORS.itemBackground,
    alignSelf: 'center'
  },
  trMinText: {
    fontFamily: "Times New Roman",
    color: COLORS.primary,
    fontSize: normalize(18),
    top: normalizeHeight(13),
    left: normalizeWidth(2),
    textAlign: 'center'
  },
  holdTimeMin: {
    flexDirection: 'row',
    alignSelf: 'center',
    alignItems: 'center'
  },
  modalContainer: {
    flex: 1,
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
  modalTitleTextHolder: {
    flexDirection: 'column',
    alignItems: 'center',
    height: normalizeHeight(60),
  },
  modalTitleText: {
    fontFamily: "Times New Roman",
    color: COLORS.secondaryText,
    height: normalizeHeight(34),
    width: normalizeWidth(130),
    top: normalizeHeight(-10),
    fontSize: normalize(18)
  },
  modalTitleTextWhite: {
    fontFamily: "Times New Roman",
    color: COLORS.primary,
    textAlign: 'center',
    height: normalizeHeight(34),
    width: normalizeWidth(400),
    top: normalizeHeight(-16),
    fontSize: normalize(22)
  },
  modalTextInput: {
    width: normalizeWidth(200),
    top: normalizeHeight(5),
    paddingVertical: normalizeHeight(5),
    borderRadius: 15,
    borderWidth: 1,
    borderColor: COLORS.tertiary,
    alignSelf: 'center',
    fontFamily: "Times New Roman",
    color: COLORS.primary,
    fontSize: normalize(34),
    backgroundColor: COLORS.itemBackground,
    textAlign: 'center',
  },
  underline: {
    borderWidth: 1,
    borderColor: COLORS.secondaryText,
    width: normalizeWidth(165),
    position: 'absolute',
    alignSelf: 'center',
    top: normalizeHeight(138),
  },
  planText: {
    fontFamily: "Times New Roman",
    color: COLORS.primary,
    top: normalizeHeight(8),
    flex: 1,
    fontSize: normalize(18),
    textAlign: 'center',
    textAlignVertical: 'center',
    alignSelf: 'center'
  },
  testButton: {
    marginTop: normalizeHeight(30),
    width: normalizeWidth(104),
    height: normalizeHeight(40),
    borderColor: COLORS.tertiary,
    borderWidth: 1,
    alignSelf: 'center',
    alignContent: 'center',
    backgroundColor: COLORS.itemBackground,
    borderRadius: 15,
  },
  planView: {
    paddingVertical: normalizeHeight(30),
    paddingHorizontal: normalizeWidth(30),
    flexDirection: 'column'
  },
  underline3: {
    borderWidth: 1,
    borderColor: COLORS.secondaryText,
    left: normalizeWidth(12),
    width: normalizeWidth(150),
    position: 'absolute',
    alignSelf: 'center',
    top: normalizeHeight(33),
  },
})