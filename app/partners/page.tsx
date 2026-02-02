"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { AdminSidebar } from "@/components/ui/admin-sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Edit, Image as ImageIcon, Calendar } from "lucide-react";
import { supabase } from "@/lib/supabase";

const R2_WORKER_URL = "https://yeoju-r2-worker.kkyg9300.workers.dev";

interface Partner {
  id: number;
  name: string;
  image_url: string;
  link_url: string | null;
  width: number | null;
  height: number | null;
  display_order: number;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
}

export default function PartnersAdminPage() {
  const router = useRouter();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  // 폼 상태
  const [name, setName] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [uploading, setUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const [resizing, setResizing] = useState(false);
  const [imageSize, setImageSize] = useState({ width: 200, height: 200 });

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    const { data, error } = await supabase
      .from("partners")
      .select("*")
      .order("display_order", { ascending: true });

    if (!error && data) {
      setPartners(data);
    }
    setLoading(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("10MB 이하 이미지만 업로드 가능합니다");
      return;
    }

    setUploading(true);

    try {
      const ext = file.name.split(".").pop();
      const fileName = `partners/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;

      const response = await fetch(`${R2_WORKER_URL}/${fileName}`, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });

      if (!response.ok) throw new Error("업로드 실패");

      const data = await response.json();
      setImageUrl(data.url);
      
      // 이미지 원본 크기 가져오기
      const img = new Image();
      img.onload = () => {
        setImageSize({ width: img.width, height: img.height });
      };
      img.src = data.url;
    } catch (error) {
      alert("이미지 업로드 실패");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setResizing(true);

    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = imageSize.width;
    const startHeight = imageSize.height;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      
      setImageSize({
        width: Math.max(100, startWidth + deltaX),
        height: Math.max(100, startHeight + deltaY),
      });
    };

    const handleMouseUp = () => {
      setResizing(false);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      alert("제휴사명을 입력해주세요");
      return;
    }

    if (!imageUrl.trim()) {
      alert("이미지를 업로드해주세요");
      return;
    }

    try {
      if (editingId) {
        // 수정
        const { error } = await supabase
          .from("partners")
          .update({
            name: name.trim(),
            image_url: imageUrl,
            link_url: linkUrl.trim() || null,
            width: imageSize.width,
            height: imageSize.height,
            start_date: startDate || null,
            end_date: endDate || null,
          })
          .eq("id", editingId);

        if (error) throw error;
        alert("수정되었습니다");
      } else {
        // 신규 등록
        const maxOrder = partners.length > 0 
          ? Math.max(...partners.map(p => p.display_order)) 
          : 0;

        const { error } = await supabase
          .from("partners")
          .insert({
            name: name.trim(),
            image_url: imageUrl,
            link_url: linkUrl.trim() || null,
            width: imageSize.width,
            height: imageSize.height,
            display_order: maxOrder + 1,
            start_date: startDate || null,
            end_date: endDate || null,
          });

        if (error) throw error;
        alert("등록되었습니다");
      }

      resetForm();
      fetchPartners();
    } catch (error: any) {
      alert("저장 실패: " + error.message);
    }
  };

  const handleEdit = (partner: Partner) => {
    setEditingId(partner.id);
    setName(partner.name);
    setImageUrl(partner.image_url);
    setLinkUrl(partner.link_url || "");
    setImageSize({ 
      width: partner.width || 200, 
      height: partner.height || 200 
    });
    setStartDate(partner.start_date ? partner.start_date.split('T')[0] : "");
    setEndDate(partner.end_date ? partner.end_date.split('T')[0] : "");
    setShowAddForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    const { error } = await supabase
      .from("partners")
      .delete()
      .eq("id", id);

    if (!error) {
      alert("삭제되었습니다");
      fetchPartners();
    } else {
      alert("삭제 실패: " + error.message);
    }
  };

  const resetForm = () => {
    setShowAddForm(false);
    setEditingId(null);
    setName("");
    setImageUrl("");
    setLinkUrl("");
    setStartDate("");
    setEndDate("");
    setImageSize({ width: 200, height: 200 });
  };

  const isActive = (partner: Partner) => {
    const now = new Date();
    const start = partner.start_date ? new Date(partner.start_date) : null;
    const end = partner.end_date ? new Date(partner.end_date) : null;

    if (start && now < start) return false;
    if (end && now > end) return false;
    return true;
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <AdminSidebar />

      <main className="flex-1 p-8 max-w-[631px] mx-auto w-full">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">제휴·협력사 관리</h1>
            <p className="text-slate-500 mt-1">배너를 등록하고 관리합니다</p>
          </div>
          <Button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            {showAddForm ? "취소" : "배너 추가"}
          </Button>
        </div>

        {/* 추가/수정 폼 */}
        {showAddForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{editingId ? "배너 수정" : "배너 추가"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>제휴사명 *</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="예: 여주시청"
                  className="mt-2"
                />
              </div>

              <div>
                <Label>배너 이미지 *</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="mt-2 w-full"
                >
                  <ImageIcon className="h-4 w-4 mr-2" />
                  {uploading ? "업로드 중..." : "이미지 선택"}
                </Button>

                {imageUrl && (
                  <div className="mt-4">
                    <p className="text-sm font-semibold mb-2">미리보기 (우측 하단 드래그로 크기 조절)</p>
                    <div 
                      ref={previewRef}
                      className="relative inline-block"
                    >
                      <img
                        src={imageUrl}
                        alt="미리보기"
                        style={{
                          width: imageSize.width,
                          height: imageSize.height,
                          objectFit: "contain",
                          border: "2px solid #e5e7eb",
                          borderRadius: "8px"
                        }}
                      />
                      <div
                        onMouseDown={handleMouseDown}
                        className={`absolute bottom-0 right-0 w-6 h-6 bg-emerald-500 cursor-nwse-resize rounded-tl-lg flex items-center justify-center ${
                          resizing ? "ring-4 ring-emerald-300" : ""
                        }`}
                        style={{
                          boxShadow: "0 2px 8px rgba(0,0,0,0.3)"
                        }}
                      >
                        <div className="w-3 h-3 border-r-2 border-b-2 border-white"></div>
                      </div>
                    </div>
                    <div className="mt-2 text-sm text-slate-600">
                      크기: {imageSize.width}px × {imageSize.height}px
                    </div>
                  </div>
                )}
              </div>

              <div>
                <Label>링크 URL (선택)</Label>
                <Input
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="mt-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    게시 시작일 (선택)
                  </Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="mt-2"
                  />
                  <p className="text-xs text-slate-500 mt-1">미입력 시 즉시 게시</p>
                </div>
                <div>
                  <Label className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    게시 종료일 (선택)
                  </Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="mt-2"
                  />
                  <p className="text-xs text-slate-500 mt-1">미입력 시 무기한</p>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <Button variant="outline" onClick={resetForm}>
                  취소
                </Button>
                <Button onClick={handleSubmit} className="bg-emerald-600 hover:bg-emerald-700">
                  {editingId ? "수정" : "등록"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 파트너 목록 */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : partners.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-slate-500 mb-4">등록된 제휴사가 없습니다</p>
            <Button onClick={() => setShowAddForm(true)}>
              첫 배너 등록하기
            </Button>
          </Card>
        ) : (
          <div className="space-y-3">
            {partners.map((partner) => {
              const active = isActive(partner);
              return (
                <Card key={partner.id} className={`overflow-hidden ${!active ? 'opacity-50' : ''}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      {/* 섬네일 */}
                      <div className="w-24 h-24 flex-shrink-0 bg-slate-100 rounded-lg overflow-hidden relative">
                        <img
                          src={partner.image_url}
                          alt={partner.name}
                          className="w-full h-full object-contain"
                        />
                        {!active && (
                          <div className="absolute top-1 right-1 px-2 py-0.5 bg-red-500 text-white text-xs rounded">
                            비활성
                          </div>
                        )}
                        {active && (
                          <div className="absolute top-1 right-1 px-2 py-0.5 bg-emerald-500 text-white text-xs rounded">
                            활성
                          </div>
                        )}
                      </div>

                      {/* 정보 */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg mb-1">{partner.name}</h3>
                        <div className="text-sm text-slate-600 mb-2">
                          크기: {partner.width}×{partner.height}px
                        </div>
                        {partner.link_url && (
                          <a
                            href={partner.link_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline block truncate mb-2"
                          >
                            🔗 {partner.link_url}
                          </a>
                        )}
                        {(partner.start_date || partner.end_date) && (
                          <div className="text-sm text-slate-500 flex gap-4">
                            {partner.start_date && (
                              <div>시작: {new Date(partner.start_date).toLocaleDateString()}</div>
                            )}
                            {partner.end_date && (
                              <div>종료: {new Date(partner.end_date).toLocaleDateString()}</div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* 버튼 */}
                      <div className="flex gap-2 flex-shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(partner)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          수정
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:bg-red-50"
                          onClick={() => handleDelete(partner.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
