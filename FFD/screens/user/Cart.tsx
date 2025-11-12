import React, { useContext, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../../context/AuthContext";
import { CartContext } from "../../context/CartContext";
import Checkbox from "expo-checkbox";
import { useMessageBox } from "../../context/MessageBoxContext";

const formatVND = (n: number) =>
  Number(n || 0).toLocaleString("vi-VN", { style: "currency", currency: "VND" });

// Tính giá 1 đơn vị cho 1 item (đã phòng hờ mọi kiểu dữ liệu)
const calcUnitPrice = (item: any) => {
  const unitFromItem = Number(item?.price);
  if (!isNaN(unitFromItem) && unitFromItem > 0) return unitFromItem;

  const size = Number(item?.selectedSize?.price) || 0;
  const base = Number(item?.selectedBase?.price) || 0;
  const tops =
    (item?.selectedTopping?.reduce(
      (s: number, t: any) => s + (Number(t?.price) || 0),
      0
    ) || 0);
  const addons =
    (item?.selectedAddOn?.reduce(
      (s: number, a: any) => s + (Number(a?.price) || 0),
      0
    ) || 0);

  return size + base + tops + addons;
};

const CartScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const {
    cartByBranch,
    selectedBranch,
    handleRemoveItem,
    increaseQtyInCart,
    decreaseQtyInCart,
    address,
  } = useContext(CartContext)!;
  const { show } = useMessageBox();

  const branchCart = selectedBranch ? cartByBranch[selectedBranch] || [] : [];
  const [selectedItems, setSelectedItems] = useState<number[]>([]);

  const toggleSelect = (index: number) => {
    setSelectedItems((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  // Tổng tiền các item đã tick chọn
  const subtotal = branchCart.reduce((sum: number, item: any, index: number) => {
    if (!selectedItems.includes(index)) return sum;
    const unitPrice = calcUnitPrice(item);
    const qty = Number(item?.quantity) || 1;
    return sum + unitPrice * qty;
  }, 0);

  const handleCheckout = () => {
    if (!user) {
      show("Vui lòng đăng nhập để đặt hàng!", "info");
      return;
    }
    if (!selectedBranch) {
      show("Vui lòng chọn chi nhánh!", "info");
      return;
    }
    if (selectedItems.length === 0) {
      show("Vui lòng chọn ít nhất một món!", "info");
      return;
    }

    const selectedFoods = branchCart.filter((_: any, i: number) =>
      selectedItems.includes(i)
    );
    navigation.navigate("Checkout", { selectedFoods, branchId: selectedBranch });
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {!selectedBranch ? (
          <Text style={styles.emptyText}>
            Vui lòng chọn chi nhánh để xem giỏ hàng.
          </Text>
        ) : branchCart.length === 0 ? (
          <Text style={styles.emptyText}>Giỏ hàng chi nhánh này trống.</Text>
        ) : (
          branchCart.map((item: any, index: number) => {
            const unitPrice = calcUnitPrice(item);
            const lineTotal = unitPrice * (Number(item?.quantity) || 1);
            const checked = selectedItems.includes(index);

            return (
              <View key={index} style={styles.cartCard}>
                <Checkbox
                  value={checked}
                  onValueChange={() => toggleSelect(index)}
                  color="#F58220"
                  style={styles.checkbox}
                />

                <Image source={{ uri: item.image }} style={styles.foodImage} />

                <View style={styles.foodInfo}>
                  <Text style={styles.foodName}>{item.name}</Text>

                  {/* Chi tiết tuỳ chọn nếu có */}
                  {item.selectedSize?.label && (
                    <Text style={styles.foodDetail}>
                      Size: {item.selectedSize.label}
                    </Text>
                  )}
                  {item.selectedBase?.label && (
                    <Text style={styles.foodDetail}>
                      Đế: {item.selectedBase.label}
                    </Text>
                  )}
                  {item.selectedTopping?.length ? (
                    <Text style={styles.foodDetail}>
                      Topping: {item.selectedTopping.map((t: any) => t.label).join(", ")}
                    </Text>
                  ) : null}

                  {/* Giá dòng + số lượng */}
                  <View style={styles.priceQtyRow}>
                    <Text style={styles.unitPrice}>{formatVND(unitPrice)}</Text>

                    <View style={styles.qtyRow}>
                      <TouchableOpacity
                        onPress={() => decreaseQtyInCart(selectedBranch!, index)}
                        style={styles.qtyBtn}
                      >
                        <Text style={styles.qtySymbol}>−</Text>
                      </TouchableOpacity>
                      <Text style={styles.qtyText}>{item.quantity}</Text>
                      <TouchableOpacity
                        onPress={() => increaseQtyInCart(selectedBranch!, index)}
                        style={styles.qtyBtn}
                      >
                        <Text style={styles.qtySymbol}>＋</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                <View style={{ alignItems: "flex-end" }}>
                  <Text style={styles.lineTotal}>{formatVND(lineTotal)}</Text>
                  <TouchableOpacity
                    onPress={() => handleRemoveItem(selectedBranch!, index)}
                    style={styles.deleteBtn}
                  >
                    <Ionicons name="trash-outline" size={22} color="red" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {selectedBranch && branchCart.length > 0 && (
        <View style={styles.footer}>
          <Text style={styles.totalLabel}>
            Tổng cộng: <Text style={styles.totalValue}>{formatVND(subtotal)}</Text>
          </Text>
          <TouchableOpacity
            style={styles.checkoutBtn}
            onPress={handleCheckout}
            activeOpacity={0.8}
          >
            <Text style={styles.checkoutText}>
              Thanh toán ({selectedItems.length})
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default CartScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "white", paddingHorizontal: 16 },
  scrollContent: { paddingBottom: 150 },
  emptyText: { textAlign: "center", marginTop: 50, color: "#777", fontSize: 15 },

  cartCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    marginTop: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#33691E",
    padding: 10,
  },
  checkbox: { marginRight: 8 },
  foodImage: { width: 80, height: 80, borderRadius: 10 },
  foodInfo: { flex: 1, marginLeft: 12 },
  foodName: { fontWeight: "600", fontSize: 16, color: "#333" },
  foodDetail: { color: "#666", fontSize: 13, marginTop: 2 },

  priceQtyRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  unitPrice: { color: "#F57C00", fontWeight: "700", fontSize: 14 },

  qtyRow: { flexDirection: "row", alignItems: "center" },
  qtyBtn: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  qtySymbol: { fontSize: 16, color: "#333" },
  qtyText: { marginHorizontal: 10, fontSize: 15 },

  lineTotal: { fontWeight: "700", color: "#222" },
  deleteBtn: { padding: 6, marginTop: 6 },

  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderColor: "#eee",
    padding: 16,
  },
  totalLabel: { fontSize: 16, fontWeight: "600", color: "#000" },
  totalValue: { color: "#E53935", fontWeight: "bold" },
  checkoutBtn: {
    backgroundColor: "#33691E",
    borderRadius: 50,
    marginTop: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  checkoutText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
