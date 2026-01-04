import React, { useState } from 'react';
import { Comment, User } from '../types';
import { commentService } from '../services/commentService';
import { Send, MessageCircle } from 'lucide-react';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      await commentService.addComment({
        profile_id: profileId,
        author_id: currentUser.id,
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
    <div className="mt-8 border-t border-gray-100 pt-8">
      <h3 className="font-bold text-gray-900 text-lg mb-6 flex items-center gap-2">
        <MessageCircle className="w-5 h-5" />
        نظرات و بازخوردها
      </h3>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="flex gap-3 mb-8">
        <img
          src={currentUser.avatar_url || 'https://via.placeholder.com/40'}
          alt={currentUser.name || 'User'}
          className="w-10 h-10 rounded-full border border-gray-200"
        />
        <div className="flex-1 relative">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="نظر خود را درباره این پروفایل بنویسید..."
            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 min-h-[100px] focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm"
          />
          <button
            type="submit"
            disabled={submitting || !newComment.trim()}
            className="absolute bottom-3 left-3 bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>

      {/* List */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className="text-center text-gray-500 py-4 bg-gray-50 rounded-xl text-sm">
            هنوز نظری ثبت نشده است. اولین نفر باشید!
          </p>
        ) : (
          comments.map(comment => (
            <div key={comment.id} className="flex gap-3 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
              <img
                src={comment.author_avatar || 'https://via.placeholder.com/40'}
                alt={comment.author_name}
                className="w-10 h-10 rounded-full"
              />
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-sm text-gray-800">{comment.author_name}</span>
                  <span className="text-xs text-gray-400">
                    {new Date(comment.created_at).toLocaleDateString('fa-IR')}
                  </span>
                </div>
                <p className="text-sm text-gray-600 leading-6">{comment.content}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
