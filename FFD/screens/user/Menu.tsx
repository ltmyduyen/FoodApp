import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/AppNavigator";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../data/FireBase";
import { Food } from "../../types/food";
import FoodCard from "../../components/FoodCard";

function shuffleArray<T>(arr: T[]): T[] {
  // Fisher–Yates
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const MenuScreen: React.FC = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [foods, setFoods] = useState<Food[]>([]);
  const [filteredFoods, setFilteredFoods] = useState<Food[]>([]);

  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  const [activeBranch, setActiveBranch] = useState<string | undefined>();
  const [branchKeys, setBranchKeys] = useState<Set<string>>(new Set());

  const [activeCategory, setActiveCategory] = useState("Tất cả");

  const [loadingFoods, setLoadingFoods] = useState(true);
  const [loadingBranches, setLoadingBranches] = useState(true);
  const [loadingBranchFoods, setLoadingBranchFoods] = useState(true);

  // ===== 🏢 Lấy danh sách chi nhánh (mặc định chọn 1 chi nhánh NGẪU NHIÊN)
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "branches"), (snap) => {
      const list = snap.docs.map((d) => ({
        id: d.id,
        name: (d.data() as any).name,
      }));
      setBranches(list);

      if (!activeBranch && list.length > 0) {
        const random = list[Math.floor(Math.random() * list.length)].id;
        setActiveBranch(random);
      }
      setLoadingBranches(false);
    });
    return unsub;
  }, []);

  // ===== 🍔 Lấy danh sách món ăn (ép kiểu number cho price/rating/calories)
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "foods"), (snap) => {
      const list: Food[] = snap.docs.map((doc) => {
        const d = doc.data() as any;
        return {
          id: doc.id,
          name: d.name ?? "",
          image: d.image ?? "",
          category: d.category ?? "Khác",
          description: d.description ?? "",
          rating: typeof d.rating === "number" ? d.rating : Number(d.rating) || 0,
          calories:
            typeof d.calories === "number" ? d.calories : Number(d.calories) || 0,
          isActive: d.isActive ?? true,
          price: typeof d.price === "number" ? d.price : Number(d.price) || 0,
        } as Food;
      });
      setFoods(list);
      setLoadingFoods(false);
    });
    return unsub;
  }, []);

  // ===== 🧩 Lấy branchFoods theo chi nhánh
  useEffect(() => {
    if (!activeBranch) return;

    setLoadingBranchFoods(true);
    setBranchKeys(new Set());
    setFilteredFoods([]);

    const unsub = onSnapshot(
      collection(db, `branches/${activeBranch}/branchFoods`),
      (snap) => {
        const keys = new Set<string>();
        snap.forEach((d) => {
          const data = d.data() as any;
          const isOn =
            data?.isActive === true ||
            data?.isAvailable === true ||
            (data?.isActive === undefined && data?.isAvailable === undefined); // default true nếu ko set
        // nếu import dùng docId = foodId thì data.foodId có thể trống -> fallback doc.id
          const fid = String(data?.foodId || d.id);
          if (isOn && fid) keys.add(fid);
        });
        setBranchKeys(keys);
        setLoadingBranchFoods(false);
      }
    );

    return unsub;
  }, [activeBranch]);

  // ===== 🔖 Category động (từ toàn bộ foods)
  const categories = useMemo(() => {
    const set = new Set<string>(["Tất cả"]);
    foods.forEach((f) => f.category && set.add(f.category));
    return Array.from(set);
  }, [foods]);

  // ===== 🔍 Lọc + xáo trộn danh sách món hiển thị
  useEffect(() => {
    if (loadingFoods || loadingBranches || loadingBranchFoods) return;

    let result = foods;

    // Lọc theo branchFoods (giữ các món có trong subcollection)
    if (activeBranch) {
      if (branchKeys.size > 0) {
        result = result.filter((f) => branchKeys.has(f.id));
      } else {
        result = [];
      }
    }

    // Lọc theo category
    if (activeCategory !== "Tất cả") {
      result = result.filter((f) => f.category === activeCategory);
    }

    // Random thứ tự hiển thị cho “cảm giác” khác nhau
    result = shuffleArray(result);

    setFilteredFoods(result);
  }, [
    foods,
    branchKeys,
    activeBranch,
    activeCategory,
    loadingFoods,
    loadingBranches,
    loadingBranchFoods,
  ]);

  const isLoading = loadingFoods || loadingBranches || loadingBranchFoods;

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#F58220" />
        <Text>Đang tải menu...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.tabSection, { marginTop: 14 }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabScroll}
        >
          {branches.map((b) => (
            <TouchableOpacity
              key={b.id}
              style={[
                styles.tabButton,
                activeBranch === b.id && styles.activeTab,
              ]}
              onPress={() => setActiveBranch(b.id)}
            >
              <Text
                style={[
                  styles.tabText,
                  activeBranch === b.id && styles.activeTabText,
                ]}
              >
                {b.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* ===== Tabs Category (động) ===== */}
      <View style={styles.tabSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabScroll}
        >
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.tabButton,
                activeCategory === cat && styles.activeTab,
              ]}
              onPress={() => setActiveCategory(cat)}
            >
              <Text
                style={[
                  styles.tabText,
                  activeCategory === cat && styles.activeTabText,
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* ===== Danh sách món ===== */}
      <FlatList
        data={filteredFoods}
        numColumns={2}
        columnWrapperStyle={{
          justifyContent: "space-between",
          paddingHorizontal: 16,
        }}
        contentContainerStyle={{ paddingBottom: 20 }}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <FoodCard
            food={item}
            onPress={() =>
              navigation.navigate("FoodDetail", {
                food: item,
                branchId: activeBranch,
                branchName:
                  branches.find((b) => b.id === activeBranch)?.name || undefined,
              })
            }
          />
        )}
        ListEmptyComponent={
          <Text style={{ textAlign: "center", marginTop: 40, color: "#777" }}>
            Chi nhánh này chưa có món ăn khả dụng.
          </Text>
        }
      />
    </SafeAreaView>
  );
};

export default MenuScreen;

// ============== STYLES ==============
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#CDDC39" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  tabSection: { marginBottom: 6 },
  tabScroll: {
    paddingHorizontal: 16,
    alignItems: "center",
  },
  tabButton: {
    backgroundColor: "#EDECEC",
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
  },
  activeTab: { backgroundColor: "#33691E" },
  tabText: { fontSize: 15, color: "#333", fontWeight: "600" },
  activeTabText: { color: "#fff" },
});
