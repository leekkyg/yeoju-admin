"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { AdminSidebar } from "@/components/ui/admin-sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  ArrowLeft, 
  Image as ImageIcon, 
  Bold, 
  Italic, 
  List,
  Upload,
  X,
  Loader2
} from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function WritePostPage() {
  const router = useRouter();
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const savedRangeRef = useRef<Range | null>(null);
  
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const categories = ["자유게시판", "정보공유", "중고거래", "질문답변", "맛집후기"];

  // Cloudflare R2 업로드
  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      setUploading(true);
      
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("https://yeoju-r2-worker.kkyg9300.workers.dev/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("업로드 실패");

      const data = await response.json();
      return data.url;
    } catch (error) {
      console.error("이미지 업로드 실패:", error);
      alert("이미지 업로드에 실패했습니다.");
      return null;
    } finally {
      setUploading(false);
    }
  };

  // 썸네일 업로드
  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = await uploadImage(file);
    if (url) {
      setThumbnail(url);
    }
  };

  // 현재 커서 위치 저장
  const saveSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      // 에디터 내부인지 확인
      if (editorRef.current?.contains(range.commonAncestorContainer)) {
        savedRangeRef.current = range.cloneRange();
      }
    }
  };

  // 본문에 이미지 삽입 버튼 클릭
  const handleInsertImage = () => {
    // 현재 커서 위치 저장
    saveSelection();
    // 파일 선택 다이얼로그 열기
    fileInputRef.current?.click();
  };

  // 이미지 파일 선택 후
  const handleImageFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = await uploadImage(file);
    if (url && editorRef.current) {
      // 이미지 요소 생성
      const img = document.createElement("img");
      img.src = url;
      img.style.cssText = "max-width: 100%; width: 100%; height: auto; display: block; border-radius: 8px; margin: 16px 0;";
      img.className = "editor-image";
      
      // 줄바꿈 요소
      const br = document.createElement("br");

      // 저장된 커서 위치가 있으면 그 위치에 삽입
      if (savedRangeRef.current) {
        const range = savedRangeRef.current;
        range.deleteContents();
        range.insertNode(br);
        range.insertNode(img);
        
        // 커서를 이미지 뒤로 이동
        range.setStartAfter(br);
        range.collapse(true);
        
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
        
        savedRangeRef.current = null;
      } else {
        // 저장된 위치 없으면 에디터 끝에 추가
        editorRef.current.appendChild(img);
        editorRef.current.appendChild(br);
      }
      
      // 에디터 포커스
      editorRef.current.focus();
    }
    
    // input 초기화
    e.target.value = "";
  };

  // 텍스트 스타일 적용
  const applyStyle = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  // HTML에서 이미지 URL 추출
  const extractImages = () => {
    if (!editorRef.current) return [];
    
    const html = editorRef.current.innerHTML;
    const images: string[] = [];
    
    const imgRegex = /<img[^>]+src="([^">]+)"/g;
    let match;
    while ((match = imgRegex.exec(html)) !== null) {
      images.push(match[1]);
    }
    
    return images;
  };

  // 게시글 저장
  const handleSubmit = async () => {
    if (!title.trim()) {
      alert("제목을 입력해주세요.");
      return;
    }
    
    if (!category) {
      alert("카테고리를 선택해주세요.");
      return;
    }

    const content = editorRef.current?.innerHTML || "";
    const contentText = editorRef.current?.textContent || "";
    const contentImages = extractImages();
    
    if (!contentText.trim() && contentImages.length === 0) {
      alert("내용을 입력해주세요.");
      return;
    }

    setSaving(true);

    try {
      // 썸네일 + 본문 이미지 합치기
      const allImages = thumbnail 
        ? [thumbnail, ...contentImages] 
        : contentImages;

      const { data, error } = await supabase.from("posts").insert({
        title: title.trim(),
        content: content,
        board_type: category,
        images: allImages,
        view_count: 0,
        like_count: 0,
      }).select();

      if (error) throw error;

      alert("게시글이 등록되었습니다.");
      router.push("/posts");
    } catch (error) {
      console.error("저장 실패:", error);
      alert("저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <AdminSidebar />

      <main className="flex-1 p-8">
        {/* 헤더 */}
        <div className="flex items-center gap-4 mb-8">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">글쓰기</h1>
            <p className="text-slate-500 mt-1">새 게시글을 작성합니다</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 에디터 영역 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 제목 */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <Label htmlFor="title" className="text-base font-semibold">제목</Label>
                <Input
                  id="title"
                  placeholder="게시글 제목을 입력하세요"
                  className="mt-2 text-lg"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </CardContent>
            </Card>

            {/* 본문 에디터 */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <Label className="text-base font-semibold">본문</Label>
                
                {/* 툴바 */}
                <div className="flex items-center gap-1 mt-2 p-2 bg-slate-100 rounded-t-lg border border-b-0 border-slate-200">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => applyStyle("bold")}
                    title="굵게"
                  >
                    <Bold className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => applyStyle("italic")}
                    title="기울임"
                  >
                    <Italic className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => applyStyle("insertUnorderedList")}
                    title="목록"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  
                  <div className="w-px h-6 bg-slate-300 mx-2" />
                  
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleInsertImage}
                    disabled={uploading}
                    title="이미지 삽입"
                  >
                    {uploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ImageIcon className="h-4 w-4" />
                    )}
                    <span className="ml-1">이미지</span>
                  </Button>
                </div>

                               {/* 에디터 영역 */}
                <div
                  ref={editorRef}
                  contentEditable
                  className="min-h-[400px] p-4 border border-slate-200 rounded-b-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white overflow-auto"
                  style={{ 
                    lineHeight: "1.8",
                    fontSize: "15px",
                    wordBreak: "break-word",
                    maxWidth: "631px",
                  }}
                  onPaste={(e) => {
                    e.preventDefault();
                    const text = e.clipboardData.getData("text/plain");
                    document.execCommand("insertText", false, text);
                  }}
                  onMouseUp={saveSelection}
                  onKeyUp={saveSelection}
                />


                {/* 숨겨진 파일 input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageFileSelect}
                />
              </CardContent>
            </Card>
          </div>

          {/* 사이드바 */}
          <div className="space-y-6">
            {/* 카테고리 */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">카테고리</CardTitle>
              </CardHeader>
              <CardContent>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">카테고리 선택</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </CardContent>
            </Card>

            {/* 썸네일 */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">대표 이미지 (선택)</CardTitle>
              </CardHeader>
              <CardContent>
                {thumbnail ? (
                  <div className="relative">
                    <img
                      src={thumbnail}
                      alt="썸네일"
                      className="w-full aspect-video object-cover rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-8 w-8"
                      onClick={() => setThumbnail(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div
                    onClick={() => thumbnailInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center cursor-pointer hover:border-emerald-500 hover:bg-emerald-50 transition-colors"
                  >
                    <Upload className="h-8 w-8 mx-auto text-slate-400 mb-2" />
                    <p className="text-sm text-slate-500">클릭하여 업로드</p>
                    <p className="text-xs text-slate-400 mt-1">목록 썸네일용</p>
                  </div>
                )}
                <input
                  ref={thumbnailInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleThumbnailUpload}
                />
              </CardContent>
            </Card>

            {/* 저장 버튼 */}
            <Button
              onClick={handleSubmit}
              disabled={saving}
              className="w-full bg-emerald-600 hover:bg-emerald-700 h-12 text-base"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  저장 중...
                </>
              ) : (
                "게시글 등록"
              )}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
