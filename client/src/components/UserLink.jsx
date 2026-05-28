export default function UserLink({ userId, name, avatarUrl, onOpenUser, className = "" }) {
  if (!userId || !onOpenUser) {
    return <span className={className}>{name}</span>;
  }

  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onOpenUser(userId);
      }}
      className={`inline-flex items-center gap-2 text-left text-indigo-700 underline-offset-2 hover:underline ${className}`}
    >
      {avatarUrl && (
        <img src={avatarUrl} alt="" className="h-6 w-6 shrink-0 rounded-full object-cover" />
      )}
      <span>{name}</span>
    </button>
  );
}
