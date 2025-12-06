import React, { useEffect, useLayoutEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ScrollView,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import { RootStackParamList } from "../../navigation/AppNavigator";
import { db } from "../../data/FireBase";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  doc,
} from "firebase/firestore";

const statusTabs = [
  { key: "processing", label: "Chờ xác nhận" },
  { key: "preparing", label: "Đang chuẩn bị" },
  { key: "delivering", label: "Đang giao" },
  { key: "delivered", label: "Đã giao" },
  { key: "completed", label: "Hoàn thành" },
  { key: "cancelled", label: "Đã hủy" },
];

const RestaurantOrderScreen: React.FC<{
  navigation: NavigationProp<RootStackParamList>;
}> = ({ navigation }) => {
  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const [orders, setOrders] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("processing");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((docSnap) => {
        const raw = docSnap.data();
        const createdAt = raw.createdAt?.toDate?.() || new Date();

        const items = (raw.items || []).map((it: any) => {
          const unit =
            Number(it?.price) ||
            Number(it?.selectedSize?.price || 0) +
              Number(it?.selectedBase?.price || 0) +
              Number(it?.selectedTopping?.price || 0) +
              Number(it?.selectedAddOn?.price || 0);
          const qty = Number(it?.quantity || 1);
          return {
            name: it?.name || "",
            image: it?.image || "",
            quantity: qty,
            unitPrice: unit,
            linePrice: unit * qty,
          };
        });

        const subtotal = items.reduce(
          (s: number, it: any) => s + Number(it.linePrice || 0),
          0
        );
        const shippingFee = Number(raw?.shippingFee ?? 15000);
        const total = subtotal + shippingFee;

        return {
          id: docSnap.id,
          date: createdAt.toLocaleString("vi-VN"),
          status: raw.status || "processing",
          shippingMethod: raw.shippingMethod || "motorbike",
          items,
          subtotal,
          shippingFee,
          total,
        };
      });
      setOrders(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, "orders", orderId), { status: newStatus });
    } catch (error) {
      console.error("❌ Lỗi cập nhật trạng thái:", error);
    }
  };

  const filteredOrders = orders.filter((o) => o.status === activeTab);

  if (loading) {
    return (
      <View style={styles.loadingBox}>
        <ActivityIndicator size="large" color="#F58220" />
        <Text style={{ marginTop: 10, color: "#555" }}>Đang tải đơn hàng...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* ===== HEADER (tự custom, có nút quay lại) ===== */}
      <View style={styles.header}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back-outline" size={26} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Quản lý đơn hàng</Text>
        </View>

        <Ionicons name="receipt-outline" size={30} color="#fff" />
      </View>

      <StatusBar barStyle="light-content" backgroundColor="#33691E" />

      {/* ===== Tabs ===== */}
      <View style={styles.tabWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabScroll}
        >
          {statusTabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tabButton,
                activeTab === tab.key && styles.activeTabButton,
              ]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab.key && styles.activeTabText,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* ===== Danh sách đơn ===== */}
      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20, paddingHorizontal: 16 }}
        renderItem={({ item }) => (
          <OrderCard
            order={item}
            onConfirm={() => handleUpdateStatus(item.id, "preparing")}
            onDeliver={() => handleUpdateStatus(item.id, "delivering")}
            onComplete={() => handleUpdateStatus(item.id, "completed")}
            onReject={() => handleUpdateStatus(item.id, "cancelled")}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Ionicons name="document-outline" size={48} color="#aaa" />
            <Text style={styles.emptyText}>Chưa có đơn hàng nào</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

export default RestaurantOrderScreen;

// =================== OrderCard ===================
const OrderCard = ({
  order,
  onConfirm,
  onDeliver,
  onComplete,
  onReject,
}: any) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "processing":
        return "#F9A825";
      case "preparing":
        return "#E040FB";
      case "delivering":
        return "#2196F3";
      case "completed":
        return "#4CAF50";
      case "cancelled":
        return "#E53935";
      default:
        return "#333";
    }
  };

  const getShippingLabel = (method: string) => {
    switch (method) {
      case "motorbike":
        return "Xe máy";
      case "drone":
        return "Drone";
      default:
        return "Khác";
    }
  };

  return (
    <View style={styles.orderCardContainer}>
      <View style={styles.orderHeader}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <View style={styles.mallBadge}>
            <Text style={styles.mallText}>Delivery by</Text>
          </View>
          <Text style={[styles.branchName, { marginLeft: 6 }]}>
            {getShippingLabel(order.shippingMethod)}
          </Text>
        </View>
        <Text
          style={[styles.orderStatus, { color: getStatusColor(order.status) }]}
        >
          {statusTabs.find((t) => t.key === order.status)?.label}
        </Text>
      </View>

      {order.items.map((item: any, idx: number) => (
        <View key={idx} style={styles.itemRow}>
          <Image
            source={{ uri: item.image || "https://via.placeholder.com/80" }}
            style={styles.itemImage}
          />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text numberOfLines={1} style={styles.itemName}>
              {item.name}
            </Text>
            <Text style={styles.itemQty}>x{item.quantity}</Text>
            <Text style={styles.itemPrice}>
              {Number(item.unitPrice || 0).toLocaleString("vi-VN")}₫
            </Text>
          </View>
        </View>
      ))}

      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>
          Tổng số tiền ({order.items.length} sản phẩm):
        </Text>
        <Text style={styles.totalValue}>
          {Number(order.total).toLocaleString("vi-VN")}₫
        </Text>
      </View>

      {/* Footer nút hành động */}
      <View style={styles.cardFooter}>
        {order.status === "processing" && (
          <>
            <TouchableOpacity style={styles.rejectButton} onPress={onReject}>
              <Ionicons name="close-circle-outline" size={16} color="#fff" />
              <Text style={styles.confirmText}>Từ chối</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.confirmButton} onPress={onConfirm}>
              <Ionicons name="checkmark-outline" size={16} color="#fff" />
              <Text style={styles.confirmText}>Xác nhận</Text>
            </TouchableOpacity>
          </>
        )}
        {order.status === "preparing" && (
          <TouchableOpacity style={styles.deliverButton} onPress={onDeliver}>
            <Ionicons name="bicycle-outline" size={16} color="#fff" />
            <Text style={styles.confirmText}>Giao hàng</Text>
          </TouchableOpacity>
        )}
        {order.status === "delivering" && (
          <TouchableOpacity style={styles.completeButton} onPress={onComplete}>
            <Ionicons name="checkmark-done-outline" size={16} color="#fff" />
            <Text style={styles.confirmText}>Hoàn thành</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

// =================== Styles ===================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    backgroundColor: "#CDDC39",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 30,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
  },
  headerTitle: { color: "#fff", fontWeight: "bold", fontSize: 22 },
  tabWrapper: { marginVertical: 20 },
  tabScroll: { paddingHorizontal: 16, alignItems: "center" },
  tabButton: {
    backgroundColor: "#edecec",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
  },
  activeTabButton: { backgroundColor: "#33691E" },
  tabText: { fontSize: 15, color: "#333", fontWeight: "600" },
  activeTabText: { color: "#fff" },
  emptyBox: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { color: "#777", fontSize: 14, marginTop: 8 },
  orderCardContainer: {
    backgroundColor: "#fff",
    borderRadius: 10,
    marginTop: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#eee",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  mallBadge: {
    backgroundColor: "#D32F2F",
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  mallText: { color: "#fff", fontWeight: "bold", fontSize: 11 },
  branchName: { fontWeight: "600", fontSize: 14, color: "#222" },
  orderStatus: { fontWeight: "bold", fontSize: 13 },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderColor: "#eee",
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: "#f5f5f5",
  },
  itemName: { fontSize: 13, color: "#333", fontWeight: "500" },
  itemQty: { fontSize: 12, color: "#777", marginTop: 2 },
  itemPrice: { fontSize: 13, fontWeight: "bold", color: "#E53935", marginTop: 2 },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  totalLabel: { fontSize: 13, color: "#555" },
  totalValue: { fontSize: 14, fontWeight: "bold", color: "#E53935" },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginTop: 10,
  },
  rejectButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E53935",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 6,
  },
  confirmButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FF9800",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  deliverButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2196F3",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  completeButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4CAF50",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  confirmText: { color: "#fff", fontSize: 13, fontWeight: "600", marginLeft: 4 },
  loadingBox: { flex: 1, justifyContent: "center", alignItems: "center" },
});
