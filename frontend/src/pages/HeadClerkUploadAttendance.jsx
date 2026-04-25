// frontend/src/pages/HeadClerkUploadAttendance.jsx
import { useState } from "react";
import api from "../api/axios";
import { Upload, FileText, CheckCircle, AlertCircle, Download, X } from "lucide-react";

export default function HeadClerkUploadAttendance() {
  const [month, setMonth] = useState("");
  const [fileType, setFileType] = useState("Excel");
  const [file, setFile] = useState(null);
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState("");
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      // Preview file name and size
      setPreview({
        name: selectedFile.name,
        size: (selectedFile.size / 1024).toFixed(2),
        type: selectedFile.type
      });
    }
  };

  const downloadTemplate = () => {
    const headers = ["faculty_id", "date", "status", "remarks"];
    const sampleData = [
      ["john.doe", "2024-01-15", "Present", ""],
      ["jane.smith", "2024-01-15", "Absent", "Medical emergency"],
      ["bob.wilson", "2024-01-15", "Half Day", "Personal reasons"]
    ];
    
    const csvContent = [headers, ...sampleData].map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance_template_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!month) {
      setMsgType("error");
      setMsg("Please select a month");
      return;
    }
    if (!file) {
      setMsgType("error");
      setMsg("Please select a file to upload");
      return;
    }

    setUploading(true);
    setMsg("");
    setMsgType("");

    const fd = new FormData();
    fd.append("month", month);
    fd.append("file_type", fileType);
    fd.append("file", file);

    try {
      const { data } = await api.post("/headclerk/attendance/upload", fd, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setMsgType("success");
      setMsg(data.message || "Attendance uploaded successfully!");
      setFile(null);
      setPreview(null);
      setMonth("");
      setTimeout(() => setMsg(""), 5000);
    } catch (err) {
      setMsgType("error");
      setMsg(err?.response?.data?.message || "Upload failed. Please check file format.");
    } finally {
      setUploading(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    setPreview(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white">Upload Attendance</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Bulk upload monthly attendance records from Excel or CSV</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Upload Form */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700 overflow-hidden">
            <div className="p-5 border-b border-slate-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <Upload size={18} className="text-brand-600" />
                <h2 className="font-semibold text-slate-800 dark:text-white">Upload Attendance File</h2>
              </div>
            </div>
            
            <form onSubmit={submit} className="p-5 space-y-5">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Select Month *
                  </label>
                  <input
                    type="month"
                    className="w-full border border-slate-300 dark:border-gray-600 rounded-xl px-4 py-2.5 bg-white dark:bg-gray-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-brand-400 outline-none"
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    File Type
                  </label>
                  <select
                    className="w-full border border-slate-300 dark:border-gray-600 rounded-xl px-4 py-2.5 bg-white dark:bg-gray-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-brand-400 outline-none"
                    value={fileType}
                    onChange={(e) => setFileType(e.target.value)}
                  >
                    <option value="Excel">Excel (.xlsx, .xls)</option>
                    <option value="CSV">CSV (.csv)</option>
                    <option value="Manual">Manual Entry</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Attendance File
                </label>
                <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                  file ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20" : "border-slate-300 dark:border-gray-600 hover:border-brand-400"
                }`}>
                  {!file ? (
                    <>
                      <Upload size={40} className="mx-auto text-slate-400 mb-3" />
                      <p className="text-slate-600 dark:text-slate-400">Drag & drop or click to select file</p>
                      <p className="text-xs text-slate-400 mt-1">Supported formats: .xlsx, .xls, .csv (Max 16MB)</p>
                      <input
                        type="file"
                        className="hidden"
                        id="file-upload"
                        accept=".xlsx,.xls,.csv"
                        onChange={handleFileChange}
                      />
                      <label
                        htmlFor="file-upload"
                        className="inline-block mt-3 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm cursor-pointer transition-all"
                      >
                        Choose File
                      </label>
                    </>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText size={32} className="text-emerald-600" />
                        <div className="text-left">
                          <p className="font-medium text-slate-800 dark:text-white">{preview?.name}</p>
                          <p className="text-xs text-slate-500">{preview?.size} KB • {preview?.type || fileType}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={clearFile}
                        className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-700 transition-all"
                      >
                        <X size={18} className="text-slate-500" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {msg && (
                <div className={`p-3 rounded-xl flex items-start gap-2 ${
                  msgType === "success" 
                    ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                    : "bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800"
                }`}>
                  {msgType === "success" ? <CheckCircle size={18} className="flex-shrink-0" /> : <AlertCircle size={18} className="flex-shrink-0" />}
                  <span className="text-sm">{msg}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={uploading || !file || !month}
                className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload size={18} />
                    Upload Attendance
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Instructions Panel */}
        <div className="space-y-6">
          <div className="bg-blue-50 dark:bg-blue-950/30 rounded-2xl p-5 border border-blue-200 dark:border-blue-800">
            <h3 className="font-semibold text-blue-800 dark:text-blue-400 mb-3">📋 File Format Instructions</h3>
            <div className="space-y-3 text-sm text-blue-700 dark:text-blue-300">
              <p>Your file should have the following columns:</p>
              <ul className="space-y-2 list-disc list-inside">
                <li><span className="font-mono bg-blue-100 dark:bg-blue-900/50 px-1 rounded">faculty_id</span> - Username of faculty</li>
                <li><span className="font-mono bg-blue-100 dark:bg-blue-900/50 px-1 rounded">date</span> - Date (YYYY-MM-DD format)</li>
                <li><span className="font-mono bg-blue-100 dark:bg-blue-900/50 px-1 rounded">status</span> - Present, Absent, or Half Day</li>
                <li><span className="font-mono bg-blue-100 dark:bg-blue-900/50 px-1 rounded">remarks</span> - Optional notes</li>
              </ul>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700 p-5">
            <h3 className="font-semibold text-slate-800 dark:text-white mb-3">📎 Template</h3>
            <button
              onClick={downloadTemplate}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-gray-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-gray-600 transition-all"
            >
              <Download size={16} />
              Download CSV Template
            </button>
          </div>

          <div className="bg-amber-50 dark:bg-amber-950/30 rounded-2xl p-5 border border-amber-200 dark:border-amber-800">
            <h3 className="font-semibold text-amber-800 dark:text-amber-400 mb-2">⚠️ Important Notes</h3>
            <ul className="space-y-2 text-sm text-amber-700 dark:text-amber-300">
              <li>• Maximum file size: 16MB</li>
              <li>• Duplicate entries will be updated</li>
              <li>• Invalid faculty IDs will be skipped</li>
              <li>• Month selection determines which period to update</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}