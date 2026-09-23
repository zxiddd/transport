"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signInAnonymously, User } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import { auth, db, isFirebaseConfigured } from "@/lib/firebase";
import { CompanyProfile } from "@/types/workshop";

interface AuthContextType {
  user: User | null;
  companyId: string;
  companyProfile: CompanyProfile | null;
  loading: boolean;
  refreshCompanyProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  companyId: "tala-transport",
  companyProfile: null,
  loading: true,
  refreshCompanyProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [companyId, setCompanyId] = useState<string>("tala-transport");
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchCompany = async (cid: string) => {
    // 1. Check local storage first for immediate offline availability
    let localProfile: CompanyProfile | null = null;
    if (typeof window !== "undefined") {
      const localData = localStorage.getItem(`tala_company_${cid}`);
      if (localData) {
        try {
          localProfile = JSON.parse(localData);
          if (localProfile) {
            setCompanyProfile(localProfile);
          }
        } catch {
          // ignore parsing error
        }
      }
    }

    // 2. If Firebase credentials exist, query Firestore with network timeout guard
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
      } catch {
        // Offline / network fallback gracefully handled
      }
    }

    // 3. Fallback to default company profile if neither exists
    if (!localProfile) {
      const defaultProfile: CompanyProfile = {
        id: cid,
        name: "Tala Transport",
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

  useEffect(() => {
    let isMounted = true;
    const safetyTimeout = setTimeout(() => {
      if (isMounted) setLoading(false);
    }, 1000);

    const activeCid = "tala-transport";
    setCompanyId(activeCid);
    fetchCompany(activeCid);

    // If Firebase is not configured or in offline demo mode, assign active operator session
    if (!isFirebaseConfigured || !auth) {
      setUser({
        uid: "operator-jeddah-01",
        isAnonymous: true,
        displayName: "Tala Fleet Operator",
      } as unknown as User);
      if (isMounted) setLoading(false);
      clearTimeout(safetyTimeout);
      return () => {
        isMounted = false;
        clearTimeout(safetyTimeout);
      };
    }

    // If Firebase is configured, listen to auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      let activeUser = currentUser;
      if (!activeUser) {
        try {
          const userCred = await signInAnonymously(auth);
          activeUser = userCred.user;
          if (isMounted) setUser(activeUser);
        } catch {
          // If Anonymous auth is restricted in Firebase console (auth/admin-restricted-operation)
          // or invalid API key, assign local operator session so the terminal remains fully functional
          const fallbackUser = {
            uid: "operator-jeddah-01",
            isAnonymous: true,
            displayName: "Tala Fleet Operator",
          } as unknown as User;
          if (isMounted) setUser(fallbackUser);
        }
      } else {
        if (isMounted) setUser(activeUser);
      }

      // Ensure user record in Firestore if online
      if (activeUser && db) {
        try {
          await setDoc(
            doc(db, "users", activeUser.uid),
            {
              uid: activeUser.uid,
              companyId: activeCid,
              isAnonymous: activeUser.isAnonymous,
              lastLoginAt: serverTimestamp(),
            },
            { merge: true }
          );
        } catch {
          // Gracefully suppress write failures when offline
        }
      }

      if (isMounted) {
        setLoading(false);
        clearTimeout(safetyTimeout);
      }
    });

    return () => {
      isMounted = false;
      clearTimeout(safetyTimeout);
      unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        companyId,
        companyProfile,
        loading,
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
