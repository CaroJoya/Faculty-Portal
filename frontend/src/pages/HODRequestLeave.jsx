import { useEffect, useMemo, useState } from "react";
import api from "../api/axios";

export default function HODRequestLeave() {
  const [tab, setTab] = useState("regular");
  const [me, setMe] = useState(null);

  const [regular, setRegular] = useState({
    start_date: "",
    end_date: "",
    reason: "",
    leave_type: "full_day",
    leave_category: "casual",
    special_leave_type: "regular",
    attachment: null
  });

  const [comp, setComp] = useState({
    work_date: "",
    hours_worked: 8,
    reason: "",
    work_type: "holiday"
  });

  useEffect(() => {
    api.get("/me").then((r) => setMe(r.data));
  }, []);

  const calcLeaves = useMemo(() => Math.floor((Number(comp.hours_worked || 0)) / 5), [comp.hours_worked]);

  const submitRegular = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    Object.entries(regular).forEach(([k, v]) => {
      if (k === "attachment") return;
      fd.append(k, v);
    });
    if (regular.attachment) fd.append("attachment", regular.attachment);
    await api.post("/leave-requests", fd, { headers: { "Content-Type": "multipart/form-data" } });
    alert("Leave request submitted to Principal approval workflow.");
  };

  const submitComp = async (e) => {
    e.preventDefault();
    await api.post("/extra-work", {
      work_date: comp.work_date,
      hours_worked: Number(comp.hours_worked),
      reason: comp.reason,
      work_type: comp.work_type
    });
    alert("Compensation request submitted.");
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">HOD - Request My Leave</h2>

      <div className="rounded-xl bg-indigo-50 text-indigo-700 p-3 text-sm">
        Note: As HOD, your leave requests are forwarded to Principal for approval.
      </div>

      <div className="flex gap-2">
        <button onClick={() => setTab("regular")} className={`px-4 py-2 rounded-xl ${tab === "regular" ? "bg-brand-600 text-white" : "bg-white"}`}>Regular Leave</button>
        <button onClick={() => setTab("comp")} className={`px-4 py-2 rounded-xl ${tab === "comp" ? "bg-brand-600 text-white" : "bg-white"}`}>Compensation</button>
      </div>

      {me && (
        <div className="bg-white rounded-2xl p-4 shadow text-sm flex flex-wrap gap-2">
          <span className="px-2 py-1 rounded-full bg-blue-50">Medical: {me.medical_leave_left}</span>
          <span className="px-2 py-1 rounded-full bg-emerald-50">Casual: {me.casual_leave_left}</span>
          <span className="px-2 py-1 rounded-full bg-violet-50">Earned: {me.earned_leave_left}</span>
        </div>
      )}

      {tab === "regular" ? (
        <form onSubmit={submitRegular} className="bg-white rounded-2xl p-5 shadow grid md:grid-cols-2 gap-3">
          <input type="date" className="border rounded-xl p-3" value={regular.start_date} onChange={(e) => setRegular({ ...regular, start_date: e.target.value })} required />
          <input type="date" className="border rounded-xl p-3" value={regular.end_date} onChange={(e) => setRegular({ ...regular, end_date: e.target.value })} required />
          <select className="border rounded-xl p-3" value={regular.special_leave_type} onChange={(e) => setRegular({ ...regular, special_leave_type: e.target.value })}>
            <option value="regular">Regular</option>
            <option value="od">OD</option>
            <option value="extended_medical">Extended Medical</option>
            <option value="maternity">Maternity/Paternity</option>
          </select>
          <select className="border rounded-xl p-3" value={regular.leave_category} onChange={(e) => setRegular({ ...regular, leave_category: e.target.value })}>
            <option value="medical">Medical</option>
            <option value="casual">Casual</option>
            <option value="earned">Earned</option>
          </select>
          <select className="border rounded-xl p-3" value={regular.leave_type} onChange={(e) => setRegular({ ...regular, leave_type: e.target.value })}>
            <option value="full_day">Full Day</option>
            <option value="half_day">Half Day</option>
          </select>
          <input type="file" className="border rounded-xl p-3" onChange={(e) => setRegular({ ...regular, attachment: e.target.files?.[0] || null })} />
          <textarea className="border rounded-xl p-3 md:col-span-2" rows={4} placeholder="Reason" value={regular.reason} onChange={(e) => setRegular({ ...regular, reason: e.target.value })} required />
          <button className="md:col-span-2 bg-brand-600 text-white py-3 rounded-xl font-semibold">Submit Leave Request</button>
        </form>
      ) : (
        <form onSubmit={submitComp} className="bg-white rounded-2xl p-5 shadow grid md:grid-cols-2 gap-3">
          <input type="date" className="border rounded-xl p-3" value={comp.work_date} onChange={(e) => setComp({ ...comp, work_date: e.target.value })} required />
          <input type="number" step="0.5" className="border rounded-xl p-3" value={comp.hours_worked} onChange={(e) => setComp({ ...comp, hours_worked: e.target.value })} required />
          <select className="border rounded-xl p-3" value={comp.work_type} onChange={(e) => setComp({ ...comp, work_type: e.target.value })}>
            <option value="holiday">Holiday</option>
            <option value="weekend">Weekend</option>
            <option value="after_hours">After Hours</option>
          </select>
          <textarea className="border rounded-xl p-3 md:col-span-2" rows={4} placeholder="Work Description" value={comp.reason} onChange={(e) => setComp({ ...comp, reason: e.target.value })} required />
          <div className="md:col-span-2 rounded-xl bg-indigo-50 p-3 text-indigo-700 text-sm">
            Live Preview: {comp.hours_worked} hours = approximately {calcLeaves} earned leave(s)
          </div>
          <button className="md:col-span-2 bg-brand-600 text-white py-3 rounded-xl font-semibold">Submit Compensation Request</button>
        </form>
      )}
    </div>
  );
}