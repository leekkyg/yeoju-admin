"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AdminSidebar } from "@/components/ui/admin-sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save, ImagePlus, X, Star, Maximize2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { use } from "react";

const R2_WORKER_URL = "https://yeoju-r2-worker.kkyg9300.workers.dev";

interface ImageData {
  url: string;
  width: number;
  height: number;
}

export default function EditPartnerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  
  const [logo, setLogo] = useState<ImageData | null>(null);
  const [banner, setBanner] = useState<ImageData | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // 드래그 중인 이미지 타입
  const [resizing, setResizing] = useState<'logo' | 'banner' | null>(null);
  const [startSize, setStartSize] = useState({ width: 0, height: 0 });
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });

  // 파트너 정보 로드
  useEffect(() => {
    const fetchPartner = async () => {
      const { data, error } = await supabase
        .from("partners")
        .select("*")
        .eq("id", parseInt(id))
        .single();

      if (error) {
        alert("파트너 정보를 불러올 수 없습니다");
        router.back();
        return;
      }

      setName(data.name || "");
      setCategory(data.category || "");
      setDescription(data.description || "");
      setContactName(data.contact_name || "");
      setContactPhone(data.contact_phone || "");
      setContactEmail(data.contact_email || "");
      setWebsite(data.website || "");
      setIsFeatured(data.is_featured || false);
      
      if (data.logo_url) {
        setLogo({
          url: data.logo_url,
          width: data.logo_width || 200,
          height: data.logo_height || 200
        });
      }
      
      if (data.banner_url) {
        setBanner({
          url: data.banner_url,
          width: data.banner_width || 600,
          height: data.banner_height || 300
        });
      }
      
      setLoading(false);
    };

    fetchPartner();
  }, [id, router]);

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'logo' | 'banner'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("10MB 이하만 업로드 가능합니다");
      return;
    }

    setUploading(true);
    
    try {
      const ext = file.name.split('.').pop();
      const fileName = `partners/${type}/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
      
      const response = await fetch(`${R2_WORKER_URL}/${fileName}`, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      });
      
      const data = await response.json();
      
      // 기본 크기 설정
      const defaultWidth = type === 'logo' ? 200 : 600;
      const defaultHeight = type === 'logo' ? 200 : 300;
      
      if (type === 'logo') {
        setLogo({ url: data.url, width: defaultWidth, height: defaultHeight });
      } else {
        setBanner({ url: data.url, width: defaultWidth, height: defaultHeight });
      }
    } catch (error) {
      console.error("이미지 업로드 실패:", error);
      alert("이미지 업로드에 실패했습니다");
    }
    
    setUploading(false);
  };

  const handleResizeStart = (
    e: React.MouseEvent,
    type: 'logo' | 'banner'
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setResizing(type);
    setStartPos({ x: e.clientX, y: e.clientY });
    
    const img = type === 'logo' ? logo : banner;
    if (img) {
      setStartSize({ width: img.width, height: img.height });
    }
  };

  const handleResizeMove = (e: MouseEvent) => {
    if (!resizing) return;
    
    const deltaX = e.clientX - startPos.x;
    const deltaY = e.clientY - startPos.y;
    
    const newWidth = Math.max(100, startSize.width + deltaX);
    const newHeight = Math.max(100, startSize.height + deltaY);
    
    if (resizing === 'logo') {
      setLogo(prev => prev ? { ...prev, width: newWidth, height: newHeight } : null);
    } else {
      setBanner(prev => prev ? { ...prev, width: newWidth, height: newHeight } : null);
    }
  };

  const handleResizeEnd = () => {
    setResizing(null);
  };

  // 마우스 이벤트 리스너 설정
  useEffect(() => {
    if (resizing) {
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeEnd);
      return () => {
        document.removeEventListener('mousemove', handleResizeMove);
        document.removeEventListener('mouseup', handleResizeEnd);
      };
    }
  }, [resizing, startPos, startSize]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      alert("파트너명을 입력해주세요");
      return;
    }
    if (!category.trim()) {
      alert("카테고리를 입력해주세요");
      return;
    }
    if (!contactName.trim() || !contactPhone.trim()) {
      alert("담당자 정보를 입력해주세요");
      return;
    }

    setSaving(true);

    const { error } = await supabase
      .from("partners")
      .update({
        name: name.trim(),
        category: category.trim(),
        description: description.trim(),
        logo_url: logo?.url || null,
        logo_width: logo?.width || null,
        logo_height: logo?.height || null,
        banner_url: banner?.url || null,
        banner_width: banner?.width || null,
        banner_height: banner?.height || null,
        contact_name: contactName.trim(),
        contact_phone: contactPhone.trim(),
        contact_email: contactEmail.trim(),
        website: website.trim() || null,
        is_featured: isFeatured,
      })
      .eq("id", parseInt(id));

    if (error) {
      alert("저장 실패: " + error.message);
      setSaving(false);
      return;
    }

    alert("파트너 정보가 수정되었습니다!");
    router.push("/partners");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <AdminSidebar />
        <main className="flex-1 p-8 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <AdminSidebar />

      <main className="flex-1 p-8 max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">파트너 수정</h1>
            <p className="text-slate-500 mt-1">파트너 정보를 수정합니다</p>
          </div>
        </div>

        <div className="max-w-3xl space-y-6">
          {/* 기본 정보 */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>기본 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 추천 파트너 여부 */}
              <div 
                className={`flex items-center gap-3 p-4 rounded-lg cursor-pointer transition-all ${
                  isFeatured ? "bg-yellow-50 border-2 border-yellow-500" : "bg-slate-50 border-2 border-transparent hover:border-slate-200"
                }`}
                onClick={() => setIsFeatured(!isFeatured)}
              >
                <div className={`p-2 rounded-lg transition-colors ${isFeatured ? "bg-yellow-500 text-white" : "bg-slate-200 text-slate-500"}`}>
                  <Star className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-slate-900">추천 파트너</p>
                  <p className="text-sm text-slate-500">메인에 우선 표시됩니다</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">파트너명</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="파트너명"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="category">카테고리</Label>
                  <Input
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="예: 식당, 카페, 쇼핑"
                    className="mt-2"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">설명</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="파트너 소개"
                  className="mt-2 min-h-[100px]"
                />
              </div>
            </CardContent>
          </Card>

          {/* 연락처 정보 */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>연락처 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contactName">담당자명</Label>
                  <Input
                    id="contactName"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="담당자명"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="contactPhone">연락처</Label>
                  <Input
                    id="contactPhone"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="010-1234-5678"
                    className="mt-2"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="contactEmail">이메일</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="website">웹사이트 (선택)</Label>
                <Input
                  id="website"
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://example.com"
                  className="mt-2"
                />
              </div>
            </CardContent>
          </Card>

          {/* 이미지 */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>이미지</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 로고 */}
              <div>
                <Label>로고 이미지</Label>
                <p className="text-sm text-slate-500 mb-2">정사각형 이미지 권장 (최대 10MB)</p>
                
                <input
                  type="file"
                  ref={logoInputRef}
                  onChange={(e) => handleImageUpload(e, 'logo')}
                  accept="image/*"
                  className="hidden"
                />
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => logoInputRef.current?.click()}
                  disabled={uploading}
                  className="mb-4"
                >
                  <ImagePlus className="h-4 w-4 mr-2" />
                  {uploading ? "업로드 중..." : logo ? "로고 변경" : "로고 업로드"}
                </Button>

                {logo && (
                  <div className="relative inline-block group">
                    <img
                      src={logo.url}
                      alt="Logo"
                      style={{ width: logo.width, height: logo.height }}
                      className="rounded-lg object-cover border-2 border-slate-200"
                    />
                    {/* 크기 조절 핸들 */}
                    <div
                      className="absolute bottom-0 right-0 w-6 h-6 bg-emerald-500 cursor-se-resize rounded-tl-lg flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      onMouseDown={(e) => handleResizeStart(e, 'logo')}
                      title="드래그하여 크기 조절"
                    >
                      <Maximize2 className="h-4 w-4" />
                    </div>
                    {/* 삭제 버튼 */}
                    <button
                      type="button"
                      onClick={() => setLogo(null)}
                      className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center shadow-lg hover:bg-red-600"
                    >
                      <X className="h-5 w-5" />
                    </button>
                    {/* 크기 정보 */}
                    <div className="absolute bottom-2 left-2 px-3 py-1 bg-black/70 text-white text-xs rounded-lg font-mono">
                      {logo.width} × {logo.height}px
                    </div>
                  </div>
                )}
              </div>

              {/* 배너 */}
              <div>
                <Label>배너 이미지</Label>
                <p className="text-sm text-slate-500 mb-2">가로형 이미지 권장 (최대 10MB)</p>
                
                <input
                  type="file"
                  ref={bannerInputRef}
                  onChange={(e) => handleImageUpload(e, 'banner')}
                  accept="image/*"
                  className="hidden"
                />
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => bannerInputRef.current?.click()}
                  disabled={uploading}
                  className="mb-4"
                >
                  <ImagePlus className="h-4 w-4 mr-2" />
                  {uploading ? "업로드 중..." : banner ? "배너 변경" : "배너 업로드"}
                </Button>

                {banner && (
                  <div className="relative inline-block group">
                    <img
                      src={banner.url}
                      alt="Banner"
                      style={{ width: banner.width, height: banner.height }}
                      className="rounded-lg object-cover border-2 border-slate-200"
                    />
                    {/* 크기 조절 핸들 */}
                    <div
                      className="absolute bottom-0 right-0 w-6 h-6 bg-emerald-500 cursor-se-resize rounded-tl-lg flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      onMouseDown={(e) => handleResizeStart(e, 'banner')}
                      title="드래그하여 크기 조절"
                    >
                      <Maximize2 className="h-4 w-4" />
                    </div>
                    {/* 삭제 버튼 */}
                    <button
                      type="button"
                      onClick={() => setBanner(null)}
                      className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center shadow-lg hover:bg-red-600"
                    >
                      <X className="h-5 w-5" />
                    </button>
                    {/* 크기 정보 */}
                    <div className="absolute bottom-2 left-2 px-3 py-1 bg-black/70 text-white text-xs rounded-lg font-mono">
                      {banner.width} × {banner.height}px
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 저장 버튼 */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => router.back()}>
              취소
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={saving || !name.trim() || !category.trim()}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? "저장 중..." : "저장하기"}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
