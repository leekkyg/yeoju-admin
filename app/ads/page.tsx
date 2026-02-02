"use client";

import { AdminSidebar } from "@/components/ui/admin-sidebar";
import { Card } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { Home, Layout, FileText, Video } from "lucide-react";

export default function AdsMenuPage() {
  const router = useRouter();

  const adTypes = [
    {
      title: "메인 배너 관리",
      description: "홈 상단 슬라이더 배너 (3초 자동 슬라이드)",
      icon: Home,
      color: "bg-blue-500",
      href: "/ads/main-banner",
    },
    {
      title: "피드 광고 관리",
      description: "게시물 중간 광고 (3행마다 1개)",
      icon: Layout,
      color: "bg-purple-500",
      href: "/ads/feed-ads",
    },
    {
      title: "게시물 광고 관리",
      description: "게시물 본문 내 광고 (3문단마다 1개)",
      icon: FileText,
      color: "bg-emerald-500",
      href: "/ads/post-ads",
    },
    {
      title: "동영상 광고 관리",
      description: "동영상 설명란 광고",
      icon: Video,
      color: "bg-red-500",
      href: "/ads/video-ads",
    },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50">
      <AdminSidebar />

      <main className="flex-1 p-8 max-w-[631px] mx-auto w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">광고 관리</h1>
          <p className="text-slate-500 mt-1">4가지 타입의 광고를 관리합니다</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {adTypes.map((type) => (
            <Card
              key={type.href}
              className="p-6 cursor-pointer hover:shadow-lg transition-all border-2 hover:border-emerald-500"
              onClick={() => router.push(type.href)}
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg ${type.color}`}>
                  <type.icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-slate-900 mb-1">
                    {type.title}
                  </h3>
                  <p className="text-sm text-slate-500">{type.description}</p>
                </div>
                <svg
                  className="w-6 h-6 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-bold text-blue-900 mb-2">💡 광고 타입 설명</h4>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>
              • <strong>메인 배너:</strong> 홈 화면 최상단에 표시되는 슬라이더
              배너
            </li>
            <li>
              • <strong>피드 광고:</strong> 게시물 목록 중간에 삽입되는 배너 (3행마다)
            </li>
            <li>
              • <strong>게시물 광고:</strong> 게시물 본문 내용 중간에 삽입 (3문단마다)
            </li>
            <li>
              • <strong>동영상 광고:</strong> 동영상 상세페이지 설명란에 표시
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
}
