import React, { useEffect, useState, useRef } from 'react';
import { Image, StyleSheet, Text, View,TextInput, Alert, Modal, ScrollView, TouchableOpacity } from 'react-native';
import { firestore, auth, handleSignout } from '../Firebase';
import { getFirestore, deleteDoc, query, getDoc, where, getDocs, setDoc, doc, collection } from 'firebase/firestore';
import { Dimensions, Platform, PixelRatio, InteractionManager, ActivityIndicator } from 'react-native';
import { COLORS } from '../components/colors';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {LineChart} from 'react-native-chart-kit';

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

export function dateDifference(date2, date1) {
    const _MS_PER_DAY = 1000 * 60 * 60 * 24;

    // Discard the time and time-zone information.
    const utc1 = Date.UTC(date1.getFullYear(), date1.getMonth(), date1.getDate());
    const utc2 = Date.UTC(date2.getFullYear(), date2.getMonth(), date2.getDate());

    return Math.floor((utc2 - utc1) / _MS_PER_DAY);
}



var top;
export default function Graph({ route, navigation }) {
    const user = auth.currentUser.uid;
    const containerRef = useRef(0);
    //send as item with .name and .shownName
    var { workout, h } = route.params;
    const [top, setTop] = useState(0)
    useEffect(() => {
        if (h == 100) {
            setTop(0)
        }
        else {
            setTop(normalizeHeight(-30))
        }
    }, [])
    if (workout == null) {
        workout = { name: 'suhih', shownName: 'Bench' }
    }

    const graphTypeRay = [{ name: 'Volume', id: 0 }, { name: '1RM', id: 1 }, { name: 'Weight', id: 2 }];
    const [currentGraphType, setCurrentGraphType] = useState(2);

    const graphTimeRay = [{ name: '1W', id: 0 }, { name: '1M', id: 1 }, { name: '3M', id: 2 }, { name: '6M', id: 3 }, { name: '1Y', id: 4 }, { name: 'ALL', id: 5 }];
    const [currentGraphTime, setCurrentGraphTime] = useState(5);

    const width = Dimensions.get('window').width - normalizeWidth(25)
    const height = normalizeHeight(220)

    const backBtn = () => {
        navigation.goBack()
    }

    const graphTimePress = (item) => {
        setCurrentGraphTime(item)
        var indexRay = sortDataSet(item)
        var tempoRay=[];
        var tempoRay1=[];
        for (let index = 0; index < dataSets[currentGraphType].length; index++) {
            var foundIndex =  false;
            indexRay.forEach(element => {
                if(element==index){
                    foundIndex=true
                }
            });
            if(foundIndex){
                tempoRay.push(dataSets[currentGraphType][index])
                tempoRay1.push(dateRay[index])
            }
        }
        if(tempoRay.length==0){
            tempoRay.push(0)
        }
        if(tempoRay1.length>4){
            var tempRay2 = [];
            var indexRay2 = [];
            const num = tempoRay1.length%4;
            if(num ==0){
                indexRay2 = tempoRay1;
            }else if(num ==1){
                indexRay2 = tempoRay1;
                indexRay2.splice(1,1)
            }else if(num ==2){
                indexRay2 = tempoRay1;
                indexRay2.splice(1,1)
                indexRay2.splice(3,1)
            }else if(num ==3){
                indexRay2 = tempoRay1;
                indexRay2.splice(5,1)
                indexRay2.splice(3,1)
                indexRay2.splice(1,1)
            }
            const num2 = indexRay2.length/4
            for (let index = 0; index < indexRay2.length; index++) {
                if (index%num2==0){
                    tempRay2.push(indexRay2[index])
                }
            }
        }
        else{
            tempRay2=tempoRay1
        }
        setData({
            labels: tempRay2,
            datasets: [{
                data: tempoRay,
                color: (opacity = 1) => `rgba(17, 255, 172, ${opacity})` // optional
            }
            ],
        })
    }

    const graphTypePress = (item) => {
        setCurrentGraphType(item)

        var tempoRay1=dateRay;
        if(tempoRay1.length>4){
            var tempRay2 = [];
            var indexRay2 = [];
            const num = tempoRay1.length%4;
            if(num ==0){
                indexRay2 = tempoRay1;
            }else if(num ==1){
                indexRay2 = tempoRay1;
                indexRay2.splice(1,1)
            }else if(num ==2){
                indexRay2 = tempoRay1;
                indexRay2.splice(1,1)
                indexRay2.splice(3,1)
            }else if(num ==3){
                indexRay2 = tempoRay1;
                indexRay2.splice(5,1)
                indexRay2.splice(3,1)
                indexRay2.splice(1,1)
            }
            const num2 = indexRay2.length/4
            for (let index = 0; index < indexRay2.length; index++) {
                if (index%num2==0){
                    tempRay2.push(indexRay2[index])
                }
            }
        }
        else{
            tempRay2=tempoRay1
        }
        setData({
            labels: tempRay2,
            datasets: [{
                data: dataSets[item],
                color: (opacity = 1) => `rgba(17, 255, 172, ${opacity})` // optional
            }
            ],
        })
        setCurrentGraphTime(5)
        const ray = dataSets[item]
        setRecords(ray)
    }

    const [indexRay, setIndexRay] = useState([])
    const [isReady, setIsReady] = useState(false)
    const [dataNotReady, setDataNotReady] = useState(true)
    const [mostOneRMRay, setMostOneRMRay] = useState([])
    const [mostWeightRay, setMostWeightRay] = useState([])
    const [totalVolumeRay, setTotalVolumeRay] = useState([])
    const [dateRay, setDateRay] = useState([])

    useEffect(() => {
        async function doStuff(){
            setDateRay([])
            setTotalVolumeRay([])
            setMostOneRMRay([])
            setMostWeightRay([])
            const q5 = query(collection(firestore, 'users/' + user + '/WorkoutHistory/' + workout.name + '/Dates'));
            const querySnapshot5 = await getDocs(q5)
            //for each date
            var tempRay5 = []
            querySnapshot5.forEach(async (doc) => {
                tempRay5.push({ date: doc.data().date, name: doc.data().name })
            })
            tempRay5.sort(function (a, b) {
                return new Date(a.date) - new Date(b.date);
            });
            tempRay5.forEach(element => {
                setDateRay(dateRay => [...dateRay, element.date])
            });
            for (let index = 0; index < tempRay5.length; index++) {
                var mostWeight = 0;
                var totalVolume = 0;
                var mostOneRM = 0;
                //for each set that date
                const q = query(collection(firestore, 'users/' + user + '/WorkoutHistory/' + workout.name + '/Dates/' + tempRay5[index].name + '/Sets'));
                const querySnapshot = await getDocs(q);
                querySnapshot.forEach((doc1) => {
                    if (doc1.data().oneRM > mostOneRM) {
                        mostOneRM = doc1.data().oneRM;
                    }
                    if (doc1.data().weight > mostWeight) {
                        mostWeight = doc1.data().weight;
                    }
                    totalVolume += doc1.data().reps * doc1.data().weight;
                });
                setMostOneRMRay(mostOneRMRay => [...mostOneRMRay, mostOneRM]);
                setMostWeightRay(mostWeightRay => [...mostWeightRay, mostWeight]);
                setTotalVolumeRay(totalVolumeRay => [...totalVolumeRay, totalVolume]);
                if (index == tempRay5.length - 1) {
                    setDataNotReady(false)
                }
            }
        }
        doStuff();
        
    }, [])

    useEffect(() => {
        if (!dataNotReady) {
            var tempDataSet = [totalVolumeRay, mostOneRMRay, mostWeightRay]
            try {
                setDataSets([totalVolumeRay, mostOneRMRay, mostWeightRay])
            } finally {
                var tempoRay1 = dateRay
                if(tempoRay1.length>4){
                    var tempRay2 = [];
                    var indexRay2 = [];
                    const num = tempoRay1.length%4;
                    if(num ==0){
                        indexRay2 = tempoRay1;
                    }else if(num ==1){
                        indexRay2 = tempoRay1;
                        indexRay2.splice(1,1)
                    }else if(num ==2){
                        indexRay2 = tempoRay1;
                        indexRay2.splice(1,1)
                        indexRay2.splice(3,1)
                    }else if(num ==3){
                        indexRay2 = tempoRay1;
                        indexRay2.splice(5,1)
                        indexRay2.splice(3,1)
                        indexRay2.splice(1,1)
                    }
                    const num2 = indexRay2.length/4
                    for (let index = 0; index < indexRay2.length; index++) {
                        if (index%num2==0){
                            tempRay2.push(indexRay2[index])
                        }
                    }
                }
                else{
                    tempRay2=tempoRay1
                }
                setData({
                    labels: tempRay2,
                    datasets: [{
                        data: tempDataSet[currentGraphType],
                        color: (opacity = 1) => `rgba(17, 255, 172, ${opacity})` // optional
                    }
                    ],
                })
                const ray = tempDataSet[currentGraphType];
                setRecords(ray)
            }
            InteractionManager.runAfterInteractions(() => {
                setIsReady(true)
            })
        }
    }, [dataNotReady])

    const sortDataSet = (time) => {
        const d2 = new Date()
        var tempDataSet = [];
        if (time == 5) {
            for (let index = 0; index < dateRay.length; index++) {
                tempDataSet.push(index)
            }
        }
        else if (time == 4) {
            for (let index = 0; index < dateRay.length; index++) {
                var months;
                const d1 = new Date(dateRay[index]);
                months = (d2.getFullYear() - d1.getFullYear()) * 12;
                months -= d1.getMonth();
                months += d2.getMonth();
                if (months == 12) {
                    if (d1.getDate() >= d2.getDate()) {
                        tempDataSet.push(index)
                    }
                }
                else if (months < 12) {
                    tempDataSet.push(index)
                }
            }
        }
        else if (time == 3) {
            for (let index = 0; index < dateRay.length; index++) {
                var months;
                const d1 = new Date(dateRay[index]);
                months = (d2.getFullYear() - d1.getFullYear()) * 12;
                months -= d1.getMonth();
                months += d2.getMonth();
                if (months == 6) {
                    if (d1.getDate() >= d2.getDate()) {
                        tempDataSet.push(index)
                    }
                }
                else if (months < 6) {
                    tempDataSet.push(index)
                }
            }
        }
        else if (time == 2) {
            for (let index = 0; index < dateRay.length; index++) {
                var months;
                const d1 = new Date(dateRay[index]);
                months = (d2.getFullYear() - d1.getFullYear()) * 12;
                months -= d1.getMonth();
                months += d2.getMonth();
                if (months == 3) {
                    if (d1.getDate() >= d2.getDate()) {
                        tempDataSet.push(index)
                    }
                }
                else if (months < 3) {
                    tempDataSet.push(index)
                }
            }
        }
        else if (time == 1) {
            for (let index = 0; index < dateRay.length; index++) {
                var months;
                const d1 = new Date(dateRay[index]);
                months = (d2.getFullYear() - d1.getFullYear()) * 12;
                months -= d1.getMonth();
                months += d2.getMonth();
                if (months == 1) {
                    if (d1.getDate() >= d2.getDate()) {
                        tempDataSet.push(index)
                    }
                }
                else if (months < 1) {
                    tempDataSet.push(index)
                }
            }
        }
        else if (time == 0) {
            for (let index = 0; index < dateRay.length; index++) {
                const d1 = new Date(dateRay[index])
                if (Math.round((d2 - d1) / (1000 * 60 * 60 * 24)) <= 7) {
                    tempDataSet.push(index)
                }
            }
        }
        return tempDataSet
    }

    const getIndexValues = (dataset) => {
        var tempRay = []
        for (let index = 0; index < dataset.length; index++) {
            if (indexRay.length > 0) {
                for (let i = 0; i < indexRay.length; i++) {
                    if (index == indexRay[i]) {
                        tempRay.push(dataset[index])
                    }
                }
            }
            else {
                tempRay.push(dataset[index])
            }
        }
        return tempRay
    }

    const pointClick = (index) => {
        const temp1 = getIndexValues(dataSets[currentGraphType])
        const temp2 = getIndexValues(workoutDates)
        console.log('number: ' + temp1[index])
        console.log('date: ' + temp2[index])
    }

    const [dataSets, setDataSets] = useState([
        //Volume
        [50, 20, 2, 86, 71, 100, 150, 200],
        //1rm
        [10, 20, 2, 86, 71, 110, 180, 210],
        //Weight
        [0, 20, 2, 86, 71, 200, 225, 290]]
    )

    var workoutDates = ['10/12/2020', '10/20/2020', '10/04/2021', '1/29/2022', '2/05/2022', '3/06/2022', '4/03/2022', '4/04/2022'];

    const [records, setRecord] = useState([
        //MAX
        { name: 'Max', id: 0, number: 250, date: '10/05/03' }, { name: 'Min', id: 1, number: 135, date: '10/05/03' }, { name: '3M Max', id: 2, number: 250, date: '10/05/03' }, { name: '3M Min', id: 3, number: 200, date: '10/05/03' }, { name: 'First Day', id: 4, number: 135, date: '10/05/03' }, { name: 'Last Day', id: 5, number: 200, date: '10/05/03' }
    ])
    const setRecords = (ray) => {
        const d2 = new Date()
        var max = { num: -1, date: '' };
        var min = { num: 1000000000000000, date: '' };
        var first = { num: 0, date: '' };
        var last = { num: 0, date: '' };
        var tempDataSet = [];
        for (let index = 0; index < dateRay.length; index++) {
            tempDataSet.push({ num: ray[index], date: dateRay[index] })
            first = { num: ray[index], date: dateRay[index] }
            last = { num: ray[index], date: dateRay[index] }
        }
        for (let index = 0; index < tempDataSet.length; index++) {
            if (tempDataSet[index].num > max.num) {
                max = { num: tempDataSet[index].num, date: tempDataSet[index].date }
            }
            if (tempDataSet[index].num < min.num) {
                min = { num: tempDataSet[index].num, date: tempDataSet[index].date }
            }
            const tempDate = new Date(tempDataSet[index].date)
            const tempDate1 = new Date(first.date)
            if (tempDate < tempDate1) {
                first = { num: tempDataSet[index].num, date: tempDataSet[index].date }
            }
            const tempDate2 = new Date(last.date)
            if (tempDate > tempDate2) {
                last = { num: tempDataSet[index].num, date: tempDataSet[index].date }
            }
        }
        var max1 = { num: 889889889889, date: 'N/A' };
        var min1 = { num: 889889889889, date: 'N/A' };
        var tempDataSet1 = [];
        for (let index = 0; index < dateRay.length; index++) {
            var months;
            const d1 = new Date(dateRay[index]);
            months = (d2.getFullYear() - d1.getFullYear()) * 12;
            months -= d1.getMonth();
            months += d2.getMonth();
            if (months == 3) {
                if (d1.getDate() >= d2.getDate()) {
                    tempDataSet1.push({ num: ray[index], date: dateRay[index] })
                    max1 = { num: ray[index], date: dateRay[index] }
                    min1 = { num: ray[index], date: dateRay[index] }
                }
            }
            else if (months < 3) {
                tempDataSet1.push({ num: ray[index], date: dateRay[index] })
                max1 = { num: ray[index], date: dateRay[index] }
                min1 = { num: ray[index], date: dateRay[index] }
            }
        }
        for (let index = 0; index < tempDataSet1.length; index++) {
            if (tempDataSet1[index].num > max1.num) {
                max1 = { num: tempDataSet1[index].num, date: tempDataSet1[index].date }
            }
            //console.log(tempDataSet1[index].num)
            //console.log(min1.num)

            if (tempDataSet1[index].num < min1.num) {
                min1 = { num: tempDataSet1[index].num, date: tempDataSet1[index].date }
            }
        }
        setRecord([{ name: 'Max', id: 0, number: max.num, date: max.date }, { name: 'Min', id: 1, number: min.num, date: min.date }, { name: '3M Max', id: 2, number: max1.num, date: max1.date }, { name: '3M Min', id: 3, number: min1.num, date: min1.date }, { name: 'First Day', id: 4, number: first.num, date: first.date }, { name: 'Last Day', id: 5, number: last.num, date: last.date }])
    }

    const [data, setData] = useState({
        labels: workoutDates,
        datasets: [{
            data: dataSets[currentGraphType],
            color: (opacity = 1) => `rgba(17, 255, 172, ${opacity})` // optional
        }
        ],
    })

    const chartConfig =

    {
        decimalPlaces: 1,
        backgroundGradientFrom: COLORS.background,
        backgroundGradientTo: COLORS.background,
        color: (opacity = 1) => `rgba(255,255,255, ${opacity})`,
        labelColor: (opacity = 1) => `rgba(255,255,255, ${opacity})`,
        marginVertical: normalizeHeight(10),
        textAlign: 'center',
        barPercentage: 1,
        barRadius: .5,
        fontSize: normalize(24),
    }

    if (!isReady) {
        return (
            <View flex={1} backgroundColor="#0C0C1C" justifyContent='center'>
                <ActivityIndicator />
            </View>
        )
    }

    return (
        <View style={styles.background}>
            <View ref={containerRef} style={[styles.container, { top: top }]}>
                <Text allowFontScaling={false} style={styles.Title}>{workout.shownName}</Text>
                <TouchableOpacity style={styles.Back} onPress={() => backBtn()}>
                    <Ionicons name="arrow-back-circle-outline" size={normalize(40)} color={COLORS.tertiary} />
                </TouchableOpacity>

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
                                    <TouchableOpacity style={styles.chartOptionsButton} onPress={() => graphTypePress(item.id)}>
                                        <Text allowFontScaling={false} style={styles.chartOptionsText}>
                                            {item.name}
                                        </Text>
                                    </TouchableOpacity>
                                }
                            </View>
                        )
                    })}

                </View>
                <View style={styles.graphHolder}>
                    <LineChart
                        onDataPointClick={({ index }) => pointClick(index)}
                        segments={4}
                        yAxisSuffix=""
                        yAxisInterval={1} // optional, defaults to 1                            
                        data={data}
                        width={width}
                        height={height}
                        chartConfig={chartConfig}
                        bezier
                    />
                </View>
                <View style={styles.chartOptions1}>
                    {graphTimeRay.map(item => {
                        return (
                            <View key={item.id} flex={1}>
                                {item.id == currentGraphTime ?
                                    <TouchableOpacity style={styles.chartOptionsButton2}>
                                        <Text allowFontScaling={false} style={styles.chartOptionsText}>
                                            {item.name}
                                        </Text>
                                    </TouchableOpacity>
                                    :
                                    <TouchableOpacity style={styles.chartOptionsButton1} onPress={() => graphTimePress(item.id)}>
                                        <Text allowFontScaling={false} style={styles.chartOptionsText}>
                                            {item.name}
                                        </Text>
                                    </TouchableOpacity>
                                }
                            </View>

                        )
                    })}
                </View>
                <View style={styles.recordHolder}>
                    {records.map(item => {
                        if (item.id % 2 == 0) {
                            return (
                                <View key={item.id} flex={1}>
                                    <View style={styles.rows}>
                                        <View style={styles.columns}>
                                            <Text allowFontScaling={false} style={styles.recordTitles}>{records[item.id].name}</Text>
                                            {records[item.id].number!=889889889889?
                                            <Text allowFontScaling={false} style={styles.recordText}>{records[item.id].number}</Text>
                                            :
                                            <Text allowFontScaling={false} style={styles.recordText}>N/A</Text>
                                            }
                                            <Text allowFontScaling={false} style={styles.recordSubtitles}>{records[item.id].date}</Text>
                                        </View>
                                        <View style={styles.columns}>
                                            <Text allowFontScaling={false} style={styles.recordTitles}>{records[item.id + 1].name}</Text>
                                            {records[item.id+1].number!=889889889889?
                                            <Text allowFontScaling={false} style={styles.recordText}>{records[item.id+1].number}</Text>
                                            :
                                            <Text allowFontScaling={false} style={styles.recordText}>N/A</Text>
                                            }
                                            <Text allowFontScaling={false} style={styles.recordSubtitles}>{records[item.id + 1].date}</Text>
                                        </View>
                                    </View>
                                </View>
                            )
                        }
                    })}
                </View>
            </View>
        </View>
    )
}
export { Graph }



