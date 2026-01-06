"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FileText,
  Video,
  Megaphone,
  Settings,
  LogOut,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const menuItems = [
  { href: "/", icon: LayoutDashboard, label: "대시보드" },
  { href: "/users", icon: Users, label: "회원관리" },
  { href: "/posts", icon: FileText, label: "게시글관리" },
  { href: "/videos", icon: Video, label: "영상관리" },
  { href: "/ads", icon: Megaphone, label: "광고관리" },
  { href: "/menus", icon: Menu, label: "메뉴관리" },
  { href: "/settings", icon: Settings, label: "설정" },
];
export function AdminSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "h-screen bg-slate-900 text-white flex flex-col transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* 로고 */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-700">
        {!collapsed && (
          <span className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            여주마켓
          </span>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="text-slate-400 hover:text-white hover:bg-slate-800"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* 메뉴 */}
      <nav className="flex-1 py-4">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 mx-2 rounded-lg transition-all",
                isActive
                  ? "bg-emerald-600 text-white"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              )}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span className="font-medium">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* 하단 */}
      <div className="p-4 border-t border-slate-700">
        <Button
          variant="ghost"
          className={cn(
            "w-full text-slate-400 hover:text-white hover:bg-slate-800",
            collapsed ? "justify-center" : "justify-start gap-3"
          )}
        >
          <LogOut className="h-5 w-5" />
          {!collapsed && <span>로그아웃</span>}
        </Button>
      </div>
    </aside>
  );
}