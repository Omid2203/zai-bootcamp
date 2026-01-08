import React from 'react';
import { TouchPoint } from '../types';
import { Clock, User } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { ScrollArea } from './ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';

interface TouchPointModalProps {
  touchPoints: TouchPoint[];
  profileName: string;
  onClose: () => void;
}

export const TouchPointModal: React.FC<TouchPointModalProps> = ({
  touchPoints,
  profileName,
  onClose
}) => {
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const dayName = new Intl.DateTimeFormat('fa-IR', { weekday: 'long' }).format(date);
    const dateStr = new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
    return `${dayName}، ${dateStr}`;
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>تاریخچه وضعیت‌ها</DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">{profileName}</p>
        </DialogHeader>

        <ScrollArea className="h-[60vh] pr-4">
          {touchPoints.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              هنوز وضعیتی ثبت نشده است
            </div>
          ) : (
            <div className="space-y-4">
              {touchPoints.map((tp, index) => (
                <div
                  key={tp.id}
                  className="relative pr-8 pb-4"
                >
                  {/* Timeline line */}
                  {index < touchPoints.length - 1 && (
                    <div className="absolute right-[11px] top-6 bottom-0 w-0.5 bg-border" />
                  )}

                  {/* Timeline dot */}
                  <div className="absolute right-0 top-1.5 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                    <div className="w-2.5 h-2.5 bg-blue-600 rounded-full" />
                  </div>

                  {/* Content */}
                  <div className="bg-muted rounded-xl p-4">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="flex items-center gap-2 text-sm">
                        {tp.author_avatar ? (
                          <Avatar className="w-6 h-6">
                            <AvatarImage src={tp.author_avatar} alt={tp.author_name} />
                            <AvatarFallback>
                              <User className="w-3 h-3" />
                            </AvatarFallback>
                          </Avatar>
                        ) : (
                          <User className="w-4 h-4" />
                        )}
                        <span className="font-medium">{tp.author_name}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mr-auto">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{formatDateTime(tp.created_at)}</span>
                      </div>
                    </div>
                    <p className="leading-7 whitespace-pre-wrap">
                      {tp.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
