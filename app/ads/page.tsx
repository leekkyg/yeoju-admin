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
import { Plus, Trash2, ExternalLink, Image, Type, Upload, Video, X } from "lucide-react";
import { supabase } from "@/lib/supabase";

const R2_WORKER_URL = "https://yeoju-r2-worker.kkyg9300.workers.dev";

export default function AdsPage() {
  const [activeTab, setActiveTab] = useState<"main" | "sub">("main");
  
  // 메인 배너 상태
  const [ads, setAds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    image_url: "",
    video_url: "",
    link_url: "",
    position: "home_banner",
    ad_type: "image",
    trigger_time: 30,
    start_date: "",
    end_date: "",
  });

  // 서브 배너 상태
  const [subBanners, setSubBanners] = useState<any[]>([]);
  const [subDialogOpen, setSubDialogOpen] = useState(false);
  const [subFormData, setSubFormData] = useState({
    title: "",
    description: "",
    image_url: "",
    link_url: "",
    icon: "smartphone",
    start_date: "",
    end_date: "",
  });

  // 파일 업로드 ref
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);

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

  const positions = [
    { value: "home_banner", label: "홈 배너" },
    { value: "video_mid", label: "영상 중간 광고" },
    { value: "post_mid", label: "게시물 중간 광고" },
    { value: "community_top", label: "커뮤니티 상단" },
    { value: "popup", label: "팝업 광고" },
  ];

  const icons = [
    { value: "smartphone", label: "📱 스마트폰" },
    { value: "gift", label: "🎁 선물" },
    { value: "bell", label: "🔔 알림" },
    { value: "star", label: "⭐ 별" },
    { value: "megaphone", label: "📢 메가폰" },
  ];

  useEffect(() => {
    fetchAds();
    fetchSubBanners();
  }, []);

  const fetchAds = async () => {
    const { data } = await supabase
      .from("ads")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setAds(data);
    setLoading(false);
  };

  const fetchSubBanners = async () => {
    const { data } = await supabase
      .from("sub_banners")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setSubBanners(data);
  };

  const handleSubmit = async () => {
    if (!formData.title) {
      alert("제목은 필수입니다.");
      return;
    }

    // 영상 중간 광고는 이미지 또는 영상 필수
    if (formData.position === "video_mid" && !imageFile && !videoFile && !formData.image_url && !formData.video_url) {
      alert("영상 중간 광고는 이미지 또는 영상이 필수입니다.");
      return;
    }

    setUploading(true);

    try {
      let imageUrl = formData.image_url;
      let videoUrl = formData.video_url;

      // 이미지 파일 업로드
      if (imageFile) {
        imageUrl = await uploadToR2(imageFile, "ads");
      }

      // 영상 파일 업로드
      if (videoFile) {
        videoUrl = await uploadToR2(videoFile, "ads-videos");
      }

      const { error } = await supabase.from("ads").insert({
        title: formData.title,
        image_url: imageUrl,
        video_url: videoUrl,
        link_url: formData.link_url,
        position: formData.position,
        ad_type: formData.ad_type,
        trigger_time: formData.trigger_time,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        is_active: true,
      });

      if (error) {
        alert("등록 실패: " + error.message);
      } else {
        alert("광고가 등록되었습니다.");
        setDialogOpen(false);
        setFormData({
          title: "",
          image_url: "",
          video_url: "",
          link_url: "",
          position: "home_banner",
          ad_type: "image",
          trigger_time: 30,
          start_date: "",
          end_date: "",
        });
        setImageFile(null);
        setVideoFile(null);
        fetchAds();
      }
    } catch (error) {
      console.error(error);
      alert("업로드 중 오류가 발생했습니다.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubSubmit = async () => {
    if (!subFormData.title) {
      alert("제목은 필수입니다.");
      return;
    }

    const { error } = await supabase.from("sub_banners").insert({
      ...subFormData,
      is_active: true,
    });

    if (error) {
      alert("등록 실패: " + error.message);
    } else {
      alert("서브배너가 등록되었습니다.");
      setSubDialogOpen(false);
      setSubFormData({
        title: "",
        description: "",
        image_url: "",
        link_url: "",
        icon: "smartphone",
        start_date: "",
        end_date: "",
      });
      fetchSubBanners();
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    await supabase.from("ads").delete().eq("id", id);
    fetchAds();
  };

  const handleSubDelete = async (id: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    await supabase.from("sub_banners").delete().eq("id", id);
    fetchSubBanners();
  };

  const toggleActive = async (id: number, currentStatus: boolean) => {
    await supabase.from("ads").update({ is_active: !currentStatus }).eq("id", id);
    fetchAds();
  };

  const toggleSubActive = async (id: string, currentStatus: boolean) => {
    await supabase.from("sub_banners").update({ is_active: !currentStatus }).eq("id", id);
    fetchSubBanners();
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("ko-KR");
  };

  const getPositionLabel = (position: string) => {
    return positions.find((p) => p.value === position)?.label || position;
  };

  const getIconLabel = (icon: string) => {
    return icons.find((i) => i.value === icon)?.label || icon;
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <AdminSidebar />

      <main className="flex-1 p-8">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">광고 관리</h1>
          <p className="text-slate-500 mt-1">메인 배너 및 서브 배너 관리</p>
        </div>

        {/* 탭 */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab("main")}
            className={`px-6 py-3 rounded-xl font-semibold transition-all ${
              activeTab === "main"
                ? "bg-emerald-600 text-white shadow-lg"
                : "bg-white text-slate-600 hover:bg-slate-100"
            }`}
          >
            메인 배너
          </button>
          <button
            onClick={() => setActiveTab("sub")}
            className={`px-6 py-3 rounded-xl font-semibold transition-all ${
              activeTab === "sub"
                ? "bg-emerald-600 text-white shadow-lg"
                : "bg-white text-slate-600 hover:bg-slate-100"
            }`}
          >
            서브 배너
          </button>
        </div>

        {/* 메인 배너 탭 */}
        {activeTab === "main" && (
          <>
            <div className="flex justify-between items-center mb-6">
              <div className="bg-blue-50 text-blue-700 px-4 py-3 rounded-xl text-sm">
                <strong>💡 메인 배너 권장 크기:</strong> 1200 x 400px (비율 3:1)
              </div>

              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-emerald-600 hover:bg-emerald-700 h-12 px-6">
                    <Plus className="h-5 w-5 mr-2" />
                    메인 배너 등록
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader className="pb-6 border-b sticky top-0 bg-white z-10">
                    <DialogTitle className="text-2xl font-bold">새 메인 배너 등록</DialogTitle>
                  </DialogHeader>

                  <div className="space-y-5 py-4">
                    {/* 제목 */}
                    <div className="space-y-2">
                      <Label className="text-base font-semibold text-slate-800">
                        광고 제목 <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="예: 여주마켓 신규 오픈 이벤트"
                        className="h-11 text-sm px-4"
                      />
                    </div>

                    {/* 이미지 URL */}
                    <div className="space-y-2">
                      <Label className="text-base font-semibold text-slate-800">
                        이미지
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
                        className="h-11 text-sm px-4"
                      />
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                        <p className="text-amber-800 font-medium text-sm">💡 메인 배너 권장: 1200 x 400px</p>
                        <p className="text-amber-700 text-xs mt-1">영상 중간 광고 권장: 600 x 400px</p>
                      </div>
                    </div>

                    {/* 영상 파일 (영상 중간 광고용) */}
                    {formData.position === "video_mid" && (
                      <div className="space-y-2">
                        <Label className="text-base font-semibold text-slate-800">
                          영상 광고 <span className="text-slate-400 font-normal">(선택)</span>
                        </Label>
                        <input
                          ref={videoInputRef}
                          type="file"
                          accept="video/*"
                          className="hidden"
                          onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                        />
                        <div
                          onClick={() => videoInputRef.current?.click()}
                          className="border-2 border-dashed rounded-xl p-4 text-center cursor-pointer hover:border-emerald-500 transition-colors"
                        >
                          {videoFile ? (
                            <div className="flex items-center justify-center gap-2">
                              <Video className="h-5 w-5 text-emerald-600" />
                              <span className="text-emerald-600 font-medium">{videoFile.name}</span>
                              <button onClick={(e) => { e.stopPropagation(); setVideoFile(null); }}>
                                <X className="h-4 w-4 text-slate-400" />
                              </button>
                            </div>
                          ) : (
                            <div>
                              <Video className="h-6 w-6 mx-auto text-slate-400 mb-1" />
                              <p className="text-slate-500 text-sm">클릭하여 영상 선택</p>
                              <p className="text-slate-400 text-xs">MP4, MOV (최대 30초 권장)</p>
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-slate-500">또는 URL 직접 입력:</p>
                        <Input
                          value={formData.video_url}
                          onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                          placeholder="https://example.com/ad-video.mp4"
                          className="h-11 text-sm px-4"
                        />
                        <div className="bg-purple-50 border border-purple-200 rounded-xl p-3">
                          <p className="text-purple-800 font-medium text-sm">🎬 영상 광고 사용 시</p>
                          <p className="text-purple-700 text-xs mt-1">이미지 대신 영상이 재생됩니다 (5~15초 권장)</p>
                        </div>
                      </div>
                    )}

                    {/* 링크 URL */}
                    <div className="space-y-2">
                      <Label className="text-base font-semibold text-slate-800">링크 URL</Label>
                      <Input
                        value={formData.link_url}
                        onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                        placeholder="https://example.com/event"
                        className="h-11 text-sm px-4"
                      />
                      <p className="text-slate-500">배너 클릭 시 이동할 페이지 주소</p>
                    </div>

                    {/* 광고 위치 */}
                    <div className="space-y-2">
                      <Label className="text-base font-semibold text-slate-800">광고 위치</Label>
                      <select
                        className="w-full h-11 px-4 text-base border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                        value={formData.position}
                        onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                      >
                        {positions.map((pos) => (
                          <option key={pos.value} value={pos.value}>
                            {pos.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* 영상 중간 광고 옵션 */}
                    {formData.position === "video_mid" && (
                      <div className="space-y-4 p-4 bg-slate-50 rounded-xl">
                        <p className="font-semibold text-slate-800">🎬 영상 중간 광고 설정</p>
                        
                        {/* 광고 타입 */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-slate-700">광고 타입</Label>
                          <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name="ad_type"
                                value="image"
                                checked={formData.ad_type === "image"}
                                onChange={(e) => setFormData({ ...formData, ad_type: e.target.value })}
                                className="w-4 h-4 text-emerald-600"
                              />
                              <span className="text-slate-700">이미지 광고</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name="ad_type"
                                value="video"
                                checked={formData.ad_type === "video"}
                                onChange={(e) => setFormData({ ...formData, ad_type: e.target.value })}
                                className="w-4 h-4 text-emerald-600"
                              />
                              <span className="text-slate-700">영상 광고</span>
                            </label>
                          </div>
                        </div>

                        {/* 광고 시작 시점 */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-slate-700">광고 시작 시점 (초)</Label>
                          <Input
                            type="number"
                            min="5"
                            max="300"
                            value={formData.trigger_time}
                            onChange={(e) => setFormData({ ...formData, trigger_time: parseInt(e.target.value) || 30 })}
                            placeholder="30"
                            className="h-11 text-sm px-4 w-32"
                          />
                          <p className="text-xs text-slate-500">
                            영상 재생 후 몇 초 뒤에 광고가 나올지 설정 (기본 30초)
                          </p>
                        </div>

                        {/* 권장 사이즈 안내 */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                          <p className="font-medium text-blue-800 mb-2">📐 영상 중간 광고 권장 사이즈</p>
                          <ul className="text-blue-700 space-y-1 text-xs">
                            <li>• <strong>이미지 광고:</strong> 600 x 400px (중앙 표시)</li>
                            <li>• <strong>영상 광고:</strong> 640 x 360px, 5~15초 권장</li>
                          </ul>
                        </div>
                      </div>
                    )}

                    {/* 게시물 중간 광고 옵션 */}
                    {formData.position === "post_mid" && (
                      <div className="space-y-3 p-4 bg-orange-50 rounded-xl">
                        <p className="font-semibold text-slate-800">📝 게시물 중간 광고 설정</p>
                        <div className="bg-white border border-orange-200 rounded-lg p-3 text-sm">
                          <p className="font-medium text-orange-800 mb-2">📐 권장 사이즈</p>
                          <ul className="text-orange-700 space-y-1 text-xs">
                            <li>• <strong>가로형:</strong> 600 x 100px (띠 배너)</li>
                            <li>• <strong>정사각형:</strong> 300 x 250px (박스 배너)</li>
                            <li>• <strong>넓은형:</strong> 600 x 200px</li>
                          </ul>
                          <p className="text-orange-600 text-xs mt-2">
                            게시물 본문 중간에 자동 삽입됩니다
                          </p>
                        </div>
                      </div>
                    )}

                    {/* 기간 */}
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-base font-semibold text-slate-800">시작일</Label>
                        <Input
                          type="date"
                          value={formData.start_date}
                          onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                          className="h-11 text-sm px-4"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-base font-semibold text-slate-800">종료일</Label>
                        <Input
                          type="date"
                          value={formData.end_date}
                          onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                          className="h-11 text-sm px-4"
                        />
                      </div>
                    </div>

                    {/* 버튼 */}
                    <div className="flex justify-end gap-4 pt-6 border-t sticky bottom-0 bg-white pb-2">
                      <Button
                        variant="outline"
                        onClick={() => setDialogOpen(false)}
                        disabled={uploading}
                        className="px-8 h-12 text-base"
                      >
                        취소
                      </Button>
                      <Button
                        onClick={handleSubmit}
                        disabled={uploading}
                        className="bg-emerald-600 hover:bg-emerald-700 px-8 h-12 text-base"
                      >
                        {uploading ? "업로드 중..." : "등록하기"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* 메인 배너 테이블 */}
            <Card className="border-0 shadow-lg rounded-2xl overflow-hidden">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-100">
                      <TableHead className="w-16 py-4 font-semibold">ID</TableHead>
                      <TableHead className="py-4 font-semibold">광고명</TableHead>
                      <TableHead className="py-4 font-semibold">타입</TableHead>
                      <TableHead className="py-4 font-semibold">위치</TableHead>
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
                          <TableCell className="font-medium py-4">{ad.id}</TableCell>
                          <TableCell className="py-4">
                            <div className="flex items-center gap-4">
                              {ad.image_url && (
                                <img
                                  src={ad.image_url}
                                  alt=""
                                  className="w-24 h-16 object-cover rounded-lg border"
                                />
                              )}
                              {ad.video_url && !ad.image_url && (
                                <div className="w-24 h-16 bg-slate-200 rounded-lg flex items-center justify-center">
                                  <Video className="w-8 h-8 text-slate-400" />
                                </div>
                              )}
                              <div>
                                <p className="font-semibold text-slate-800">{ad.title}</p>
                                {ad.link_url && (
                                  <a 
                                    href={ad.link_url} 
                                    target="_blank" 
                                    className="text-sm text-blue-500 flex items-center gap-1 hover:underline"
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                    링크 열기
                                  </a>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            {ad.video_url ? (
                              <Badge className="bg-purple-500 px-3 py-1">
                                <Video className="w-3 h-3 mr-1" />
                                영상
                              </Badge>
                            ) : (
                              <Badge className="bg-blue-500 px-3 py-1">
                                <Image className="w-3 h-3 mr-1" />
                                이미지
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="py-4">
                            <Badge variant="secondary" className="px-3 py-1">
                              {getPositionLabel(ad.position)}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-4 text-slate-600">
                            {formatDate(ad.start_date)} ~ {formatDate(ad.end_date)}
                          </TableCell>
                          <TableCell className="py-4">
                            <Badge
                              className={`cursor-pointer px-4 py-1 ${
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
          </>
        )}

        {/* 서브 배너 탭 */}
        {activeTab === "sub" && (
          <>
            <div className="flex justify-between items-center mb-6">
              <div className="bg-purple-50 text-purple-700 px-4 py-3 rounded-xl text-sm">
                <strong>💡 서브 배너:</strong> 이미지(600x64px) 또는 아이콘+텍스트 선택 가능
              </div>

              <Dialog open={subDialogOpen} onOpenChange={setSubDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-emerald-600 hover:bg-emerald-700 h-12 px-6">
                    <Plus className="h-5 w-5 mr-2" />
                    서브 배너 등록
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader className="pb-6 border-b sticky top-0 bg-white z-10">
                    <DialogTitle className="text-2xl font-bold">새 서브 배너 등록</DialogTitle>
                  </DialogHeader>

                  <div className="space-y-5 py-4">
                    {/* 제목 */}
                    <div className="space-y-2">
                      <Label className="text-base font-semibold text-slate-800">
                        제목 <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        value={subFormData.title}
                        onChange={(e) => setSubFormData({ ...subFormData, title: e.target.value })}
                        placeholder="예: 여주마켓 앱 출시!"
                        className="h-11 text-sm px-4"
                      />
                    </div>

                    {/* 설명 */}
                    <div className="space-y-2">
                      <Label className="text-base font-semibold text-slate-800">설명</Label>
                      <Input
                        value={subFormData.description}
                        onChange={(e) => setSubFormData({ ...subFormData, description: e.target.value })}
                        placeholder="예: 앱에서 더 편하게 이용하세요"
                        className="h-11 text-sm px-4"
                      />
                      <p className="text-slate-500">이미지가 없을 때 아이콘과 함께 표시됩니다</p>
                    </div>

                    {/* 아이콘 선택 */}
                    <div className="space-y-2">
                      <Label className="text-base font-semibold text-slate-800">아이콘</Label>
                      <select
                        className="w-full h-11 px-4 text-base border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                        value={subFormData.icon}
                        onChange={(e) => setSubFormData({ ...subFormData, icon: e.target.value })}
                      >
                        {icons.map((icon) => (
                          <option key={icon.value} value={icon.value}>
                            {icon.label}
                          </option>
                        ))}
                      </select>
                      <p className="text-slate-500">이미지가 없을 때 표시될 아이콘</p>
                    </div>

                    {/* 이미지 URL (선택) */}
                    <div className="space-y-2">
                      <Label className="text-base font-semibold text-slate-800">
                        이미지 URL <span className="text-slate-400 font-normal">(선택)</span>
                      </Label>
                      <Input
                        value={subFormData.image_url}
                        onChange={(e) => setSubFormData({ ...subFormData, image_url: e.target.value })}
                        placeholder="https://example.com/sub-banner.jpg"
                        className="h-11 text-sm px-4"
                      />
                      <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                        <p className="text-purple-800 font-medium flex items-center gap-2">
                          <Image className="w-5 h-5" />
                          이미지 배너 사용 시
                        </p>
                        <p className="text-purple-700 mt-1">
                          <strong>권장 크기: 600 x 64px</strong> (가로형 띠 배너)
                        </p>
                        <p className="text-purple-600 text-sm mt-2">
                          이미지 URL을 입력하면 아이콘+텍스트 대신 이미지가 표시됩니다
                        </p>
                      </div>
                    </div>

                    {/* 링크 URL */}
                    <div className="space-y-2">
                      <Label className="text-base font-semibold text-slate-800">링크 URL</Label>
                      <Input
                        value={subFormData.link_url}
                        onChange={(e) => setSubFormData({ ...subFormData, link_url: e.target.value })}
                        placeholder="https://example.com/download"
                        className="h-11 text-sm px-4"
                      />
                      <p className="text-slate-500">배너 클릭 시 이동할 페이지 주소</p>
                    </div>

                    {/* 기간 */}
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-base font-semibold text-slate-800">시작일</Label>
                        <Input
                          type="date"
                          value={subFormData.start_date}
                          onChange={(e) => setSubFormData({ ...subFormData, start_date: e.target.value })}
                          className="h-11 text-sm px-4"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-base font-semibold text-slate-800">종료일</Label>
                        <Input
                          type="date"
                          value={subFormData.end_date}
                          onChange={(e) => setSubFormData({ ...subFormData, end_date: e.target.value })}
                          className="h-11 text-sm px-4"
                        />
                      </div>
                    </div>
                    <p className="text-slate-500 text-sm -mt-4">비워두면 기간 제한 없이 항상 표시됩니다</p>

                    {/* 버튼 */}
                    <div className="flex justify-end gap-4 pt-6 border-t sticky bottom-0 bg-white pb-2">
                      <Button
                        variant="outline"
                        onClick={() => setSubDialogOpen(false)}
                        className="px-8 h-12 text-base"
                      >
                        취소
                      </Button>
                      <Button
                        onClick={handleSubSubmit}
                        className="bg-emerald-600 hover:bg-emerald-700 px-8 h-12 text-base"
                      >
                        등록하기
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* 서브 배너 테이블 */}
            <Card className="border-0 shadow-lg rounded-2xl overflow-hidden">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-100">
                      <TableHead className="py-4 font-semibold">타입</TableHead>
                      <TableHead className="py-4 font-semibold">내용</TableHead>
                      <TableHead className="py-4 font-semibold">기간</TableHead>
                      <TableHead className="py-4 font-semibold">링크</TableHead>
                      <TableHead className="py-4 font-semibold">상태</TableHead>
                      <TableHead className="text-right py-4 font-semibold">관리</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subBanners.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-12 text-slate-500">
                          등록된 서브 배너가 없습니다
                        </TableCell>
                      </TableRow>
                    ) : (
                      subBanners.map((banner) => (
                        <TableRow key={banner.id} className="hover:bg-slate-50">
                          <TableCell className="py-4">
                            {banner.image_url ? (
                              <Badge className="bg-blue-500 px-3 py-1">
                                <Image className="w-3 h-3 mr-1" />
                                이미지
                              </Badge>
                            ) : (
                              <Badge className="bg-purple-500 px-3 py-1">
                                <Type className="w-3 h-3 mr-1" />
                                텍스트
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="flex items-center gap-4">
                              {banner.image_url ? (
                                <img
                                  src={banner.image_url}
                                  alt=""
                                  className="w-32 h-12 object-cover rounded-lg border"
                                />
                              ) : (
                                <div className="flex items-center gap-3 bg-emerald-50 px-4 py-2 rounded-lg">
                                  <span className="text-lg">{getIconLabel(banner.icon).split(" ")[0]}</span>
                                  <div>
                                    <p className="font-semibold text-slate-800 text-sm">{banner.title}</p>
                                    <p className="text-slate-500 text-xs">{banner.description}</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="py-4 text-slate-600">
                            {formatDate(banner.start_date)} ~ {formatDate(banner.end_date)}
                          </TableCell>
                          <TableCell className="py-4">
                            {banner.link_url ? (
                              <a
                                href={banner.link_url}
                                target="_blank"
                                className="text-blue-500 flex items-center gap-1 hover:underline text-sm"
                              >
                                <ExternalLink className="h-3 w-3" />
                                링크 열기
                              </a>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </TableCell>
                          <TableCell className="py-4">
                            <Badge
                              className={`cursor-pointer px-4 py-1 ${
                                banner.is_active
                                  ? "bg-emerald-500 hover:bg-emerald-600"
                                  : "bg-slate-400 hover:bg-slate-500"
                              }`}
                              onClick={() => toggleSubActive(banner.id, banner.is_active)}
                            >
                              {banner.is_active ? "활성" : "비활성"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right py-4">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleSubDelete(banner.id)}
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
          </>
        )}
      </main>
    </div>
  );
}
