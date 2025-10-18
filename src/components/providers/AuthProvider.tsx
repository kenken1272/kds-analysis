// src/components/providers/AuthProvider.tsx
"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { User } from "firebase/auth";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { getFirebase } from "@/lib/firebase/client";

export type AuthContextValue = {
  user: User | null;
  loading: boolean;
  orgId: string | null;
};

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  orgId: null,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { auth, firestore } = getFirebase();
    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      if (nextUser) {
        const userDoc = await getDoc(doc(firestore, "users", nextUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data() as { orgId?: string };
          setOrgId(data.orgId ?? null);
        } else {
          setOrgId(null);
        }
      } else {
        setOrgId(null);
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      orgId,
    }),
    [user, loading, orgId],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
