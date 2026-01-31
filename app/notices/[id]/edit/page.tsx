"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AdminSidebar } from "@/components/ui/admin-sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save, ImagePlus, X, Pin } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { use } from "react";

const R2_WORKER_URL = "https://yeoju-r2-worker.kkyg9300.workers.dev";

export default function EditNoticePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotice = async () => {
      const { data, error } = await supabase
        .from("notices")
        .select("*")
        .eq("id", parseInt(id))
        .single();

      if (error) {
        alert("공지사항을 불러올 수 없습니다");
        router.back();
        return;
      }

      setTitle(data.title || "");
      setContent(data.content || "");
      setIsPinned(data.is_pinned || false);
      setImages(data.images || []);
      setLoading(false);
    };

    fetchNotice();
  }, [id, router]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    
    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        alert(`${file.name}: 10MB 이하만 업로드 가능합니다`);
        continue;
      }
      
      try {
        const ext = file.name.split('.').pop();
        const fileName = `notices/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
        
        const response = await fetch(`${R2_WORKER_URL}/${fileName}`, {
          method: 'PUT',
          body: file,
          headers: { 'Content-Type': file.type },
        });
        
        const data = await response.json();
        setImages(prev => [...prev, data.url]);
      } catch (error) {
        console.error("이미지 업로드 실패:", error);
        alert("이미지 업로드에 실패했습니다");
      }
    }
    
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      alert("제목을 입력해주세요");
      return;
    }

    setSaving(true);

    const { error } = await supabase
      .from("notices")
      .update({
        title: title.trim(),
        content: content.trim(),
        is_pinned: isPinned,
        images: images,
        updated_at: new Date().toISOString(),
      })
      .eq("id", parseInt(id));

    if (error) {
      alert("저장 실패: " + error.message);
      setSaving(false);
      return;
    }

    router.push("/notices");
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

      <main className="flex-1 p-8">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="text-slate-400 hover:text-slate-600"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">공지사항 수정</h1>
            <p className="text-slate-500 mt-1">공지사항 내용을 수정합니다</p>
          </div>
        </div>

        <div className="max-w-3xl">
          <Card className="border-0 shadow-sm mb-6">
            <CardHeader>
              <CardTitle>공지사항 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 고정 여부 */}
              <div 
                className={`flex items-center gap-3 p-4 rounded-lg cursor-pointer transition-colors ${
                  isPinned ? 'bg-orange-50 border-2 border-orange-500' : 'bg-slate-50 border-2 border-transparent'
                }`}
                onClick={() => setIsPinned(!isPinned)}
              >
                <div className={`p-2 rounded-lg ${isPinned ? 'bg-orange-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                  <Pin className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-slate-900">중요 공지로 고정</p>
                  <p className="text-sm text-slate-500">목록 상단에 항상 표시됩니다</p>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  isPinned ? 'border-orange-500 bg-orange-500' : 'border-slate-300'
                }`}>
                  {isPinned && <span className="text-white text-sm">✓</span>}
                </div>
              </div>

              {/* 제목 */}
              <div>
                <Label htmlFor="title" className="text-base font-medium">제목</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="공지사항 제목을 입력하세요"
                  className="mt-2"
                  maxLength={100}
                />
              </div>

              {/* 내용 */}
              <div>
                <Label htmlFor="content" className="text-base font-medium">내용</Label>
                <textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="공지사항 내용을 입력하세요"
                  className="mt-2 w-full min-h-[300px] p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-y"
                />
              </div>

              {/* 이미지 */}
              <div>
                <Label className="text-base font-medium">이미지</Label>
                <p className="text-sm text-slate-500 mb-2">최대 10MB, 여러 장 업로드 가능</p>
                
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  multiple
                  className="hidden"
                />
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="mb-4"
                >
                  <ImagePlus className="h-4 w-4 mr-2" />
                  {uploading ? "업로드 중..." : "이미지 추가"}
                </Button>

                {images.length > 0 && (
                  <div className="grid grid-cols-4 gap-3">
                    {images.map((url, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={url}
                          alt=""
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <button
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 저장 버튼 */}
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => router.back()}
            >
              취소
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={saving || !title.trim()}
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