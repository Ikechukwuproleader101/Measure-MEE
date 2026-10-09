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
      avatarBg: 'bg-[#B69EFF]/20 text-[#B69EFF]'
    },
    {
      id: 2,
      author: 'Ada Lovelace',
      role: 'client',
      text: 'Preferred a slightly higher armhole for clean drape with shirt.',
      time: '2h ago',
      status: 'resolved',
      avatarBg: 'bg-[#27D07F]/20 text-[#27D07F]'
    },
    {
      id: 3,
      author: 'Master Tailor (Tutor)',
      role: 'tailor',
      text: 'Confirmed! English cut drafting updated on your project canvas.',
      time: '1d ago',
      status: 'resolved',
      avatarBg: 'bg-[#B69EFF]/20 text-[#B69EFF]'
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
        avatarBg: 'bg-[#27D07F]/20 text-[#27D07F]'
      }
    ]);
    setNewComment('');
  };

  const filteredComments = comments.filter((c) => {
    if (filter === 'all') return true;
    return c.status === filter;
  });

  return (
    <div className="relative w-full h-full min-h-screen bg-[#0A0A0E] text-white flex flex-col justify-between max-w-lg mx-auto pb-4">
      {/* Top Header */}
      <header className="px-6 pt-6 pb-2 flex items-center justify-between">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-[#161622] border border-white/5 flex items-center justify-center text-white/80 hover:text-white hover:bg-[#1E1E2E] transition-all cursor-pointer"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <h1 className="font-display font-bold text-lg text-white">
          Comments & Notes
        </h1>

        <div className="w-10" />
      </header>

      {/* Filter Tabs matching App comment screen.png */}
      <div className="px-6 py-2 flex items-center gap-2">
        {(['all', 'pending', 'resolved'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold capitalize transition-all cursor-pointer ${
              filter === tab
                ? 'bg-[#27D07F] text-neutral-950 font-bold'
                : 'bg-[#14141E] text-[#8E8CA3] hover:text-white border border-white/5'
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
            className="rounded-2xl bg-[#14141E] border border-white/5 p-4 flex flex-col gap-2"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${comment.avatarBg}`}>
                  {comment.author.slice(0, 1)}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">{comment.author}</h4>
                  <span className="text-[10px] text-[#5A586D]">{comment.time}</span>
                </div>
              </div>

              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  comment.status === 'pending'
                    ? 'bg-[#B69EFF]/15 text-[#B69EFF]'
                    : 'bg-[#27D07F]/15 text-[#27D07F]'
                }`}
              >
                {comment.status}
              </span>
            </div>

            <p className="text-xs text-[#B4B1C9] leading-relaxed pl-10">
              {comment.text}
            </p>
          </div>
        ))}
      </main>

      {/* Bottom Send Input Bar matching App comment screen.png */}
      <form onSubmit={handleSend} className="px-6 pt-2">
        <div className="relative flex items-center">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a message to your tailor..."
            className="w-full h-12 bg-[#14141E] border border-white/10 rounded-2xl pl-4 pr-12 text-xs text-white placeholder-[#5A586D] focus:outline-hidden focus:border-[#27D07F] transition-all"
          />
          <button
            type="submit"
            disabled={!newComment.trim()}
            className="absolute right-2 w-8 h-8 rounded-full bg-[#27D07F] hover:bg-[#22BD73] disabled:opacity-30 disabled:pointer-events-none text-neutral-950 flex items-center justify-center cursor-pointer transition-transform active:scale-90"
            aria-label="Send"
          >
            <Send className="w-4 h-4 fill-neutral-950" />
          </button>
        </div>
      </form>
    </div>
  );
};
