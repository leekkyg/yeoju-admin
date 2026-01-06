"use client";

import { useEffect, useState, useRef } from "react";
import { AdminSidebar } from "@/components/ui/admin-sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Trash2, ExternalLink, Image, Upload, Video, X, Home, Film, FileText, MessageSquare, Zap, Smartphone, Target } from "lucide-react";
import { supabase } from "@/lib/supabase";

const R2_WORKER_URL = "https://yeoju-r2-worker.kkyg9300.workers.dev";

// 광고 위치 정의
const AD_POSITIONS = [
  { 
    value: "home_banner", 
    label: "홈 배너", 
    icon: Home,
    color: "bg-blue-500",
    description: "메인 페이지 상단 슬라이드 배너",
    recommendedSize: "1200 x 400px (3:1)",
  },
  { 
    value: "sub_banner", 
    label: "서브 배너", 
    icon: Smartphone,
    color: "bg-purple-500",
    description: "메인 페이지 퀵메뉴 하단 띠 배너",
    recommendedSize: "600 x 64px 또는 아이콘+텍스트",
  },
  { 
    value: "video_mid", 
    label: "영상 중간", 
    icon: Film,
    color: "bg-red-500",
    description: "영상 재생 중 표시되는 광고",
    recommendedSize: "이미지: 600x400px / 영상: 640x360px",
  },
  { 
    value: "post_mid", 
    label: "게시물 중간", 
    icon: FileText,
    color: "bg-orange-500",
    description: "게시물 본문 중간에 삽입되는 배너",
    recommendedSize: "600 x 100px ~ 600 x 200px",
  },
  { 
    value: "community_top", 
    label: "커뮤니티 상단", 
    icon: MessageSquare,
    color: "bg-green-500",
    description: "커뮤니티 목록 상단 배너",
    recommendedSize: "600 x 100px",
  },
  { 
    value: "popup", 
    label: "팝업 광고", 
    icon: Zap,
    color: "bg-yellow-500",
    description: "페이지 방문 시 팝업으로 표시",
    recommendedSize: "400 x 500px",
  },
];

// 타겟팅 페이지 옵션
const TARGET_PAGES = [
  { value: "home", label: "홈" },
  { value: "community", label: "커뮤니티" },
  { value: "videos", label: "영상" },
  { value: "market", label: "장터" },
  { value: "coupons", label: "쿠폰" },
];

// 타겟팅 카테고리 옵션
const TARGET_CATEGORIES = [
  { value: "자유", label: "자유" },
  { value: "질문", label: "질문" },
  { value: "정보", label: "정보" },
  { value: "뉴스", label: "뉴스" },
  { value: "건강", label: "건강" },
  { value: "지원금", label: "지원금" },
  { value: "부동산", label: "부동산" },
  { value: "맛집", label: "맛집" },
];

const icons = [
  { value: "smartphone", label: "📱 스마트폰" },
  { value: "gift", label: "🎁 선물" },
  { value: "bell", label: "🔔 알림" },
  { value: "star", label: "⭐ 별" },
  { value: "megaphone", label: "📢 메가폰" },
];

