"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError("이메일 또는 비밀번호가 올바르지 않습니다");
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("email", email)
        .single();

      if (!profile || profile.role !== "admin") {
        setError("관리자 권한이 없습니다");
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      router.push("/");
    } catch (err) {
      setError("로그인 중 오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      background: "linear-gradient(135deg, #0f172a 0%, #064e3b 50%, #0f172a 100%)"
    }}>
      {/* 왼쪽 브랜딩 */}
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "60px",
        color: "white"
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          marginBottom: "40px"
        }}>
          <div style={{
            width: "56px",
            height: "56px",
            background: "linear-gradient(135deg, #10b981, #06b6d4)",
            borderRadius: "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "24px",
            fontWeight: "bold"
          }}>
            여
          </div>
          <span style={{ fontSize: "28px", fontWeight: "bold" }}>여주마켓</span>
        </div>
        
        <h1 style={{
          fontSize: "48px",
          fontWeight: "bold",
          lineHeight: 1.2,
          marginBottom: "24px"
        }}>
          관리자 센터에<br />오신 것을 환영합니다
        </h1>
        
        <p style={{
          fontSize: "18px",
          color: "#94a3b8",
          lineHeight: 1.6
        }}>
          여주마켓의 모든 서비스를<br />
          한 곳에서 관리하세요.
        </p>

        <div style={{
          display: "flex",
          gap: "48px",
          marginTop: "60px"
        }}>
          <div>
            <p style={{ fontSize: "36px", fontWeight: "bold", color: "#10b981" }}>24/7</p>
            <p style={{ color: "#64748b", marginTop: "4px" }}>실시간 모니터링</p>
          </div>
          <div>
            <p style={{ fontSize: "36px", fontWeight: "bold", color: "#06b6d4" }}>100%</p>
            <p style={{ color: "#64748b", marginTop: "4px" }}>보안 시스템</p>
          </div>
        </div>
      </div>

      {/* 오른쪽 로그인 폼 */}
      <div style={{
        width: "500px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "white",
        borderRadius: "24px 0 0 24px"
      }}>
        <div style={{ width: "100%", maxWidth: "360px", padding: "40px" }}>
          <h2 style={{
            fontSize: "32px",
            fontWeight: "bold",
            color: "#0f172a",
            marginBottom: "8px"
          }}>
            로그인
          </h2>
          <p style={{
            color: "#64748b",
            marginBottom: "32px"
          }}>
            관리자 계정으로 로그인하세요
          </p>

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: "20px" }}>
              <label style={{
                display: "block",
                fontSize: "14px",
                fontWeight: "600",
                color: "#374151",
                marginBottom: "8px"
              }}>
                이메일
              </label>
              <input
                type="email"
                placeholder="admin@yeojumarket.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  fontSize: "16px",
                  border: "2px solid #e2e8f0",
                  borderRadius: "12px",
                  outline: "none",
                  transition: "border-color 0.2s",
                  boxSizing: "border-box"
                }}
                onFocus={(e) => e.target.style.borderColor = "#10b981"}
                onBlur={(e) => e.target.style.borderColor = "#e2e8f0"}
              />
            </div>

            <div style={{ marginBottom: "24px" }}>
              <label style={{
                display: "block",
                fontSize: "14px",
                fontWeight: "600",
                color: "#374151",
                marginBottom: "8px"
              }}>
                비밀번호
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  fontSize: "16px",
                  border: "2px solid #e2e8f0",
                  borderRadius: "12px",
                  outline: "none",
                  transition: "border-color 0.2s",
                  boxSizing: "border-box"
                }}
                onFocus={(e) => e.target.style.borderColor = "#10b981"}
                onBlur={(e) => e.target.style.borderColor = "#e2e8f0"}
              />
            </div>

            {error && (
              <div style={{
                padding: "14px 16px",
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: "12px",
                marginBottom: "20px"
              }}>
                <p style={{ color: "#dc2626", fontSize: "14px", margin: 0 }}>{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "14px",
                fontSize: "16px",
                fontWeight: "600",
                color: "white",
                background: loading ? "#94a3b8" : "linear-gradient(135deg, #10b981, #059669)",
                border: "none",
                borderRadius: "12px",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "transform 0.2s, box-shadow 0.2s",
                boxShadow: "0 4px 14px rgba(16, 185, 129, 0.4)"
              }}
              onMouseOver={(e) => !loading && (e.currentTarget.style.transform = "translateY(-2px)")}
              onMouseOut={(e) => e.currentTarget.style.transform = "translateY(0)"}
            >
              {loading ? "로그인 중..." : "로그인"}
            </button>
          </form>

          <p style={{
            textAlign: "center",
            color: "#94a3b8",
            fontSize: "13px",
            marginTop: "32px"
          }}>
            © 2025 여주마켓. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}