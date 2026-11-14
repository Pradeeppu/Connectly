import React from 'react';
import { Shield, AlertTriangle, Lock, Ban, CheckCircle2, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export const SafetyPage: React.FC = () => {
  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto w-full">
      <div className="mb-6">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300 font-semibold mb-3 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Chat
        </Link>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2.5">
          <Shield className="w-6 h-6 text-emerald-400" />
          Safety & Guidelines
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1">
          Connectly is an anonymous platform built for safe, friendly 1-on-1 conversations.
        </p>
      </div>

      <div className="space-y-4 text-xs sm:text-sm leading-relaxed">
        {/* 18+ Adult Policy */}
        <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20">
          <div className="flex items-center gap-2.5 mb-1.5">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            <h2 className="text-sm font-bold text-amber-200">18+ Adults Only</h2>
          </div>
          <p className="text-zinc-300 text-xs">
            Connectly is strictly for adults aged 18 and older. Any predatory or inappropriate conduct involving minors results in an immediate permanent ban.
          </p>
        </div>

        {/* Rules Card */}
        <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3">
          <h2 className="text-sm font-bold text-white mb-2">Rules of Conduct</h2>

          <div className="space-y-2.5">
            <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-zinc-950 border border-zinc-800">
              <Ban className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-zinc-200 text-xs block">No Harassment or Bullying</strong>
                <p className="text-zinc-400 text-[11px]">Hate speech, racism, and abusive threats will get you banned.</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-zinc-950 border border-zinc-800">
              <Lock className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-zinc-200 text-xs block">Protect Your Privacy</strong>
                <p className="text-zinc-400 text-[11px]">Do not share phone numbers, social media handles, or passwords with strangers.</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-zinc-950 border border-zinc-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-zinc-200 text-xs block">One-Click Block & Skip</strong>
                <p className="text-zinc-400 text-[11px]">If someone makes you uncomfortable, click Stop/Skip or Block to never see them again.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
