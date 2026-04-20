import { useEffect, useState } from "react";
import api from "../api/axios";
import ChangePasswordModal from "../components/ChangePasswordModal";
import OverworkTracker from "../components/OverworkTracker";

export default function Profile() {
  const [me, setMe] = useState(null);
  const [summary, setSummary] = useState(null);
  const [openPwd, setOpenPwd] = useState(false);

  const role = JSON.parse(localStorage.getItem("user") || "{}")?.role;

  useEffect(() => {
    Promise.all([
      api.get("/me"),
      api.get("/overwork/my-summary").catch(() => ({ data: null }))
    ]).then(([m, s]) => {
      setMe(m.data);
      setSummary(s.data);
    });
  }, []);

  if (!me) return <div>Loading...</div>;

  const medicalUsed = (me.medical_leave_total || 0) - (me.medical_leave_left || 0);
  const casualUsed = (me.casual_leave_total || 0) - (me.casual_leave_left || 0);
  const earnedUsed = (me.earned_leave_total || 0) - (me.earned_leave_left || 0);

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl p-5 shadow">
        <h2 className="text-2xl font-bold mb-3">My Profile</h2>
        <div className="grid md:grid-cols-2 gap-2 text-sm">
          <p><b>Name:</b> {me.full_name}</p>
          <p><b>Email:</b> {me.email || "-"}</p>
          <p><b>Username:</b> {me.username}</p>
          <p><b>Department:</b> {me.department || "-"}</p>
          <p><b>Designation:</b> {me.designation || me.role || "-"}</p>
          <p><b>Date of Joining:</b> {me.date_of_joining || "-"}</p>
        </div>
        <button onClick={() => setOpenPwd(true)} className="mt-4 px-4 py-2 rounded-xl bg-brand-600 text-white">
          Change Password
        </button>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow space-y-3">
        <h3 className="text-lg font-bold">Leave Balances</h3>
        <BalanceBar label="Medical" used={medicalUsed} total={me.medical_leave_total || 0} color="bg-rose-500" />
        <BalanceBar label="Casual" used={casualUsed} total={me.casual_leave_total || 0} color="bg-blue-500" />
        <BalanceBar label="Earned" used={earnedUsed} total={me.earned_leave_total || 0} color="bg-emerald-500" />
      </div>

      {summary && (
        <div className="bg-white rounded-2xl p-5 shadow">
          <h3 className="text-lg font-bold mb-2">Overwork Summary</h3>
          <div className="grid md:grid-cols-3 gap-3 text-sm">
            <Stat t="Pending Hours" v={summary.pending_hours} />
            <Stat t="Converted Hours" v={summary.converted_hours} />
            <Stat t="Earned Leaves From Overwork" v={summary.earned_leaves_from_overwork} />
          </div>
        </div>
      )}

      {["faculty", "hod", "registry", "officestaff"].includes(role) && <OverworkTracker />}

      <ChangePasswordModal open={openPwd} onClose={() => setOpenPwd(false)} />
    </div>
  );
}

function Stat({ t, v }) {
  return <div className="bg-slate-50 rounded-xl p-3"><p className="text-slate-500">{t}</p><p className="text-xl font-bold">{v}</p></div>;
}

function BalanceBar({ label, used, total, color }) {
  const pct = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;
  return (
    <div>
      <div className="flex justify-between text-sm"><span>{label}</span><span>{used}/{total}</span></div>
      <div className="w-full bg-slate-200 h-3 rounded-full">
        <div className={`${color} h-3 rounded-full`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}