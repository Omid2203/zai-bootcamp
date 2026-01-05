import React, { useEffect, useState } from 'react';
import { Header } from './components/Header';
import { ProfileCard } from './components/ProfileCard';
import { CommentSection } from './components/CommentSection';
import { AdminProfileEditor } from './components/AdminProfileEditor';
import { Profile, User, Comment, ViewState } from './types';
import { authService } from './services/authService';
import { profileService } from './services/profileService';
import { commentService } from './services/commentService';
import { ChevronRight, LayoutGrid, Plus, FileText, GraduationCap, Briefcase, Calendar, Mail, Phone } from 'lucide-react';

export default function App() {
  // Check if returning from OAuth (token in URL hash)
  const initialHasToken = typeof window !== 'undefined' && window.location.hash.includes('access_token');

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [view, setView] = useState<ViewState>('LOGIN');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(initialHasToken);
  const [loadingMessage, setLoadingMessage] = useState(initialHasToken ? 'در حال ورود به سیستم...' : '');

  // Admin States
  const [showAdminEditor, setShowAdminEditor] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);

  // Auto-timeout for loading state
  useEffect(() => {
    if (!isLoading) return;

    const timeout = setTimeout(() => {
      console.log('Loading timeout - resetting state');
      setIsLoading(false);
      setLoadingMessage('');
      // Clear hash from URL if stuck
      if (window.location.hash) {
        window.history.replaceState(null, '', window.location.pathname);
      }
    }, 15000); // 15 second timeout

    return () => clearTimeout(timeout);
  }, [isLoading]);

  // Initialize App
  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      try {
        // If returning from OAuth, show loading and let onAuthStateChange handle it
        const hasToken = window.location.hash.includes('access_token');
        if (hasToken) {
          setIsLoading(true);
          setLoadingMessage('در حال ورود به سیستم...');
          // Don't call getSession here - let onAuthStateChange handle the token
          // Supabase will automatically process the hash
          return;
        }

        // Only check session if no token in URL
        const user = await authService.getCurrentUser();

        if (user && isMounted) {
          setCurrentUser(user);
          setView('LIST');
          setLoadingMessage('در حال بارگذاری پروفایل‌ها...');
          const loadedProfiles = await profileService.getProfiles();
          if (isMounted) {
            setProfiles(loadedProfiles);
          }
        }
      } catch (error) {
        console.error('Init error:', error);
      } finally {
        if (isMounted && !window.location.hash.includes('access_token')) {
          setIsLoading(false);
          setLoadingMessage('');
        }
      }
    };

    // Listen for auth changes FIRST (before init)
    const { data: { subscription } } = authService.onAuthStateChange(async (user) => {
      if (!isMounted) return;

      if (user) {
        setCurrentUser(user);
        setView('LIST');
        setLoadingMessage('در حال بارگذاری پروفایل‌ها...');

        // Clear hash from URL
        if (window.location.hash) {
          window.history.replaceState(null, '', window.location.pathname);
        }

        try {
          const loadedProfiles = await profileService.getProfiles();
          if (isMounted) {
            setProfiles(loadedProfiles);
          }
        } catch (e) {
          console.error('Error loading profiles:', e);
        } finally {
          if (isMounted) {
            setIsLoading(false);
            setLoadingMessage('');
          }
        }
      } else {
        setCurrentUser(null);
        setView('LOGIN');
        setIsLoading(false);
        setLoadingMessage('');
      }
    });

    init();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      setLoadingMessage('در حال اتصال به گوگل...');
      await authService.signInWithGoogle();
      // Note: This won't reach here as signInWithGoogle redirects
    } catch (e) {
      console.error(e);
      alert('خطا در احراز هویت با گوگل');
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  const handleLogout = async () => {
    await authService.signOut();
    setCurrentUser(null);
    setSelectedProfile(null);
    setView('LOGIN');
  };

  const handleProfileClick = async (profile: Profile) => {
    setSelectedProfile(profile);
    const profileComments = await commentService.getComments(profile.id);
    setComments(profileComments);
    setView('PROFILE_DETAIL');
  };

  const handleBackToList = () => {
    setSelectedProfile(null);
    setView('LIST');
  };

  const refreshComments = async () => {
    if (selectedProfile) {
      const profileComments = await commentService.getComments(selectedProfile.id);
      setComments(profileComments);
    }
  };

  // --- Admin Functions ---
  const handleEditClick = (e: React.MouseEvent, profile: Profile) => {
    e.stopPropagation();
    setEditingProfile(profile);
    setShowAdminEditor(true);
  };

  const handleDeleteClick = async (e: React.MouseEvent, profile: Profile) => {
    e.stopPropagation();
    if (window.confirm(`آیا از حذف پروفایل "${profile.name}" اطمینان دارید؟`)) {
      await profileService.deleteProfile(profile.id);
      const updated = await profileService.getProfiles();
      setProfiles(updated);
      if (selectedProfile?.id === profile.id) {
        handleBackToList();
      }
    }
  };

  const handleAddNewClick = () => {
    setEditingProfile(null);
    setShowAdminEditor(true);
  };

  const handleSaveProfile = async (profile: Profile) => {
    if (editingProfile) {
      await profileService.updateProfile(profile.id, profile);
    } else {
      // Remove id, created_at, updated_at for creating new profile
      const { id, created_at, updated_at, ...profileData } = profile;
      await profileService.createProfile(profileData);
    }
    const updatedProfiles = await profileService.getProfiles();
    setProfiles(updatedProfiles);
    setShowAdminEditor(false);
    if (selectedProfile?.id === profile.id) {
      setSelectedProfile(profile);
    }
  };

  const filteredProfiles = profiles.filter(p =>
    p.name.includes(searchTerm) ||
    (p.bio && p.bio.includes(searchTerm)) ||
    (p.expertise && p.expertise.includes(searchTerm)) ||
    p.skills.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (isLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-100">
        <div className="bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center gap-4 max-w-sm">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-700 font-medium">{loadingMessage || 'در حال بارگذاری...'}</p>
          <p className="text-gray-400 text-sm">لطفاً صبر کنید</p>
          <button
            onClick={() => {
              setIsLoading(false);
              setLoadingMessage('');
              window.history.replaceState(null, '', window.location.pathname);
            }}
            className="mt-4 text-sm text-blue-600 hover:underline"
          >
            بازگشت به صفحه ورود
          </button>
        </div>
      </div>
    );
  }

  // --- LOGIN VIEW ---
  if (view === 'LOGIN') {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden flex flex-col items-center p-10 text-center relative">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-bold text-3xl mb-6 shadow-lg shadow-blue-200">
            Z
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">سیستم مدیریت پروفایل</h1>
          <p className="text-gray-500 mb-8 leading-7">
            پلتفرم اختصاصی برای مشاهده و مدیریت <br/> پروفایل‌های کارجویان
          </p>

          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full bg-white border border-gray-200 text-gray-700 py-3 rounded-xl flex items-center justify-center gap-3 hover:bg-gray-50 hover:shadow-md transition-all font-medium group relative overflow-hidden disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span>{isLoading ? 'در حال ورود...' : 'ورود با گوگل'}</span>
          </button>

          <p className="mt-8 text-xs text-gray-400">
            با ورود به سیستم، قوانین و مقررات را می‌پذیرید.
          </p>
        </div>
      </div>
    );
  }

  // --- MAIN LAYOUT ---
  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      <Header
        user={currentUser}
        onLogout={handleLogout}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onHomeClick={handleBackToList}
        showSearch={view === 'LIST'}
      />

      <main className="max-w-4xl mx-auto px-4 pt-8">

        {/* LIST VIEW */}
        {view === 'LIST' && (
          <div className="animate-in fade-in duration-500 relative">
            <div className="flex items-center gap-2 mb-6 text-gray-700">
              <LayoutGrid className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-bold">لیست پروفایل‌ها</h2>
              <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full mr-auto">
                {filteredProfiles.length} نفر
              </span>
            </div>

            {/* Admin Add Button */}
            {currentUser?.is_admin && (
               <button
                 onClick={handleAddNewClick}
                 className="fixed bottom-6 left-6 z-40 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 hover:scale-105 transition-all flex items-center gap-2"
               >
                 <Plus className="w-6 h-6" />
                 <span className="font-bold hidden sm:inline">افزودن پروفایل</span>
               </button>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
              {filteredProfiles.map(profile => (
                <ProfileCard
                  key={profile.id}
                  profile={profile}
                  onClick={handleProfileClick}
                  isAdmin={currentUser?.is_admin}
                  onEdit={handleEditClick}
                  onDelete={handleDeleteClick}
                />
              ))}
            </div>

            {filteredProfiles.length === 0 && (
              <div className="text-center py-20 text-gray-400">
                نتیجه‌ای یافت نشد.
              </div>
            )}
          </div>
        )}

        {/* PROFILE DETAIL VIEW */}
        {view === 'PROFILE_DETAIL' && selectedProfile && currentUser && (
          <div className="animate-in slide-in-from-bottom-4 duration-500">

            <button
              onClick={handleBackToList}
              className="mb-6 flex items-center text-gray-500 hover:text-blue-600 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
              بازگشت به لیست
            </button>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Profile Header */}
              <div className="h-48 bg-blue-600 relative">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-10 -mt-10"></div>
                 <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-10 rounded-full -ml-10 -mb-10"></div>

                 {/* Admin Controls on Detail Page */}
                 {currentUser.is_admin && (
                   <div className="absolute top-4 left-4 z-10 flex gap-2">
                     <button
                       onClick={(e) => handleEditClick(e, selectedProfile)}
                       className="px-4 py-2 bg-white/20 backdrop-blur text-white rounded-lg hover:bg-white/30 transition-colors text-sm font-medium flex items-center gap-2"
                     >
                       ویرایش پروفایل
                     </button>
                   </div>
                 )}
              </div>

              <div className="px-8 pb-8 relative">
                <div className="flex flex-col sm:flex-row gap-6 items-start">
                  <div className="-mt-16 relative">
                    <img
                      src={selectedProfile.image_url || 'https://via.placeholder.com/128'}
                      alt={selectedProfile.name}
                      className="w-32 h-32 rounded-2xl object-cover border-4 border-white shadow-md"
                    />
                  </div>

                  <div className="pt-4 flex-1">
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">{selectedProfile.name}</h1>

                    {/* Info Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                      {selectedProfile.age && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="w-4 h-4 text-blue-500" />
                          <span>{selectedProfile.age} سال</span>
                        </div>
                      )}
                      {selectedProfile.education && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <GraduationCap className="w-4 h-4 text-green-500" />
                          <span>{selectedProfile.education}</span>
                        </div>
                      )}
                      {selectedProfile.expertise && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Briefcase className="w-4 h-4 text-purple-500" />
                          <span>{selectedProfile.expertise}</span>
                        </div>
                      )}
                      {selectedProfile.email && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Mail className="w-4 h-4 text-red-500" />
                          <span dir="ltr">{selectedProfile.email}</span>
                        </div>
                      )}
                      {selectedProfile.phone && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Phone className="w-4 h-4 text-teal-500" />
                          <span dir="ltr">{selectedProfile.phone}</span>
                        </div>
                      )}
                    </div>

                    {/* Skills */}
                    <div className="flex flex-wrap gap-2">
                       {selectedProfile.skills.map(skill => (
                         <span key={skill} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm">
                           {skill}
                         </span>
                       ))}
                    </div>
                  </div>
                </div>

                {/* Resume Link */}
                {selectedProfile.resume_link && (
                  <div className="mt-6">
                    <a
                      href={selectedProfile.resume_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                    >
                      <FileText className="w-4 h-4" />
                      مشاهده رزومه
                    </a>
                  </div>
                )}

                {/* Bio */}
                {selectedProfile.bio && (
                  <div className="mt-8">
                    <h3 className="font-bold text-gray-900 text-lg mb-3">درباره</h3>
                    <p className="text-gray-600 leading-7 bg-gray-50 p-4 rounded-xl">
                      {selectedProfile.bio}
                    </p>
                  </div>
                )}

                {/* Interviewer Opinion */}
                {selectedProfile.interviewer_opinion && (
                  <div className="mt-8">
                    <h3 className="font-bold text-gray-900 text-lg mb-3">نظر مصاحبه‌کننده</h3>
                    <p className="text-gray-600 leading-7 bg-amber-50 border border-amber-200 p-4 rounded-xl">
                      {selectedProfile.interviewer_opinion}
                    </p>
                  </div>
                )}

                {/* Comments */}
                <CommentSection
                  profileId={selectedProfile.id}
                  comments={comments}
                  currentUser={currentUser}
                  onCommentAdded={refreshComments}
                />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Admin Editor Modal */}
      {showAdminEditor && (
        <AdminProfileEditor
          profile={editingProfile}
          onSave={handleSaveProfile}
          onCancel={() => setShowAdminEditor(false)}
        />
      )}
    </div>
  );
}
