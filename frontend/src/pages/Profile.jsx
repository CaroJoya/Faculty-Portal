import React, { useEffect, useState } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function Profile() {
  const token = localStorage.getItem("token");
  const [user, setUser] = useState(null);
  const [pw, setPw] = useState({ currentPassword: "", newPassword: "" });
  const [msg, setMsg] = useState("");

  useEffect(() => {
    axios.get(`${API}/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => setUser(r.data));
  }, []);

  const changePassword = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API}/change-password`, pw, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMsg(res.data.message || "Password updated");
      setPw({ currentPassword: "", newPassword: "" });
    } catch (e2) {
      setMsg(e2?.response?.data?.message || "Failed to change password");
    }
  };

  if (!user) return <div className="p-4">Loading...</div>;

  const bal = [
    ["Medical", user.medical_leave_left, user.medical_leave_total],
    ["Casual", user.casual_leave_left, user.casual_leave_total],
    ["Earned", user.earned_leave_left, user.earned_leave_total]
  ];

  return (
    <div className="p-4 max-w-3xl mx-auto space-y-4">
      <h1 className="text-xl font-semibold">Profile</h1>

      <div className="bg-white p-4 rounded shadow space-y-1 text-sm">
        <p><b>Name:</b> {user.full_name}</p>
        <p><b>Email:</b> {user.email}</p>
        <p><b>Department:</b> {user.department}</p>
        <p><b>Designation:</b> {user.designation}</p>
        <p><b>Account Created:</b> {user.created_at}</p>
      </div>

      {/* Overwork section removed from Profile as requested */}

      <div className="bg-white p-4 rounded shadow">
        <h2 className="font-semibold mb-3">Leave Balances</h2>
        <div className="space-y-3">
          {bal.map(([label, left, total]) => {
            const pct = total ? Math.max(0, Math.min(100, (left / total) * 100)) : 0;
            return (
              <div key={label}>
                <div className="text-sm mb-1">{label}: {left} / {total}</div>
                <div className="w-full bg-gray-200 rounded h-2">
                  <div className="bg-blue-500 h-2 rounded" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <form onSubmit={changePassword} className="bg-white p-4 rounded shadow space-y-2">
        <h2 className="font-semibold">Change Password</h2>
        <input type="password" placeholder="Current Password" className="border rounded px-3 py-2 w-full"
          value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} />
        <input type="password" placeholder="New Password" className="border rounded px-3 py-2 w-full"
          value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} />
        <button className="bg-blue-600 text-white px-4 py-2 rounded">Update Password</button>
        {msg && <p className="text-sm">{msg}</p>}
      </form>
    </div>
  );
}