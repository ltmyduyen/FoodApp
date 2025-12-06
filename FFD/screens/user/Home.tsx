import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  TouchableOpacity,
  FlatList,
  ScrollView,
  ActivityIndicator,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import Swiper from "react-native-swiper";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  where,
  limit,
} from "firebase/firestore";
import { db } from "../../data/FireBase";
import { Food } from "../../types/food";
import FoodCard from "../../components/FoodCard";
import { useNavigation } from "@react-navigation/native";
import { AuthContext } from "../../context/AuthContext";
import { CartContext } from "../../context/CartContext";
import AsyncStorage from "@react-native-async-storage/async-storage";

/** === Fisher–Yates shuffle để random thứ tự món === */
function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** ===== Helper: lấy foods theo danh sách id, có fallback theo field "id" ===== */
async function fetchFoodsByIds(ids: string[]): Promise<Food[]> {
  const results: Food[] = [];
  for (const fid of ids) {
    // 1) Thử lấy theo docId
    const byId = await getDoc(doc(db, "foods", fid));
    if (byId.exists()) {
      results.push({ id: byId.id, ...(byId.data() as any) } as Food);
      continue;
    }
    // 2) Fallback: nếu docId không khớp, query theo field "id" == fid
    const q = query(collection(db, "foods"), where("id", "==", fid), limit(1));
    const qs = await getDocs(q);
    if (!qs.empty) {
      const d = qs.docs[0];
      results.push({ id: d.id, ...(d.data() as any) } as Food);
    } else {
      console.log("⚠️ Không tìm thấy foods cho foodId:", fid);
    }
  }
  return results;
}

