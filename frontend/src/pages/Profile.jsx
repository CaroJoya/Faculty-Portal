import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Trash2,
  RotateCcw,
  AlertTriangle,
  Eye,
  EyeOff,
  Sun,
  Moon,
  User,
  Mail,
  Phone,
  Building2,
  Calendar as CalendarIcon,
  Shield,
  FilePlus2,
  ListChecks,
  History as HistoryIcon,
  BarChart3
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function Profile() {
  const token = localStorage.getItem("token");
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [accountStatus, setAccountStatus] = useState(null);
  const [pw, setPw] = useState({ currentPassword: "", newPassword: "" });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState("");
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
      setMsgType("error");
      setMsg("Failed to load profile data");
      // If unauthorized, clear localstorage
      if (err?.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    setMsg("");
    setMsgType("");

    if (pw.newPassword.length < 6) {
      setMsgType("error");
      setMsg("New password must be at least 6 characters");
      return;
    }

    try {
      const res = await axios.post(`${API}/change-password`, pw, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMsgType("success");
      setMsg(res.data.message || "Password updated successfully");
      setPw({ currentPassword: "", newPassword: "" });
      setTimeout(() => setMsg(""), 3000);
    } catch (e2) {
      setMsgType("error");
      setMsg(e2?.response?.data?.message || "Failed to change password");
    }
  };

  const restoreAccount = async () => {
    setLoading(true);
    try {
      await axios.post(`${API}/restore-account`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMsgType("success");
      setMsg("Account restored successfully! You can now use the portal normally.");
      await loadUserData();
      setTimeout(() => {
        setMsg("");
        window.location.reload();
      }, 2000);
    } catch (err) {
      setMsgType("error");
      setMsg(err?.response?.data?.message || "Failed to restore account");
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
      setMsgType("success");
      setMsg("Account deletion requested. Your account has been deactivated. You have 30 days to restore it.");
      setShowDeleteConfirm(false);
      await loadUserData();
      setTimeout(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
      }, 3000);
    } catch (err) {
      setMsgType("error");
      setMsg(err?.response?.data?.message || "Failed to delete account");
      setShowDeleteConfirm(false);
    } finally {
      setLoading(false);
    }
  };

  // If account deleted -> show restore panel (keeps prior UX)
  if (accountStatus?.isDeleted) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl p-8 text-center">
          <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-amber-800 dark:text-amber-400 mb-3">Account Deactivated</h2>
          <p className="text-amber-700 dark:text-amber-500 mb-2">
            Your account has been deactivated.
          </p>
          <p className="text-amber-700 dark:text-amber-500 mb-6 font-semibold">
            You have {accountStatus.daysUntilPermanent} days left to restore it.
          </p>
          <button
            onClick={restoreAccount}
            disabled={loading}
            className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-6 py-3 rounded-xl font-semibold transition-all disabled:opacity-50"
          >
            <RotateCcw size={20} />
            {loading ? "Restoring..." : "Restore My Account"}
          </button>
        </div>
        {msg && (
          <div className={`mt-4 p-3 rounded-xl text-center ${
            msgType === "success" ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400" : "bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400"
          }`}>
            {msg}
          </div>
        )}
      </div>
    );
  }

  if (loading && !user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-brand-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-rose-600 dark:text-rose-400">Failed to load profile</p>
      </div>
    );
  }

  const balances = [
    { name: "Medical Leave", left: user.medical_leave_left, total: user.medical_leave_total, color: "blue" },
    { name: "Casual Leave", left: user.casual_leave_left, total: user.casual_leave_total, color: "emerald" },
    { name: "Earned Leave", left: user.earned_leave_left, total: user.earned_leave_total, color: "amber" }
  ];

  // Quick action helper
  function QuickAction({ to, label, Icon }) {
    return (
      <Link to={to} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-gray-900/40 hover:bg-slate-100 dark:hover:bg-gray-800 transition">
        <Icon size={16} />
        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</span>
      </Link>
    );
  }

  return (
    <div className="max-w-6xl mx-auto lg:grid lg:grid-cols-[320px_1fr] gap-6 space-y-6 lg:space-y-0">
      {/* Left column - Profile summary */}
      <aside className="space-y-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700 overflow-hidden">
          <div className="p-6 text-center border-b border-slate-200 dark:border-gray-700 bg-gradient-to-br from-brand-50 to-indigo-50 dark:from-gray-900/10 dark:to-gray-800/10">
            {/* Avatar - try to use a college-logo if available in user object or fall back to initials */}
            {user.avatar_url ? (
              <img src={user.avatar_url} alt={user.full_name} className="w-28 h-28 rounded-full mx-auto object-cover shadow-md" />
            ) : (
              <div className="w-28 h-28 rounded-full mx-auto bg-gradient-to-br from-brand-600 to-indigo-600 flex items-center justify-center shadow-md">
                <span className="text-3xl font-bold text-white">{(user.full_name || "U").charAt(0)}</span>
              </div>
            )}
            <h3 className="mt-4 font-semibold text-slate-800 dark:text-white text-lg">{user.full_name}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{user.department || "-"}</p>

            <div className="mt-3 inline-flex items-center gap-2">
              <span className="text-xs px-2 py-1 rounded-full bg-slate-100 dark:bg-gray-700 text-slate-700 dark:text-slate-200">
                {user.role?.toUpperCase() || "FACULTY"}
              </span>
            </div>
          </div>

          <div className="p-4 space-y-3">
            <QuickAction to="/request-leave" label="Request Leave" Icon={FilePlus2} />
            <QuickAction to="/status" label="My Status" Icon={ListChecks} />
            <QuickAction to="/history" label="History" Icon={HistoryIcon} />
            <QuickAction to="/stats" label="My Stats" Icon={BarChart3} />
          </div>
        </div>

        {/* Small contact card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700 p-4">
          <h4 className="font-semibold text-slate-800 dark:text-white mb-3">Contact</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Mail size={18} className="text-slate-400 dark:text-slate-500" />
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Email</p>
                <p className="text-sm text-slate-800 dark:text-white">{user.email || "-"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone size={18} className="text-slate-400 dark:text-slate-500" />
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Phone</p>
                <p className="text-sm text-slate-800 dark:text-white">{user.phone_number || "Not provided"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Appearance quick toggle */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {theme === "light" ? <Sun size={20} className="text-amber-500" /> : <Moon size={20} className="text-indigo-400" />}
              <div>
                <p className="text-sm font-medium text-slate-800 dark:text-white">{theme === "light" ? "Light Mode" : "Dark Mode"}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Switch appearance</p>
              </div>
            </div>
            <button
              onClick={toggleTheme}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-gray-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-gray-600 transition"
            >
              Toggle
            </button>
          </div>
        </div>
      </aside>

      {/* Right column - main content */}
      <main className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white">My Profile</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your account information and preferences</p>
        </div>

        {/* Account Info */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700 overflow-hidden">
          <div className="p-5 border-b border-slate-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-600 to-indigo-600 flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="font-semibold text-slate-800 dark:text-white">Account Information</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Your personal and professional details</p>
              </div>
            </div>
          </div>

          <div className="p-5">
            <div className="grid md:grid-cols-2 gap-4">
              <InfoRow icon={User} label="Full Name" value={user.full_name} />
              <InfoRow icon={Mail} label="Email" value={user.email} />
              <InfoRow icon={Building2} label="Department" value={user.department} />
              <InfoRow icon={Shield} label="Designation" value={user.designation || "Faculty"} />
              <InfoRow icon={Shield} label="Role" value={(user.role || "").charAt(0).toUpperCase() + (user.role || "").slice(1)} />
              <InfoRow icon={CalendarIcon} label="Joined" value={user.date_of_joining || user.created_at?.split("T")[0] || "-"} />
              <InfoRow icon={Phone} label="Phone" value={user.phone_number || "Not provided"} />
            </div>
          </div>
        </section>

        {/* Leave Balances */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700 overflow-hidden">
          <div className="p-5 border-b border-slate-200 dark:border-gray-700">
            <h2 className="font-semibold text-slate-800 dark:text-white">Leave Balances</h2>
          </div>
          <div className="p-5 space-y-4">
            {balances.map((bal) => {
              const percentage = bal.total ? Math.max(0, Math.min(100, (bal.left / bal.total) * 100)) : 0;
              const colors = {
                blue: "bg-blue-500",
                emerald: "bg-emerald-500",
                amber: "bg-amber-500"
              };
              return (
                <div key={bal.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-600 dark:text-slate-400">{bal.name}</span>
                    <span className="font-medium text-slate-800 dark:text-white">{bal.left} / {bal.total}</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-gray-700 rounded-full h-2.5">
                    <div className={`${colors[bal.color]} h-2.5 rounded-full transition-all duration-500`} style={{ width: `${percentage}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Change Password */}
        <form onSubmit={changePassword} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700 overflow-hidden">
          <div className="p-5 border-b border-slate-200 dark:border-gray-700">
            <h2 className="font-semibold text-slate-800 dark:text-white">Change Password</h2>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Current Password</label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  className="w-full border border-slate-300 dark:border-gray-600 rounded-xl px-4 py-2.5 bg-white dark:bg-gray-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-brand-400 outline-none"
                  value={pw.currentPassword}
                  onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })}
                  required
                />
                <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:text-slate-400">
                  {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">New Password (min 6 characters)</label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  className="w-full border border-slate-300 dark:border-gray-600 rounded-xl px-4 py-2.5 bg-white dark:bg-gray-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-brand-400 outline-none"
                  value={pw.newPassword}
                  onChange={(e) => setPw({ ...pw, newPassword: e.target.value })}
                  required
                />
                <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:text-slate-400">
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {msg && (
              <div className={`p-3 rounded-xl text-sm ${
                msgType === "success"
                  ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                  : "bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800"
              }`}>
                {msg}
              </div>
            )}

            <button type="submit" className="w-full bg-brand-600 hover:bg-brand-700 text-white py-2.5 rounded-xl font-medium transition-all">
              Update Password
            </button>
          </div>
        </form>

        {/* Danger Zone */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-rose-200 dark:border-rose-800 overflow-hidden">
          <div className="p-5 border-b border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/20">
            <div className="flex items-center gap-2">
              <Trash2 size={18} className="text-rose-600 dark:text-rose-400" />
              <h2 className="font-semibold text-rose-700 dark:text-rose-400">Danger Zone</h2>
            </div>
          </div>
          <div className="p-5">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Once you delete your account, it will be deactivated immediately. You will have <strong className="text-rose-600 dark:text-rose-400">30 days</strong> to restore it before permanent deletion.
            </p>

            {!showDeleteConfirm ? (
              <button onClick={() => setShowDeleteConfirm(true)} className="bg-rose-600 hover:bg-rose-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-all">
                Request Account Deletion
              </button>
            ) : (
              <div className="space-y-3 bg-rose-50 dark:bg-rose-950/30 rounded-xl p-4 border border-rose-200 dark:border-rose-800">
                <p className="text-sm text-rose-700 dark:text-rose-400 font-medium">⚠️ Are you absolutely sure? This action cannot be undone for 30 days.</p>
                <div className="flex gap-3">
                  <button onClick={requestDelete} disabled={loading} className="bg-rose-700 hover:bg-rose-800 text-white px-5 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50">
                    {loading ? "Processing..." : "Yes, Delete My Account"}
                  </button>
                  <button onClick={() => setShowDeleteConfirm(false)} className="bg-slate-200 dark:bg-gray-700 hover:bg-slate-300 dark:hover:bg-gray-600 text-slate-800 dark:text-slate-200 px-5 py-2 rounded-lg text-sm font-medium transition-all">
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

/* Helper component for rows */
function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <Icon size={18} className="text-slate-400 dark:text-slate-500 mt-0.5" />
      <div>
        <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">{label}</p>
        <p className="text-sm text-slate-800 dark:text-white font-medium mt-0.5">{value || "-"}</p>
      </div>
    </div>
  );
}