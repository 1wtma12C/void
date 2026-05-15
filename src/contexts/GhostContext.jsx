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
  "Quintessence", "Quiver", "Radiant", "Radical", "Rain", "Range", "Rapture", "Rare", "Ratio", "Realm"
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
