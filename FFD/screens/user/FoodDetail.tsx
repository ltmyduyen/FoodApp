import React, { useState, useContext, useMemo } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  TextInput,
  Platform,
  StyleSheet,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { CartContext } from "../../context/CartContext";
import { useMessageBox } from "../../context/MessageBoxContext";
import { RouteProp, useRoute } from "@react-navigation/native";
import { RootStackParamList } from "../../navigation/AppNavigator";

const formatVND = (n: number) =>
  Number(n || 0).toLocaleString("vi-VN", { style: "currency", currency: "VND" });

const FoodDetailScreen: React.FC = () => {
  const route = useRoute<RouteProp<RootStackParamList, "FoodDetail">>();
  const { food, branchId } = route.params;

  const { addToCart } = useContext(CartContext)!;
  const { show } = useMessageBox();

  // ==== Chuẩn hóa dữ liệu để không bị undefined / string
  const cleanSizes   = useMemo(() => (food.sizes ?? []).map(s => ({...s, price: Number(s.price) || 0})), [food.sizes]);
  const cleanBases   = useMemo(() => (food.bases ?? []).map(b => ({...b, price: Number(b.price) || 0})), [food.bases]);
  const cleanTops    = useMemo(() => (food.toppings ?? []).map(t => ({...t, price: Number(t.price) || 0})), [food.toppings]);
  const cleanAddOns  = useMemo(() => (food.addOns ?? []).map(a => ({...a, price: Number(a.price) || 0})), [food.addOns]);
  const foodPriceNum = useMemo(() => Number((food as any).price) || 0, [food]);

  // ==== State lựa chọn
  const [selectedSize, setSelectedSize]   = useState<any>(cleanSizes[0] ?? null);
  const [selectedBase, setSelectedBase]   = useState<any>(cleanBases[0] ?? null);
  const [selectedTopping, setselectedTopping] = useState<any[]>([]);
  const [selectedAddOn, setselectedAddOn]     = useState<any[]>([]);
  const [note, setNote] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [inputHeight, setInputHeight] = useState(40);

  // ==== Tính giá gốc:
  // - Nếu có size: lấy giá size (ưu tiên size đã chọn, fallback size đầu)
  // - Nếu không có size: dùng food.price từ Firestore
  // - Cộng base (nếu có), topping, add-on
  const sizePrice =
    (selectedSize?.price ??
      cleanSizes[0]?.price ??
      foodPriceNum);

  const baseExtra = selectedBase?.price || 0;
  const toppingExtra = selectedTopping.reduce((s, t) => s + (Number(t.price) || 0), 0);
  const addOnExtra   = selectedAddOn.reduce((s, a) => s + (Number(a.price) || 0), 0);

  const basePrice = sizePrice + baseExtra + toppingExtra + addOnExtra;
  const total = basePrice * quantity;

  // ==== Thêm vào giỏ
  const handleAddToCart = () => {
    if (!branchId) {
      show("Lỗi: Không xác định chi nhánh!", "error");
      return;
    }
    addToCart(
      {
        ...food,
        // giá 1 đơn vị đã tính đủ options
        price: basePrice,
        selectedSize,
        selectedBase,
        selectedTopping,
        selectedAddOn,
        note,
        quantity,
      } as any,
      branchId,
      quantity
    );
    show("Đã thêm vào giỏ hàng!", "success");
  };

  // ==== Toggle chọn
  const toggleSelect = (item: any, type: "topping" | "addon") => {
    if (type === "topping") {
      setselectedTopping((prev) =>
        prev.some((t) => t.label === item.label)
          ? prev.filter((t) => t.label !== item.label)
          : [...prev, item]
      );
    } else {
      setselectedAddOn((prev) =>
        prev.some((a) => a.label === item.label)
          ? prev.filter((a) => a.label !== item.label)
          : [...prev, item]
      );
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <KeyboardAwareScrollView
        enableOnAndroid
        keyboardShouldPersistTaps="handled"
        extraScrollHeight={Platform.OS === "ios" ? 60 : 80}
        contentContainerStyle={styles.scrollContainer}
      >
        {/* ẢNH */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: food.image }} style={styles.image} />
        </View>

        {/* THÔNG TIN */}
        <View style={styles.content}>
          <Text style={styles.name}>{food.name}</Text>
          <Text style={styles.desc}>
            {food.description || "Thơm ngon, nóng hổi, phục vụ tận nơi!"}
          </Text>

      
        

      
      
          {/* ==== GHI CHÚ */}
          <Text style={styles.sectionTitle}>Ghi chú</Text>
          <TextInput
            style={[styles.input, { height: Math.min(inputHeight, 100) }]}
            placeholder="..."
            value={note}
            onChangeText={setNote}
            multiline
            onContentSizeChange={(e) =>
              setInputHeight(e.nativeEvent.contentSize.height)
            }
            numberOfLines={3}
            textAlignVertical="top"
            scrollEnabled={inputHeight > 100}
            returnKeyType="done"
          />
        </View>
      </KeyboardAwareScrollView>

      {/* ==== FOOTER */}
      <View style={styles.footer}>
        <View style={styles.footerTop}>
          {/* +/- số lượng */}
          <View style={styles.qtyBox}>
            <TouchableOpacity
              style={styles.qtyBtn}
              onPress={() => setQuantity((q) => Math.max(1, q - 1))}
            >
              <Text style={styles.qtySymbol}>−</Text>
            </TouchableOpacity>
            <Text style={styles.qtyText}>{quantity}</Text>
            <TouchableOpacity
              style={styles.qtyBtn}
              onPress={() => setQuantity((q) => q + 1)}
            >
              <Text style={styles.qtySymbol}>＋</Text>
            </TouchableOpacity>
          </View>

          {/* Tổng cộng */}
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.totalLabel}>Tổng cộng:</Text>
            <Text style={styles.totalPrice}>{formatVND(total)}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddToCart}
          activeOpacity={0.9}
        >
          <Text style={styles.addButtonText}>Thêm vào giỏ hàng</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default FoodDetailScreen;

