import { Link } from "react-router-dom";

export default function HeadClerkDashboard() {
  const now = new Date().toLocaleDateString();

  return (
    <div className="space-y-6">
      <div className="rounded-2xl p-6 bg-gradient-to-r from-indigo-700 to-blue-700 text-white shadow-lg">
        <h2 className="text-2xl font-bold">Head Clerk Dashboard</h2>
        <p className="text-indigo-100">Today: {now}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Link to="/headclerk/attendance/calendar" className="bg-white rounded-2xl p-6 shadow hover:shadow-md transition border">
          <h3 className="text-xl font-bold mb-2">Attendance Management</h3>
          <p className="text-slate-600">View monthly calendar, mark/edit attendance records.</p>
        </Link>

        <Link to="/headclerk/vacation/manage" className="bg-white rounded-2xl p-6 shadow hover:shadow-md transition border">
          <h3 className="text-xl font-bold mb-2">Vacation Report</h3>
          <p className="text-slate-600">Manage 7-day vacation periods and faculty vacation status.</p>
        </Link>
      </div>
    </div>
  );
}