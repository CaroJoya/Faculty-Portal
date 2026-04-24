import React from "react";
import Dashboard from "./Dashboard";

export default function OfficeStaffDashboard() {
  return (
    <div className="space-y-4">
      {/* Workflow notice banner */}
      <div className="rounded-xl bg-indigo-50 text-indigo-700 p-4 text-sm flex items-center gap-3 border border-indigo-100">
        <i className="fas fa-info-circle text-indigo-500 text-lg"></i>
        <div>
          <span className="font-semibold">Approval Workflow:</span> 
          Office Staff → Registry → Principal. Your leave requests will be reviewed by Registry before forwarding to Principal.
        </div>
      </div>
      <Dashboard />
    </div>
  );
}