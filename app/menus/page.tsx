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
import { Plus, Trash2, GripVertical, Edit, Eye, EyeOff, Menu, ArrowUp, ArrowDown } from "lucide-react";
import { supabase } from "@/lib/supabase";

// 사용 가능한 아이콘 목록
const AVAILABLE_ICONS = [
  { value: "edit", label: "✏️ 글쓰기", emoji: "✏️" },
  { value: "shopping-bag", label: "🛍️ 장터", emoji: "🛍️" },
  { value: "video", label: "📺 영상", emoji: "📺" },
  { value: "ticket", label: "🎫 쿠폰", emoji: "🎫" },
  { value: "building", label: "🏢 부동산", emoji: "🏢" },
  { value: "utensils", label: "🍴 맛집", emoji: "🍴" },
  { value: "calendar", label: "📅 일정", emoji: "📅" },
  { value: "megaphone", label: "📢 공지", emoji: "📢" },
  { value: "heart", label: "❤️ 좋아요", emoji: "❤️" },
  { value: "star", label: "⭐ 즐겨찾기", emoji: "⭐" },
  { value: "gift", label: "🎁 이벤트", emoji: "🎁" },
  { value: "map-pin", label: "📍 지도", emoji: "📍" },
  { value: "phone", label: "📞 전화", emoji: "📞" },
  { value: "mail", label: "✉️ 메일", emoji: "✉️" },
  { value: "settings", label: "⚙️ 설정", emoji: "⚙️" },
  { value: "user", label: "👤 프로필", emoji: "👤" },
  { value: "home", label: "🏠 홈", emoji: "🏠" },
  { value: "search", label: "🔍 검색", emoji: "🔍" },
  { value: "bell", label: "🔔 알림", emoji: "🔔" },
  { value: "dollar", label: "💰 지원금", emoji: "💰" },
  { value: "briefcase", label: "💼 일자리", emoji: "💼" },
  { value: "graduation", label: "🎓 교육", emoji: "🎓" },
  { value: "hospital", label: "🏥 병원", emoji: "🏥" },
  { value: "bus", label: "🚌 교통", emoji: "🚌" },
];

// 배경색 옵션
const BACKGROUND_COLORS = [
  { value: "bg-emerald-500", label: "초록", preview: "#10b981" },
  { value: "bg-blue-500", label: "파랑", preview: "#3b82f6" },
  { value: "bg-purple-500", label: "보라", preview: "#8b5cf6" },
  { value: "bg-pink-500", label: "분홍", preview: "#ec4899" },
  { value: "bg-orange-500", label: "주황", preview: "#f97316" },
  { value: "bg-red-500", label: "빨강", preview: "#ef4444" },
  { value: "bg-yellow-500", label: "노랑", preview: "#eab308" },
  { value: "bg-teal-500", label: "청록", preview: "#14b8a6" },
  { value: "bg-indigo-500", label: "남색", preview: "#6366f1" },
  { value: "bg-gray-500", label: "회색", preview: "#6b7280" },
];

