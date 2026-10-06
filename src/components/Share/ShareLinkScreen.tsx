import React, { useState } from 'react';
import { Button } from '../ui/button';
import { ArrowLeft, Copy, Check, RefreshCw, Trash2, ShieldAlert } from 'lucide-react';

interface ShareLinkScreenProps {
  onBack: () => void;
}

export const ShareLinkScreen: React.FC<ShareLinkScreenProps> = ({ onBack }) => {
  const [copied, setCopied] = useState(false);
  const [link, setLink] = useState('measureme.app/t/ada-wedding-90');

  const handleCopy = () => {
    navigator.clipboard?.writeText(`https://${link}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRenew = () => {
    const randomCode = Math.random().toString(36).substring(2, 7);
    setLink(`measureme.app/t/ada-wedding-${randomCode}`);
    alert('48-hour expiring link regenerated successfully!');
  };

  return (
    <div className="relative w-full h-full min-h-screen bg-[#0A0A0E] text-white flex flex-col justify-between max-w-lg mx-auto pb-6">
      {/* Top Header */}
      <header className="px-6 pt-6 pb-2 flex items-center justify-between">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-[#161622] border border-white/5 flex items-center justify-center text-white/80 hover:text-white hover:bg-[#1E1E2E] transition-all cursor-pointer"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <span className="text-xs font-semibold text-[#8E8CA3]">Client Invitation</span>
        <div className="w-10" />
      </header>

      {/* Main Content */}
      <main className="flex-1 px-6 py-2 flex flex-col gap-5 overflow-y-auto">
        <div>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-white">
            Share your link
          </h1>
          <p className="text-xs text-[#8E8CA3] mt-1 leading-relaxed">
            Send this secure link to your client. Their completed measurements will sync automatically to your dashboard.
          </p>
        </div>

        {/* Link Box matching App share your link screen.png */}
        <div className="rounded-3xl bg-[#14141E] border border-white/10 p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#8E8CA3] uppercase tracking-wider">
              Tailor Remote Link
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#27D07F]/15 text-[#27D07F]">
              Active (47h left)
            </span>
          </div>

          <div className="flex items-center justify-between bg-[#0A0A0E] border border-white/10 rounded-xl px-3.5 py-3">
            <span className="font-mono text-xs text-white/90 truncate mr-2">
              {link}
            </span>
            <button
              onClick={handleCopy}
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-[#27D07F] hover:text-neutral-950 flex items-center justify-center text-white transition-colors cursor-pointer shrink-0"
              title="Copy Link"
              aria-label="Copy Link"
            >
              {copied ? <Check className="w-4 h-4 text-[#27D07F]" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          <p className="text-[11px] text-[#5A586D]">
            Valid for 48 hours. Resolved by client email on capture completion.
          </p>
        </div>

        {/* Primary CTA */}
        <Button
          onClick={handleCopy}
          variant="default"
          className="w-full h-13 rounded-2xl bg-[#27D07F] hover:bg-[#22BD73] text-neutral-950 font-bold text-base flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#27D07F]/15"
        >
          {copied ? (
            <>
              <Check className="w-5 h-5 stroke-[2.5]" />
              <span>Link Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-5 h-5" />
              <span>Share link</span>
            </>
          )}
        </Button>

        {/* LINK Settings matching App share your link screen.png */}
        <div className="mt-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#8E8CA3] mb-2.5">
            Link Settings
          </h3>

          <div className="rounded-2xl bg-[#14141E] border border-white/5 divide-y divide-white/5">
            <button
              onClick={handleRenew}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-white/5 transition-colors cursor-pointer rounded-t-2xl"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-white">
                  <RefreshCw className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">Regenerate Link</h4>
                  <p className="text-[11px] text-[#8E8CA3]">Reset the 48-hour countdown</p>
                </div>
              </div>
              <span className="text-xs text-[#27D07F] font-semibold">Renew</span>
            </button>

            <button
              onClick={() => alert('Link monitoring cleared.')}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-white/5 transition-colors cursor-pointer rounded-b-2xl"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400">
                  <Trash2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-red-400">Revoke Link</h4>
                  <p className="text-[11px] text-[#8E8CA3]">Disable instant client submissions</p>
                </div>
              </div>
              <span className="text-xs text-red-400 font-semibold">Revoke</span>
            </button>
          </div>
        </div>

        {/* Notice */}
        <div className="p-3 bg-[#B69EFF]/10 border border-[#B69EFF]/20 rounded-2xl flex items-center gap-2.5 text-xs text-[#B69EFF]">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>Client receives camera calibration guide automatically.</span>
        </div>
      </main>
    </div>
  );
};
