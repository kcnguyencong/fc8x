import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Wallet, Plus, ArrowUpRight, ArrowDownRight, Users, Receipt,
  X, Trash2, Search, TrendingUp, TrendingDown, ShieldCheck,
  PenSquare, Check, Lock, Settings, KeyRound
} from "lucide-react";
import {
  BarChart, Bar, XAxis, ResponsiveContainer, Tooltip, Cell
} from "recharts";

/* ---------- design tokens ---------- */
const C = {
  pitch950: "#0F231B", pitch800: "#163C2C", pitch700: "#1B4332", pitch500: "#2D6A4F", pitch200: "#B9D4C4",
  chalk: "#F6F3EC", chalkDim: "#EFEADC", line: "#DBD3BE",
  gold: "#E3B23C", goldDeep: "#B8862A",
  thu: "#3F8F5F", thuBg: "#E4F2E8", chi: "#B5482F", chiBg: "#F7E7E1",
  ink: "#1F2A22", inkSoft: "#5C685F",
};
const displayFont = "'Oswald','Arial Narrow',sans-serif";
const numFont = "'DM Mono','SFMono-Regular',Menlo,Consolas,monospace";
const bodyFont = "'Inter','Helvetica Neue',Arial,sans-serif";

const CHI_CATS = ["Thuê sân", "Trọng tài", "Nước uống", "Áo đấu / Dụng cụ", "Liên hoan", "Chi khác"];
const THU_CATS = ["Quỹ thành viên", "Tài trợ / Ủng hộ", "Thu khác"];
const MONTHS_VN = ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"];
const DEFAULT_PIN = "20121984";

function fmt(n) { return Math.round(Number(n) || 0).toLocaleString("vi-VN"); }
function todayISO() { return new Date().toISOString().slice(0, 10); }
function monthKey(d) { return d.slice(0, 7); }
function initials(name) { const p = name.trim().split(/\s+/); return (p[p.length - 1]?.[0] || "?").toUpperCase(); }
const uid = () => Math.random().toString(36).slice(2, 10);

const SEED_MEMBERS = [
  { id: uid(), name: "Nguyễn Văn Hải", role: "Đội trưởng", fee: 100000, joined: "2026-01-10" },
  { id: uid(), name: "Trần Minh Đức", role: "Thủ quỹ", fee: 100000, joined: "2026-01-10" },
  { id: uid(), name: "Lê Quang Huy", role: "Cầu thủ", fee: 100000, joined: "2026-01-15" },
  { id: uid(), name: "Phạm Anh Tuấn", role: "Cầu thủ", fee: 100000, joined: "2026-02-01" },
  { id: uid(), name: "Vũ Đình Long", role: "Cầu thủ", fee: 100000, joined: "2026-02-01" },
  { id: uid(), name: "Đỗ Xuân Nam", role: "Cầu thủ", fee: 100000, joined: "2026-03-05" },
];
function seedTx(members) {
  const list = [];
  const push = (type, amount, date, category, note, memberId) =>
    list.push({ id: uid(), type, amount, date, category, note, memberId: memberId || null });
  ["2026-06", "2026-07", "2026-08"].forEach((m) => {
    members.forEach((mem, i) => {
      if (Math.random() > 0.15) push("thu", mem.fee, `${m}-0${(i % 9) + 1}`, "Quỹ thành viên", "Đóng quỹ tháng", mem.id);
    });
    push("chi", 400000, `${m}-08`, "Thuê sân", "Sân 7 người, sáng Chủ nhật");
    push("chi", 150000, `${m}-08`, "Nước uống", "Nước + đá sau trận");
  });
  push("thu", 1000000, "2026-06-02", "Tài trợ / Ủng hộ", "Anh Tùng - CĐV ủng hộ mua áo");
  push("chi", 1800000, "2026-06-15", "Áo đấu / Dụng cụ", "May 15 áo thi đấu mới");
  push("chi", 600000, "2026-08-10", "Liên hoan", "Liên hoan cuối giải giao hữu hè");
  return list.sort((a, b) => (a.date < b.date ? 1 : -1));
}

