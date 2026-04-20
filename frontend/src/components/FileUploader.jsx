import { useState } from "react";
import api from "../api/axios";

export default function FileUploader({ requestId, onUploaded }) {
  const [file, setFile] = useState(null);
  const [msg, setMsg] = useState("");

  const upload = async () => {
    if (!file) return;
    setMsg("");

    const fd = new FormData();
    fd.append("file", file);
    if (requestId) fd.append("request_id", requestId);

    try {
      const { data } = await api.post("/upload", fd, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setMsg("Uploaded");
      onUploaded?.(data.file_path);
    } catch (e2) {
      setMsg(e2?.response?.data?.message || "Upload failed");
    }
  };

  return (
    <div className="space-y-2">
      <input type="file" className="w-full border rounded-xl p-2" onChange={(e) => setFile(e.target.files?.[0] || null)} />
      <button type="button" onClick={upload} className="px-3 py-2 rounded-xl bg-indigo-600 text-white">Upload Attachment</button>
      {msg && <p className="text-sm text-slate-600">{msg}</p>}
    </div>
  );
}