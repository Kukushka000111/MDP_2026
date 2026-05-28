const ORGANIZER_JOIN = `
  JOIN users u ON u.id = e.created_by
  LEFT JOIN (
    SELECT created_by, COUNT(*)::int AS organizer_events_count
    FROM events
    WHERE moderation_status = 'APPROVED'
    GROUP BY created_by
  ) org_stats ON org_stats.created_by = e.created_by
`;

const ORGANIZER_SELECT = `
  u.avatar_url AS organizer_avatar_url,
  u.created_at AS organizer_member_since,
  COALESCE(org_stats.organizer_events_count, 0) AS organizer_events_count,
  (
    COALESCE(NULLIF(TRIM(u.phone), ''), '') <> ''
    AND (
      COALESCE(NULLIF(TRIM(u.telegram), ''), '') <> ''
      OR COALESCE(NULLIF(TRIM(u.vk_url), ''), '') <> ''
    )
  ) AS organizer_verified
`;

module.exports = { ORGANIZER_JOIN, ORGANIZER_SELECT };
