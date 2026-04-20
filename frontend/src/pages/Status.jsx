import React, { useEffect, useState } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function Status() {
  const token = localStorage.getItem("token");
  const [requests, setRequests] = useState([]);
  const [counts, setCounts] = useState({ total: 0, approved: 0, rejected: 0, pending: 0 });

  const load = async () => {
    const res = await axios.get(`${API}/leave-requests`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = res.data || [];
    setRequests(data);
    setCounts({
      total: data.length,
      approved: data.filter((x) => x.status === "Approved").length,
      rejected: data.filter((x) => x.status === "Rejected").length,
      pending: data.filter((x) => x.status === "Pending").length
    });
  };

  useEffect(() => { load(); }, []);

  const openLetter = async (id) => {
    try {
      const res = await axios.get(`${API}/leave-letter/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data?.letter_path) {
        window.open(`${API.replace("/api", "")}${res.data.letter_path}`, "_blank");
      }
    } catch {
      alert("Letter not available");
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold mb-4">Leave Status</h1>

      {/* Only regular summary cards kept */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="bg-white p-3 rounded shadow"><div className="text-xs">Total Requests</div><div className="text-xl">{counts.total}</div></div>
        <div className="bg-white p-3 rounded shadow"><div className="text-xs">Approved</div><div className="text-xl text-green-600">{counts.approved}</div></div>
        <div className="bg-white p-3 rounded shadow"><div className="text-xs">Rejected</div><div className="text-xl text-red-600">{counts.rejected}</div></div>
        <div className="bg-white p-3 rounded shadow"><div className="text-xs">Pending</div><div className="text-xl text-yellow-600">{counts.pending}</div></div>
      </div>

      {/* Special leave count cards removed intentionally */}

      <div className="bg-white rounded shadow overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="text-left p-2">Dates</th>
              <th className="text-left p-2">Type</th>
              <th className="text-left p-2">Reason</th>
              <th className="text-left p-2">Status</th>
              <th className="text-left p-2">Letter</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-2">{r.start_date} → {r.end_date}</td>
                <td className="p-2">{r.leave_category} / {r.leave_type}</td>
                <td className="p-2">{r.reason}</td>
                <td className="p-2">{r.status}</td>
                <td className="p-2">
                  {r.status === "Approved" ? (
                    <button className="text-blue-600 underline" onClick={() => openLetter(r.id)}>
                      View/Download
                    </button>
                  ) : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}