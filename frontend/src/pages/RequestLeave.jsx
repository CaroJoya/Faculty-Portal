import React, { useMemo, useState } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function RequestLeave() {
  const [form, setForm] = useState({
    start_date: "",
    end_date: "",
    leave_type: "full_day",
    leave_category: "casual",
    special_leave_type: "regular",
    reason: ""
  });
  const [attachment, setAttachment] = useState(null);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  
  // NEW: State for alternate faculty recommendations (max 3)
  const [recommendations, setRecommendations] = useState(["", "", ""]);

  const token = localStorage.getItem("token");
  
  // NEW: Get current user role to conditionally show recommendations section
  const userRole = useMemo(() => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "null");
      return user?.role;
    } catch {
      return null;
    }
  }, []);

  const duration = useMemo(() => {
    if (!form.start_date) return 0;
    if (form.leave_type === "half_day") return 0.5;
    if (!form.end_date) return 0;
    const s = new Date(form.start_date);
    const e = new Date(form.end_date);
    const d = Math.floor((e - s) / (1000 * 60 * 60 * 24)) + 1;
    return d > 0 ? d : 0;
  }, [form.start_date, form.end_date, form.leave_type]);

  const onChange = (key, value) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "leave_type" && value === "half_day") {
        next.end_date = next.start_date;
      }
      if (key === "start_date" && next.leave_type === "half_day") {
        next.end_date = value;
      }
      return next;
    });
  };

  // NEW: Update recommendation at specific index
  const updateRecommendation = (index, value) => {
    const newRecs = [...recommendations];
    newRecs[index] = value;
    setRecommendations(newRecs);
  };

  const submit = async (e) => {
    e.preventDefault();
    setMsg("");

    if (!form.start_date || !form.reason) {
      setMsg("Start date and reason are required");
      return;
    }

    const effectiveEnd = form.leave_type === "half_day" ? form.start_date : form.end_date;
    if (!effectiveEnd) {
      setMsg("End date is required");
      return;
    }

    if (form.special_leave_type.toLowerCase() === "od" && !attachment) {
      setMsg("OD letter upload is mandatory for OD leave.");
      return;
    }

    try {
      setLoading(true);
      const fd = new FormData();
      fd.append("start_date", form.start_date);
      fd.append("end_date", effectiveEnd);
      fd.append("leave_type", form.leave_type);
      fd.append("leave_category", form.leave_category);
      fd.append("special_leave_type", form.special_leave_type);
      fd.append("reason", form.reason);
      if (attachment) fd.append("attachment", attachment);
      
      // NEW: Append recommendations (only non-empty values)
      const nonEmptyRecs = recommendations.filter(r => r.trim() !== "");
      if (nonEmptyRecs.length > 0) {
        fd.append("recommendations", JSON.stringify(nonEmptyRecs));
      }

      const res = await axios.post(`${API}/leave-requests`, fd, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data"
        }
      });

      setMsg(res.data?.message || "Leave request submitted");
      setForm({
        start_date: "",
        end_date: "",
        leave_type: "full_day",
        leave_category: "casual",
        special_leave_type: "regular",
        reason: ""
      });
      setAttachment(null);
      setRecommendations(["", "", ""]); // NEW: Reset recommendations
    } catch (err) {
      setMsg(err?.response?.data?.message || "Failed to submit leave request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-xl font-semibold mb-4">Request Leave</h1>

      <form onSubmit={submit} className="space-y-3 bg-white p-4 rounded shadow">
        <div>
          <label className="block text-sm mb-1">Start Date</label>
          <input
            type="date"
            className="border rounded px-3 py-2 w-full"
            value={form.start_date}
            onChange={(e) => onChange("start_date", e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Leave Type</label>
          <select
            className="border rounded px-3 py-2 w-full"
            value={form.leave_type}
            onChange={(e) => onChange("leave_type", e.target.value)}
          >
            <option value="full_day">Full Day</option>
            <option value="half_day">Half Day</option>
          </select>
        </div>

        <div>
          <label className="block text-sm mb-1">End Date</label>
          <input
            type="date"
            className="border rounded px-3 py-2 w-full disabled:bg-gray-100"
            value={form.leave_type === "half_day" ? form.start_date : form.end_date}
            disabled={form.leave_type === "half_day"}
            onChange={(e) => onChange("end_date", e.target.value)}
          />
          {form.leave_type === "half_day" && (
            <p className="text-xs text-gray-600 mt-1">End date auto-set to start date for Half Day.</p>
          )}
        </div>

        <div>
          <label className="block text-sm mb-1">Leave Category</label>
          <select
            className="border rounded px-3 py-2 w-full"
            value={form.leave_category}
            onChange={(e) => onChange("leave_category", e.target.value)}
          >
            <option value="casual">Casual Leave</option>
            <option value="medical">Medical Leave</option>
            <option value="earned">Earned Leave</option>
            <option value="vacation">Vacation</option>
          </select>
        </div>

        <div>
          <label className="block text-sm mb-1">Special Leave Type</label>
          <select
            className="border rounded px-3 py-2 w-full"
            value={form.special_leave_type}
            onChange={(e) => onChange("special_leave_type", e.target.value)}
          >
            <option value="regular">Regular</option>
            <option value="od">OD</option>
            <option value="maternity">Maternity/Paternity</option>
            <option value="extended_medical">Extended Medical</option>
          </select>
        </div>

        {/* NEW: Alternate Faculty Recommendations Section - Faculty Only */}
        {userRole === "faculty" && (
          <div className="border-t border-gray-200 pt-3 mt-2">
            <label className="block text-sm font-medium mb-2 text-gray-700">
              Recommended Alternate Faculty (Optional)
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Suggest up to 3 faculty members who can manage duties during your leave
            </p>
            {[0, 1, 2].map((idx) => (
              <div key={idx} className="mb-2">
                <input
                  type="text"
                  className="border rounded px-3 py-2 w-full"
                  placeholder={`Alternate faculty ${idx + 1} (optional)`}
                  value={recommendations[idx]}
                  onChange={(e) => updateRecommendation(idx, e.target.value)}
                />
              </div>
            ))}
          </div>
        )}

        <div>
          <label className="block text-sm mb-1">
            Attachment {form.special_leave_type === "od" ? "(OD letter required)" : ""}
          </label>
          <input
            type="file"
            className="border rounded px-3 py-2 w-full"
            onChange={(e) => setAttachment(e.target.files?.[0] || null)}
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Reason</label>
          <textarea
            className="border rounded px-3 py-2 w-full"
            rows={3}
            value={form.reason}
            onChange={(e) => onChange("reason", e.target.value)}
          />
        </div>

        <div className="text-sm">
          <strong>Duration:</strong> {duration} day(s)
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          {loading ? "Submitting..." : "Submit"}
        </button>

        {msg && <p className="text-sm mt-2">{msg}</p>}
      </form>
    </div>
  );
}