export default function AdsPage() {
  const [activeTab, setActiveTab] = useState("home_banner");
  const [ads, setAds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // 폼 데이터
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    image_url: "",
    video_url: "",
    link_url: "",
    icon: "smartphone",
    ad_type: "image",
    trigger_time: 30,
    start_date: "",
    end_date: "",
    is_pinned: false,
    pin_order: 0,
    // 타겟팅 옵션
    target_type: "all", // all, category, page, post
    target_categories: [] as string[],
    target_pages: [] as string[],
    target_post_ids: "",
  });

  // 파일 업로드 ref
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);

  useEffect(() => {
    fetchAds();
  }, [activeTab]);

  // R2 업로드 함수
  const uploadToR2 = async (file: File, folder: string) => {
    const fileName = `${folder}/${Date.now()}_${file.name}`;
    const response = await fetch(`${R2_WORKER_URL}/${fileName}`, {
      method: "PUT",
      body: file,
      headers: { "Content-Type": file.type },
    });
    if (!response.ok) throw new Error("Upload failed");
    const result = await response.json();
    return result.url;
  };

  const fetchAds = async () => {
    setLoading(true);
    
    if (activeTab === "sub_banner") {
      const { data } = await supabase
        .from("sub_banners")
        .select("*")
        .order("created_at", { ascending: false });
      setAds(data || []);
    } else {
      const { data } = await supabase
        .from("ads")
        .select("*")
        .eq("position", activeTab)
        .order("created_at", { ascending: false });
      setAds(data || []);
    }
    
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!formData.title) {
      alert("제목은 필수입니다.");
      return;
    }

    setUploading(true);

    try {
      let imageUrl = formData.image_url;
      let videoUrl = formData.video_url;

      if (imageFile) {
        imageUrl = await uploadToR2(imageFile, "ads");
      }

      if (videoFile) {
        videoUrl = await uploadToR2(videoFile, "ads-videos");
      }

      // 타겟 게시물 ID 파싱
      const targetPostIds = formData.target_post_ids
        ? formData.target_post_ids.split(",").map(id => id.trim()).filter(id => id)
        : [];

      if (activeTab === "sub_banner") {
        const { error } = await supabase.from("sub_banners").insert({
          title: formData.title,
          description: formData.description,
          image_url: imageUrl,
          link_url: formData.link_url,
          icon: formData.icon,
          start_date: formData.start_date || null,
          end_date: formData.end_date || null,
          is_pinned: formData.is_pinned,
          pin_order: formData.pin_order,
          is_active: true,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.from("ads").insert({
          title: formData.title,
          image_url: imageUrl,
          video_url: videoUrl,
          link_url: formData.link_url,
          position: activeTab,
          ad_type: formData.ad_type,
          trigger_time: formData.trigger_time,
          start_date: formData.start_date || null,
          end_date: formData.end_date || null,
          is_pinned: formData.is_pinned,
          pin_order: formData.pin_order,
          target_type: formData.target_type,
          target_categories: formData.target_categories,
          target_pages: formData.target_pages,
          target_post_ids: targetPostIds,
          is_active: true,
        });
        if (error) throw error;
      }

      alert("광고가 등록되었습니다.");
      setDialogOpen(false);
      resetForm();
      fetchAds();
    } catch (error: any) {
      console.error(error);
      alert("등록 실패: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      image_url: "",
      video_url: "",
      link_url: "",
      icon: "smartphone",
      ad_type: "image",
      trigger_time: 30,
      start_date: "",
      end_date: "",
      is_pinned: false,
      pin_order: 0,
      target_type: "all",
      target_categories: [],
      target_pages: [],
      target_post_ids: "",
    });
    setImageFile(null);
    setVideoFile(null);
  };

  const handleDelete = async (id: string | number) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    
    if (activeTab === "sub_banner") {
      await supabase.from("sub_banners").delete().eq("id", id);
    } else {
      await supabase.from("ads").delete().eq("id", id);
    }
    fetchAds();
  };

  const toggleActive = async (id: string | number, currentStatus: boolean) => {
    if (activeTab === "sub_banner") {
      await supabase.from("sub_banners").update({ is_active: !currentStatus }).eq("id", id);
    } else {
      await supabase.from("ads").update({ is_active: !currentStatus }).eq("id", id);
    }
    fetchAds();
  };

  const togglePinned = async (id: string | number, currentStatus: boolean) => {
    if (activeTab === "sub_banner") {
      await supabase.from("sub_banners").update({ is_pinned: !currentStatus }).eq("id", id);
    } else {
      await supabase.from("ads").update({ is_pinned: !currentStatus }).eq("id", id);
    }
    fetchAds();
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("ko-KR");
  };

  const getIconLabel = (icon: string) => {
    return icons.find((i) => i.value === icon)?.label || icon;
  };

  const getTargetLabel = (ad: any) => {
    if (!ad.target_type || ad.target_type === "all") return "전체";
    if (ad.target_type === "category" && ad.target_categories?.length) {
      return `카테고리: ${ad.target_categories.join(", ")}`;
    }
    if (ad.target_type === "page" && ad.target_pages?.length) {
      return `페이지: ${ad.target_pages.join(", ")}`;
    }
    if (ad.target_type === "post" && ad.target_post_ids?.length) {
      return `게시물 ${ad.target_post_ids.length}개`;
    }
    return "전체";
  };

  const toggleCategory = (category: string) => {
    const current = formData.target_categories;
    if (current.includes(category)) {
      setFormData({ ...formData, target_categories: current.filter(c => c !== category) });
    } else {
      setFormData({ ...formData, target_categories: [...current, category] });
    }
  };

  const togglePage = (page: string) => {
    const current = formData.target_pages;
    if (current.includes(page)) {
      setFormData({ ...formData, target_pages: current.filter(p => p !== page) });
    } else {
      setFormData({ ...formData, target_pages: [...current, page] });
    }
  };

  const currentPosition = AD_POSITIONS.find(p => p.value === activeTab);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <AdminSidebar />

      <main className="flex-1 p-8">
        {/* 헤더 */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900">광고 관리</h1>
          <p className="text-slate-500 mt-1">위치별 광고 배너 관리</p>
        </div>

        {/* 위치별 탭 */}
        <div className="flex flex-wrap gap-2 mb-6">
          {AD_POSITIONS.map((pos) => {
            const Icon = pos.icon;
            return (
              <button
                key={pos.value}
                onClick={() => setActiveTab(pos.value)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all ${
                  activeTab === pos.value
                    ? `${pos.color} text-white shadow-lg`
                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                <Icon className="w-4 h-4" />
                {pos.label}
              </button>
            );
          })}
        </div>

        {/* 현재 위치 정보 + 등록 버튼 */}
        <div className="flex justify-between items-start mb-6">
          <div className="bg-white border border-slate-200 rounded-xl p-4 flex-1 mr-4">
            <div className="flex items-center gap-3 mb-2">
              {currentPosition && (
                <>
                  <div className={`w-10 h-10 ${currentPosition.color} rounded-xl flex items-center justify-center`}>
                    <currentPosition.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-900">{currentPosition.label}</h2>
                    <p className="text-sm text-slate-500">{currentPosition.description}</p>
                  </div>
                </>
              )}
            </div>
            <div className="bg-slate-50 rounded-lg p-3 mt-3">
              <p className="text-sm text-slate-600">
                <strong>📐 권장 사이즈:</strong> {currentPosition?.recommendedSize}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                💡 여러 개 등록 시 랜덤으로 공정하게 노출됩니다
              </p>
            </div>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700 h-12 px-6">
                <Plus className="h-5 w-5 mr-2" />
                광고 등록
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader className="pb-4 border-b sticky top-0 bg-white z-10">
                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                  {currentPosition && (
                    <div className={`w-8 h-8 ${currentPosition.color} rounded-lg flex items-center justify-center`}>
                      <currentPosition.icon className="w-4 h-4 text-white" />
                    </div>
                  )}
                  {currentPosition?.label} 등록
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-5 py-4">
                {/* 제목 */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-800">
                    광고 제목 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="예: 여주마켓 신규 오픈 이벤트"
                    className="h-11"
                  />
                </div>

                {/* 서브 배너 전용: 설명 & 아이콘 */}
                {activeTab === "sub_banner" && (
                  <>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-slate-800">설명</Label>
                      <Input
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="예: 앱에서 더 편하게 이용하세요"
                        className="h-11"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-slate-800">아이콘</Label>
                      <select
                        className="w-full h-11 px-4 border border-slate-200 rounded-xl"
                        value={formData.icon}
                        onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                      >
                        {icons.map((icon) => (
                          <option key={icon.value} value={icon.value}>
                            {icon.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                {/* 이미지 업로드 */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-800">
                    이미지 {activeTab !== "sub_banner" && <span className="text-red-500">*</span>}
                  </Label>
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  />
                  <div
                    onClick={() => imageInputRef.current?.click()}
                    className="border-2 border-dashed rounded-xl p-4 text-center cursor-pointer hover:border-emerald-500 transition-colors"
                  >
                    {imageFile ? (
                      <div className="flex items-center justify-center gap-2">
                        <Image className="h-5 w-5 text-emerald-600" />
                        <span className="text-emerald-600 font-medium">{imageFile.name}</span>
                        <button onClick={(e) => { e.stopPropagation(); setImageFile(null); }}>
                          <X className="h-4 w-4 text-slate-400" />
                        </button>
                      </div>
                    ) : (
                      <div>
                        <Upload className="h-6 w-6 mx-auto text-slate-400 mb-1" />
                        <p className="text-slate-500 text-sm">클릭하여 이미지 선택</p>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">또는 URL 직접 입력:</p>
                  <Input
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    placeholder="https://example.com/banner.jpg"
                    className="h-11"
                  />
                </div>

                {/* 영상 중간 광고 전용 옵션 */}
                {activeTab === "video_mid" && (
                  <div className="space-y-4 p-4 bg-red-50 rounded-xl">
                    <p className="font-semibold text-slate-800">🎬 영상 광고 설정</p>
                    
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">광고 타입</Label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            value="image"
                            checked={formData.ad_type === "image"}
                            onChange={(e) => setFormData({ ...formData, ad_type: e.target.value })}
                            className="w-4 h-4 text-emerald-600"
                          />
                          <span>이미지 광고</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            value="video"
                            checked={formData.ad_type === "video"}
                            onChange={(e) => setFormData({ ...formData, ad_type: e.target.value })}
                            className="w-4 h-4 text-emerald-600"
                          />
                          <span>영상 광고</span>
                        </label>
                      </div>
                    </div>

                    {formData.ad_type === "video" && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">영상 파일</Label>
                        <input
                          ref={videoInputRef}
                          type="file"
                          accept="video/*"
                          className="hidden"
                          onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                        />
                        <div
                          onClick={() => videoInputRef.current?.click()}
                          className="border-2 border-dashed rounded-xl p-4 text-center cursor-pointer hover:border-red-500"
                        >
                          {videoFile ? (
                            <div className="flex items-center justify-center gap-2">
                              <Video className="h-5 w-5 text-red-600" />
                              <span className="text-red-600 font-medium">{videoFile.name}</span>
                              <button onClick={(e) => { e.stopPropagation(); setVideoFile(null); }}>
                                <X className="h-4 w-4 text-slate-400" />
                              </button>
                            </div>
                          ) : (
                            <div>
                              <Video className="h-6 w-6 mx-auto text-slate-400 mb-1" />
                              <p className="text-slate-500 text-sm">클릭하여 영상 선택 (5~15초 권장)</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">광고 시작 시점 (초)</Label>
                      <Input
                        type="number"
                        min="5"
                        max="300"
                        value={formData.trigger_time}
                        onChange={(e) => setFormData({ ...formData, trigger_time: parseInt(e.target.value) || 30 })}
                        className="h-11 w-32"
                      />
                    </div>
                  </div>
                )}

                {/* 링크 URL */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-800">링크 URL</Label>
                  <Input
                    value={formData.link_url}
                    onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                    placeholder="https://example.com/event"
                    className="h-11"
                  />
                </div>

                {/* 기간 */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-800">시작일</Label>
                    <Input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-800">종료일</Label>
                    <Input
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      className="h-11"
                    />
                  </div>
                </div>

                {/* 고정 옵션 */}
                <div className="space-y-3 p-4 bg-yellow-50 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-800">📌 고정 광고</p>
                      <p className="text-xs text-slate-500">고정하면 랜덤이 아닌 우선 표시</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.is_pinned}
                        onChange={(e) => setFormData({ ...formData, is_pinned: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-500"></div>
                    </label>
                  </div>
                  
                  {formData.is_pinned && (
                    <div className="space-y-2 pt-2 border-t border-yellow-200">
                      <Label className="text-sm font-medium">고정 순서</Label>
                      <Input
                        type="number"
                        min="0"
                        value={formData.pin_order}
                        onChange={(e) => setFormData({ ...formData, pin_order: parseInt(e.target.value) || 0 })}
                        className="h-11 w-24"
                      />
                    </div>
                  )}
                </div>

                {/* 타겟팅 옵션 (서브배너 제외) */}
                {activeTab !== "sub_banner" && (
                  <div className="space-y-4 p-4 bg-indigo-50 rounded-xl">
                    <div className="flex items-center gap-2">
                      <Target className="w-5 h-5 text-indigo-600" />
                      <p className="font-semibold text-slate-800">🎯 타겟팅 설정</p>
                    </div>
                    
                    {/* 타겟 타입 선택 */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">표시 대상</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { value: "all", label: "전체", desc: "모든 곳에 표시" },
                          { value: "category", label: "카테고리", desc: "특정 카테고리만" },
                          { value: "page", label: "페이지", desc: "특정 페이지만" },
                          { value: "post", label: "게시물", desc: "특정 게시물만" },
                        ].map((opt) => (
                          <label
                            key={opt.value}
                            className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                              formData.target_type === opt.value
                                ? "border-indigo-500 bg-indigo-100"
                                : "border-slate-200 hover:border-slate-300"
                            }`}
                          >
                            <input
                              type="radio"
                              value={opt.value}
                              checked={formData.target_type === opt.value}
                              onChange={(e) => setFormData({ ...formData, target_type: e.target.value })}
                              className="sr-only"
                            />
                            <div>
                              <p className="font-medium text-sm">{opt.label}</p>
                              <p className="text-xs text-slate-500">{opt.desc}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* 카테고리 선택 */}
                    {formData.target_type === "category" && (
                      <div className="space-y-2 pt-2 border-t border-indigo-200">
                        <Label className="text-sm font-medium">카테고리 선택</Label>
                        <div className="flex flex-wrap gap-2">
                          {TARGET_CATEGORIES.map((cat) => (
                            <button
                              key={cat.value}
                              type="button"
                              onClick={() => toggleCategory(cat.value)}
                              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                                formData.target_categories.includes(cat.value)
                                  ? "bg-indigo-500 text-white"
                                  : "bg-white border border-slate-300 text-slate-600 hover:border-indigo-300"
                              }`}
                            >
                              {cat.label}
                            </button>
                          ))}
                        </div>
                        <p className="text-xs text-indigo-600">선택한 카테고리의 게시물에만 광고 표시</p>
                      </div>
                    )}

                    {/* 페이지 선택 */}
                    {formData.target_type === "page" && (
                      <div className="space-y-2 pt-2 border-t border-indigo-200">
                        <Label className="text-sm font-medium">페이지 선택</Label>
                        <div className="flex flex-wrap gap-2">
                          {TARGET_PAGES.map((page) => (
                            <button
                              key={page.value}
                              type="button"
                              onClick={() => togglePage(page.value)}
                              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                                formData.target_pages.includes(page.value)
                                  ? "bg-indigo-500 text-white"
                                  : "bg-white border border-slate-300 text-slate-600 hover:border-indigo-300"
                              }`}
                            >
                              {page.label}
                            </button>
                          ))}
                        </div>
                        <p className="text-xs text-indigo-600">선택한 페이지에만 광고 표시</p>
                      </div>
                    )}

                    {/* 게시물 ID 입력 */}
                    {formData.target_type === "post" && (
                      <div className="space-y-2 pt-2 border-t border-indigo-200">
                        <Label className="text-sm font-medium">게시물 ID</Label>
                        <Input
                          value={formData.target_post_ids}
                          onChange={(e) => setFormData({ ...formData, target_post_ids: e.target.value })}
                          placeholder="123, 456, 789"
                          className="h-11"
                        />
                        <p className="text-xs text-indigo-600">쉼표로 구분하여 여러 게시물 ID 입력 가능</p>
                      </div>
                    )}
                  </div>
                )}

                {/* 버튼 */}
                <div className="flex justify-end gap-3 pt-4 border-t sticky bottom-0 bg-white">
                  <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={uploading}>
                    취소
                  </Button>
                  <Button onClick={handleSubmit} disabled={uploading} className="bg-emerald-600 hover:bg-emerald-700">
                    {uploading ? "업로드 중..." : "등록하기"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* 광고 목록 테이블 */}
        <Card className="border-0 shadow-lg rounded-2xl overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-100">
                  <TableHead className="py-4 font-semibold">미리보기</TableHead>
                  <TableHead className="py-4 font-semibold">제목</TableHead>
                  <TableHead className="py-4 font-semibold">타겟</TableHead>
                  <TableHead className="py-4 font-semibold">고정</TableHead>
                  <TableHead className="py-4 font-semibold">기간</TableHead>
                  <TableHead className="py-4 font-semibold">상태</TableHead>
                  <TableHead className="text-right py-4 font-semibold">관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-slate-500">
                      로딩중...
                    </TableCell>
                  </TableRow>
                ) : ads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-slate-500">
                      등록된 광고가 없습니다
                    </TableCell>
                  </TableRow>
                ) : (
                  ads.map((ad) => (
                    <TableRow key={ad.id} className="hover:bg-slate-50">
                      <TableCell className="py-4">
                        {ad.image_url ? (
                          <img
                            src={ad.image_url}
                            alt=""
                            className="w-24 h-16 object-cover rounded-lg border"
                          />
                        ) : activeTab === "sub_banner" ? (
                          <div className="flex items-center gap-2 bg-emerald-50 px-3 py-2 rounded-lg w-fit">
                            <span className="text-lg">{getIconLabel(ad.icon).split(" ")[0]}</span>
                            <span className="text-xs font-medium text-slate-700">{ad.title}</span>
                          </div>
                        ) : (
                          <div className="w-24 h-16 bg-slate-200 rounded-lg flex items-center justify-center">
                            <Image className="w-6 h-6 text-slate-400" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="py-4">
                        <div>
                          <p className="font-semibold text-slate-800">{ad.title}</p>
                          {ad.description && (
                            <p className="text-xs text-slate-500">{ad.description}</p>
                          )}
                          {ad.link_url && (
                            <a
                              href={ad.link_url}
                              target="_blank"
                              className="text-xs text-blue-500 flex items-center gap-1 hover:underline mt-1"
                            >
                              <ExternalLink className="h-3 w-3" />
                              링크
                            </a>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <Badge variant="outline" className="text-xs">
                          {getTargetLabel(ad)}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-4">
                        <Badge
                          className={`cursor-pointer ${
                            ad.is_pinned
                              ? "bg-yellow-500 hover:bg-yellow-600"
                              : "bg-slate-300 hover:bg-slate-400"
                          }`}
                          onClick={() => togglePinned(ad.id, ad.is_pinned)}
                        >
                          {ad.is_pinned ? `📌 ${ad.pin_order || 0}` : "랜덤"}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-4 text-sm text-slate-600">
                        {formatDate(ad.start_date)} ~ {formatDate(ad.end_date)}
                      </TableCell>
                      <TableCell className="py-4">
                        <Badge
                          className={`cursor-pointer ${
                            ad.is_active
                              ? "bg-emerald-500 hover:bg-emerald-600"
                              : "bg-slate-400 hover:bg-slate-500"
                          }`}
                          onClick={() => toggleActive(ad.id, ad.is_active)}
                        >
                          {ad.is_active ? "활성" : "비활성"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right py-4">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDelete(ad.id)}
                        >
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* 통계 카드 */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <p className="text-sm text-slate-500">총 등록 광고</p>
              <p className="text-2xl font-bold text-slate-900">{ads.length}개</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <p className="text-sm text-slate-500">활성 광고</p>
              <p className="text-2xl font-bold text-emerald-600">
                {ads.filter(a => a.is_active).length}개
              </p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <p className="text-sm text-slate-500">고정 광고</p>
              <p className="text-2xl font-bold text-yellow-600">
                {ads.filter(a => a.is_pinned).length}개
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
