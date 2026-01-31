"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { AdminSidebar } from "@/components/ui/admin-sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save, ImagePlus, X, Pin } from "lucide-react";
import { supabase } from "@/lib/supabase";

const R2_WORKER_URL = "https://yeoju-r2-worker.kkyg9300.workers.dev";

export default function WriteNoticePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

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
        const ext = file.name.split(".").pop();
        const fileName = `notices/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
        
        const response = await fetch(`${R2_WORKER_URL}/${fileName}`, {
          method: "PUT",
          body: file,
          headers: { "Content-Type": file.type },
        });
        
        const data = await response.json();
        setImages((prev) => [...prev, data.url]);
      } catch (error) {
        console.error("이미지 업로드 실패:", error);
        alert("이미지 업로드에 실패했습니다");
      }
    }
    
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    alert("저장 시작!");
    
    if (!title.trim()) {
      alert("제목을 입력해주세요");
      return;
    }

    setSaving(true);

    const { data, error } = await supabase.from("notices").insert({
      title: title.trim(),
      content: content.trim(),
      is_pinned: isPinned,
      images: images.length > 0 ? images : null,
      author_nickname: "관리자",
      view_count: 0,
    }).select();

    console.log("결과:", data, error);

    if (error) {
      alert("저장 실패: " + error.message);
      setSaving(false);
      return;
    }

    alert("공지사항이 등록되었습니다!");
    router.push("/notices");
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <AdminSidebar />

      <main className="flex-1 p-8">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">새 공지사항</h1>
            <p className="text-slate-500 mt-1">새로운 공지사항을 작성합니다</p>
          </div>
        </div>

        <div className="max-w-3xl">
          <Card className="border-0 shadow-sm mb-6">
            <CardHeader>
              <CardTitle>공지사항 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div 
                className={`flex items-center gap-3 p-4 rounded-lg cursor-pointer ${
                  isPinned ? "bg-orange-50 border-2 border-orange-500" : "bg-slate-50 border-2 border-transparent"
                }`}
                onClick={() => setIsPinned(!isPinned)}
              >
                <div className={`p-2 rounded-lg ${isPinned ? "bg-orange-500 text-white" : "bg-slate-200 text-slate-500"}`}>
                  <Pin className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-slate-900">중요 공지로 고정</p>
                  <p className="text-sm text-slate-500">목록 상단에 항상 표시됩니다</p>
                </div>
              </div>

              <div>
                <Label htmlFor="title">제목</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="공지사항 제목을 입력하세요"
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="content">내용</Label>
                <textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="공지사항 내용을 입력하세요"
                  className="mt-2 w-full min-h-[300px] p-3 border rounded-lg"
                />
              </div>

              <div>
                <Label>이미지</Label>
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
                  className="mt-2"
                >
                  <ImagePlus className="h-4 w-4 mr-2" />
                  {uploading ? "업로드 중..." : "이미지 추가"}
                </Button>

                {images.length > 0 && (
                  <div className="grid grid-cols-4 gap-3 mt-4">
                    {images.map((url, index) => (
                      <div key={index} className="relative group">
                        <img src={url} alt="" className="w-full h-24 object-cover rounded-lg" />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full"
                        >
                          <X className="h-4 w-4 mx-auto" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => router.back()}>
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
