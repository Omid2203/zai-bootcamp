import React from 'react';
import { Profile } from '../types';
import { Pencil, Trash2, GraduationCap, Briefcase, Calendar } from 'lucide-react';

interface ProfileCardProps {
  profile: Profile;
  onClick: (profile: Profile) => void;
  isAdmin?: boolean;
  onEdit?: (e: React.MouseEvent, profile: Profile) => void;
  onDelete?: (e: React.MouseEvent, profile: Profile) => void;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({
  profile,
  onClick,
  isAdmin,
  onEdit,
  onDelete
}) => {
  return (
    <div
      onClick={() => onClick(profile)}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden group relative"
    >
      {isAdmin && (
        <div className="absolute top-2 left-2 z-10 flex gap-2">
          <button
            onClick={(e) => onEdit && onEdit(e, profile)}
            className="p-2 bg-white/90 backdrop-blur rounded-full text-blue-600 hover:bg-blue-50 shadow-sm border border-gray-200 transition-colors"
            title="ویرایش"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => onDelete && onDelete(e, profile)}
            className="p-2 bg-white/90 backdrop-blur rounded-full text-red-600 hover:bg-red-50 shadow-sm border border-gray-200 transition-colors"
            title="حذف"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="h-24 bg-gradient-to-r from-blue-500 to-cyan-400 relative">
        <div className="absolute -bottom-10 right-6 p-1 bg-white rounded-full">
          <img
            src={profile.image_url || 'https://via.placeholder.com/80'}
            alt={profile.name}
            className="w-20 h-20 rounded-full object-cover border-2 border-white"
          />
        </div>
      </div>

      <div className="pt-12 px-6 pb-6">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
              {profile.name}
            </h3>
            {profile.expertise && (
              <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium mt-1 bg-purple-100 text-purple-700">
                {profile.expertise}
              </span>
            )}
          </div>
        </div>

        {/* Info Row */}
        <div className="mt-3 flex flex-wrap gap-3 text-xs text-gray-500">
          {profile.age && (
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>{profile.age} سال</span>
            </div>
          )}
          {profile.education && (
            <div className="flex items-center gap-1">
              <GraduationCap className="w-3 h-3" />
              <span>{profile.education}</span>
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {profile.skills.slice(0, 3).map(skill => (
            <span key={skill} className="text-xs bg-gray-50 text-gray-600 px-2 py-1 rounded border border-gray-100">
              {skill}
            </span>
          ))}
          {profile.skills.length > 3 && (
            <span className="text-xs text-gray-400 px-2 py-1">
              +{profile.skills.length - 3}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
