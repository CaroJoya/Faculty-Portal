import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";

export default function RegistryDashboard() {
  const [me, setMe] = useState(null);
  const [myStatus, setMyStatus] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [admin, setAdmin] = useState(null);

  useEffect(() => {
    Promise.all([api.get("/me"), api.get("/leave-requests/status"), api.get("/registry/dashboard-stats")]).then(
      ([m, s, a]) => {
        setMe(m.data);
        setMyStatus(s.data);
        setAdmin(a.data);
      }
    );
  }, []);

  if (!me || !admin) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl p-6 bg-gradient-to-r from-brand-700 to-indigo-700 text-white shadow-lg">
        <h2 className="text-2xl font-bold">Welcome, {me.full_name}</h2>
        <p className="text-blue-100">{me.department} • Registry</p>
      </section>

      <section className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow border border-slate-200 dark:border-gray-700">
        <h3 className="text-lg font-bold mb-3 text-slate-800 dark:text-white">As Employee</h3>
        <div className="grid md:grid-cols-3 gap-3">
          <Card t="My Pending" v={myStatus.pending} />
          <Card t="My Approved" v={myStatus.approved} />
          <Card t="My Rejected" v={myStatus.rejected} />
        </div>
        <div className="grid md:grid-cols-5 gap-3 mt-4">
          <Q to="/registry/request-leave" l="Request My Leave" />
          <Q to="/registry/status" l="My Status" />
          <Q to="/registry/history" l="My History" />
          <Q to="/registry/stats" l="My Stats" />
          <Q to="/registry/profile" l="My Profile" />
        </div>
      </section>

      <section className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow border border-slate-200 dark:border-gray-700">
        <h3 className="text-lg font-bold mb-3 text-slate-800 dark:text-white">As Admin (Office Department)</h3>
        <div className="grid md:grid-cols-4 gap-3">
          <Card t="Total Staff" v={admin.total_staff} />
          <Card t="Pending Staff Requests" v={admin.pending_staff_leaves} />
          <Card t="Approved (This Year)" v={admin.approved_staff_leaves} />
          <Card t="Rejected (This Year)" v={admin.rejected_staff_leaves} />
        </div>
        <div className="grid md:grid-cols-3 gap-3 mt-4">
          <Card t="Medical Pending" v={admin.medical_count} />
          <Card t="Casual Pending" v={admin.casual_count} />
          <Card t="Earned Pending" v={admin.earned_count} />
        </div>
        <div className="grid md:grid-cols-3 gap-3 mt-4">
          <Q to="/registry-admin/staff-requests" l="Review Staff Requests" />
          <Q to="/registry-admin/staff-list" l="Staff List" />
          <Q to="/registry-admin/add-staff" l="Add Staff" />
        </div>
      </section>
    </div>
  );
}

function Card({ t, v }) {
  return (
    <div className="bg-slate-50 dark:bg-gray-900/20 rounded-xl p-4 border border-transparent dark:border-transparent">
      <p className="text-slate-500 dark:text-slate-300 text-sm">{t}</p>
      <p className="text-2xl font-bold text-slate-900 dark:text-white">{v}</p>
    </div>
  );
}
function Q({ to, l }) {
  return (
    <Link
      to={to}
      className="rounded-xl p-3 border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow text-sm font-medium text-slate-700 dark:text-slate-200"
    >
      {l}
    </Link>
  );
}