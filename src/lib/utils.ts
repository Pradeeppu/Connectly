export function cn(...inputs: (string | undefined | null | false)[]) {
  return inputs.filter(Boolean).join(' ');
}

export function formatTime(isoString: string) {
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

export function formatDate(isoString: string) {
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

export function getInitials(name?: string) {
  if (!name) return 'U';
  return name.slice(0, 2).toUpperCase();
}

export const PRESET_AVATARS = [
  'https://api.dicebear.com/7.x/bottts/svg?seed=Shadow',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Cyber',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Cosmo',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Spark',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Nova',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Blaze',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Echo',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Vortex',
];

export const POPULAR_INTERESTS = [
  'Tech', 'Gaming', 'Music', 'Movies', 'Anime', 'Fitness', 
  'Travel', 'Coding', 'Art', 'Crypto', 'Books', 'Food'
];

export const LANGUAGES = [
  { code: 'any', label: 'Any Language' },
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'de', label: 'German' },
  { code: 'hi', label: 'Hindi' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'ja', label: 'Japanese' },
];
