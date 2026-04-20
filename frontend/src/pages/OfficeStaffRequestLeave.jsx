import RequestLeave from "./RequestLeave";

export default function OfficeStaffRequestLeave() {
  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-indigo-50 text-indigo-700 p-3 text-sm">
        Approval workflow: Office Staff → Registry → Principal
      </div>
      <RequestLeave />
    </div>
  );
}