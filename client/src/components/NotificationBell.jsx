import { useEffect, useRef, useState } from "react";
import { getNotifications, markAllNotificationsRead, markNotificationRead } from "../api";

export default function NotificationBell({ token, showToast }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const panelRef = useRef(null);

  async function load() {
    if (!token) return;
    try {
      const data = await getNotifications(token);
      setItems(data.items || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (_error) {
      // ignore
    }
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, [token]);

  useEffect(() => {
    function onClickOutside(event) {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  if (!token) return null;

  async function handleMarkAll() {
    await markAllNotificationsRead(token);
    await load();
    showToast("Уведомления прочитаны", "success");
  }

  async function handleRead(id) {
    await markNotificationRead(token, id);
    await load();
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        className="relative flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-50 hover:text-indigo-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-indigo-400"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Уведомления"
        title="Уведомления"
      >
        <svg
          className="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-[1100] mt-2 w-80 max-w-[90vw] rounded-2xl border border-slate-100 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900 dark:shadow-slate-950/50">
          <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2 dark:border-slate-700">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Уведомления</p>
            {unreadCount > 0 && (
              <button type="button" className="text-xs text-indigo-600 dark:text-indigo-400" onClick={handleMarkAll}>
                Прочитать все
              </button>
            )}
          </div>
          <ul className="max-h-80 overflow-y-auto">
            {items.length === 0 && (
              <li className="px-3 py-4 text-center text-sm text-muted">Пока нет уведомлений</li>
            )}
            {items.map((item) => (
              <li
                key={item.id}
                className={`border-b border-slate-100 px-3 py-2 text-sm dark:border-slate-800 ${
                  item.read_at ? "bg-white dark:bg-slate-900" : "bg-blue-50 dark:bg-indigo-950/50"
                }`}
              >
                <p className="font-medium text-slate-800 dark:text-slate-100">{item.title}</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">{item.body}</p>
                <p className="mt-1 text-[10px] text-slate-400">
                  {new Date(item.created_at).toLocaleString("ru-RU")}
                </p>
                {!item.read_at && (
                  <button
                    type="button"
                    className="mt-1 text-xs text-indigo-600 dark:text-indigo-400"
                    onClick={() => handleRead(item.id)}
                  >
                    Отметить прочитанным
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
