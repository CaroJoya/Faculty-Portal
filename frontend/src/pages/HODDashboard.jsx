import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";

export default function HODDashboard() {
  const [me, setMe] = useState(null);
  const [myStatus, setMyStatus] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [admin, setAdmin] = useState(null);

  useEffect(() => {
    Promise.all([
      api.get("/me"),
      api.get("/leave-requests/status"),
      api.get("/hod/dashboard-stats")
    ]).then(([m, s, a]) => {
      setMe(m.data);
      setMyStatus(s.data);
      setAdmin(a.data);
    });
  }, []);

  if (!me || !admin) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl p-6 bg-gradient-to-r from-brand-700 to-indigo-700 text-white shadow-lg">
        <h2 className="text-2xl font-bold">Welcome, {me.full_name}</h2>
        <p className="text-blue-100">{me.department} • HOD</p>
      </section>

      <section className="bg-white rounded-2xl p-5 shadow">
        <h3 className="text-lg font-bold mb-3">As Employee</h3>
        <div className="grid md:grid-cols-3 gap-3">
          <Card t="My Pending Requests" v={myStatus.pending} />
          <Card t="My Approved Requests" v={myStatus.approved} />
          <Card t="My Rejected Requests" v={myStatus.rejected} />
        </div>
        <div className="grid md:grid-cols-5 gap-3 mt-4">
          <Quick to="/hod/request-leave" label="Request My Leave" />
          <Quick to="/hod/status" label="My Status" />
          <Quick to="/hod/history" label="My History" />
          <Quick to="/hod/stats" label="My Stats" />
          <Quick to="/hod/profile" label="My Profile" />
        </div>
      </section>

      <section className="bg-white rounded-2xl p-5 shadow">
        <h3 className="text-lg font-bold mb-3">As Department Head (Admin)</h3>
        <div className="grid md:grid-cols-4 gap-3">
          <Card t="Total Faculty" v={admin.total_faculty} />
          <Card t="Pending Faculty Requests" v={admin.pending_faculty_leaves} />
          <Card t="Approved (This Year)" v={admin.approved_faculty_leaves} />
          <Card t="Rejected (This Year)" v={admin.rejected_faculty_leaves} />
        </div>

        <div className="mt-4 grid md:grid-cols-3 gap-3">
          <Card t="Medical Pending" v={admin.medical_count} />
          <Card t="Casual Pending" v={admin.casual_count} />
          <Card t="Earned Pending" v={admin.earned_count} />
        </div>

        <div className="mt-4 grid md:grid-cols-3 gap-3">
          <Quick to="/hod-admin/faculty-requests" label="Review Faculty Requests" />
          <Quick to="/hod-admin/faculty-list" label="Faculty List" />
          <Quick to="/hod-admin/add-faculty" label="Add New Faculty" />
        </div>

        <div className="mt-5">
          <h4 className="font-semibold mb-2">Recent Pending Requests</h4>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2">Faculty</th>
                  <th>Type</th>
                  <th>Dates</th>
                  <th>Review</th>
                </tr>
              </thead>
              <tbody>
                {(admin.recent_requests || []).map((r) => (
                  <tr key={r.id} className="border-b">
                    <td className="py-2">{r.full_name}</td>
                    <td>{r.leave_category} / {r.leave_type}</td>
                    <td>{r.start_date} - {r.end_date}</td>
                    <td>
                      <Link className="text-brand-700 underline" to={`/hod-admin/faculty-requests/${r.id}`}>Review</Link>
                    </td>
                  </tr>
                ))}
                {(admin.recent_requests || []).length === 0 && (
                  <tr><td className="py-3 text-slate-500" colSpan={4}>No pending requests.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}

function Card({ t, v }) {
  return (
    <div className="bg-slate-50 rounded-xl p-4">
      <p className="text-slate-500 text-sm">{t}</p>
      <p className="text-2xl font-bold text-slate-800">{v}</p>
    </div>
  );
}
function Quick({ to, label }) {
  return <Link to={to} className="rounded-xl p-3 border bg-white hover:shadow text-sm font-medium">{label}</Link>;
}