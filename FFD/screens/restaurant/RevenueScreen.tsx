// screens/restaurant/RevenueScreen.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  FlatList,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { db } from "../../data/FireBase";
import { collection, getDocs } from "firebase/firestore";

type RangeType = "today" | "7days" | "30days";

const GREEN = "#33691E";

const RevenueScreen = () => {
  const navigation = useNavigation<any>();

  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<RangeType>("30days");
  const [revenue, setRevenue] = useState(0);
  const [ordersCount, setOrdersCount] = useState(0);
  const [dailyRevenue, setDailyRevenue] = useState<any[]>([]);

  // 🔢 Format tiền tệ
  const VND = (val: number) =>
    val.toLocaleString("vi-VN", { style: "currency", currency: "VND" });

  // helper: parse createdAt (Timestamp hoặc string)
  const parseCreatedAt = (createdAt: any): Date | null => {
    if (!createdAt) return null;
    if (typeof createdAt?.toDate === "function") return createdAt.toDate();
    const d = new Date(createdAt);
    if (Number.isNaN(d.getTime())) return null;
    return d;
  };

  // helper: start date by range
  const getStartDate = (r: RangeType) => {
    const now = new Date();
    if (r === "today") {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      d.setHours(0, 0, 0, 0);
      return d;
    }
    if (r === "7days") {
      const d = new Date(now);
      d.setDate(now.getDate() - 6);
      d.setHours(0, 0, 0, 0);
      return d;
    }
    const d = new Date(now);
    d.setDate(now.getDate() - 29);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        const querySnap = await getDocs(collection(db, "orders"));
        const orders = querySnap.docs.map((d) => d.data());
        const startDate = getStartDate(range);

        let total = 0;
        let count = 0;
        let grouped: Record<string, { count: number; total: number }> = {};

        orders.forEach((order: any) => {
          // chỉ tính đơn đã hoàn thành
          if (!(order.status === "completed" || order.status === "delivered")) return;

          const created = parseCreatedAt(order.createdAt);
          if (!created) return;

          // filter theo range
          if (created < startDate) return;

          count++;
          total += Number(order.total ?? 0);

          const dateKey = created.toISOString().slice(0, 10); // YYYY-MM-DD
          if (!grouped[dateKey]) grouped[dateKey] = { count: 0, total: 0 };
          grouped[dateKey].count++;
          grouped[dateKey].total += Number(order.total ?? 0);
        });

        const daily = Object.entries(grouped)
          .map(([dateKey, val]) => ({ dateKey, ...val }))
          .sort((a, b) => a.dateKey.localeCompare(b.dateKey));

        setRevenue(total);
        setOrdersCount(count);
        setDailyRevenue(daily);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [range]);

  const screenW = Dimensions.get("window").width;

  // dữ liệu chart: lấy theo VND (không chia k nữa cho khỏi nhầm)
  const chartSeries = useMemo(() => {
    return dailyRevenue.map((d: any) => ({
      label: d.dateKey.slice(8, 10), // DD
      fullLabel: d.dateKey.split("-").reverse().join("/"),
      value: Number(d.total || 0),
      count: Number(d.count || 0),
    }));
  }, [dailyRevenue]);

  const maxValue = useMemo(() => {
    const m = Math.max(0, ...chartSeries.map((x) => x.value));
    return m || 1;
  }, [chartSeries]);

  if (loading) {
    return (
      <View style={styles.loadingBox}>
        <ActivityIndicator size="large" color={GREEN} />
        <Text style={{ color: "#555", marginTop: 10 }}>Đang tải dữ liệu...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
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

        {/* KPI */}
        <View style={styles.kpiGrid}>
          <KpiCard icon="cash-outline" title="Doanh thu" value={VND(revenue)} />
          <KpiCard icon="receipt-outline" title="Số đơn" value={ordersCount.toString()} />
        </View>

        {/* Bar chart */}
        <Text style={styles.blockTitle}>Doanh thu theo ngày</Text>
        <View style={styles.block}>
          {chartSeries.length === 0 ? (
            <Text style={{ color: "#777" }}>Không có dữ liệu trong khoảng này.</Text>
          ) : (
            <>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={[styles.chartWrap, { minWidth: Math.max(screenW - 32 - 24, chartSeries.length * 28) }]}>
                  {/* trục y (mốc max) */}
                  <View style={styles.yAxis}>
                    <Text style={styles.yAxisText}>{VND(maxValue)}</Text>
                    <View style={{ flex: 1 }} />
                    <Text style={styles.yAxisText}>{VND(0)}</Text>
                  </View>

                  {/* vùng bars */}
                  <View style={styles.barsArea}>
                    {chartSeries.map((p, idx) => {
                      const h = Math.max(6, Math.round((p.value / maxValue) * 160)); // 160px chart height
                      return (
                        <View key={`${p.fullLabel}-${idx}`} style={styles.barItem}>
                          <View style={styles.barCol}>
                            <View style={[styles.bar, { height: h }]} />
                          </View>
                          <Text style={styles.barLabel}>{p.label}</Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              </ScrollView>
            </>
          )}

          {/* list dưới chart */}
          <View style={{ height: 12 }} />
          <FlatList
            data={dailyRevenue}
            keyExtractor={(item) => item.dateKey}
            ItemSeparatorComponent={() => <View style={styles.sep} />}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <View style={styles.row}>
                <Text style={styles.rowLeft}>{item.dateKey.split("-").reverse().join("/")}</Text>
                <View style={styles.rowRight}>
                  <Text style={styles.rowSub}>{item.count} đơn</Text>
                  <Text style={styles.rowMain}>{VND(item.total)}</Text>
                </View>
              </View>
            )}
          />
        </View>

        <View style={{ height: 18 }} />
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
  <TouchableOpacity onPress={onPress} style={[styles.filterBtn, active && styles.filterBtnActive]}>
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
      <Ionicons name={icon} size={18} color={GREEN} />
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
  filterBtn: { backgroundColor: "#EDECEC", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18 },
  filterBtnActive: { backgroundColor: GREEN },
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

  hintText: { color: "#6b7280", fontSize: 12, marginBottom: 10 },

  chartWrap: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  yAxis: {
    width: 90,
    height: 180,
    justifyContent: "space-between",
    paddingRight: 10,
  },
  yAxisText: { color: "#6b7280", fontSize: 10 },

  barsArea: {
    height: 180,
    flexDirection: "row",
    alignItems: "flex-end",
    paddingBottom: 6,
  },
  barItem: {
    width: 28,
    alignItems: "center",
    justifyContent: "flex-end",
    marginRight: 6,
  },
  barCol: {
    height: 160,
    width: 18,
    justifyContent: "flex-end",
    borderRadius: 10,
    backgroundColor: "rgba(51,105,30,0.08)",
    overflow: "hidden",
  },
  bar: {
    width: "100%",
    borderRadius: 10,
    backgroundColor: GREEN,
  },
  barLabel: { marginTop: 6, fontSize: 10, color: "#374151" },

  sep: { height: 10 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", paddingVertical: 6 },
  rowLeft: { color: "#333", fontSize: 14, flexShrink: 1, paddingRight: 12 },
  rowRight: { alignItems: "flex-end" },
  rowSub: { color: "#777", fontSize: 12, marginBottom: 2 },
  rowMain: { color: "#E53935", fontWeight: "700", fontSize: 14 },
});
