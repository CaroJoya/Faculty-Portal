import { useState } from "react";
import api from "../api/axios";

export default function HeadClerkUploadAttendance() {
  const [month, setMonth] = useState("");
  const [fileType, setFileType] = useState("Excel");
  const [file, setFile] = useState(null);
  const [msg, setMsg] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setMsg("");

    const fd = new FormData();
    fd.append("month", month);
    fd.append("file_type", fileType);
    if (file) fd.append("file", file);

    try {
      const { data } = await api.post("/headclerk/attendance/upload", fd, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setMsg(data.message || "Uploaded");
    } catch (e2) {
      setMsg(e2?.response?.data?.message || "Upload failed");
    }
  };

  return (
    <div className="max-w-2xl bg-white rounded-2xl p-6 shadow space-y-4">
      <h2 className="text-2xl font-bold">Upload Monthly Attendance</h2>
      <form onSubmit={submit} className="space-y-3">
        <input type="month" className="w-full border rounded-xl p-3" value={month} onChange={(e) => setMonth(e.target.value)} required />
        <select className="w-full border rounded-xl p-3" value={fileType} onChange={(e) => setFileType(e.target.value)}>
          <option>Excel</option>
          <option>CSV</option>
          <option>Manual</option>
        </select>
        <input type="file" className="w-full border rounded-xl p-3" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        <button className="bg-brand-600 text-white px-4 py-2 rounded-xl">Upload</button>
      </form>
      <p className="text-sm text-slate-600">Format: faculty_id, date(YYYY-MM-DD), status(Present/Absent/Half Day), remarks(optional)</p>
      {msg && <p className="text-sm text-indigo-700">{msg}</p>}
    </div>
  );
}