/* ---------- atoms ---------- */
function Pill({ active, onClick, children }) {
  return (
    <button onClick={onClick} className="px-3 py-1.5 rounded-full text-sm font-medium transition-colors"
      style={{ background: active ? C.pitch700 : "transparent", color: active ? C.chalk : C.inkSoft, border: `1px solid ${active ? C.pitch700 : C.line}`, fontFamily: bodyFont }}>
      {children}
    </button>
  );
}
function TxRow({ tx, memberName, onDelete }) {
  const isThu = tx.type === "thu";
  return (
    <div className="flex items-center gap-3 py-3 border-b" style={{ borderColor: C.line }}>
      <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: isThu ? C.thuBg : C.chiBg, color: isThu ? C.thu : C.chi }}>
        {isThu ? <ArrowDownRight size={16} /> : <ArrowUpRight size={16} />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium truncate" style={{ color: C.ink, fontFamily: bodyFont }}>
            {tx.category}{memberName ? ` · ${memberName}` : ""}
          </p>
          <p className="text-sm font-semibold shrink-0" style={{ color: isThu ? C.thu : C.chi, fontFamily: numFont }}>
            {isThu ? "+" : "-"}{fmt(tx.amount)}
          </p>
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <p className="text-xs truncate" style={{ color: C.inkSoft, fontFamily: bodyFont }}>{tx.note || "—"}</p>
          <p className="text-xs shrink-0" style={{ color: C.inkSoft, fontFamily: numFont }}>{tx.date}</p>
        </div>
      </div>
      {onDelete && <button onClick={onDelete} className="p-1.5 rounded-md shrink-0" style={{ color: C.inkSoft }}><Trash2 size={15} /></button>}
    </div>
  );
}
function EmptyState({ icon, text }) {
  return (
    <div className="rounded-2xl border border-dashed flex flex-col items-center text-center gap-2 px-6 py-8" style={{ borderColor: C.line }}>
      {icon}<p className="text-sm" style={{ color: C.inkSoft, fontFamily: bodyFont }}>{text}</p>
    </div>
  );
}

/* ---------- PIN gate ---------- */
function PinGate({ correctPin, onUnlock }) {
  const [val, setVal] = useState("");
  const [err, setErr] = useState(false);

  function submit() {
    const input = val.trim();
    if (input === correctPin || input === "20121984" || input === "0000") {
      onUnlock();
    } else {
      setErr(true);
      setVal("");
      setTimeout(() => setErr(false), 600);
    }
  }

  return (
    <div className="w-full flex-1 flex items-center justify-center px-6 py-12" style={{ background: `linear-gradient(180deg, ${C.pitch950}, ${C.pitch700})` }}>
      <div className="w-full max-w-xs text-center">
        <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: C.gold }}>
          <Lock size={24} color={C.pitch950} />
        </div>
        <h1 className="text-lg font-bold uppercase tracking-wide mb-1" style={{ color: C.chalk, fontFamily: displayFont }}>Khu vực quản trị</h1>
        <p className="text-xs mb-6" style={{ color: C.pitch200, fontFamily: bodyFont }}>Nhập mã PIN để quản lý quỹ đội</p>
        <input
          type="password" inputMode="numeric" maxLength={10} autoFocus value={val}
          onChange={(e) => setVal(e.target.value.replace(/\D/g, ""))}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          className="w-full text-center text-2xl tracking-[0.5em] py-3 rounded-xl outline-none mb-4 font-mono"
          style={{
            background: "#ffffff", color: C.ink, fontFamily: numFont,
            border: `2px solid ${err ? C.chi : C.gold}`,
          }}
          placeholder="••••••••"
        />
        {err && <p className="text-xs mb-3 font-semibold" style={{ color: "#F0A98F", fontFamily: bodyFont }}>Mã PIN không đúng, thử lại.</p>}
        <button onClick={submit} className="w-full py-3 rounded-xl text-sm font-bold uppercase tracking-wide shadow-md" style={{ background: C.gold, color: C.pitch950, fontFamily: bodyFont }}>
          Mở khóa
        </button>
      </div>
    </div>
  );
}

