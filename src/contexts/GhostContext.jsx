/**
 * VOID — Ghost Mode Context
 * ─────────────────────────────────────────────────────────────
 * Provides a global isGhostMode boolean that, when true, replaces
 * all monetary amounts across the app with aesthetic words.
 *
 * Persists to localStorage so state survives page refreshes.
 */

import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const GhostContext = createContext(null);

const AESTHETIC_WORDS = [
  "Nebula", "Quantum", "Velvet", "Echo", "Zenith", "Solstice", "Aurora", "Obelisk", "Prism", "Stellar",
  "Atlas", "Solace", "Flux", "Aether", "Loom", "Vortex", "Pulse", "Eon", "Haze", "Lumina",
  "Nova", "Orbit", "Abyss", "Arcane", "Astral", "Aura", "Beacon", "Bliss", "Breeze", "Cascade",
  "Celestial", "Cipher", "Clarity", "Cobalt", "Comet", "Cosmos", "Crystal", "Dawn", "Drift", "Dusk",
  "Eclipse", "Ember", "Enigma", "Essence", "Ether", "Fable", "Fathom", "Flare", "Flora", "Fossil",
  "Galaxy", "Glimmer", "Halo", "Haven", "Helix", "Horizon", "Icon", "Illusion", "Infinity", "Insight",
  "Ion", "Iris", "Jade", "Jewel", "Kindle", "Kinetic", "Labyrinth", "Lagoon", "Legacy", "Legend",
  "Lens", "Level", "Light", "Lucid", "Lullaby", "Lunar", "Lustre", "Lyric", "Magic", "Magnet",
  "Mantle", "Marble", "Matrix", "Maze", "Melody", "Memory", "Meridian", "Meteor", "Mirage", "Mirror",
  "Mist", "Momentum", "Monarch", "Moon", "Mosaic", "Motif", "Muse", "Mystic", "Myth", "Nadir",
  "Native", "Natural", "Nautical", "Near", "Neon", "Nexus", "Night", "Nimbus", "Noble", "Nomad",
  "North", "Notion", "Novel", "Nucleus", "Oasis", "Ocean", "Ode", "Olive", "Omega", "Omen",
  "Onyx", "Opal", "Optic", "Oracle", "Origin", "Orion", "Outpost", "Ozone", "Pacific", "Palette",
  "Panorama", "Parable", "Paradigm", "Paradox", "Paragon", "Parallel", "Particle", "Passage", "Passion", "Passive",
  "Pastel", "Path", "Pattern", "Peak", "Pearl", "Pendent", "Percept", "Perfect", "Phase", "Phenomenon",
  "Phoenix", "Photon", "Pillar", "Pilot", "Pivot", "Pixel", "Placid", "Planet", "Plasma", "Plateau",
  "Pledge", "Poem", "Polar", "Portal", "Poster", "Power", "Prelude", "Presence", "Primal", "Prime",
  "Primitive", "Prince", "Profile", "Project", "Prologue", "Promise", "Prompt", "Prophecy", "Prophet", "Prospect",
  "Proton", "Prototype", "Proverb", "Proxy", "Purity", "Pyramid", "Quaint", "Quartz", "Quest", "Quiet",
  "Quintessence", "Quiver", "Radiant", "Radical", "Rain", "Range", "Rapture", "Rare", "Ratio", "Realm",
  "Obsidian", "Mirage", "Labyrinth", "Zenith", "Quasar", "Petrichor", "Aether", "Halcyon", "Ethereal", "Luminous",
  "Evanescent", "Ephemeral", "Serendipity", "Resonance", "Synchronicity", "Tranquil", "Elysian", "Phosphene", "Soliloquy", "Mellifluous",
  "Ebullient", "Ineffable", "Incandescent", "Ethereal", "Aurora", "Celestial", "Galactic", "Infinite", "Stellar", "Cosmic",
  "Apex", "Nadir", "Zenith", "Horizon", "Meridian", "Longitude", "Latitude", "Equator", "Solstice", "Equinox",
  "Pinnacle", "Summit", "Crest", "Vertex", "Acme", "Peak", "Vantage", "Climax", "Apex", "Zenith",
  "Luster", "Sheen", "Gloss", "Glaze", "Shimmer", "Glint", "Sparkle", "Twinkle", "Radiance", "Glow",
  "Echo", "Resonance", "Reverb", "Harmony", "Melody", "Rhythm", "Tempo", "Cadence", "Lyric", "Verse",
  "Quartz", "Onyx", "Jade", "Amber", "Opal", "Ruby", "Sapphire", "Emerald", "Pearl", "Diamond",
  "Satin", "Velvet", "Silk", "Lace", "Wool", "Linen", "Cotton", "Denim", "Canvas", "Leather",
  "Prism", "Lens", "Glass", "Mirror", "Crystal", "Optic", "Vision", "Sight", "Focus", "View",
  "Breeze", "Wind", "Gale", "Storm", "Mist", "Cloud", "Rain", "Snow", "Frost", "Haze",
  "Leaf", "Root", "Stem", "Petal", "Bloom", "Floral", "Moss", "Fern", "Oak", "Pine",
  "River", "Stream", "Brook", "Creek", "Lake", "Ocean", "Sea", "Wave", "Tide", "Shore",
  "Desert", "Dune", "Sand", "Arid", "Heat", "Cold", "Ice", "Snow", "Glacier", "Arctic",
  "Fossil", "Relic", "Artifact", "Ancient", "Primal", "Historic", "Legacy", "Myth", "Legend", "Fable",
  "Kinetic", "Static", "Fluid", "Solid", "Gas", "Plasma", "Energy", "Power", "Force", "Pulse",
  "Vector", "Scalar", "Tensor", "Matrix", "Cipher", "Code", "Binary", "Digital", "Logic", "Data",
  "Nova", "Supernova", "Nebula", "Galaxy", "Cluster", "Vacuum", "Void", "Gravity", "Mass", "Orbit",
  "Stellar", "Lunar", "Solar", "Astral", "Planetary", "Cometary", "Meteor", "Impact", "Crater", "Ray",
  "Purity", "Essence", "Soul", "Spirit", "Mind", "Thought", "Idea", "Concept", "Notion", "Dream",
  "Bliss", "Joy", "Peace", "Calm", "Silent", "Quiet", "Still", "Hush", "Serene", "Mild",
  "Grand", "Noble", "Royal", "Elite", "Prime", "First", "Alpha", "Omega", "Zion", "Eden",
  "Lush", "Rich", "Green", "Bloom", "Fruit", "Seed", "Grain", "Harvest", "Season", "Cycle",
  "Vivid", "Bright", "Sharp", "Clear", "Pure", "Clean", "Fresh", "New", "Old", "Wise",
  "Bold", "Brave", "Stout", "Strong", "Hard", "Soft", "Firm", "Loose", "Tight", "Fast",
  "Slow", "Swift", "Quick", "Rapid", "Instant", "Eternal", "Ever", "Once", "Twice", "Triple",
  "Silver", "Gold", "Bronze", "Copper", "Iron", "Steel", "Lead", "Zinc", "Tin", "Nickel",
  "Rose", "Violet", "Lily", "Daisy", "Tulip", "Lotus", "Orchid", "Poppy", "Ivy", "Fern",
  "Azure", "Crimson", "Indigo", "Amber", "Emerald", "Cyan", "Magenta", "Yellow", "Black", "White",
  "Grey", "Beige", "Tan", "Brown", "Teal", "Olive", "Navy", "Maroon", "Silver", "Gold",
  "North", "South", "East", "West", "Up", "Down", "Left", "Right", "Front", "Back",
  "Circle", "Square", "Sphere", "Cube", "Point", "Line", "Plane", "Shape", "Form", "Size",
  "Solid", "Void", "Empty", "Full", "High", "Low", "Deep", "Wide", "Long", "Short",
  "Hot", "Cold", "Warm", "Cool", "Dry", "Wet", "Damp", "Moist", "Fire", "Ice",
  "Sun", "Moon", "Star", "Earth", "World", "Space", "Time", "Life", "Death", "Truth",
  "Faith", "Hope", "Love", "Care", "Kind", "Good", "Best", "Only", "Unique", "Rare",
  "Zen", "Tao", "Yoga", "Heal", "Rest", "Sleep", "Wake", "Rise", "Fall", "Flow",
  "Aura", "Mana", "Chi", "Soul", "Bond", "Link", "Sync", "Mesh", "Grid", "Network",
  "Flame", "Spark", "Ember", "Ash", "Dust", "Smoke", "Steam", "Vapor", "Dew", "Mist",
  "Rock", "Stone", "Clay", "Mud", "Dirt", "Soil", "Land", "Ground", "Base", "Core",
  "Alpha", "Beta", "Gamma", "Delta", "Epsilon", "Zeta", "Eta", "Theta", "Iota", "Kappa",
  "Lambda", "Mu", "Nu", "Xi", "Omicron", "Pi", "Rho", "Sigma", "Tau", "Upsilon",
  "Phi", "Chi", "Psi", "Omega", "Zero", "One", "Ten", "First", "Last", "End",
  "Urban", "Rural", "Wild", "Free", "Bound", "Open", "Closed", "Near", "Far", "Way",
  "Path", "Road", "Gate", "Door", "Key", "Lock", "Safe", "Secret", "Hidden", "Found",
  "Lost", "Seek", "Hide", "Run", "Walk", "Jump", "Fly", "Swim", "Dive", "Climb",
  "Song", "Tune", "Beat", "Drum", "Bell", "Harp", "Lute", "Pipe", "Flute", "Reed",
  "Gold", "Silt", "Loam", "Peat", "Marl", "Tuff", "Skarn", "Chert", "Flint", "Slate"
];

function shuffleArray(array) {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

export function GhostProvider({ children }) {
  const [isGhostMode, setIsGhostMode] = useState(() => {
    try {
      return localStorage.getItem('void_ghost') === 'true';
    } catch {
      return false;
    }
  });

  const [shuffledWords, setShuffledWords] = useState(() => shuffleArray(AESTHETIC_WORDS));

  // Persist to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem('void_ghost', String(isGhostMode));
    } catch {
      // Ignore storage errors
    }
  }, [isGhostMode]);

  const toggleGhost = useCallback(() => {
    setIsGhostMode((prev) => {
      const next = !prev;
      // Reshuffle when turning ON
      if (next) {
        setShuffledWords(shuffleArray(AESTHETIC_WORDS));
      }
      return next;
    });
  }, []);

  return (
    <GhostContext.Provider value={{ isGhostMode, toggleGhost, shuffledWords }}>
      {children}
    </GhostContext.Provider>
  );
}

/** Access ghost mode state and toggle from any component. */
export function useGhost() {
  const ctx = useContext(GhostContext);
  if (!ctx) throw new Error('useGhost must be used inside <GhostProvider>');
  return ctx;
}