export default function MenusPage() {
  const [menus, setMenus] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    title: "",
    icon: "edit",
    link: "/community/write",
    color: "bg-emerald-500",
    sort_order: 0,
  });

  useEffect(() => {
    fetchMenus();
  }, []);

  const fetchMenus = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("quick_menus")
      .select("*")
      .order("sort_order", { ascending: true });
    setMenus(data || []);
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!formData.title) {
      alert("메뉴명은 필수입니다.");
      return;
    }

    try {
      if (editingMenu) {
        // 수정
        const { error } = await supabase
          .from("quick_menus")
          .update({
            title: formData.title,
            icon: formData.icon,
            link: formData.link,
            color: formData.color,
            sort_order: formData.sort_order,
          })
          .eq("id", editingMenu.id);
        if (error) throw error;
        alert("메뉴가 수정되었습니다.");
      } else {
        // 새로 등록
        const maxOrder = menus.length > 0 ? Math.max(...menus.map(m => m.sort_order || 0)) : 0;
        const { error } = await supabase.from("quick_menus").insert({
          title: formData.title,
          icon: formData.icon,
          link: formData.link,
          color: formData.color,
          sort_order: maxOrder + 1,
          is_active: true,
        });
        if (error) throw error;
        alert("메뉴가 등록되었습니다.");
      }

      setDialogOpen(false);
      resetForm();
      fetchMenus();
    } catch (error: any) {
      alert("오류: " + error.message);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      icon: "edit",
      link: "/community/write",
      color: "bg-emerald-500",
      sort_order: 0,
    });
    setEditingMenu(null);
  };

  const handleEdit = (menu: any) => {
    setEditingMenu(menu);
    setFormData({
      title: menu.title,
      icon: menu.icon,
      link: menu.link,
      color: menu.color || "bg-emerald-500",
      sort_order: menu.sort_order || 0,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    await supabase.from("quick_menus").delete().eq("id", id);
    fetchMenus();
  };

  const toggleActive = async (id: number, currentStatus: boolean) => {
    await supabase.from("quick_menus").update({ is_active: !currentStatus }).eq("id", id);
    fetchMenus();
  };

  const moveOrder = async (id: number, direction: "up" | "down") => {
    const currentIndex = menus.findIndex(m => m.id === id);
    if (currentIndex === -1) return;
    
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= menus.length) return;

    const currentMenu = menus[currentIndex];
    const targetMenu = menus[targetIndex];

    // 순서 교환
    await supabase.from("quick_menus").update({ sort_order: targetMenu.sort_order }).eq("id", currentMenu.id);
    await supabase.from("quick_menus").update({ sort_order: currentMenu.sort_order }).eq("id", targetMenu.id);
    
    fetchMenus();
  };

  const getIconEmoji = (iconValue: string) => {
    return AVAILABLE_ICONS.find(i => i.value === iconValue)?.emoji || "📋";
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <AdminSidebar />

      <main className="flex-1 p-8">
        {/* 헤더 */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900">메뉴 관리</h1>
          <p className="text-slate-500 mt-1">퀵메뉴 추가/수정/삭제 및 순서 변경</p>
        </div>

        {/* 미리보기 */}
        <Card className="border-0 shadow-lg rounded-2xl mb-6">
          <CardContent className="p-6">
            <h2 className="font-bold text-slate-800 mb-4">📱 미리보기</h2>
            <div className="bg-gray-100 rounded-xl p-4 max-w-md">
              <div className="grid grid-cols-4 gap-3">
                {menus.filter(m => m.is_active).slice(0, 8).map((menu) => (
                  <div key={menu.id} className="flex flex-col items-center">
                    <div className={`w-12 h-12 ${menu.color || 'bg-emerald-500'} rounded-2xl flex items-center justify-center text-white text-xl shadow-md`}>
                      {getIconEmoji(menu.icon)}
                    </div>
                    <span className="text-xs text-gray-700 mt-1.5 font-medium">{menu.title}</span>
                  </div>
                ))}
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-3">* 활성화된 메뉴 최대 8개까지 표시됩니다</p>
          </CardContent>
        </Card>

        {/* 등록 버튼 */}
        <div className="flex justify-end mb-6">
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700 h-12 px-6">
                <Plus className="h-5 w-5 mr-2" />
                메뉴 추가
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader className="pb-4 border-b">
                <DialogTitle className="text-xl font-bold">
                  {editingMenu ? "메뉴 수정" : "새 메뉴 추가"}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-5 py-4">
                {/* 메뉴명 */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">메뉴명 <span className="text-red-500">*</span></Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="예: 글쓰기"
                    className="h-11"
                  />
                </div>

                {/* 아이콘 선택 */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">아이콘</Label>
                  <div className="grid grid-cols-6 gap-2 max-h-40 overflow-y-auto p-2 border rounded-xl">
                    {AVAILABLE_ICONS.map((icon) => (
                      <button
                        key={icon.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, icon: icon.value })}
                        className={`p-2 rounded-lg text-xl transition-all ${
                          formData.icon === icon.value
                            ? "bg-emerald-100 ring-2 ring-emerald-500"
                            : "hover:bg-slate-100"
                        }`}
                        title={icon.label}
                      >
                        {icon.emoji}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 배경색 선택 */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">배경색</Label>
                  <div className="flex flex-wrap gap-2">
                    {BACKGROUND_COLORS.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, color: color.value })}
                        className={`w-8 h-8 rounded-full transition-all ${
                          formData.color === color.value
                            ? "ring-2 ring-offset-2 ring-slate-400 scale-110"
                            : "hover:scale-105"
                        }`}
                        style={{ backgroundColor: color.preview }}
                        title={color.label}
                      />
                    ))}
                  </div>
                </div>

                {/* 링크 */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">링크 URL</Label>
                  <Input
                    value={formData.link}
                    onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                    placeholder="/community/write"
                    className="h-11"
                  />
                  <p className="text-xs text-slate-500">앱 내부 경로 또는 외부 URL</p>
                </div>

                {/* 미리보기 */}
                <div className="p-4 bg-slate-100 rounded-xl">
                  <p className="text-sm font-medium text-slate-600 mb-3">미리보기</p>
                  <div className="flex flex-col items-center w-fit">
                    <div className={`w-14 h-14 ${formData.color} rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg`}>
                      {getIconEmoji(formData.icon)}
                    </div>
                    <span className="text-sm text-gray-700 mt-2 font-medium">{formData.title || "메뉴명"}</span>
                  </div>
                </div>

                {/* 버튼 */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>
                    취소
                  </Button>
                  <Button onClick={handleSubmit} className="bg-emerald-600 hover:bg-emerald-700">
                    {editingMenu ? "수정하기" : "등록하기"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* 메뉴 목록 테이블 */}
        <Card className="border-0 shadow-lg rounded-2xl overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-100">
                  <TableHead className="w-16 py-4 font-semibold">순서</TableHead>
                  <TableHead className="py-4 font-semibold">아이콘</TableHead>
                  <TableHead className="py-4 font-semibold">메뉴명</TableHead>
                  <TableHead className="py-4 font-semibold">링크</TableHead>
                  <TableHead className="py-4 font-semibold">상태</TableHead>
                  <TableHead className="text-right py-4 font-semibold">관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-slate-500">
                      로딩중...
                    </TableCell>
                  </TableRow>
                ) : menus.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-slate-500">
                      등록된 메뉴가 없습니다
                    </TableCell>
                  </TableRow>
                ) : (
                  menus.map((menu, index) => (
                    <TableRow key={menu.id} className="hover:bg-slate-50">
                      <TableCell className="py-4">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => moveOrder(menu.id, "up")}
                            disabled={index === 0}
                            className="p-1 hover:bg-slate-200 rounded disabled:opacity-30"
                          >
                            <ArrowUp className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => moveOrder(menu.id, "down")}
                            disabled={index === menus.length - 1}
                            className="p-1 hover:bg-slate-200 rounded disabled:opacity-30"
                          >
                            <ArrowDown className="w-4 h-4" />
                          </button>
                          <span className="text-sm text-slate-500 ml-1">{index + 1}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className={`w-10 h-10 ${menu.color || 'bg-emerald-500'} rounded-xl flex items-center justify-center text-lg shadow`}>
                          {getIconEmoji(menu.icon)}
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <p className="font-semibold text-slate-800">{menu.title}</p>
                      </TableCell>
                      <TableCell className="py-4">
                        <code className="text-xs bg-slate-100 px-2 py-1 rounded">{menu.link}</code>
                      </TableCell>
                      <TableCell className="py-4">
                        <Badge
                          className={`cursor-pointer ${
                            menu.is_active
                              ? "bg-emerald-500 hover:bg-emerald-600"
                              : "bg-slate-400 hover:bg-slate-500"
                          }`}
                          onClick={() => toggleActive(menu.id, menu.is_active)}
                        >
                          {menu.is_active ? (
                            <><Eye className="w-3 h-3 mr-1" /> 표시</>
                          ) : (
                            <><EyeOff className="w-3 h-3 mr-1" /> 숨김</>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right py-4">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                            onClick={() => handleEdit(menu)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDelete(menu.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* 안내 */}
        <div className="mt-6 p-4 bg-blue-50 rounded-xl">
          <h3 className="font-semibold text-blue-800 mb-2">💡 사용 안내</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• 순서 버튼(↑↓)으로 메뉴 순서를 변경할 수 있습니다</li>
            <li>• 상태를 "숨김"으로 설정하면 앱에서 표시되지 않습니다</li>
            <li>• 최대 8개 메뉴까지 표시됩니다 (초과 시 우선순위 높은 메뉴만 표시)</li>
            <li>• 링크는 앱 내부 경로(예: /videos) 또는 외부 URL 모두 가능합니다</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