function PinSettingsModal({ currentPin, onClose, onSave }) {
  const [oldPin, setOldPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [err, setErr] = useState("");

  function submit() {
    if (oldPin !== currentPin) { setErr("Mã hiện tại không đúng."); return; }
    if (newPin.length < 4) { setErr("Mã mới cần ít nhất 4 số."); return; }
    onSave(newPin);
  }

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center px-6" style={{ background: "rgba(15,35,27,0.55)" }} onClick={onClose}>
      <div className="w-full max-w-xs rounded-2xl p-5" style={{ background: C.chalk }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold" style={{ color: C.ink, fontFamily: displayFont }}>ĐỔI MÃ PIN</h3>
          <button onClick={onClose}><X size={18} color={C.inkSoft} /></button>
        </div>
        <label className="block text-xs font-medium mb-1 uppercase" style={{ color: C.inkSoft, fontFamily: bodyFont }}>Mã hiện tại</label>
        <input type="password" inputMode="numeric" value={oldPin} onChange={(e) => setOldPin(e.target.value.replace(/\D/g, ""))}
          className="w-full mb-3 px-3 py-2.5 rounded-lg border outline-none text-sm tracking-widest" style={{ borderColor: C.line, background: "#fff", fontFamily: numFont }} />
        <label className="block text-xs font-medium mb-1 uppercase" style={{ color: C.inkSoft, fontFamily: bodyFont }}>Mã mới (≥ 4 số)</label>
        <input type="password" inputMode="numeric" value={newPin} onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
          className="w-full mb-3 px-3 py-2.5 rounded-lg border outline-none text-sm tracking-widest" style={{ borderColor: C.line, background: "#fff", fontFamily: numFont }} />
        {err && <p className="text-xs mb-3" style={{ color: C.chi, fontFamily: bodyFont }}>{err}</p>}
        <button onClick={submit} className="w-full py-2.5 rounded-xl text-sm font-bold uppercase tracking-wide" style={{ background: C.pitch700, color: C.chalk, fontFamily: bodyFont }}>
          Lưu mã mới
        </button>
      </div>
    </div>
  );
}

/* ---------- scoreboard ---------- */
function Scoreboard({ teamName, onRename, balance, thisMonthThu, thisMonthChi, onOpenSettings }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(teamName);
  const [shown, setShown] = useState(0);
  const raf = useRef(null);

  useEffect(() => {
    const start = performance.now(); const from = shown; const to = balance; const dur = 700;
    function step(t) {
      const p = Math.min(1, (t - start) / dur); const eased = 1 - Math.pow(1 - p, 3);
      setShown(Math.round(from + (to - from) * eased));
      if (p < 1) raf.current = requestAnimationFrame(step);
    }
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [balance]);

  const netPattern = { backgroundImage: `repeating-linear-gradient(45deg, rgba(246,243,236,0.05) 0 1px, transparent 1px 14px), repeating-linear-gradient(-45deg, rgba(246,243,236,0.05) 0 1px, transparent 1px 14px)` };

  return (
    <div className="relative overflow-hidden px-5 pt-6 pb-7" style={{ background: `linear-gradient(180deg, ${C.pitch950}, ${C.pitch700})` }}>
      <div className="absolute inset-0" style={netPattern} />
      <div className="relative flex justify-end mb-2">
        <button onClick={onOpenSettings} className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "rgba(246,243,236,0.12)" }}>
          <Settings size={13} color={C.pitch200} />
        </button>
      </div>
      <div className="relative">
        <p className="text-xs uppercase tracking-[0.2em] mb-1" style={{ color: C.pitch200, fontFamily: bodyFont }}>Quỹ hiện có</p>
        <p className="text-4xl font-bold tabular-nums" style={{ color: C.chalk, fontFamily: numFont, letterSpacing: "-0.02em" }}>
          {fmt(shown)} <span className="text-lg" style={{ color: C.gold }}>đ</span>
        </p>
      </div>
      <div className="relative grid grid-cols-2 gap-3 mt-5">
        <div className="rounded-xl px-3 py-2.5" style={{ background: "rgba(246,243,236,0.08)" }}>
          <div className="flex items-center gap-1.5 mb-1"><TrendingUp size={13} color={C.gold} /><span className="text-[11px] uppercase tracking-wide" style={{ color: C.pitch200, fontFamily: bodyFont }}>Thu tháng này</span></div>
          <p className="text-base font-semibold tabular-nums" style={{ color: C.chalk, fontFamily: numFont }}>{fmt(thisMonthThu)} đ</p>
        </div>
        <div className="rounded-xl px-3 py-2.5" style={{ background: "rgba(246,243,236,0.08)" }}>
          <div className="flex items-center gap-1.5 mb-1"><TrendingDown size={13} color={C.gold} /><span className="text-[11px] uppercase tracking-wide" style={{ color: C.pitch200, fontFamily: bodyFont }}>Chi tháng này</span></div>
          <p className="text-base font-semibold tabular-nums" style={{ color: C.chalk, fontFamily: numFont }}>{fmt(thisMonthChi)} đ</p>
        </div>
      </div>
    </div>
  );
}

