import React, { useState, useEffect, useMemo } from "react";
import {
  ShieldCheck, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
  CheckCircle2, Circle, Users, Receipt, ChevronLeft, ChevronRight
} from "lucide-react";

/* ---------- design tokens (đồng bộ bản quản trị) ---------- */
const C = {
  pitch950: "#0F231B", pitch700: "#1B4332", pitch500: "#2D6A4F", pitch200: "#B9D4C4",
  chalk: "#F6F3EC", chalkDim: "#EFEADC", line: "#DBD3BE",
  gold: "#E3B23C", goldDeep: "#B8862A",
  thu: "#3F8F5F", thuBg: "#E4F2E8", chi: "#B5482F", chiBg: "#F7E7E1",
  ink: "#1F2A22", inkSoft: "#5C685F",
};
const displayFont = "'Oswald','Arial Narrow',sans-serif";
const numFont = "'DM Mono','SFMono-Regular',Menlo,Consolas,monospace";
const bodyFont = "'Inter','Helvetica Neue',Arial,sans-serif";
const MONTHS_VN_FULL = ["Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"];

function fmt(n) { return Math.round(Number(n) || 0).toLocaleString("vi-VN"); }
function todayISO() { return new Date().toISOString().slice(0, 10); }
function monthKey(d) { return d.slice(0, 7); }
function initials(name) { const p = name.trim().split(/\s+/); return (p[p.length - 1]?.[0] || "?").toUpperCase(); }

function EmptyState({ icon, text }) {
  return (
    <div className="rounded-2xl border border-dashed flex flex-col items-center text-center gap-2 px-6 py-8" style={{ borderColor: C.line }}>
      {icon}<p className="text-sm" style={{ color: C.inkSoft, fontFamily: bodyFont }}>{text}</p>
    </div>
  );
}
function TxRow({ tx, memberName }) {
  const isThu = tx.type === "thu";
  return (
    <div className="flex items-center gap-3 py-3 border-b" style={{ borderColor: C.line }}>
      <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: isThu ? C.thuBg : C.chiBg, color: isThu ? C.thu : C.chi }}>
        {isThu ? <ArrowDownRight size={16} /> : <ArrowUpRight size={16} />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium truncate" style={{ color: C.ink, fontFamily: bodyFont }}>{tx.category}{memberName ? ` · ${memberName}` : ""}</p>
          <p className="text-sm font-semibold shrink-0" style={{ color: isThu ? C.thu : C.chi, fontFamily: numFont }}>{isThu ? "+" : "-"}{fmt(tx.amount)}</p>
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <p className="text-xs truncate" style={{ color: C.inkSoft, fontFamily: bodyFont }}>{tx.note || "—"}</p>
          <p className="text-xs shrink-0" style={{ color: C.inkSoft, fontFamily: numFont }}>{tx.date}</p>
        </div>
      </div>
    </div>
  );
}

/* ---------- scoreboard (read-only) ---------- */
function Scoreboard({ teamName, balance }) {
  const netPattern = { backgroundImage: `repeating-linear-gradient(45deg, rgba(246,243,236,0.05) 0 1px, transparent 1px 14px), repeating-linear-gradient(-45deg, rgba(246,243,236,0.05) 0 1px, transparent 1px 14px)` };
  return (
    <div className="relative overflow-hidden px-5 pt-6 pb-6" style={{ background: `linear-gradient(180deg, ${C.pitch950}, ${C.pitch700})` }}>
      <div className="absolute inset-0" style={netPattern} />
      <div className="relative flex items-center justify-between mb-5">
        <div className="flex items-center gap-2 min-w-0">
          <img src="/logo.png" alt="FC 8X+ Logo" className="w-8 h-8 rounded-full object-cover shrink-0 border border-[#E3B23C]" />
          <span className="text-sm font-semibold tracking-wide uppercase truncate" style={{ color: C.chalk, fontFamily: displayFont }}>{teamName}</span>
        </div>
        <span className="text-[10px] px-2 py-1 rounded-full uppercase tracking-wider shrink-0" style={{ background: "rgba(246,243,236,0.12)", color: C.pitch200, fontFamily: bodyFont }}>Công khai</span>
      </div>
      <div className="relative">
        <p className="text-xs uppercase tracking-[0.2em] mb-1" style={{ color: C.pitch200, fontFamily: bodyFont }}>Quỹ hiện có</p>
        <p className="text-4xl font-bold tabular-nums" style={{ color: C.chalk, fontFamily: numFont, letterSpacing: "-0.02em" }}>
          {fmt(balance)} <span className="text-lg" style={{ color: C.gold }}>đ</span>
        </p>
      </div>
    </div>
  );
}

