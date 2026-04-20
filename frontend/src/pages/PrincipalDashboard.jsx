import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement
} from "chart.js";
import api from "../api/axios";
import PrincipalLayout from "./PrincipalLayout";

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

export default function PrincipalDashboard() {
  const [stats, setStats] = useState(null);
  const [dept, setDept] = useState([]);
  const [typeData, setTypeData] = useState([]);

  useEffect(() => {
    Promise.all([
      api.get("/principal/dashboard-stats"),
      api.get("/principal/department-chart-data"),
      api.get("/principal/leave-type-chart-data")
    ]).then(([s, d, t]) => {
      setStats(s.data);
      setDept(d.data || []);
      setTypeData(t.data || []);
    });
  }, []);

  if (!stats) {
    return <PrincipalLayout><div>Loading...</div></PrincipalLayout>;
  }

  const deptChart = {
    labels: dept.map((x) => x.department || "Unknown"),
    datasets: [{ data: dept.map((x) => x.count), backgroundColor: ["#6366f1","#22c55e","#f59e0b","#ef4444","#06b6d4","#8b5cf6"] }]
  };

  const leaveChart = {
    labels: typeData.map((x) => x.leave_category),
    datasets: [{ label: "Pending", data: typeData.map((x) => x.count), backgroundColor: "#3b82f6" }]
  };

  return (
    <PrincipalLayout>
      <div className="space-y-4">
        <div className="rounded-2xl p-5 bg-gradient-to-r from-indigo-700 to-blue-700 text-white">
          <h1 className="text-2xl font-bold">Principal Dashboard</h1>
          <p className="text-indigo-100">Date: {new Date().toLocaleDateString()}</p>
        </div>

        <div className="grid md:grid-cols-4 gap-3">
          <Card title="Total Pending Leaves" value={stats.total_pending} />
          <Card title="HOD Leaves" value={stats.hod_pending} />
          <Card title="Faculty Leaves" value={stats.faculty_pending} />
          <Card title="Departments with Pending" value={stats.departments_with_pending?.length || 0} />
        </div>

        <div className="grid lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl p-4 shadow">
            <h3 className="font-bold mb-2">Department Summary</h3>
            <Doughnut data={deptChart} />
          </div>
          <div className="bg-white rounded-2xl p-4 shadow">
            <h3 className="font-bold mb-2">Leave Type Distribution</h3>
            <Bar data={leaveChart} />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow overflow-auto">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold">Recent Pending Requests</h3>
            <div className="space-x-2">
              <Link to="/principal/all-pending" className="px-3 py-1 rounded bg-brand-600 text-white text-sm">All Pending</Link>
              <Link to="/principal/hod-pending" className="px-3 py-1 rounded bg-indigo-600 text-white text-sm">HOD Pending</Link>
            </div>
          </div>
          <table className="w-full text-sm">
            <thead><tr className="text-left border-b"><th className="py-2">Name</th><th>Dept</th><th>Role</th><th>Period</th><th>Category</th><th>Status</th></tr></thead>
            <tbody>
              {(stats.recent_requests || []).map((r) => (
                <tr key={r.id} className="border-b">
                  <td className="py-2">{r.full_name}</td>
                  <td>{r.department}</td>
                  <td>{r.role}</td>
                  <td>{r.start_date} - {r.end_date}</td>
                  <td>{r.leave_category}</td>
                  <td>{r.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PrincipalLayout>
  );
}

function Card({ title, value }) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow">
      <p className="text-slate-500 text-sm">{title}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}