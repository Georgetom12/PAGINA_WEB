import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Tabs } from "expo-router";
import { Platform, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

export default function TabLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";

  const tabBarHeight = isWeb ? 84 : 50 + insets.bottom;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarStyle: {
          position: isIOS ? "absolute" : "relative",
          backgroundColor: isIOS ? "transparent" : colors.card,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          elevation: 0,
          shadowOpacity: 0,
          height: tabBarHeight,
          paddingBottom: isWeb ? 0 : insets.bottom,
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill} />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.card }]} />
          ),
        tabBarLabelStyle: {
          fontSize: 9,
          fontFamily: "Inter_600SemiBold",
          letterSpacing: 0.8,
          marginBottom: isWeb ? 0 : 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "INICIO",
          tabBarIcon: ({ color, size }) => <Feather name="home" size={size - 2} color={color} />,
        }}
      />
      <Tabs.Screen
        name="screener"
        options={{
          title: "SCREENER",
          tabBarIcon: ({ color, size }) => <Feather name="bar-chart-2" size={size - 2} color={color} />,
        }}
      />
      <Tabs.Screen
        name="senales"
        options={{
          title: "SEÑALES",
          tabBarIcon: ({ color, size }) => <Feather name="zap" size={size - 2} color={color} />,
        }}
      />
      <Tabs.Screen
        name="liqmap"
        options={{
          title: "LIQMAP",
          tabBarIcon: ({ color, size }) => <Feather name="activity" size={size - 2} color={color} />,
        }}
      />
      <Tabs.Screen
        name="aula"
        options={{
          title: "AULA",
          tabBarIcon: ({ color, size }) => <Feather name="book-open" size={size - 2} color={color} />,
        }}
      />
      <Tabs.Screen
        name="journal"
        options={{
          title: "JOURNAL",
          tabBarIcon: ({ color, size }) => <Feather name="edit-3" size={size - 2} color={color} />,
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: "PERFIL",
          tabBarIcon: ({ color, size }) => <Feather name="user" size={size - 2} color={color} />,
        }}
      />
    </Tabs>
  );
}
