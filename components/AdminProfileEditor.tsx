import React, { useState, useEffect } from 'react';
import { Profile } from '../types';
import { X, Save, Loader2 } from 'lucide-react';

interface AdminProfileEditorProps {
  profile?: Profile | null;
  onSave: (profile: Profile) => Promise<void>;
  onCancel: () => void;
}

export const AdminProfileEditor: React.FC<AdminProfileEditorProps> = ({ profile, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Partial<Profile>>({
    name: '',
    age: undefined,
    education: '',
    expertise: '',
    resume_link: '',
    interviewer_opinion: '',
    bio: '',
    skills: [],
    image_url: `https://picsum.photos/400/400?random=${Math.floor(Math.random() * 1000)}`,
  });
  const [skillsInput, setSkillsInput] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setFormData(profile);
      setSkillsInput(profile.skills.join(', '));
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const skillsArray = skillsInput.split(',').map(s => s.trim()).filter(s => s.length > 0);

    const profileData: any = {
      name: formData.name || '',
      age: formData.age,
      education: formData.education || '',
      expertise: formData.expertise || '',
      resume_link: formData.resume_link || '',
      interviewer_opinion: formData.interviewer_opinion || '',
      bio: formData.bio || '',
      skills: skillsArray,
      image_url: formData.image_url || '',
    };

    // Only include id if editing existing profile
    if (profile?.id) {
      profileData.id = profile.id;
    }

    await onSave(profileData as Profile);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-gray-900">
            {profile ? 'ویرایش پروفایل' : 'افزودن پروفایل جدید'}
          </h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">نام و نام خانوادگی *</label>
            <input
              required
              type="text"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">سن</label>
              <input
                type="number"
                min="1"
                max="100"
                value={formData.age || ''}
                onChange={e => setFormData({...formData, age: e.target.value ? parseInt(e.target.value) : undefined})}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">تحصیلات</label>
              <input
                type="text"
                placeholder="کارشناسی کامپیوتر"
                value={formData.education || ''}
                onChange={e => setFormData({...formData, education: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">تخصص</label>
            <input
              type="text"
              placeholder="توسعه‌دهنده فرانت‌اند"
              value={formData.expertise || ''}
              onChange={e => setFormData({...formData, expertise: e.target.value})}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">لینک رزومه</label>
            <input
              type="url"
              dir="ltr"
              placeholder="https://..."
              value={formData.resume_link || ''}
              onChange={e => setFormData({...formData, resume_link: e.target.value})}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-mono"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">آدرس تصویر (URL)</label>
            <input
              type="text"
              dir="ltr"
              value={formData.image_url || ''}
              onChange={e => setFormData({...formData, image_url: e.target.value})}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-mono"
            />
            {formData.image_url && (
              <img src={formData.image_url} alt="Preview" className="mt-2 w-12 h-12 rounded-full object-cover border" />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">مهارت‌ها (با کاما جدا کنید)</label>
            <input
              type="text"
              value={skillsInput}
              placeholder="React, Python, Design..."
              onChange={e => setSkillsInput(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">درباره</label>
            <textarea
              rows={3}
              value={formData.bio || ''}
              onChange={e => setFormData({...formData, bio: e.target.value})}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">نظر مصاحبه‌کننده</label>
            <textarea
              rows={3}
              placeholder="نظر شما درباره این فرد..."
              value={formData.interviewer_opinion || ''}
              onChange={e => setFormData({...formData, interviewer_opinion: e.target.value})}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              {saving ? 'در حال ذخیره...' : 'ذخیره'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
