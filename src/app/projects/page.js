import ProjectsClient from './ProjectsClient';
import { localProjects, driveMeta } from './data';
import { getDriveProjects } from '@/lib/drive';

export const metadata = {
  title: 'Projects',
};

// Refresh hourly so newly-added Drive folders / files appear automatically.
export const revalidate = 3600;

/* Merge Drive subfolders with local projects, applying any
   driveMeta overrides, then sort chronologically (newest first). */
function buildProjects(driveProjects) {
  const fromDrive = driveProjects.map((d) => {
    const meta = driveMeta[d.id] || {};
    return {
      id: `drive-${d.id}`,
      driveFolderId: d.id,
      title: meta.title || d.folderName,
      subtitle: meta.subtitle || '',
      category: meta.category || 'science',
      date: meta.date || '', // empty dates sort to the bottom
      icon: meta.icon || '📁',
      summary: meta.summary || '',
      media: d.media,
    };
  });

  const all = [...localProjects, ...fromDrive];
  // Newest first. Undated entries (e.g. freshly added Drive folders
  // without a driveMeta entry yet) sort to the top — they're presumed
  // recent until you backfill the date in data.js.
  all.sort((a, b) => {
    if (!a.date && !b.date) return 0;
    if (!a.date) return -1;
    if (!b.date) return 1;
    return b.date.localeCompare(a.date);
  });
  return all;
}

export default async function ProjectsPage() {
  const driveProjects = await getDriveProjects();
  const projects = buildProjects(driveProjects);
  return <ProjectsClient projects={projects} />;
}
