"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signInAnonymously, User } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
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
    try {
      const companyDocRef = doc(db, "companies", cid);
      const snapshot = await getDoc(companyDocRef);
      if (snapshot.exists()) {
        setCompanyProfile({ id: snapshot.id, ...snapshot.data() } as CompanyProfile);
        return;
      }
    } catch (error) {
      console.warn("Firestore company fetch warning:", error);
    }

    // Check localStorage fallback
    if (typeof window !== "undefined") {
      const localData = localStorage.getItem(`tala_company_${cid}`);
      if (localData) {
        try {
          setCompanyProfile(JSON.parse(localData));
          return;
        } catch {
          // ignore error
        }
      }
    }

    setCompanyProfile(null);
  };

  const refreshCompanyProfile = async () => {
    if (companyId) {
      await fetchCompany(companyId);
    }
  };

  useEffect(() => {
    const safetyTimeout = setTimeout(() => {
      setLoading(false);
    }, 1500);

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      let activeUser = currentUser;
      if (!activeUser) {
        try {
          const userCred = await signInAnonymously(auth);
          activeUser = userCred.user;
          setUser(activeUser);
        } catch (err) {
          console.warn("Anonymous auth warning:", err);
        }
      } else {
        setUser(activeUser);
      }

      // Ensure user record in Firestore
      if (activeUser) {
        try {
          await setDoc(
            doc(db, "users", activeUser.uid),
            {
              uid: activeUser.uid,
              companyId: "tala-transport",
              isAnonymous: activeUser.isAnonymous,
              lastLoginAt: serverTimestamp(),
            },
            { merge: true }
          );
        } catch (err) {
          console.warn("User doc setDoc warning:", err);
        }
      }

      const activeCid = "tala-transport";
      setCompanyId(activeCid);
      await fetchCompany(activeCid);
      setLoading(false);
      clearTimeout(safetyTimeout);
    });

    return () => {
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
