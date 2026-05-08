// public/js/state.js — global state shared across modules
const STATE = {
  currentUser: null,        // {id, handle, name, ...}
  viewedProfile: null,      // last opened profile data
  viewedProject: null,      // last opened project
  currentField: 'all',      // active home filter
  composeFiles: [],         // files staged in compose screen
  composeTags: [],
  composeRoles: []
};

const FIELDS = [
  { key: 'design',       label: 'Design',       icon: '◻' },
  { key: 'development',  label: 'Development',  icon: '{ }' },
  { key: 'film',         label: 'Film',         icon: '▷' },
  { key: 'photography',  label: 'Photography',  icon: '◎' },
  { key: 'music',        label: 'Music',        icon: '♩' },
  { key: 'writing',      label: 'Writing',      icon: '§' },
  { key: 'illustration', label: 'Illustration', icon: '△' },
  { key: 'marketing',    label: 'Marketing',    icon: '◬' },
  { key: 'research',     label: 'Research',     icon: '◊' },
  { key: 'architecture', label: 'Architecture', icon: '⌂' },
  { key: 'fashion',      label: 'Fashion',      icon: '✿' }
];

const FIELD_DESCS = {
  design: 'Brand identity, UI/UX, editorial, motion — all things visual design.',
  development: 'Creative code, tools, web, open source. Builders of all kinds.',
  film: 'Short films, documentary, experimental cinema. From script to screen.',
  photography: 'Documentary, portrait, conceptual — photography in all forms.',
  music: 'Composers, producers, sound designers. From ambient to experimental.',
  writing: 'Fiction, non-fiction, criticism, poetry. Words first.',
  illustration: 'Character design, world-building, editorial art, comics.',
  marketing: 'Strategy, copy, growth, brand storytelling.',
  research: 'Academic, applied, design research, ethnography.',
  architecture: 'Built environments, interior, urban, landscape, theory.',
  fashion: 'Garment design, textiles, styling, fashion theory.'
};

function fieldLabel(key) { const f = FIELDS.find(f => f.key === key); return f ? f.label : (key || 'Other'); }
function fieldIcon(key) { const f = FIELDS.find(f => f.key === key); return f ? f.icon : '◇'; }
