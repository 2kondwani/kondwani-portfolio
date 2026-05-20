import MoreClient from './MoreClient';
import { getRecentLetterboxd } from '@/lib/letterboxd';

export const metadata = {
  title: 'More',
};

// Revalidate the page hourly so Letterboxd activity stays fresh.
export const revalidate = 3600;

export default async function MorePage() {
  const reviews = await getRecentLetterboxd(12);
  return <MoreClient reviews={reviews} />;
}
