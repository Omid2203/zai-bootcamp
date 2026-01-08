import React, { useState } from 'react';
import { Comment, User } from '../types';
import { commentService } from '../services/commentService';
import { Send, MessageCircle } from 'lucide-react';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Separator } from './ui/separator';

interface CommentSectionProps {
  profileId: string;
  comments: Comment[];
  currentUser: User;
  onCommentAdded: () => void;
}

export const CommentSection: React.FC<CommentSectionProps> = ({
  profileId,
  comments,
  currentUser,
  onCommentAdded
}) => {
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      // Use null for author_id if this is a fake mentor user (id starts with 'mentor-')
      const isMentor = currentUser.id.startsWith('mentor-');
      await commentService.addComment({
        profile_id: profileId,
        author_id: isMentor ? null : currentUser.id,
        author_name: currentUser.name || currentUser.email,
        author_avatar: currentUser.avatar_url,
        content: newComment,
      });
      setNewComment('');
      onCommentAdded();
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('خطا در ثبت نظر');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-8 border-t pt-8">
      <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
        <MessageCircle className="w-5 h-5" />
        نظرات و بازخوردها
      </h3>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="flex gap-3 mb-8">
        <Avatar className="w-10 h-10">
          <AvatarImage src={currentUser.avatar_url || ''} alt={currentUser.name || 'User'} />
          <AvatarFallback>{currentUser.name?.charAt(0) || 'U'}</AvatarFallback>
        </Avatar>
        <div className="flex-1 relative">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="نظر خود را درباره این پروفایل بنویسید..."
            className="min-h-[100px] pr-3 pl-12"
          />
          <Button
            type="submit"
            size="icon"
            disabled={submitting || !newComment.trim()}
            className="absolute bottom-3 left-3"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </form>

      <Separator className="mb-6" />

      {/* List */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <Card className="p-4 text-center text-muted-foreground bg-muted/50">
            <p className="text-sm">هنوز نظری ثبت نشده است. اولین نفر باشید!</p>
          </Card>
        ) : (
          comments.map(comment => (
            <Card key={comment.id} className="p-4">
              <div className="flex gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={comment.author_avatar || ''} alt={comment.author_name} />
                  <AvatarFallback>{comment.author_name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-sm">{comment.author_name}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(comment.created_at)}
                    </span>
                  </div>
                  <p className="text-sm leading-6 whitespace-pre-wrap">{comment.content}</p>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
