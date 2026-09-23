"use client";

import React, { useState } from "react";
import {
  X,
  Lock,
  Mail,
  Building2,
  MapPin,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: "login" | "register";
}

export function AuthModal({ isOpen, onClose, initialMode = "register" }: AuthModalProps) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [branchLocation, setBranchLocation] = useState("");
  const [managerPin, setManagerPin] = useState("7788");

  if (!isOpen) return null;

  const handleModeSwitch = (newMode: "login" | "register") => {
    setMode(newMode);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Common Validation
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid work email address.");
      return;
    }

    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (mode === "login") {
        const res = await login(email, password);
        if (!res.success) {
          setError(res.error || "Login failed. Please check your credentials.");
          setIsSubmitting(false);
          return;
        }
      } else {
        // Register Validation
        if (!companyName.trim()) {
          setError("Please enter your Company / Fleet name.");
          setIsSubmitting(false);
          return;
        }

        if (!managerPin || !/^\d{4}$/.test(managerPin.trim())) {
          setError("Manager Override PIN must be exactly 4 digits.");
          setIsSubmitting(false);
          return;
        }

        const res = await register({
          email,
          password,
          companyName,
          branchLocation: branchLocation.trim() || "Jeddah Fleet Yard 3",
          managerPin: managerPin.trim(),
        });

        if (!res.success) {
          setError(res.error || "Registration failed. Please try again.");
          setIsSubmitting(false);
          return;
        }
      }

      setIsSubmitting(false);
      onClose();
    } catch (err: any) {
      setError(err.message || "An error occurred. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white/95 backdrop-blur-2xl border border-black/[0.08] rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-[0_32px_64px_rgba(0,0,0,0.16)] relative text-[#1D1D1F] space-y-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-black/[0.04] hover:bg-black/[0.08] text-[#86868B] hover:text-[#1D1D1F] flex items-center justify-center transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Brand Header */}
        <div className="text-center space-y-1.5 pt-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/[0.04] text-[11px] font-semibold text-[#1D1D1F] border border-black/[0.04] mb-1">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Z Transport Management SaaS</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-[#1D1D1F]">
            {mode === "login" ? "Sign In to Workspace" : "Create Transport Account"}
          </h2>
          <p className="text-xs text-[#86868B] max-w-xs mx-auto">
            {mode === "login"
              ? "Access your fleet job cards, anti-theft logs, and ZATCA invoices."
              : "Set up your commercial fleet workshop with anti-theft parts lock."}
          </p>
        </div>

        {/* Segmented Switcher */}
        <div className="grid grid-cols-2 bg-black/[0.04] p-1 rounded-2xl border border-black/[0.04]">
          <button
            type="button"
            onClick={() => handleModeSwitch("login")}
            className={`py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
              mode === "login"
                ? "bg-white text-[#1D1D1F] shadow-[0_2px_6px_rgba(0,0,0,0.08)]"
                : "text-[#86868B] hover:text-[#1D1D1F]"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => handleModeSwitch("register")}
            className={`py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
              mode === "register"
                ? "bg-white text-[#1D1D1F] shadow-[0_2px_6px_rgba(0,0,0,0.08)]"
                : "text-[#86868B] hover:text-[#1D1D1F]"
            }`}
          >
            Register Company
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-rose-50 border border-rose-200/80 rounded-2xl p-3 flex items-start gap-2.5 text-xs text-rose-800 animate-in fade-in duration-150">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="font-medium">{error}</div>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Company Name (Register Only) */}
          {mode === "register" && (
            <div>
              <label className="block text-[11px] font-semibold text-[#86868B] uppercase tracking-wider mb-1.5">
                Company / Transport Name
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-[#86868B] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Z Transport Logistics"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full h-11 pl-10 pr-3.5 bg-black/[0.03] focus:bg-white border border-black/[0.08] focus:border-black rounded-2xl text-xs text-[#1D1D1F] font-medium outline-none transition-all placeholder:text-[#86868B]"
                />
              </div>
            </div>
          )}

          {/* Email */}
          <div>
            <label className="block text-[11px] font-semibold text-[#86868B] uppercase tracking-wider mb-1.5">
              Work Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#86868B] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="operator@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-11 pl-10 pr-3.5 bg-black/[0.03] focus:bg-white border border-black/[0.08] focus:border-black rounded-2xl text-xs text-[#1D1D1F] font-medium outline-none transition-all placeholder:text-[#86868B]"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-[11px] font-semibold text-[#86868B] uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#86868B] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-11 pl-10 pr-10 bg-black/[0.03] focus:bg-white border border-black/[0.08] focus:border-black rounded-2xl text-xs text-[#1D1D1F] font-medium outline-none transition-all placeholder:text-[#86868B]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#86868B] hover:text-[#1D1D1F] transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Additional Register Fields */}
          {mode === "register" && (
            <>
              {/* Branch / Yard Location */}
              <div>
                <label className="block text-[11px] font-semibold text-[#86868B] uppercase tracking-wider mb-1.5">
                  Yard / Branch Location
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-[#86868B] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="e.g. Jeddah Fleet Yard 3"
                    value={branchLocation}
                    onChange={(e) => setBranchLocation(e.target.value)}
                    className="w-full h-11 pl-10 pr-3.5 bg-black/[0.03] focus:bg-white border border-black/[0.08] focus:border-black rounded-2xl text-xs text-[#1D1D1F] font-medium outline-none transition-all placeholder:text-[#86868B]"
                  />
                </div>
              </div>

              {/* Manager Security PIN */}
              <div>
                <label className="block text-[11px] font-semibold text-[#86868B] uppercase tracking-wider mb-1.5">
                  Supervisor Anti-Theft PIN (4 Digits)
                </label>
                <div className="relative">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    maxLength={4}
                    required
                    placeholder="7788"
                    value={managerPin}
                    onChange={(e) => setManagerPin(e.target.value.replace(/\D/g, ""))}
                    className="w-full h-11 pl-10 pr-3.5 bg-black/[0.03] focus:bg-white border border-black/[0.08] focus:border-black rounded-2xl text-xs text-[#1D1D1F] font-mono font-semibold tracking-widest outline-none transition-all placeholder:text-[#86868B]"
                  />
                </div>
                <p className="text-[10px] text-[#86868B] mt-1">
                  Used by supervisors to authorize early replacement of high-value parts.
                </p>
              </div>
            </>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-12 mt-2 bg-[#1D1D1F] hover:bg-black text-white text-xs font-semibold rounded-2xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {isSubmitting ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>{mode === "login" ? "Sign In to Dashboard" : "Complete Registration"}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer Disclaimer */}
        <p className="text-[11px] text-center text-[#86868B] pt-2 border-t border-black/[0.06]">
          By continuing, you agree to Z Transport Management SaaS Terms & Security Policies.
        </p>
      </div>
    </div>
  );
}