const styles = StyleSheet.create({
  scrollContainer: { paddingBottom: 150 },
  imageContainer: { alignItems: "center", marginTop: 10 },
  image: { width: "90%", height: 220, borderRadius: 16 },
  content: { paddingHorizontal: 20, marginTop: 10 },
  name: { fontSize: 22, fontWeight: "bold", color: "#333" },
  desc: { fontSize: 15, color: "#666", marginTop: 5 },
  sectionTitle: { fontSize: 17, fontWeight: "600", marginTop: 15, color: "#222" },
  optionRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 10 },
  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#33691E",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  optionActive: { backgroundColor: "#CDDC39" },
  optionText: { color: "#CDDC39", fontSize: 14, fontWeight: "600" },
  optionTextActive: { color: "#fff" },
  optionPrice: { marginLeft: 6, color: "#888", fontSize: 13 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
  },
  footer: {
    position: "absolute",
    bottom: 0, left: 0, right: 0,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderColor: "#eee",
    paddingVertical: 20,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: -2 },
    shadowRadius: 6,
    elevation: 10,
  },
  footerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  qtyBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    backgroundColor: "#fff",
  },
  qtyBtn: { width: 35, height: 35, justifyContent: "center", alignItems: "center" },
  qtySymbol: { fontSize: 18, color: "#333" },
  qtyText: { fontSize: 16, fontWeight: "bold", marginHorizontal: 10 },
  totalLabel: { color: "#444", fontSize: 14 },
  totalPrice: { color: "#E53935", fontWeight: "bold", fontSize: 17 },
  addButton: {
    backgroundColor: "#33691E",
    borderRadius: 50,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 6,
  },
  addButtonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
