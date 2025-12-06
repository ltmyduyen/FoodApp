// screens/restaurant/RevenueScreen.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { db } from "../../data/FireBase";
import { collection, getDocs } from "firebase/firestore";

const RevenueScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<"today" | "7days" | "30days">("30days");
  const [revenue, setRevenue] = useState(0);
  const [ordersCount, setOrdersCount] = useState(0);
  const [dailyRevenue, setDailyRevenue] = useState<any[]>([]);
  const [topItems, setTopItems] = useState<any[]>([]);

  // 🔢 Format tiền tệ
  const VND = (val: number) =>
    val.toLocaleString("vi-VN", { style: "currency", currency: "VND" });

  // 🔄 Giả lập load data Firestore (demo)
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Lấy dữ liệu orders
        const querySnap = await getDocs(collection(db, "orders"));
        const orders = querySnap.docs.map((d) => d.data());

        // Tổng doanh thu & số đơn
        let total = 0;
        let count = 0;
        let grouped: Record<string, any> = {};
        let itemStats: Record<string, { qty: number; rev: number }> = {};

        orders.forEach((order: any) => {
          if (order.status === "completed" || order.status === "delivered") {
            count++;
            total += Number(order.total ?? 0);

            const dateKey = new Date(
              order.createdAt?.toDate?.() || order.createdAt || new Date()
            )
              .toISOString()
              .slice(0, 10);

            grouped[dateKey] ??= { count: 0, total: 0 };
            grouped[dateKey].count++;
            grouped[dateKey].total += Number(order.total ?? 0);

            (order.items ?? []).forEach((it: any) => {
              const name = it.name ?? "Không rõ";
              const line = Number(it.linePrice ?? 0);
              itemStats[name] ??= { qty: 0, rev: 0 };
              itemStats[name].qty += Number(it.quantity ?? 1);
              itemStats[name].rev += line;
            });
          }
        });

        const daily = Object.entries(grouped)
          .map(([dateKey, val]: any) => ({ dateKey, ...val }))
          .sort((a, b) => a.dateKey.localeCompare(b.dateKey));

        const top = Object.entries(itemStats)
          .map(([name, val]: any) => ({ name, ...val }))
          .sort((a, b) => b.rev - a.rev)
          .slice(0, 5);

        setRevenue(total);
        setOrdersCount(count);
        setDailyRevenue(daily);
        setTopItems(top);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [range]);

  if (loading) {
    return (
      <View style={styles.loadingBox}>
        <ActivityIndicator size="large" color="#33691E" />
        <Text style={{ color: "#555", marginTop: 10 }}>Đang tải dữ liệu...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header có nút quay lại */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Doanh thu</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Bộ lọc thời gian */}
        <View style={styles.filters}>
          <QuickFilter label="Hôm nay" active={range === "today"} onPress={() => setRange("today")} />
          <QuickFilter label="7 ngày" active={range === "7days"} onPress={() => setRange("7days")} />
          <QuickFilter label="30 ngày" active={range === "30days"} onPress={() => setRange("30days")} />
        </View>

        {/* KPI tổng */}
        <View style={styles.kpiGrid}>
          <KpiCard icon="cash-outline" title="Doanh thu" value={VND(revenue)} />
          <KpiCard icon="receipt-outline" title="Số đơn" value={ordersCount.toString()} />
        </View>

        {/* Doanh thu theo ngày */}
        <Text style={styles.blockTitle}>Doanh thu theo ngày</Text>
        <View style={styles.block}>
          <FlatList
            data={dailyRevenue}
            keyExtractor={(item) => item.dateKey}
            ItemSeparatorComponent={() => <View style={styles.sep} />}
            renderItem={({ item }) => (
              <View style={styles.row}>
                <Text style={styles.rowLeft}>
                  {item.dateKey.split("-").reverse().join("/")}
                </Text>
                <View style={styles.rowRight}>
                  <Text style={styles.rowSub}>{item.count} đơn</Text>
                  <Text style={styles.rowMain}>{VND(item.total)}</Text>
                </View>
              </View>
            )}
          />
        </View>

        {/* Top món theo doanh thu */}
        <Text style={styles.blockTitle}>Top món theo doanh thu</Text>
        <View style={styles.block}>
          {topItems.length === 0 ? (
            <Text style={{ color: "#666" }}>Chưa có dữ liệu.</Text>
          ) : (
            topItems.map((x, idx) => (
              <View key={idx} style={styles.row}>
                <Text style={styles.rowLeft}>
                  {idx + 1}. {x.name}
                </Text>
                <View style={styles.rowRight}>
                  <Text style={styles.rowSub}>{x.qty} sp</Text>
                  <Text style={styles.rowMain}>{VND(x.rev)}</Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default RevenueScreen;

/* ========== Small Components ========== */
const QuickFilter = ({
  label,
  active,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress: () => void;
}) => (
  <TouchableOpacity
    onPress={onPress}
    style={[styles.filterBtn, active && styles.filterBtnActive]}
  >
    <Text style={[styles.filterText, active && styles.filterTextActive]}>{label}</Text>
  </TouchableOpacity>
);

const KpiCard = ({
  icon,
  title,
  value,
}: {
  icon: any;
  title: string;
  value: string;
}) => (
  <View style={styles.kpiCard}>
    <View style={styles.kpiIcon}>
      <Ionicons name={icon} size={18} color="#33691E" />
    </View>
    <Text style={styles.kpiTitle}>{title}</Text>
    <Text style={styles.kpiValue}>{value}</Text>
  </View>
);

/* ========== Styles ========== */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },

  header: {
    backgroundColor: "#CDDC39",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 26,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
  },
  backBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  headerTitle: { color: "#fff", fontWeight: "bold", fontSize: 22 },

  loadingBox: { flex: 1, justifyContent: "center", alignItems: "center" },

  filters: { flexDirection: "row", gap: 10, paddingHorizontal: 16, paddingTop: 14 },
  filterBtn: {
    backgroundColor: "#EDECEC",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
  },
  filterBtnActive: { backgroundColor: "#33691E" },
  filterText: { color: "#333", fontWeight: "600" },
  filterTextActive: { color: "#fff" },

  kpiGrid: { flexDirection: "row", gap: 12, paddingHorizontal: 16, paddingTop: 14 },
  kpiCard: {
    flex: 1,
    backgroundColor: "#F9FAF5",
    borderWidth: 1,
    borderColor: "#EEF1E5",
    borderRadius: 12,
    padding: 12,
  },
  kpiIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#E6EE9C",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  kpiTitle: { color: "#556", fontSize: 12 },
  kpiValue: { color: "#1B5E20", fontSize: 16, fontWeight: "bold", marginTop: 2 },

  blockTitle: {
    paddingHorizontal: 16,
    marginTop: 18,
    marginBottom: 8,
    fontWeight: "700",
    fontSize: 16,
    color: "#223",
  },
  block: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 12,
    marginHorizontal: 16,
    padding: 12,
  },
  sep: { height: 10 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingVertical: 6,
  },
  rowLeft: { color: "#333", fontSize: 14, flexShrink: 1, paddingRight: 12 },
  rowRight: { alignItems: "flex-end" },
  rowSub: { color: "#777", fontSize: 12, marginBottom: 2 },
  rowMain: { color: "#E53935", fontWeight: "700", fontSize: 14 },
});
