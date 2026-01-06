import React from 'react';
import { User } from '../types';
import { Search, LogOut, User as UserIcon } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';

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
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b shadow-sm">
      <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between gap-4">

        <div className="flex items-center gap-2 cursor-pointer" onClick={onHomeClick}>
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
            Z
          </div>
          <span className="font-bold text-xl hidden sm:block">مدیریت پروفایل</span>
        </div>

        {showSearch && (
          <div className="flex-1 max-w-md relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input
              type="text"
              placeholder="جستجو در پروفایل‌ها..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pr-10 rounded-full"
            />
          </div>
        )}

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium hidden md:block">{user.name || user.email}</span>
                <Avatar className="w-8 h-8">
                  <AvatarImage src={user.avatar_url || ''} alt={user.name || 'User'} />
                  <AvatarFallback>
                    <UserIcon className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onLogout}
                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                title="خروج"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </>
          ) : (
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-muted">
                <UserIcon className="w-5 h-5 text-muted-foreground" />
              </AvatarFallback>
            </Avatar>
          )}
        </div>

      </div>
    </header>
  );
};
