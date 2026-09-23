"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  User,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import { auth, db, isFirebaseConfigured } from "@/lib/firebase";
import { CompanyProfile } from "@/types/workshop";

export interface RegisterPayload {
  email: string;
  password?: string;
  companyName: string;
  branchLocation?: string;
  managerPin: string;
}

interface AuthContextType {
  user: User | null;
  userEmail: string | null;
  companyId: string;
  companyProfile: CompanyProfile | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterPayload) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshCompanyProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userEmail: null,
  companyId: "z-transport-default",
  companyProfile: null,
  loading: true,
  isAuthenticated: false,
  login: async () => ({ success: false }),
  register: async () => ({ success: false }),
  logout: async () => {},
  refreshCompanyProfile: async () => {},
});

const ACTIVE_SESSION_KEY = "z_transport_active_session";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [companyId, setCompanyId] = useState<string>("z-transport-default");
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Helper to fetch company profile from localStorage or Firestore
  const fetchCompany = async (cid: string) => {
    let localProfile: CompanyProfile | null = null;
    if (typeof window !== "undefined") {
      const localData = localStorage.getItem(`tala_company_${cid}`);
      if (localData) {
        try {
          localProfile = JSON.parse(localData);
          if (localProfile) {
            setCompanyProfile(localProfile);
          }
        } catch {}
      }
    }

    if (isFirebaseConfigured && db) {
      try {
        const companyDocRef = doc(db, "companies", cid);
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Timeout")), 2000)
        );
        const snapshot = await Promise.race([getDoc(companyDocRef), timeoutPromise]);
        if (snapshot && snapshot.exists()) {
          const cloudProfile = { id: snapshot.id, ...snapshot.data() } as CompanyProfile;
          setCompanyProfile(cloudProfile);
          if (typeof window !== "undefined") {
            localStorage.setItem(`tala_company_${cid}`, JSON.stringify(cloudProfile));
          }
          return;
        }
      } catch {}
    }

    if (!localProfile) {
      const defaultProfile: CompanyProfile = {
        id: cid,
        name: "Z Transport Management",
        branch: "Jeddah Fleet Yard 3",
        currency: "SAR",
        vatEnabled: true,
        managerPin: "7788",
        hasCompletedOnboarding: true,
        createdAt: Timestamp.now(),
      };
      setCompanyProfile(defaultProfile);
      if (typeof window !== "undefined") {
        localStorage.setItem(`tala_company_${cid}`, JSON.stringify(defaultProfile));
      }
    }
  };

  const refreshCompanyProfile = async () => {
    if (companyId) {
      await fetchCompany(companyId);
    }
  };

  // Restore session from localStorage or Firebase Auth
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const savedSession = localStorage.getItem(ACTIVE_SESSION_KEY);
        if (savedSession) {
          const parsed = JSON.parse(savedSession);
          if (parsed?.email && parsed?.companyId) {
            setUserEmail(parsed.email);
            setCompanyId(parsed.companyId);
            setIsAuthenticated(true);
            fetchCompany(parsed.companyId);
          }
        }
      } catch {}
    }

    if (!isFirebaseConfigured || !auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setUserEmail(currentUser.email || "operator@z-transport.sa");
        setIsAuthenticated(true);

        const activeCid = currentUser.uid
          ? `cid_${currentUser.uid.substring(0, 8)}`
          : "z-transport-default";
        setCompanyId(activeCid);
        fetchCompany(activeCid);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Login handler (Email + Password)
  const login = async (email: string, password?: string) => {
    setLoading(true);
    try {
      const cleanEmail = email.trim().toLowerCase();

      // 1. Try Firebase Auth if configured
      if (isFirebaseConfigured && auth && password) {
        try {
          const userCred = await signInWithEmailAndPassword(auth, cleanEmail, password);
          setUser(userCred.user);
          setUserEmail(userCred.user.email);
          const cid = `cid_${userCred.user.uid.substring(0, 8)}`;
          setCompanyId(cid);
          setIsAuthenticated(true);
          await fetchCompany(cid);

          if (typeof window !== "undefined") {
            localStorage.setItem(
              ACTIVE_SESSION_KEY,
              JSON.stringify({ email: cleanEmail, companyId: cid })
            );
          }
          setLoading(false);
          return { success: true };
        } catch (fbErr: any) {
          // If credentials fail in Firebase, fall through or return error if specific
          if (fbErr?.code === "auth/wrong-password" || fbErr?.code === "auth/invalid-credential") {
            setLoading(false);
            return { success: false, error: "Invalid email or password." };
          }
        }
      }

      // 2. Standalone / Local Auth fallback for seamless operation
      const generatedCid = `cid_${cleanEmail.replace(/[^a-z0-9]/g, "").substring(0, 10)}`;
      setUserEmail(cleanEmail);
      setCompanyId(generatedCid);
      setIsAuthenticated(true);
      await fetchCompany(generatedCid);

      if (typeof window !== "undefined") {
        localStorage.setItem(
          ACTIVE_SESSION_KEY,
          JSON.stringify({ email: cleanEmail, companyId: generatedCid })
        );
      }

      setLoading(false);
      return { success: true };
    } catch (err: any) {
      setLoading(false);
      return { success: false, error: err.message || "Login failed. Please check inputs." };
    }
  };

  // Register handler (Email, Password, Company Name, Manager PIN)
  const register = async (payload: RegisterPayload) => {
    setLoading(true);
    try {
      const cleanEmail = payload.email.trim().toLowerCase();
      const companyName = payload.companyName.trim() || "Z Transport Management";
      const branch = payload.branchLocation?.trim() || "Jeddah Fleet Yard 3";
      const managerPin = payload.managerPin.trim() || "7788";

      let uid = `usr_${Date.now()}`;
      let targetCid = `cid_${cleanEmail.replace(/[^a-z0-9]/g, "").substring(0, 10)}`;

      // 1. Firebase Auth Registration
      if (isFirebaseConfigured && auth && payload.password) {
        try {
          const userCred = await createUserWithEmailAndPassword(auth, cleanEmail, payload.password);
          setUser(userCred.user);
          uid = userCred.user.uid;
          targetCid = `cid_${uid.substring(0, 8)}`;
        } catch (fbErr: any) {
          if (fbErr?.code === "auth/email-already-in-use") {
            setLoading(false);
            return { success: false, error: "This email is already registered. Please Sign In." };
          }
        }
      }

      // 2. Build Profile
      const newProfile: CompanyProfile = {
        id: targetCid,
        name: companyName,
        branch: branch,
        currency: "SAR",
        vatEnabled: true,
        vatRatePercentage: 15,
        managerPin: managerPin,
        hasCompletedOnboarding: true,
        createdAt: Timestamp.now(),
      };

      setCompanyId(targetCid);
      setCompanyProfile(newProfile);
      setUserEmail(cleanEmail);
      setIsAuthenticated(true);

      // Save locally
      if (typeof window !== "undefined") {
        localStorage.setItem(`tala_company_${targetCid}`, JSON.stringify(newProfile));
        localStorage.setItem(
          ACTIVE_SESSION_KEY,
          JSON.stringify({ email: cleanEmail, companyId: targetCid })
        );
      }

      // Save to Cloud Firestore if connected
      if (isFirebaseConfigured && db) {
        try {
          await setDoc(doc(db, "companies", targetCid), newProfile, { merge: true });
        } catch {}
      }

      setLoading(false);
      return { success: true };
    } catch (err: any) {
      setLoading(false);
      return { success: false, error: err.message || "Registration failed. Please try again." };
    }
  };

  // Logout handler
  const logout = async () => {
    setIsAuthenticated(false);
    setUser(null);
    setUserEmail(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem(ACTIVE_SESSION_KEY);
    }
    if (isFirebaseConfigured && auth) {
      try {
        await signOut(auth);
      } catch {}
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userEmail,
        companyId,
        companyProfile,
        loading,
        isAuthenticated,
        login,
        register,
        logout,
        refreshCompanyProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
