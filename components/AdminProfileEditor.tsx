import React, { useState, useEffect } from 'react';
import { Profile } from '../types';
import { Save, Loader2, Upload, Image as ImageIcon } from 'lucide-react';
import { storageService } from '../services/storageService';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Button } from './ui/button';

interface AdminProfileEditorProps {
  profile?: Profile | null;
  onSave: (profile: Profile) => Promise<void>;
  onCancel: () => void;
}

export const AdminProfileEditor: React.FC<AdminProfileEditorProps> = ({ profile, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Partial<Profile>>({
    name: '',
    email: '',
    phone: '',
    age: undefined,
    education: '',
    expertise: '',
    resume_link: '',
    interviewer_opinion: '',
    bio: '',
    skills: [],
    image_url: '',
  });
  const [skillsInput, setSkillsInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  useEffect(() => {
    if (profile) {
      setFormData(profile);
      setSkillsInput(profile.skills.join(', '));
      setPreviewUrl(profile.image_url || '');
    }
  }, [profile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      let imageUrl = formData.image_url || '';

      if (selectedFile) {
        const tempId = profile?.id || `temp-${Date.now()}`;
        const uploadedUrl = await storageService.uploadProfileImage(selectedFile, tempId);
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        }
      }

      const skillsArray = skillsInput.split(',').map(s => s.trim()).filter(s => s.length > 0);

      const profileData: any = {
        name: formData.name || '',
        email: formData.email || '',
        phone: formData.phone || '',
        age: formData.age,
        education: formData.education || '',
        expertise: formData.expertise || '',
        resume_link: formData.resume_link || '',
        interviewer_opinion: formData.interviewer_opinion || '',
        bio: formData.bio || '',
        skills: skillsArray,
        image_url: imageUrl,
      };

      if (profile?.id) {
        profileData.id = profile.id;
      }

      await onSave(profileData as Profile);
    } catch (err) {
      console.error('Error saving profile:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{profile ? 'ویرایش پروفایل' : 'افزودن پروفایل جدید'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name">نام و نام خانوادگی *</Label>
            <Input
              id="name"
              required
              type="text"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">ایمیل</Label>
              <Input
                id="email"
                type="email"
                dir="ltr"
                placeholder="example@email.com"
                value={formData.email || ''}
                onChange={e => setFormData({...formData, email: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">شماره همراه</Label>
              <Input
                id="phone"
                type="tel"
                dir="ltr"
                placeholder="09123456789"
                value={formData.phone || ''}
                onChange={e => setFormData({...formData, phone: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="age">سن</Label>
              <Input
                id="age"
                type="number"
                min="1"
                max="100"
                value={formData.age || ''}
                onChange={e => setFormData({...formData, age: e.target.value ? parseInt(e.target.value) : undefined})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="education">تحصیلات</Label>
              <Input
                id="education"
                type="text"
                placeholder="کارشناسی کامپیوتر"
                value={formData.education || ''}
                onChange={e => setFormData({...formData, education: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expertise">تخصص</Label>
            <Input
              id="expertise"
              type="text"
              placeholder="توسعه‌دهنده فرانت‌اند"
              value={formData.expertise || ''}
              onChange={e => setFormData({...formData, expertise: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="resume">لینک رزومه</Label>
            <Input
              id="resume"
              type="url"
              dir="ltr"
              placeholder="https://..."
              value={formData.resume_link || ''}
              onChange={e => setFormData({...formData, resume_link: e.target.value})}
              className="font-mono"
            />
          </div>

          <div className="space-y-2">
            <Label>تصویر پروفایل</Label>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" className="w-24 h-24 rounded-xl object-cover border-2" />
                ) : (
                  <div className="w-24 h-24 rounded-xl bg-muted flex items-center justify-center border-2">
                    <ImageIcon className="w-10 h-10 text-muted-foreground" />
                  </div>
                )}
              </div>

              <div className="flex-1">
                <label className="cursor-pointer block">
                  <div className="border-2 border-dashed rounded-xl p-4 hover:border-primary hover:bg-accent/50 transition-colors">
                    <div className="flex flex-col items-center gap-2 text-center">
                      <Upload className="w-6 h-6 text-muted-foreground" />
                      <div className="text-sm">
                        <span className="text-primary font-medium">انتخاب تصویر</span>
                        <p className="text-xs text-muted-foreground mt-1">PNG, JPG (حداکثر 5MB)</p>
                      </div>
                    </div>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
                {selectedFile && (
                  <p className="text-xs text-green-600 mt-2">✓ {selectedFile.name}</p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="skills">مهارت‌ها (با کاما جدا کنید)</Label>
            <Input
              id="skills"
              type="text"
              value={skillsInput}
              placeholder="React, Python, Design..."
              onChange={e => setSkillsInput(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">درباره</Label>
            <Textarea
              id="bio"
              rows={3}
              value={formData.bio || ''}
              onChange={e => setFormData({...formData, bio: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="opinion">نظر مصاحبه‌کننده</Label>
            <Textarea
              id="opinion"
              rows={3}
              placeholder="نظر شما درباره این فرد..."
              value={formData.interviewer_opinion || ''}
              onChange={e => setFormData({...formData, interviewer_opinion: e.target.value})}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="flex-1"
            >
              انصراف
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="flex-1"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin ml-2" />
                  در حال ذخیره...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 ml-2" />
                  ذخیره
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
