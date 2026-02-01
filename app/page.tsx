"use client";

import { useEffect, useState } from "react";
import { AdminSidebar } from "@/components/ui/admin-sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, FileText, Video, Eye, TrendingUp, MessageSquare } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPosts: 0,
    totalVideos: 0,
    totalViews: 0,
    todayPosts: 0,
    totalComments: 0,
  });
  const [recentPosts, setRecentPosts] = useState<any[]>([]);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchRecentData();
  }, []);

  const fetchStats = async () => {
    const { count: userCount } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    const { count: postCount } = await supabase
      .from("posts")
      .select("*", { count: "exact", head: true });

    const { count: videoCount } = await supabase
      .from("videos")
      .select("*", { count: "exact", head: true });

    const { data: viewData } = await supabase
      .from("posts")
      .select("view_count");
    const totalViews = viewData?.reduce((sum, p) => sum + (p.view_count || 0), 0) || 0;

    const today = new Date().toISOString().split("T")[0];
    const { count: todayCount } = await supabase
      .from("posts")
      .select("*", { count: "exact", head: true })
      .gte("created_at", today);

    const { count: commentCount } = await supabase
      .from("comments")
      .select("*", { count: "exact", head: true });

    setStats({
      totalUsers: userCount || 0,
      totalPosts: postCount || 0,
      totalVideos: videoCount || 0,
      totalViews,
      todayPosts: todayCount || 0,
      totalComments: commentCount || 0,
    });
  };

  const fetchRecentData = async () => {
    const { data: posts } = await supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5);
    setRecentPosts(posts || []);

    const { data: users } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5);
    setRecentUsers(users || []);

    setLoading(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ko-KR", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const statCards = [
    { title: "총 회원", value: stats.totalUsers, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
    { title: "총 게시글", value: stats.totalPosts, icon: FileText, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { title: "총 영상", value: stats.totalVideos, icon: Video, color: "text-purple-500", bg: "bg-purple-500/10" },
    { title: "총 조회수", value: stats.totalViews.toLocaleString(), icon: Eye, color: "text-orange-500", bg: "bg-orange-500/10" },
    { title: "오늘 게시글", value: stats.todayPosts, icon: TrendingUp, color: "text-pink-500", bg: "bg-pink-500/10" },
    { title: "총 댓글", value: stats.totalComments, icon: MessageSquare, color: "text-cyan-500", bg: "bg-cyan-500/10" },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50">
      <AdminSidebar />

      <main className="flex-1 p-8 max-w-5xl mx-auto w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">대시보드</h1>
          <p className="text-slate-500 mt-1">여주마켓 관리자 페이지에 오신 것을 환영합니다</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          {statCards.map((stat) => (
            <Card key={stat.title} className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${stat.bg}`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">{stat.title}</p>
                    <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <FileText className="h-5 w-5 text-emerald-500" />
                최근 게시글
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-slate-500">로딩중...</p>
              ) : recentPosts.length === 0 ? (
                <p className="text-slate-500">게시글이 없습니다</p>
              ) : (
                <div className="space-y-3">
                  {recentPosts.map((post) => (
                    <div
                      key={post.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 truncate">{post.title}</p>
                        <p className="text-sm text-slate-500">{formatDate(post.created_at)}</p>
                      </div>
                      <Badge variant="secondary" className="ml-2">
                        {post.board_type || "일반"}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" />
                최근 가입 회원
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-slate-500">로딩중...</p>
              ) : recentUsers.length === 0 ? (
                <p className="text-slate-500">회원이 없습니다</p>
              ) : (
                <div className="space-y-3">
                  {recentUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center text-white font-medium">
                          {(user.nickname || user.email || "U")[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">
                            {user.nickname || user.username || "이름없음"}
                          </p>
                          <p className="text-sm text-slate-500">{user.email}</p>
                        </div>
                      </div>
                      <Badge variant="outline">{user.role || "user"}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}