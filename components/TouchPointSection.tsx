import React, { useState } from 'react';
import { TouchPoint, User } from '../types';
import { touchPointService } from '../services/touchPointService';
import { TouchPointModal } from './TouchPointModal';
import { Clock, Plus, History, Send } from 'lucide-react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Card } from './ui/card';

interface TouchPointSectionProps {
  profileId: string;
  profileName: string;
  touchPoints: TouchPoint[];
  currentUser: User;
  onTouchPointAdded: () => void;
}

export const TouchPointSection: React.FC<TouchPointSectionProps> = ({
  profileId,
  profileName,
  touchPoints,
  currentUser,
  onTouchPointAdded
}) => {
  const [showModal, setShowModal] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const latestTouchPoint = touchPoints.length > 0 ? touchPoints[0] : null;

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const dayName = new Intl.DateTimeFormat('fa-IR', { weekday: 'long' }).format(date);
    const dateStr = new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
    return `${dayName}، ${dateStr}`;
  };

  const handleSubmit = async () => {
    if (!content.trim()) return;

    setIsSubmitting(true);
    try {
      // Use null for author_id if this is a fake mentor user (id starts with 'mentor-')
      const isMentor = currentUser.id.startsWith('mentor-');
      await touchPointService.addTouchPoint({
        profile_id: profileId,
        author_id: isMentor ? null : currentUser.id,
        author_name: currentUser.name || currentUser.email,
        author_avatar: currentUser.avatar_url,
        content: content.trim()
      });
      setContent('');
      setShowForm(false);
      onTouchPointAdded();
    } catch (e) {
      console.error('Error adding touch point:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-8">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-5 h-5 text-foreground" />
        <h3 className="font-bold text-lg">آخرین وضعیت</h3>
      </div>

      <Card className="p-4 bg-muted/50">
        {/* Add Button */}
        {!showForm && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowForm(true)}
            className="mb-4 text-primary"
          >
            <Plus className="w-4 h-4 ml-2" />
            افزودن وضعیت جدید
          </Button>
        )}

        {/* Add Form */}
        {showForm && (
          <div className="mb-4 bg-background rounded-lg p-4 border">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="وضعیت جدید را بنویسید..."
              rows={3}
              dir="rtl"
            />
            <div className="flex items-center gap-2 mt-3">
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !content.trim()}
                size="sm"
              >
                <Send className="w-4 h-4 ml-2" />
                {isSubmitting ? 'در حال ثبت...' : 'ثبت وضعیت'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowForm(false);
                  setContent('');
                }}
              >
                انصراف
              </Button>
            </div>
          </div>
        )}

        {/* Latest Touch Point */}
        {latestTouchPoint ? (
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <p className="leading-7 line-clamp-2">
                {latestTouchPoint.content}
              </p>
              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                <span>{latestTouchPoint.author_name}</span>
                <span>-</span>
                <span>{formatDateTime(latestTouchPoint.created_at)}</span>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">هنوز وضعیتی ثبت نشده است</p>
        )}

        {/* View All Button */}
        {touchPoints.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowModal(true)}
            className="mt-4 pt-4 border-t w-full text-primary"
          >
            <History className="w-4 h-4 ml-2" />
            مشاهده تاریخچه ({touchPoints.length} مورد)
          </Button>
        )}
      </Card>

      {/* Modal */}
      {showModal && (
        <TouchPointModal
          touchPoints={touchPoints}
          profileName={profileName}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
};
