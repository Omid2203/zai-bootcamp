import React from 'react';
import { User } from '../types';
import { Search, LogOut, User as UserIcon } from 'lucide-react';

interface HeaderProps {
  user: User | null;
  onLogout: () => void;
  searchTerm: string;
  onSearchChange: (val: string) => void;
  onHomeClick: () => void;
  showSearch: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  onLogout,
  searchTerm,
  onSearchChange,
  onHomeClick,
  showSearch
}) => {
  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm">
      <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between gap-4">

        <div className="flex items-center gap-2 cursor-pointer" onClick={onHomeClick}>
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
            Z
          </div>
          <span className="font-bold text-xl text-gray-800 hidden sm:block">مدیریت پروفایل</span>
        </div>

        {showSearch && (
          <div className="flex-1 max-w-md relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="جستجو در پروفایل‌ها..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-gray-100 border-none rounded-full py-2 pr-10 pl-4 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-gray-700"
            />
          </div>
        )}

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700 hidden md:block">{user.name || user.email}</span>
                <img
                  src={user.avatar_url || 'https://via.placeholder.com/32'}
                  alt={user.name || 'User'}
                  className="w-8 h-8 rounded-full border border-gray-200"
                />
              </div>
              <button
                onClick={onLogout}
                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                title="خروج"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </>
          ) : (
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-400">
              <UserIcon className="w-5 h-5" />
            </div>
          )}
        </div>

      </div>
    </header>
  );
};
