import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, query, where, Timestamp } from "firebase/firestore";
import { db } from "@shared/FireBase";
import { useAuthContext } from "../../hooks/useAuth.jsx";
import "../css/Restaurant/Dashboard.css";

export default function RestaurantDashboard() {
  const { user, logout } = useAuthContext();

  const branchId = user?.branchId || user?.restaurantBranchId || "";
  const [todayOrders, setTodayOrders] = useState([]);
  const [activeFoods, setActiveFoods] = useState(0);
  const [loadingOrders, setLoadingOrders] = useState(true);

  // start of today (memo để khỏi tạo lại mỗi render)
  const startOfToday = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return Timestamp.fromDate(d);
  }, []);

  // 1) listen orders today
  useEffect(() => {
    if (!branchId) {
      setTodayOrders([]);
      setLoadingOrders(false);
      return;
    }

    const q1 = query(
      collection(db, "orders"),
      where("branchId", "==", branchId),
      where("createdAt", ">=", startOfToday)
    );

    const unsub = onSnapshot(
      q1,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        list.sort((a, b) => {
          const ta = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
          const tb = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
          return tb - ta;
        });
        setTodayOrders(list);
        setLoadingOrders(false);
      },
      (err) => {
        console.error("load orders dashboard error", err);
        setLoadingOrders(false);
      }
    );

    return () => unsub();
  }, [branchId, startOfToday]);

  // 2) count active foods (branchFoods)
  useEffect(() => {
    if (!branchId) {
      setActiveFoods(0);
      return;
    }

    const foodsRef = collection(db, "branches", branchId, "branchFoods");
    const unsub = onSnapshot(
      foodsRef,
      (snap) => {
        let active = 0;
        snap.forEach((d) => {
          const data = d.data();
          if (data?.isActive) active += 1;
        });
        setActiveFoods(active);
      },
      (err) => console.error("load branch foods error", err)
    );

    return () => unsub();
  }, [branchId]);

  // 3) metrics
  const todayRevenue = todayOrders.reduce(
    (sum, o) => sum + (typeof o.total === "number" ? o.total : 0),
    0
  );

  const waitingConfirm = todayOrders.filter((o) => o.status === "processing").length;
  const preparing = todayOrders.filter((o) => o.status === "preparing").length;

  const displayBranch = branchId ? branchId : "—";

  return (
    <div className="admin-layout">
      <main className="admin-main" id="dashboard">
        <div className="rest-dash-wrap">
          <div className="rest-dash-container">
            {/* HEADER */}
            <div className="rest-dash-head">
              <div>
                <h1 className="rest-dash-sub">Tổng quan nhanh về hoạt động hôm nay.</h1>
              </div>
            </div>

            {/* CARDS */}
            <section className="rest-dash-cards">
              <Card label="Đơn hôm nay" value={loadingOrders ? "…" : todayOrders.length} />
              <Card label="Đơn chờ xác nhận" value={loadingOrders ? "…" : waitingConfirm} />
              <Card
                label="Doanh thu hôm nay"
                value={loadingOrders ? "…" : `${todayRevenue.toLocaleString("vi-VN")}₫`}
                tone="danger"
              />
              <Card label="Chi nhánh" value={branchId ? 1 : 0} />
              <Card label="Đang chuẩn bị" value={loadingOrders ? "…" : preparing} />
            </section>

            {/* TABLE */}
            <section className="rest-dash-box">
              <div className="rest-dash-box-head">
                <h2>Đơn gần đây hôm nay</h2>
              </div>

              {todayOrders.length === 0 ? (
                <p className="rd-empty">Hôm nay chưa có đơn.</p>
              ) : (
                <table className="rd-table">
                  <thead>
                    <tr>
                      <th>Mã</th>
                      <th>Khách</th>
                      <th>Chi nhánh</th>
                      <th>Tổng</th>
                      <th>Trạng thái</th>
                      <th>Giờ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {todayOrders.slice(0, 8).map((o) => (
                      <tr key={o.id}>
                        <td className="rd-code">{o.code || o.id.slice(0, 6)}</td>
                        <td>{o.receiverName || "Khách"}</td>
                        <td>{o.branchId || displayBranch}</td>
                        <td>{(o.total || 0).toLocaleString("vi-VN")}₫</td>
                        <td>
                          <span className={`rd-badge rd-${o.status || "other"}`}>
                            {statusLabel(o.status)}
                          </span>
                        </td>
                        <td>
                          {o.createdAt?.toDate
                            ? o.createdAt.toDate().toLocaleTimeString("vi-VN", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

function Card({ label, value, tone }) {
  return (
    <div className={`rest-dash-card ${tone ? `tone-${tone}` : ""}`}>
      <p className="rd-label">{label}</p>
      <p className="rd-value">{value}</p>
    </div>
  );
}

function statusLabel(st) {
  const map = {
    processing: "Chờ xác nhận",
    preparing: "Đang chuẩn bị",
    shipping: "Đang giao",
    completed: "Hoàn thành",
    cancelled: "Đã huỷ",
  };
  return map[st] || "Khác";
}
