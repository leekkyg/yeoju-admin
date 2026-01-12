"use client";

import { useState, useEffect } from "react";
import { AdminSidebar } from "@/components/ui/admin-sidebar";
import { supabase } from "@/lib/supabase";

interface Category {
  id: number;
  name: string;
  icon: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

const emojiList = ["🍗", "🍽️", "☕", "💇", "🏪", "📦", "🛒", "🍕", "🍜", "🥗", "🎂", "💊", "👕", "📱", "🏠", "🚗"];

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [saving, setSaving] = useState(false);

  // 폼 데이터
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("📦");
  const [sortOrder, setSortOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from("shop_categories")
      .select("*")
      .order("sort_order", { ascending: true });

    if (!error && data) {
      setCategories(data);
    }
    setLoading(false);
  };

  const openAddModal = () => {
    setEditingCategory(null);
    setName("");
    setIcon("📦");
    setSortOrder(categories.length + 1);
    setIsActive(true);
    setShowModal(true);
  };

  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    setName(category.name);
    setIcon(category.icon);
    setSortOrder(category.sort_order);
    setIsActive(category.is_active);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      alert("카테고리 이름을 입력해주세요");
      return;
    }

    setSaving(true);

    try {
      if (editingCategory) {
        // 수정
        const { error } = await supabase
          .from("shop_categories")
          .update({
            name: name.trim(),
            icon,
            sort_order: sortOrder,
            is_active: isActive,
          })
          .eq("id", editingCategory.id);

        if (error) throw error;
        alert("수정되었습니다");
      } else {
        // 추가
        const { error } = await supabase
          .from("shop_categories")
          .insert({
            name: name.trim(),
            icon,
            sort_order: sortOrder,
            is_active: isActive,
          });

        if (error) throw error;
        alert("추가되었습니다");
      }

      setShowModal(false);
      fetchCategories();
    } catch (error: any) {
      alert("오류가 발생했습니다: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (category: Category) => {
    if (!confirm(`"${category.name}" 카테고리를 삭제하시겠습니까?`)) return;

    const { error } = await supabase
      .from("shop_categories")
      .delete()
      .eq("id", category.id);

    if (error) {
      alert("오류가 발생했습니다: " + error.message);
    } else {
      alert("삭제되었습니다");
      fetchCategories();
    }
  };

  const toggleActive = async (category: Category) => {
    const { error } = await supabase
      .from("shop_categories")
      .update({ is_active: !category.is_active })
      .eq("id", category.id);

    if (!error) {
      fetchCategories();
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <AdminSidebar />

      <main className="flex-1 p-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">카테고리 관리</h1>
            <p className="text-gray-500 mt-1">상점 카테고리 추가/수정/삭제</p>
          </div>
          <button
            onClick={openAddModal}
            className="px-4 py-2 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-colors"
          >
            + 카테고리 추가
          </button>
        </div>

        {/* 로딩 */}
        {loading && (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
          </div>
        )}

        {/* 카테고리 목록 */}
        {!loading && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">순서</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">아이콘</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">이름</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">상태</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {categories.map((category) => (
                  <tr key={category.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4">
                      <span className="text-gray-500">{category.sort_order}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-2xl">{category.icon}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="font-medium text-gray-900">{category.name}</span>
                    </td>
                    <td className="px-4 py-4">
                      <button
                        onClick={() => toggleActive(category)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          category.is_active
                            ? "bg-green-100 text-green-700 hover:bg-green-200"
                            : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                        }`}
                      >
                        {category.is_active ? "활성" : "비활성"}
                      </button>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditModal(category)}
                          className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors"
                        >
                          수정
                        </button>
                        <button
                          onClick={() => handleDelete(category)}
                          className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 text-sm font-medium rounded-lg transition-colors"
                        >
                          삭제
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {categories.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">카테고리가 없습니다</p>
              </div>
            )}
          </div>
        )}

        {/* 추가/수정 모달 */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div 
              className="absolute inset-0 bg-black/50"
              onClick={() => setShowModal(false)}
            />
            
            <div className="relative w-full max-w-md bg-white rounded-2xl">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-900">
                  {editingCategory ? "카테고리 수정" : "카테고리 추가"}
                </h2>
              </div>

              <div className="p-6 space-y-4">
                {/* 이름 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    카테고리 이름 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="예: 치킨/피자"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-200"
                  />
                </div>

                {/* 아이콘 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    아이콘
                  </label>
                  <div className="grid grid-cols-8 gap-2">
                    {emojiList.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setIcon(emoji)}
                        className={`w-10 h-10 text-xl rounded-lg transition-colors ${
                          icon === emoji
                            ? "bg-gray-900 ring-2 ring-gray-900"
                            : "bg-gray-100 hover:bg-gray-200"
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 정렬 순서 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    정렬 순서
                  </label>
                  <input
                    type="number"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
                    min={0}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-200"
                  />
                  <p className="text-xs text-gray-400 mt-1">숫자가 작을수록 먼저 표시됩니다</p>
                </div>

                {/* 활성 상태 */}
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">활성 상태</label>
                  <button
                    type="button"
                    onClick={() => setIsActive(!isActive)}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      isActive ? "bg-green-500" : "bg-gray-300"
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                      isActive ? "translate-x-6" : "translate-x-0.5"
                    }`} />
                  </button>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-3 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl transition-colors disabled:opacity-50"
                >
                  {saving ? "저장 중..." : "저장"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
