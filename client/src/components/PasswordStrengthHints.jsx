import { getPasswordChecks } from "../validation/userValidation";

export default function PasswordStrengthHints({ password }) {
  const checks = getPasswordChecks(password);
  const done = checks.filter((item) => item.ok).length;
  const total = checks.length;
  const percent = total ? Math.round((done / total) * 100) : 0;

  return (
    <div className="password-hints">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">Надёжность пароля</p>
        <span
          className={`text-xs font-bold ${
            percent === 100
              ? "text-emerald-600 dark:text-emerald-400"
              : percent >= 50
                ? "text-amber-600 dark:text-amber-400"
                : "text-slate-400 dark:text-slate-500"
          }`}
        >
          {percent}%
        </span>
      </div>
      <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            percent === 100 ? "bg-emerald-500" : percent >= 50 ? "bg-amber-400" : "bg-slate-400 dark:bg-slate-500"
          }`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <ul className="space-y-1">
        {checks.map((item) => (
          <li
            key={item.id}
            className={`flex items-center gap-2 text-xs transition-colors ${
              item.ok ? "text-emerald-700 dark:text-emerald-400" : "text-slate-500 dark:text-slate-400"
            }`}
          >
            <span
              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                item.ok
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300"
                  : "bg-slate-200 text-slate-400 dark:bg-slate-700 dark:text-slate-500"
              }`}
            >
              {item.ok ? "✓" : "·"}
            </span>
            {item.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
