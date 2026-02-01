"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AdminSidebar } from "@/components/ui/admin-sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save, Bold, Italic, Underline } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function WriteNoticePage() {
  const router = useRouter();
  const contentRef = useRef<HTMLDivElement>(null);
  
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [saving, setSaving] = useState(false);

  // 텍스트 서식 적용
  const applyFormat = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    contentRef.current?.focus();
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      alert("제목을 입력해주세요");
      return;
    }

    const htmlContent = contentRef.current?.innerHTML || "";
    if (!htmlContent.trim() || htmlContent === "<br>") {
      alert("내용을 입력해주세요");
      return;
    }

    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        alert("로그인이 필요합니다");
        setSaving(false);
        return;
      }

      const { error } = await supabase
        .from("notices")
        .insert({
          title: title.trim(),
          content: htmlContent,
          is_pinned: isPinned,
          author_nickname: "관리자",
          user_id: user.id,
          view_count: 0,
        });

      if (error) {
        alert("저장 실패: " + error.message);
        setSaving(false);
        return;
      }

      alert("공지사항이 등록되었습니다!");
      router.push("/notices");
    } catch (error: any) {
      alert("오류: " + error.message);
      setSaving(false);
    }
  };

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
            <h1 className="text-3xl font-bold text-slate-900">공지사항 작성</h1>
            <p className="text-slate-500 mt-1">새로운 공지사항을 작성합니다</p>
          </div>
        </div>

        <div className="max-w-4xl">
          <Card className="border-0 shadow-sm mb-6">
            <CardHeader>
              <CardTitle>공지사항 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 중요 공지 토글 */}
              <div 
                className={`flex items-center gap-3 p-4 rounded-lg cursor-pointer transition-all ${
                  isPinned 
                    ? "bg-orange-50 border-2 border-orange-500" 
                    : "bg-slate-50 border-2 border-slate-200 hover:border-orange-300"
                }`}
                onClick={() => setIsPinned(!isPinned)}
              >
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                  isPinned ? "bg-orange-500 border-orange-500" : "border-slate-300"
                }`}>
                  {isPinned && (
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
                    </svg>
                  )}
                </div>
                <div>
                  <p className="font-semibold text-slate-900">중요 공지로 상단 고정</p>
                  <p className="text-sm text-slate-500">목록 최상단에 항상 표시됩니다</p>
                </div>
              </div>

              {/* 제목 */}
              <div>
                <Label htmlFor="title" className="text-base font-semibold">제목 *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="공지사항 제목을 입력하세요"
                  className="mt-2 text-lg"
                  maxLength={100}
                />
                <p className="text-xs text-slate-400 mt-1">{title.length}/100자</p>
              </div>

              {/* 리치 텍스트 에디터 */}
              <div>
                <Label className="text-base font-semibold">내용 *</Label>
                <p className="text-sm text-slate-500 mb-3">텍스트 서식을 자유롭게 꾸밀 수 있습니다</p>
                
                {/* 서식 도구 */}
                <div className="flex items-center gap-1 p-2 bg-slate-100 rounded-t-lg border border-b-0">
                  <button
                    type="button"
                    onClick={() => applyFormat('bold')}
                    className="p-2 hover:bg-white rounded transition-colors"
                    title="굵게 (Ctrl+B)"
                  >
                    <Bold className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => applyFormat('italic')}
                    className="p-2 hover:bg-white rounded transition-colors"
                    title="기울임 (Ctrl+I)"
                  >
                    <Italic className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => applyFormat('underline')}
                    className="p-2 hover:bg-white rounded transition-colors"
                    title="밑줄 (Ctrl+U)"
                  >
                    <Underline className="h-4 w-4" />
                  </button>
                  
                  <div className="w-px h-6 bg-slate-300 mx-1" />
                  
                  <select
                    onChange={(e) => applyFormat('fontSize', e.target.value)}
                    className="px-2 py-1 text-sm border-0 bg-transparent hover:bg-white rounded"
                    defaultValue="3"
                  >
                    <option value="1">아주 작게</option>
                    <option value="2">작게</option>
                    <option value="3">보통</option>
                    <option value="4">크게</option>
                    <option value="5">아주 크게</option>
                    <option value="6">거대</option>
                  </select>
                  
                  <div className="w-px h-6 bg-slate-300 mx-1" />
                  
                  <label className="px-2 py-1 hover:bg-white rounded cursor-pointer flex items-center gap-1">
                    <span className="text-sm">글자색</span>
                    <input
                      type="color"
                      onChange={(e) => applyFormat('foreColor', e.target.value)}
                      className="w-6 h-6 rounded cursor-pointer"
                    />
                  </label>
                  
                  <label className="px-2 py-1 hover:bg-white rounded cursor-pointer flex items-center gap-1">
                    <span className="text-sm">배경색</span>
                    <input
                      type="color"
                      onChange={(e) => applyFormat('hiliteColor', e.target.value)}
                      className="w-6 h-6 rounded cursor-pointer"
                    />
                  </label>
                </div>

                {/* 에디터 */}
                <div
                  ref={contentRef}
                  contentEditable
                  onInput={(e) => setContent(e.currentTarget.innerHTML)}
                  className="w-full min-h-[400px] p-4 border border-slate-200 rounded-b-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent overflow-auto"
                  style={{ maxHeight: '600px' }}
                  suppressContentEditableWarning
                  placeholder="내용을 입력하세요..."
                />
              </div>
            </CardContent>
          </Card>

          {/* 버튼 */}
          <div className="flex justify-end gap-3">
            <Button 
              variant="outline" 
              onClick={() => router.back()}
              disabled={saving}
            >
              취소
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={saving || !title.trim()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? "저장 중..." : "등록하기"}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
