export default function Toast({ toasts }) {
  if (!toasts.length) return null;

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[9999] flex max-w-sm flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto rounded-lg px-4 py-3 text-sm shadow-lg ${
            toast.type === "error"
              ? "bg-rose-600 text-white"
              : toast.type === "success"
                ? "bg-emerald-600 text-white"
                : "bg-slate-800 text-white"
          }`}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}
