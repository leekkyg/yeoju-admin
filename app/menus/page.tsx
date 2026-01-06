"use client";

import { useEffect, useState, useRef } from "react";
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
import { Plus, Trash2, Edit, Eye, EyeOff, ArrowUp, ArrowDown, Upload, X } from "lucide-react";
import { supabase } from "@/lib/supabase";

const R2_WORKER_URL = "https://yeoju-r2-worker.kkyg9300.workers.dev";

// 인기 Material Icons 목록
const POPULAR_MATERIAL_ICONS = [
  { code: "edit", label: "글쓰기" },
  { code: "shopping_bag", label: "쇼핑백" },
  { code: "videocam", label: "영상" },
  { code: "confirmation_number", label: "쿠폰" },
  { code: "apartment", label: "부동산" },
  { code: "restaurant", label: "맛집" },
  { code: "calendar_month", label: "일정" },
  { code: "campaign", label: "공지" },
  { code: "favorite", label: "좋아요" },
  { code: "star", label: "즐겨찾기" },
  { code: "redeem", label: "이벤트" },
  { code: "location_on", label: "지도" },
  { code: "call", label: "전화" },
  { code: "mail", label: "메일" },
  { code: "settings", label: "설정" },
  { code: "person", label: "프로필" },
  { code: "home", label: "홈" },
  { code: "search", label: "검색" },
  { code: "notifications", label: "알림" },
  { code: "payments", label: "지원금" },
  { code: "work", label: "일자리" },
  { code: "school", label: "교육" },
  { code: "local_hospital", label: "병원" },
  { code: "directions_bus", label: "교통" },
  { code: "forum", label: "커뮤니티" },
  { code: "newspaper", label: "뉴스" },
  { code: "storefront", label: "가게" },
  { code: "local_cafe", label: "카페" },
  { code: "local_parking", label: "주차" },
  { code: "fitness_center", label: "헬스" },
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
  const [uploading, setUploading] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  
  const [formData, setFormData] = useState({
    title: "",
    icon_type: "material", // emoji, material, image
    icon: "edit",
    icon_code: "edit",
    icon_url: "",
    link: "/community",
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

  // R2 업로드 함수
  const uploadToR2 = async (file: File) => {
    const fileName = `menu-icons/${Date.now()}_${file.name}`;
    const response = await fetch(`${R2_WORKER_URL}/${fileName}`, {
      method: "PUT",
      body: file,
      headers: { "Content-Type": file.type },
    });
    if (!response.ok) throw new Error("Upload failed");
    const result = await response.json();
    return result.url;
  };

  const handleSubmit = async () => {
    if (!formData.title) {
      alert("메뉴명은 필수입니다.");
      return;
    }

    setUploading(true);

    try {
      let iconUrl = formData.icon_url;

      // 이미지 업로드
      if (formData.icon_type === "image" && imageFile) {
        iconUrl = await uploadToR2(imageFile);
      }

      const menuData = {
        title: formData.title,
        icon_type: formData.icon_type,
        icon: formData.icon,
        icon_code: formData.icon_code,
        icon_url: iconUrl || null,
        link: formData.link,
        color: formData.color,
      };

      if (editingMenu) {
        const { error } = await supabase
          .from("quick_menus")
          .update(menuData)
          .eq("id", editingMenu.id);
        if (error) throw error;
        alert("메뉴가 수정되었습니다.");
      } else {
        const maxOrder = menus.length > 0 ? Math.max(...menus.map(m => m.sort_order || 0)) : 0;
        const { error } = await supabase.from("quick_menus").insert({
          ...menuData,
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
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      icon_type: "material",
      icon: "edit",
      icon_code: "edit",
      icon_url: "",
      link: "/community",
      color: "bg-emerald-500",
      sort_order: 0,
    });
    setEditingMenu(null);
    setImageFile(null);
  };

  const handleEdit = (menu: any) => {
    setEditingMenu(menu);
    setFormData({
      title: menu.title,
      icon_type: menu.icon_type || "material",
      icon: menu.icon || "edit",
      icon_code: menu.icon_code || "edit",
      icon_url: menu.icon_url || "",
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

    await supabase.from("quick_menus").update({ sort_order: targetMenu.sort_order }).eq("id", currentMenu.id);
    await supabase.from("quick_menus").update({ sort_order: currentMenu.sort_order }).eq("id", targetMenu.id);
    
    fetchMenus();
  };

  // 메뉴 아이콘 렌더링 함수
  const renderMenuIcon = (menu: any, size: "sm" | "md" | "lg" = "md") => {
    const sizeClasses = {
      sm: "w-7 h-7 text-base",
      md: "w-10 h-10 text-xl",
      lg: "w-12 h-12 text-2xl",
    };
    const iconSizeClasses = {
      sm: "text-lg",
      md: "text-2xl",
      lg: "text-3xl",
    };
    const imgSizeClasses = {
      sm: "w-5 h-5",
      md: "w-7 h-7",
      lg: "w-8 h-8",
    };

    const iconType = menu.icon_type || "material";

    if (iconType === "image" && menu.icon_url) {
      return (
        <div className={`${sizeClasses[size]} bg-white rounded-2xl flex items-center justify-center shadow-md overflow-hidden border`}>
          <img src={menu.icon_url} alt={menu.title} className={`${imgSizeClasses[size]} object-contain`} />
        </div>
      );
    }

    if (iconType === "material") {
      return (
        <div className={`${sizeClasses[size]} ${menu.color || 'bg-emerald-500'} rounded-2xl flex items-center justify-center shadow-md`}>
          <span className={`material-symbols-outlined text-white ${iconSizeClasses[size]}`} style={{ fontVariationSettings: "'FILL' 1" }}>
            {menu.icon_code || "edit"}
          </span>
        </div>
      );
    }

    // emoji fallback
    return (
      <div className={`${sizeClasses[size]} ${menu.color || 'bg-emerald-500'} rounded-2xl flex items-center justify-center shadow-md`}>
        <span className="text-white">{menu.icon || "📋"}</span>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Material Icons 폰트 로드 */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,1,0"
      />
      
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
                    {renderMenuIcon(menu, "lg")}
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
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
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

                {/* 아이콘 타입 선택 */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold">아이콘 타입</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, icon_type: "material" })}
                      className={`p-3 rounded-xl border-2 transition-all ${
                        formData.icon_type === "material"
                          ? "border-emerald-500 bg-emerald-50"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>edit</span>
                      <p className="text-sm font-medium mt-1">Google Icons</p>
                      <p className="text-xs text-slate-500">다양한 스타일</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, icon_type: "image" })}
                      className={`p-3 rounded-xl border-2 transition-all ${
                        formData.icon_type === "image"
                          ? "border-emerald-500 bg-emerald-50"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <Upload className="w-6 h-6 mx-auto" />
                      <p className="text-sm font-medium mt-1">이미지 업로드</p>
                      <p className="text-xs text-slate-500">PNG, SVG 등</p>
                    </button>
                  </div>
                </div>

                {/* Material Icons 선택 */}
                {formData.icon_type === "material" && (
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold">Google Material Icons</Label>
                    <div className="grid grid-cols-6 gap-2 max-h-48 overflow-y-auto p-2 border rounded-xl">
                      {POPULAR_MATERIAL_ICONS.map((icon) => (
                        <button
                          key={icon.code}
                          type="button"
                          onClick={() => setFormData({ ...formData, icon_code: icon.code })}
                          className={`p-2 rounded-lg transition-all flex flex-col items-center ${
                            formData.icon_code === icon.code
                              ? "bg-emerald-100 ring-2 ring-emerald-500"
                              : "hover:bg-slate-100"
                          }`}
                          title={icon.label}
                        >
                          <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                            {icon.code}
                          </span>
                        </button>
                      ))}
                    </div>
                    
                    {/* 직접 입력 */}
                    <div className="space-y-2">
                      <Label className="text-xs text-slate-600">또는 아이콘 코드 직접 입력</Label>
                      <Input
                        value={formData.icon_code}
                        onChange={(e) => setFormData({ ...formData, icon_code: e.target.value })}
                        placeholder="예: shopping_bag"
                        className="h-10"
                      />
                      <p className="text-xs text-slate-500">
                        <a href="https://fonts.google.com/icons" target="_blank" className="text-blue-500 hover:underline">
                          Google Icons
                        </a>에서 아이콘 검색 후 이름 입력
                      </p>
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
                  </div>
                )}

                {/* 이미지 업로드 */}
                {formData.icon_type === "image" && (
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold">아이콘 이미지</Label>
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setImageFile(file);
                          // 미리보기용 URL 생성
                          const url = URL.createObjectURL(file);
                          setFormData({ ...formData, icon_url: url });
                        }
                      }}
                    />
                    <div
                      onClick={() => imageInputRef.current?.click()}
                      className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer hover:border-emerald-500 transition-colors"
                    >
                      {imageFile || formData.icon_url ? (
                        <div className="flex flex-col items-center gap-2">
                          <img 
                            src={formData.icon_url} 
                            alt="아이콘" 
                            className="w-16 h-16 object-contain rounded-xl"
                          />
                          <span className="text-emerald-600 font-medium text-sm">
                            {imageFile?.name || "업로드된 이미지"}
                          </span>
                          <button 
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              setImageFile(null);
                              setFormData({ ...formData, icon_url: "" });
                            }}
                            className="text-red-500 text-xs hover:underline"
                          >
                            삭제
                          </button>
                        </div>
                      ) : (
                        <div>
                          <Upload className="h-8 w-8 mx-auto text-slate-400 mb-2" />
                          <p className="text-slate-500 text-sm">클릭하여 이미지 선택</p>
                          <p className="text-slate-400 text-xs mt-1">PNG, SVG, JPG (권장: 128x128)</p>
                        </div>
                      )}
                    </div>

                    <p className="text-xs text-slate-500">
                      💡 <a href="https://www.flaticon.com" target="_blank" className="text-blue-500 hover:underline">Flaticon</a>에서 
                      아이콘 다운로드 후 업로드하세요
                    </p>
                  </div>
                )}

                {/* 링크 */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">링크 URL</Label>
                  <Input
                    value={formData.link}
                    onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                    placeholder="/community"
                    className="h-11"
                  />
                  <p className="text-xs text-slate-500">앱 내부 경로 또는 외부 URL</p>
                </div>

                {/* 미리보기 */}
                <div className="p-4 bg-slate-100 rounded-xl">
                  <p className="text-sm font-medium text-slate-600 mb-3">미리보기</p>
                  <div className="flex flex-col items-center w-fit">
                    {renderMenuIcon(formData, "lg")}
                    <span className="text-sm text-gray-700 mt-2 font-medium">{formData.title || "메뉴명"}</span>
                  </div>
                </div>

                {/* 버튼 */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }} disabled={uploading}>
                    취소
                  </Button>
                  <Button onClick={handleSubmit} disabled={uploading} className="bg-emerald-600 hover:bg-emerald-700">
                    {uploading ? "업로드 중..." : editingMenu ? "수정하기" : "등록하기"}
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
                        {renderMenuIcon(menu, "md")}
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
            <li>• <strong>Google Icons</strong>: 다양한 색상 배경 + 깔끔한 아이콘</li>
            <li>• <strong>이미지 업로드</strong>: Flaticon 등에서 다운받은 PNG/SVG 사용</li>
            <li>• 순서 버튼(↑↓)으로 메뉴 순서를 변경할 수 있습니다</li>
            <li>• 최대 8개 메뉴까지 표시됩니다</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
