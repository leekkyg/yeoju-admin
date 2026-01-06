"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface AuthContextType {
  user: any;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    console.log("세션:", session);
    
    if (session?.user) {
      console.log("유저 이메일:", session.user.email);
      
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("email", session.user.email)
        .single();

      console.log("프로필:", profile, "에러:", error);

      if (profile?.role === "admin") {
        console.log("관리자 확인됨");
        setUser(session.user);
      } else {
        console.log("관리자 아님 - 로그아웃");
        await supabase.auth.signOut();
        setUser(null);
        if (pathname !== "/login") {
          window.location.href = "/login";
        }
      }
    } else {
      console.log("세션 없음");
      if (pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    setLoading(false);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    window.location.href = "/login";
  };

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0f172a"
      }}>
        <div style={{ color: "white", fontSize: "18px" }}>로딩 중...</div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}