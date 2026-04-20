import { useState } from "react";
import api from "../api/axios";

export default function HeadClerkMarkAttendance({ facultyId, date, onClose, onSaved }) {
  const [status, setStatus] = useState("Present");
  const [remarks, setRemarks] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/headclerk/attendance/mark", {
        faculty_id: facultyId,
        date,
        status,
        remarks
      });
      onSaved();
    } catch (e2) {
      alert(e2?.response?.data?.message || "Failed to save attendance");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <form onSubmit={submit} className="w-full max-w-md bg-white rounded-2xl p-5 space-y-3">
        <h3 className="text-xl font-bold">Mark Attendance</h3>
        <div className="text-sm text-slate-600">Faculty: {facultyId}</div>
        <div className="text-sm text-slate-600">Date: {date}</div>

        <select className="w-full border rounded-xl p-3" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option>Present</option>
          <option>Absent</option>
          <option>Half Day</option>
        </select>

        <textarea className="w-full border rounded-xl p-3" rows={3} placeholder="Remarks (optional)" value={remarks} onChange={(e) => setRemarks(e.target.value)} />

        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="flex-1 py-2 rounded-xl border">Cancel</button>
          <button disabled={saving} className="flex-1 py-2 rounded-xl bg-brand-600 text-white">{saving ? "Saving..." : "Save"}</button>
        </div>
      </form>
    </div>
  );
}