import { buildContactLinks } from "../utils";

export default function OrganizerContacts({ event }) {
  const links = buildContactLinks(event);

  if (links.length === 0) {
    return <p className="text-sm text-slate-500">Контакты не указаны</p>;
  }

  return (
    <ul className="space-y-1 text-sm">
      {links.map((link) => (
        <li key={`${link.kind}-${link.label}`}>
          {link.href ? (
            <a href={link.href} target="_blank" rel="noreferrer" className="font-medium text-[#00AFF5] underline hover:text-[#0098d4]">
              {link.label}
            </a>
          ) : (
            <span>{link.label}</span>
          )}
        </li>
      ))}
    </ul>
  );
}
