"use client";

import { useState } from "react";
import { AdminSidebar } from "@/components/ui/admin-sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Settings, Save, Eye, EyeOff, Bell, Shield, Palette } from "lucide-react";

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    appName: "여주마켓",
    appDescription: "여주시 지역 커뮤니티",
    showVideoStats: true,
    showPostStats: true,
    enableComments: true,
    enableNotifications: true,
    maintenanceMode: false,
  });

  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    // 나중에 Supabase에 저장
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const Toggle = ({ 
    value, 
    onChange, 
    label 
  }: { 
    value: boolean; 
    onChange: (v: boolean) => void; 
    label: string;
  }) => (
    <div className="flex items-center justify-between py-3">
      <span className="text-slate-700">{label}</span>
      <button
        onClick={() => onChange(!value)}
        className={`w-12 h-6 rounded-full transition-colors ${
          value ? "bg-emerald-500" : "bg-slate-300"
        }`}
      >
        <div
          className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
            value ? "translate-x-6" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-50">
      <AdminSidebar />

      <main className="flex-1 p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">설정</h1>
            <p className="text-slate-500 mt-1">앱 설정 및 환경설정</p>
          </div>
          <Button 
            onClick={handleSave}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Save className="h-4 w-4 mr-2" />
            {saved ? "저장완료!" : "저장하기"}
          </Button>
        </div>

        <div className="grid gap-6 max-w-3xl">
          {/* 기본 설정 */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Palette className="h-5 w-5 text-emerald-500" />
                기본 설정
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>앱 이름</Label>
                <Input
                  value={settings.appName}
                  onChange={(e) =>
                    setSettings({ ...settings, appName: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>앱 설명</Label>
                <Input
                  value={settings.appDescription}
                  onChange={(e) =>
                    setSettings({ ...settings, appDescription: e.target.value })
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* 표시 설정 */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Eye className="h-5 w-5 text-blue-500" />
                표시 설정
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Toggle
                value={settings.showVideoStats}
                onChange={(v) => setSettings({ ...settings, showVideoStats: v })}
                label="영상 통계 표시 (조회수, 좋아요)"
              />
              <Separator />
              <Toggle
                value={settings.showPostStats}
                onChange={(v) => setSettings({ ...settings, showPostStats: v })}
                label="게시글 통계 표시 (조회수, 좋아요)"
              />
              <Separator />
              <Toggle
                value={settings.enableComments}
                onChange={(v) => setSettings({ ...settings, enableComments: v })}
                label="댓글 기능 활성화"
              />
            </CardContent>
          </Card>

          {/* 알림 설정 */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Bell className="h-5 w-5 text-orange-500" />
                알림 설정
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Toggle
                value={settings.enableNotifications}
                onChange={(v) => setSettings({ ...settings, enableNotifications: v })}
                label="푸시 알림 활성화"
              />
            </CardContent>
          </Card>

          {/* 시스템 설정 */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Shield className="h-5 w-5 text-red-500" />
                시스템 설정
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Toggle
                value={settings.maintenanceMode}
                onChange={(v) => setSettings({ ...settings, maintenanceMode: v })}
                label="점검 모드 (앱 접근 차단)"
              />
              {settings.maintenanceMode && (
                <div className="mt-3 p-3 bg-red-50 rounded-lg">
                  <p className="text-sm text-red-600">
                    ⚠️ 점검 모드가 활성화되면 사용자들이 앱에 접근할 수 없습니다.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 정보 */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Settings className="h-5 w-5 text-slate-500" />
                시스템 정보
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">버전</span>
                  <Badge variant="secondary">1.0.0</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">데이터베이스</span>
                  <Badge className="bg-emerald-500">Supabase 연결됨</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">스토리지</span>
                  <Badge className="bg-blue-500">Cloudflare R2</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}