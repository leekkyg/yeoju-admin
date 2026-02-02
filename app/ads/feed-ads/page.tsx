"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { AdminSidebar } from "@/components/ui/admin-sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Edit, Image as ImageIcon, Calendar, ArrowLeft } from "lucide-react";
import { supabase } from "@/lib/supabase";

const R2_WORKER_URL = "https://yeoju-r2-worker.kkyg9300.workers.dev";

interface Ad {
  id: number;
  title: string;
  image_url: string;
  target_url: string | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
}

export default function FeedAdsPage() {
  const router = useRouter();
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [title, setTitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchAds();
  }, []);

  const fetchAds = async () => {
    const { data, error } = await supabase
      .from("ads")
      .select("*")
      .eq("ad_type", "feed_ad")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setAds(data);
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
      const fileName = `ads/feed/${Date.now()}_${file.name}`;

      const response = await fetch(`${R2_WORKER_URL}/${fileName}`, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });

      if (!response.ok) throw new Error("업로드 실패");

      const data = await response.json();
      setImageUrl(data.url);
      alert("이미지 업로드 완료!");
    } catch (error) {
      alert("이미지 업로드 실패");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      alert("광고명을 입력해주세요");
      return;
    }

    if (!imageUrl.trim()) {
      alert("이미지를 업로드해주세요");
      return;
    }

    try {
      if (editingId) {
        const { error } = await supabase
          .from("ads")
          .update({
            title: title.trim(),
            image_url: imageUrl,
            target_url: targetUrl.trim() || null,
            start_date: startDate || null,
            end_date: endDate || null,
          })
          .eq("id", editingId);

        if (error) throw error;
        alert("수정되었습니다!");
      } else {
        const { error } = await supabase.from("ads").insert({
          title: title.trim(),
          image_url: imageUrl,
          target_url: targetUrl.trim() || null,
          ad_type: "feed_ad",
          start_date: startDate || null,
          end_date: endDate || null,
        });

        if (error) throw error;
        alert("등록되었습니다!");
      }

      resetForm();
      fetchAds();
    } catch (error: any) {
      alert("저장 실패: " + error.message);
    }
  };

  const handleEdit = (ad: Ad) => {
    setEditingId(ad.id);
    setTitle(ad.title);
    setImageUrl(ad.image_url);
    setTargetUrl(ad.target_url || "");
    setStartDate(ad.start_date ? ad.start_date.split("T")[0] : "");
    setEndDate(ad.end_date ? ad.end_date.split("T")[0] : "");
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    const { error } = await supabase.from("ads").delete().eq("id", id);

    if (!error) {
      alert("삭제되었습니다!");
      fetchAds();
    } else {
      alert("삭제 실패: " + error.message);
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setTitle("");
    setImageUrl("");
    setTargetUrl("");
    setStartDate("");
    setEndDate("");
  };

  const isActive = (ad: Ad) => {
    const now = new Date();
    const start = ad.start_date ? new Date(ad.start_date) : null;
    const end = ad.end_date ? new Date(ad.end_date) : null;

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
            <div className="flex items-center gap-3 mb-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/ads")}
                className="p-0 h-auto hover:bg-transparent"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-3xl font-bold text-slate-900">피드 광고 관리</h1>
            </div>
            <p className="text-slate-500">게시물 목록 중간에 표시되는 광고 (3행마다 1개)</p>
          </div>
          <Button
            onClick={() => setShowForm(!showForm)}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            {showForm ? "취소" : "광고 추가"}
          </Button>
        </div>

        {showForm && (
          <Card className="mb-6">
            <CardContent className="p-6 space-y-4">
              <h3 className="text-lg font-bold">{editingId ? "광고 수정" : "광고 추가"}</h3>

              <div>
                <Label>광고명 *</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="예: 여주 맛집 광고"
                  className="mt-2"
                />
              </div>

              <div>
                <Label>광고 이미지 * (권장: 600 x 150px)</Label>
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
                    <img
                      src={imageUrl}
                      alt="미리보기"
                      className="max-w-full border-2 border-slate-200 rounded"
                    />
                  </div>
                )}
              </div>

              <div>
                <Label>클릭 시 이동 URL (선택)</Label>
                <Input
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
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
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <Button variant="outline" onClick={resetForm}>
                  취소
                </Button>
                <Button
                  onClick={handleSubmit}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {editingId ? "수정" : "등록"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : ads.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-slate-500 mb-4">등록된 광고가 없습니다</p>
            <Button onClick={() => setShowForm(true)}>첫 광고 등록하기</Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ads.map((ad) => {
              const active = isActive(ad);

              return (
                <Card key={ad.id} className={!active ? "opacity-50" : ""}>
                  <div className="aspect-[4/1] bg-slate-100 relative">
                    <img
                      src={ad.image_url}
                      alt={ad.title}
                      className="w-full h-full object-cover"
                    />
                    <div
                      className={`absolute top-2 right-2 px-2 py-1 text-white text-xs rounded ${
                        active ? "bg-emerald-500" : "bg-red-500"
                      }`}
                    >
                      {active ? "활성" : "비활성"}
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-bold mb-1">{ad.title}</h3>
                    {ad.target_url && (
                      <a
                        href={ad.target_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline block truncate mb-2"
                      >
                        {ad.target_url}
                      </a>
                    )}
                    {(ad.start_date || ad.end_date) && (
                      <div className="text-xs text-slate-500 mb-3 space-y-0.5">
                        {ad.start_date && (
                          <div>
                            시작: {new Date(ad.start_date).toLocaleDateString()}
                          </div>
                        )}
                        {ad.end_date && (
                          <div>종료: {new Date(ad.end_date).toLocaleDateString()}</div>
                        )}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(ad)}
                        className="flex-1"
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        수정
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:bg-red-50"
                        onClick={() => handleDelete(ad.id)}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        삭제
                      </Button>
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
