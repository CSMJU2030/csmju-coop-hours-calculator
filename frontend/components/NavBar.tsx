'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function NavBar({
  userId,
  isAdmin,
}: {
  userId?: string;
  isAdmin?: boolean;
}) {
  const pathname = usePathname();
  const isTeacherPage = isAdmin || pathname.startsWith('/admin');

  const displayName =
    userId ?? (isTeacherPage ? 'ผศ.-dr.กมลวรรณ ศรีวิไล' : 'นางสาวพัฒน์นรี วันพิลา');

  const roleText = isTeacherPage ? 'อาจารย์' : 'นักศึกษา';
  const badgeLetter = isTeacherPage ? 'T' : 'S';

  return (
    <>
      {/* Top Header */}
      <header className="no-print sticky top-0 z-40 w-full border-b border-slate-200/70 bg-white/85 backdrop-blur-xl">
        <div className="flex h-[76px] items-center justify-between px-5 lg:px-8">
          {/* Logo */}
          <Link
            href={isTeacherPage ? '/admin/requests' : '/dashboard'}
            className="flex items-center gap-3 group"
          >
            <Image
              src="/logo.png"
              alt="Computer Science, Maejo University"
              width={64}
              height={45}
              priority
              className="h-[45px] w-auto"
            />

            <div className="hidden sm:block">
              <p className="text-[15px] font-bold text-slate-800 leading-tight group-hover:text-blue-700 transition-colors">
                CSMJU2030
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Co-op Hours System
              </p>
            </div>
          </Link>

          {/* Profile */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-bold text-slate-800">
                {displayName}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {roleText}
              </p>
            </div>

            <div
              className={`flex h-11 w-11 items-center justify-center rounded-full font-bold text-sm transition-all duration-300 hover:scale-105 ${
                isTeacherPage
                  ? 'bg-gradient-to-br from-amber-100 to-orange-100 text-amber-800 border-2 border-amber-200'
                  : 'bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-700 border-2 border-blue-200'
              }`}
            >
              {badgeLetter}
            </div>
          </div>
        </div>
      </header>

      {/* Left Sidebar */}
      <aside className="no-print fixed left-0 top-[76px] z-30 hidden h-[calc(100vh-76px)] w-[250px] border-r border-slate-200/70 bg-white lg:flex lg:flex-col">
        <div className="flex-1 px-4 py-6">
          <p className="px-3 mb-3 text-xs font-semibold text-slate-400">
            เมนู
          </p>

          <nav className="space-y-1.5">
            {isTeacherPage ? (
              <>
                <Link
                  href="/admin/requests"
                  className={`group flex items-center rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 ${
                    pathname.startsWith('/admin/requests')
                      ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-100'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'
                  }`}
                >
                  <span
                    className={`mr-3 h-2 w-2 rounded-full transition-all duration-200 ${
                      pathname.startsWith('/admin/requests')
                        ? 'bg-blue-600 scale-110'
                        : 'bg-slate-300 group-hover:bg-blue-400'
                    }`}
                  />
                  หน้าหลักคำขอ
                </Link>

                <Link
                  href="/admin/activities"
                  className={`group flex items-center rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 ${
                    pathname.startsWith('/admin/activities')
                      ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-100'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'
                  }`}
                >
                  <span
                    className={`mr-3 h-2 w-2 rounded-full transition-all duration-200 ${
                      pathname.startsWith('/admin/activities')
                        ? 'bg-blue-600 scale-110'
                        : 'bg-slate-300 group-hover:bg-blue-400'
                    }`}
                  />
                  กิจกรรมทั้งหมด
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/dashboard"
                  className={`group flex items-center rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 ${
                    pathname === '/dashboard'
                      ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-100'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'
                  }`}
                >
                  <span
                    className={`mr-3 h-2 w-2 rounded-full transition-all duration-200 ${
                      pathname === '/dashboard'
                        ? 'bg-blue-600 scale-110'
                        : 'bg-slate-300 group-hover:bg-blue-400'
                    }`}
                  />
                  หน้าหลัก
                </Link>

                <Link
                  href="/requests"
                  className={`group flex items-center rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 ${
                    pathname.startsWith('/requests')
                      ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-100'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'
                  }`}
                >
                  <span
                    className={`mr-3 h-2 w-2 rounded-full transition-all duration-200 ${
                      pathname.startsWith('/requests')
                        ? 'bg-blue-600 scale-110'
                        : 'bg-slate-300 group-hover:bg-blue-400'
                    }`}
                  />
                  กิจกรรมที่ยื่น
                </Link>
              </>
            )}
          </nav>
        </div>

        {/* Bottom decoration */}
        <div className="border-t border-slate-100 px-6 py-5">
          <p className="text-[10px] font-semibold text-slate-400">
            CSMJU2030
          </p>
          <p className="text-[10px] text-slate-300 mt-1">
            Co-op Hours System
          </p>
          {userId && (
            <form action="/api/auth/logout" method="POST" className="mt-3">
              <button
                type="submit"
                className="text-[11px] font-semibold text-slate-400 hover:text-red-500 transition-colors"
              >
                ออกจากระบบ
              </button>
            </form>
          )}
        </div>
      </aside>
    </>
  );
}

export default NavBar;