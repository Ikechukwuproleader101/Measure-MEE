import React, { useState } from 'react';
import { ArrowLeft, Send } from 'lucide-react';

interface CommentsScreenProps {
  onBack: () => void;
}

export const CommentsScreen: React.FC<CommentsScreenProps> = ({ onBack }) => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'resolved'>('all');
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState([
    {
      id: 1,
      author: 'Master Tailor (Tutor)',
      role: 'tailor',
      text: 'Double check shoulder slope angle before we cut master pattern #107.',
      time: '45m ago',
      status: 'pending',
      avatarBg: 'bg-accent/20 text-accent'
    },
    {
      id: 2,
      author: 'Ada Lovelace',
      role: 'client',
      text: 'Preferred a slightly higher armhole for clean drape with shirt.',
      time: '2h ago',
      status: 'resolved',
      avatarBg: 'bg-primary/20 text-primary'
    },
    {
      id: 3,
      author: 'Master Tailor (Tutor)',
      role: 'tailor',
      text: 'Confirmed! English cut drafting updated on your project canvas.',
      time: '1d ago',
      status: 'resolved',
      avatarBg: 'bg-accent/20 text-accent'
    }
  ]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setComments([
      ...comments,
      {
        id: Date.now(),
        author: 'Ada Lovelace',
        role: 'client',
        text: newComment.trim(),
        time: 'Just now',
        status: 'pending',
        avatarBg: 'bg-primary/20 text-primary'
      }
    ]);
    setNewComment('');
  };

  const filteredComments = comments.filter((c) => {
    if (filter === 'all') return true;
    return c.status === filter;
  });

  return (
    <div className="relative w-full h-full min-h-screen bg-background text-foreground flex flex-col justify-between max-w-lg mx-auto pb-4">
      {/* Top Header */}
      <header className="px-6 pt-6 pb-2 flex items-center justify-between">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center text-foreground/80 hover:text-foreground hover:bg-muted transition-all cursor-pointer"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <h1 className="font-display font-bold text-lg text-foreground">
          Comments & Notes
        </h1>

        <div className="w-10" />
      </header>

      {/* Filter Tabs */}
      <div className="px-6 py-2 flex items-center gap-2">
        {(['all', 'pending', 'resolved'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold capitalize transition-all cursor-pointer ${
              filter === tab
                ? 'bg-primary text-primary-foreground font-bold shadow-xs'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Comments List */}
      <main className="flex-1 px-6 py-3 flex flex-col gap-3.5 overflow-y-auto">
        {filteredComments.map((comment) => (
          <div
            key={comment.id}
            className="rounded-2xl bg-card border border-border p-4 flex flex-col gap-2 text-card-foreground"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${comment.avatarBg}`}>
                  {comment.author.slice(0, 1)}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-card-foreground">{comment.author}</h4>
                  <span className="text-[10px] text-muted-foreground">{comment.time}</span>
                </div>
              </div>

              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  comment.status === 'pending'
                    ? 'bg-accent/15 text-accent border border-accent/25'
                    : 'bg-primary/15 text-primary border border-primary/25'
                }`}
              >
                {comment.status}
              </span>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed pl-10">
              {comment.text}
            </p>
          </div>
        ))}
      </main>

      {/* Bottom Send Input Bar */}
      <form onSubmit={handleSend} className="px-6 pt-2">
        <div className="relative flex items-center">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a message to your tailor..."
            className="w-full h-12 bg-card border border-border rounded-2xl pl-4 pr-12 text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:border-primary focus:ring-1 focus:ring-primary transition-all"
          />
          <button
            type="submit"
            disabled={!newComment.trim()}
            className="absolute right-2 w-8 h-8 rounded-full bg-primary hover:bg-primary/90 disabled:opacity-30 disabled:pointer-events-none text-primary-foreground flex items-center justify-center cursor-pointer transition-transform active:scale-90"
            aria-label="Send"
          >
            <Send className="w-4 h-4 fill-current" />
          </button>
        </div>
      </form>
    </div>
  );
};