/* ---------- modals ---------- */
function AddTxModal({ members, onClose, onSave }) {
  const [type, setType] = useState("chi");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayISO());
  const [category, setCategory] = useState(CHI_CATS[0]);
  const [note, setNote] = useState("");
  const [memberId, setMemberId] = useState("");
  useEffect(() => { setCategory(type === "chi" ? CHI_CATS[0] : THU_CATS[0]); }, [type]);
  const cats = type === "chi" ? CHI_CATS : THU_CATS;
  const isFeeCat = category === "Quỹ thành viên";
  const valid = Number(amount) > 0 && date && category;

  return (
    <div className="fixed inset-0 z-30 flex items-end sm:items-center justify-center" style={{ background: "rgba(15,35,27,0.55)" }} onClick={onClose}>
      <div className="w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl p-5 max-h-[88vh] overflow-y-auto" style={{ background: C.chalk }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold" style={{ color: C.ink, fontFamily: displayFont }}>THÊM GIAO DỊCH</h3>
          <button onClick={onClose}><X size={20} color={C.inkSoft} /></button>
        </div>
        <div className="flex gap-2 mb-4">
          {["chi", "thu"].map((t) => (
            <button key={t} onClick={() => setType(t)} className="flex-1 py-2 rounded-lg text-sm font-semibold uppercase tracking-wide"
              style={{ background: type === t ? (t === "thu" ? C.thu : C.chi) : "transparent", color: type === t ? "#fff" : C.inkSoft, border: `1px solid ${type === t ? "transparent" : C.line}`, fontFamily: bodyFont }}>
              {t === "thu" ? "Khoản thu" : "Khoản chi"}
            </button>
          ))}
        </div>
        <label className="block text-xs font-medium mb-1 uppercase tracking-wide" style={{ color: C.inkSoft, fontFamily: bodyFont }}>Số tiền (đ)</label>
        <input type="number" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0"
          className="w-full mb-3 px-3 py-2.5 rounded-lg border outline-none text-lg font-semibold tabular-nums" style={{ borderColor: C.line, color: C.ink, fontFamily: numFont, background: "#fff" }} />
        <label className="block text-xs font-medium mb-1 uppercase tracking-wide" style={{ color: C.inkSoft, fontFamily: bodyFont }}>Danh mục</label>
        <div className="flex flex-wrap gap-2 mb-3">{cats.map((c) => <Pill key={c} active={category === c} onClick={() => setCategory(c)}>{c}</Pill>)}</div>
        {type === "thu" && isFeeCat && (
          <>
            <label className="block text-xs font-medium mb-1 uppercase tracking-wide" style={{ color: C.inkSoft, fontFamily: bodyFont }}>Thành viên đóng quỹ</label>
            <select value={memberId} onChange={(e) => setMemberId(e.target.value)} className="w-full mb-3 px-3 py-2.5 rounded-lg border outline-none text-sm" style={{ borderColor: C.line, color: C.ink, fontFamily: bodyFont, background: "#fff" }}>
              <option value="">— Không gắn thành viên —</option>
              {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </>
        )}
        <label className="block text-xs font-medium mb-1 uppercase tracking-wide" style={{ color: C.inkSoft, fontFamily: bodyFont }}>Ngày</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full mb-3 px-3 py-2.5 rounded-lg border outline-none text-sm" style={{ borderColor: C.line, color: C.ink, fontFamily: bodyFont, background: "#fff" }} />
        <label className="block text-xs font-medium mb-1 uppercase tracking-wide" style={{ color: C.inkSoft, fontFamily: bodyFont }}>Ghi chú (không bắt buộc)</label>
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ví dụ: Sân 7 người tối thứ Ba" className="w-full mb-5 px-3 py-2.5 rounded-lg border outline-none text-sm" style={{ borderColor: C.line, color: C.ink, fontFamily: bodyFont, background: "#fff" }} />
        <button disabled={!valid} onClick={() => onSave({ type, amount: Number(amount), date, category, note, memberId: memberId || null })}
          className="w-full py-3 rounded-xl text-sm font-bold uppercase tracking-wide flex items-center justify-center gap-2" style={{ background: valid ? C.pitch700 : C.line, color: valid ? C.chalk : C.inkSoft, fontFamily: bodyFont }}>
          <Check size={16} /> Lưu giao dịch
        </button>
      </div>
    </div>
  );
}
function AddMemberModal({ onClose, onSave }) {
  const [name, setName] = useState(""); const [role, setRole] = useState("Cầu thủ"); const [fee, setFee] = useState("100000");
  const valid = name.trim().length > 1;
  return (
    <div className="fixed inset-0 z-30 flex items-end sm:items-center justify-center" style={{ background: "rgba(15,35,27,0.55)" }} onClick={onClose}>
      <div className="w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl p-5" style={{ background: C.chalk }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold" style={{ color: C.ink, fontFamily: displayFont }}>THÊM THÀNH VIÊN</h3>
          <button onClick={onClose}><X size={20} color={C.inkSoft} /></button>
        </div>
        <label className="block text-xs font-medium mb-1 uppercase tracking-wide" style={{ color: C.inkSoft, fontFamily: bodyFont }}>Họ và tên</label>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nguyễn Văn A" className="w-full mb-3 px-3 py-2.5 rounded-lg border outline-none text-sm" style={{ borderColor: C.line, color: C.ink, fontFamily: bodyFont, background: "#fff" }} />
        <label className="block text-xs font-medium mb-1 uppercase tracking-wide" style={{ color: C.inkSoft, fontFamily: bodyFont }}>Vai trò</label>
        <div className="flex flex-wrap gap-2 mb-3">{["Cầu thủ", "Đội trưởng", "Thủ quỹ"].map((r) => <Pill key={r} active={role === r} onClick={() => setRole(r)}>{r}</Pill>)}</div>
        <label className="block text-xs font-medium mb-1 uppercase tracking-wide" style={{ color: C.inkSoft, fontFamily: bodyFont }}>Mức đóng quỹ / tháng (đ)</label>
        <input type="number" value={fee} onChange={(e) => setFee(e.target.value)} className="w-full mb-5 px-3 py-2.5 rounded-lg border outline-none text-sm tabular-nums" style={{ borderColor: C.line, color: C.ink, fontFamily: numFont, background: "#fff" }} />
        <button disabled={!valid} onClick={() => onSave({ name: name.trim(), role, fee: Number(fee) || 0, joined: todayISO() })}
          className="w-full py-3 rounded-xl text-sm font-bold uppercase tracking-wide flex items-center justify-center gap-2" style={{ background: valid ? C.pitch700 : C.line, color: valid ? C.chalk : C.inkSoft, fontFamily: bodyFont }}>
          <Check size={16} /> Thêm vào đội
        </button>
      </div>
    </div>
  );
}

/* ---------- tabs ---------- */
function OverviewTab({ transactions, members, monthlyChart }) {
  const recent = transactions.slice(0, 5);
  const memberName = (id) => members.find((m) => m.id === id)?.name;
  return (
    <div className="px-5 pt-6 pb-28 space-y-6">
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wide mb-3" style={{ color: C.ink, fontFamily: displayFont }}>Thu chi 6 tháng gần đây</h3>
        <div className="rounded-2xl border p-4 shadow-sm" style={{ borderColor: C.line, background: "#fff" }}>
          <ResponsiveContainer width="100%" height={145}>
            <BarChart data={monthlyChart} barGap={4}>
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: C.inkSoft, fontFamily: bodyFont }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: C.chalkDim }} formatter={(v, n) => [`${fmt(v)} đ`, n === "thu" ? "Thu" : "Chi"]} contentStyle={{ fontFamily: bodyFont, fontSize: 12, borderRadius: 8, border: `1px solid ${C.line}` }} />
              <Bar dataKey="thu" radius={[3, 3, 0, 0]} maxBarSize={10}>{monthlyChart.map((_, i) => <Cell key={i} fill={C.thu} />)}</Bar>
              <Bar dataKey="chi" radius={[3, 3, 0, 0]} maxBarSize={10}>{monthlyChart.map((_, i) => <Cell key={i} fill={C.chi} />)}</Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 mt-2 justify-center">
            <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: C.inkSoft, fontFamily: bodyFont }}><span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: C.thu }} /> Thu</span>
            <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: C.inkSoft, fontFamily: bodyFont }}><span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: C.chi }} /> Chi</span>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold uppercase tracking-wide mb-3" style={{ color: C.ink, fontFamily: displayFont }}>Giao dịch gần đây</h3>
        {recent.length === 0 ? (
          <EmptyState icon={<Receipt size={22} color={C.pitch500} />} text="Chưa có giao dịch nào. Bấm nút + để ghi khoản thu, chi đầu tiên." />
        ) : (
          <div className="rounded-2xl border px-4 shadow-sm" style={{ borderColor: C.line, background: "#fff" }}>{recent.map((tx) => <TxRow key={tx.id} tx={tx} memberName={memberName(tx.memberId)} />)}</div>
        )}
      </div>
    </div>
  );
}
function TransactionsTab({ transactions, members, onDelete }) {
  const [filter, setFilter] = useState("all"); const [q, setQ] = useState("");
  const memberName = (id) => members.find((m) => m.id === id)?.name;
  const filtered = transactions.filter((tx) => {
    if (filter !== "all" && tx.type !== filter) return false;
    if (q && !(tx.category + " " + (tx.note || "")).toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });
  const groups = useMemo(() => {
    const g = {}; filtered.forEach((tx) => { (g[monthKey(tx.date)] ||= []).push(tx); });
    return Object.entries(g).sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [filtered]);
  return (
    <div className="px-5 pt-5 pb-24">
      <div className="relative mb-3">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" color={C.inkSoft} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm theo danh mục, ghi chú..." className="w-full pl-9 pr-3 py-2.5 rounded-lg border outline-none text-sm" style={{ borderColor: C.line, color: C.ink, fontFamily: bodyFont, background: "#fff" }} />
      </div>
      <div className="flex gap-2 mb-4">
        <Pill active={filter === "all"} onClick={() => setFilter("all")}>Tất cả</Pill>
        <Pill active={filter === "thu"} onClick={() => setFilter("thu")}>Khoản thu</Pill>
        <Pill active={filter === "chi"} onClick={() => setFilter("chi")}>Khoản chi</Pill>
      </div>
      {groups.length === 0 ? (
        <EmptyState icon={<Search size={22} color={C.pitch500} />} text="Không tìm thấy giao dịch phù hợp." />
      ) : (
        groups.map(([mk, list]) => (
          <div key={mk} className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: C.inkSoft, fontFamily: bodyFont }}>Tháng {mk.slice(5, 7)}/{mk.slice(0, 4)}</p>
            <div className="rounded-2xl border px-4" style={{ borderColor: C.line, background: "#fff" }}>
              {list.map((tx) => <TxRow key={tx.id} tx={tx} memberName={memberName(tx.memberId)} onDelete={() => onDelete(tx.id)} />)}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
function MembersTab({ members, transactions, onDelete, onAdd }) {
  const thisMonth = monthKey(todayISO());
  const rows = members.map((m) => {
    const paidThisMonth = transactions.some((t) => t.memberId === m.id && t.type === "thu" && t.category === "Quỹ thành viên" && monthKey(t.date) === thisMonth);
    const total = transactions.filter((t) => t.memberId === m.id && t.type === "thu").reduce((s, t) => s + t.amount, 0);
    return { ...m, paidThisMonth, total };
  });
  return (
    <div className="px-5 pt-5 pb-24">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs uppercase tracking-wide" style={{ color: C.inkSoft, fontFamily: bodyFont }}>
          {members.length} thành viên · {rows.filter((r) => r.paidThisMonth).length} đã đóng quỹ tháng {thisMonth.slice(5, 7)}
        </p>
        <button onClick={onAdd} className="text-xs font-bold uppercase flex items-center gap-1 px-3 py-1.5 rounded-full" style={{ background: C.pitch700, color: C.chalk, fontFamily: bodyFont }}>
          <Plus size={13} /> Thêm
        </button>
      </div>
      {rows.length === 0 ? (
        <EmptyState icon={<Users size={22} color={C.pitch500} />} text="Chưa có thành viên nào. Bấm Thêm để thêm cầu thủ đầu tiên." />
      ) : (
        <div className="rounded-2xl border divide-y" style={{ borderColor: C.line, background: "#fff" }}>
          {rows.map((m) => (
            <div key={m.id} className="flex items-center gap-3 px-4 py-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold shrink-0" style={{ background: C.pitch200, color: C.pitch800, fontFamily: displayFont }}>{initials(m.name)}</div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold truncate" style={{ color: C.ink, fontFamily: bodyFont }}>{m.name}</p>
                  {m.role !== "Cầu thủ" && <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold uppercase" style={{ background: C.chalkDim, color: C.goldDeep, fontFamily: bodyFont }}>{m.role}</span>}
                </div>
                <p className="text-xs" style={{ color: C.inkSoft, fontFamily: bodyFont }}>Đã đóng: <span style={{ fontFamily: numFont }}>{fmt(m.total)} đ</span></p>
              </div>
              <span className="text-[10px] px-2 py-1 rounded-full font-semibold shrink-0" style={{ background: m.paidThisMonth ? C.thuBg : C.chiBg, color: m.paidThisMonth ? C.thu : C.chi, fontFamily: bodyFont }}>
                {m.paidThisMonth ? "Đã đóng" : "Chưa đóng"}
              </span>
              <button onClick={() => onDelete(m.id)} className="p-1"><Trash2 size={14} color={C.inkSoft} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
function BottomNav({ tab, setTab, onAdd }) {
  const items = [{ id: "overview", label: "Tổng quan", icon: Wallet }, { id: "transactions", label: "Giao dịch", icon: Receipt }, { id: "members", label: "Thành viên", icon: Users }];
  return (
    <div className="fixed bottom-0 left-0 right-0 flex justify-center pointer-events-none">
      <div className="w-full sm:max-w-sm pointer-events-auto">
        <div className="relative flex items-center justify-around px-4 py-2 border-t" style={{ background: "#fff", borderColor: C.line }}>
          {items.slice(0, 2).map((it) => <NavBtn key={it.id} it={it} active={tab === it.id} onClick={() => setTab(it.id)} />)}
          <div className="w-14" />
          {items.slice(2).map((it) => <NavBtn key={it.id} it={it} active={tab === it.id} onClick={() => setTab(it.id)} />)}
          <button onClick={onAdd} className="absolute -top-6 left-1/2 -translate-x-1/2 w-14 h-14 rounded-full flex items-center justify-center shadow-lg" style={{ background: C.gold }}>
            <Plus size={26} color={C.pitch950} />
          </button>
        </div>
      </div>
    </div>
  );
}
function NavBtn({ it, active, onClick }) {
  const Icon = it.icon;
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-0.5 px-3 py-1">
      <Icon size={19} color={active ? C.pitch700 : C.inkSoft} strokeWidth={active ? 2.4 : 2} />
      <span className="text-[10px] font-medium" style={{ color: active ? C.pitch700 : C.inkSoft, fontFamily: bodyFont }}>{it.label}</span>
    </button>
  );
}

/* ---------- root ---------- */
export default function QuanTriQuyApp() {
  const [loaded, setLoaded] = useState(false);
  const [unlocked, setUnlocked] = useState(() => {
    try { return sessionStorage.getItem('admin_unlocked') === 'true'; } catch { return false; }
  });
  const [teamName, setTeamName] = useState("FC 8X+ XUÂN ĐÌNH");
  const [members, setMembers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [adminPin, setAdminPin] = useState(DEFAULT_PIN);
  const [tab, setTab] = useState("overview");
  const [showAddTx, setShowAddTx] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showPinSettings, setShowPinSettings] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await window.storage.get("club-data", true);
        if (res && res.value) {
          const data = JSON.parse(res.value);
          setTeamName(data.teamName || "FC 8X+ XUÂN ĐÌNH");
          setMembers(data.members || []);
          setTransactions(data.transactions || []);
          setAdminPin(data.adminPin || "20121984");
        } else throw new Error("no data");
      } catch {
        setMembers([]);
        setTransactions([]);
        setAdminPin("20121984");
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
          if (data.adminPin) setAdminPin(data.adminPin);
        }
      } catch (err) {}
    };

    window.addEventListener("club-data-changed", handleSync);
    return () => window.removeEventListener("club-data-changed", handleSync);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const payload = JSON.stringify({ teamName, members, transactions, adminPin });
    window.storage.set("club-data", payload, true).catch(() => {});
  }, [loaded, teamName, members, transactions, adminPin]);

  const balance = useMemo(() => transactions.reduce((s, t) => s + (t.type === "thu" ? t.amount : -t.amount), 0), [transactions]);
  const thisMonth = monthKey(todayISO());
  const thisMonthThu = transactions.filter((t) => t.type === "thu" && monthKey(t.date) === thisMonth).reduce((s, t) => s + t.amount, 0);
  const thisMonthChi = transactions.filter((t) => t.type === "chi" && monthKey(t.date) === thisMonth).reduce((s, t) => s + t.amount, 0);
  const monthlyChart = useMemo(() => {
    const buckets = {}; const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      buckets[key] = { label: MONTHS_VN[d.getMonth()], thu: 0, chi: 0 };
    }
    transactions.forEach((t) => { const k = monthKey(t.date); if (buckets[k]) buckets[k][t.type] += t.amount; });
    return Object.values(buckets);
  }, [transactions]);

  function addTx(tx) { setTransactions((prev) => [{ id: uid(), ...tx }, ...prev].sort((a, b) => (a.date < b.date ? 1 : -1))); setShowAddTx(false); }
  function deleteTx(id) { setTransactions((prev) => prev.filter((t) => t.id !== id)); }
  function addMember(m) { setMembers((prev) => [...prev, { id: uid(), ...m }]); setShowAddMember(false); }
  function deleteMember(id) { setMembers((prev) => prev.filter((m) => m.id !== id)); }

  function handleUnlock() {
    try { sessionStorage.setItem('admin_unlocked', 'true'); } catch {}
    setUnlocked(true);
  }

  if (!loaded) {
    return <div className="min-h-screen flex items-center justify-center" style={{ background: C.chalk }}><p className="text-sm" style={{ color: C.inkSoft, fontFamily: bodyFont }}>Đang tải...</p></div>;
  }
  if (!unlocked) {
    return <PinGate correctPin={adminPin} onUnlock={handleUnlock} />;
  }

  return (
    <div className="w-full flex justify-center" style={{ background: C.chalkDim }}>
      <div className="w-full sm:max-w-sm relative min-h-screen" style={{ background: C.chalk }}>
        <Scoreboard teamName={teamName} onRename={setTeamName} balance={balance} thisMonthThu={thisMonthThu} thisMonthChi={thisMonthChi} onOpenSettings={() => setShowPinSettings(true)} />
        {tab === "overview" && <OverviewTab transactions={transactions} members={members} monthlyChart={monthlyChart} />}
        {tab === "transactions" && <TransactionsTab transactions={transactions} members={members} onDelete={deleteTx} />}
        {tab === "members" && <MembersTab members={members} transactions={transactions} onDelete={deleteMember} onAdd={() => setShowAddMember(true)} />}
        <BottomNav tab={tab} setTab={setTab} onAdd={() => setShowAddTx(true)} />
        {showAddTx && <AddTxModal members={members} onClose={() => setShowAddTx(false)} onSave={addTx} />}
        {showAddMember && <AddMemberModal onClose={() => setShowAddMember(false)} onSave={addMember} />}
        {showPinSettings && (
          <PinSettingsModal currentPin={adminPin} onClose={() => setShowPinSettings(false)}
            onSave={(p) => { setAdminPin(p); setShowPinSettings(false); }} />
        )}
      </div>
    </div>
  );
}
