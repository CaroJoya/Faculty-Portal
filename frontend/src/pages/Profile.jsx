import React, { useEffect, useState } from "react";
import axios from "axios";
import { Trash2, RotateCcw, AlertTriangle, Eye, EyeOff } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function Profile() {
  const token = localStorage.getItem("token");
  const [user, setUser] = useState(null);
  const [accountStatus, setAccountStatus] = useState(null);
  const [pw, setPw] = useState({ currentPassword: "", newPassword: "" });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    setLoading(true);
    try {
      const [userRes, statusRes] = await Promise.all([
        axios.get(`${API}/me`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/account-status`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setUser(userRes.data);
      setAccountStatus(statusRes.data);
    } catch (err) {
      console.error("Failed to load user data", err);
      setError("Failed to load profile data");
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    setMsg("");
    setError("");
    
    if (pw.newPassword.length < 6) {
      setError("New password must be at least 6 characters");
      return;
    }
    
    try {
      const res = await axios.post(`${API}/change-password`, pw, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMsg(res.data.message || "Password updated successfully");
      setPw({ currentPassword: "", newPassword: "" });
      setTimeout(() => setMsg(""), 3000);
    } catch (e2) {
      setError(e2?.response?.data?.message || "Failed to change password");
    }
  };

  const restoreAccount = async () => {
    setLoading(true);
    try {
      await axios.post(`${API}/restore-account`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMsg("Account restored successfully! You can now use the portal normally.");
      await loadUserData();
      setTimeout(() => {
        setMsg("");
        window.location.reload();
      }, 2000);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to restore account");
    } finally {
      setLoading(false);
    }
  };

  const requestDelete = async () => {
    setLoading(true);
    try {
      await axios.post(`${API}/request-delete`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMsg("Account deletion requested. Your account has been deactivated. You have 30 days to restore it.");
      setShowDeleteConfirm(false);
      await loadUserData();
      // Logout after 3 seconds
      setTimeout(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
      }, 3000);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to delete account");
      setShowDeleteConfirm(false);
    } finally {
      setLoading(false);
    }
  };

  // Show account is deleted state - Restore screen
  if (accountStatus?.isDeleted) {
    return (
      <div className="p-4 max-w-3xl mx-auto">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center">
          <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-amber-800 mb-3">Account Deactivated</h2>
          <p className="text-amber-700 mb-2">
            Your account has been deleted.
          </p>
          <p className="text-amber-700 mb-6 font-semibold">
            You have {accountStatus.daysUntilPermanent} days left to restore it.
            After 30 days, the account will be permanently deleted.
          </p>
          <button
            onClick={restoreAccount}
            disabled={loading}
            className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-6 py-3 rounded-xl font-semibold transition disabled:opacity-50"
          >
            <RotateCcw size={20} />
            {loading ? "Restoring..." : "Restore My Account"}
          </button>
        </div>
        {msg && <p className="text-emerald-600 text-sm mt-4 text-center">{msg}</p>}
        {error && <p className="text-rose-600 text-sm mt-4 text-center">{error}</p>}
      </div>
    );
  }

  if (loading && !user) return <div className="p-4 text-center">Loading profile...</div>;
  if (!user) return <div className="p-4 text-center text-rose-600">Failed to load profile</div>;

  const balances = [
    { name: "Medical Leave", left: user.medical_leave_left, total: user.medical_leave_total, color: "bg-blue-500" },
    { name: "Casual Leave", left: user.casual_leave_left, total: user.casual_leave_total, color: "bg-emerald-500" },
    { name: "Earned Leave", left: user.earned_leave_left, total: user.earned_leave_total, color: "bg-purple-500" }
  ];

  return (
    <div className="p-4 max-w-3xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold text-slate-800">My Profile</h1>

      {/* User Info Card */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
        <h2 className="font-semibold text-lg mb-3 text-slate-700">Account Information</h2>
        <div className="grid md:grid-cols-2 gap-3 text-sm">
          <div><span className="text-slate-500">Full Name:</span> <span className="font-medium">{user.full_name}</span></div>
          <div><span className="text-slate-500">Email:</span> <span className="font-medium">{user.email}</span></div>
          <div><span className="text-slate-500">Department:</span> <span className="font-medium">{user.department}</span></div>
          <div><span className="text-slate-500">Designation:</span> <span className="font-medium">{user.designation || "Faculty"}</span></div>
          <div><span className="text-slate-500">Role:</span> <span className="font-medium capitalize">{user.role}</span></div>
          <div><span className="text-slate-500">Joined:</span> <span className="font-medium">{user.date_of_joining || user.created_at?.split("T")[0] || "-"}</span></div>
        </div>
      </div>

      {/* Leave Balances Card */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
        <h2 className="font-semibold text-lg mb-3 text-slate-700">Leave Balances</h2>
        <div className="space-y-4">
          {balances.map((bal) => {
            const percentage = bal.total ? Math.max(0, Math.min(100, (bal.left / bal.total) * 100)) : 0;
            return (
              <div key={bal.name}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{bal.name}</span>
                  <span className="font-medium">{bal.left} / {bal.total}</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2.5">
                  <div className={`${bal.color} h-2.5 rounded-full transition-all duration-500`} style={{ width: `${percentage}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Change Password Card */}
      <form onSubmit={changePassword} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 space-y-3">
        <h2 className="font-semibold text-lg text-slate-700">Change Password</h2>
        
        {/* Current Password */}
        <div className="relative">
          <input 
            type={showCurrentPassword ? "text" : "password"} 
            placeholder="Current Password" 
            className="border border-slate-300 rounded-xl px-4 py-3 w-full pr-10 focus:outline-none focus:ring-2 focus:ring-brand-400"
            value={pw.currentPassword} 
            onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} 
            required 
          />
          <button
            type="button"
            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
          >
            {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
        
        {/* New Password */}
        <div className="relative">
          <input 
            type={showNewPassword ? "text" : "password"} 
            placeholder="New Password (min 6 characters)" 
            className="border border-slate-300 rounded-xl px-4 py-3 w-full pr-10 focus:outline-none focus:ring-2 focus:ring-brand-400"
            value={pw.newPassword} 
            onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} 
            required 
          />
          <button
            type="button"
            onClick={() => setShowNewPassword(!showNewPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
          >
            {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
        
        <button 
          type="submit"
          className="bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 rounded-xl font-medium transition"
        >
          Update Password
        </button>
        
        {msg && <p className="text-emerald-600 text-sm">{msg}</p>}
        {error && <p className="text-rose-600 text-sm">{error}</p>}
      </form>

      {/* Danger Zone - Delete Account Card */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-red-200">
        <h2 className="font-semibold text-lg text-red-700 mb-2 flex items-center gap-2">
          <Trash2 size={18} />
          Danger Zone
        </h2>
        <p className="text-sm text-slate-600 mb-4">
          Once you delete your account, it will be deactivated immediately. 
          You will have <strong className="text-red-600">30 days</strong> to restore it before permanent deletion.
          During this time, you cannot log in until you restore your account.
        </p>
        
        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition"
          >
            Request Account Deletion
          </button>
        ) : (
          <div className="space-y-3 bg-red-50 rounded-xl p-4 border border-red-200">
            <p className="text-sm text-red-700 font-medium">
              ⚠️ Are you absolutely sure? This action cannot be undone for 30 days.
            </p>
            <div className="flex gap-3">
              <button
                onClick={requestDelete}
                disabled={loading}
                className="bg-red-700 hover:bg-red-800 text-white px-5 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
              >
                {loading ? "Processing..." : "Yes, Delete My Account"}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="bg-slate-300 hover:bg-slate-400 text-slate-800 px-5 py-2 rounded-lg text-sm font-medium transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}