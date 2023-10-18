import React, { useState } from "react";
import { Image, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { handleSignIn } from "../Firebase"
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

const SignIn = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisibility] = React.useState({ name: "eye-off" });

  const goToSignUp = () => {
    navigation.navigate('SignUp')
  }

  const goToForgot = () => {
    navigation.navigate('ForgotPassword')
  }

  const ToggleVisibilty = () => {
    if (visible.name === "eye") {
      setVisibility({ name: "eye-off" });
    } else {
      setVisibility({ name: "eye" });
    }
  };

  const secureTextEntry = () => {
    if (visible.name === "eye") {
      return false;
    } else if (visible.name === "eye-off") {
      return true;
    }
  };

  const handleEmailChange = (text) => {
    setEmail(text);
  };

  const handlePasswordChange = (text) => {
    setPassword(text);
  };

  const handleSignInClick = async () => {
    await handleSignIn(email, password);
    console.log("Login successful");
  };

  const handleSubmit = async () => {
    if (email === "" || password === "") {
      console.error("Invalid Credentials");
    } else {
      try {
        await handleSignIn(email, password);
      } catch (error) {
        console.error(error);
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text
          adjustsFontSizeToFit
          style={{

            fontSize: normalize(36),
            fontFamily: "Times New Roman",
            color: "#fff",
          }}
        >
          Sign-in
        </Text>
      </View>
      <View style={styles.form}>
        <TextInput
          style={styles.email}
          defaultValue={email}
          onChangeText={handleEmailChange}
          textContentType="emailAddress"
          placeholder="Email Address"
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
        <Pressable style={styles.button} onPress={handleSignInClick}>
          <Text style={{ fontFamily: "Times New Roman", fontSize: normalize(20) }}>SIGN IN</Text>
        </Pressable>
        <Pressable
          onPress={() => goToSignUp()}
          style={{
            alignItems: "center",
            justifyContent: "center",
            top: "50%",
            width: '90%',
            height: normalizeHeight(30),
            alignSelf: 'center',
          }}
        >
          <Text
            adjustsFontSizeToFit
            style={{
              width: '100%',
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "Times New Roman",
              fontSize: normalize(16),
              textAlign: 'center',
              alignSelf: 'center',
              color: "white",
            }}
          >
            Click here to sign-up.
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

export { SignIn };

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
    paddingHorizontal: normalizeWidth(10),
    paddingVertical: normalizeHeight(10),
    fontSize: normalize(18),
    fontFamily: "Times New Roman",
    color: "#fff",
  },
  password: {
    width: "85%",
    height: normalizeHeight(60),
    borderRadius: 5,
    marginBottom: normalizeHeight(35),
    paddingHorizontal: normalizeWidth(10),
    paddingVertical: normalizeHeight(10),
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
    paddingHorizontal: normalizeWidth(10),
    paddingVertical: normalizeHeight(10),
  },

  forgot: {
    fontFamily: "Times New Roman",
    color: "#fff",
    fontSize: normalize(18),
  },

  forgotContainer: {
    top: normalizeHeight(-20),
    flexDirection: "row",
    alignSelf: "flex-end",
  },
});