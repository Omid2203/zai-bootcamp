import React, { useEffect, useState } from 'react';
import { Header } from './components/Header';
import { ProfileCard } from './components/ProfileCard';
import { CommentSection } from './components/CommentSection';
import { AdminProfileEditor } from './components/AdminProfileEditor';
import { TouchPointSection } from './components/TouchPointSection';
import { Profile, User, Comment, ViewState, TouchPoint } from './types';
import { authService } from './services/authService';
import { profileService } from './services/profileService';
import { commentService } from './services/commentService';
import { touchPointService } from './services/touchPointService';
import { ChevronRight, LayoutGrid, Plus, FileText, GraduationCap, Briefcase, Calendar, Mail, Phone, UserCircle } from 'lucide-react';
import { getAvatarUrl } from './utils/avatar';
import { Button } from './components/ui/button';
import { Badge } from './components/ui/badge';
import { Avatar, AvatarImage } from './components/ui/avatar';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './components/ui/dialog';

// لیست منتورها
const MENTORS = [
  { id: 'mentor-1', name: 'پارسا عبداللهی', email: 'parsa@example.com', avatar: '/picture/mentors/پارسا عبدالهی.jpg' },
  { id: 'mentor-2', name: 'نگار پورشعبان', email: 'negar@example.com', avatar: '/picture/mentors/negar pourshaban.png' }
];

