/**
 * Auditory & Speech Feedback for low-literacy users
 * Built on native browser Web Audio API and Web Speech API.
 * Completely offline, zero dependencies.
 */

// 1. Auditory Confirmation Chime (Cash Register / Positive Action Sound)
export function playSuccessChime(): void {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    // First note (E5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, now);
    gain1.gain.setValueAtTime(0.15, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.25);

    // Second higher note (B5)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(987.77, now + 0.08);
    gain2.gain.setValueAtTime(0.2, now + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.08);
    osc2.stop(now + 0.45);
  } catch (e) {
    console.warn('Audio chime unsupported or blocked', e);
  }
}

// 2. Spoken Voice Feedback (Permanently disabled per user request: No robotic synthesizer)
export function speakText(_text: string, _lang: 'ar' | 'en' = 'ar'): void {
  // Voice assistant disabled
}

// 3. Deterministic Palette for Visual Party Avatars
const AVATAR_COLORS = [
  'bg-emerald-500 text-white',
  'bg-cyan-600 text-white',
  'bg-blue-600 text-white',
  'bg-indigo-600 text-white',
  'bg-purple-600 text-white',
  'bg-rose-500 text-white',
  'bg-amber-600 text-white',
  'bg-teal-600 text-white',
  'bg-orange-500 text-white',
  'bg-sky-600 text-white',
];

export function getAvatarColorClass(name: string): string {
  if (!name) return AVATAR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}
