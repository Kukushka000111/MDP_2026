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
            <a href={link.href} target="_blank" rel="noreferrer" className="text-blue-600 underline hover:text-blue-800">
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
