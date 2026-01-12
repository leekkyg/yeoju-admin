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
import { Plus, Trash2, ExternalLink, Image, Upload, Video, X, Home, Film, FileText, MessageSquare, Zap, Smartphone, Target, Pencil } from "lucide-react";
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
    description: "메인 페이지 중간/하단 띠 배너 (3개 위치)",
    recommendedSize: "600 x 120px (5:1) 또는 아이콘+텍스트",
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
    value: "post_list", 
    label: "글 목록 사이", 
    icon: FileText,
    color: "bg-orange-500",
    description: "커뮤니티 피드에서 글과 글 사이에 표시",
    recommendedSize: "600 x 100px",
  },
  { 
    value: "post_detail", 
    label: "글 상세 중간", 
    icon: FileText,
    color: "bg-pink-500",
    description: "게시물 상세 페이지 본문 중간에 표시",
    recommendedSize: "600 x 150px",
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
  { value: "🏪", label: "🏪 가게" },
  { value: "📱", label: "📱 스마트폰" },
  { value: "🎁", label: "🎁 선물" },
  { value: "🔔", label: "🔔 알림" },
  { value: "⭐", label: "⭐ 별" },
  { value: "📢", label: "📢 메가폰" },
  { value: "🚀", label: "🚀 로켓" },
  { value: "💰", label: "💰 돈" },
  { value: "🛒", label: "🛒 장바구니" },
  { value: "❤️", label: "❤️ 하트" },
];

// 서브배너 위치
const SUB_BANNER_POSITIONS = [
  { value: 1, label: "서브배너 1", desc: "공동구매 섹션 아래", color: "bg-blue-500" },
  { value: 2, label: "서브배너 2", desc: "인기글 섹션 아래", color: "bg-purple-500" },
  { value: 3, label: "서브배너 3", desc: "최하단 (입점배너 대체)", color: "bg-gray-700" },
];

