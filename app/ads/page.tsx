"use client";

import { useEffect, useState } from "react";
import { AdminSidebar } from "@/components/ui/admin-sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Trash2, ExternalLink } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function AdsPage() {
  const [ads, setAds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    title: "",
    image_url: "",
    link_url: "",
    position: "home_banner",
    start_date: "",
    end_date: "",
  });

  const positions = [
    { value: "home_banner", label: "홈 배너" },
    { value: "video_mid", label: "영상 중간 광고" },
    { value: "community_top", label: "커뮤니티 상단" },
    { value: "popup", label: "팝업 광고" },
  ];

  useEffect(() => {
    fetchAds();
  }, []);

  const fetchAds = async () => {
    const { data } = await supabase
      .from("ads")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) setAds(data);
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.image_url) {
      alert("제목과 이미지 URL은 필수입니다");
      return;
    }

    const { error } = await supabase.from("ads").insert({
      ...formData,
      is_active: true,
    });

    if (error) {
      alert("등록 실패: " + error.message);
    } else {
      alert("광고가 등록되었습니다!");
      setDialogOpen(false);
      setFormData({
        title: "",
        image_url: "",
        link_url: "",
        position: "home_banner",
        start_date: "",
        end_date: "",
      });
      fetchAds();
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    await supabase.from("ads").delete().eq("id", id);
    fetchAds();
  };

  const toggleActive = async (id: number, currentStatus: boolean) => {
    await supabase
      .from("ads")
      .update({ is_active: !currentStatus })
      .eq("id", id);
    fetchAds();
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("ko-KR");
  };

  const getPositionLabel = (position: string) => {
    return positions.find((p) => p.value === position)?.label || position;
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <AdminSidebar />

      <main className="flex-1 p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">광고관리</h1>
            <p className="text-slate-500 mt-1">배너 및 광고 관리</p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="h-4 w-4 mr-2" />
                광고 등록
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl">
              <DialogHeader className="pb-4 border-b">
                <DialogTitle className="text-xl">새 광고 등록</DialogTitle>
              </DialogHeader>

              <div className="space-y-6 py-6">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700">광고 제목 *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="광고 제목을 입력하세요"
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700">이미지 URL *</Label>
                  <Input
                    value={formData.image_url}
                    onChange={(e) =>
                      setFormData({ ...formData, image_url: e.target.value })
                    }
                    placeholder="https://example.com/banner.jpg"
                    className="h-12"
                  />
                  <p className="text-xs text-slate-500">권장 사이즈: 1200 x 400px</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700">링크 URL</Label>
                  <Input
                    value={formData.link_url}
                    onChange={(e) =>
                      setFormData({ ...formData, link_url: e.target.value })
                    }
                    placeholder="https://example.com"
                    className="h-12"
                  />
                  <p className="text-xs text-slate-500">광고 클릭 시 이동할 페이지</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700">광고 위치</Label>
                  <select
                    className="w-full h-12 px-4 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    value={formData.position}
                    onChange={(e) =>
                      setFormData({ ...formData, position: e.target.value })
                    }
                  >
                    {positions.map((pos) => (
                      <option key={pos.value} value={pos.value}>
                        {pos.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-700">시작일</Label>
                    <Input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) =>
                        setFormData({ ...formData, start_date: e.target.value })
                      }
                      className="h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-700">종료일</Label>
                    <Input
                      type="date"
                      value={formData.end_date}
                      onChange={(e) =>
                        setFormData({ ...formData, end_date: e.target.value })
                      }
                      className="h-12"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t">
                  <Button 
                    variant="outline" 
                    onClick={() => setDialogOpen(false)}
                    className="px-6 h-11"
                  >
                    취소
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    className="bg-emerald-600 hover:bg-emerald-700 px-6 h-11"
                  >
                    등록
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">ID</TableHead>
                  <TableHead>광고명</TableHead>
                  <TableHead>위치</TableHead>
                  <TableHead>기간</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead className="text-right">관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      로딩중...
                    </TableCell>
                  </TableRow>
                ) : ads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      등록된 광고가 없습니다
                    </TableCell>
                  </TableRow>
                ) : (
                  ads.map((ad) => (
                    <TableRow key={ad.id}>
                      <TableCell className="font-medium">{ad.id}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {ad.image_url && (
                            <img
                              src={ad.image_url}
                              alt=""
                              className="w-20 h-12 object-cover rounded"
                            />
                          )}
                          <div>
                            <p className="font-medium">{ad.title}</p>
                            {ad.link_url && (
                              <span className="text-sm text-blue-500 flex items-center gap-1">
                                <ExternalLink className="h-3 w-3" />
                                링크
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {getPositionLabel(ad.position)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDate(ad.start_date)} ~ {formatDate(ad.end_date)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            ad.is_active ? "bg-emerald-500 cursor-pointer" : "bg-slate-400 cursor-pointer"
                          }
                          onClick={() => toggleActive(ad.id, ad.is_active)}
                        >
                          {ad.is_active ? "활성" : "비활성"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500 hover:text-red-700"
                          onClick={() => handleDelete(ad.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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