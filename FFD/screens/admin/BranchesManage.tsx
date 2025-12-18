import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "../../data/FireBase";
import BottomSheet from "../../components/BottomSheet";
import { TextInput } from "react-native-gesture-handler";
import { useNavigation } from "@react-navigation/native";

type OrderItem = {
  foodId?: string;
  price?: number;
  quantity?: number;
};

type OrderDoc = {
  id: string;
  branchId?: string;
  restaurantId?: string;
  status?: string;
  total?: number;
  totalAmount?: number;
  totalPrice?: number;
  items?: OrderItem[];
};

type FoodDoc = {
  id: string;
  price?: number;
};

const BranchesManage = () => {
  const navigation = useNavigation<any>();

  const [branches, setBranches] = useState<any[]>([]);
  const [orders, setOrders] = useState<OrderDoc[]>([]);
  const [foodMap, setFoodMap] = useState<Map<string, FoodDoc>>(new Map());

  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any | null>(null);
  const [editData, setEditData] = useState<any | null>(null);

  const DONE = useMemo(
    () => new Set(["delivered", "completed", "done", "success", "paid"]),
    []
  );

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);

      // branches
      const bSnap = await getDocs(collection(db, "branches"));
      const bData = bSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setBranches(bData);

      // orders
      const oSnap = await getDocs(collection(db, "orders"));
      const oData = oSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as OrderDoc[];
      setOrders(oData);

      // foods (để join nếu order không có total/price)
      // ⚠️ đổi "foods" nếu collection của bạn tên khác
      const fSnap = await getDocs(collection(db, "foods"));
      const fm = new Map<string, FoodDoc>();
      fSnap.docs.forEach((d) => fm.set(d.id, { id: d.id, ...(d.data() as any) }));
      setFoodMap(fm);

      setLoading(false);
    };

    fetchAll();
  }, []);

  const safeNumber = (v: any) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  const moneyOfOrder = (o: OrderDoc) => {
    const direct =
      (typeof o.total === "number" ? o.total : undefined) ??
      (typeof o.totalAmount === "number" ? o.totalAmount : undefined) ??
      (typeof o.totalPrice === "number" ? o.totalPrice : undefined);

    if (typeof direct === "number") return direct;

    // fallback: items.price OR join foods by foodId
    let sum = 0;
    for (const it of o.items ?? []) {
      const qty = safeNumber(it.quantity ?? 1);

      if (typeof it.price === "number") {
        sum += it.price * qty;
        continue;
      }

      const fid = String(it.foodId ?? "");
      if (fid) {
        const food = foodMap.get(fid);
        const price = safeNumber(food?.price ?? 0);
        sum += price * qty;
      }
    }
    return sum;
  };

  // doanh thu theo branchId
  const revenueByBranch = useMemo(() => {
    const map = new Map<string, number>();

    const doneOrders = orders.filter((o) =>
      DONE.has(String(o.status ?? "").toLowerCase())
    );

    doneOrders.forEach((o) => {
      const key = o.branchId || o.restaurantId || "UNKNOWN";
      const amount = moneyOfOrder(o);
      map.set(key, (map.get(key) ?? 0) + amount);
    });

    return map;
  }, [orders, foodMap, DONE]);

  const formatVND = (n: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n || 0);

  const openEdit = (branch: any) => {
    setSelected(branch);
    setEditData({ ...branch });
  };

  const closeSheet = () => {
    setSelected(null);
    setEditData(null);
  };

  const handleSave = async () => {
    if (!editData?.id) return;

    const payload = {
      name: editData.name ?? "",
      address: editData.address ?? "",
      phone: editData.phone ?? "",
    };

    await updateDoc(doc(db, "branches", editData.id), payload);
    setBranches((prev) => prev.map((b) => (b.id === editData.id ? { ...b, ...payload } : b)));
    closeSheet();
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color="#F58220" size="large" />;

  return (
    <View style={styles.container}>
      {/* Header + nút qua tab Doanh thu */}
      <View style={styles.headRow}>
        <Text style={styles.header}>🏢 Danh sách chi nhánh</Text>

        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => navigation.navigate("Doanh thu")}
        >
          <Ionicons name="stats-chart-outline" size={22} color="#33691E" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={branches}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const revenue = revenueByBranch.get(item.id) ?? 0;

          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate("BranchDetail", { branch: item })}
              onLongPress={() => openEdit(item)} // giữ lâu để sửa
            >
              <Ionicons name="business-outline" size={36} color="#33691E" />
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.sub}>{item.address}</Text>

                {/* ✅ doanh thu */}
                <View style={styles.revenueRow}>
                  <Ionicons name="cash-outline" size={16} color="#2E7D32" />
                  <Text style={styles.revenueText}>{formatVND(revenue)}</Text>
                </View>
              </View>

              <Ionicons name="chevron-forward-outline" size={20} color="#aaa" />
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={{ padding: 12 }}>
            <Text style={{ color: "#777" }}>Chưa có chi nhánh.</Text>
          </View>
        }
      />

      {/* BottomSheet chỉnh sửa (giữ lâu vào card để mở) */}
      <BottomSheet visible={!!selected} onClose={closeSheet} title="Chi tiết chi nhánh">
        <Text>Tên chi nhánh</Text>
        <TextInput
          style={styles.input}
          value={editData?.name ?? ""}
          onChangeText={(v) => setEditData((prev: any) => ({ ...prev, name: v }))}
        />

        <Text>Địa chỉ</Text>
        <TextInput
          style={styles.input}
          value={editData?.address ?? ""}
          onChangeText={(v) => setEditData((prev: any) => ({ ...prev, address: v }))}
        />

        <Text>Số điện thoại</Text>
        <TextInput
          style={styles.input}
          value={editData?.phone ?? ""}
          onChangeText={(v) => setEditData((prev: any) => ({ ...prev, phone: v }))}
        />

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveText}>Lưu thay đổi</Text>
        </TouchableOpacity>
      </BottomSheet>
    </View>
  );
};

export default BranchesManage;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 16 },

  headRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  header: { fontWeight: "bold", fontSize: 18 },

  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#F3F7F1",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#D9E6D3",
  },

  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  name: { fontSize: 16, fontWeight: "600" },
  sub: { fontSize: 13, color: "#777", marginTop: 2 },

  revenueRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 },
  revenueText: { color: "#2E7D32", fontWeight: "800" },

  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    marginBottom: 10,
    padding: 10,
    backgroundColor: "#fff",
  },
  saveBtn: { backgroundColor: "#33691E", padding: 12, borderRadius: 10, alignItems: "center" },
  saveText: { color: "#fff", fontWeight: "bold" },
});