export default function AdsPage() {
  const [activeTab, setActiveTab] = useState("home_banner");
  const [ads, setAds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null); // 수정 중인 ID
  
  // 폼 데이터
  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    description: "",
    image_url: "",
    video_url: "",
    link_url: "",
    icon: "🏪",
    bg_color: "from-gray-900 via-gray-800 to-gray-900",
    ad_type: "image",
    trigger_time: 30,
    start_date: "",
    end_date: "",
    is_pinned: false,
    sort_order: 1,
    // 타겟팅 옵션
    target_type: "all",
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
        .order("sort_order", { ascending: true });
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

    if (activeTab === "sub_banner" && !formData.sort_order) {
      alert("배너 위치를 선택해주세요.");
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
        const bannerData = {
          title: formData.title,
          subtitle: formData.subtitle,
          description: formData.description,
          image_url: imageUrl,
          link_url: formData.link_url,
          icon: formData.icon,
          bg_color: formData.bg_color,
          sort_order: formData.sort_order,
          start_date: formData.start_date || null,
          end_date: formData.end_date || null,
          is_pinned: formData.is_pinned,
          is_active: true,
        };

        if (editingId) {
          // 수정
          const { error } = await supabase.from("sub_banners").update(bannerData).eq("id", editingId);
          if (error) throw error;
        } else {
          // 등록
          const { error } = await supabase.from("sub_banners").insert(bannerData);
          if (error) throw error;
        }
      } else {
        const adData = {
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
          pin_order: formData.sort_order,
          target_type: formData.target_type,
          target_categories: formData.target_categories,
          target_pages: formData.target_pages,
          target_post_ids: targetPostIds,
          is_active: true,
        };

        if (editingId) {
          // 수정
          const { error } = await supabase.from("ads").update(adData).eq("id", editingId);
          if (error) throw error;
        } else {
          // 등록
          const { error } = await supabase.from("ads").insert(adData);
          if (error) throw error;
        }
      }

      alert(editingId ? "광고가 수정되었습니다." : "광고가 등록되었습니다.");
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
      subtitle: "",
      description: "",
      image_url: "",
      video_url: "",
      link_url: "",
      icon: "🏪",
      bg_color: "from-gray-900 via-gray-800 to-gray-900",
      ad_type: "image",
      trigger_time: 30,
      start_date: "",
      end_date: "",
      is_pinned: false,
      sort_order: 1,
      target_type: "all",
      target_categories: [],
      target_pages: [],
      target_post_ids: "",
    });
    setImageFile(null);
    setVideoFile(null);
    setEditingId(null);
  };

  // 수정 모드 열기
  const handleEdit = (ad: any) => {
    setEditingId(ad.id);
    setFormData({
      title: ad.title || "",
      subtitle: ad.subtitle || "",
      description: ad.description || "",
      image_url: ad.image_url || "",
      video_url: ad.video_url || "",
      link_url: ad.link_url || "",
      icon: ad.icon || "🏪",
      bg_color: ad.bg_color || "from-gray-900 via-gray-800 to-gray-900",
      ad_type: ad.ad_type || "image",
      trigger_time: ad.trigger_time || 30,
      start_date: ad.start_date ? ad.start_date.split('T')[0] : "",
      end_date: ad.end_date ? ad.end_date.split('T')[0] : "",
      is_pinned: ad.is_pinned || false,
      sort_order: ad.sort_order || ad.pin_order || 1,
      target_type: ad.target_type || "all",
      target_categories: ad.target_categories || [],
      target_pages: ad.target_pages || [],
      target_post_ids: ad.target_post_ids?.join(", ") || "",
    });
    setDialogOpen(true);
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

  const getSubBannerPosition = (sortOrder: number) => {
    return SUB_BANNER_POSITIONS.find(p => p.value === sortOrder);
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

  // 배경색 옵션
  const bgColorOptions = [
    { value: "from-gray-900 via-gray-800 to-gray-900", label: "다크", preview: "bg-gradient-to-r from-gray-900 to-gray-800" },
    { value: "from-emerald-600 to-teal-600", label: "에메랄드", preview: "bg-gradient-to-r from-emerald-600 to-teal-600" },
    { value: "from-blue-600 to-indigo-600", label: "블루", preview: "bg-gradient-to-r from-blue-600 to-indigo-600" },
    { value: "from-purple-600 to-pink-600", label: "퍼플", preview: "bg-gradient-to-r from-purple-600 to-pink-600" },
    { value: "from-red-600 to-rose-600", label: "레드", preview: "bg-gradient-to-r from-red-600 to-rose-600" },
    { value: "from-amber-500 to-orange-500", label: "오렌지", preview: "bg-gradient-to-r from-amber-500 to-orange-500" },
  ];

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
              {activeTab === "sub_banner" && (
                <p className="text-xs text-purple-600 mt-1 font-medium">
                  💡 서브배너 1, 2, 3 위치를 선택하여 등록하세요
                </p>
              )}
            </div>
          </div>

          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700 h-12 px-6" onClick={() => resetForm()}>
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
                  {currentPosition?.label} {editingId ? "수정" : "등록"}
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

                {/* 서브 배너 전용 옵션 */}
                {activeTab === "sub_banner" && (
                  <>
                    {/* 배너 위치 선택 */}
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-slate-800">
                        배너 위치 <span className="text-red-500">*</span>
                      </Label>
                      <div className="grid grid-cols-3 gap-3">
                        {SUB_BANNER_POSITIONS.map((pos) => (
                          <label
                            key={pos.value}
                            className={`flex flex-col items-center p-3 rounded-xl border-2 cursor-pointer transition-all ${
                              formData.sort_order === pos.value
                                ? "border-purple-500 bg-purple-50"
                                : "border-slate-200 hover:border-slate-300"
                            }`}
                          >
                            <input
                              type="radio"
                              value={pos.value}
                              checked={formData.sort_order === pos.value}
                              onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) })}
                              className="sr-only"
                            />
                            <div className={`w-8 h-8 ${pos.color} rounded-lg flex items-center justify-center text-white font-bold mb-2`}>
                              {pos.value}
                            </div>
                            <span className="font-bold text-sm">{pos.label}</span>
                            <span className="text-xs text-slate-500 text-center">{pos.desc}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-slate-800">부제목 (선택)</Label>
                      <Input
                        value={formData.subtitle}
                        onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                        placeholder="예: 여주 지역 사장님이신가요?"
                        className="h-11"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
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

                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-slate-800">배경색</Label>
                        <select
                          className="w-full h-11 px-4 border border-slate-200 rounded-xl"
                          value={formData.bg_color}
                          onChange={(e) => setFormData({ ...formData, bg_color: e.target.value })}
                        >
                          {bgColorOptions.map((color) => (
                            <option key={color.value} value={color.value}>
                              {color.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* 미리보기 */}
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-slate-800">미리보기</Label>
                      <div className={`bg-gradient-to-br ${formData.bg_color} rounded-xl p-4 relative overflow-hidden`}>
                        <div className="absolute inset-0">
                          <div className="absolute right-0 top-0 w-20 h-20 bg-emerald-500/20 rounded-full blur-2xl"></div>
                        </div>
                        <div className="relative z-10 flex items-center justify-between">
                          <div>
                            {formData.subtitle && <p className="text-gray-400 text-sm">{formData.subtitle}</p>}
                            <p className="text-white font-bold">{formData.title || "광고 제목"}</p>
                          </div>
                          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
                            <span className="text-xl">{formData.icon}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* 이미지 업로드 */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-800">
                    이미지 {activeTab !== "sub_banner" && <span className="text-red-500">*</span>}
                    {activeTab === "sub_banner" && <span className="text-slate-500">(선택 - 없으면 아이콘+텍스트)</span>}
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

                {/* 고정 옵션 (서브배너 제외) */}
                {activeTab !== "sub_banner" && (
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
                  </div>
                )}

                {/* 타겟팅 옵션 (서브배너 제외) */}
                {activeTab !== "sub_banner" && (
                  <div className="space-y-4 p-4 bg-indigo-50 rounded-xl">
                    <div className="flex items-center gap-2">
                      <Target className="w-5 h-5 text-indigo-600" />
                      <p className="font-semibold text-slate-800">🎯 타겟팅 설정</p>
                    </div>
                    
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
                      </div>
                    )}

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
                      </div>
                    )}

                    {formData.target_type === "post" && (
                      <div className="space-y-2 pt-2 border-t border-indigo-200">
                        <Label className="text-sm font-medium">게시물 ID</Label>
                        <Input
                          value={formData.target_post_ids}
                          onChange={(e) => setFormData({ ...formData, target_post_ids: e.target.value })}
                          placeholder="123, 456, 789"
                          className="h-11"
                        />
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
                    {uploading ? "업로드 중..." : editingId ? "수정하기" : "등록하기"}
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
                  {activeTab === "sub_banner" && (
                    <TableHead className="py-4 font-semibold">위치</TableHead>
                  )}
                  {activeTab !== "sub_banner" && (
                    <TableHead className="py-4 font-semibold">타겟</TableHead>
                  )}
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
                          <div className={`flex items-center gap-2 bg-gradient-to-r ${ad.bg_color || 'from-gray-800 to-gray-900'} px-3 py-2 rounded-lg w-fit`}>
                            <span className="text-lg">{ad.icon}</span>
                            <span className="text-xs font-medium text-white">{ad.title}</span>
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
                          {ad.subtitle && (
                            <p className="text-xs text-slate-500">{ad.subtitle}</p>
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
                      {activeTab === "sub_banner" && (
                        <TableCell className="py-4">
                          {(() => {
                            const pos = getSubBannerPosition(ad.sort_order);
                            return pos ? (
                              <Badge className={`${pos.color} text-white`}>
                                {pos.label}
                              </Badge>
                            ) : (
                              <Badge variant="outline">미지정</Badge>
                            );
                          })()}
                        </TableCell>
                      )}
                      {activeTab !== "sub_banner" && (
                        <TableCell className="py-4">
                          <Badge variant="outline" className="text-xs">
                            {getTargetLabel(ad)}
                          </Badge>
                        </TableCell>
                      )}
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
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                            onClick={() => handleEdit(ad)}
                          >
                            <Pencil className="h-5 w-5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDelete(ad.id)}
                          >
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        </div>
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
          {activeTab === "sub_banner" ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <p className="text-sm text-slate-500">위치별 현황</p>
                <div className="flex gap-2 mt-1">
                  {SUB_BANNER_POSITIONS.map(pos => (
                    <span key={pos.value} className={`text-xs px-2 py-1 rounded ${pos.color} text-white`}>
                      {pos.value}: {ads.filter(a => a.sort_order === pos.value).length}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <p className="text-sm text-slate-500">고정 광고</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {ads.filter(a => a.is_pinned).length}개
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
