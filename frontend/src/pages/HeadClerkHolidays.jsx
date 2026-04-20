import { Link } from "react-router-dom";

export default function HeadClerkHolidays() {
  return (
    <div className="bg-white rounded-2xl p-8 shadow text-center space-y-3">
      <h2 className="text-3xl font-bold">Coming Soon</h2>
      <p className="text-slate-600">Holiday management feature is under development.</p>
      <Link to="/headclerk-dashboard" className="inline-block bg-brand-600 text-white px-4 py-2 rounded-xl">
        Back to Dashboard
      </Link>
    </div>
  );
}