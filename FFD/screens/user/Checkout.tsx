import React, { useContext, useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { useAuth } from "../../context/AuthContext";
import { CartContext } from "../../context/CartContext";
import { useMessageBox } from "../../context/MessageBoxContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { db } from "../../data/FireBase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { FoodOrderItem } from "../../types/food";
import { RootStackParamList } from "../../navigation/AppNavigator";

// ====== Helpers ======
const formatVND = (n: number) =>
  Number(n || 0).toLocaleString("vi-VN", { style: "currency", currency: "VND" });

const calcUnitPrice = (item: any) => {
  const unitFromItem = Number(item?.price);
  if (!isNaN(unitFromItem) && unitFromItem > 0) return unitFromItem;

  const size = Number(item?.selectedSize?.price) || 0;
  const base = Number(item?.selectedBase?.price) || 0;
  const tops =
    item?.selectedTopping?.reduce(
      (s: number, t: any) => s + (Number(t?.price) || 0),
      0
    ) || 0;
  const addons =
    item?.selectedAddOn?.reduce(
      (s: number, a: any) => s + (Number(a?.price) || 0),
      0
    ) || 0;

  // Nếu item không có size (như "Cơm") nhưng có food.price → rớt vào unitFromItem ở trên
  // Còn không thì lấy tổng options
  return size + base + tops + addons;
};

function normalizeOrderItem(item: FoodOrderItem): FoodOrderItem {
  return {
    ...item,
    selectedSize: item.selectedSize ?? null,
    selectedBase: item.selectedBase ?? null,
    selectedTopping: item.selectedTopping ?? [],
    selectedAddOn: item.selectedAddOn ?? [],
    note: item.note ?? null,
  };
}

const CheckoutScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RootStackParamList, "Checkout">>();
  const { user } = useAuth();
  const { show } = useMessageBox();
  const { clearCart, selectedBranch } = useContext(CartContext)!;

  const { selectedFoods, branchId } = route.params as {
    selectedFoods: FoodOrderItem[];
    branchId?: string;
  };

  const [currentBranch, setCurrentBranch] = useState<string | null>(
    branchId || selectedBranch || null
  );
  const [receiverName, setReceiverName] = useState(user?.firstName || "");
  const [receiverPhone, setReceiverPhone] = useState(user?.phone || "");
  const [receiverAddress, setReceiverAddress] = useState(
    "284 An Dương Vương, Phường 3, Quận 5, TP. Hồ Chí Minh"
  );
  const [shippingMethod, setShippingMethod] = useState<"motorbike" | "drone">(
    "motorbike"
  );
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "bank">("cash");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!branchId) {
      AsyncStorage.getItem("selectedBranch").then((b) => {
        if (b) setCurrentBranch(b);
      });
    }
  }, [branchId]);

  // ====== Tính tiền từng dòng và tổng ======
  const detailedItems = useMemo(() => {
    return selectedFoods.map((it) => {
      const unitPrice = calcUnitPrice(it);
      const quantity = Number(it.quantity) || 1;
      const lineTotal = unitPrice * quantity;
      return { unitPrice, quantity, lineTotal, raw: it };
    });
  }, [selectedFoods]);

  const subtotal = useMemo(
    () => detailedItems.reduce((s, d) => s + d.lineTotal, 0),
    [detailedItems]
  );

  const shippingFee = shippingMethod === "drone" ? 20000 : 10000;
  const total = subtotal + shippingFee;

  // ====== Tạo đơn hàng ======
  const handlePlaceOrder = async () => {
    if (!selectedFoods.length) return show("Chưa chọn món nào!", "info");
    if (!receiverName.trim() || !receiverPhone.trim() || !receiverAddress.trim())
      return show("Vui lòng nhập đầy đủ thông tin người nhận!", "info");
    if (!currentBranch) return show("Thiếu chi nhánh giao hàng!", "error");

    try {
      setLoading(true);

      const normalizedCart = selectedFoods.map(normalizeOrderItem);

      // Lưu chi tiết từng item kèm unitPrice & lineTotal
      const itemsForDB = normalizedCart.map((it, idx) => ({
        ...it,
        unitPrice: detailedItems[idx].unitPrice,
        lineTotal: detailedItems[idx].lineTotal,
      }));

      const orderCode = `ORD-${Date.now()}`; // mã đơn đơn giản (có thể thay bằng nanoid)
      const orderData = {
        orderCode,
        branchId: currentBranch,
        userId: (user as any)?.id || (user as any)?.uid || "guest",
        receiverName: receiverName.trim(),
        receiverPhone: receiverPhone.trim(),
        orderAddress: receiverAddress.trim(),
        origin: { lat: 10.7585, lng: 106.6818 },
        delivery: { lat: 10.7832852, lng: 106.7063916 },
        paymentMethod,
        paymentStatus: paymentMethod === "cash" ? "pending_cash" : "waiting_transfer",
        shippingMethod,
        shippingFee,
        subtotal,
        total,
        status: "processing",
        createdAt: serverTimestamp(),
        items: itemsForDB,
      };

      if (paymentMethod === "cash") {
        await addDoc(collection(db, "orders"), orderData);
        await clearCart(currentBranch || undefined);
        show("🎉 Đặt hàng thành công! Đơn đang được xử lý.", "success");
        navigation.navigate("MainTabs", { screen: "Orders" });
      } else {
        // Chuyển qua màn hình chuyển khoản với đầy đủ dữ liệu
        navigation.navigate("Transfer", { orderData });
      }
    } catch (e) {
      console.error("🔥 Lỗi đặt hàng:", e);
      show("Không thể tạo đơn hàng!", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 150 }}>
        {/* 🏠 Thông tin người nhận */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin người nhận</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Họ và tên</Text>
            <TextInput
              style={styles.input}
              value={receiverName}
              onChangeText={setReceiverName}
              placeholder="Nhập họ tên"
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Số điện thoại</Text>
            <TextInput
              style={styles.input}
              keyboardType="phone-pad"
              value={receiverPhone}
              onChangeText={setReceiverPhone}
              placeholder="Nhập số điện thoại"
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Địa chỉ</Text>
            <TextInput
              style={[styles.input, { height: 60 }]}
              multiline
              value={receiverAddress}
              onChangeText={setReceiverAddress}
              placeholder="Nhập địa chỉ giao hàng"
            />
          </View>
        </View>

        {/* 🛒 Danh sách món */}
        <Text style={styles.sectionTitle}>Danh sách món</Text>
        {detailedItems.map(({ raw, unitPrice, lineTotal }, index) => (
          <View key={index} style={styles.cartCard}>
            <Image source={{ uri: raw.image }} style={styles.foodImage} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.foodName}>{raw.name}</Text>
              <Text style={styles.foodDetail}>
                {raw.selectedSize?.label}
                {raw.selectedBase?.label ? ` • ${raw.selectedBase.label}` : ""}
              </Text>
              {raw.note ? (
                <Text style={styles.foodNote}>Ghi chú: {raw.note}</Text>
              ) : null}
              <Text style={styles.foodDetail}>
                Đơn giá: <Text style={{ fontWeight: "700" }}>{formatVND(unitPrice)}</Text>
                {"  •  "}
                SL: <Text style={{ fontWeight: "700" }}>{raw.quantity || 1}</Text>
              </Text>
              <Text style={styles.priceText}>{formatVND(lineTotal)}</Text>
            </View>
          </View>
        ))}

        {/* 🚚 Vận chuyển */}
        <Text style={styles.sectionTitle}>Phương thức vận chuyển</Text>
        {[
          { key: "motorbike", label: "Xe máy", icon: "bicycle-outline" },
          { key: "drone", label: "Drone", icon: "airplane-outline" },
        ].map((method) => (
          <TouchableOpacity
            key={method.key}
            style={[
              styles.radioBox,
              shippingMethod === (method.key as any) && styles.radioBoxActive,
            ]}
            onPress={() => setShippingMethod(method.key as "motorbike" | "drone")}// giữ arrow function
          >
            <View style={styles.radioLeft}>
              <Ionicons
                name={method.icon as any}
                size={22}
                color={shippingMethod === method.key ? "#F57C00" : "#999"}
              />
              <Text
                style={[
                  styles.radioLabel,
                  { color: shippingMethod === method.key ? "#F58220" : "#333" },
                ]}
              >
                {method.label}
              </Text>
            </View>
            <Ionicons
              name={
                shippingMethod === method.key ? "checkmark-circle" : "ellipse-outline"
              }
              size={22}
              color={shippingMethod === method.key ? "#F58220" : "#ccc"}
            />
          </TouchableOpacity>
        ))}

        {/* 💳 Thanh toán */}
        <Text style={styles.sectionTitle}>Phương thức thanh toán</Text>
        {[
          { key: "cash", label: "Tiền mặt", icon: "cash-outline" },
          { key: "bank", label: "Chuyển khoản", icon: "card-outline" },
        ].map((method) => (
          <TouchableOpacity
            key={method.key}
            style={[
              styles.radioBox,
              paymentMethod === (method.key as any) && styles.radioBoxActive,
            ]}
            onPress={() => setPaymentMethod(method.key as any)}
          >
            <View style={styles.radioLeft}>
              <Ionicons
                name={method.icon as any}
                size={22}
                color={paymentMethod === method.key ? "#F58220" : "#999"}
              />
              <Text
                style={[
                  styles.radioLabel,
                  { color: paymentMethod === method.key ? "#F58220" : "#333" },
                ]}
              >
                {method.label}
              </Text>
            </View>
            <Ionicons
              name={
                paymentMethod === method.key ? "checkmark-circle" : "ellipse-outline"
              }
              size={22}
              color={paymentMethod === method.key ? "#F58220" : "#ccc"}
            />
          </TouchableOpacity>
        ))}

        {/* 💰 Chi tiết thanh toán */}
        <Text style={styles.sectionTitle}>Chi tiết thanh toán</Text>
        <View style={styles.summaryBox}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tổng tiền hàng</Text>
            <Text style={styles.summaryValue}>{formatVND(subtotal)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Phí vận chuyển</Text>
            <Text style={styles.summaryValue}>{formatVND(shippingFee)}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { fontWeight: "bold" }]}>
              Tổng thanh toán
            </Text>
            <Text
              style={[styles.summaryValue, { color: "#E53935", fontWeight: "bold" }]}
            >
              {formatVND(total)}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* ✅ Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.checkoutBtn, loading && { opacity: 0.6 }]}
          onPress={handlePlaceOrder}
          disabled={loading}
        >
          <Text style={styles.checkoutText}>
            {loading ? "Đang xử lý..." : "Xác nhận thanh toán"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default CheckoutScreen;

// ====== STYLES ======
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F6F6F6" },
  section: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  inputGroup: { marginBottom: 10 },
  label: { fontSize: 14, color: "#555", marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    backgroundColor: "#fafafa",
  },
  cartCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 10,
    marginBottom: 10,
    padding: 10,
  },
  foodImage: { width: 80, height: 80, borderRadius: 10 },
  foodName: { fontSize: 15, fontWeight: "bold", color: "#1a1a1a" },
  foodDetail: { fontSize: 13, color: "#666", marginTop: 4 },
  foodNote: { fontSize: 13, color: "#666", marginTop: 4 },
  priceText: { fontSize: 14, fontWeight: "bold", color: "#E53935", marginTop: 6 },
  radioBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  radioBoxActive: {
    borderColor: "#F58220",
    shadowColor: "#F58220",
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  radioLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  radioLabel: { fontSize: 15, fontWeight: "500" },
  summaryBox: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 14,
    marginTop: 10,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: "#eee",
    marginVertical: 8,
  },
  summaryLabel: { color: "#444", fontSize: 14 },
  summaryValue: { color: "#000", fontSize: 14 },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderColor: "#eee",
    paddingVertical: 18,
    paddingHorizontal: 16,
    elevation: 10,
  },
  checkoutBtn: {
    backgroundColor: "#33691E",
    borderRadius: 50,
    paddingVertical: 14,
    alignItems: "center",
  },
  checkoutText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});
