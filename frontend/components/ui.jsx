'use client';

import { X, Inbox, ArrowUpRight } from 'lucide-react';

export function Modal({ title, children, onClose, wide = false }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/50 p-4 backdrop-blur-sm" onMouseDown={onClose}>
      <section className={`max-h-[92vh] w-full overflow-y-auto rounded-3xl bg-cream p-5 shadow-2xl ${wide ? 'max-w-3xl' : 'max-w-lg'}`} onMouseDown={(event) => event.stopPropagation()}>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-black">{title}</h2>
          <button className="rounded-xl p-2 hover:bg-black/5" onClick={onClose} aria-label="Cerrar"><X size={20} /></button>
        </div>
        {children}
      </section>
    </div>
  );
}

export function StatCard({ label, value, helper, icon: Icon, tone = 'green' }) {
  const tones = {
    green: 'bg-mint text-forest',
    amber: 'bg-amber/20 text-[#8c5c00]',
    coral: 'bg-coral/15 text-coral',
    dark: 'bg-ink text-white',
  };
  return (
    <article className="panel p-5">
      <div className="mb-5 flex items-start justify-between">
        <span className={`grid size-11 place-items-center rounded-2xl ${tones[tone]}`}><Icon size={21} /></span>
        <ArrowUpRight className="text-black/25" size={18} />
      </div>
      <p className="text-sm font-bold text-black/45">{label}</p>
      <p className="mt-1 text-2xl font-black tracking-tight">{value}</p>
      <p className="mt-2 text-xs text-black/45">{helper}</p>
    </article>
  );
}

export function EmptyState({ text }) {
  return <div className="grid place-items-center py-14 text-center text-black/40"><Inbox className="mb-3" size={35} /><p>{text}</p></div>;
}

export function PageTitle({ eyebrow, title, description, action }) {
  return (
    <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <p className="mb-1 text-xs font-black uppercase tracking-[0.2em] text-forest">{eyebrow}</p>
        <h1 className="text-3xl font-black tracking-tight sm:text-4xl">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm text-black/50">{description}</p>
      </div>
      {action}
    </div>
  );
}
