import React from "react";
import {
  FaBell,
  FaCalendarAlt,
  FaCheckCircle,
  FaExternalLinkAlt,
  FaSpinner,
  FaTimes,
} from "react-icons/fa";

const PosterRow = ({ item, onOpen }) => (
  <button
    type="button"
    onClick={() => onOpen(item)}
    className="flex w-full items-start gap-4 rounded-[24px] border border-white/60 bg-white/80 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:bg-white"
  >
    <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
      <FaBell className="text-sm" />
    </div>
    <div className="min-w-0 flex-1">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">{item.title}</p>
          <p className="mt-1 text-xs leading-5 text-slate-600">
            {item.description}
          </p>
        </div>
        <span className="rounded-full bg-rose-100 px-2.5 py-1 text-[11px] font-semibold text-rose-700">
          {item.badge}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
        <span>{item.brand}</span>
        {item.whenLabel ? <span>&bull; {item.whenLabel}</span> : null}
      </div>
    </div>
    <FaExternalLinkAlt className="mt-1 flex-shrink-0 text-xs text-slate-400" />
  </button>
);

const LoginStatusPoster = ({
  open,
  loading,
  error,
  reminders,
  onDismiss,
  onRefresh,
  onOpenReminder,
}) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm sm:p-6"
      onClick={(event) => {
        if (event.target === event.currentTarget) onDismiss();
      }}
    >
      <div className="mx-auto flex min-h-full max-w-4xl items-center justify-center">
        <div
          className="relative w-full overflow-hidden rounded-[32px] border border-white/60 bg-[linear-gradient(135deg,#f8fbff_0%,#eef6ff_42%,#fff7ed_100%)] shadow-[0_30px_100px_rgba(15,23,42,0.28)]"
          role="dialog"
          aria-modal="true"
          aria-label="Today's mobile updates"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.24),transparent_46%),radial-gradient(circle_at_top_right,rgba(251,146,60,0.22),transparent_36%)]" />

          <div className="relative border-b border-slate-200/70 px-6 py-6 sm:px-8">
            <div className="flex items-start justify-between gap-4">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-700">
                  <FaCalendarAlt className="text-[10px]" />
                  Login Update Poster
                </div>
                <h2 className="mt-4 text-2xl font-bold text-slate-900 sm:text-3xl">
                  Today&apos;s mobile status updates
                </h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
                  Sale and launch reminders are ready as soon as you sign in, so
                  the team can act on today&apos;s changes immediately.
                </p>
              </div>

              <button
                type="button"
                onClick={onDismiss}
                className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white/90 text-slate-500 transition hover:bg-white hover:text-slate-700"
                aria-label="Close login update poster"
              >
                <FaTimes className="text-sm" />
              </button>
            </div>
          </div>

          <div className="relative px-6 py-6 sm:px-8 sm:py-7">
            {loading ? (
              <div className="flex min-h-[16rem] flex-col items-center justify-center text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-white/85 text-sky-600 shadow-sm">
                  <FaSpinner className="animate-spin text-xl" />
                </div>
                <p className="mt-4 text-base font-semibold text-slate-900">
                  Preparing today&apos;s updates
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Checking launches and sale start times.
                </p>
              </div>
            ) : error ? (
              <div className="rounded-[28px] border border-rose-200 bg-white/90 p-6 text-center shadow-sm">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-rose-100 text-rose-600">
                  <FaBell className="text-lg" />
                </div>
                <p className="mt-4 text-base font-semibold text-slate-900">
                  Couldn&apos;t load today&apos;s updates
                </p>
                <p className="mt-1 text-sm text-slate-600">{error}</p>
                <div className="mt-5 flex justify-center gap-3">
                  <button
                    type="button"
                    onClick={onRefresh}
                    className="rounded-2xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700"
                  >
                    Retry
                  </button>
                  <button
                    type="button"
                    onClick={onDismiss}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : reminders.length === 0 ? (
              <div className="rounded-[28px] border border-emerald-200 bg-white/90 p-6 text-center shadow-sm">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-emerald-100 text-emerald-600">
                  <FaCheckCircle className="text-lg" />
                </div>
                <p className="mt-4 text-base font-semibold text-slate-900">
                  No today-specific reminders
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  The bell notification panel will still keep other upcoming and
                  release reminders available.
                </p>
                <button
                  type="button"
                  onClick={onDismiss}
                  className="mt-5 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Continue to dashboard
                </button>
              </div>
            ) : (
              <>
                <div className="mb-5 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-[24px] border border-white/70 bg-white/80 p-4 shadow-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Today
                    </p>
                    <p className="mt-2 text-3xl font-bold text-slate-900">
                      {reminders.length}
                    </p>
                    <p className="mt-1 text-xs text-slate-600">
                      launch or sale action items
                    </p>
                  </div>
                  <div className="rounded-[24px] border border-white/70 bg-white/80 p-4 shadow-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Focus
                    </p>
                    <p className="mt-2 text-lg font-semibold text-slate-900">
                      Daily launch desk
                    </p>
                    <p className="mt-1 text-xs text-slate-600">
                      quick summary right after sign-in
                    </p>
                  </div>
                  <div className="rounded-[24px] border border-white/70 bg-white/80 p-4 shadow-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Action
                    </p>
                    <p className="mt-2 text-lg font-semibold text-slate-900">
                      Open and update
                    </p>
                    <p className="mt-1 text-xs text-slate-600">
                      tap any card to jump into editing
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {reminders.map((item) => (
                    <PosterRow
                      key={item.id}
                      item={item}
                      onOpen={onOpenReminder}
                    />
                  ))}
                </div>

                <div className="mt-6 flex flex-col gap-3 border-t border-slate-200/70 pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-slate-500">
                    You can always reopen all reminders from the bell in the top
                    bar.
                  </p>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={onDismiss}
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Continue
                    </button>
                    <button
                      type="button"
                      onClick={onRefresh}
                      className="rounded-2xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700"
                    >
                      Refresh
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginStatusPoster;