const HomeScreen: React.FC = () => {
  const [foods, setFoods] = useState<Food[]>([]);
  const [filteredFoods, setFilteredFoods] = useState<Food[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  const [branchModalVisible, setBranchModalVisible] = useState(false);

  const navigation = useNavigation<any>();
  const { user } = useContext(AuthContext)!;
  const { selectedBranch, setSelectedBranch, getTotalItems } =
    useContext(CartContext)!;
  const totalItems = getTotalItems(selectedBranch || undefined);

  /** Lấy danh sách chi nhánh (nếu chưa chọn branch thì RANDOM 1 cái) */
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "branches"), async (snapshot) => {
      const branchList = snapshot.docs.map((d) => ({
        id: d.id,
        name: (d.data() as any).name,
      }));
      setBranches(branchList);

      // nếu app chưa có selectedBranch thì random 1 chi nhánh
      if (!selectedBranch && branchList.length > 0) {
        const random = branchList[Math.floor(Math.random() * branchList.length)].id;
        setSelectedBranch(random);
        await AsyncStorage.setItem("selectedBranch", random);
      }
    });
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Lấy món theo chi nhánh hiện tại (branchFoods -> foods) */
  useEffect(() => {
    if (!selectedBranch) return;

    const branchFoodsRef = collection(
      db,
      `branches/${selectedBranch}/branchFoods`
    );

    const unsubscribe = onSnapshot(branchFoodsRef, async (snapshot) => {
      try {
        // raw branchFoods (docId có thể chính là foodId hoặc random)
        const branchFoods = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
        }));

        // chỉ lấy món đang khả dụng (mặc định true nếu không có cờ)
        const actives = branchFoods.filter(
          (f: any) => (f.isAvailable ?? f.isActive ?? true) === true
        );

        if (actives.length === 0) {
          setFoods([]);
          setFilteredFoods([]);
          setLoading(false);
          return;
        }

        // danh sách id để match về foods:
        // ưu tiên field f.foodId; nếu không có thì dùng docId (f.id)
        const foodIds = actives.map((f: any) => String(f.foodId ?? f.id));

        // lấy foods có fallback theo field "id"
        const visibleFoods = await fetchFoodsByIds(foodIds);

        // SHUFFLE để "random"
        const shuffled = shuffleArray(visibleFoods);

        setFoods(shuffled);
        // áp dụng search hiện tại nếu có
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          setFilteredFoods(
            shuffled.filter((f) => (f.name || "").toLowerCase().includes(q))
          );
        } else {
          setFilteredFoods(shuffled);
        }
      } catch (e) {
        console.error(e);
        setFoods([]);
        setFilteredFoods([]);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [selectedBranch, searchQuery]);

  /** Lưu branch chọn */
  useEffect(() => {
    if (selectedBranch) AsyncStorage.setItem("selectedBranch", selectedBranch);
  }, [selectedBranch]);

  /** Tên người dùng hiển thị */
  const userName =
    user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : user?.firstName || "Khách";

  if (loading)
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#F58220" style={{ marginTop: 40 }} />
      </SafeAreaView>
    );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView keyboardShouldPersistTaps="handled">
        {/* HEADER */}
        <View style={styles.headerContainer}>
          <View style={styles.headerTop}>
            <View style={styles.headerLeft}>
              <Ionicons name="person-circle-outline" size={32} color="white" />
              <Text style={styles.headerLoginText}>{userName}</Text>
            </View>

            {/* Chi nhánh + Giỏ hàng */}
            <View style={styles.headerRight}>
              <TouchableOpacity
                style={styles.branchSelect}
                onPress={() => setBranchModalVisible(true)}
              >
                <Ionicons name="storefront-outline" size={20} color="white" />
                <Text style={styles.branchText}>
                  {branches.find((b) => b.id === selectedBranch)?.name ||
                    "Chi nhánh"}
                </Text>
                <Ionicons name="chevron-down" size={16} color="white" />
              </TouchableOpacity>

              {/* Giỏ hàng */}
              <TouchableOpacity
                style={styles.cartIconWrapper}
                onPress={() => navigation.navigate("Cart")}
              >
                <Ionicons name="cart-outline" size={26} color="white" />
                {totalItems > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{totalItems}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Ô tìm kiếm */}
          <View style={styles.deliveryBox}>
            <Text style={styles.deliveryTitle}>Tìm món bạn yêu thích</Text>
            <View style={styles.addressRow}>
              <Ionicons name="search-outline" size={20} color="gray" />
              <TextInput
                style={styles.addressInput}
                placeholder="Nhập tên món ăn..."
                placeholderTextColor="#999"
                value={searchQuery}
                onChangeText={(t) => setSearchQuery(t)}
              />
            </View>
          </View>
        </View>

        {/* SLIDER */}
        <View style={styles.sliderContainer}>
          <Swiper
            autoplay
            autoplayTimeout={3}
            showsPagination
            dotStyle={{ backgroundColor: "#ccc" }}
            activeDotStyle={{ backgroundColor: "#F58220" }}
          >
            <Image source={require("../images/slide1.png")} style={styles.banner} />
            <Image source={require("../images/slide2.png")} style={styles.banner} />
            <Image source={require("../images/slide3.png")} style={styles.banner} />
          </Swiper>
        </View>

        {/* DANH SÁCH MÓN */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Danh sách món</Text>
          {filteredFoods.length === 0 ? (
            <Text>Chi nhánh này chưa có món ăn khả dụng.</Text>
          ) : (
            <FlatList
              data={filteredFoods}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => (
                <FoodCard
                  food={item}
                  onPress={() =>
                    navigation.navigate("FoodDetail", {
                      food: item,
                      branchId: selectedBranch,
                    })
                  }
                />
              )}
              horizontal
              showsHorizontalScrollIndicator={false}
              ItemSeparatorComponent={() => <View style={{ width: 16 }} />}
            />
          )}
        </View>
      </ScrollView>

      {/* MODAL CHỌN CHI NHÁNH */}
      <Modal visible={branchModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Chọn chi nhánh</Text>
            {branches.map((b) => (
              <TouchableOpacity
                key={b.id}
                style={styles.modalItem}
                onPress={() => {
                  setSelectedBranch(b.id);
                  AsyncStorage.setItem("selectedBranch", b.id);
                  setBranchModalVisible(false);
                  setLoading(true);
                }}
              >
                <Ionicons
                  name={
                    b.id === selectedBranch
                      ? "radio-button-on-outline"
                      : "radio-button-off-outline"
                  }
                  size={20}
                  color="#F58220"
                  style={{ marginRight: 6 }}
                />
                <Text style={styles.modalItemText}>{b.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default HomeScreen;

/* ============== STYLES ============== */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  headerContainer: {
    backgroundColor: "#CDDC39",
    paddingVertical: 16,
    paddingHorizontal: 14,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeft: { flexDirection: "row", alignItems: "center" },
  headerLoginText: {
    color: "black",
    fontSize: 20,
    fontWeight: "bold",
    marginLeft: 8,
  },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 12 },
  branchSelect: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(247, 241, 241, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  branchText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
    marginHorizontal: 4,
  },
  cartIconWrapper: { position: "relative" },
  badge: {
    position: "absolute",
    top: -5,
    right: -8,
    backgroundColor: "red",
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  badgeText: { color: "white", fontSize: 11, fontWeight: "bold" },
  deliveryBox: {
    backgroundColor: "white",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginTop: 14,
  },
  deliveryTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "black",
    marginBottom: 10,
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  addressInput: { flex: 1, marginLeft: 8, fontSize: 15, color: "#333" },
  sliderContainer: { height: 220, marginTop: 16 },
  banner: { width: "100%", height: "100%" },
  section: { padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 8 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    width: "80%",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  modalItem: { flexDirection: "row", alignItems: "center", paddingVertical: 8 },
  modalItemText: { fontSize: 16, color: "#333" },
});
