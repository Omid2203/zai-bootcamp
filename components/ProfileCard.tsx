import React from 'react';
import { Profile, TouchPoint } from '../types';
import { Pencil, Trash2, GraduationCap, Calendar, MessageSquare } from 'lucide-react';
import { getAvatarUrl } from '../utils/avatar';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { Switch } from './ui/switch';

interface ProfileCardProps {
  profile: Profile;
  onClick: (profile: Profile) => void;
  isAdmin?: boolean;
  onEdit?: (e: React.MouseEvent, profile: Profile) => void;
  onDelete?: (e: React.MouseEvent, profile: Profile) => void;
  onToggleStatus?: (e: React.MouseEvent, profile: Profile) => void;
  latestTouchPoint?: TouchPoint | null;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({
  profile,
  onClick,
  isAdmin,
  onEdit,
  onDelete,
  onToggleStatus,
  latestTouchPoint
}) => {
  const isActive = profile.is_active !== false; // default to true

  return (
    <Card
      onClick={() => onClick(profile)}
      className="rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden group relative border-border"
    >
      {/* Admin Controls */}
      {isAdmin && (
        <div className="absolute top-2 left-2 z-10 flex gap-2">
          <div
            onClick={(e) => {
              e.stopPropagation();
              onToggleStatus && onToggleStatus(e, profile);
            }}
            className="flex items-center gap-1 bg-card/90 backdrop-blur rounded-full shadow-sm border px-2 py-1"
          >
            <Switch
              checked={isActive}
              onCheckedChange={() => {}}
              className="h-4 w-7"
            />
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => onEdit && onEdit(e, profile)}
            className="bg-card/90 backdrop-blur rounded-full shadow-sm border h-8 w-8"
            title="ویرایش"
          >
            <Pencil className="w-4 h-4 text-foreground" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => onDelete && onDelete(e, profile)}
            className="bg-white/90 backdrop-blur rounded-full shadow-sm border h-8 w-8 hover:bg-destructive/10"
            title="حذف"
          >
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
        </div>
      )}

      {/* Status Badge */}
      <div className="absolute top-2 right-2 z-10">
        <Badge variant={isActive ? "default" : "secondary"}>
          {isActive ? 'فعال' : 'غیرفعال'}
        </Badge>
      </div>

      <div className="h-24 bg-muted relative">
        <div className="absolute -bottom-10 right-6 p-1 bg-card rounded-full">
          <Avatar className="w-20 h-20 border-2 border-border">
            <AvatarImage src={getAvatarUrl(profile.name)} alt={profile.name} />
          </Avatar>
        </div>
      </div>

      <div className="pt-12 px-6 pb-6">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-bold group-hover:text-primary transition-colors">
              {profile.name}
            </h3>
            {profile.expertise && (
              <Badge variant="secondary" className="mt-1">
                {profile.expertise}
              </Badge>
            )}
          </div>
        </div>

        {/* Info Row */}
        <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
          {profile.age && (
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3 text-muted-foreground" />
              <span>{profile.age} سال</span>
            </div>
          )}
          {profile.education && (
            <div className="flex items-center gap-1">
              <GraduationCap className="w-3 h-3 text-muted-foreground" />
              <span>{profile.education}</span>
            </div>
          )}
        </div>

        {/* Latest Touch Point */}
        {latestTouchPoint && (
          <div className="mt-3 p-2 bg-muted/50 rounded-lg border border-border">
            <div className="flex items-start gap-2">
              <MessageSquare className="w-3.5 h-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
              <p className="text-xs text-muted-foreground line-clamp-2 leading-5">
                {latestTouchPoint.content}
              </p>
            </div>
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          {profile.skills.slice(0, 3).map(skill => (
            <Badge key={skill} variant="secondary" className="text-xs">
              {skill}
            </Badge>
          ))}
          {profile.skills.length > 3 && (
            <span className="text-xs text-muted-foreground px-2 py-1">
              +{profile.skills.length - 3}
            </span>
          )}
        </div>
      </div>
    </Card>
  );
};
