"use client";

import { useState, useEffect } from "react";
import { AdminSidebar } from "@/components/ui/admin-sidebar";
import { supabase } from "@/lib/supabase";

interface Shop {
  id: number;
  name: string;
  category: string;
  phone: string;
  address: string;
  description: string;
  logo_url: string;
  business_license_url: string;
  bank_name: string;
  bank_account: string;
  bank_holder: string;
  approval_status: string;
  created_at: string;
  user_id: string;
}

interface ShopStats {
  groupBuyCount: number;
  totalRevenue: number;
}

const statusOptions = [
  { value: "pending", label: "승인대기", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  { value: "approved", label: "승인됨", color: "bg-green-100 text-green-700 border-green-200" },
  { value: "rejected", label: "승인거절", color: "bg-red-100 text-red-700 border-red-200" },
  { value: "blocked", label: "차단", color: "bg-gray-800 text-white border-gray-800" },
];

export default function AdminShopsPage() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [userEmails, setUserEmails] = useState<{ [key: string]: string }>({});
  const [shopStats, setShopStats] = useState<{ [key: number]: ShopStats }>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected" | "blocked">("all");
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  useEffect(() => {
    fetchShops();
  }, []);

  const fetchShops = async () => {
    const { data, error } = await supabase
      .from("shops")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setShops(data);
      
      // 유저 이메일 조회
      const userIds = data.map(shop => shop.user_id).filter(Boolean);
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, email")
          .in("id", userIds);
        
        if (profiles) {
          const emailMap: { [key: string]: string } = {};
          profiles.forEach(p => {
            emailMap[p.id] = p.email;
          });
          setUserEmails(emailMap);
        }
      }

      // 상점별 통계 조회
      await fetchShopStats(data.map(s => s.id));
    }
    setLoading(false);
  };

  const fetchShopStats = async (shopIds: number[]) => {
    if (shopIds.length === 0) return;

    // 공동구매 수 조회
    const { data: groupBuys } = await supabase
      .from("group_buys")
      .select("id, shop_id, sale_price")
      .in("shop_id", shopIds);

    // 참여자 (입금완료) 조회
    const groupBuyIds = groupBuys?.map(g => g.id) || [];
    let participants: any[] = [];
    
    if (groupBuyIds.length > 0) {
      const { data } = await supabase
        .from("group_buy_participants")
        .select("group_buy_id, quantity, status")
        .in("group_buy_id", groupBuyIds)
        .eq("status", "paid");
      
      participants = data || [];
    }

    // 통계 계산
    const stats: { [key: number]: ShopStats } = {};
    
    shopIds.forEach(shopId => {
      const shopGroupBuys = groupBuys?.filter(g => g.shop_id === shopId) || [];
      const shopGroupBuyIds = shopGroupBuys.map(g => g.id);
      
      let totalRevenue = 0;
      participants.forEach(p => {
        if (shopGroupBuyIds.includes(p.group_buy_id)) {
          const groupBuy = shopGroupBuys.find(g => g.id === p.group_buy_id);
          if (groupBuy) {
            totalRevenue += (groupBuy.sale_price || 0) * (p.quantity || 1);
          }
        }
      });

      stats[shopId] = {
        groupBuyCount: shopGroupBuys.length,
        totalRevenue,
      };
    });

    setShopStats(stats);
  };

  const updateStatus = async (shopId: number, newStatus: string) => {
    const shop = shops.find(s => s.id === shopId);
    if (!shop) return;

    if (newStatus === "blocked") {
      if (!confirm(`"${shop.name}" 상점을 차단하시겠습니까?\n차단된 상점은 서비스를 이용할 수 없습니다.`)) {
        return;
      }
    }

    setUpdatingId(shopId);
    
    const { error } = await supabase
      .from("shops")
      .update({ approval_status: newStatus })
      .eq("id", shopId);

    if (error) {
      alert("오류가 발생했습니다: " + error.message);
    } else {
      setShops(shops.map(s => 
        s.id === shopId ? { ...s, approval_status: newStatus } : s
      ));
    }
    
    setUpdatingId(null);
  };

  const filteredShops = shops.filter(shop => {
    if (filter === "all") return true;
    return shop.approval_status === filter;
  });

  const getStatusOption = (status: string) => {
    return statusOptions.find(opt => opt.value === status) || statusOptions[0];
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const counts = {
    all: shops.length,
    pending: shops.filter(s => s.approval_status === "pending").length,
    approved: shops.filter(s => s.approval_status === "approved").length,
    rejected: shops.filter(s => s.approval_status === "rejected").length,
    blocked: shops.filter(s => s.approval_status === "blocked").length,
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <AdminSidebar />

      <main className="flex-1 p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">상점 관리</h1>
          <p className="text-gray-500 mt-1">입점 신청 승인 및 상점 관리</p>
        </div>

        {/* 필터 탭 */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {[
            { key: "all", label: "전체" },
            { key: "pending", label: "승인대기" },
            { key: "approved", label: "승인됨" },
            { key: "rejected", label: "승인거절" },
            { key: "blocked", label: "차단" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as typeof filter)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === tab.key
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {tab.label}
              <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs ${
                filter === tab.key ? "bg-white/20" : "bg-gray-200"
              }`}>
                {counts[tab.key as keyof typeof counts]}
              </span>
            </button>
          ))}
        </div>

        {/* 로딩 */}
        {loading && (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
          </div>
        )}

        {/* 빈 상태 */}
        {!loading && filteredShops.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <p className="text-gray-500">상점이 없습니다</p>
          </div>
        )}

        {/* 상점 목록 */}
        {!loading && filteredShops.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">상점</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">셀러</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">카테고리</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">공구 수</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">매출</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">신청일</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">상태</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">상세</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredShops.map((shop) => {
                  const currentStatus = getStatusOption(shop.approval_status);
                  const isUpdating = updatingId === shop.id;
                  const stats = shopStats[shop.id] || { groupBuyCount: 0, totalRevenue: 0 };
                  
                  return (
                    <tr key={shop.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center text-gray-500 font-bold overflow-hidden">
                            {shop.logo_url ? (
                              <img src={shop.logo_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              shop.name?.charAt(0)
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{shop.name}</p>
                            <p className="text-xs text-gray-400">{shop.phone}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm text-gray-600">{userEmails[shop.user_id] || "-"}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm text-gray-600">{shop.category}</p>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="font-semibold text-gray-900">{stats.groupBuyCount}</span>
                        <span className="text-gray-400 text-sm">건</span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <span className="font-semibold text-gray-900">{stats.totalRevenue.toLocaleString()}</span>
                        <span className="text-gray-400 text-sm">원</span>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm text-gray-500">{formatDate(shop.created_at)}</p>
                      </td>
                      <td className="px-4 py-4">
                        <select
                          value={shop.approval_status}
                          onChange={(e) => updateStatus(shop.id, e.target.value)}
                          disabled={isUpdating}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium border cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-wait ${currentStatus.color}`}
                        >
                          {statusOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-4">
                        <button
                          onClick={() => setSelectedShop(shop)}
                          className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors"
                        >
                          보기
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* 상세 모달 */}
        {selectedShop && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div 
              className="absolute inset-0 bg-black/50"
              onClick={() => setSelectedShop(null)}
            />
            
            <div className="relative w-full max-w-2xl bg-white rounded-2xl max-h-[90vh] overflow-y-auto">
              {/* 헤더 */}
              <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900">상점 상세 정보</h2>
                <button 
                  onClick={() => setSelectedShop(null)}
                  className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* 통계 카드 */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 rounded-xl p-4 text-center">
                    <p className="text-sm text-blue-600 mb-1">공동구매</p>
                    <p className="text-2xl font-bold text-blue-700">
                      {shopStats[selectedShop.id]?.groupBuyCount || 0}건
                    </p>
                  </div>
                  <div className="bg-green-50 rounded-xl p-4 text-center">
                    <p className="text-sm text-green-600 mb-1">총 매출</p>
                    <p className="text-2xl font-bold text-green-700">
                      {(shopStats[selectedShop.id]?.totalRevenue || 0).toLocaleString()}원
                    </p>
                  </div>
                </div>

                {/* 기본 정보 */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">기본 정보</h3>
                  <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-500">상점명</span>
                      <span className="font-medium text-gray-900">{selectedShop.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">카테고리</span>
                      <span className="font-medium text-gray-900">{selectedShop.category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">연락처</span>
                      <span className="font-medium text-gray-900">{selectedShop.phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">주소</span>
                      <span className="font-medium text-gray-900 text-right max-w-[250px]">{selectedShop.address}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">셀러 이메일</span>
                      <span className="font-medium text-blue-600">{userEmails[selectedShop.user_id] || "-"}</span>
                    </div>
                  </div>
                </div>

                {/* 상점 소개 */}
                {selectedShop.description && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">상점 소개</h3>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-gray-700 whitespace-pre-wrap">{selectedShop.description}</p>
                    </div>
                  </div>
                )}

                {/* 정산 정보 */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">정산 정보</h3>
                  <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-500">은행</span>
                      <span className="font-medium text-gray-900">{selectedShop.bank_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">계좌번호</span>
                      <span className="font-medium text-gray-900">{selectedShop.bank_account}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">예금주</span>
                      <span className="font-medium text-gray-900">{selectedShop.bank_holder}</span>
                    </div>
                  </div>
                </div>

                {/* 사업자등록증 */}
                {selectedShop.business_license_url && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">사업자등록증</h3>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <a 
                        href={selectedShop.business_license_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="block"
                      >
                        <img 
                          src={selectedShop.business_license_url} 
                          alt="사업자등록증" 
                          className="max-h-64 rounded-lg border border-gray-200 mx-auto"
                        />
                      </a>
                      <p className="text-xs text-gray-400 text-center mt-2">클릭하면 원본 보기</p>
                    </div>
                  </div>
                )}
              </div>

              {/* 하단 버튼 */}
              <div className="sticky bottom-0 bg-white px-6 py-4 border-t border-gray-100">
                <button
                  onClick={() => setSelectedShop(null)}
                  className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