/* ---------- month switcher ---------- */
function MonthSwitcher({ monthList, selected, onSelect }) {
  return (
    <div className="flex items-center gap-2 px-5 py-3 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
      {monthList.map((mk) => {
        const active = mk === selected;
        const [y, m] = mk.split("-");
        return (
          <button key={mk} onClick={() => onSelect(mk)}
            className="shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap"
            style={{ background: active ? C.pitch700 : "#fff", color: active ? C.chalk : C.inkSoft, border: `1px solid ${active ? C.pitch700 : C.line}`, fontFamily: bodyFont }}>
            Th{Number(m)}/{y}
          </button>
        );
      })}
    </div>
  );
}

/* ---------- root ---------- */
export default function QuyCongKhaiApp() {
  const [loaded, setLoaded] = useState(false);
  const [teamName, setTeamName] = useState("FC 8X+ XUÂN ĐÌNH");
  const [members, setMembers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(monthKey(todayISO()));

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await window.storage.get("club-data", true);
        if (res && res.value) {
          const data = JSON.parse(res.value);
          setTeamName(data.teamName || "FC 8X+ XUÂN ĐÌNH");
          setMembers(data.members || []);
          setTransactions(data.transactions || []);
        }
      } catch {
        /* chưa có dữ liệu */
      } finally {
        setLoaded(true);
      }
    };

    loadData();

    const handleSync = (e) => {
      try {
        if (e.detail) {
          const data = JSON.parse(e.detail);
          setTeamName(data.teamName || "FC 8X+ XUÂN ĐÌNH");
          setMembers(data.members || []);
          setTransactions(data.transactions || []);
        }
      } catch (err) {}
    };

    window.addEventListener("club-data-changed", handleSync);
    return () => window.removeEventListener("club-data-changed", handleSync);
  }, []);

  const balance = useMemo(() => transactions.reduce((s, t) => s + (t.type === "thu" ? t.amount : -t.amount), 0), [transactions]);

  const monthList = useMemo(() => {
    const set = new Set(transactions.map((t) => monthKey(t.date)));
    set.add(monthKey(todayISO()));
    return Array.from(set).sort().reverse();
  }, [transactions]);

  useEffect(() => {
    if (loaded && monthList.length && !monthList.includes(selectedMonth)) setSelectedMonth(monthList[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, monthList]);

  const monthTx = transactions.filter((t) => monthKey(t.date) === selectedMonth);
  const monthThu = monthTx.filter((t) => t.type === "thu").reduce((s, t) => s + t.amount, 0);
  const monthChi = monthTx.filter((t) => t.type === "chi").reduce((s, t) => s + t.amount, 0);
  const monthChiList = monthTx.filter((t) => t.type === "chi").sort((a, b) => (a.date < b.date ? 1 : -1));
  const monthOtherThuList = monthTx.filter((t) => t.type === "thu" && t.category !== "Quỹ thành viên").sort((a, b) => (a.date < b.date ? 1 : -1));

  const attendance = members.map((m) => ({
    ...m,
    paid: monthTx.some((t) => t.memberId === m.id && t.type === "thu" && t.category === "Quỹ thành viên"),
  }));
  const paidCount = attendance.filter((a) => a.paid).length;

  const [y, m] = (selectedMonth || monthKey(todayISO())).split("-");
  const monthLabel = `${MONTHS_VN_FULL[Number(m) - 1]}/${y}`;

  const idx = monthList.indexOf(selectedMonth);
  const goPrev = () => idx < monthList.length - 1 && setSelectedMonth(monthList[idx + 1]);
  const goNext = () => idx > 0 && setSelectedMonth(monthList[idx - 1]);

  if (!loaded) {
    return <div className="min-h-screen flex items-center justify-center" style={{ background: C.chalk }}><p className="text-sm" style={{ color: C.inkSoft, fontFamily: bodyFont }}>Đang tải sổ quỹ...</p></div>;
  }

  return (
    <div className="w-full flex justify-center" style={{ background: C.chalkDim }}>
      <div className="w-full sm:max-w-sm relative min-h-screen" style={{ background: C.chalk }}>
        <Scoreboard teamName={teamName} balance={balance} />

        <MonthSwitcher monthList={monthList} selected={selectedMonth} onSelect={setSelectedMonth} />

        <div className="px-5 pt-3 pb-28 space-y-6">
          <div className="flex items-center justify-between mb-1">
            <button onClick={goPrev} disabled={idx >= monthList.length - 1} className="p-1.5 rounded-full disabled:opacity-30 shadow-sm" style={{ background: "#fff", border: `1px solid ${C.line}` }}>
              <ChevronLeft size={15} color={C.ink} />
            </button>
            <h2 className="text-sm font-bold uppercase tracking-wide" style={{ color: C.ink, fontFamily: displayFont }}>{monthLabel}</h2>
            <button onClick={goNext} disabled={idx <= 0} className="p-1.5 rounded-full disabled:opacity-30 shadow-sm" style={{ background: "#fff", border: `1px solid ${C.line}` }}>
              <ChevronRight size={15} color={C.ink} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div className="rounded-xl px-3 py-3 border shadow-sm" style={{ borderColor: C.line, background: "#fff" }}>
              <div className="flex items-center gap-1.5 mb-1"><TrendingUp size={13} color={C.thu} /><span className="text-[11px] uppercase tracking-wide" style={{ color: C.inkSoft, fontFamily: bodyFont }}>Thu trong tháng</span></div>
              <p className="text-base font-semibold tabular-nums" style={{ color: C.thu, fontFamily: numFont }}>{fmt(monthThu)} đ</p>
            </div>
            <div className="rounded-xl px-3 py-3 border shadow-sm" style={{ borderColor: C.line, background: "#fff" }}>
              <div className="flex items-center gap-1.5 mb-1"><TrendingDown size={13} color={C.chi} /><span className="text-[11px] uppercase tracking-wide" style={{ color: C.inkSoft, fontFamily: bodyFont }}>Chi trong tháng</span></div>
              <p className="text-base font-semibold tabular-nums" style={{ color: C.chi, fontFamily: numFont }}>{fmt(monthChi)} đ</p>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold uppercase tracking-wide flex items-center gap-1.5" style={{ color: C.ink, fontFamily: displayFont }}>
                <Users size={14} /> Điểm danh đóng quỹ
              </h3>
              <span className="text-xs font-medium" style={{ color: C.inkSoft, fontFamily: bodyFont }}>{paidCount}/{members.length} đã đóng</span>
            </div>
            {members.length === 0 ? (
              <EmptyState icon={<Users size={20} color={C.pitch500} />} text="Đội chưa có danh sách thành viên." />
            ) : (
              <div className="rounded-2xl border divide-y shadow-sm" style={{ borderColor: C.line, background: "#fff" }}>
                {attendance.map((m) => (
                  <div key={m.id} className="flex items-center gap-3 px-4 py-2.5">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ background: C.pitch200, color: C.pitch700, fontFamily: displayFont }}>{initials(m.name)}</div>
                    <p className="text-sm flex-1 truncate" style={{ color: C.ink, fontFamily: bodyFont }}>{m.name}</p>
                    {m.paid ? (
                      <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: C.thu, fontFamily: bodyFont }}><CheckCircle2 size={14} /> Đã đóng</span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: C.inkSoft, fontFamily: bodyFont }}><Circle size={14} /> Chưa đóng</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {monthOtherThuList.length > 0 && (
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wide mb-3" style={{ color: C.ink, fontFamily: displayFont }}>Khoản thu khác</h3>
              <div className="rounded-2xl border px-4 shadow-sm" style={{ borderColor: C.line, background: "#fff" }}>
                {monthOtherThuList.map((tx) => <TxRow key={tx.id} tx={tx} />)}
              </div>
            </div>
          )}

          <div>
            <h3 className="text-sm font-bold uppercase tracking-wide mb-3 flex items-center gap-1.5" style={{ color: C.ink, fontFamily: displayFont }}>
              <Receipt size={14} /> Chi tiêu trong tháng
            </h3>
            {monthChiList.length === 0 ? (
              <EmptyState icon={<Receipt size={20} color={C.pitch500} />} text="Tháng này chưa phát sinh khoản chi nào." />
            ) : (
              <div className="rounded-2xl border px-4 shadow-sm" style={{ borderColor: C.line, background: "#fff" }}>
                {monthChiList.map((tx) => <TxRow key={tx.id} tx={tx} />)}
              </div>
            )}
          </div>

          <p className="text-center text-[11px] pt-4" style={{ color: C.inkSoft, fontFamily: bodyFont }}>
            Cập nhật bởi Ban quản lý quỹ · Mọi thắc mắc vui lòng liên hệ thủ quỹ đội
          </p>
        </div>
      </div>
    </div>
  );
}