export default function App() {
  // Check if returning from OAuth (token/code in URL)
  const hasOAuthParams = authService.hasOAuthParams();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [view, setView] = useState<ViewState>('LOGIN');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(hasOAuthParams);
  const [loadingMessage, setLoadingMessage] = useState(hasOAuthParams ? 'در حال ورود به سیستم...' : '');
  const [showMentorDialog, setShowMentorDialog] = useState(false);

  // Admin States
  const [showAdminEditor, setShowAdminEditor] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);

  // Touch Points
  const [latestTouchPoints, setLatestTouchPoints] = useState<Map<string, TouchPoint>>(new Map());
  const [selectedProfileTouchPoints, setSelectedProfileTouchPoints] = useState<TouchPoint[]>([]);

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

    // Listen for auth changes
    const { data: { subscription } } = authService.onAuthStateChange(async (user) => {
      if (!isMounted) return;

      if (user) {
        setCurrentUser(user);
        setView('LIST');

        try {
          setLoadingMessage('در حال بارگذاری پروفایل‌ها...');
          const loadedProfiles = await profileService.getProfiles();
          if (isMounted) {
            setProfiles(loadedProfiles);
            const profileIds = loadedProfiles.map(p => p.id);
            const touchPointsMap = await touchPointService.getLatestTouchPointsForProfiles(profileIds);
            setLatestTouchPoints(touchPointsMap);
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

    // Initialize auth - process OAuth callback if code is in URL
    const initAuth = async () => {
      if (authService.hasOAuthParams()) {
        // Explicitly exchange code for session - this handles case where existing session prevents auto-detection
        await authService.processOAuthCallback();
      } else {
        // Just check current session
        authService.getCurrentUser();
      }
    };

    initAuth();

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

  const handleMentorLogin = async (mentorId: string) => {
    const mentor = MENTORS.find(m => m.id === mentorId);
    if (!mentor) return;

    setShowMentorDialog(false);
    setIsLoading(true);
    setLoadingMessage('در حال ورود به سیستم...');

    // Create fake user for mentor
    const mentorUser: User = {
      id: mentor.id,
      email: mentor.email,
      name: mentor.name,
      avatar_url: mentor.avatar,
      is_admin: false
    };

    setCurrentUser(mentorUser);
    setView('LIST');

    try {
      setLoadingMessage('در حال بارگذاری پروفایل‌ها...');
      const loadedProfiles = await profileService.getProfiles();
      setProfiles(loadedProfiles);
      const profileIds = loadedProfiles.map(p => p.id);
      const touchPointsMap = await touchPointService.getLatestTouchPointsForProfiles(profileIds);
      setLatestTouchPoints(touchPointsMap);
    } catch (e) {
      console.error('Error loading profiles:', e);
    } finally {
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
    const [profileComments, profileTouchPoints] = await Promise.all([
      commentService.getComments(profile.id),
      touchPointService.getTouchPoints(profile.id)
    ]);
    setComments(profileComments);
    setSelectedProfileTouchPoints(profileTouchPoints);
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

  const refreshTouchPoints = async () => {
    if (selectedProfile) {
      const profileTouchPoints = await touchPointService.getTouchPoints(selectedProfile.id);
      setSelectedProfileTouchPoints(profileTouchPoints);
      // Also update the latest touch point in the map
      if (profileTouchPoints.length > 0) {
        setLatestTouchPoints(prev => new Map(prev).set(selectedProfile.id, profileTouchPoints[0]));
      }
    }
  };

  const handleToggleStatus = async (e: React.MouseEvent, profile: Profile) => {
    e.stopPropagation();
    const newStatus = profile.is_active === false ? true : false;
    const updated = await profileService.toggleProfileStatus(profile.id, newStatus);
    if (updated) {
      setProfiles(prev => prev.map(p => p.id === profile.id ? { ...p, is_active: newStatus } : p));
      if (selectedProfile?.id === profile.id) {
        setSelectedProfile({ ...selectedProfile, is_active: newStatus });
      }
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

  const filteredProfiles = profiles
    .filter(p =>
      p.name.includes(searchTerm) ||
      (p.bio && p.bio.includes(searchTerm)) ||
      (p.expertise && p.expertise.includes(searchTerm)) ||
      p.skills.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => {
      // 1. فعال‌ها اول، غیرفعال‌ها آخر
      const isActiveA = a.is_active !== false;
      const isActiveB = b.is_active !== false;

      if (isActiveA !== isActiveB) {
        return isActiveA ? -1 : 1;
      }

      // 2. sort بر اساس آخرین touch point (جدیدترین اول)
      const touchPointA = latestTouchPoints.get(a.id);
      const touchPointB = latestTouchPoints.get(b.id);

      if (!touchPointA && !touchPointB) return 0;
      if (!touchPointA) return 1;
      if (!touchPointB) return -1;

      return new Date(touchPointB.created_at).getTime() - new Date(touchPointA.created_at).getTime();
    });

  if (isLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-muted">
        <div className="bg-card rounded-2xl shadow-lg p-8 flex flex-col items-center gap-4 max-w-sm">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="font-medium">{loadingMessage || 'در حال بارگذاری...'}</p>
          <p className="text-muted-foreground text-sm">لطفاً صبر کنید</p>
          <Button
            variant="link"
            onClick={() => {
              setIsLoading(false);
              setLoadingMessage('');
              window.history.replaceState(null, '', window.location.pathname);
            }}
            className="mt-4"
          >
            بازگشت به صفحه ورود
          </Button>
        </div>
      </div>
    );
  }

  // --- LOGIN VIEW ---
  if (view === 'LOGIN') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-4 text-center">
            <div className="mx-auto w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-primary-foreground font-bold text-3xl shadow-sm">
              Z
            </div>
            <CardTitle className="text-3xl">سیستم مدیریت پروفایل</CardTitle>
            <CardDescription className="text-base">
              پلتفرم اختصاصی برای مشاهده و مدیریت پروفایل‌های کارجویان
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              variant="outline"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full h-11 gap-3"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>{isLoading ? 'در حال ورود...' : 'ورود با گوگل'}</span>
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">یا</span>
              </div>
            </div>

            <Button
              variant="secondary"
              onClick={() => setShowMentorDialog(true)}
              disabled={isLoading}
              className="w-full h-11 gap-3"
            >
              <UserCircle className="w-5 h-5" />
              <span>ورود به عنوان منتور</span>
            </Button>
          </CardContent>
          <CardFooter className="flex-col">
            <p className="text-xs text-muted-foreground text-center">
              با ورود به سیستم، قوانین و مقررات را می‌پذیرید.
            </p>
          </CardFooter>
        </Card>

        {/* Mentor Selection Dialog */}
        <Dialog open={showMentorDialog} onOpenChange={setShowMentorDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>انتخاب منتور</DialogTitle>
              <DialogDescription>
                لطفاً از لیست زیر انتخاب کنید که به عنوان چه کسی وارد شوید.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 mt-4">
              {MENTORS.map(mentor => (
                <Button
                  key={mentor.id}
                  variant="outline"
                  onClick={() => handleMentorLogin(mentor.id)}
                  className="w-full h-auto py-3 justify-start gap-3"
                >
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={mentor.avatar} alt={mentor.name} />
                  </Avatar>
                  <p className="font-semibold text-base">{mentor.name}</p>
                </Button>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // --- MAIN LAYOUT ---
  return (
    <div className="min-h-screen bg-background pb-20">
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
            <div className="flex items-center gap-2 mb-6 text-foreground">
              <LayoutGrid className="w-5 h-5 text-foreground" />
              <h2 className="text-xl font-bold">لیست پروفایل‌ها</h2>
              <span className="bg-muted text-muted-foreground text-xs px-2 py-1 rounded-full mr-auto">
                {filteredProfiles.length} نفر
              </span>
            </div>

            {/* Admin Add Button */}
            {currentUser?.is_admin && (
               <Button
                 onClick={handleAddNewClick}
                 className="fixed bottom-6 left-6 z-40 p-6 rounded-full shadow-lg hover:scale-105 transition-transform gap-2"
               >
                 <Plus className="w-6 h-6" />
                 <span className="font-bold hidden sm:inline">افزودن پروفایل</span>
               </Button>
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
                  onToggleStatus={handleToggleStatus}
                  latestTouchPoint={latestTouchPoints.get(profile.id)}
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

            <Button
              variant="ghost"
              onClick={handleBackToList}
              className="mb-6 gap-1"
            >
              <ChevronRight className="w-5 h-5" />
              بازگشت به لیست
            </Button>

            <div className="bg-card rounded-3xl shadow-sm border border-border overflow-hidden">
              {/* Profile Header */}
              <div className="h-48 bg-muted relative">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-background opacity-10 rounded-full -mr-10 -mt-10"></div>
                 <div className="absolute bottom-0 left-0 w-24 h-24 bg-background opacity-10 rounded-full -ml-10 -mb-10"></div>

                 {/* Admin Controls on Detail Page */}
                 {currentUser.is_admin && (
                   <div className="absolute top-4 left-4 z-10 flex gap-2">
                     <Button
                       variant="outline"
                       onClick={(e) => handleEditClick(e, selectedProfile)}
                       className="bg-white/20 backdrop-blur text-white border-white/30 hover:bg-white/30 hover:text-white"
                     >
                       ویرایش پروفایل
                     </Button>
                   </div>
                 )}
              </div>

              <div className="px-8 pb-8 relative">
                <div className="flex flex-col sm:flex-row gap-6 items-start">
                  <div className="-mt-16 relative">
                    <Avatar className="w-32 h-32 rounded-2xl border-4 border-white shadow-md">
                      <AvatarImage src={getAvatarUrl(selectedProfile.name)} alt={selectedProfile.name} />
                    </Avatar>
                  </div>

                  <div className="pt-4 flex-1">
                    <h1 className="text-3xl font-bold text-foreground mb-4">{selectedProfile.name}</h1>

                    {/* Info Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                      {selectedProfile.age && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span>{selectedProfile.age} سال</span>
                        </div>
                      )}
                      {selectedProfile.education && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <GraduationCap className="w-4 h-4 text-muted-foreground" />
                          <span>{selectedProfile.education}</span>
                        </div>
                      )}
                      {selectedProfile.expertise && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Briefcase className="w-4 h-4 text-muted-foreground" />
                          <span>{selectedProfile.expertise}</span>
                        </div>
                      )}
                      {selectedProfile.email && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          <span dir="ltr">{selectedProfile.email}</span>
                        </div>
                      )}
                      {selectedProfile.phone && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          <span dir="ltr">{selectedProfile.phone}</span>
                        </div>
                      )}
                    </div>

                    {/* Skills */}
                    <div className="flex flex-wrap gap-2">
                       {selectedProfile.skills.map(skill => (
                         <Badge key={skill} variant="secondary">
                           {skill}
                         </Badge>
                       ))}
                    </div>
                  </div>
                </div>

                {/* Resume Link */}
                {selectedProfile.resume_link && (
                  <div className="mt-6">
                    <Button asChild>
                      <a
                        href={selectedProfile.resume_link}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <FileText className="w-4 h-4 ml-2" />
                        مشاهده رزومه
                      </a>
                    </Button>
                  </div>
                )}

                {/* Bio */}
                {selectedProfile.bio && (
                  <div className="mt-8">
                    <h3 className="font-bold text-foreground text-lg mb-3">درباره</h3>
                    <p className="text-muted-foreground leading-7 bg-muted/50 p-4 rounded-xl whitespace-pre-wrap">
                      {selectedProfile.bio}
                    </p>
                  </div>
                )}

                {/* Interviewer Opinion */}
                {selectedProfile.interviewer_opinion && (
                  <div className="mt-8">
                    <h3 className="font-bold text-foreground text-lg mb-3">نظر مصاحبه‌کننده</h3>
                    <p className="text-muted-foreground leading-7 bg-muted/50 p-4 rounded-xl whitespace-pre-wrap">
                      {selectedProfile.interviewer_opinion}
                    </p>
                  </div>
                )}

                {/* Touch Points Section */}
                <TouchPointSection
                  profileId={selectedProfile.id}
                  profileName={selectedProfile.name}
                  touchPoints={selectedProfileTouchPoints}
                  currentUser={currentUser}
                  onTouchPointAdded={refreshTouchPoints}
                />

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
