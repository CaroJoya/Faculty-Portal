// frontend/src/pages/HeadClerkMarkAttendance.jsx
import { useState, useEffect } from "react";
import api from "../api/axios";
import { X, CheckCircle, AlertCircle } from "lucide-react";

export default function HeadClerkMarkAttendance({ facultyId, date, onClose, onSaved }) {
  const [status, setStatus] = useState("Present");
  const [remarks, setRemarks] = useState("");
  const [saving, setSaving] = useState(false);
  const [faculty, setFaculty] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    loadFacultyDetails();
  }, [facultyId]);

  const loadFacultyDetails = async () => {
    try {
      const res = await api.get(`/me`, { params: { username: facultyId } });
      setFaculty(res.data);
    } catch (err) {
      console.error("Failed to load faculty details", err);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    
    try {
      await api.post("/headclerk/attendance/mark", {
        faculty_id: facultyId,
        date,
        status,
        remarks
      });
      onSaved();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to save attendance");
    } finally {
      setSaving(false);
    }
  };

  const statusOptions = [
    { value: "Present", color: "emerald", icon: "✓" },
    { value: "Absent", color: "rose", icon: "✗" },
    { value: "Half Day", color: "amber", icon: "½" }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 border-b border-slate-200 dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-xl font-bold text-slate-800 dark:text-white">Mark Attendance</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-700">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={submit} className="p-5 space-y-4">
          {faculty && (
            <div className="p-3 bg-slate-50 dark:bg-gray-900/50 rounded-xl">
              <p className="text-sm text-slate-500">Faculty</p>
              <p className="font-medium text-slate-800 dark:text-white">{faculty.full_name}</p>
              <p className="text-xs text-slate-400">{faculty.department}</p>
            </div>
          )}
          
          <div>
            <p className="text-sm text-slate-500 mb-1">Date</p>
            <p className="font-medium text-slate-800 dark:text-white">{date}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Attendance Status
            </label>
            <div className="grid grid-cols-3 gap-2">
              {statusOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setStatus(opt.value)}
                  className={`p-3 rounded-xl border-2 transition-all ${
                    status === opt.value
                      ? `border-${opt.color}-500 bg-${opt.color}-50 dark:bg-${opt.color}-950/30`
                      : "border-slate-200 dark:border-gray-700 hover:border-slate-300"
                  }`}
                >
                  <span className={`text-xl text-${opt.color}-600`}>{opt.icon}</span>
                  <p className={`text-sm font-medium mt-1 ${
                    status === opt.value ? `text-${opt.color}-700` : "text-slate-600"
                  }`}>
                    {opt.value}
                  </p>
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Remarks (Optional)
            </label>
            <textarea
              className="w-full border border-slate-300 dark:border-gray-600 rounded-xl px-4 py-2 bg-white dark:bg-gray-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-brand-400 outline-none resize-none"
              rows={3}
              placeholder="Add any additional notes..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
          </div>
          
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/30 rounded-xl flex items-start gap-2 text-rose-700 dark:text-rose-400 text-sm">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-gray-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-gray-800 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-brand-600 hover:bg-brand-700 text-white py-2.5 rounded-xl font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle size={16} />
                  Save Attendance
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}