import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View, TextInput, Alert, Modal, ScrollView, TouchableOpacity } from 'react-native';
import { firestore, auth, handleSignout } from '../Firebase';
import { getFirestore, deleteDoc, query, getDoc, where, getDocs, setDoc, doc, collection } from 'firebase/firestore';
import { Dimensions, Platform, PixelRatio } from 'react-native';
import { COLORS, setColors, resetColors } from '../components/colors';
import { ColorPicker, TriangleColorPicker } from 'react-native-color-picker'
import Ionicons from 'react-native-vector-icons/Ionicons';


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



export default function Settings({ navigation }) {

    const [pickerVisible, setPickerVisible] = useState()
    const [selectedCategory, setSelectedCategory] = useState()
    const [counter, setCounter] = useState(0)

    const backBtn = () => {
        navigation.goBack()
    }

    const reset = () =>{
        resetColors()
        setCounter(counter+1)
    }

    const changeColor = (color) => {
        setPickerVisible(false)
        if(selectedCategory==0){
            setColors('primary', color)
            setCounter(counter+1)
        }
        if(selectedCategory==1){
            setColors('secondary', color)
            setCounter(counter+1)
        }
        if(selectedCategory==2){
            setColors('tertiary', color)
            setCounter(counter+1)
        }
        if(selectedCategory==3){
            setColors('text', color)
            setCounter(counter+1)
        }
        setCounter(counter+1)

    }

    return (
        <View style={[styles.container, {backgroundColor: COLORS.background}]}>
            <TouchableOpacity style={styles.Back} onPress={() => backBtn()}>
                    <Ionicons name="arrow-back-circle-outline" size={normalize(40)} color={COLORS.tertiary} />
                </TouchableOpacity>
            <View style={styles.title}>
                <Text allowFontScaling={false} style={[styles.fitness, {color: COLORS.primary}]}>Settings</Text>
            </View>
            <Text style={[styles.sectionTitle, {color: COLORS.primary}]}>
                Colors:
            </Text>
            <View style={[styles.colors, {backgroundColor: COLORS.itemBackground}]}>
                <View style={styles.section}>
                    <Text style={[styles.subHeader, {color: COLORS.primary}]}>
                        Back
                    </Text>
                    <TouchableOpacity style={[styles.primary, {backgroundColor: COLORS.background}]} onPress={()=>setSelectedCategory(0)&setPickerVisible(true)}/>
                </View>
                <View style={styles.section}>
                    <Text style={[styles.subHeader, {color: COLORS.primary}]}>
                        Items
                    </Text>
                    <TouchableOpacity style={[styles.secondary, {backgroundColor: COLORS.itemBackground}]} onPress={()=>setSelectedCategory(1)&setPickerVisible(true)}/>
                </View>
                <View style={styles.section}>
                    <Text style={[styles.subHeader, {color: COLORS.primary}]}>
                        Accent
                    </Text>
                    <TouchableOpacity style={[styles.tertiary, {backgroundColor: COLORS.tertiary}]} onPress={()=>setSelectedCategory(2)&setPickerVisible(true)}/>
                </View>
                <View style={styles.section}>
                    <Text style={[styles.subHeader, {color: COLORS.primary}]}>
                        Text
                    </Text>
                    <TouchableOpacity style={[styles.text, {backgroundColor: COLORS.primary}]}  onPress={()=>setSelectedCategory(3)&setPickerVisible(true)}/>
                </View>
            </View>
            <TouchableOpacity style={styles.resetButton} onPress={()=>reset()}>
                    <Text style={styles.textButton}>
                        Reset
                    </Text>
                </TouchableOpacity>
            {pickerVisible ?
                <View style={styles.pickerContainer}>
                    <TriangleColorPicker
                        onColorSelected={color => changeColor(color)}
                        style={{ height: '90%' }}
                    />
                    <Text style={{ textAlign: 'center', top: -21, backgroundColor: 'white', width: '35%', left: '32%' }}>
                        - Select Color -
                    </Text>
                    <View style={{ flexDirection: 'row' }}>
                        <TouchableOpacity style={{ flex: 1 }} onPress={()=>setPickerVisible(false)}>
                            <Text style={{ textAlign: 'center', top: -17, fontSize: 20, backgroundColor: 'white' }}>
                                Cancel
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
                :
                <View />
            }
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
        alignItems: 'center'
    },
    resetButton:{
        height: 50,
        top: 150,
        width: 100,
        borderRadius: 15,
        borderWidth: 1,
        alignSelf: 'center',
        backgroundColor: COLORS.tertiary
    },
    textButton:{
        top: normalizeHeight(10),
        height: normalize(40),
        alignSelf: 'center',
        position: 'absolute',
        fontFamily: "Times New Roman",
        color: COLORS.black,
        fontSize: normalize(24),
    },
    pickerContainer: {
        backgroundColor: 'red',
        height: 300,
        width: 300,

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
    fitness: {
        fontFamily: "Times New Roman",
        color: COLORS.primary,
        fontSize: normalize(48),
        width: normalizeWidth(200),
        height: normalizeHeight(80)
    },
    title: {
        position: 'absolute',
        left: normalizeWidth(120),
        top: normalizeHeight(40),
    },
    sectionTitle: {
        fontFamily: "Times New Roman",
        color: COLORS.primary,
        fontSize: normalize(24),
        alignSelf: 'flex-start',
        marginLeft: 30,
        top: 110,
    },
    colors: {
        borderWidth: 2,
        borderColor: COLORS.tertiary,
        backgroundColor: COLORS.itemBackground,
        borderRadius: 10,
        height: 100,
        width: '90%',
        top: 120,
        flexDirection: 'row'
    },
    subHeader: {
        top: 5,
        fontFamily: "Times New Roman",
        color: COLORS.primary,
        fontSize: normalize(20),
        alignSelf: 'center'
    },
    section: {
        flex: 1,
    },
    primary: {
        width: '70%',
        height: 40,
        top: 15,
        alignSelf: 'center',
        backgroundColor: COLORS.background,
        borderWidth: 1,
        borderColor: COLORS.white,
        borderRadius: 10,
    },
    secondary: {
        width: '70%',
        height: 40,
        top: 15,
        alignSelf: 'center',
        backgroundColor: COLORS.itemBackground,
        borderWidth: 1,
        borderColor: COLORS.white,
        borderRadius: 10,
    },
    tertiary: {
        width: '70%',
        height: 40,
        top: 15,
        alignSelf: 'center',
        backgroundColor: COLORS.tertiary,
        borderWidth: 1,
        borderColor: COLORS.white,
        borderRadius: 10,
    },
    text: {
        width: '70%',
        height: 40,
        top: 15,
        alignSelf: 'center',
        borderWidth: 1,
        borderColor: COLORS.white,
        borderRadius: 10,
    },
})
