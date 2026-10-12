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
    <div className="relative w-full h-full min-h-screen bg-background text-foreground flex flex-col justify-between max-w-lg mx-auto pb-6">
      {/* Top Header */}
      <header className="px-6 pt-6 pb-2 flex items-center justify-between">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center text-foreground/80 hover:text-foreground hover:bg-muted transition-all cursor-pointer"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <span className="text-xs font-semibold text-muted-foreground">Client Invitation</span>
        <div className="w-10" />
      </header>

      {/* Main Content */}
      <main className="flex-1 px-6 py-2 flex flex-col gap-5 overflow-y-auto">
        <div>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-foreground">
            Share your link
          </h1>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            Send this secure link to your client. Their completed measurements will sync automatically to your dashboard.
          </p>
        </div>

        {/* Link Box */}
        <div className="rounded-3xl bg-card border border-border p-5 flex flex-col gap-3 text-card-foreground">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Tailor Remote Link
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/15 text-primary">
              Active (47h left)
            </span>
          </div>

          <div className="flex items-center justify-between bg-muted border border-border rounded-xl px-3.5 py-3">
            <span className="font-mono text-xs text-foreground truncate mr-2">
              {link}
            </span>
            <button
              onClick={handleCopy}
              className="w-8 h-8 rounded-lg bg-card hover:bg-primary hover:text-primary-foreground flex items-center justify-center text-foreground transition-colors cursor-pointer shrink-0"
              title="Copy Link"
              aria-label="Copy Link"
            >
              {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          <p className="text-[11px] text-muted-foreground">
            Valid for 48 hours. Resolved by client email on capture completion.
          </p>
        </div>

        {/* Primary CTA */}
        <Button
          onClick={handleCopy}
          variant="default"
          className="w-full h-13"
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

        {/* LINK Settings */}
        <div className="mt-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2.5">
            Link Settings
          </h3>

          <div className="rounded-2xl bg-card border border-border divide-y divide-border text-card-foreground">
            <button
              onClick={handleRenew}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-muted/50 transition-colors cursor-pointer rounded-t-2xl"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center text-foreground">
                  <RefreshCw className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-card-foreground">Regenerate Link</h4>
                  <p className="text-[11px] text-muted-foreground">Reset the 48-hour countdown</p>
                </div>
              </div>
              <span className="text-xs text-primary font-semibold">Renew</span>
            </button>

            <button
              onClick={() => alert('Link monitoring cleared.')}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-muted/50 transition-colors cursor-pointer rounded-b-2xl"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-destructive/10 flex items-center justify-center text-destructive">
                  <Trash2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-destructive">Revoke Link</h4>
                  <p className="text-[11px] text-muted-foreground">Disable instant client submissions</p>
                </div>
              </div>
              <span className="text-xs text-destructive font-semibold">Revoke</span>
            </button>
          </div>
        </div>

        {/* Notice */}
        <div className="p-3 bg-primary/10 border border-primary/20 rounded-2xl flex items-center gap-2.5 text-xs text-primary">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>Client receives camera calibration guide automatically.</span>
        </div>
      </main>
    </div>
  );
};
