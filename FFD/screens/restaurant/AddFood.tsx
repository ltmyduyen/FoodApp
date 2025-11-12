import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { db } from "../../data/FireBase";
import {
  serverTimestamp,
  doc,
  setDoc,
  getDoc,
} from "firebase/firestore";
import { RouteProp, useRoute, useNavigation } from "@react-navigation/native";
import { RootStackParamList } from "../../navigation/AppNavigator";

type Food = {
  id: string;            // slug: "com-bo-vien-xot-ca-chua"
  name: string;
  description: string;
  price: number;
  calories: number;
  category: string;      // "Cơm" | "Mỳ" | "Bún" | "Gimbab" | "Cuốn" | "Salad" | ...
  image: string;         // URL
  rating: number;        // 0..5
};

const categories = ["Cơm", "Mỳ", "Bún", "Gimbab", "Cuốn", "Salad"];

function slugify(v: string) {
  return v
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")        // bỏ dấu tiếng Việt
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

const AddFoodScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, "AddFood">>();
  const { branchId } = route.params ?? {};

  const [food, setFood] = useState<Food>({
    id: "",
    name: "",
    description: "",
    price: 0,
    calories: 0,
    category: "",
    image: "",
    rating: 0,
  });

  // auto sinh id theo name (nếu user chưa gõ id)
  useEffect(() => {
    if (!food.id) {
      setFood((prev) => ({ ...prev, id: slugify(prev.name) }));
    }
  }, [food.name]);

  const setField = <K extends keyof Food>(key: K, val: Food[K]) =>
    setFood({ ...food, [key]: val });

  const handleSave = async () => {
    // validate
    if (!food.name.trim() || !food.category.trim() || !food.image.trim()) {
      Alert.alert("⚠️ Thiếu dữ liệu", "Vui lòng nhập Tên, Loại món và Ảnh URL.");
      return;
    }
    const id = (food.id || slugify(food.name)).trim();
    if (!id) {
      Alert.alert("⚠️ Lỗi ID", "Không tạo được ID cho món. Hãy nhập lại tên hoặc gõ ID.");
      return;
    }

    try {
      // tránh ghi đè nếu đã tồn tại
      const ref = doc(db, "foods", id);
      const existed = await getDoc(ref);
      if (existed.exists()) {
        Alert.alert("❗ ID đã tồn tại", `Món với ID "${id}" đã có. Hãy đổi ID.`);
        return;
      }

      // chuẩn hóa dữ liệu
      const newFood: Food = {
        id,
        name: food.name.trim(),
        description: food.description?.trim() || "",
        price: Number(food.price) || 0,
        calories: Number(food.calories) || 0,
        category: food.category.trim(),
        image: food.image.trim(),
        rating: Math.max(0, Math.min(5, Number(food.rating) || 0)),
      };

      // lưu foods/{id}
      await setDoc(ref, {
        ...newFood,
        createdAt: serverTimestamp(),
      });

      // nếu có branch → tạo branches/{branchId}/branchFoods/{id}
      if (branchId) {
        const bfRef = doc(db, `branches/${branchId}/branchFoods`, id);
        await setDoc(bfRef, {
          foodId: id,
          foodName: newFood.name,
          isAvailable: true,
          stock: 0,
          createdAt: serverTimestamp(),
        });
      }

      Alert.alert("✅ Thành công", `Đã thêm món ${newFood.name} (${id})`);
      navigation.goBack();
    } catch (err) {
      console.error("❌ Lỗi thêm món:", err);
      Alert.alert("Lỗi", "Không thể thêm món, vui lòng thử lại!");
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>➕ Thêm món mới</Text>

      <Text style={styles.label}>ID (slug)</Text>
      <TextInput
        style={styles.input}
        placeholder="com-bo-vien-xot-ca-chua"
        value={food.id}
        onChangeText={(v) => setField("id", slugify(v))}
      />

      <Text style={styles.label}>Tên món</Text>
      <TextInput
        style={styles.input}
        placeholder="Nhập tên món"
        value={food.name}
        onChangeText={(v) => setField("name", v)}
      />

      <Text style={styles.label}>Loại món</Text>
      <View style={styles.categoryRow}>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.catBtn, food.category === cat && styles.catBtnActive]}
            onPress={() => setField("category", cat)}
          >
            <Text
              style={[styles.catText, food.category === cat && styles.catTextActive]}
            >
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Mô tả</Text>
      <TextInput
        style={[styles.input, { height: 80 }]}
        placeholder="Mô tả món ăn"
        multiline
        value={food.description}
        onChangeText={(v) => setField("description", v)}
      />

      <Text style={styles.label}>Ảnh URL</Text>
      <TextInput
        style={styles.input}
        placeholder="https://..."
        value={food.image}
        onChangeText={(v) => setField("image", v)}
      />

      <Text style={styles.label}>Giá (VND)</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        placeholder="59000"
        value={food.price ? String(food.price) : ""}
        onChangeText={(v) => setField("price", Number(v))}
      />

      <Text style={styles.label}>Calories</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        placeholder="395"
        value={food.calories ? String(food.calories) : ""}
        onChangeText={(v) => setField("calories", Number(v))}
      />

      <Text style={styles.label}>Rating (0 – 5)</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        placeholder="4.7"
        value={food.rating ? String(food.rating) : ""}
        onChangeText={(v) => setField("rating", Number(v))}
      />

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
        <Text style={styles.saveText}>💾 Lưu món</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default AddFoodScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 16 },
  title: { fontSize: 20, fontWeight: "800", color: "#33691E", marginBottom: 12 },
  label: { fontWeight: "600", marginTop: 10, color: "#333" },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    marginTop: 4,
  },
  categoryRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginVertical: 8 },
  catBtn: {
    borderWidth: 1,
    borderColor: "#33691E",
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginRight: 8,
    marginBottom: 6,
  },
  catBtnActive: { backgroundColor: "#CDDC39" },
  catText: { color: "black", fontWeight: "500" },
  catTextActive: { color: "#fff" },
  saveBtn: {
    backgroundColor: "#33691E",
    borderRadius: 8,
    paddingVertical: 14,
    marginTop: 24,
    alignItems: "center",
  },
  saveText: { color: "#fff", fontWeight: "bold" },
});
