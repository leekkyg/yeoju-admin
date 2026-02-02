"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminSidebar } from "@/components/ui/admin-sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, Pin, Eye } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Notice {
  id: number;
  title: string;
  content: string;
  is_pinned: boolean;
  author_nickname: string;
  view_count: number;
  created_at: string;
}

export default function NoticesPage() {
  const router = useRouter();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    const { data, error } = await supabase
      .from("notices")
      .select("*")
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false });

    if (!error && data) {
      setNotices(data);
    }
    setLoading(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    const { error } = await supabase
      .from("notices")
      .delete()
      .eq("id", id);

    if (!error) {
      setNotices(notices.filter(n => n.id !== id));
      alert("삭제되었습니다");
    } else {
      alert("삭제 실패: " + error.message);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <AdminSidebar />

      <main className="flex-1 p-8 max-w-[631px] mx-auto w-full">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">공지사항 관리</h1>
            <p className="text-slate-500 mt-1">공지사항을 관리합니다</p>
          </div>
          <Button
            onClick={() => router.push("/notices/write")}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            공지 작성
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : notices.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-slate-500 mb-4">등록된 공지사항이 없습니다</p>
            <Button onClick={() => router.push("/notices/write")}>
              첫 공지 작성하기
            </Button>
          </Card>
        ) : (
          <div className="space-y-3">
            {notices.map((notice) => (
              <Card key={notice.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {notice.is_pinned && (
                          <span className="px-2 py-1 bg-orange-100 text-orange-600 text-xs font-bold rounded">
                            <Pin className="h-3 w-3 inline mr-1" />
                            고정
                          </span>
                        )}
                        <h3 className="text-lg font-bold text-slate-900">
                          {notice.title}
                        </h3>
                      </div>
                      <div 
                        className="text-slate-600 text-sm mb-3 line-clamp-2"
                        dangerouslySetInnerHTML={{ __html: notice.content }}
                      />
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span>{notice.author_nickname}</span>
                        <span>조회 {notice.view_count}</span>
                        <span>{new Date(notice.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => router.push(`/notices/${notice.id}/edit`)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:bg-red-50"
                        onClick={() => handleDelete(notice.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
