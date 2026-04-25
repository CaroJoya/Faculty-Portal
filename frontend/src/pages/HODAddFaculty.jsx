import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  Building2, 
  Lock, 
  Shield,
  Briefcase,
  Calendar,
  AlertCircle,
  CheckCircle
} from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function HODAddFaculty() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState("");
  const [formData, setFormData] = useState({
    username: "",
    full_name: "",
    email: "",
    phone_number: "",
    department: "",
    designation: "Assistant Professor",
    date_of_joining: new Date().toISOString().slice(0, 10),
    password: "",
    confirm_password: "",
    medical_leave_total: 12,
    casual_leave_total: 12,
    earned_leave_total: 0,
    medical_leave_left: 12,
    casual_leave_left: 12,
    earned_leave_left: 0
  });

  const designations = [
    "Assistant Professor",
    "Associate Professor",
    "Professor",
    "Senior Professor",
    "Lecturer",
    "Visiting Faculty"
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.username.trim()) newErrors.username = "Username is required";
    if (formData.username.length < 3) newErrors.username = "Username must be at least 3 characters";
    if (!formData.full_name.trim()) newErrors.full_name = "Full name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    if (!formData.email.includes("@")) newErrors.email = "Invalid email address";
    if (!formData.password) newErrors.password = "Password is required";
    if (formData.password.length < 6) newErrors.password = "Password must be at least 6 characters";
    if (formData.password !== formData.confirm_password) newErrors.confirm_password = "Passwords do not match";
    if (!formData.department) newErrors.department = "Department is required";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setLoading(true);
    setSuccess("");
    
    try {
      const submitData = { ...formData };
      delete submitData.confirm_password;
      
      const res = await axios.post(`${API}/hod/add-faculty`, submitData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSuccess(`Faculty ${formData.full_name} added successfully!`);
      setTimeout(() => {
        navigate("/hod-admin/faculty-list");
      }, 2000);
    } catch (err) {
      console.error("Failed to add faculty", err);
      const errorMsg = err?.response?.data?.message || "Failed to add faculty";
      if (errorMsg.includes("username")) {
        setErrors({ username: errorMsg });
      } else if (errorMsg.includes("email")) {
        setErrors({ email: errorMsg });
      } else {
        alert(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to="/hod-admin/faculty-list"
          className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white">Add New Faculty</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Create a new faculty account in your department</p>
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4 flex items-center gap-3">
          <CheckCircle className="text-emerald-600 dark:text-emerald-400" size={20} />
          <p className="text-emerald-700 dark:text-emerald-400">{success}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700 overflow-hidden">
        {/* Personal Information Section */}
        <div className="p-6 border-b border-slate-200 dark:border-gray-700 bg-gradient-to-r from-slate-50 to-white dark:from-gray-900 dark:to-gray-800">
          <h2 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
            <User size={18} className="text-brand-600" />
            Personal Information
          </h2>
        </div>
        <div className="p-6 space-y-5">
          <div className="grid md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Full Name *
              </label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                className={`w-full border rounded-xl px-4 py-2.5 bg-white dark:bg-gray-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-brand-400 outline-none ${
                  errors.full_name ? "border-rose-500" : "border-slate-300 dark:border-gray-600"
                }`}
                placeholder="John Doe"
              />
              {errors.full_name && <p className="text-rose-500 text-xs mt-1">{errors.full_name}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Username *
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className={`w-full border rounded-xl px-4 py-2.5 bg-white dark:bg-gray-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-brand-400 outline-none ${
                  errors.username ? "border-rose-500" : "border-slate-300 dark:border-gray-600"
                }`}
                placeholder="john.doe"
              />
              {errors.username && <p className="text-rose-500 text-xs mt-1">{errors.username}</p>}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Email *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full pl-10 border rounded-xl px-4 py-2.5 bg-white dark:bg-gray-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-brand-400 outline-none ${
                    errors.email ? "border-rose-500" : "border-slate-300 dark:border-gray-600"
                  }`}
                  placeholder="john@example.com"
                />
              </div>
              {errors.email && <p className="text-rose-500 text-xs mt-1">{errors.email}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="tel"
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleChange}
                  className="w-full pl-10 border border-slate-300 dark:border-gray-600 rounded-xl px-4 py-2.5 bg-white dark:bg-gray-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-brand-400 outline-none"
                  placeholder="+91 1234567890"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Professional Information */}
        <div className="p-6 border-t border-slate-200 dark:border-gray-700 bg-gradient-to-r from-slate-50 to-white dark:from-gray-900 dark:to-gray-800">
          <h2 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
            <Briefcase size={18} className="text-brand-600" />
            Professional Information
          </h2>
        </div>
        <div className="p-6 space-y-5">
          <div className="grid md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Department *
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className={`w-full pl-10 border rounded-xl px-4 py-2.5 bg-white dark:bg-gray-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-brand-400 outline-none ${
                    errors.department ? "border-rose-500" : "border-slate-300 dark:border-gray-600"
                  }`}
                  placeholder="Computer Science"
                />
              </div>
              {errors.department && <p className="text-rose-500 text-xs mt-1">{errors.department}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Designation
              </label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <select
                  name="designation"
                  value={formData.designation}
                  onChange={handleChange}
                  className="w-full pl-10 border border-slate-300 dark:border-gray-600 rounded-xl px-4 py-2.5 bg-white dark:bg-gray-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-brand-400 outline-none appearance-none"
                >
                  {designations.map(des => (
                    <option key={des} value={des}>{des}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Date of Joining
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="date"
                name="date_of_joining"
                value={formData.date_of_joining}
                onChange={handleChange}
                className="w-full pl-10 border border-slate-300 dark:border-gray-600 rounded-xl px-4 py-2.5 bg-white dark:bg-gray-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-brand-400 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Leave Allocation */}
        <div className="p-6 border-t border-slate-200 dark:border-gray-700 bg-gradient-to-r from-slate-50 to-white dark:from-gray-900 dark:to-gray-800">
          <h2 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
            <Calendar size={18} className="text-brand-600" />
            Leave Allocation
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Set initial leave balances for the faculty member</p>
        </div>
        <div className="p-6 space-y-5">
          <div className="grid md:grid-cols-3 gap-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Medical Leave (Total)
              </label>
              <input
                type="number"
                name="medical_leave_total"
                value={formData.medical_leave_total}
                onChange={handleChange}
                className="w-full border border-slate-300 dark:border-gray-600 rounded-xl px-4 py-2.5 bg-white dark:bg-gray-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-brand-400 outline-none"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Casual Leave (Total)
              </label>
              <input
                type="number"
                name="casual_leave_total"
                value={formData.casual_leave_total}
                onChange={handleChange}
                className="w-full border border-slate-300 dark:border-gray-600 rounded-xl px-4 py-2.5 bg-white dark:bg-gray-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-brand-400 outline-none"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Earned Leave (Total)
              </label>
              <input
                type="number"
                name="earned_leave_total"
                value={formData.earned_leave_total}
                onChange={handleChange}
                className="w-full border border-slate-300 dark:border-gray-600 rounded-xl px-4 py-2.5 bg-white dark:bg-gray-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-brand-400 outline-none"
                min="0"
              />
            </div>
          </div>
          <div className="bg-amber-50 dark:bg-amber-950/30 rounded-xl p-3 text-sm text-amber-700 dark:text-amber-400">
            <p>💡 <strong>Note:</strong> Initial leave balances are set to match the total values. You can adjust these later if needed.</p>
          </div>
        </div>

        {/* Security Section */}
        <div className="p-6 border-t border-slate-200 dark:border-gray-700 bg-gradient-to-r from-slate-50 to-white dark:from-gray-900 dark:to-gray-800">
          <h2 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
            <Lock size={18} className="text-brand-600" />
            Account Security
          </h2>
        </div>
        <div className="p-6 space-y-5">
          <div className="grid md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full pl-10 border rounded-xl px-4 py-2.5 bg-white dark:bg-gray-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-brand-400 outline-none ${
                    errors.password ? "border-rose-500" : "border-slate-300 dark:border-gray-600"
                  }`}
                  placeholder="••••••••"
                />
              </div>
              {errors.password && <p className="text-rose-500 text-xs mt-1">{errors.password}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Confirm Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="password"
                  name="confirm_password"
                  value={formData.confirm_password}
                  onChange={handleChange}
                  className={`w-full pl-10 border rounded-xl px-4 py-2.5 bg-white dark:bg-gray-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-brand-400 outline-none ${
                    errors.confirm_password ? "border-rose-500" : "border-slate-300 dark:border-gray-600"
                  }`}
                  placeholder="••••••••"
                />
              </div>
              {errors.confirm_password && <p className="text-rose-500 text-xs mt-1">{errors.confirm_password}</p>}
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="p-6 border-t border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-900/50 flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-brand-600 hover:bg-brand-700 text-white py-3 rounded-xl font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Creating Faculty...
              </>
            ) : (
              <>
                <User size={18} />
                Add Faculty
              </>
            )}
          </button>
          <Link
            to="/hod-admin/faculty-list"
            className="flex-1 bg-slate-200 dark:bg-gray-700 hover:bg-slate-300 dark:hover:bg-gray-600 text-slate-700 dark:text-slate-300 py-3 rounded-xl font-semibold transition-all text-center"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}