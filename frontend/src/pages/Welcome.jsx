import { useNavigate } from "react-router-dom";
import { Calendar, Shield, Users, Clock, ArrowRight } from "lucide-react";

export default function Welcome() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-brand-600/10 to-indigo-600/10" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="text-center">
            {/* College Logo - Enlarged */}
            <div className="flex justify-center mb-8">
              <img 
                src="/college-logo.png" 
                alt="PCE College Logo" 
                className="h-40 w-auto object-contain md:h-48 lg:h-56"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.style.display = "none";
                }}
              />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-brand-700 to-indigo-700 bg-clip-text text-transparent">
              PCE Faculty Leave Portal
            </h1>
            <p className="mt-4 text-xl text-slate-600 max-w-2xl mx-auto">
              Streamline leave requests, track attendance, and manage faculty workflows efficiently.
            </p>
            <div className="mt-8">
              <button
                onClick={() => navigate("/login")}
                className="inline-flex items-center justify-center px-8 py-3 rounded-xl bg-brand-600 text-white font-semibold hover:bg-brand-700 transition shadow-lg hover:shadow-xl text-lg cursor-pointer"
              >
                Get Started
                <ArrowRight className="ml-2 w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-800">Key Features</h2>
          <p className="mt-2 text-slate-600">Everything you need to manage faculty leaves</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <FeatureCard
            icon={<Calendar className="w-8 h-8 text-brand-600" />}
            title="Leave Management"
            description="Submit and track leave requests with multi-level approval workflow"
          />
          <FeatureCard
            icon={<Shield className="w-8 h-8 text-brand-600" />}
            title="Role-Based Access"
            description="Faculty, HOD, Registry, Principal - each with specific permissions"
          />
          <FeatureCard
            icon={<Users className="w-8 h-8 text-brand-600" />}
            title="Department Oversight"
            description="HODs can manage their department's faculty and leave requests"
          />
          <FeatureCard
            icon={<Clock className="w-8 h-8 text-brand-600" />}
            title="Overwork Tracking"
            description="Track extra hours and convert them to earned leaves"
          />
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 text-center text-slate-500 text-sm">
          <p>&copy; {new Date().getFullYear()} PCE Faculty Leave Portal. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-md hover:shadow-lg transition border border-slate-100">
      <div className="mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-slate-800 mb-2">{title}</h3>
      <p className="text-slate-500 text-sm">{description}</p>
    </div>
  );
}