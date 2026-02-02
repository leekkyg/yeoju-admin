"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminSidebar } from "@/components/ui/admin-sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FileText, Search, MoreHorizontal, Eye, Trash2, EyeOff, Plus, Pencil, ExternalLink, CheckSquare, Square } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function PostsPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("전체");
  const [selectedPosts, setSelectedPosts] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  const categories = ["전체", "자유게시판", "정보공유", "중고거래", "질문답변", "맛집후기"];

  useEffect(() => { fetchPosts(); }, []);

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("게시글 불러오기 실패:", error);
      alert("게시글을 불러오는데 실패했습니다: " + error.message);
      setLoading(false);
      return;
    }

    if (data) {
      const postsWithProfiles = await Promise.all(
        data.map(async (post) => {
          if (post.user_id) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("nickname, email")
              .eq("id", post.user_id)
              .single();
            return { ...post, profile };
          }
          return { ...post, profile: null };
        })
      );
      setPosts(postsWithProfiles);
    }
    setLoading(false);
  };

  // 단일 삭제
  const handleDelete = async (id: number) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    const { error } = await supabase
      .from("posts")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("삭제 실패:", error);
      alert("삭제에 실패했습니다: " + error.message);
      return;
    }

    alert("삭제되었습니다!");
    fetchPosts();
  };

  // 선택 삭제
  const handleSelectedDelete = async () => {
    if (selectedPosts.length === 0) {
      alert("삭제할 게시글을 선택해주세요");
      return;
    }

    if (!confirm(`선택한 ${selectedPosts.length}개의 게시글을 삭제하시겠습니까?`)) return;

    const { error } = await supabase
      .from("posts")
      .delete()
      .in("id", selectedPosts);

    if (error) {
      console.error("선택 삭제 실패:", error);
      alert("삭제에 실패했습니다: " + error.message);
      return;
    }

    alert(`${selectedPosts.length}개의 게시글이 삭제되었습니다!`);
    setSelectedPosts([]);
    setSelectAll(false);
    fetchPosts();
  };

  // 전체 삭제
  const handleDeleteAll = async () => {
    if (posts.length === 0) {
      alert("삭제할 게시글이 없습니다");
      return;
    }

    const confirmText = prompt(
      `⚠️ 경고: 모든 게시글 ${posts.length}개가 영구 삭제됩니다!\n\n정말 삭제하시려면 "삭제확인"을 입력하세요:`
    );

    if (confirmText !== "삭제확인") {
      alert("삭제가 취소되었습니다");
      return;
    }

    const { error } = await supabase
      .from("posts")
      .delete()
      .neq("id", 0); // 모든 게시글 삭제

    if (error) {
      console.error("전체 삭제 실패:", error);
      alert("삭제에 실패했습니다: " + error.message);
      return;
    }

    alert("모든 게시글이 삭제되었습니다!");
    setSelectedPosts([]);
    setSelectAll(false);
    fetchPosts();
  };

  // 체크박스 토글
  const togglePostSelection = (id: number) => {
    setSelectedPosts((prev) =>
      prev.includes(id)
        ? prev.filter((postId) => postId !== id)
        : [...prev, id]
    );
  };

  // 전체 선택/해제
  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedPosts([]);
    } else {
      setSelectedPosts(filteredPosts.map((post) => post.id));
    }
    setSelectAll(!selectAll);
  };

  // 새 탭에서 게시글 보기
  const handleViewPost = (id: number) => {
    window.open(`http://localhost:3000/posts/${id}`, "_blank");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      자유게시판: "bg-emerald-500",
      정보공유: "bg-blue-500",
      중고거래: "bg-orange-500",
      질문답변: "bg-purple-500",
      맛집후기: "bg-red-500",
    };
    return colors[category] || "bg-slate-500";
  };

  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      post.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.content?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "전체" || post.board_type === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex min-h-screen bg-slate-50">
      <AdminSidebar />
      <main className="flex-1 p-8 max-w-[1000px] mx-auto w-full">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">게시글 관리</h1>
            <p className="text-slate-500 mt-1">
              총 {posts.length}개의 게시글이 등록되어 있습니다
            </p>
          </div>
          <Button
            onClick={() => router.push("/posts/write")}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            글쓰기
          </Button>
        </div>

        <Card className="border-0 shadow-sm mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex gap-2 flex-wrap">
                {categories.map((cat) => (
                  <Button
                    key={cat}
                    variant={selectedCategory === cat ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(cat)}
                    className={
                      selectedCategory === cat ? "bg-emerald-600" : ""
                    }
                  >
                    {cat}
                  </Button>
                ))}
              </div>
              <div className="relative flex-1 max-w-md ml-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="제목, 내용으로 검색..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 선택 삭제 버튼 */}
        {selectedPosts.length > 0 && (
          <div className="mb-4 flex gap-2">
            <Button
              variant="destructive"
              onClick={handleSelectedDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              선택 삭제 ({selectedPosts.length}개)
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedPosts([]);
                setSelectAll(false);
              }}
            >
              선택 해제
            </Button>
          </div>
        )}

        {/* 전체 삭제 버튼 */}
        {posts.length > 0 && (
          <div className="mb-4 flex justify-end">
            <Button
              variant="outline"
              onClick={handleDeleteAll}
              className="text-red-600 border-red-300 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              전체 삭제
            </Button>
          </div>
        )}

        <Card className="border-0 shadow-sm">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectAll}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead className="w-16">ID</TableHead>
                  <TableHead>제목</TableHead>
                  <TableHead>카테고리</TableHead>
                  <TableHead>작성자</TableHead>
                  <TableHead>조회/좋아요</TableHead>
                  <TableHead>작성일</TableHead>
                  <TableHead className="text-right">관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      로딩중...
                    </TableCell>
                  </TableRow>
                ) : filteredPosts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      게시글이 없습니다
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPosts.map((post) => (
                    <TableRow key={post.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedPosts.includes(post.id)}
                          onCheckedChange={() => togglePostSelection(post.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{post.id}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium truncate max-w-xs">
                            {post.title}
                          </p>
                          <p className="text-sm text-slate-500 truncate max-w-xs">
                            {post.content
                              ?.replace(/<[^>]*>/g, "")
                              .substring(0, 50)}
                            ...
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getCategoryColor(post.board_type)}>
                          {post.board_type || "일반"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {post.profile?.nickname || "관리자"}
                          </p>
                          <p className="text-sm text-slate-500">
                            {post.profile?.email || ""}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          <Eye className="h-4 w-4 text-slate-400" />
                          {post.view_count || 0}
                          <span className="text-slate-300">|</span>❤️{" "}
                          {post.like_count || 0}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDate(post.created_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleViewPost(post.id)}
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />새 탭에서
                              보기
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                router.push(`/posts/edit/${post.id}`)
                              }
                            >
                              <Pencil className="h-4 w-4 mr-2" />
                              수정하기
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-500"
                              onClick={() => handleDelete(post.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              삭제하기
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
