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
  Loader2,
  Link as LinkIcon,
  Palette,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Underline,
  Strikethrough
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
  const [linkUrl, setLinkUrl] = useState("");
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);

  const categories = ["자유게시판", "정보공유", "중고거래", "질문답변", "맛집후기"];
  
  // 폰트 크기 옵션
  const fontSizes = [
    { label: "작게", value: "2" },
    { label: "보통", value: "3" },
    { label: "크게", value: "4" },
    { label: "더 크게", value: "5" },
    { label: "매우 크게", value: "6" },
  ];

  // 폰트 종류 옵션
  const fontFamilies = [
    { label: "기본", value: "inherit" },
    { label: "고딕", value: "Pretendard, sans-serif" },
    { label: "명조", value: "Noto Serif KR, serif" },
    { label: "둥근고딕", value: "Jua, sans-serif" },
  ];

  // 글자 색상 옵션
  const textColors = [
    { label: "기본", value: "inherit" },
    { label: "검정", value: "#000000" },
    { label: "빨강", value: "#ef4444" },
    { label: "파랑", value: "#3b82f6" },
    { label: "초록", value: "#22c55e" },
    { label: "주황", value: "#f97316" },
    { label: "보라", value: "#a855f7" },
    { label: "회색", value: "#6b7280" },
  ];

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
      if (editorRef.current?.contains(range.commonAncestorContainer)) {
        savedRangeRef.current = range.cloneRange();
      }
    }
  };

  // 본문에 이미지 삽입 버튼 클릭
  const handleInsertImage = () => {
    saveSelection();
    fileInputRef.current?.click();
  };

  // 이미지 파일 선택 후
  const handleImageFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = await uploadImage(file);
    if (url && editorRef.current) {
      const img = document.createElement("img");
      img.src = url;
      img.style.cssText = "max-width: 100%; width: 100%; height: auto; display: block; border-radius: 8px; margin: 16px 0;";
      img.className = "editor-image";
      
      const br = document.createElement("br");

      if (savedRangeRef.current) {
        const range = savedRangeRef.current;
        range.deleteContents();
        range.insertNode(br);
        range.insertNode(img);
        range.setStartAfter(br);
        range.collapse(true);
        
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
        savedRangeRef.current = null;
      } else {
        editorRef.current.appendChild(img);
        editorRef.current.appendChild(br);
      }
      
      editorRef.current.focus();
    }
    
    e.target.value = "";
  };

  // 텍스트 스타일 적용
  const applyStyle = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  // 글자 색상 변경
  const applyTextColor = (color: string) => {
    if (color === "inherit") {
      document.execCommand("removeFormat", false);
    } else {
      document.execCommand("foreColor", false, color);
    }
    editorRef.current?.focus();
  };

  // 폰트 크기 변경
  const applyFontSize = (size: string) => {
    document.execCommand("fontSize", false, size);
    editorRef.current?.focus();
  };

  // 폰트 종류 변경
  const applyFontFamily = (font: string) => {
    document.execCommand("fontName", false, font);
    editorRef.current?.focus();
  };

  // 링크 프리뷰 가져오기
  const fetchLinkPreview = async (url: string) => {
    try {
      setLoadingPreview(true);
      const response = await fetch(`https://api.microlink.io?url=${encodeURIComponent(url)}`);
      const data = await response.json();
      
      if (data.status === "success" && data.data) {
        return {
          title: data.data.title || url,
          description: data.data.description || "",
          image: data.data.image?.url || "",
          url: url
        };
      }
      return null;
    } catch (error) {
      console.error("링크 프리뷰 가져오기 실패:", error);
      return null;
    } finally {
      setLoadingPreview(false);
    }
  };

  // 링크 삽입 (프리뷰 카드 형태)
  const handleInsertLink = async () => {
    if (!linkUrl.trim()) {
      alert("URL을 입력해주세요.");
      return;
    }

    // URL 형식 검사
    let url = linkUrl.trim();
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url;
    }

    const preview = await fetchLinkPreview(url);
    
    if (editorRef.current) {
      let linkHtml = "";
      
      if (preview && preview.image) {
        // 썸네일이 있는 링크 프리뷰 카드
        linkHtml = `
          <a href="${url}" target="_blank" rel="noopener noreferrer" class="link-preview" style="display: block; border: 1px solid rgba(128,128,128,0.3); border-radius: 12px; overflow: hidden; margin: 16px 0; text-decoration: none; color: inherit;">
            <img src="${preview.image}" alt="${preview.title}" style="width: 100%; height: auto; aspect-ratio: 16/9; object-fit: cover;" />
            <div class="link-preview-info" style="padding: 12px;">
              <div class="link-preview-title" style="font-weight: 600; margin-bottom: 4px; color: inherit;">${preview.title}</div>
              ${preview.description ? `<div class="link-preview-desc" style="font-size: 13px; opacity: 0.7; color: inherit;">${preview.description.substring(0, 100)}${preview.description.length > 100 ? '...' : ''}</div>` : ''}
            </div>
          </a>
        `;
      } else {
        // 썸네일이 없는 경우 텍스트 링크
        linkHtml = `<a href="${url}" target="_blank" rel="noopener noreferrer" style="color: #3b82f6; text-decoration: underline;">${preview?.title || url}</a>`;
      }
      
      // 저장된 커서 위치에 삽입
      if (savedRangeRef.current) {
        const range = savedRangeRef.current;
        range.deleteContents();
        
        const temp = document.createElement("div");
        temp.innerHTML = linkHtml;
        const frag = document.createDocumentFragment();
        let node;
        while ((node = temp.firstChild)) {
          frag.appendChild(node);
        }
        range.insertNode(frag);
        savedRangeRef.current = null;
      } else {
        editorRef.current.innerHTML += linkHtml;
      }
      
      editorRef.current.focus();
    }
    
    setLinkUrl("");
    setShowLinkInput(false);
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

      <main className="flex-1 p-8 max-w-[900px] mx-auto w-full">
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
                
                {/* 툴바 - 1행: 기본 서식 */}
                <div className="flex flex-wrap items-center gap-1 mt-2 p-2 bg-slate-100 rounded-t-lg border border-b-0 border-slate-200">
                  <Button type="button" variant="ghost" size="sm" onClick={() => applyStyle("bold")} title="굵게">
                    <Bold className="h-4 w-4" />
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => applyStyle("italic")} title="기울임">
                    <Italic className="h-4 w-4" />
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => applyStyle("underline")} title="밑줄">
                    <Underline className="h-4 w-4" />
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => applyStyle("strikeThrough")} title="취소선">
                    <Strikethrough className="h-4 w-4" />
                  </Button>
                  
                  <div className="w-px h-6 bg-slate-300 mx-1" />
                  
                  <Button type="button" variant="ghost" size="sm" onClick={() => applyStyle("justifyLeft")} title="왼쪽 정렬">
                    <AlignLeft className="h-4 w-4" />
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => applyStyle("justifyCenter")} title="가운데 정렬">
                    <AlignCenter className="h-4 w-4" />
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => applyStyle("justifyRight")} title="오른쪽 정렬">
                    <AlignRight className="h-4 w-4" />
                  </Button>
                  
                  <div className="w-px h-6 bg-slate-300 mx-1" />
                  
                  <Button type="button" variant="ghost" size="sm" onClick={() => applyStyle("insertUnorderedList")} title="목록">
                    <List className="h-4 w-4" />
                  </Button>
                  
                  <div className="w-px h-6 bg-slate-300 mx-1" />
                  
                  <Button type="button" variant="ghost" size="sm" onClick={handleInsertImage} disabled={uploading} title="이미지 삽입">
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
                  </Button>
                  
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => { saveSelection(); setShowLinkInput(!showLinkInput); }} 
                    title="링크 삽입"
                  >
                    <LinkIcon className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* 툴바 - 2행: 폰트 옵션 */}
                <div className="flex flex-wrap items-center gap-2 p-2 bg-slate-50 border-x border-slate-200">
                  {/* 글자 색상 */}
                  <div className="flex items-center gap-1">
                    <Palette className="h-4 w-4 text-slate-500" />
                    <select 
                      className="h-8 px-2 text-sm border border-slate-200 rounded bg-white"
                      onChange={(e) => applyTextColor(e.target.value)}
                      defaultValue="inherit"
                    >
                      {textColors.map((color) => (
                        <option key={color.value} value={color.value} style={{ color: color.value === 'inherit' ? 'inherit' : color.value }}>
                          {color.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {/* 폰트 크기 */}
                  <div className="flex items-center gap-1">
                    <Type className="h-4 w-4 text-slate-500" />
                    <select 
                      className="h-8 px-2 text-sm border border-slate-200 rounded bg-white"
                      onChange={(e) => applyFontSize(e.target.value)}
                      defaultValue="3"
                    >
                      {fontSizes.map((size) => (
                        <option key={size.value} value={size.value}>
                          {size.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {/* 폰트 종류 */}
                  <select 
                    className="h-8 px-2 text-sm border border-slate-200 rounded bg-white"
                    onChange={(e) => applyFontFamily(e.target.value)}
                    defaultValue="inherit"
                  >
                    {fontFamilies.map((font) => (
                      <option key={font.value} value={font.value} style={{ fontFamily: font.value }}>
                        {font.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* 링크 입력 영역 */}
                {showLinkInput && (
                  <div className="flex items-center gap-2 p-2 bg-blue-50 border-x border-slate-200">
                    <Input
                      placeholder="https://example.com"
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                      className="flex-1 h-8"
                      onKeyDown={(e) => e.key === "Enter" && handleInsertLink()}
                    />
                    <Button 
                      type="button" 
                      size="sm" 
                      onClick={handleInsertLink}
                      disabled={loadingPreview}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {loadingPreview ? <Loader2 className="h-4 w-4 animate-spin" /> : "삽입"}
                    </Button>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => { setShowLinkInput(false); setLinkUrl(""); }}
                    >
                      취소
                    </Button>
                  </div>
                )}

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
                    letterSpacing: "-0.02em",
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
