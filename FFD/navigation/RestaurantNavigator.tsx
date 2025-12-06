import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

// ===== Screens =====
import RestaurantScreen from "../screens/restaurant/Dashboard";
import OrderManage from "../screens/restaurant/OrderManage";
import RevenueScreen from "../screens/restaurant/RevenueScreen"; // 👈 thêm doanh thu
import RestaurantAccountScreen from "../screens/restaurant/RestaurantAccount";

const Tab = createBottomTabNavigator();

export default function RestaurantNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          height: 78,
          paddingBottom: 10,
          paddingTop: 6,
          backgroundColor: "#fff",
          borderTopLeftRadius: 18,
          borderTopRightRadius: 18,
          shadowColor: "#000",
          shadowOpacity: 0.08,
          shadowRadius: 6,
          elevation: 3,
          position: "absolute",
        },
        tabBarLabelStyle: { fontSize: 13, fontWeight: "600" },
        tabBarActiveTintColor: "#F58220",
        tabBarInactiveTintColor: "#999",
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = "home-outline";

          switch (route.name) {
            case "Trang chủ":
              iconName = focused ? "home" : "home-outline";
              break;
            case "Đơn hàng":
              iconName = focused ? "receipt" : "receipt-outline";
              break;
            case "Doanh thu":
              iconName = focused ? "bar-chart" : "bar-chart-outline";
              break;
            case "Tài khoản":
              iconName = focused ? "person" : "person-outline";
              break;
          }

          return <Ionicons name={iconName} size={24} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="Trang chủ"
        component={RestaurantScreen}
        options={{ tabBarLabel: "Trang chủ" }}
      />

      <Tab.Screen
        name="Đơn hàng"
        component={OrderManage}
        options={{ tabBarLabel: "Đơn hàng" }}
      />

      <Tab.Screen
        name="Doanh thu"
        component={RevenueScreen}
        options={{ tabBarLabel: "Doanh thu" }}
      />

      <Tab.Screen
        name="Tài khoản"
        component={RestaurantAccountScreen}
        options={{ tabBarLabel: "Tài khoản" }}
      />
    </Tab.Navigator>
  );
}
