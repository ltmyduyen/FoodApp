import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../data/FireBase";

type OrderItem = {
  foodId?: string;
  price?: number;        // nếu có snapshot price
  quantity?: number;     // nếu có
};

type OrderDoc = {
  id: string;
  branchId?: string;      // hoặc restaurantId tuỳ data
  restaurantId?: string;
  status?: string;        // delivered / completed / ...
  createdAt?: any;
  total?: number;
  totalAmount?: number;
  totalPrice?: number;
  items?: OrderItem[];
};

type FoodDoc = {
  id: string;
  price?: number;
  name?: string;
};

const RevenueSummaryAdmin = ({ navigation }: any) => {
  const [orders, setOrders] = useState<OrderDoc[]>([]);
  const [foodMap, setFoodMap] = useState<Map<string, FoodDoc>>(new Map());
  const [loading, setLoading] = useState(true);

  // ✅ Bạn sửa list này theo status hệ thống bạn
  const DONE = useMemo(
    () => new Set(["delivered", "completed", "done", "success", "paid"]),
    []
  );

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);

      // 1) lấy orders
      const orderSnap = await getDocs(collection(db, "orders"));
      const orderData = orderSnap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      })) as OrderDoc[];
      setOrders(orderData);

      // debug nhanh
      console.log("orders count =", orderSnap.size);
      const statusCount: Record<string, number> = {};
      orderData.forEach((o) => {
        const s = String(o.status ?? "EMPTY").toLowerCase();
        statusCount[s] = (statusCount[s] ?? 0) + 1;
      });
      console.log("statusCount =", statusCount);
      if (orderData[0]) console.log("order sample =", orderData[0]);

      // 2) lấy foods để join (nếu order không lưu price/total)
      // ⚠️ đổi "foods" thành tên collection đúng của bạn nếu khác
      const foodsSnap = await getDocs(collection(db, "foods"));
      const fm = new Map<string, FoodDoc>();
      foodsSnap.docs.forEach((d) => {
        fm.set(d.id, { id: d.id, ...(d.data() as any) });
      });
      setFoodMap(fm);

      console.log("foods count =", foodsSnap.size);
      setLoading(false);
    };

    fetchAll();
  }, []);

  const safeNumber = (v: any) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  const moneyOfOrder = (o: OrderDoc) => {
    // 1) Ưu tiên field total có sẵn
    const direct =
      (typeof o.total === "number" ? o.total : undefined) ??
      (typeof o.totalAmount === "number" ? o.totalAmount : undefined) ??
      (typeof o.totalPrice === "number" ? o.totalPrice : undefined);

    if (typeof direct === "number") return direct;

    // 2) Tính từ items (price snapshot)
    const items = o.items ?? [];
    let sum = 0;

    for (const it of items) {
      const qty = safeNumber(it.quantity ?? 1);

      // nếu item có price (snapshot) thì dùng luôn
      if (typeof it.price === "number") {
        sum += it.price * qty;
        continue;
      }

      // 3) nếu không có price, join foods theo foodId
      const fid = String(it.foodId ?? "");
      if (fid) {
        const food = foodMap.get(fid);
        const price = safeNumber(food?.price ?? 0);
        sum += price * qty;
      }
    }

    return sum;
  };

  const validOrders = useMemo(() => {
    // ✅ Chỉ tính đơn đã hoàn tất (DONE)
    // Nếu bạn muốn tính tất cả trừ cancelled thì đổi logic ở đây
    return orders.filter((o) => DONE.has(String(o.status ?? "").toLowerCase()));
  }, [orders, DONE]);

  const summary = useMemo(() => {
    const byBranch = new Map<string, number>();
    let total = 0;

    validOrders.forEach((o) => {
      const amount = moneyOfOrder(o);
      total += amount;

      const key = o.branchId || o.restaurantId || "UNKNOWN";
      byBranch.set(key, (byBranch.get(key) ?? 0) + amount);
    });

    const rows = Array.from(byBranch.entries())
      .map(([id, revenue]) => ({ id, revenue }))
      .sort((a, b) => b.revenue - a.revenue);

    return {
      total,
      rows,
      ordersCount: orders.length,
      doneCount: validOrders.length,
    };
  }, [validOrders, orders.length, foodMap]); // foodMap để recalc khi join foods xong

  const formatVND = (n: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(n || 0);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#33691E" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headRow}>
        <Text style={styles.header}>Doanh thu tổng hợp</Text>

        {/* Bạn đang ở tab thì goBack có thể không cần.
           Nếu muốn: đổi thành navigation.navigate("Người dùng") */}
        <TouchableOpacity onPress={() => navigation.navigate("Người dùng")}>
          <Ionicons name="close" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Total card */}
      <View style={styles.totalCard}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Ionicons name="cash-outline" size={26} color="#33691E" />
          <View style={{ flex: 1 }}>
            <Text style={styles.totalLabel}>Tổng doanh thu (đã hoàn tất)</Text>
            <Text style={styles.totalValue}>{formatVND(summary.total)}</Text>

            {/* debug nhẹ để biết đang lọc đúng chưa */}
            <Text style={styles.meta}>
              Tổng đơn: {summary.ordersCount} • Đơn hoàn tất: {summary.doneCount}
            </Text>
          </View>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Doanh thu theo nhà hàng/chi nhánh</Text>

      <FlatList
        data={summary.rows}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        renderItem={({ item, index }) => (
          <View style={styles.rowCard}>
            <View style={styles.rank}>
              <Text style={styles.rankText}>{index + 1}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>ID: {item.id}</Text>
              <Text style={styles.rowSub}>{formatVND(item.revenue)}</Text>
            </View>
            <Ionicons name="chevron-forward-outline" size={18} color="#aaa" />
          </View>
        )}
        ListEmptyComponent={
          <View style={{ padding: 12 }}>
            <Text style={{ color: "#777" }}>
              Không có dữ liệu doanh thu. Kiểm tra:
              {"\n"}- status đơn có thuộc DONE không
              {"\n"}- order có total hoặc items/food có price không
            </Text>
          </View>
        }
      />
    </View>
  );
};

export default RevenueSummaryAdmin;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  headRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  header: { fontWeight: "bold", fontSize: 18 },

  totalCard: {
    marginTop: 12,
    backgroundColor: "#F3F7F1",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#D9E6D3",
  },
  totalLabel: { color: "#2E7D32", fontWeight: "700" },
  totalValue: { fontSize: 20, fontWeight: "800", marginTop: 2 },
  meta: { marginTop: 6, fontSize: 12, color: "#777" },

  sectionTitle: {
    marginTop: 14,
    marginBottom: 10,
    fontWeight: "700",
    fontSize: 14,
  },

  rowCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
    padding: 12,
    borderRadius: 10,
  },
  rank: {
    width: 28,
    height: 28,
    borderRadius: 999,
    backgroundColor: "#E7F2E2",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  rankText: { fontWeight: "800", color: "#33691E" },
  rowTitle: { fontSize: 14, fontWeight: "700" },
  rowSub: { fontSize: 13, color: "#2E7D32", marginTop: 2, fontWeight: "700" },
});