const styles = StyleSheet.create({

    background: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    container: {
        width: '100%',
        height: '100%',
        backgroundColor: COLORS.background,
        alignItems: 'center',
    },
    container2: {
        top: normalizeHeight(-30),
        flex: 1,
        height: '100%',
        backgroundColor: COLORS.background,
        alignItems: 'center',
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
    graphHolder: {
        height: normalizeHeight(230),
        top: normalizeHeight(115),
    },
    image: {
        flex: 1,
        width: null,
        height: null,
        borderRadius: 15,
    },
    Title: {
        top: normalizeHeight(50),
        position: 'absolute',
        fontFamily: "Times New Roman",
        color: COLORS.primary,
        fontSize: normalize(30),
        alignSelf: 'center',
    },
    chartOptions: {
        backgroundColor: COLORS.itemBackground,
        borderRadius: 15,
        top: normalizeHeight(100),
        height: normalizeHeight(50),
        width: normalizeWidth(300),
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
    chartOptions1: {
        backgroundColor: COLORS.itemBackground,
        borderRadius: 15,
        top: normalizeHeight(112),
        height: normalizeHeight(50),
        width: normalizeWidth(350),
        paddingHorizontal: normalizeWidth(10),
        flexDirection: 'row',
        borderWidth: 1,
    },
    chartOptionsButton1: {
        flex: 1,
        backgroundColor: COLORS.itemBackground2,
        marginHorizontal: normalizeWidth(2),
        borderRadius: 15,
        marginVertical: normalizeHeight(10),
        borderWidth: 1,
        borderColor: COLORS.primaryBorder
    },
    chartOptionsButton2: {
        flex: 1,
        backgroundColor: COLORS.itemBackground2,
        marginHorizontal: normalizeWidth(2),
        borderRadius: 15,
        marginVertical: normalizeHeight(10),
        borderWidth: 1,
        borderColor: COLORS.tertiary
    },
    recordHolder: {
        backgroundColor: COLORS.itemBackground,
        borderRadius: 15,
        height: normalizeHeight(350),
        width: normalizeWidth(350),
        top: normalizeHeight(125),
    },
    rows: {
        flex: 1,
        flexDirection: 'row',
        alignContent: 'center',
    },
    columns: {
        flex: 1,
        top: normalizeHeight(7),
    },
    recordTitles: {
        position: 'relative',
        fontFamily: "Times New Roman",
        color: COLORS.primary,
        fontSize: normalize(24),
        alignSelf: 'center',
    },
    recordSubtitles: {
        position: 'relative',
        fontFamily: "Times New Roman",
        color: COLORS.secondaryText,
        fontSize: normalize(20),
        alignSelf: 'center',
    },
    recordText: {
        position: 'relative',
        fontFamily: "Times New Roman",
        color: COLORS.tertiary,
        fontSize: normalize(48),
        alignSelf: 'center',
    }

})