import React, { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, Image, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { handleSignUp } from "../Firebase";
import { Dimensions, Platform, PixelRatio } from 'react-native';

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


const SignUp = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [visible, setVisibility] = React.useState({ name: "eye-off" });

  const backToSignIn = () => {
    navigation.goBack()
  }

  //Toggles the eye icon to show the password
  const ToggleVisibilty = () => {
    if (visible.name === "eye") {
      setVisibility({ name: "eye-off" });
    } else {
      setVisibility({ name: "eye" });
    }
  };

  //Handles password visibility when the eye icon is pressed
  const secureTextEntry = () => {
    if (visible.name === "eye") {
      return false;
    } else if (visible.name === "eye-off") {
      return true;
    }
  };

  const handleNameChange = (text) => {
    setName(text);
  };

  //Handles email input
  const handleEmailChange = (text) => {
    setEmail(text);
  };

  //Handles password input
  const handlePasswordChange = (text) => {
    setPassword(text);
  };

  //Handles confirm password input
  const handleConfirmPasswordChange = (text) => {
    setConfirmPassword(text);
  };

  //Handles sign up
  const handleSubmit = async () => {
    if (email === "" || password !== confirmPassword || password === "" || confirmPassword === "") {
      console.error("Invalid Credentials");
    } else {
      try {
        handleSignUp(email, password, name);
      } catch (error) {
        console.error(error);
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={{ fontSize: normalize(40), fontFamily: "Times New Roman", color: "#fff" }}>Create Account</Text>
        <Image
          style={{
            height: normalizeHeight(30),
            width: normalizeWidth(50),
            top: normalizeHeight(9),
            marginRight: normalizeWidth(5),
          }}
        />
      </View>
      <View style={styles.form}>
        <TextInput
          style={styles.email}
          defaultValue={email}
          onChangeText={handleEmailChange}
          textContentType="emailAddress"
          placeholder="Email Address"
          placeholderTextColor="grey"
          keyboardType="email-address"
          returnKeyType="next"
        />
        <TextInput
          style={styles.email}
          defaultValue={name}
          onChangeText={handleNameChange}
          placeholder="First Name"
          placeholderTextColor="grey"
          returnKeyType="next"
        />
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.password}
            defaultValue={password}
            onChangeText={handlePasswordChange}
            placeholder="Enter Password"
            placeholderTextColor="grey"
            returnKeyType="next"
            secureTextEntry={secureTextEntry()}
            textContentType="password"
            keyboardType="default"
            autoCorrect={false}
          />
          <Ionicons
            name={visible.name}
            size={normalize(24)}
            color="#1da"
            style={styles.eyeContainer}
            onPress={ToggleVisibilty}
          />
        </View>
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.password}
            defaultValue={confirmPassword}
            onChangeText={handleConfirmPasswordChange}
            placeholder="Confirm Password"
            placeholderTextColor="grey"
            returnKeyType="go"
            secureTextEntry={secureTextEntry()}
            textContentType="password"
            keyboardType="default"
            autoCorrect={false}
          />
          <Ionicons
            name={visible.name}
            size={normalize(24)}
            color="#1da"
            style={styles.eyeContainer}
            onPress={ToggleVisibilty}
          />
        </View>
        <Pressable style={styles.button} onPress={handleSubmit}>
          <Text style={{ fontFamily: "Times New Roman", fontSize: normalize(20) }}>SIGN UP</Text>
        </Pressable>
        <Pressable
          onPress={backToSignIn}
          style={{
            alignItems: "center",
            justifyContent: "center",
            top: "15%",
            height: normalizeHeight(30),
          }}
        >
          <Text
            style={{
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "Times New Roman",
              fontSize: normalize(16),
              color: "white",
            }}
          >
            Have an account? Back to sign-in
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

export { SignUp };

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: "100%",
    backgroundColor: "#0C0C1C",
  },
  headerContainer: {
    flexDirection: "row",
    width: "80%",
    height: normalizeHeight(50),
    marginBottom: normalizeHeight(40),
    top: normalizeHeight(-20),
  },
  form: {
    width: "80%",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    top: normalizeHeight(-40),
  },
  email: {
    width: "100%",
    height: normalizeHeight(60),
    backgroundColor: "#0ff1",
    borderRadius: 5,
    marginBottom: normalizeHeight(35),
    paddingVertical: normalizeHeight(10),
    paddingHorizontal: normalizeWidth(10),
    fontSize: normalize(18),
    fontFamily: "Times New Roman",
    color: "#fff",
  },
  password: {
    width: "85%",
    height: normalizeHeight(60),
    borderRadius: 5,
    marginBottom: normalizeHeight(35),
    paddingVertical: normalizeHeight(10),
    paddingHorizontal: normalizeWidth(10),
    fontSize: normalize(18),
    fontFamily: "Times New Roman",
    color: "#fff",
  },

  passwordContainer: {
    flexDirection: "row",
    width: "100%",
    height: normalizeHeight(60),
    backgroundColor: "#0ff1",
    borderRadius: 5,
    marginBottom: normalizeHeight(35),
  },
  eyeContainer: {
    position: "absolute",
    right: normalizeWidth(10),
    top: normalizeHeight(17),
  },

  button: {
    width: "100%",
    height: normalizeHeight(50),
    backgroundColor: "#1da",
    borderRadius: 5,
    justifyContent: "center",
    alignItems: "center",
    top: normalizeHeight(30),
    paddingVertical: normalizeHeight(10),
    paddingHorizontal: normalizeWidth(10),
  },

  register: {
    fontFamily: "Times New Roman",
    color: "#fff",
    fontSize: normalize(18),
  },
  registerContainer: {
    top: normalizeHeight(-20),
    flexDirection: "row",
    alignSelf: "flex-end",
  },
});