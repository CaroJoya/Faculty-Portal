import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Trash2,
  RotateCcw,
  AlertTriangle,
  Eye,
  EyeOff,
  User,
  Mail,
  Phone,
  Building2,
  Calendar as CalendarIcon,
  Shield
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function Profile() {
  const token = localStorage.getItem("token");

  const { theme } = useTheme();

  const [user, setUser] = useState(null);
  const [accountStatus, setAccountStatus] = useState({
    isDeleted: false,
    canRestore: false
  });

  const [pw, setPw] = useState({
    currentPassword: "",
    newPassword: ""
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const authHeaders = () => ({
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  const loadUserData = async () => {
    if (!token) {
      setMsgType("error");
      setMsg("Session missing. Please login again.");
      return;
    }

    setLoading(true);

    try {
      const results = await Promise.allSettled([
        axios.get(`${API}/me`, authHeaders()),
        axios.get(`${API}/account-status`, authHeaders())
      ]);

      const userResult = results[0];
      const statusResult = results[1];

      // profile data is required
      if (
        userResult.status !== "fulfilled" ||
        !userResult.value?.data
      ) {
        throw new Error("User profile request failed");
      }

      setUser(userResult.value.data);

      // account-status is optional/fallback
      if (
        statusResult.status === "fulfilled" &&
        statusResult.value?.data
      ) {
        setAccountStatus(statusResult.value.data);
      } else {
        setAccountStatus({
          isDeleted: false,
          canRestore: false
        });
      }

    } catch (err) {
      console.error("Failed to load user data", err);

      if (err?.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }

      setMsgType("error");
      setMsg(
        err?.response?.data?.message ||
        "Failed to load profile data"
      );
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();

    if (pw.newPassword.length < 6) {
      setMsgType("error");
      setMsg("New password must be at least 6 characters");
      return;
    }

    try {
      const res = await axios.post(
        `${API}/change-password`,
        pw,
        authHeaders()
      );

      setMsgType("success");
      setMsg(
        res.data.message ||
        "Password changed successfully"
      );

      setPw({
        currentPassword: "",
        newPassword: ""
      });

    } catch (e2) {
      setMsgType("error");
      setMsg(
        e2?.response?.data?.message ||
        "Failed to change password"
      );
    }
  };

  const restoreAccount = async () => {
    try {
      await axios.post(
        `${API}/restore-account`,
        {},
        authHeaders()
      );

      setMsgType("success");
      setMsg("Account restored successfully.");

      await loadUserData();

    } catch (e) {
      setMsgType("error");
      setMsg(
        e?.response?.data?.message ||
        "Restore failed"
      );
    }
  };

  const requestDelete = async () => {
    try {
      await axios.post(
        `${API}/request-delete`,
        {},
        authHeaders()
      );

      setMsgType("success");
      setMsg("Deletion request submitted.");

      await loadUserData();

    } catch (e) {
      setMsgType("error");
      setMsg(
        e?.response?.data?.message ||
        "Delete request failed"
      );
    }
  };

  if (loading) {
    return <div>Loading profile...</div>;
  }

  if (!user) {
    return (
      <div className="p-6">
        {msg || "Unable to load profile"}
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {msg && (
        <div className="p-3 rounded-xl border">
          {msg}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow p-6 space-y-4">

        <h2 className="text-2xl font-bold">
          My Profile
        </h2>

        <p><User size={16}/> {user.full_name}</p>
        <p><Mail size={16}/> {user.email}</p>
        <p><Phone size={16}/> {user.phone_number || "-"}</p>
        <p><Building2 size={16}/> {user.department}</p>
        <p><Shield size={16}/> {user.role}</p>
        <p><CalendarIcon size={16}/> {user.date_of_joining || "-"}</p>

      </div>

      <form
        onSubmit={changePassword}
        className="bg-white rounded-2xl shadow p-6 space-y-4"
      >
        <h3 className="text-xl font-semibold">
          Change Password
        </h3>

        <input
          type={showCurrentPassword ? "text":"password"}
          placeholder="Current Password"
          value={pw.currentPassword}
          onChange={(e)=>
            setPw({
              ...pw,
              currentPassword:e.target.value
            })
          }
        />

        <input
          type={showNewPassword ? "text":"password"}
          placeholder="New Password"
          value={pw.newPassword}
          onChange={(e)=>
            setPw({
              ...pw,
              newPassword:e.target.value
            })
          }
        />

        <button type="submit">
          Update Password
        </button>
      </form>

      {accountStatus?.canRestore && (
        <button onClick={restoreAccount}>
          Restore Account
        </button>
      )}

      <button onClick={requestDelete}>
        Request Delete
      </button>

    </div>
  );
}