import MoreClient from './MoreClient';
import { getRecentLetterboxd } from '@/lib/letterboxd';
import { getJournal } from '@/lib/journal-store';

export const metadata = {
  title: 'More',
};

// Journal entries are server-side mutable, so the page can't be statically
// cached at the route level. The Letterboxd fetcher still uses its own
// hourly revalidation internally.
export const dynamic = 'force-dynamic';

export default async function MorePage() {
  const [reviews, initialJournal] = await Promise.all([
    getRecentLetterboxd(12),
    getJournal(),
  ]);
  return <MoreClient reviews={reviews} initialJournal={initialJournal} />;
}
