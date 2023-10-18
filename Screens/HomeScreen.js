import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View, TextInput, Alert, Modal, ScrollView, TouchableOpacity } from 'react-native';
import { firestore, auth, handleSignout } from '../Firebase';
import { getFirestore, deleteDoc, query, getDoc, where, getDocs, setDoc, doc, collection } from 'firebase/firestore';
import { Dimensions, Platform, PixelRatio, InteractionManager, ActivityIndicator } from 'react-native';
import { COLORS } from '../components/colors';
import Ionicons from 'react-native-vector-icons/Ionicons';
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

export default function HomeScreen({ navigation }) {

  const isFocused = useIsFocused();
  const realUser = auth.currentUser
  const user = auth.currentUser.uid;
  const [currentPlan, setCurrentPlan] = useState({ shownName: '', name: '' });
  const [addDayInput, setAddDayInput] = useState('')
  const [addPlanInput, setAddPlanInput] = useState('')
  const [editDayInput, setEditDayInput] = useState('')
  const [plansRay, setPlansRay] = useState([])
  const [daysRay, setDaysRay] = useState([]);
  const [dayClicked, setDayClicked] = useState({ shownName: '', name: '', id: 0 })
  //PLAN MODAL and EDIT DAY MODAL Visibility
  const [planModalVisible, setPlanModalVisible] = useState(false);
  const [editDayModalVisible, setEditDayModalVisible] = useState(false);
  const [editDropDownVisible, setEditDropDownVisible] = useState(false);

  //Edit day clicked, item is item's name
  const editDayClicked = (item) => {
    setEditDayModalVisible(true)
    setDayClicked({ shownName: item.shownName, name: item.name, id: item.id })
  }
  //Actually edit day name, input is editDayInput
  const editDayName = async (input) => {
    setEditDayModalVisible(false)
    const found = daysRay.some(p => p.shownName == input)
    if (!found) {
      if (input != '') {
        let newRay = [...daysRay];
        newRay[dayClicked.id].shownName = input;
        setDaysRay(newRay);
        await setDoc(doc(firestore, 'users/' + user + '/Program/' + currentPlan.name + '/Days', dayClicked.name), {
          shownName: input,
          name: daysRay[dayClicked.id].name,
          date: daysRay[dayClicked.id].date,
          time: daysRay[dayClicked.id].time
        });
        setDayClicked({ name: dayClicked.name, shownName: input, id: dayClicked.id })
        setEditDayInput('')
      }
    }
  }

  const [isReady, setIsReady] = useState(false)
  const [counter, setCounter] = useState(0)
  //sends database docs to onLoadDayRay and onLoadPlanRay functions
  useEffect(() => {
    async function doStuff(){
      setDaysRay([])
      var userExists = false;
      const q0 = query(collection(firestore, "users"));
      const querySnapshot0 = await getDocs(q0);
      querySnapshot0.forEach((doc) => {
        // doc.data() is never undefined for query doc snapshots
        if (doc.data().id == user) {
          userExists = true
        }
      });
      if (!userExists) {
        await setDoc(doc(firestore, "users", user), {
          email: realUser.email,
          id: user,
          fullName: realUser.displayName,
        });
        const random = makeDocName();
        await setDoc(doc(firestore, "users/" + user + '/Program', random), {
          name: random,
          shownName: 'Basic',
        });
        const random1 = makeDocName();
        console.log('pushed basic program')
        await setDoc(doc(firestore, "users/" + user + '/UserInfo', 'LastPlan'), {
          name: random,
          shownName: 'Basic',
        });
        console.log('pushed basic into lastplan')
        setCounter(counter + 1)
      }
      setPlansRay([]);
      const q = query(collection(firestore, 'users/' + user + '/Program'));
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach((doc) => {
        // doc.data() is never undefined for query doc snapshots
        onLoadPlanRay(doc.data().name, doc.data().shownName)
      });
      InteractionManager.runAfterInteractions(() => {
        setIsReady(true)
      })
    }
    doStuff();
  }, [])

  useEffect(() => {
    async function doStuff(){
      const docRef = doc(firestore, 'users/' + user + '/UserInfo', "LastPlan");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setCurrentPlan({ name: docSnap.data().name, shownName: docSnap.data().shownName })
        updateDayTimes(docSnap.data().name)
      } else {
        // doc.data() will be undefined in this case
        console.log("No such document!");
      }
      setWeekRays()
    }
    doStuff();
  }, [])

  const updateDayTimes = async (name) => {
    setDaysRay([])
    const q = query(collection(firestore, 'users/' + user + '/Program/' + name + '/Days'));
    const querySnapshot1 = await getDocs(q);
    querySnapshot1.forEach((doc) => {
      onLoadDayRay(doc.data().name, doc.data().time, doc.data().date, doc.data().shownName, name)
    });
  }

  const weekRayLetter = ['S', 'M', 'T', 'W', 'Th', 'F', 'Sa']
  const [weekRay, setWeekRay] = useState([])
  const setWeekRays = async () => {
    var dateRay = []
    var datesInHistoryRay = []
    var curr = new Date; // get current date
    for (let index = 0; index <= 6; index++) {
      const temp = curr.getDate() - curr.getDay() + index
      const date = new Date(curr.setDate(temp))
      const yyyy = date.getFullYear();
      let mm = date.getMonth() + 1; // Months start at 0!
      let dd = date.getDate();
      if (dd < 10) dd = '0' + dd;
      if (mm < 10) mm = '0' + mm;
      const final = mm + '/' + dd + '/' + yyyy;
      dateRay.push(final)
    }
    const q1 = query(collection(firestore, 'users/' + user + '/DateHistory'));
    const querySnapshot2 = await getDocs(q1);
    querySnapshot2.forEach((doc) => {
      datesInHistoryRay.push(doc.data().date)
    });
    const today = new Date()
    const yyyy1 = today.getFullYear();
    let mm1 = today.getMonth() + 1; // Months start at 0!
    let dd1 = today.getDate();
    if (dd1 < 10) dd1 = '0' + dd1;
    if (mm1 < 10) mm1 = '0' + mm1;
    const final = mm1 + '/' + dd1 + '/' + yyyy1;
    //NOW DATERAY AND DATESINHISTORYRAY are set
    var tempWeekRay = []
    for (let index = 0; index < dateRay.length; index++) {
      var exists = false;
      var currentDay = false;
      if (dateRay[index] == final) {
        currentDay = true
      }
      for (let i = 0; i < datesInHistoryRay.length; i++) {
        if (dateRay[index] == datesInHistoryRay[i]) {
          exists = true
        }
      }
      if (exists && currentDay) {
        tempWeekRay.push({ id: index, workout: true, current: true })
      }
      else if (exists) {
        tempWeekRay.push({ id: index, workout: true, current: false })
      }
      else if (currentDay) {
        tempWeekRay.push({ id: index, workout: false, current: true })
      }
      else {
        tempWeekRay.push({ id: index, workout: false, current: false })
      }
    }
    setWeekRay(tempWeekRay)
  }

  //Sets dayray and plansray to what the database says, called from useEffect
  const onLoadDayRay = async (name, time, lastDate, shownName, planName) => {
    var ray = []
    const q = query(collection(firestore, 'users/' + user + '/Program/' + planName + '/Days/' + name + '/Workouts'));
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {
      // doc.data() is never undefined for query doc snapshots
      ray.push({ time: doc.data().time })
    });
    var time = 0;
    ray.forEach(workout => {
      time += workout.time
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
    setDaysRay(daysRay => [...daysRay, { id: daysRay.length, name: name, time: m, date: lastDate, shownName: shownName }])
  }
  const onLoadPlanRay = (name, shownName) => { setPlansRay(planRay => [...planRay, { id: planRay.length, name: name, shownName: shownName }]) }

  //Adds day to array and to database, input is addDayInput
  const addToDayRay = async (input) => {
    const found = daysRay.some(p => p.shownName == input)
    if (!found) {
      if (input != '') {
        const randomName = makeDocName()
        setDaysRay(daysRay => [...daysRay, { id: daysRay.length, name: randomName, time: 0, date: 0, shownName: input }])
        await setDoc(doc(firestore, 'users/' + user + '/Program/' + currentPlan.name + '/Days', randomName), {
          shownName: input,
          name: randomName,
          date: 0,
          time: 0,
        });
        console.log('Pushed Day ' + randomName)
        setAddDayInput('')
      }
      else {
        console.log('Blank Input')
      }
    }
    else {
      console.log('Already used')
    }
  }

  //Delete day, just day with lowest id, item is full item
  const deleteDay = async (item) => {
    const lastDayName = item.name
    setEditDayModalVisible(false);
    await deleteDoc(doc(firestore, 'users/' + user + '/Program/' + currentPlan.name + '/Days', lastDayName));
    setDaysRay(daysRay.filter(item => item.name !== lastDayName))
  }

  //when the big day button is clicked then navigate to workout with user and day clicked
  const clickOnDay = async (item) => {
    var oldShown = '';
    var oldName = '';
    const docRef = doc(firestore, 'users/' + user + '/Program/' + currentPlan.name + '/Days', item.name);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      oldShown = docSnap.data().shownName;
      oldName = docSnap.data().name;
    } else {
      console.log("No such document!");
    }
    const today = new Date()
    const yyyy1 = today.getFullYear();
    let mm1 = today.getMonth() + 1; // Months start at 0!
    let dd1 = today.getDate();
    if (dd1 < 10) dd1 = '0' + dd1;
    const final = mm1 + '/' + dd1;
    await setDoc(doc(firestore, 'users/' + user + '/Program/' + currentPlan.name + '/Days', item.name), {
      shownName: oldShown,
      name: oldName,
      date: final,
      time: 0,
    });
    navigation.navigate('Workout', { item, user, currentPlan })
  }

  const goToSettings = () => {
    setEditDropDownVisible(false)
    navigation.navigate('Settings', { user })
  }

  //Select active plan called from plan modal select button, item is full item
  const selectPlan = async (item) => {
    setPlanModalVisible(false)
    setCurrentPlan({ name: item.name, shownName: item.shownName })
    setDaysRay([])

    const q = query(collection(firestore, 'users/' + user + '/Program/' + item.name + '/Days'));
    const querySnapshot1 = await getDocs(q);
    querySnapshot1.forEach((doc) => {
      onLoadDayRay(doc.data().name, doc.data().time, doc.data().date, doc.data().shownName, item.name)
    });
    await setDoc(doc(firestore, 'users/' + user + '/UserInfo', 'LastPlan'), {
      shownName: item.shownName,
      name: item.name,
    });
    console.log('Selected Plan ' + item.shownName)
  }

  //delete plan from array and database called from plan modal, item is full item
  const deletePlan = async (item) => {
    if (plansRay.length > 1) {
      if (currentPlan == item.name) {
        if (plansRay[0].name != item.name) {
          selectPlan(plansRay[0])
        }
        else {
          selectPlan(plansRay[1])
        }
      }
      const planName = item.name
      await deleteDoc(doc(firestore, 'users/' + user + '/Program', planName));
      setPlansRay(plansRay.filter(item => item.name !== planName))
    }
  }

  //add plan to array and database called from plan modal, input is addPlan input
  const addPlan = async (input) => {
    const found = plansRay.some(p => p.name == input)
    if (!found) {
      if (input != '') {
        const randomName = makeDocName()
        setPlansRay(planRay => [...planRay, { id: planRay.length, name: randomName, shownName: input }])
        await setDoc(doc(firestore, 'users/' + user + '/Program', randomName), {
          name: randomName,
          shownName: input
        });
        console.log('Pushed Program ' + randomName)
        setAddPlanInput('')
      }
    }
  }

  const makeDocName = () => {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (var i = 0; i < 25; i++)
      text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
  }

  const signOut = () => {
    handleSignout()
  }


  const showConfirmDialog = () => {
   return Alert.alert(
     "Are your sure?",
     "Are you sure you want to sign-out?",
     [
       // The "Yes" button
       {
         text: "Yes",
         onPress: () => {
            signOut()
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

  //item is full item
  const confirmDeleteDay = (item) => {
    return Alert.alert(
      "Are your sure?",
      "Are you sure you want to delete "+item.shownName+"?",
      [
        // The "Yes" button
        {
          text: "Yes",
          onPress: () => {
             deleteDay(item)
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

   //item is full item
  const confirmDeletePlan = (item) => {
    return Alert.alert(
      "Are your sure?",
      "Are you sure you want to delete "+item.shownName+"?",
      [
        // The "Yes" button
        {
          text: "Yes",
          onPress: () => {
             deletePlan(item)
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
    <View style={[styles.container, { backgroundColor: COLORS.background }]}>
      {/* Plan Modal, active when plan is pressed at top */}
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
          <TouchableOpacity style={[styles.modal, { backgroundColor: COLORS.itemBackground }]} onPress={() => console.log('do nothing')} activeOpacity={1} >

            {
              plansRay.map((item) => {
                return (
                  <View key={item.name} style={styles.planView2} >
                    <Text allowFontScaling={false} style={styles.modalTitleTextWhite2}>
                      {item.shownName}
                    </Text>
                    <TouchableOpacity style={styles.testButton2}>
                      <Text allowFontScaling={false} style={styles.planText2}>Pencil</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.testButton2} onPress={() => selectPlan(item)}>
                      <Text allowFontScaling={false} style={styles.planText2}>Select</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.testButton2} onPress={() => confirmDeletePlan(item)}>
                      <Text allowFontScaling={false} style={styles.planText2}>Trash</Text>
                    </TouchableOpacity>
                  </View>
                )
              })
            }
            <View style={styles.planView}>

              <View style={styles.addDayHolder}>
                <TextInput allowFontScaling={false} value={addPlanInput} placeholderTextColor="rgba(154,154,154,1)" placeholder='Plan Name' style={styles.modalTextInput2} onChangeText={text => setAddPlanInput(text.substring(0, 8))} />
                <TouchableOpacity onPress={() => addPlan(addPlanInput)} style={styles.AddDayButton}>
                  <Text allowFontScaling={false} style={styles.AddDayText}>Add</Text>
                </TouchableOpacity>
                <View style={styles.underline2} />
              </View>
            </View>

          </TouchableOpacity>
        </TouchableOpacity>


      </Modal>
      <Modal
        animationType='fade'
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
              <TextInput placeholderTextColor="rgba(154,154,154,1)" value={editDayInput} placeholder='New Name' style={styles.modalTextInput} onChangeText={text => setEditDayInput(text.substring(0, 8))} />
              <View style={styles.underline} />
              <TouchableOpacity style={styles.testButton} onPress={() => editDayName(editDayInput)}>
                <Text allowFontScaling={false} style={styles.planText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.testButton} onPress={() => confirmDeleteDay(dayClicked)}>
                <Text allowFontScaling={false} style={styles.planText}>Delete Day</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.testButton} onPress={() => setEditDayModalVisible(!editDayModalVisible) & setEditDayInput('')}>
                <Text allowFontScaling={false} style={styles.planText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
      <View
        style={styles.backgroundImage}
      >
        <TouchableOpacity
          onPress={() => setEditDropDownVisible(!editDropDownVisible)}
          style={styles.roundButton}
        >
          <Ionicons style={styles.image5} name="settings-outline" size={normalize(60)} color={COLORS.secondaryText} />
        </TouchableOpacity>
        {/* Name of App and Welcome, 'user' are below */}
        <View style={styles.title}>
          <Text allowFontScaling={false} style={styles.fitness}>RyFit</Text>
          <Text allowFontScaling={false} style={styles.welcomeRyan}>Fitness Logger</Text>
        </View>
        <View style={styles.grayLine}></View>
        <TouchableOpacity style={styles.planHolder} onPress={() => setPlanModalVisible(true)}>
          <View
            style={styles.rect4}
          >
            <Text allowFontScaling={false} style={styles.bulkPlan}>{currentPlan.shownName}</Text>
          </View>
        </TouchableOpacity>
        <ScrollView style={styles.daysScrollHolder}>
          {
            daysRay.map((item) => {
              return (
                <TouchableOpacity key={item.name} style={styles.eachDayHolder} onPress={() => clickOnDay(item)}>

                  <View style={styles.topRow}>
                    <Text allowFontScaling={false} style={styles.dayTop}>Day {item.id + 1}:</Text>
                    <Text allowFontScaling={false} style={styles.timeTop}>Time:</Text>
                    <Text allowFontScaling={false} style={styles.dateTop}>Date:</Text>
                  </View>
                  <View style={styles.bottomRow}>
                    <Text allowFontScaling={false} style={styles.dayTitle}>{item.shownName}</Text>
                    <View style={styles.timeHolder}>
                      <Text allowFontScaling={false} style={styles.timeText}>{item.time}</Text>
                      <Text allowFontScaling={false} style={styles.min}>min</Text>
                    </View>
                    <Text allowFontScaling={false} style={styles.dateText}>{item.date == 0 ? 'N/A' : item.date}</Text>
                  </View>
                  <View>
                    {/* Add edit day modal to this screen and make cicle button in right spot */}
                    <TouchableOpacity
                      onPress={() => editDayClicked(item)}
                      style={styles.roundButton1}
                    >
                      <Ionicons style={styles.image} name="ellipsis-vertical-circle-outline" size={normalize(25)} color={COLORS.secondaryText} />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              )
            })
          }
          <View style={styles.addDayHolder}>
            <TextInput allowFontScaling={false} placeholderTextColor="rgba(154,154,154,1)" value={addDayInput} placeholder='day name' style={styles.textInput} onChangeText={text => setAddDayInput(text.substring(0, 8))}></TextInput>
            <View style={styles.underline3}></View>
            <TouchableOpacity onPress={() => addToDayRay(addDayInput)} style={styles.AddDayButton}>
              <Text allowFontScaling={false} style={styles.AddDayText}>Add</Text></TouchableOpacity>
          </View>
        </ScrollView>
        <View style={styles.weekHolder}>
          <Text allowFontScaling={false} style={styles.weekTitle}>
            This Week:
          </Text>
          <View style={styles.weekContainer}>
            <View style={styles.weekTopRow}>
              {weekRayLetter.map((item) => {
                return (
                  <View key={item} style={styles.topItem}>
                    <Text allowFontScaling={false} style={styles.weekTopText}>{item}</Text>
                  </View>
                )
              })}
            </View>
            <View style={styles.weekBottomRow}>
              {weekRay.map((item) => {
                if (item.current) {
                  return (
                    <View key={item.id} style={styles.itemBox}>
                      {item.workout ?
                        <View style={styles.itemCurrentWork} />
                        :
                        <View style={styles.itemCurrent} />
                      }
                    </View>
                  )
                }
                else {
                  if (item.workout) {
                    return (
                      <View key={item.id} style={styles.itemBox}>
                        <View style={styles.itemWork}>

                        </View>
                      </View>
                    )
                  }
                  else {
                    return (
                      <View key={item.id} style={styles.itemBox}>
                        <View style={styles.item}>

                        </View>
                      </View>
                    )
                  }
                }
              })}
            </View>
          </View>
        </View>
        {editDropDownVisible ?
          <TouchableOpacity style={styles.fullButton} onPress={() => setEditDropDownVisible(false)}>
            <View style={styles.dropDownMenu1}>
              {/* 
            <TouchableOpacity style={styles.dropDownOptions} onPress={() => goToSettings()}>
              <Text style={styles.dropDownText}>
                Settings
              </Text>
            </TouchableOpacity>
            */}
              <TouchableOpacity style={styles.dropDownOptions} onPress={() => showConfirmDialog()}>
                <Text style={styles.dropDownText}>
                  Sign Out
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
          :
          <View />
        }
      </View>
    </View>
  )

}
export { HomeScreen }

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  fullButton: {
    width: '100%',
    height: normalizeHeight(1000),
    top: normalizeHeight(-135)
  },
  image: {
    flex: 1,
    width: null,
    height: null,
    borderRadius: 15,
  },
  image5: {
    flex: 1,
    width: null,
    alignSelf: 'center',
    height: null,
    borderRadius: 15,
  },
  dropDownMenu: {
    position: 'absolute',
    height: normalizeHeight(100),
    borderRadius: 15,
    borderWidth: 1,
    backgroundColor: COLORS.itemBackground,
    width: normalizeWidth(200),
    top: normalizeHeight(90),
    right: normalizeWidth(50),
    opacity: 0,
  },
  dropDownMenu1: {
    position: 'absolute',
    height: normalizeHeight(50),
    borderRadius: 15,
    borderWidth: 1,
    backgroundColor: COLORS.itemBackground,
    width: normalizeWidth(200),
    top: normalizeHeight(90),
    right: normalizeWidth(50),
  },
  dropDownOptions: {
    flex: 1,
    backgroundColor: COLORS.itemBackground2,
    marginVertical: normalizeHeight(2),
    marginHorizontal: normalizeWidth(2),
    borderRadius: 15,
    borderWidth: 1,
  },
  dropDownText: {
    fontFamily: "Times New Roman",
    color: COLORS.secondaryText,
    height: normalizeHeight(34),
    width: normalizeWidth(130),
    top: normalizeHeight(8),
    left: normalizeWidth(15),
    fontSize: normalize(22)
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
  modalTitleTextHolder: {
    flexDirection: 'row',
    height: normalizeHeight(34),
  },
  modalTitleText: {
    fontFamily: "Times New Roman",
    color: COLORS.secondaryText,
    height: normalizeHeight(34),
    width: normalizeWidth(130),
    top: normalizeHeight(-10),
    fontSize: normalize(18)
  },
  modalTitleTextWhite2: {
    fontFamily: "Times New Roman",
    color: COLORS.primary,
    height: normalizeHeight(40),
    width: normalizeWidth(90),
    top: normalizeHeight(6),
    fontSize: normalize(22),
  },
  modalTitleTextWhite: {
    fontFamily: "Times New Roman",
    color: COLORS.primary,
    height: normalizeHeight(34),
    width: normalizeWidth(70),
    top: normalizeHeight(-13),
    fontSize: normalize(22)
  },
  underline: {
    borderWidth: 1,
    borderColor: COLORS.secondaryText,
    width: normalizeWidth(170),
    position: 'absolute',
    alignSelf: 'center',
    top: normalizeHeight(105),
  },
  underline2: {
    borderWidth: 1,
    borderColor: COLORS.secondaryText,
    left: normalizeWidth(12),
    width: normalizeWidth(125),
    position: 'absolute',
    alignSelf: 'center',
    top: normalizeHeight(37),
  },
  underline3: {
    borderWidth: 1,
    borderColor: COLORS.secondaryText,
    left: normalizeWidth(18),
    width: normalizeWidth(113),
    position: 'absolute',
    alignSelf: 'center',
    top: normalizeHeight(38),
  },
  modalTextInput2: {
    width: normalizeWidth(150),
    marginBottom: normalizeHeight(10),
    paddingVertical: normalizeHeight(5),
    borderRadius: 15,
    borderWidth: 1,
    borderColor: COLORS.tertiary,
    alignSelf: 'center',
    fontFamily: "Times New Roman",
    color: COLORS.primary,
    fontSize: normalize(28),
    backgroundColor: COLORS.itemBackground2,
    textAlign: 'center',
  },
  modalTextInput: {
    width: normalizeWidth(200),
    marginBottom: normalizeHeight(10),
    paddingVertical: normalizeHeight(5),
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#1da',
    alignSelf: 'center',
    fontFamily: "Times New Roman",
    color: "#fff",
    fontSize: normalize(34),
    backgroundColor: COLORS.itemBackground,
    textAlign: 'center',
  },
  planText: {
    fontFamily: "Times New Roman",
    color: COLORS.secondaryText,
    top: normalizeHeight(8),
    flex: 1,
    fontSize: normalize(18),
    textAlign: 'center',
    textAlignVertical: 'center',
    alignSelf: 'center'
  },
  planText2: {
    fontFamily: "Times New Roman",
    color: COLORS.secondaryText,
    top: normalizeHeight(10),
    flex: 1,
    fontSize: normalize(16),
    textAlign: 'center',
    textAlignVertical: 'center',
    alignSelf: 'center'
  },
  testButton: {
    marginTop: normalizeHeight(30),
    width: normalizeWidth(104),
    height: normalizeHeight(40),
    borderWidth: 1,
    borderColor: '#1da',
    alignSelf: 'center',
    alignContent: 'center',
    backgroundColor: COLORS.itemBackground,
    borderRadius: 15,
  },
  testButton2: {
    borderRadius: 15,
    width: normalizeWidth(50),
    height: normalizeHeight(40),
    marginLeft: normalizeWidth(5),
    alignContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.tertiary,
    backgroundColor: COLORS.itemBackground2
  },
  testButton3: {
    borderRadius: 15,
    width: normalizeWidth(50),
    height: normalizeHeight(50),
    marginRight: normalizeWidth(5),
    alignContent: 'center',
    backgroundColor: COLORS.tertiary
  },
  planView: {
    paddingVertical: normalizeHeight(30),
    paddingHorizontal: normalizeWidth(30),
    flexDirection: 'column'
  },
  planView2: {
    marginTop: normalizeHeight(15),
    paddingHorizontal: normalizeWidth(20),
    height: normalizeHeight(60),
    flexDirection: 'row',
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.background,
  },
  roundButton: {
    position: 'absolute',
    right: normalizeWidth(0),
    top: normalizeHeight(45),
    width: normalizeHeight(83),
    height: normalizeHeight(83),
    borderRadius: 100,
  },
  roundButton1: {
    borderColor: COLORS.primaryBorder,
    position: 'absolute',
    right: normalizeWidth(0),
    top: normalizeHeight(-73),
    width: normalizeHeight(30),
    height: normalizeHeight(25),
    borderRadius: 100,
  },
  welcomeRyan: {
    fontFamily: "Times New Roman",
    color: COLORS.secondaryText,
    height: normalizeHeight(34),
    width: normalizeWidth(200),
    top: normalizeHeight(-10),
    fontSize: normalize(24)
  },
  fitness: {
    fontFamily: "Times New Roman",
    color: COLORS.primary,
    fontSize: normalize(64),
    width: normalizeWidth(200),
    height: normalizeHeight(80)
  },
  title: {
    position: 'absolute',
    left: normalizeWidth(20),
    top: normalizeHeight(40),
  },
  grayLine: {
    top: normalizeHeight(175),
    width: '100%',
    position: "absolute",
    borderWidth: 1,
    borderColor: COLORS.secondaryText
  },
  planHolder: {
    position: 'absolute',
    top: normalizeHeight(160),
    alignSelf: 'center',
  },
  rect4: {
    width: normalizeWidth(97),
    height: normalizeHeight(30),
    borderRadius: 7,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
    backgroundColor: COLORS.tertiary,
  },
  bulkPlan: {
    fontFamily: "Times New Roman",
    color: COLORS.black,
    height: normalizeHeight(29),
    top: normalizeHeight(2),
    width: normalizeWidth(97),
    fontSize: normalize(22),
    textAlign: "center"
  },
  AddDayButton: {
    color: COLORS.primary,
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
  AddDayText: {
    fontFamily: "Times New Roman",
    color: COLORS.black,
    fontSize: normalize(24),
    margin: normalizeHeight(5),
    borderRadius: 15,
    alignSelf: 'center',
  },
  textInput: {
    marginRight: 5,
    width: normalizeWidth(150),
    marginBottom: normalizeHeight(10),
    paddingVertical: normalizeHeight(8),
    borderRadius: 15,
    borderWidth: 1,
    borderColor: COLORS.tertiary,
    alignSelf: 'center',
    fontFamily: "Times New Roman",
    color: COLORS.primary,
    fontSize: normalize(24),
    backgroundColor: COLORS.itemBackground2,
    textAlign: 'center',
  },
  daysScrollHolder: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
    position: 'absolute',
    top: normalizeHeight(200),
    width: '95%',
    height: '52%',
    flex: 1,
    alignSelf: 'center',
    alignContent: 'center',
    backgroundColor: COLORS.itemBackground,

  },
  eachDayHolder: {
    width: '95%',
    height: normalizeHeight(90),
    top: normalizeHeight(10),
    borderRadius: 15,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
    marginBottom: normalizeHeight(10),
    alignSelf: 'center',
    backgroundColor: COLORS.itemBackground2,

  },
  dayImageStyle: {
    flex: 1,
  },
  dayTop: {
    fontFamily: "Times New Roman",
    color: COLORS.secondaryText,
    fontSize: normalize(20),
    width: '45%'
  },
  timeTop: {
    fontFamily: "Times New Roman",
    color: COLORS.secondaryText,
    fontSize: normalize(18),
    width: '30%'
  },
  dateTop: {
    fontFamily: "Times New Roman",
    color: COLORS.secondaryText,
    fontSize: normalize(18),
    width: '40%'
  },
  dayTitle: {
    fontFamily: "Times New Roman",
    color: COLORS.primary,
    fontSize: normalize(30),
    width: '45%'
  },
  timeHolder: {
    width: '30%',
    flexDirection: 'row',
    alignContent: 'center'
  },
  timeText: {
    fontFamily: "Times New Roman",
    color: COLORS.primary,
    fontSize: normalize(30),
  },
  min: {
    fontFamily: "Times New Roman",
    color: COLORS.primary,
    fontSize: normalize(14),
    marginTop: normalizeHeight(15),
    marginLeft: normalizeWidth(3),
  },
  dateText: {
    fontFamily: "Times New Roman",
    color: COLORS.primary,
    fontSize: normalize(30),
    width: '30%',
  },
  topRow: {
    marginTop: normalizeHeight(10),
    flexDirection: 'row',
    marginHorizontal: '4%'
  },
  bottomRow: {
    marginTop: normalizeHeight(10),
    flexDirection: 'row',
    marginHorizontal: '4%'
  },
  addDayHolder: {
    top: normalizeHeight(10),
    marginBottom: normalizeHeight(20),
    flexDirection: 'row',
    alignSelf: 'center',
    alignContent: 'center'
  },
  weekHolder: {
    width: '90%',
    height: normalizeHeight(135),
    borderRadius: 15,
    alignSelf: 'center',
    top: normalizeHeight(618),
    alignItems: 'center'
  },
  weekTitle: {
    fontFamily: "Times New Roman",
    color: COLORS.primary,
    fontSize: normalize(24),
    textAlign: 'center'
  },
  weekContainer: {
    height: normalizeHeight(83),
    width: '90%',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
    top: normalizeHeight(5),
    backgroundColor: COLORS.itemBackground
  },
  weekTopRow: {
    flexDirection: 'row',
    height: normalizeHeight(25),
    width: '95%',
    alignSelf: 'center',
    alignItems: 'center'
  },
  topItem: {
    flex: 1,
    top: normalizeHeight(7),

  },
  weekTopText: {
    fontFamily: "Times New Roman",
    color: COLORS.secondaryText,
    fontSize: normalize(20),
    top: normalizeHeight(3),
    textAlign: 'center'
  },
  weekBottomRow: {
    flexDirection: 'row',
    height: normalizeHeight(80),
    width: '95%',
    alignSelf: 'center',
    alignItems: 'center',
  },
  itemBox: {
    height: normalizeHeight(35),
    top: normalizeHeight(-5),
    borderRadius: 5,
    flex: 1,
  },
  item: {
    alignSelf: 'center',
    width: '70%',
    height: '80%',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
    backgroundColor: COLORS.background,
  },
  itemWork: {
    alignSelf: 'center',
    width: '70%',
    height: '80%',
    borderRadius: 5,
    borderWidth: 2,
    borderColor: COLORS.primaryBorder,
    backgroundColor: COLORS.itemBackground3,
  },
  itemCurrent: {
    alignSelf: 'center',
    width: '90%',
    top: normalizeHeight(-4),
    borderWidth: 2,
    borderColor: COLORS.tertiary,
    height: '100%',
    borderRadius: 5,
    backgroundColor: COLORS.background,
  },
  itemCurrentWork: {
    alignSelf: 'center',
    width: '90%',
    top: normalizeHeight(-4),
    borderWidth: 3,
    borderColor: COLORS.tertiary,
    height: '100%',
    borderRadius: 5,
    backgroundColor: COLORS.itemBackground3,
  }
})