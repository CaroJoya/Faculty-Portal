import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export default function Welcome() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen relative bg-gradient-to-br from-indigo-50 via-white to-indigo-100 flex items-center">
      {/* Decorative background shapes */}
      <div className="absolute -top-24 -left-24 w-72 h-72 bg-indigo-200/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-28 -right-20 w-96 h-96 bg-indigo-300/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-5xl mx-auto px-6 py-28">
        <div className="bg-white/60 backdrop-blur-md rounded-2xl shadow-lg border border-white/60">
          <div className="py-20 px-8 text-center">
            {/* Logo (centered, good size) */}
            <div className="flex justify-center mb-6">
              <img
                src="/college-logo.png"
                alt="PCE College Logo"
                className="h-20 md:h-24 lg:h-28 w-auto object-contain"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.style.display = "none";
                }}
              />
            </div>

            {/* Main heading */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight mb-6">
              PCE Faculty Leave Portal
            </h1>

            {/* CTA */}
            <div>
              <button
                onClick={() => navigate("/login")}
                className="inline-flex items-center gap-3 px-7 py-3 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white text-lg font-semibold shadow-xl transform transition-transform active:translate-y-0.5"
              >
                Get Started
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer band */}
      <footer className="absolute bottom-0 left-0 w-full">
        <div className="bg-white/70 backdrop-blur-md border-t border-white/60">
          <div className="max-w-5xl mx-auto px-6 py-6 text-center text-sm text-slate-600">
            <p>&copy; {new Date().getFullYear()} PCE Faculty Leave Portal. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}