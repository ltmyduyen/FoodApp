import React, { useContext } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/AppNavigator";
import { AuthContext } from "../../context/AuthContext";

type Props = NativeStackScreenProps<RootStackParamList, "GetStarted">;
const { width, height } = Dimensions.get("window");

const GetStartedScreen: React.FC<Props> = ({ navigation }) => {
  const { setGuestMode } = useContext(AuthContext);

  return (
    <View style={styles.container}>
      {/* Ảnh nền full màn hình */}
      <Image
        source={require("../images/bite.png")}
        style={styles.backgroundImage}
        resizeMode="stretch"
      />

      {/* Lớp phủ mờ nhẹ cho chữ dễ đọc */}
      <View style={styles.overlay} />

      {/* Các nút chức năng */}
      <View style={styles.buttonContainer}>
        {/* Nút Đăng nhập */}
        <TouchableOpacity
          style={[styles.button, styles.loginButton]}
          onPress={() =>
            navigation.navigate("Auth", { initialTab: "login" })
          }
        >
          <Text style={[styles.text, { color: "#00B14F" }]}>Đăng nhập</Text>
        </TouchableOpacity>

        {/* Nút Đăng ký */}
        <TouchableOpacity
          style={[styles.button, styles.registerButton]}
          onPress={() =>
            navigation.navigate("Auth", { initialTab: "register" })
          }
        >
          <Text style={[styles.text, { color: "black" }]}>Đăng ký</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default GetStartedScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#CDDC39", // 
    alignItems: "center",
    justifyContent: "center",
  },
  backgroundImage: {
    position: "absolute",
    top: 0,
    left: 0,
    width: width,
    height: height,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(251, 245, 245, 0)", // phủ lớp mờ nhẹ để chữ nổi
  },
  buttonContainer: {
    position: "absolute",
    bottom: 80,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  button: {
    width: 250, // ✅ nhỏ lại như lúc đầu
    paddingVertical: 12,
    borderRadius: 25,
    marginVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  loginButton: {
    backgroundColor: "#fff", // nền trắng
  },
  registerButton: {
    borderWidth: 1.2,
    borderColor: "black",
    backgroundColor: "rgba(255,255,255,0.9)",
  },
  text: {
    fontSize: 15,
    fontWeight: "bold",
  },
});
