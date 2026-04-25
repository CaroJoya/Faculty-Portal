// frontend/src/pages/HeadClerkHolidays.jsx
import { Link } from "react-router-dom";
import { Calendar, Plus, Trash2, Edit } from "lucide-react";

export default function HeadClerkHolidays() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white">Holiday Management</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Manage institute holidays and non-working days</p>
      </div>

      {/* Coming Soon Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-brand-600 via-purple-600 to-indigo-600 p-8 text-white shadow-xl">
        <div className="relative z-10 text-center">
          <Calendar size={48} className="mx-auto mb-4 opacity-80" />
          <h2 className="text-2xl md:text-3xl font-bold mb-2">Coming Soon</h2>
          <p className="text-brand-100 max-w-md mx-auto">
            Holiday management feature is under development. 
            Soon you'll be able to add, edit, and manage institute holidays.
          </p>
          <Link 
            to="/headclerk-dashboard" 
            className="inline-block mt-6 px-6 py-2.5 rounded-xl bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all"
          >
            Back to Dashboard
          </Link>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
      </div>

      {/* Preview of upcoming features */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-slate-200 dark:border-gray-700">
          <Plus size={24} className="text-brand-600 mb-3" />
          <h3 className="font-semibold text-slate-800 dark:text-white">Add Holidays</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Create new institute holidays with dates and descriptions</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-slate-200 dark:border-gray-700">
          <Edit size={24} className="text-brand-600 mb-3" />
          <h3 className="font-semibold text-slate-800 dark:text-white">Manage Holidays</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Edit existing holidays and update information</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-slate-200 dark:border-gray-700">
          <Trash2 size={24} className="text-brand-600 mb-3" />
          <h3 className="font-semibold text-slate-800 dark:text-white">Remove Holidays</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Delete holidays that are no longer applicable</p>
        </div>
      </div>
    </div>
  );
}