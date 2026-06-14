/* ==============================================
   WOLFPACK DAILY TRACKER
   ============================================== */

// ── Audio (Premium Web Audio — reverb + harmonics) ──
let _audioCtx = null;
let _reverbNode = null;

function _ctx() {
  if (!_audioCtx) {
    _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (_audioCtx.state === 'suspended') _audioCtx.resume();
  return _audioCtx;
}

// Generate a synthetic reverb impulse response for spatial depth
function _getReverb(ctx, decaySecs = 1.8) {
  if (_reverbNode) return _reverbNode;
  const sr = ctx.sampleRate, len = sr * decaySecs;
  const buf = ctx.createBuffer(2, len, sr);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.5);
    }
  }
  const conv = ctx.createConvolver();
  conv.buffer = buf;
  // Dry/wet mix
  const wet = ctx.createGain(); wet.gain.value = 0.28;
  conv.connect(wet); wet.connect(ctx.destination);
  _reverbNode = conv;
  return conv;
}

// Rich bell tone — multiple harmonics + reverb
function _bell(ctx, freq, t, dur, vol = 0.18) {
  const reverb = _getReverb(ctx);
  const master = ctx.createGain();
  master.connect(ctx.destination);
  master.connect(reverb);

  // Fundamental + harmonics at diminishing volumes
  [[1, 1.0], [2.756, 0.5], [5.404, 0.25], [8.933, 0.12]].forEach(([ratio, rel]) => {
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(master);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq * ratio, t);
    gain.gain.setValueAtTime(vol * rel, t);
    gain.gain.setTargetAtTime(0.0001, t + 0.01, dur * 0.35);
    osc.start(t); osc.stop(t + dur + 0.3);
  });
}

// Soft brushed noise burst — used for modern UI "tap" feel
function _noiseBurst(ctx, t, dur, vol = 0.06) {
  const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const src  = ctx.createBufferSource();
  const filt = ctx.createBiquadFilter();
  const gain = ctx.createGain();
  src.buffer = buf;
  filt.type = 'bandpass'; filt.frequency.value = 2400; filt.Q.value = 0.8;
  src.connect(filt); filt.connect(gain); gain.connect(ctx.destination);
  gain.gain.setValueAtTime(vol, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
  src.start(t); src.stop(t + dur);
}

// Water droplet — hydration tap
function playCheck() {
  const ctx = _ctx(), t = ctx.currentTime;
  const reverb = _getReverb(ctx);

  // 1. Initial impact click — very short filtered noise
  _noiseBurst(ctx, t, 0.025, 0.07);

  // 2. Pitch-descending "bloop" — the signature water drop tone
  const osc  = ctx.createOscillator();
  const gain = ctx.createGain();
  const filt = ctx.createBiquadFilter();
  osc.connect(filt); filt.connect(gain);
  gain.connect(ctx.destination);
  gain.connect(reverb);

  osc.type = 'sine';
  // Start high, fall quickly — water droplet pitch curve
  osc.frequency.setValueAtTime(680, t);
  osc.frequency.exponentialRampToValueAtTime(180, t + 0.18);

  filt.type = 'lowpass';
  filt.frequency.setValueAtTime(1200, t);
  filt.frequency.exponentialRampToValueAtTime(400, t + 0.2);

  gain.gain.setValueAtTime(0.0, t);
  gain.gain.linearRampToValueAtTime(0.22, t + 0.008); // fast attack
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22); // smooth decay

  osc.start(t); osc.stop(t + 0.25);

  // 3. Subtle bubble shimmer after the drop
  const bub  = ctx.createOscillator();
  const bGain = ctx.createGain();
  bub.connect(bGain); bGain.connect(reverb);
  bub.type = 'sine';
  bub.frequency.setValueAtTime(420, t + 0.1);
  bub.frequency.exponentialRampToValueAtTime(280, t + 0.28);
  bGain.gain.setValueAtTime(0.06, t + 0.1);
  bGain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
  bub.start(t + 0.1); bub.stop(t + 0.3);
}

// Checkmark — soft satisfying "tick" with a warm harmonic tap
function playCheckmark() {
  const ctx = _ctx(), t = ctx.currentTime;
  const reverb = _getReverb(ctx, 0.6);

  // Primary tap: short mid-tone bell hit
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(900, t);
  osc.frequency.exponentialRampToValueAtTime(600, t + 0.08);
  gain.gain.setValueAtTime(0.22, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
  osc.connect(gain); gain.connect(reverb); reverb.connect(ctx.destination);
  osc.start(t); osc.stop(t + 0.2);

  // Subtle harmonic shimmer
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(1800, t);
  osc2.frequency.exponentialRampToValueAtTime(1200, t + 0.06);
  gain2.gain.setValueAtTime(0.07, t);
  gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
  osc2.connect(gain2); gain2.connect(reverb); reverb.connect(ctx.destination);
  osc2.start(t); osc2.stop(t + 0.14);
}

// Notification ping — two-note descending, macOS-style
function playAlarm() {
  const ctx = _ctx(), t = ctx.currentTime;
  _bell(ctx, 880,   t,        1.0, 0.16); // A5
  _bell(ctx, 659.25, t + 0.18, 0.9, 0.11); // E5
}

// Achievement — ascending 5-note crystal arpeggio with reverb bloom
function playAchievement() {
  const ctx = _ctx(), t = ctx.currentTime;
  [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => {
    _bell(ctx, f, t + i * 0.09, 1.2 - i * 0.1, 0.13);
  });
}

// Workout complete — cinematic rise: glide sweep + power chord hit
function playWorkoutComplete() {
  const ctx = _ctx(), t = ctx.currentTime;
  const reverb = _getReverb(ctx);

  // Sweep oscillator
  const sweep = ctx.createOscillator();
  const sGain = ctx.createGain();
  sweep.connect(sGain); sGain.connect(ctx.destination); sGain.connect(reverb);
  sweep.type = 'sine';
  sweep.frequency.setValueAtTime(220, t);
  sweep.frequency.exponentialRampToValueAtTime(880, t + 0.45);
  sGain.gain.setValueAtTime(0.0, t);
  sGain.gain.linearRampToValueAtTime(0.14, t + 0.1);
  sGain.gain.exponentialRampToValueAtTime(0.001, t + 0.46);
  sweep.start(t); sweep.stop(t + 0.5);

  // Power chord hit
  [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
    _bell(ctx, f, t + 0.42 + i * 0.04, 1.8, 0.16);
  });
}

// Streak milestone — majestic chord bloom + high shimmer
function playStreakMilestone() {
  const ctx = _ctx(), t = ctx.currentTime;
  // Full major chord, all at once
  [261.63, 329.63, 392, 523.25, 659.25].forEach(f => {
    _bell(ctx, f, t, 2.5, 0.11);
  });
  // Shimmer on top
  _bell(ctx, 1318.5, t + 0.35, 1.5, 0.09);
  _bell(ctx, 2093,   t + 0.65, 1.2, 0.06);
}

// ── Default Fallback Data ──────────────────────
const DEFAULT_HYDRATION = [
  "4:30 AM – 12oz (lemon mix)", "5:45 AM – 12oz (post-WO)", "6:30 AM – 12oz (breakfast)",
  "8:30 AM – 12oz", "10:30 AM – 12oz", "12:30 PM – 12oz (lunch)",
  "3:30 PM – 12oz (snack)", "5:30 PM – 12oz", "8:30 PM – 12oz"
];
const DEFAULT_SCHEDULE = [
  "4:30 AM – Wake up, lemon + turmeric + salt water, Creatine (7 caps)",
  "5:00 AM – Strength training (Workout of the Day)", "5:45 AM – Cool down, hydrate",
  "6:00 AM – Post-workout shake", "6:30 AM – Shower + get son ready", "7:00 AM – Daycare drop-off",
  "8:00 AM – Breakfast + Supplements", "8:00 AM – Start Work From Home",
  "10:30 AM – Water + quick stretch", "12:00–1:00 PM – Lunch + 10-min walk",
  "3:30 PM – Snack", "5:00 PM – Work ends", "5:30 PM – Family Time + Dinner",
  "8:30 PM – Optional Cardio / Abs / Sauna", "9:00 PM – Herbal Tea",
  "9:15 PM – Casein Protein", "9:30–10:00 PM – Wind down + prepare for sleep"
];
const DEFAULT_WORKOUTS = {
  Sunday:    { title: "Recovery Day", items: [] },
  Monday:    { title: "Push — Chest, Shoulders, Triceps",  items: ["Bench Press – 4 sets","Shoulder Press – 3 sets","Chest Flys – 3 sets","Tricep Pushdowns – 3 sets","Lateral Raises – 3 sets","Overhead Triceps – 2 sets"] },
  Tuesday:   { title: "Pull — Back, Biceps",               items: ["Bent-Over Row – 4 sets","Lat Pulldown – 3 sets","Hammer Curls – 3 sets","Face Pulls – 3 sets","Concentration Curls – 2 sets","Punching Bag – 3 rounds"] },
  Wednesday: { title: "Legs + Core",                       items: ["Squats – 4 sets","Lunges – 3 sets","RDLs – 3 sets","Step-ups – 2 sets","Sit-ups – 3 sets","Plank – 2×45s"] },
  Thursday:  { title: "Upper Body Circuit",                items: ["Incline DB Press – 10 reps","Pull-ups / Lat Pulldown – 8–10 reps","Shoulder Press – 12 reps","Bent-Over Rows – 10 reps","Push-ups – to failure","Punching Bag – 2 min"] },
  Friday:    { title: "Glutes, Hamstrings + Core",         items: ["Hip Thrusts – 4 sets","Sumo Deadlifts – 3 sets","Glute Bridges – 2 sets","Hamstring Curls – 3 sets","Weighted Sit-ups – 3 sets"] },
  Saturday:  { title: "Abs & Cardio",                      items: ["Sit-ups – 3 sets","Ab Roller – 3 sets","Mountain Climbers – 2×1 min","Russian Twists – 2 sets","Punching Bag – 3 rounds"] }
};
const DEFAULT_QUOTES = [
  "Suffer now and live the rest of your life as a champion.",
  "Be uncommon among uncommon people.",
  "You are in danger of living a life so comfortable and soft that you will die without ever realizing your true potential.",
  "Most people who are criticizing and judging haven't even tried what you failed at.",
  "Don't stop when you're tired. Stop when you're done.",
  "The pain you feel today will be the strength you feel tomorrow.",
  "Do what is easy and your life will be hard. Do what is hard and your life will be easy.",
  "Every morning you have two choices: continue to sleep with your dreams, or wake up and chase them.",
  "The body achieves what the mind believes.",
  "Discipline is choosing between what you want now and what you want most.",
  "If you're not willing to work for it in the dark, don't expect to shine in the light.",
  "Your future self is watching you right now through your memories. Make them proud.",
  "Greatness is not born. It is built — rep by rep, day by day.",
  "The man who moves a mountain begins by carrying away small stones.",
  "You don't rise to the level of your goals. You fall to the level of your systems.",
  "Hard work beats talent when talent doesn't work hard.",
  "Success is not given. It is earned in the gym, in the weight room, on the field.",
  "Pain is temporary. Quitting lasts forever.",
  "The difference between who you are and who you want to be is what you do.",
  "Iron sharpens iron. Show up even when no one is watching.",
  "Your only competition is the man you were yesterday.",
  "Stop waiting for the right moment. Create it.",
  "Champions aren't made in the gyms. Champions are made from something deep inside them — a desire, a dream, a vision.",
  "The clock is ticking. Are you becoming the person you want to be?",
  "Motivation gets you started. Discipline keeps you going.",
  "A lion doesn't concern himself with the opinion of sheep.",
  "You have exactly one life. This is not a rehearsal.",
  "Weak people revenge. Strong people forgive. Intelligent people ignore.",
  "If it doesn't challenge you, it doesn't change you.",
  "You are not tired. You are weak. And weakness is a choice.",
  "The grind never stops. Neither do I.",
  "Success is the sum of small efforts repeated day in and day out.",
  "Be the hardest worker in the room. Every. Single. Day.",
  "The wolf does not perform for the sheep.",
  "You didn't come this far to only come this far.",
  "Stay patient. Stay consistent. The results will come.",
  "One day or day one. You decide.",
  "Normal is a setting on a washing machine. Be exceptional.",
  "The only bad workout is the one that didn't happen.",
  "Sleep less, grind more — but recover smart. That's how wolves win.",
  "Your habits are your future in disguise.",
  "The version of you that gives up is not the version you were born to be.",
  "You don't need more time. You need more focus.",
  "Do something today that your future self will thank you for.",
  "No excuses. No shortcuts. No days off from your mindset.",
  "The wolfpack doesn't wait for perfect conditions. We run in any weather.",
  "Pressure makes diamonds. Embrace the grind.",
  "Every rep is a vote for the person you are becoming.",
  "You can complain about the hill or you can conquer it. Your choice.",
  "Small daily improvements are the key to staggering long-term results.",
  "Silence the doubts. Feed the wolf.",
  "Get comfortable being uncomfortable. That's where growth lives.",
  "Today's pain is tomorrow's power.",
  "Build the life that, when you wake up, you have nothing to regret.",
  "A year from now you will wish you had started today.",
  "Work in silence. Let success make the noise.",
  "You owe it to the world to become everything you are capable of.",
  "The standard is the standard. Don't lower the bar — raise yourself.",
  "Wolves don't lose sleep over the opinions of sheep.",
  "Show up. Do the work. Go home. Repeat. That's the formula.",
  "Elite performance is not an accident. It is a decision made daily.",
  "Fear is a liar. Hard work is the truth.",
];

// ── Data Getters ───────────────────────────────
function getCustomWorkouts()  { const s = localStorage.getItem('custom_workouts');  return s ? JSON.parse(s) : JSON.parse(JSON.stringify(DEFAULT_WORKOUTS)); }
function getCustomSchedule()  { const s = localStorage.getItem('custom_schedule');  return s ? JSON.parse(s) : [...DEFAULT_SCHEDULE]; }
function getCustomHydration() { const s = localStorage.getItem('custom_hydration'); return s ? JSON.parse(s) : [...DEFAULT_HYDRATION]; }
function getDailyQuote() {
  const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
  return DEFAULT_QUOTES[dayOfYear % DEFAULT_QUOTES.length];
}

// ══════════════════════════════════════════════
// WORKOUT PLAN GENERATOR
// ══════════════════════════════════════════════

// Exercise banks keyed by [location][muscle]
const EX = {
  gym: {
    chest:    ["Barbell Bench Press – 4×8", "Incline DB Press – 3×10", "Cable Chest Fly – 3×12", "Decline Bench Press – 3×10", "Pec Deck – 3×12"],
    back:     ["Barbell Row – 4×8", "Lat Pulldown – 3×10", "Seated Cable Row – 3×12", "Face Pulls – 3×15", "Single-Arm DB Row – 3×10"],
    shoulders:["Seated DB Shoulder Press – 4×10", "Lateral Raises – 4×15", "Front Raises – 3×12", "Cable Lateral Raise – 3×15", "Rear Delt Fly – 3×12"],
    triceps:  ["Tricep Rope Pushdown – 3×12", "Overhead Tricep Extension – 3×12", "Skull Crushers – 3×10", "Dips – 3×failure", "Close-Grip Bench – 3×10"],
    biceps:   ["Barbell Curl – 4×10", "Hammer Curl – 3×12", "Preacher Curl – 3×10", "Cable Curl – 3×12", "Concentration Curl – 3×12"],
    legs:     ["Barbell Squat – 4×8", "Romanian Deadlift – 3×10", "Leg Press – 3×12", "Leg Curl – 3×12", "Leg Extension – 3×12", "Walking Lunges – 3×12"],
    glutes:   ["Hip Thrust – 4×10", "Sumo Deadlift – 3×8", "Glute Bridge – 3×15", "Cable Kickback – 3×12", "Step-Ups – 3×10"],
    core:     ["Cable Crunch – 3×15", "Hanging Leg Raise – 3×12", "Plank – 3×45s", "Russian Twist – 3×20", "Ab Roller – 3×10"],
    cardio:   ["Treadmill Run – 20 min", "Stairmaster – 15 min", "Battle Ropes – 5×30s", "Box Jumps – 3×10", "Rowing Machine – 10 min"],
  },
  home: {
    chest:    ["Push-Ups – 4×15", "DB Bench Press – 3×10", "DB Chest Fly – 3×12", "Decline Push-Ups – 3×12", "Diamond Push-Ups – 3×12"],
    back:     ["DB Bent-Over Row – 4×10", "Band Pull-Apart – 3×15", "Superman Hold – 3×12", "DB Single-Arm Row – 3×10", "Band Row – 3×12"],
    shoulders:["DB Shoulder Press – 4×10", "DB Lateral Raise – 4×15", "DB Front Raise – 3×12", "Band Lateral Raise – 3×15", "DB Arnold Press – 3×10"],
    triceps:  ["Tricep Dips (chair) – 3×12", "DB Overhead Extension – 3×12", "DB Kickback – 3×12", "Band Pushdown – 3×15", "Close-Grip Push-Ups – 3×12"],
    biceps:   ["DB Curl – 4×10", "Hammer Curl – 3×12", "Band Curl – 3×12", "DB Concentration Curl – 3×12", "Chin-Ups – 3×failure"],
    legs:     ["DB Goblet Squat – 4×12", "DB Romanian Deadlift – 3×12", "DB Lunges – 3×12", "Bulgarian Split Squat – 3×10", "Calf Raises – 4×15"],
    glutes:   ["Hip Thrust (floor) – 4×12", "DB Sumo Squat – 3×12", "Glute Bridge – 4×15", "Donkey Kicks – 3×15", "Lateral Band Walk – 3×15"],
    core:     ["Sit-Ups – 3×20", "Plank – 3×45s", "Mountain Climbers – 3×30s", "Russian Twist – 3×20", "Bicycle Crunches – 3×20"],
    cardio:   ["Jump Rope – 10 min", "Burpees – 4×10", "High Knees – 4×30s", "Jump Squats – 3×15", "Shadow Boxing – 3×2 min"],
    pullup:   ["Pull-Ups – 4×failure", "Chin-Ups – 3×failure", "Negative Pull-Ups – 3×5", "Dead Hang – 3×30s"],
  }
};

function pickEx(loc, muscle, count) {
  const pool = (loc === 'gym' || loc === 'both') ? EX.gym[muscle] : EX.home[muscle] || EX.gym[muscle];
  return pool.slice(0, count);
}

// Map a day-count plan to day names
const DAY_MAPS = {
  3: [['Monday','Wednesday','Friday'], ['Tuesday','Thursday','Saturday']],
  4: [['Monday','Tuesday','Thursday','Friday']],
  5: [['Monday','Tuesday','Wednesday','Friday','Saturday']],
  6: [['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']]
};

function generateWorkoutPlan(answers) {
  const { goal, location, equipment = [], days, level } = answers;
  const loc      = location === 'gym' || location === 'both' ? 'gym' : 'home';
  const numDays  = parseInt(days) || 4;
  const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const trainingDays = DAY_MAPS[numDays] ? DAY_MAPS[numDays][0] : DAY_MAPS[4][0];

  const plan = {};
  // Rest days
  dayNames.forEach(d => { plan[d] = { title: 'Rest & Recovery', items: [] }; });

  if (numDays === 3) {
    // Full Body A / B / C
    const splits = [
      { title: 'Full Body A', muscles: ['chest','back','legs'] },
      { title: 'Full Body B', muscles: ['shoulders','biceps','glutes','core'] },
      { title: 'Full Body C', muscles: ['chest','back','legs','core'] },
    ];
    trainingDays.forEach((day, i) => {
      const s = splits[i % splits.length];
      plan[day] = {
        title: s.title,
        items: s.muscles.flatMap(m => pickEx(loc, m, 2)).concat(goal === 'fat' || goal === 'cardio' ? pickEx(loc, 'cardio', 2) : [])
      };
    });
  } else if (numDays === 4) {
    // Upper / Lower
    const upper = ['Monday','Tuesday'].includes(trainingDays[0]) ? [trainingDays[0], trainingDays[2]] : [trainingDays[0], trainingDays[2]];
    const lower  = [trainingDays[1], trainingDays[3]];
    upper.forEach(day => {
      plan[day] = {
        title: 'Upper Body',
        items: [...pickEx(loc,'chest',2), ...pickEx(loc,'back',2), ...pickEx(loc,'shoulders',1), ...pickEx(loc,'triceps',1), ...pickEx(loc,'biceps',1)]
      };
    });
    lower.forEach(day => {
      plan[day] = {
        title: 'Lower Body + Core',
        items: [...pickEx(loc,'legs',3), ...pickEx(loc,'glutes',2), ...pickEx(loc,'core',2), ...(goal === 'fat' ? pickEx(loc,'cardio',1) : [])]
      };
    });
  } else if (numDays === 5) {
    // PPL + Upper + Lower
    const splits5 = [
      { title: 'Push — Chest, Shoulders, Triceps', items: [...pickEx(loc,'chest',3), ...pickEx(loc,'shoulders',2), ...pickEx(loc,'triceps',2)] },
      { title: 'Pull — Back, Biceps',              items: [...pickEx(loc,'back',3), ...pickEx(loc,'biceps',2), ...(loc==='home' && equipment.includes('pullupbar') ? EX.home.pullup.slice(0,2) : [])] },
      { title: 'Legs + Core',                      items: [...pickEx(loc,'legs',3), ...pickEx(loc,'core',2), ...(goal==='fat'?pickEx(loc,'cardio',1):[])] },
      { title: 'Upper Body',                       items: [...pickEx(loc,'chest',2), ...pickEx(loc,'back',2), ...pickEx(loc,'shoulders',1), ...pickEx(loc,'biceps',1), ...pickEx(loc,'triceps',1)] },
      { title: 'Glutes + Hamstrings + Abs',        items: [...pickEx(loc,'glutes',3), ...pickEx(loc,'core',2), ...(goal==='fat'?pickEx(loc,'cardio',2):[])] },
    ];
    trainingDays.forEach((day, i) => { plan[day] = splits5[i]; });
  } else if (numDays === 6) {
    // PPL × 2
    const pplA = [
      { title: 'Push A — Chest Focus',    items: [...pickEx(loc,'chest',3), ...pickEx(loc,'shoulders',2), ...pickEx(loc,'triceps',2)] },
      { title: 'Pull A — Back Focus',     items: [...pickEx(loc,'back',3), ...pickEx(loc,'biceps',2), ...pickEx(loc,'core',1)] },
      { title: 'Legs A — Quad Focus',     items: [...pickEx(loc,'legs',3), ...pickEx(loc,'core',2)] },
      { title: 'Push B — Shoulder Focus', items: [...pickEx(loc,'shoulders',3), ...pickEx(loc,'chest',2), ...pickEx(loc,'triceps',2)] },
      { title: 'Pull B — Biceps Focus',   items: [...pickEx(loc,'biceps',3), ...pickEx(loc,'back',2), ...pickEx(loc,'core',1)] },
      { title: 'Legs B — Glute Focus',    items: [...pickEx(loc,'glutes',3), ...pickEx(loc,'legs',2), ...pickEx(loc,'core',1), ...(goal==='fat'?pickEx(loc,'cardio',1):[])] },
    ];
    trainingDays.forEach((day, i) => { plan[day] = pplA[i]; });
  }

  // Cardio days for fat/cardio goal — add to rest days
  if (goal === 'fat' || goal === 'cardio') {
    const restDays = dayNames.filter(d => plan[d].items.length === 0);
    restDays.slice(0, 1).forEach(d => {
      plan[d] = { title: 'Cardio + Active Recovery', items: [...pickEx(loc,'cardio',3), ...pickEx(loc,'core',2)] };
    });
  }

  return plan;
}

// ══════════════════════════════════════════════
// SCHEDULE GENERATOR
// ══════════════════════════════════════════════

function fmt(h, m) {
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12  = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2,'0')} ${ampm}`;
}

function addMins(h, m, mins) {
  const total = h * 60 + m + mins;
  return [Math.floor(total / 60) % 24, total % 60];
}

function generateSchedule(answers) {
  const { wakeTime, workStart, workEnd, sleepTime, morning, workoutTime, supplements } = answers;

  const [wH, wM]   = wakeTime.split(':').map(Number);
  const [wsH, wsM] = workStart.split(':').map(Number);
  const [weH, weM] = workEnd.split(':').map(Number);
  const [slH, slM] = sleepTime.split(':').map(Number);
  const supps      = supplements || [];

  const schedule = [];
  const hydration = [];

  // Helper: push a schedule item
  const s = (h, m, text) => schedule.push(`${fmt(h, m)} – ${text}`);
  const h = (h, m, oz, label) => hydration.push(`${fmt(h, m)} – ${oz}oz ${label}`);

  // ── Wake Up ─────────────────────────────────
  let suppsAtWake = [];
  if (supps.includes('creatine'))    suppsAtWake.push('Creatine');
  if (supps.includes('vitamind'))    suppsAtWake.push('Vitamin D3');
  if (supps.includes('multivitamin'))suppsAtWake.push('Multivitamin');
  if (supps.includes('shilajit'))    suppsAtWake.push('Shilajit');
  supps.filter(v => v.startsWith('custom:')).forEach(v => suppsAtWake.push(v.slice(7)));

  s(wH, wM, `Wake up — lemon + turmeric + salt water${suppsAtWake.length ? ` + ${suppsAtWake.join(', ')}` : ''}`);
  h(wH, wM, 12, '(lemon water)');

  // ── Pre-workout caffeine ────────────────────
  let workoutH, workoutM;

  if (workoutTime === 'early_morning') {
    [workoutH, workoutM] = addMins(wH, wM, 30);
  } else if (workoutTime === 'morning') {
    [workoutH, workoutM] = addMins(wsH, wsM, 60); // after morning obligations
  } else if (workoutTime === 'lunch') {
    [workoutH, workoutM] = addMins(wsH, wsM, (weH * 60 + weM - wsH * 60 - wsM) / 2);
  } else if (workoutTime === 'after_work') {
    [workoutH, workoutM] = addMins(weH, weM, 30);
  } else {
    [workoutH, workoutM] = addMins(weH, weM, 90);
  }

  // Caffeine 30 min before workout (if using pre-workout or caffeine)
  if (supps.includes('preworkout') || supps.includes('caffeine')) {
    const [cH, cM] = addMins(workoutH, workoutM, -30);
    s(cH, cM, supps.includes('preworkout') ? 'Pre-Workout supplement' : 'Coffee / Caffeine');
  }

  // ── Morning obligations ──────────────────────
  if (morning) {
    const [oblH, oblM] = addMins(wsH, wsM, -30); // 30 min before work
    const obTime = document.getElementById('inputMorningTime')?.value || wizardAnswers.morningObligationTime || '07:00';
    const [otH, otM] = obTime.split(':').map(Number);
    s(otH, otM, morning);
  }

  // ── Workout ──────────────────────────────────
  s(workoutH, workoutM, 'Workout — Wolfpack Training');
  const [postH, postM] = addMins(workoutH, workoutM, 55);
  s(postH, postM, 'Cool down + stretch');
  h(postH, postM, 16, '(post-workout)');

  // ── Post-workout protein ─────────────────────
  const [pwH, pwM] = addMins(postH, postM, 15);
  let postWo = [];
  if (supps.includes('protein')) postWo.push('Protein shake');
  if (supps.includes('creatine') && workoutTime !== 'early_morning') postWo.push('Creatine');
  if (postWo.length) s(pwH, pwM, postWo.join(' + '));

  // ── Breakfast ────────────────────────────────
  let breakfastH, breakfastM;
  if (workoutTime === 'early_morning') {
    [breakfastH, breakfastM] = addMins(pwH, pwM, 30);
  } else {
    [breakfastH, breakfastM] = addMins(wsH, wsM, 0);
  }
  let breakfastSupps = [];
  if (supps.includes('fishoil'))     breakfastSupps.push('Fish Oil');
  if (supps.includes('multivitamin'))breakfastSupps.push('Multivitamin');
  s(breakfastH, breakfastM, `Breakfast${breakfastSupps.length ? ` + ${breakfastSupps.join(', ')}` : ''}`);
  h(breakfastH, breakfastM, 12, '(breakfast)');

  // ── Work ─────────────────────────────────────
  s(wsH, wsM, 'Start work');

  // ── Mid-morning ──────────────────────────────
  const midMorningM = wsH * 60 + wsM + Math.floor((weH * 60 + weM - wsH * 60 - wsM) * 0.33);
  const [mmH, mmMin] = [Math.floor(midMorningM / 60), midMorningM % 60];
  s(mmH, mmMin, 'Water break + stretch (5 min)');
  h(mmH, mmMin, 12, '');

  // ── Lunch ────────────────────────────────────
  const lunchM = wsH * 60 + wsM + Math.floor((weH * 60 + weM - wsH * 60 - wsM) * 0.5);
  const [lH, lMin] = [Math.floor(lunchM / 60), lunchM % 60];
  s(lH, lMin, 'Lunch + 10-min walk');
  h(lH, lMin, 12, '(with lunch)');

  // ── Afternoon ────────────────────────────────
  const [snH, snM] = addMins(lH, lMin, 150);
  s(snH, snM, 'Snack + water');
  h(snH, snM, 12, '');

  // ── End work ────────────────────────────────
  s(weH, weM, 'End work');

  // ── Afternoon workout if not early ──────────
  if (workoutTime === 'after_work' || workoutTime === 'evening') {
    h(workoutH, workoutM, 12, '(pre-workout)');
  }

  // ── Dinner ───────────────────────────────────
  const [dinH, dinM] = addMins(weH, weM, 30);
  s(dinH, dinM, 'Dinner + family time');
  h(dinH, dinM, 12, '(with dinner)');

  // ── Evening optional ─────────────────────────
  const winddownTarget = slH * 60 + slM - 60;
  const [evH, evM] = addMins(Math.floor(winddownTarget / 60), winddownTarget % 60, -60);
  if (evH > dinH || (evH === dinH && evM > dinM)) {
    s(evH, evM, 'Optional cardio / sauna / walk');
  }

  // ── Caffeine cutoff warning ──────────────────
  // (already handled by not scheduling caffeine too late)

  // ── Pre-sleep supplements ─────────────────────
  const [windH, windM] = addMins(slH, slM, -45);
  let eveningSupps = [];
  if (supps.includes('magnesium')) eveningSupps.push('Magnesium');
  s(windH, windM, `Herbal tea${eveningSupps.length ? ` + ${eveningSupps.join(', ')}` : ''} + wind down`);

  if (supps.includes('casein')) {
    const [casH, casM] = addMins(slH, slM, -30);
    s(casH, casM, 'Casein protein shake');
  }

  s(slH, slM, 'Sleep — lights out');
  h(slH, slM, 0, ''); // placeholder so hydration has right count

  // Build hydration schedule from waking hours
  const wakeMin  = wH * 60 + wM;
  const sleepMin = slH * 60 + slM;
  const gap      = Math.floor((sleepMin - wakeMin) / 8);
  const finalHydration = [];
  for (let i = 0; i < 9; i++) {
    const totalMin = wakeMin + i * gap;
    const hh = Math.floor(totalMin / 60) % 24;
    const mm = totalMin % 60;
    const labels = ['(lemon water)','(post-workout)','(breakfast)','','','(with lunch)','(snack)','','(evening)'];
    finalHydration.push(`${fmt(hh, mm)} – 12oz ${labels[i] || ''}`);
  }

  // Sort schedule by time
  schedule.sort((a, b) => {
    const toMin = str => {
      const m = str.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (!m) return 0;
      let h = parseInt(m[1]) % 12;
      if (m[3].toUpperCase() === 'PM') h += 12;
      return h * 60 + parseInt(m[2]);
    };
    return toMin(a) - toMin(b);
  });

  return { schedule, hydration: finalHydration };
}

// ── Hydration Notifications ────────────────────
// ── Schedule Notifications ─────────────────────
function getNotifPrefs() {
  return JSON.parse(localStorage.getItem('notif_prefs') || '{}');
}
function saveNotifPrefs(prefs) {
  localStorage.setItem('notif_prefs', JSON.stringify(prefs));
}
function isNotifEnabled(itemKey) {
  const prefs = getNotifPrefs();
  return prefs[itemKey] !== false; // default ON
}

const _notifTimers = [];

function scheduleAllReminders() {
  // Clear any previously set timers
  _notifTimers.forEach(id => clearTimeout(id));
  _notifTimers.length = 0;

  if (Notification.permission !== 'granted') return;

  const schedule = getCustomSchedule();
  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();

  schedule.forEach((item, index) => {
    const itemKey = `schedule_${index}`;
    if (!isNotifEnabled(itemKey)) return;

    const timePart = item.split(/\s*[–—]\s*/)[0].trim();
    const targetMins = parseTimeToMins(timePart);
    if (targetMins < 0) return;

    const delayMs = (targetMins - nowMins) * 60 * 1000;
    if (delayMs <= 0) return;

    const body = item.split(/\s*[–—]\s*/).slice(1).join(' – ') || item;
    const timerId = setTimeout(() => {
      new Notification('⏰ WolfPack', { body, icon: 'Wolf.png', badge: 'Wolf.png' });
      playAlarm();
    }, delayMs);
    _notifTimers.push(timerId);
  });
}

// scheduleHydrationReminders() — removed (handled by scheduleAllReminders)

// ── Must Do Today Reminders ────────────────────
const _todoReminderTimers = [];


function scheduleTodoReminders() {
  // Clear existing timers
  _todoReminderTimers.forEach(id => clearTimeout(id));
  _todoReminderTimers.length = 0;

  if (Notification.permission !== 'granted') return;

  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();

  // Fire every hour from 8 AM (480) to 9 PM (1260)
  const reminderTimes = [];
  for (let m = 480; m <= 1260; m += 60) reminderTimes.push(m);

  reminderTimes.forEach(targetMins => {
    const delayMs = (targetMins - nowMins) * 60 * 1000;
    if (delayMs <= 0) return;

    const timerId = setTimeout(() => {
      const todos = JSON.parse(localStorage.getItem('todos') || '[]');
      const incomplete = todos.filter(t => !t.done);
      if (incomplete.length === 0) return;

      const label = incomplete.length === 1
        ? `"${incomplete[0].text}"`
        : `${incomplete.length} tasks`;
      new Notification('📋 WolfPack Reminder', {
        body: `Still pending: ${label}. Get it done!`,
        icon: 'Wolf.png',
        badge: 'Wolf.png'
      });
    }, delayMs);

    _todoReminderTimers.push(timerId);
  });
}

// ── Exercise Weight Tracking ───────────────────
function exWeightKey(exerciseText) {
  const name = exerciseText.split(/[–—]/)[0].trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
  return `exw_${name}`;
}

function getExWeightHistory(exerciseText) {
  return JSON.parse(localStorage.getItem(exWeightKey(exerciseText)) || '[]');
}

function logExWeight(exerciseText, weight) {
  const key     = exWeightKey(exerciseText);
  const history = getExWeightHistory(exerciseText);
  const today   = new Date().toLocaleDateString();
  const idx     = history.findIndex(e => e.date === today);
  if (idx >= 0) history[idx].weight = weight;
  else history.push({ date: today, weight });
  if (history.length > 16) history.splice(0, history.length - 16);
  localStorage.setItem(key, JSON.stringify(history));
}

function getTodayExWeight(exerciseText) {
  const today = new Date().toLocaleDateString();
  const entry = getExWeightHistory(exerciseText).find(e => e.date === today);
  return entry ? entry.weight : '';
}

function getLastExWeight(exerciseText) {
  const today   = new Date().toLocaleDateString();
  const history = getExWeightHistory(exerciseText).filter(e => e.date !== today);
  return history.length ? history[history.length - 1].weight : '';
}

// ── Load List ──────────────────────────────────
function loadList(id, items, prefix) {
  const container = document.getElementById(id);
  if (!container) return;
  container.innerHTML = '';
  items.forEach((item, index) => {
    const itemId  = `${prefix}_${index}`;
    const checked = localStorage.getItem(itemId) === 'true';
    const li      = document.createElement('li');
    li.className  = 'exercise-li';
    if (checked) li.classList.add('completed');

    // Checkbox + label
    const cb  = document.createElement('input');
    cb.type   = 'checkbox';
    cb.id     = itemId;
    cb.checked = checked;

    const lbl = document.createElement('label');
    lbl.htmlFor   = itemId;
    lbl.textContent = item;

    li.appendChild(cb);
    li.appendChild(lbl);

    // Workout-only extras: weight input + YouTube button
    if (prefix === 'workout') {
      const todayW = getTodayExWeight(item);
      const lastW  = getLastExWeight(item);

      const weightWrap = document.createElement('div');
      weightWrap.className = 'ex-weight-wrap';

      const weightInput = document.createElement('input');
      weightInput.type        = 'text';
      weightInput.className   = 'ex-weight-input';
      weightInput.value       = todayW;
      weightInput.placeholder = lastW ? `Last: ${lastW}` : 'lbs / kg';
      weightInput.inputMode   = 'decimal';
      weightInput.setAttribute('aria-label', 'Weight used');

      weightInput.addEventListener('blur', () => {
        const val = weightInput.value.trim();
        if (val) logExWeight(item, val);
      });
      weightInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') { e.preventDefault(); weightInput.blur(); }
      });
      // Prevent checkbox toggle when clicking input
      weightInput.addEventListener('click', e => e.stopPropagation());

      weightWrap.appendChild(weightInput);
      li.appendChild(weightWrap);

      const ytBtn = document.createElement('button');
      ytBtn.className = 'exercise-yt-btn';
      ytBtn.setAttribute('aria-label', 'Watch tutorial');
      ytBtn.innerHTML = `<svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2.5 2L10.5 6.5L2.5 11V2Z" fill="currentColor"/></svg>`;
      ytBtn.addEventListener('click', e => { e.stopPropagation(); openExerciseTutorial(item); });
      li.appendChild(ytBtn);
    }

    container.appendChild(li);

    cb.addEventListener('change', () => {
      localStorage.setItem(itemId, cb.checked);
      cb.checked ? li.classList.add('completed') : li.classList.remove('completed');
      if (cb.checked) { playCheckmark(); spawnParticles(cb); }
      if (prefix === 'workout') updateWorkoutProgress();
      checkStreakCompletion();
      updatePerformanceScore();
    });
  });
  if (prefix === 'workout') updateWorkoutProgress();
}

function updateWorkoutProgress() {
  const cbs   = document.querySelectorAll('#workoutList input[type="checkbox"]');
  const total = cbs.length, done = [...cbs].filter(cb => cb.checked).length;
  const bar   = document.getElementById('workoutProgressBar');
  const lbl   = document.getElementById('workoutProgressLabel');
  if (bar) bar.style.width = total > 0 ? `${(done / total) * 100}%` : '0%';
  if (lbl) lbl.textContent = `${done} / ${total} exercise${total !== 1 ? 's' : ''}`;
  if (total > 0) checkWorkoutComplete();
}

// updateHydrationDots() — removed (legacy checkbox system replaced by drop UI)

function setNextWorkout() {
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const tomorrow = days[(new Date().getDay() + 1) % 7];
  const workouts = getCustomWorkouts();
  const next = workouts[tomorrow];
  const el = document.getElementById('nextWorkoutLabel');
  if (el && next) el.textContent = `${tomorrow} — ${next.title}`;
}

function renderStreakWeek() {
  const container = document.getElementById('streakWeek');
  if (!container) return;
  const labels = ['M','T','W','T','F','S','S'];
  const todayDow = new Date().getDay();
  const todayIdx = todayDow === 0 ? 6 : todayDow - 1;
  const allScores = JSON.parse(localStorage.getItem('dailyScores') || '{}');
  container.innerHTML = '';

  labels.forEach((lbl, i) => {
    // Get the date for this column (relative to today)
    const offset = i - todayIdx;
    const d = new Date();
    d.setDate(d.getDate() + offset);
    const key = d.toLocaleDateString();
    const isToday = i === todayIdx;
    const isFuture = i > todayIdx;

    // A day "counts" if score was saved OR if today it meets threshold
    let scored = false;
    if (isToday) {
      const { score } = calculatePerformanceScore();
      scored = score >= 20;
    } else if (!isFuture && allScores[key]) {
      const s = allScores[key];
      const sc = typeof s === 'object' ? s.score : s;
      scored = sc >= 20;
    }

    const dot = document.createElement('div');
    dot.className = 'streak-day-dot';
    const circleClass = isToday ? 'active' : (scored ? 'done' : (isFuture ? 'future' : ''));
    dot.innerHTML = `<span class="day-lbl">${lbl}</span><div class="streak-day-circle ${circleClass}"></div>`;
    container.appendChild(dot);
  });
}

function animateCountUp(el, target, duration = 900) {
  if (!el) return;
  const start = parseInt(el.textContent) || 0, range = target - start;
  if (range === 0) { el.textContent = target; return; }
  const startTime = performance.now();
  function tick(now) {
    const pct = Math.min((now - startTime) / duration, 1);
    el.textContent = Math.round(start + range * (1 - Math.pow(1 - pct, 3)));
    if (pct < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

// ── Performance Score ──────────────────────────
function calculatePerformanceScore() {
  const calcPct = (selector) => {
    const cbs = document.querySelectorAll(selector);
    if (!cbs.length) return 0;
    return Math.round([...cbs].filter(cb => cb.checked).length / cbs.length * 100);
  };
  const workoutPct   = calcPct('#workoutList input[type="checkbox"]');
  const hydrationPct = Math.round((getHydrationCount() / 9) * 100);
  const todoCbs      = document.querySelectorAll('#todoList input[type="checkbox"]');
  const hasTodos     = todoCbs.length > 0;
  const todoPct      = hasTodos ? Math.round([...todoCbs].filter(cb => cb.checked).length / todoCbs.length * 100) : 0;
  // Rebalance weights when no todos exist so perfect score is achievable
  const score = hasTodos
    ? Math.round(workoutPct * 0.50 + hydrationPct * 0.30 + todoPct * 0.20)
    : Math.round(workoutPct * 0.625 + hydrationPct * 0.375);
  return { score, workoutPct, hydrationPct, todoPct };
}

function updatePerformanceScore() {
  const { score, workoutPct, hydrationPct, todoPct } = calculatePerformanceScore();
  const tiers = [[0,'Getting Started'],[20,'Building Momentum'],[40,'Making Progress'],[60,'On Track'],[75,'Strong Day'],[90,'Elite Performance']];
  const tier  = [...tiers].reverse().find(([min]) => score >= min);
  const tierLabel = tier ? tier[1] : 'Getting Started';

  // Score number (SVG text + any other scoreNumber elements)
  document.querySelectorAll('#scoreNumber').forEach(el => animateCountUp(el, score));
  document.querySelectorAll('#scoreGrade').forEach(el => { el.textContent = tierLabel; });

  // Ring animation
  const ring = document.getElementById('scoreRingCircle');
  if (ring) {
    const circumference = 163.4;
    const offset = circumference - (score / 100) * circumference;
    ring.style.transition = 'stroke-dashoffset 1s cubic-bezier(0.22,1,0.36,1)';
    ring.style.strokeDashoffset = offset;
  }

  // Chips
  const hydOz = Math.round((getHydrationCount() / 9) * getHydrationGoal());
  const woChip  = document.getElementById('scoreWorkoutChip');
  const hydChip = document.getElementById('scoreHydroChip');
  const taskChip = document.getElementById('scoreTaskChip');
  if (woChip)   woChip.textContent   = `WO ${workoutPct}%`;
  if (hydChip)  hydChip.textContent  = `💧 ${hydOz}oz`;
  if (taskChip) taskChip.textContent = `Tasks ${todoPct}%`;

  // Legacy bar/pct IDs (hidden, kept for compatibility)
  const setBar = (id, val) => { const el = document.getElementById(id); if (el) el.style.width = val + '%'; };
  const setPct = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val + '%'; };
  setBar('scoreWorkoutBar', workoutPct); setPct('scoreWorkoutPct', workoutPct);
  setBar('scoreHydroBar',  hydrationPct); setPct('scoreHydroPct',  hydrationPct);
  setBar('scoreTaskBar',   todoPct);     setPct('scoreTaskPct',   todoPct);
}

// ── Greeting Header ────────────────────────────
function renderGreetingHeader() {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const name = localStorage.getItem('user_name') || 'Noel';
  const initial = name.charAt(0).toUpperCase();

  const timeEl = document.getElementById('greetingTime');
  const nameEl = document.getElementById('greetingName');
  if (timeEl) timeEl.textContent = greeting;
  if (nameEl) nameEl.textContent = name;

  loadAvatarPhoto(initial);

  const streak = parseInt(localStorage.getItem('streak') || '0');
  const streakEl = document.getElementById('greetingStreak');
  if (streakEl) streakEl.textContent = streak;
}

function loadAvatarPhoto(initial) {
  const avatarEl = document.getElementById('greetingAvatar');
  if (!avatarEl) return;
  const saved = localStorage.getItem('avatar_photo');

  // Remove old img if present
  const existing = avatarEl.querySelector('img');
  if (existing) existing.remove();

  if (saved) {
    // Show photo — clear text, inject img
    avatarEl.childNodes.forEach(n => { if (n.nodeType === Node.TEXT_NODE) n.textContent = ''; });
    const img = document.createElement('img');
    img.src = saved;
    img.alt = 'Profile photo';
    avatarEl.insertBefore(img, avatarEl.firstChild);
  } else {
    // Show initial letter
    avatarEl.childNodes.forEach(n => { if (n.nodeType === Node.TEXT_NODE) n.textContent = initial || 'N'; });
  }
}

function setupAvatarUpload() {
  const avatarEl = document.getElementById('greetingAvatar');
  const input    = document.getElementById('avatarInput');
  if (!avatarEl || !input) return;

  avatarEl.addEventListener('click', () => input.click());

  input.addEventListener('change', () => {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      // Resize to max 200px via canvas to keep localStorage lean
      const img = new Image();
      img.onload = () => {
        const size = 200;
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = size;
        const ctx = canvas.getContext('2d');
        const scale = Math.max(size / img.width, size / img.height);
        const w = img.width * scale, h = img.height * scale;
        ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
        localStorage.setItem('avatar_photo', dataUrl);
        loadAvatarPhoto('');
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
    input.value = '';
  });
}

// ── NOW Block + Upcoming Timeline ──────────────
function renderNowBlock() {
  const schedule = getCustomSchedule();
  const nowMins  = new Date().getHours() * 60 + new Date().getMinutes();
  const nowBlock = document.getElementById('nowBlock');
  const nowLabel = document.getElementById('nowLabel');
  const nowText  = document.getElementById('nowItemText');
  const nowCheck = document.getElementById('nowBlockCheck');
  const upcoming = document.getElementById('upcomingList');
  if (!nowBlock || !upcoming) return;

  // Build parsed list preserving original schedule index for localStorage key
  const parsed = schedule.map((item, origIdx) => {
    const parts    = item.split(/\s*[–—]\s*/);
    const timePart = parts[0].trim();
    const textPart = parts.slice(1).join(' – ') || item;
    return { mins: parseTimeToMins(timePart), time: timePart, text: textPart, origIdx };
  }).filter(i => i.mins >= 0).sort((a, b) => a.mins - b.mins);

  // Find current item
  let currentIdx = -1;
  for (let i = 0; i < parsed.length; i++) {
    if (parsed[i].mins <= nowMins) currentIdx = i;
  }

  // NOW block with checkbox
  if (currentIdx >= 0) {
    const cur     = parsed[currentIdx];
    const itemKey = `routine_${cur.origIdx}`;
    const checked = localStorage.getItem(itemKey) === 'true';

    nowBlock.style.display = 'flex';
    nowLabel.textContent   = `▶ NOW · ${cur.time}`;
    nowText.textContent    = cur.text;

    if (nowCheck) {
      nowCheck.style.display = 'block';
      nowCheck.checked       = checked;
      nowCheck.id            = `nowCheck_${cur.origIdx}`;
      nowCheck.onchange      = null; // clear old handler
      nowCheck.addEventListener('change', function handler() {
        localStorage.setItem(itemKey, nowCheck.checked);
        nowBlock.style.opacity = nowCheck.checked ? '0.45' : '1';
        if (nowCheck.checked) { playCheckmark(); spawnParticles(nowCheck); }
        // Also sync the routineList checkbox if visible
        const twin = document.getElementById(itemKey);
        if (twin) twin.checked = nowCheck.checked;
        checkStreakCompletion();
        updatePerformanceScore();
        nowCheck.removeEventListener('change', handler);
      }, { once: true });
      nowBlock.style.opacity = checked ? '0.45' : '1';
    }
  } else {
    nowBlock.style.display = 'none';
  }

  // Next 3 upcoming with checkboxes
  const nextItems = parsed.filter(i => i.mins > nowMins).slice(0, 3);
  upcoming.innerHTML = '';
  nextItems.forEach(item => {
    const itemKey = `routine_${item.origIdx}`;
    const checked = localStorage.getItem(itemKey) === 'true';

    const li = document.createElement('li');
    li.className = 'upcoming-item task-list' + (checked ? ' completed' : '');

    const cb = document.createElement('input');
    cb.type    = 'checkbox';
    cb.checked = checked;
    cb.id      = `upcomingCb_${item.origIdx}`;

    const lbl = document.createElement('label');
    lbl.htmlFor = cb.id;
    lbl.innerHTML = `<span class="upcoming-time">${item.time}</span><span class="upcoming-text">${item.text}</span>`;
    lbl.style.cssText = 'display:flex;align-items:center;gap:var(--s2);flex:1;cursor:pointer';

    cb.addEventListener('change', () => {
      localStorage.setItem(itemKey, cb.checked);
      cb.checked ? li.classList.add('completed') : li.classList.remove('completed');
      if (cb.checked) { playCheckmark(); spawnParticles(cb); }
      // Sync routineList twin
      const twin = document.getElementById(itemKey);
      if (twin) twin.checked = cb.checked;
      checkStreakCompletion();
      updatePerformanceScore();
    });

    li.appendChild(cb);
    li.appendChild(lbl);
    upcoming.appendChild(li);
  });
}

// ── Hydration Oz Tracker ───────────────────────
function getHydrationGoal() {
  const sex = localStorage.getItem('hydration_sex') || 'male';
  return sex === 'female' ? 91 : 125;
}

function getHydrationOzPerDrop() {
  return Math.round(getHydrationGoal() / 9);
}

function getHydrationCount() {
  const savedDate = localStorage.getItem('hydration_count_date');
  const today = new Date().toLocaleDateString();
  if (savedDate !== today) {
    localStorage.setItem('hydration_count', '0');
    localStorage.setItem('hydration_count_date', today);
    return 0;
  }
  return parseInt(localStorage.getItem('hydration_count') || '0');
}

function saveHydrationCount(n) {
  localStorage.setItem('hydration_count', String(Math.max(0, Math.min(9, n))));
  localStorage.setItem('hydration_count_date', new Date().toLocaleDateString());
}

function loadHydrationDrops() {
  const grid = document.getElementById('hydrationDropsGrid');
  if (!grid) return;
  const goal      = getHydrationGoal();
  const ozPerDrop = getHydrationOzPerDrop();
  const count     = getHydrationCount();
  grid.innerHTML  = '';

  for (let i = 0; i < 9; i++) {
    const filled = i < count;
    const drop = document.createElement('div');
    drop.className = 'h-drop' + (filled ? ' filled' : '');
    drop.setAttribute('role', 'button');
    drop.setAttribute('aria-label', `Drop ${i + 1}${filled ? ' (logged)' : ''}`);
    drop.innerHTML = `<svg viewBox="0 0 34 38" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17 2C17 2 5 15 5 23.5C5 30.4 10.37 36 17 36C23.63 36 29 30.4 29 23.5C29 15 17 2 17 2Z"
        fill="${filled ? '#0A84FF' : 'rgba(255,255,255,0.07)'}"
        stroke="${filled ? 'rgba(10,132,255,0.45)' : 'rgba(255,255,255,0.14)'}"
        stroke-width="1.2"/>
      ${filled ? '<path d="M13 26C13 26 12 22 14.5 19" stroke="rgba(255,255,255,0.28)" stroke-width="1.4" stroke-linecap="round"/>' : ''}
    </svg>`;

    drop.addEventListener('click', () => {
      const newCount = (i < count) ? i : i + 1;
      saveHydrationCount(newCount);
      if (i >= count) { playCheck(); spawnParticles(drop); }
      if (newCount >= 9) localStorage.setItem('hydration_ever_full', '1');
      loadHydrationDrops();
      updatePerformanceScore();
      checkStreakCompletion();
      checkAndUnlockAchievements();
    });

    grid.appendChild(drop);
  }

  updateHydrationOzDisplay();
}

function updateHydrationOzDisplay() {
  const count     = getHydrationCount();
  const goal      = getHydrationGoal();
  const ozPerDrop = getHydrationOzPerDrop();
  const oz        = Math.round((count / 9) * goal);

  const chip = document.getElementById('hydrationOzDisplay');
  if (chip) chip.textContent = `${oz} / ${goal} oz`;

  const note = document.getElementById('hydrationOzNote');
  if (note) note.textContent = `Each drop ≈ ${ozPerDrop} oz · tap to log`;

  const statsEl  = document.getElementById('statsHydroCount');
  const statsLbl = document.getElementById('statsHydroLabel');
  if (statsEl)  statsEl.textContent  = oz;
  if (statsLbl) statsLbl.textContent = `/ ${goal} oz`;
}

// ── Exercise Tutorial Link ─────────────────────
function openExerciseTutorial(exerciseStr) {
  // Strip sets/reps info: "Bench Press – 4 sets" → "Bench Press"
  const name = exerciseStr.split(/[–—\-]/)[0].trim();
  const query = encodeURIComponent(name + ' proper form tutorial');
  window.open(`https://www.youtube.com/results?search_query=${query}`, '_blank', 'noopener');
}

// ── Particle Burst ─────────────────────────────
function spawnParticles(sourceEl) {
  const rect = sourceEl.getBoundingClientRect();
  const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
  const colors = ['#FFD700','#D4AF37','#FFD700','#30D158','#C9A227','#FFF8DC'];
  for (let i = 0; i < 8; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const angle = (i / 8) * 360;
    const dist  = 18 + Math.random() * 18;
    const dx = Math.cos(angle * Math.PI / 180) * dist;
    const dy = Math.sin(angle * Math.PI / 180) * dist;
    const sz = 3 + Math.random() * 3;
    p.style.cssText = `position:fixed;left:${cx}px;top:${cy}px;width:${sz}px;height:${sz}px;--dx:${dx}px;--dy:${dy}px;background:${colors[i % colors.length]};`;
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 600);
  }
}

// ── Workout Completion Modal ────────────────────
function checkWorkoutComplete() {
  const cbs = document.querySelectorAll('#workoutList input[type="checkbox"]');
  if (!cbs.length) return;
  const allDone = [...cbs].every(cb => cb.checked);
  const celebKey = `workoutCelebrated_${new Date().toLocaleDateString()}`;
  if (allDone && !localStorage.getItem(celebKey)) {
    localStorage.setItem(celebKey, '1');
    recordWorkoutCompletion('full');
    checkAndUnlockAchievements();
    setTimeout(showWorkoutComplete, 420);
  }
}

function showWorkoutComplete() {
  const modal = document.getElementById('workoutCompleteModal');
  if (!modal) return;
  playWorkoutComplete();
  const { score } = calculatePerformanceScore();
  const streak = parseInt(localStorage.getItem('streak') || '0');
  const titleEl = document.getElementById('workoutTitle');
  const sub = document.getElementById('wcSubtitle');
  if (sub && titleEl) sub.textContent = `${titleEl.textContent} — destroyed. Keep stacking.`;
  const wcScore = document.getElementById('wcScore'); if (wcScore) wcScore.textContent = score;
  const wcStreak = document.getElementById('wcStreak'); if (wcStreak) wcStreak.textContent = streak;
  modal.style.display = 'flex';
  modal.classList.remove('closing');
  spawnConfetti();
}

function dismissWorkoutComplete() {
  const modal = document.getElementById('workoutCompleteModal');
  if (!modal) return;
  modal.classList.add('closing');
  setTimeout(() => { modal.style.display = 'none'; }, 300);
}

function spawnConfetti() {
  const container = document.getElementById('wcConfetti');
  if (!container) return;
  container.innerHTML = '';
  const colors = ['#FFD700','#D4AF37','#C9A227','#FFF8DC','#FFD700','#30D158','#FFD700'];
  for (let i = 0; i < 32; i++) {
    const dot = document.createElement('div');
    dot.className = 'wc-dot';
    const sz = 4 + Math.random() * 6;
    dot.style.cssText = `left:${Math.random()*100}%;top:${-5 + Math.random()*10}px;width:${sz}px;height:${sz}px;background:${colors[Math.floor(Math.random()*colors.length)]};animation-duration:${1.2+Math.random()*1.6}s;animation-delay:${Math.random()*0.6}s;border-radius:${Math.random()>0.5?'50%':'2px'};`;
    container.appendChild(dot);
  }
}

// ── Schedule Timeline with NOW indicator ────────
function parseTimeToMins(str) {
  const m = str.match(/^(\d+):(\d+)\s*(AM|PM)/i);
  if (!m) return -1;
  let h = parseInt(m[1]), min = parseInt(m[2]);
  const p = m[3].toUpperCase();
  if (p === 'PM' && h !== 12) h += 12;
  if (p === 'AM' && h === 12) h = 0;
  return h * 60 + min;
}

function loadScheduleTimeline(containerId, items, prefix) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';
  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();
  let nowInjected = false;

  items.forEach((item, index) => {
    const itemId  = `${prefix}_${index}`;
    const checked = localStorage.getItem(itemId) === 'true';
    const itemMins = parseTimeToMins(item);

    // Inject NOW line before the first future item
    if (!nowInjected && itemMins !== -1 && nowMins < itemMins) {
      const nowRow = document.createElement('div');
      nowRow.className = 'timeline-now';
      nowRow.innerHTML = `<div class="timeline-now-line"></div><span class="timeline-now-label">Now</span><div class="timeline-now-line" style="max-width:32px;opacity:0.25"></div>`;
      container.appendChild(nowRow);
      nowInjected = true;
    }

    // Split "HH:MM AM – content" into time and text parts
    const dashIdx = item.indexOf('–');
    const timeStr    = dashIdx !== -1 ? item.substring(0, dashIdx).trim() : '';
    const contentStr = dashIdx !== -1 ? item.substring(dashIdx + 1).trim() : item;

    const li = document.createElement('li');
    const isPast = itemMins !== -1 && itemMins < nowMins;
    if (isPast) li.classList.add('is-past');
    if (checked) li.classList.add('completed');

    li.innerHTML = `<input type="checkbox" id="${itemId}" ${checked ? 'checked' : ''}><span class="timeline-time">${timeStr}</span><label for="${itemId}" class="timeline-item-text">${contentStr}</label>`;
    container.appendChild(li);

    const checkbox = li.querySelector('input');
    checkbox.addEventListener('change', () => {
      localStorage.setItem(itemId, checkbox.checked);
      checkbox.checked ? li.classList.add('completed') : li.classList.remove('completed');
      if (checkbox.checked) { playCheck(); spawnParticles(checkbox); }
      checkStreakCompletion();
      updatePerformanceScore();
    });
  });
}

// ── Stats Dashboard ─────────────────────────────
function saveDailyScore() {
  const { score, workoutPct, hydrationPct, todoPct } = calculatePerformanceScore();
  const tiers = [[0,'Getting Started'],[20,'Building Momentum'],[40,'Making Progress'],[60,'On Track'],[75,'Strong Day'],[90,'Elite Performance']];
  const tier = [...tiers].reverse().find(([min]) => score >= min);
  const day = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const workouts = getCustomWorkouts();

  const scores = JSON.parse(localStorage.getItem('dailyScores') || '{}');
  scores[new Date().toLocaleDateString()] = {
    score,
    workoutPct,
    hydrationPct,
    todoPct,
    tier: tier ? tier[1] : 'Getting Started',
    workoutTitle: workouts[day]?.title || '—',
    hydrationOz: Math.round((getHydrationCount() / 9) * getHydrationGoal()),
    hydrationGoal: getHydrationGoal(),
    streak: parseInt(localStorage.getItem('streak') || '0')
  };
  localStorage.setItem('dailyScores', JSON.stringify(scores));
}

function recordWorkoutCompletion(type) {
  const completions = JSON.parse(localStorage.getItem('workoutCompletions') || '{}');
  const today = new Date().toLocaleDateString();
  completions[today] = type === 'full' ? 2 : 1;
  localStorage.setItem('workoutCompletions', JSON.stringify(completions));

  // Snapshot today's exercises + logged weights
  const day = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const workouts = getCustomWorkouts();
  const workout  = workouts[day] || { title: '—', items: [] };
  const snapshot = {
    title: workout.title,
    exercises: (workout.items || []).map(item => ({
      name: item,
      weight: getTodayExWeight(item) || null
    }))
  };
  const logs = JSON.parse(localStorage.getItem('workoutLogs') || '{}');
  logs[today] = snapshot;
  localStorage.setItem('workoutLogs', JSON.stringify(logs));
}

let selectedHistoryKey = null;

function renderWeekTrend() {
  const container = document.getElementById('weekTrend');
  if (!container) return;
  const DAYS = ['M','T','W','T','F','S','S'];
  const todayDow = new Date().getDay();
  const todayIdx = todayDow === 0 ? 6 : todayDow - 1;
  const allScores = JSON.parse(localStorage.getItem('dailyScores') || '{}');
  const { score: todayScore } = calculatePerformanceScore();
  container.innerHTML = '';

  for (let i = 0; i < 7; i++) {
    const offset = i - todayIdx;
    const d = new Date(); d.setDate(d.getDate() + offset);
    const key = d.toLocaleDateString();
    const isToday  = i === todayIdx;
    const isFuture = i > todayIdx;
    const rawData  = allScores[key];
    const score    = isFuture ? 0 : (isToday ? todayScore : (typeof rawData === 'object' ? rawData.score : rawData || 0));
    const barH     = isFuture ? 4 : Math.max(4, Math.round((score / 100) * 52));
    const barCls   = isFuture ? 'week-bar empty' : (isToday ? 'week-bar today' : 'week-bar');
    const isSelected = key === selectedHistoryKey;

    const col = document.createElement('div');
    col.className = 'week-bar-col' + (isSelected ? ' selected' : '');
    col.innerHTML = `<div class="${barCls}" style="height:${barH}px"></div><span class="week-day-lbl${isToday?' today':''}">${DAYS[i]}</span>`;

    if (!isFuture) {
      col.addEventListener('click', () => {
        if (selectedHistoryKey === key) {
          selectedHistoryKey = null;
        } else {
          selectedHistoryKey = key;
        }
        renderWeekTrend();
        renderHistoryDetail(key, isToday, d, rawData, isToday ? todayScore : score);
      });
    }
    container.appendChild(col);
  }

  // Re-render detail if a key is selected
  if (selectedHistoryKey) {
    const d2 = new Date(selectedHistoryKey);
    const isToday2 = selectedHistoryKey === new Date().toLocaleDateString();
    const raw2 = allScores[selectedHistoryKey];
    const score2 = isToday2 ? todayScore : (typeof raw2 === 'object' ? raw2.score : raw2 || 0);
    renderHistoryDetail(selectedHistoryKey, isToday2, d2, raw2, score2);
  } else {
    const det = document.getElementById('historyDetail');
    if (det) det.innerHTML = '';
  }
}

function renderHistoryDetail(key, isToday, dateObj, rawData, score) {
  const det = document.getElementById('historyDetail');
  if (!det) return;

  // If nothing selected, clear
  if (!selectedHistoryKey) { det.innerHTML = ''; return; }

  const tiers = [[0,'Getting Started'],[20,'Building Momentum'],[40,'Making Progress'],[60,'On Track'],[75,'Strong Day'],[90,'Elite Performance']];
  const getTier = (s) => [...tiers].reverse().find(([min]) => s >= min)?.[1] || 'Getting Started';

  let workoutPct, hydrationPct, todoPct, tierLabel, workoutTitle, hydrationOz, hydrationGoal;

  if (isToday) {
    const perf = calculatePerformanceScore();
    workoutPct   = perf.workoutPct;
    hydrationPct = perf.hydrationPct;
    todoPct      = perf.todoPct;
    tierLabel    = getTier(score);
    const day    = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    workoutTitle = getCustomWorkouts()[day]?.title || '—';
    hydrationOz  = getHydrationCount() * getHydrationOzPerDrop();
    hydrationGoal = getHydrationGoal();
  } else if (rawData && typeof rawData === 'object') {
    workoutPct   = rawData.workoutPct   || 0;
    hydrationPct = rawData.hydrationPct || 0;
    todoPct      = rawData.todoPct      || 0;
    tierLabel    = rawData.tier         || getTier(score);
    workoutTitle = rawData.workoutTitle || '—';
    hydrationOz  = rawData.hydrationOz  ?? null;
    hydrationGoal = rawData.hydrationGoal || 125;
  } else {
    // Legacy: only score saved, estimate from score
    workoutPct = hydrationPct = todoPct = score;
    tierLabel  = getTier(score);
    workoutTitle = '—';
    hydrationOz = null;
  }

  const dateLabel = isToday
    ? 'Today'
    : dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

  const hydLine = hydrationOz !== null
    ? `<div class="history-bar-row">
        <span class="history-bar-lbl">Hydration</span>
        <div class="history-bar-track"><div class="history-bar-fill" style="width:${hydrationPct}%"></div></div>
        <span class="history-bar-pct">${hydrationOz}oz</span>
       </div>`
    : `<div class="history-bar-row">
        <span class="history-bar-lbl">Hydration</span>
        <div class="history-bar-track"><div class="history-bar-fill" style="width:${hydrationPct}%"></div></div>
        <span class="history-bar-pct">${hydrationPct}%</span>
       </div>`;

  det.innerHTML = `
    <div class="history-detail">
      <span class="history-date-label">${dateLabel}</span>
      ${workoutTitle !== '—' ? `<div style="font-size:11px;color:var(--text-tertiary);margin-bottom:var(--s2)">${workoutTitle}</div>` : ''}
      <div class="history-score-row">
        <span class="history-score-num">${score}</span>
        <span class="history-score-out">/ 100</span>
      </div>
      <div class="history-tier">${tierLabel}</div>
      <div class="history-bars">
        <div class="history-bar-row">
          <span class="history-bar-lbl">Workout</span>
          <div class="history-bar-track"><div class="history-bar-fill" style="width:${workoutPct}%"></div></div>
          <span class="history-bar-pct">${workoutPct}%</span>
        </div>
        ${hydLine}
        <div class="history-bar-row">
          <span class="history-bar-lbl">Tasks</span>
          <div class="history-bar-track"><div class="history-bar-fill" style="width:${todoPct}%"></div></div>
          <span class="history-bar-pct">${todoPct}%</span>
        </div>
      </div>
    </div>`;
}

function renderWorkoutHeatmap() {
  const container = document.getElementById('workoutHeatmap');
  const countEl   = document.getElementById('statsWorkoutCount');
  if (!container) return;

  const completions = JSON.parse(localStorage.getItem('workoutCompletions') || '{}');
  const logs        = JSON.parse(localStorage.getItem('workoutLogs')        || '{}');
  container.innerHTML = '';

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Align to most recent Monday
  const dow = today.getDay();
  const daysSinceMonday = dow === 0 ? 6 : dow - 1;
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - daysSinceMonday);

  // Grid starts 4 weeks before current week Monday = 35 days
  const gridStart = new Date(weekStart);
  gridStart.setDate(weekStart.getDate() - 28);

  let count = 0;

  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 7; col++) {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + row * 7 + col);
      const key      = d.toLocaleDateString();
      const val      = completions[key] || 0;
      const isToday  = d.getTime() === today.getTime();
      const isFuture = d > today;
      const isSunday = d.getDay() === 0;

      const dot = document.createElement('div');
      let cls = 'hm-dot';
      if (isFuture)            cls += ' future';
      else if (val === 2)      { cls += ' great'; count++; }
      else if (val === 1)      { cls += ' done';  count++; }
      else if (isSunday)       cls += ' rest';
      if (isToday)             cls += ' today';
      dot.className = cls;

      const label  = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      const status = isFuture ? 'Upcoming' : val === 2 ? 'Completed ✓' : val === 1 ? 'Partial' : isSunday ? 'Rest Day' : 'No workout';
      dot.title = `${label} — ${status}`;

      if (val > 0 && !isFuture) {
        dot.style.cursor = 'pointer';
        dot.addEventListener('click', e => {
          e.stopPropagation();
          showWorkoutLogPopover(dot, key, d, logs[key] || null);
        });
      }
      container.appendChild(dot);
    }
  }

  if (countEl) countEl.textContent = `${count} done`;
}

function resetWorkoutHistory() {
  if (!confirm('Reset all workout history? This cannot be undone.')) return;
  localStorage.removeItem('workoutCompletions');
  localStorage.removeItem('workoutLogs');
  // Also clear daily celebration keys so today can be re-triggered
  Object.keys(localStorage).filter(k => k.startsWith('workoutCelebrated_')).forEach(k => localStorage.removeItem(k));
  renderWorkoutHeatmap();
  updateStatsScreen();
}

function showWorkoutLogPopover(anchor, dateKey, dateObj, log) {
  // Remove any existing popover
  document.getElementById('wl-popover')?.remove();

  const dateLabel = dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  const title     = log?.title || 'Workout';
  const exercises = log?.exercises || [];

  const pop = document.createElement('div');
  pop.id = 'wl-popover';
  pop.style.cssText = `
    position: fixed; z-index: 9990;
    background: linear-gradient(145deg, #1a1a1a, #111);
    border: 1px solid rgba(212,175,55,0.25);
    border-radius: 16px;
    padding: 16px 18px;
    min-width: 230px; max-width: 290px;
    box-shadow: 0 16px 48px rgba(0,0,0,0.7);
    font-family: var(--font-main);
    animation: fadeSlideUp 0.22s cubic-bezier(0.34,1.56,0.64,1) both;
  `;

  const rows = exercises.length
    ? exercises.map(ex => {
        const name = ex.name.split(/[–—]/)[0].trim();
        const wt   = ex.weight ? `<span style="color:var(--gold);font-weight:700">${ex.weight}</span>` : `<span style="color:rgba(255,255,255,0.3)">—</span>`;
        return `<div style="display:flex;justify-content:space-between;align-items:center;padding:5px 0;border-bottom:1px solid rgba(255,255,255,0.05)">
          <span style="font-size:12px;color:rgba(255,255,255,0.75);flex:1;padding-right:8px">${name}</span>
          <span style="font-size:12px;white-space:nowrap">${wt}</span>
        </div>`;
      }).join('')
    : `<div style="font-size:12px;color:rgba(255,255,255,0.35);padding:6px 0">No exercise data logged</div>`;

  pop.innerHTML = `
    <div style="font-size:10px;color:var(--gold);font-weight:700;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:4px">${dateLabel}</div>
    <div style="font-size:14px;color:#fff;font-weight:700;margin-bottom:12px">${title}</div>
    <div style="border-top:1px solid rgba(255,255,255,0.07);padding-top:8px">${rows}</div>
    <div style="font-size:10px;color:rgba(255,255,255,0.2);text-align:center;margin-top:10px">Tap anywhere to close</div>
  `;

  document.body.appendChild(pop);

  // Position near anchor
  const rect = anchor.getBoundingClientRect();
  const pw = 270, ph = 60 + exercises.length * 34;
  let left = rect.left + rect.width / 2 - pw / 2;
  let top  = rect.top - ph - 12;
  if (left < 8) left = 8;
  if (left + pw > window.innerWidth - 8) left = window.innerWidth - pw - 8;
  if (top < 8) top = rect.bottom + 12;
  pop.style.left = `${left}px`;
  pop.style.top  = `${top}px`;

  // Close on outside tap
  setTimeout(() => document.addEventListener('click', () => pop.remove(), { once: true }), 10);
}

// ── Achievement System ─────────────────────────
const ACHIEVEMENTS = [
  { id: 'first_workout',  icon: '💪', label: 'First Blood',    desc: 'Complete your first workout',        check: () => Object.keys(JSON.parse(localStorage.getItem('workoutCompletions') || '{}')).length >= 1 },
  { id: 'streak_3',       icon: '🔥', label: 'On Fire',        desc: '3-day streak',                       check: () => parseInt(localStorage.getItem('streak') || '0') >= 3 },
  { id: 'streak_7',       icon: '⚡', label: 'Electric',       desc: '7-day streak',                       check: () => parseInt(localStorage.getItem('streak') || '0') >= 7 },
  { id: 'streak_30',      icon: '👑', label: 'Wolfpack Elite', desc: '30-day streak',                      check: () => parseInt(localStorage.getItem('streak') || '0') >= 30 },
  // perfect_score: checks historical dailyScores OR live score; excludes todos if none exist
  { id: 'perfect_score',  icon: '💯', label: 'Perfect Day',    desc: 'Score 100 in a single day',          check: () => {
    // Check historical
    const saved = JSON.parse(localStorage.getItem('dailyScores') || '{}');
    if (Object.values(saved).some(v => (typeof v === 'object' ? v.score : v) >= 100)) return true;
    // Check live — rebalance if no todos
    const workoutPct   = (() => { const cbs = document.querySelectorAll('#workoutList input[type="checkbox"]'); return cbs.length ? Math.round([...cbs].filter(c=>c.checked).length/cbs.length*100) : 0; })();
    const hydrationPct = Math.round((getHydrationCount() / 9) * 100);
    const todoCbs      = document.querySelectorAll('#todoList input[type="checkbox"]');
    const todoPct      = todoCbs.length ? Math.round([...todoCbs].filter(c=>c.checked).length/todoCbs.length*100) : null;
    const score = todoPct === null
      ? Math.round(workoutPct * 0.625 + hydrationPct * 0.375)
      : Math.round(workoutPct * 0.50  + hydrationPct * 0.30 + todoPct * 0.20);
    return score >= 100;
  }},
  // hydration_full: uses a persistent flag set when all 9 drops filled (not live count which resets daily)
  { id: 'hydration_full', icon: '💧', label: 'Hydrated',       desc: 'Hit full hydration goal in one day', check: () => !!localStorage.getItem('hydration_ever_full') },
  { id: 'photo_1',        icon: '📸', label: 'Snapshot',       desc: 'Add your first progress photo',      check: () => JSON.parse(localStorage.getItem('progressPhotos') || '[]').length >= 1 },
  { id: 'workouts_10',    icon: '🏋️', label: 'Consistent',     desc: '10 total workouts completed',        check: () => Object.keys(JSON.parse(localStorage.getItem('workoutCompletions') || '{}')).length >= 10 },
  { id: 'weight_logged',  icon: '⚖️', label: 'Checked In',     desc: 'Log your first weight entry',        check: () => getWeightHistory().length >= 1 },
  { id: 'best_streak_14', icon: '🐺', label: 'Pack Leader',    desc: 'Best streak of 14+ days',            check: () => parseInt(localStorage.getItem('bestStreak') || '0') >= 14 },
];

// Toast queue — shows toasts one at a time so they never overlap
const _toastQueue = [];
let   _toastRunning = false;

function enqueueAchievementToast(achievement) {
  _toastQueue.push(achievement);
  if (!_toastRunning) processToastQueue();
}

function processToastQueue() {
  if (!_toastQueue.length) { _toastRunning = false; return; }
  _toastRunning = true;
  const achievement = _toastQueue.shift();

  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed; bottom: 90px; left: 50%; transform: translateX(-50%) translateY(20px);
    background: linear-gradient(135deg, rgba(30,25,5,0.98), rgba(20,18,5,0.98));
    border: 1px solid var(--gold-border); border-radius: var(--r-lg);
    padding: 12px 20px; display: flex; align-items: center; gap: 10px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.6); z-index: 9999;
    opacity: 0; transition: all 0.35s cubic-bezier(0.34,1.56,0.64,1);
    font-family: var(--font-main); white-space: nowrap;
  `;
  toast.innerHTML = `
    <span style="font-size:22px">${achievement.icon}</span>
    <div>
      <div style="font-size:11px;color:var(--gold);font-weight:700;letter-spacing:0.06em;text-transform:uppercase">Achievement Unlocked</div>
      <div style="font-size:13px;color:#fff;font-weight:600">${achievement.label}</div>
      <div style="font-size:11px;color:rgba(255,255,255,0.5);margin-top:2px">${achievement.desc}</div>
    </div>
  `;
  document.body.appendChild(toast);
  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(-50%) translateY(0)';
  });

  // Streak milestones get the chimes; everything else gets the coin win
  const streakAchievements = ['streak_3', 'streak_7', 'streak_30', 'best_streak_14'];
  if (streakAchievements.includes(achievement.id)) playStreakMilestone();
  else playAchievement();

  // Also fire a system notification
  if (Notification.permission === 'granted') {
    new Notification(`${achievement.icon} Achievement Unlocked`, {
      body: `${achievement.label} — ${achievement.desc}`,
      icon: 'Wolf.png',
      badge: 'Wolf.png'
    });
  }

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(10px)';
    setTimeout(() => {
      toast.remove();
      setTimeout(processToastQueue, 500); // gap between stacked toasts
    }, 400);
  }, 6000);
}

function checkAndUnlockAchievements() {
  const unlocked = JSON.parse(localStorage.getItem('achievements') || '[]');
  const newOnes  = [];
  ACHIEVEMENTS.forEach(a => {
    if (!unlocked.includes(a.id) && a.check()) {
      unlocked.push(a.id);
      newOnes.push(a);
    }
  });
  if (newOnes.length) {
    localStorage.setItem('achievements', JSON.stringify(unlocked));
    newOnes.forEach(a => enqueueAchievementToast(a));
  }
  return unlocked;
}

// Kept for backwards compat — now just an alias
function showAchievementToast(achievement) { enqueueAchievementToast(achievement); }

function renderAchievements() {
  const grid = document.getElementById('achievementGrid');
  if (!grid) return;
  const unlocked = checkAndUnlockAchievements();
  grid.innerHTML = '';
  ACHIEVEMENTS.forEach(a => {
    const isUnlocked = unlocked.includes(a.id);
    const badge = document.createElement('div');
    badge.className = 'achievement-badge' + (isUnlocked ? ' unlocked' : '');
    badge.title = a.desc;
    badge.innerHTML = `
      <span class="achievement-icon">${isUnlocked ? a.icon : '🔒'}</span>
      <span class="achievement-label">${a.label}</span>
    `;
    grid.appendChild(badge);
  });
}

// ── Bi-Weekly Weight Check-In Reminder ─────────
function scheduleBiWeeklyWeightReminder() {
  if (Notification.permission !== 'granted') return;
  if (getWeightHistory().length === 0) return; // only after first log

  const lastDate = localStorage.getItem('lastWeightDate');
  const now = new Date();
  const next = lastDate ? new Date(lastDate) : new Date();
  next.setDate(next.getDate() + 14);
  const delay = next - now;
  if (delay <= 0) return;

  setTimeout(() => {
    const history = getWeightHistory();
    const last    = history[history.length - 1];
    const body    = last
      ? `Last check-in: ${last.lbs} lbs. Time to log your bi-weekly weight.`
      : 'Time for your bi-weekly weight check-in. Open Wolfpack to log it.';
    new Notification('⚖️ Bi-Weekly Check-In', { body, icon: 'Wolf.png', badge: 'Wolf.png' });
    playAlarm();
  }, delay);
}

// ── Weight Tracking ────────────────────────────
function getWeightHistory() {
  return JSON.parse(localStorage.getItem('weightHistory') || '[]');
}

function logWeight(lbs) {
  const history = getWeightHistory();
  const today = new Date().toLocaleDateString();
  // Replace today's entry if it exists
  const idx = history.findIndex(e => e.date === today);
  if (idx >= 0) history[idx].lbs = lbs;
  else history.push({ date: today, lbs });
  // Keep last 30 entries
  if (history.length > 30) history.splice(0, history.length - 30);
  localStorage.setItem('weightHistory', JSON.stringify(history));
  localStorage.setItem('lastWeightDate', new Date().toISOString());
  renderWeightTile();
  scheduleBiWeeklyWeightReminder();
  checkAndUnlockAchievements();
}

function renderWeightTile() {
  const history = getWeightHistory();
  const latest  = history[history.length - 1];
  const el      = document.getElementById('statsWeight');
  if (el) el.textContent = latest ? latest.lbs : '—';
  drawWeightSparkline(history);
}

function drawWeightSparkline(history) {
  const canvas = document.getElementById('weightSparkline');
  if (!canvas || history.length < 2) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  const vals  = history.map(e => e.lbs);
  const min   = Math.min(...vals) - 1;
  const max   = Math.max(...vals) + 1;
  const range = max - min || 1;

  const pts = vals.map((v, i) => ({
    x: (i / (vals.length - 1)) * W,
    y: H - ((v - min) / range) * H
  }));

  // Line
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  pts.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
  ctx.strokeStyle = '#D4AF37';
  ctx.lineWidth = 1.5;
  ctx.lineJoin = 'round';
  ctx.stroke();

  // Dot on latest
  const last = pts[pts.length - 1];
  ctx.beginPath();
  ctx.arc(last.x, last.y, 2.5, 0, Math.PI * 2);
  ctx.fillStyle = '#FFD700';
  ctx.fill();
}

function showWeightPrompt() {
  const history = getWeightHistory();
  const last    = history[history.length - 1];
  const current = last ? last.lbs : '';
  const val = prompt(`Log today's weight (lbs):`, current);
  if (val === null) return;
  const num = parseFloat(val);
  if (isNaN(num) || num < 50 || num > 700) { alert('Please enter a valid weight between 50–700 lbs.'); return; }
  logWeight(num);
}

function updateStatsScreen() {
  const { score } = calculatePerformanceScore();
  const tiers = [[0,'Getting Started'],[20,'Building Momentum'],[40,'Making Progress'],[60,'On Track'],[75,'Strong Day'],[90,'Elite Performance']];
  const tier = [...tiers].reverse().find(([min]) => score >= min);
  const statsScore = document.getElementById('statsScoreNumber'); if (statsScore) animateCountUp(statsScore, score);
  const statsGrade = document.getElementById('statsScoreGrade');  if (statsGrade) statsGrade.textContent = tier ? tier[1] : 'Getting Started';

  const streak = parseInt(localStorage.getItem('streak') || '0');
  const statsStreak = document.getElementById('statsStreakCount'); if (statsStreak) animateCountUp(statsStreak, streak);

  const best = Math.max(streak, parseInt(localStorage.getItem('bestStreak') || '0'));
  localStorage.setItem('bestStreak', best);
  const bestEl = document.getElementById('statsBestStreak'); if (bestEl) animateCountUp(bestEl, best);

  renderWeightTile();

  const hydCount  = getHydrationCount();
  const hydGoal   = getHydrationGoal();
  const hydroOz   = Math.round((hydCount / 9) * hydGoal);
  const hydroEl   = document.getElementById('statsHydroCount'); if (hydroEl)  animateCountUp(hydroEl, hydroOz);
  const hydroLbl  = document.getElementById('statsHydroLabel'); if (hydroLbl) hydroLbl.textContent = `/ ${hydGoal} oz`;

  renderWeekTrend();
  renderWorkoutHeatmap();
  renderAchievements();
}

function saveProgress() {
  document.querySelectorAll('input[type="checkbox"]').forEach(input => localStorage.setItem(input.id, input.checked));
  document.querySelectorAll('.purpose-input').forEach((ta, i) => localStorage.setItem(`purpose_${i}`, ta.value));
  const msg = document.getElementById('message');
  if (msg) { msg.textContent = 'Progress saved!'; msg.style.opacity = '1'; setTimeout(() => { msg.style.opacity = '0'; }, 2800); }
  saveDailyScore();
  checkStreakCompletion();
  checkAndUnlockAchievements();
}

function updateStreak() {
  const streak = parseInt(localStorage.getItem('streak') || '0');
  animateCountUp(document.getElementById('streakDisplay'), streak);
  const statsStreak = document.getElementById('statsStreakCount');
  if (statsStreak) animateCountUp(statsStreak, streak);
  const greetingStreak = document.getElementById('greetingStreak');
  if (greetingStreak) greetingStreak.textContent = streak;
}

function checkStreakCompletion() {
  const routineInputs = [...document.querySelectorAll('#routineList input')];
  const hydrationDone = getHydrationCount() >= 9;
  const today = new Date().toLocaleDateString(), lastDay = localStorage.getItem('lastStreakDate');
  if (routineInputs.length && routineInputs.every(i => i.checked) && hydrationDone && lastDay !== today) {
    let streak = parseInt(localStorage.getItem('streak') || '0') + 1;
    localStorage.setItem('streak', streak); localStorage.setItem('lastStreakDate', today);
    // Update bestStreak immediately so achievement check is current
    const best = Math.max(streak, parseInt(localStorage.getItem('bestStreak') || '0'));
    localStorage.setItem('bestStreak', best);
    updateStreak();
    checkAndUnlockAchievements();
  }
}

function loadRoutine() {
  const day       = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const workouts  = getCustomWorkouts();
  const schedule  = getCustomSchedule();
  const hydration = getCustomHydration();
  const dayEl = document.getElementById('dayName');
  if (dayEl) dayEl.textContent = day;
  const quoteEl = document.getElementById('quote');
  if (quoteEl) quoteEl.textContent = getDailyQuote();

  loadHydrationDrops();
  loadScheduleTimeline('routineList', schedule, 'routine');

  const workout = workouts[day] || { title: 'Rest & Recovery', items: [] };
  const titleEl = document.getElementById('workoutTitle');
  if (titleEl) titleEl.textContent = workout.title || '—';
  loadList('workoutList', workout.items || [], 'workout');

  // Today workout quick card on Today tab
  const todayWODTitle = document.getElementById('todayWODTitle');
  const todayWODCount = document.getElementById('todayWODCount');
  if (todayWODTitle) todayWODTitle.textContent = workout.title || 'Rest & Recovery';
  if (todayWODCount) todayWODCount.textContent = workout.items?.length || 0;
  const todayCard = document.getElementById('todayWorkoutCard');
  if (todayCard) todayCard.style.display = workout.items?.length ? 'flex' : 'none';

  setNextWorkout();
  document.querySelectorAll('.purpose-input').forEach((ta, i) => { const saved = localStorage.getItem(`purpose_${i}`); if (saved !== null) ta.value = saved; });
  // Auto-save on input
  document.querySelectorAll('.purpose-input').forEach((ta, i) => {
    ta.addEventListener('input', () => localStorage.setItem(`purpose_${i}`, ta.value));
  });
  updateStreak();
  renderStreakWeek();
  checkStreakCompletion();
  updatePerformanceScore();
  renderGreetingHeader();
  renderNowBlock();
}

// ── Todo ───────────────────────────────────────
function resetTodosIfNewDay() {
  const lastDate = localStorage.getItem('todos_date');
  const today = new Date().toLocaleDateString();
  if (lastDate && lastDate !== today) {
    // Keep undone tasks, archive done ones
    const todos = JSON.parse(localStorage.getItem('todos') || '[]');
    localStorage.setItem('todos', JSON.stringify(todos.filter(t => !t.done)));
  }
  localStorage.setItem('todos_date', today);
}

function loadTodos() {
  const list = document.getElementById('todoList'); if (!list) return;
  resetTodosIfNewDay();
  const todos = JSON.parse(localStorage.getItem('todos') || '[]');
  list.innerHTML = '';
  todos.forEach((todo, i) => {
    const li = document.createElement('li');
    if (todo.done) li.classList.add('completed');
    const delBtn = `<button class="todo-del-btn" data-idx="${i}" aria-label="Delete task" title="Delete">×</button>`;
    li.innerHTML = `<input type="checkbox" id="todo_${i}" ${todo.done ? 'checked' : ''}><label for="todo_${i}">${todo.text}</label>${delBtn}`;
    list.appendChild(li);
    const cb = li.querySelector('input');
    cb.addEventListener('change', () => {
      todo.done = cb.checked;
      todo.done ? li.classList.add('completed') : li.classList.remove('completed');
      if (todo.done) { playCheck(); spawnParticles(cb); }
      localStorage.setItem('todos', JSON.stringify(todos));
      updatePerformanceScore();
      scheduleTodoReminders();
      checkAndUnlockAchievements();
    });
    li.querySelector('.todo-del-btn').addEventListener('click', () => {
      todos.splice(i, 1);
      localStorage.setItem('todos', JSON.stringify(todos));
      loadTodos();
      updatePerformanceScore();
    });
  });
}
function addTodo() {
  const input = document.getElementById('newTodo'), text = input.value.trim();
  if (!text) return;
  const todos = JSON.parse(localStorage.getItem('todos') || '[]');
  todos.push({ text, done: false });
  localStorage.setItem('todos', JSON.stringify(todos));
  input.value = '';
  scheduleTodoReminders();
  loadTodos();
}

// ── Photos ─────────────────────────────────────
function loadPhotos() {
  const gallery = document.getElementById('photoGallery'), reminderEl = document.getElementById('photoReminderLabel');
  if (!gallery) return;
  gallery.innerHTML = '';
  JSON.parse(localStorage.getItem('progressPhotos') || '[]').slice().reverse().forEach(photo => {
    const img = document.createElement('img'); img.src = photo.src; img.title = new Date(photo.date).toLocaleString(); gallery.appendChild(img);
  });
  if (reminderEl) {
    const lastDate = localStorage.getItem('lastPhotoDate');
    if (lastDate) { const next = new Date(lastDate); next.setDate(next.getDate() + 14); const diff = Math.ceil((next - new Date()) / 86400000); reminderEl.textContent = diff > 0 ? `Next: ${diff}d` : 'Photo due!'; }
    else reminderEl.textContent = 'Next: 14 days';
  }
}
function setupPhotoUpload() {
  const input = document.getElementById('photoInput'); if (!input) return;
  input.addEventListener('change', () => {
    const file = input.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      const photos = JSON.parse(localStorage.getItem('progressPhotos') || '[]');
      photos.push({ src: e.target.result, date: new Date().toISOString() });
      localStorage.setItem('progressPhotos', JSON.stringify(photos));
      localStorage.setItem('lastPhotoDate', new Date().toISOString());
      loadPhotos(); scheduleNextPhotoReminder();
      checkAndUnlockAchievements();
    };
    reader.readAsDataURL(file);
  });
}
function scheduleNextPhotoReminder() {
  const lastDate = localStorage.getItem('lastPhotoDate'), now = new Date();
  const next = lastDate ? new Date(lastDate) : new Date(); next.setDate(next.getDate() + 14);
  const delay = next - now;
  if (delay > 0 && Notification.permission === 'granted') setTimeout(() => { new Notification('📸 Progress Check-In', { body: 'Time to take your bi-weekly progress photo!' }); playAlarm(); }, delay);
}

// ══════════════════════════════════════════════
// ONBOARDING WIZARD
// ══════════════════════════════════════════════

const wizardAnswers = {};
let currentStep = 0;
const TOTAL_STEPS = 9;

function wizardGoTo(step) {
  const steps = document.querySelectorAll('.wizard-step');
  steps.forEach(s => {
    const n = parseInt(s.dataset.step);
    s.classList.remove('active', 'exit');
    if (n === step) s.classList.add('active');
    else if (n < step) s.classList.add('exit');
  });
  currentStep = step;
  const fill = document.getElementById('wizardProgressFill');
  if (fill) fill.style.width = `${(step / (TOTAL_STEPS - 1)) * 100}%`;

  // Show/hide back button — hidden on step 0
  const backBtn = document.getElementById('wizardBack');
  if (backBtn) backBtn.classList.toggle('hidden', step === 0);

  // Hide watermark on step 0 (welcome page)
  const watermark = document.querySelector('.wizard-page-watermark');
  if (watermark) watermark.style.opacity = step === 0 ? '0' : '1';

  // Update sticky CTA footer
  const footer = document.getElementById('wizardBtnFooter');
  const cta    = document.getElementById('wizardCTA');
  const CTA_MAP = {
    0: { label: "Let's Build My Plan", action: 'next', next: 1 },
    3: { label: 'Continue',            action: 'next', next: 4 },
    6: { label: 'Next Step',           action: 'next', next: 7 },
    7: { label: 'Build My Plan →',     action: 'finish'         },
    9: { label: 'Start Training →',    action: 'done'           },
  };
  if (footer && cta) {
    const cfg = CTA_MAP[step];
    footer.classList.toggle('hidden', !cfg || step === 8);
    if (cfg) {
      cta.textContent   = cfg.label;
      cta._wAction      = cfg.action;
      cta._wNext        = cfg.next;
    }
  }
}

function initWizard() {
  // Single-choice options auto-advance
  document.querySelectorAll('.wizard-option:not(.multi-opt)').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.key, val = btn.dataset.val;
      wizardAnswers[key] = val;

      // Deselect siblings
      btn.closest('.wizard-options').querySelectorAll('.wizard-option').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');

      // Auto-advance after short delay
      setTimeout(() => {
        const step = parseInt(btn.closest('.wizard-step').dataset.step);
        // Skip equipment step if gym-only
        if (key === 'location' && val === 'gym') {
          wizardAnswers.equipment = [];
          wizardGoTo(4);
        } else {
          wizardGoTo(step + 1);
        }
      }, 280);
    });
  });

  // Multi-select options toggle
  document.querySelectorAll('.multi-opt').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.classList.toggle('selected');
      const key = btn.dataset.key, val = btn.dataset.val;
      if (!wizardAnswers[key]) wizardAnswers[key] = [];
      if (btn.classList.contains('selected')) {
        if (!wizardAnswers[key].includes(val)) wizardAnswers[key].push(val);
      } else {
        wizardAnswers[key] = wizardAnswers[key].filter(v => v !== val);
      }
    });
  });

  // Custom supplement / medication entry
  (function() {
    const input = document.getElementById('customSuppInput');
    const addBtn = document.getElementById('customSuppAdd');
    const tagsEl = document.getElementById('customSuppTags');

    function addCustomSupp(val) {
      val = val.trim();
      if (!val) return;
      if (!wizardAnswers.supplements) wizardAnswers.supplements = [];
      const key = 'custom:' + val.toLowerCase();
      if (wizardAnswers.supplements.includes(key)) return;
      wizardAnswers.supplements.push(key);

      const tag = document.createElement('div');
      tag.className = 'custom-supp-tag';
      tag.innerHTML = `<span>${val}</span><button title="Remove">×</button>`;
      tag.querySelector('button').addEventListener('click', () => {
        wizardAnswers.supplements = wizardAnswers.supplements.filter(s => s !== key);
        tag.remove();
      });
      tagsEl.appendChild(tag);
      input.value = '';
    }

    addBtn.addEventListener('click', () => addCustomSupp(input.value));
    input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); addCustomSupp(input.value); } });
  })();

  // Sticky CTA button
  document.getElementById('wizardCTA')?.addEventListener('click', () => {
    const cta = document.getElementById('wizardCTA');
    const action = cta._wAction;
    if (action === 'next') {
      wizardGoTo(cta._wNext);
    } else if (action === 'finish') {
      // Gather schedule answers
      wizardAnswers.wakeTime              = document.getElementById('inputWake')?.value             || '05:00';
      wizardAnswers.workStart             = document.getElementById('inputWorkStart')?.value        || '08:00';
      wizardAnswers.workEnd               = document.getElementById('inputWorkEnd')?.value          || '17:00';
      wizardAnswers.sleepTime             = document.getElementById('inputSleep')?.value            || '22:00';
      wizardAnswers.morning               = document.getElementById('inputMorning')?.value.trim()   || '';
      wizardAnswers.morningObligationTime = document.getElementById('inputMorningTime')?.value      || '07:00';
      wizardAnswers.workoutTime           = document.getElementById('inputWorkoutTime')?.value      || 'early_morning';
      wizardAnswers.workoutStartTime      = document.getElementById('inputWorkoutStartTime')?.value || '05:00';
      wizardGoTo(8);
      runGenerating();
    } else if (action === 'done') {
      closeWizard();
    }
  });

  // Back button
  document.getElementById('wizardBack')?.addEventListener('click', () => {
    if (currentStep > 0) wizardGoTo(currentStep - 1);
  });

  // Skip
  document.getElementById('wizardSkip')?.addEventListener('click', () => {
    if (confirm('Skip setup? You can run it again from Settings.')) closeWizard();
  });
}

function runGenerating() {
  const statuses = [
    'Analyzing your goals...',
    'Selecting the right program...',
    'Assigning exercises per day...',
    'Building your schedule...',
    'Timing your supplements...',
    'Optimizing hydration windows...',
    'Finalizing your plan...',
  ];
  const el = document.getElementById('genStatus');
  let i = 0;
  const interval = setInterval(() => {
    if (el && i < statuses.length) { el.textContent = statuses[i]; i++; }
    else { clearInterval(interval); finalizePlan(); }
  }, 380);
}

function finalizePlan() {
  // Generate workout plan
  const workoutPlan = generateWorkoutPlan(wizardAnswers);
  localStorage.setItem('custom_workouts', JSON.stringify(workoutPlan));

  // Generate schedule
  const { schedule, hydration } = generateSchedule(wizardAnswers);
  localStorage.setItem('custom_schedule',  JSON.stringify(schedule));
  localStorage.setItem('custom_hydration', JSON.stringify(hydration));

  // Mark wizard complete
  localStorage.setItem('wizardComplete', '1');
  localStorage.setItem('wizardAnswers',  JSON.stringify(wizardAnswers));

  // Reload routine with new data
  loadRoutine();

  // Show done screen with preview
  renderPlanPreview(workoutPlan);
  wizardGoTo(9);
}

function renderPlanPreview(plan) {
  const preview = document.getElementById('planPreview');
  const summary = document.getElementById('planSummary');
  if (!preview) return;

  const days = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
  const trainingDays = days.filter(d => plan[d] && plan[d].items.length > 0);

  if (summary) summary.textContent = `${trainingDays.length}-day training plan with customized schedule — all built around your life.`;

  preview.innerHTML = '';
  days.forEach(day => {
    const data = plan[day];
    if (!data) return;
    const row = document.createElement('div');
    row.className = 'plan-preview-row';
    row.innerHTML = `<span class="plan-preview-day">${day.slice(0,3)}</span><span class="plan-preview-title">${data.title}</span>`;
    preview.appendChild(row);
  });
}

function closeWizard() {
  const overlay = document.getElementById('wizardOverlay');
  if (overlay) {
    overlay.classList.add('hidden');
    setTimeout(() => { overlay.style.display = 'none'; }, 400);
  }
  loadRoutine();
  // Always land on Today tab after wizard
  document.querySelector('[data-tab="today"]')?.click();
}

function openWizard() {
  const overlay = document.getElementById('wizardOverlay');
  if (overlay) {
    overlay.style.display = 'flex';
    requestAnimationFrame(() => overlay.classList.remove('hidden'));
  }
  // Reset
  Object.keys(wizardAnswers).forEach(k => delete wizardAnswers[k]);
  document.querySelectorAll('.wizard-option').forEach(b => b.classList.remove('selected'));
  wizardGoTo(0);
}

// ══════════════════════════════════════════════
// SETTINGS
// ══════════════════════════════════════════════

let currentSettingsTab = 'workouts';
let currentSettingsDay = null;

function renderSettings() {
  document.querySelectorAll('.settings-subtab').forEach(tab => tab.classList.toggle('active', tab.dataset.stab === currentSettingsTab));
  const content = document.getElementById('settings-content');
  if (!content) return;
  content.innerHTML = '';
  if      (currentSettingsTab === 'workouts')  renderWorkoutsEditor(content);
  else if (currentSettingsTab === 'schedule')  renderScheduleEditor(content);
  else if (currentSettingsTab === 'hydration') renderHydrationEditor(content);
  else if (currentSettingsTab === 'profile')       renderProfileEditor(content);
  else if (currentSettingsTab === 'notifications') renderNotificationsEditor(content);
}

function renderWorkoutsEditor(container) {
  const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
  if (!currentSettingsDay) { const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }); currentSettingsDay = DAYS.includes(today) ? today : 'Monday'; }
  const workouts = getCustomWorkouts();
  const dayData  = workouts[currentSettingsDay] || { title: '', items: [] };

  const pillWrap = document.createElement('div');
  pillWrap.className = 'day-pills';
  DAYS.forEach(day => {
    const pill = document.createElement('button');
    pill.className = 'day-pill' + (day === currentSettingsDay ? ' active' : '');
    pill.textContent = day.slice(0, 3);
    pill.addEventListener('click', () => { currentSettingsDay = day; renderSettings(); });
    pillWrap.appendChild(pill);
  });
  container.appendChild(pillWrap);

  const card = makeCard();
  addSectionLabel(card, 'Workout Name');
  const titleInput = document.createElement('input');
  titleInput.type = 'text'; titleInput.className = 'workout-name-input';
  titleInput.value = dayData.title || ''; titleInput.placeholder = 'e.g. Push — Chest, Shoulders';
  titleInput.addEventListener('change', () => {
    const w = getCustomWorkouts(); if (!w[currentSettingsDay]) w[currentSettingsDay] = { title: '', items: [] };
    w[currentSettingsDay].title = titleInput.value.trim();
    localStorage.setItem('custom_workouts', JSON.stringify(w)); loadRoutine();
  });
  card.appendChild(titleInput);

  addSectionLabel(card, 'Exercises');
  renderEditableList(card, dayData.items || [], 'e.g. Bench Press – 4 sets',
    (i, val) => { const w = getCustomWorkouts(); w[currentSettingsDay].items[i] = val; localStorage.setItem('custom_workouts', JSON.stringify(w)); loadRoutine(); },
    (i)      => { const w = getCustomWorkouts(); w[currentSettingsDay].items.splice(i, 1); localStorage.setItem('custom_workouts', JSON.stringify(w)); loadRoutine(); renderSettings(); },
    (val)    => { const w = getCustomWorkouts(); if (!w[currentSettingsDay]) w[currentSettingsDay] = { title: titleInput.value, items: [] }; w[currentSettingsDay].items.push(val); localStorage.setItem('custom_workouts', JSON.stringify(w)); loadRoutine(); renderSettings(); }
  );
  container.appendChild(card);
}

function renderScheduleEditor(container) {
  const card = makeCard(); addSectionLabel(card, 'Daily Schedule');
  renderEditableList(card, getCustomSchedule(), 'e.g. 6:00 AM – Morning walk',
    (i, val) => { const s = getCustomSchedule(); s[i] = val; localStorage.setItem('custom_schedule', JSON.stringify(s)); loadRoutine(); scheduleAllReminders(); },
    (i)      => { const s = getCustomSchedule(); s.splice(i, 1); localStorage.setItem('custom_schedule', JSON.stringify(s)); loadRoutine(); scheduleAllReminders(); renderSettings(); },
    (val)    => { const s = getCustomSchedule(); s.push(val); localStorage.setItem('custom_schedule', JSON.stringify(s)); loadRoutine(); scheduleAllReminders(); renderSettings(); }
  );
  container.appendChild(card);
}

function renderHydrationEditor(container) {
  const card = makeCard();
  addSectionLabel(card, 'Hydration Goal');

  const currentSex = localStorage.getItem('hydration_sex') || 'male';

  const desc = document.createElement('p');
  desc.className = 'settings-empty';
  desc.style.cssText = 'margin-bottom:var(--s3);line-height:1.5';
  desc.textContent = 'Set your biological sex to personalize your daily intake target. Log hydration using the 9 drops on the Schedule tab.';
  card.appendChild(desc);

  const toggleWrap = document.createElement('div');
  toggleWrap.className = 'sex-toggle';
  ['male', 'female'].forEach(sex => {
    const btn = document.createElement('button');
    btn.className = 'sex-toggle-btn' + (currentSex === sex ? ' active' : '');
    btn.textContent = sex === 'male' ? '♂ Male — 125 oz' : '♀ Female — 91 oz';
    btn.addEventListener('click', () => {
      localStorage.setItem('hydration_sex', sex);
      localStorage.removeItem('hydration_count');
      localStorage.removeItem('hydration_count_date');
      loadHydrationDrops();
      updatePerformanceScore();
      renderSettings();
    });
    toggleWrap.appendChild(btn);
  });
  card.appendChild(toggleWrap);

  const goal    = currentSex === 'female' ? 91 : 125;
  const perDrop = Math.round(goal / 9);
  const goalNote = document.createElement('p');
  goalNote.className = 'hydration-oz-note';
  goalNote.style.cssText = 'margin-top:var(--s3);text-align:left';
  goalNote.textContent = `Daily target: ${goal} oz · ${perDrop} oz per drop`;
  card.appendChild(goalNote);

  container.appendChild(card);
}


function renderProfileEditor(container) {
  const card = makeCard();

  // ── Name section ──
  addSectionLabel(card, 'Your Name');
  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.className = 'workout-name-input';
  nameInput.value = localStorage.getItem('user_name') || 'Noel';
  nameInput.placeholder = 'Your name';
  nameInput.style.cssText = 'margin-bottom:var(--s2)';
  card.appendChild(nameInput);

  const nameSaveBtn = document.createElement('button');
  nameSaveBtn.className = 'btn-secondary';
  nameSaveBtn.style.cssText = 'width:100%;margin-bottom:var(--s4)';
  nameSaveBtn.textContent = 'Save Name';
  nameSaveBtn.addEventListener('click', () => {
    const val = nameInput.value.trim();
    if (!val) return;
    localStorage.setItem('user_name', val);
    renderGreetingHeader();
    nameSaveBtn.textContent = 'Saved ✓';
    setTimeout(() => { nameSaveBtn.textContent = 'Save Name'; }, 1500);
  });
  nameInput.addEventListener('keydown', e => { if (e.key === 'Enter') nameSaveBtn.click(); });
  card.appendChild(nameSaveBtn);

  // ── Avatar section ──
  addSectionLabel(card, 'Profile Photo');
  const avatarRow = document.createElement('div');
  avatarRow.style.cssText = 'display:flex;align-items:center;gap:var(--s3);margin-bottom:var(--s2)';

  const previewWrap = document.createElement('div');
  previewWrap.style.cssText = 'width:52px;height:52px;border-radius:50%;background:linear-gradient(135deg,var(--gold),#8B6914);display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:800;color:#000;flex-shrink:0;overflow:hidden;position:relative;';
  const savedPhoto = localStorage.getItem('avatar_photo');
  if (savedPhoto) {
    const img = document.createElement('img');
    img.src = savedPhoto;
    img.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;';
    previewWrap.appendChild(img);
  } else {
    const name = localStorage.getItem('user_name') || 'Noel';
    previewWrap.textContent = name.charAt(0).toUpperCase();
  }
  avatarRow.appendChild(previewWrap);

  const avatarBtns = document.createElement('div');
  avatarBtns.style.cssText = 'display:flex;flex-direction:column;gap:var(--s2);flex:1';

  const uploadBtn = document.createElement('label');
  uploadBtn.className = 'btn-secondary';
  uploadBtn.style.cssText = 'cursor:pointer;padding:8px 14px;font-size:13px;display:flex;align-items:center;justify-content:center;gap:6px;width:100%;box-sizing:border-box';
  uploadBtn.innerHTML = `<svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M6.5 1v8M2.5 5l4-4 4 4M1 11h11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>Change Photo`;
  const fileInput = document.createElement('input');
  fileInput.type = 'file'; fileInput.accept = 'image/*'; fileInput.style.display = 'none';
  fileInput.addEventListener('change', () => {
    const file = fileInput.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img2 = new Image();
      img2.onload = () => {
        const size = 200, canvas = document.createElement('canvas');
        canvas.width = canvas.height = size;
        const ctx = canvas.getContext('2d');
        const scale = Math.max(size/img2.width, size/img2.height);
        const w = img2.width*scale, h = img2.height*scale;
        ctx.drawImage(img2, (size-w)/2, (size-h)/2, w, h);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
        localStorage.setItem('avatar_photo', dataUrl);
        loadAvatarPhoto('');
        renderSettings();
      };
      img2.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
  uploadBtn.appendChild(fileInput);
  avatarBtns.appendChild(uploadBtn);

  if (savedPhoto) {
    const removeBtn = document.createElement('button');
    removeBtn.className = 'btn-danger';
    removeBtn.style.cssText = 'font-size:13px;padding:8px 14px;width:100%';
    removeBtn.textContent = 'Remove Photo';
    removeBtn.addEventListener('click', () => {
      localStorage.removeItem('avatar_photo');
      const name = localStorage.getItem('user_name') || 'Noel';
      loadAvatarPhoto(name.charAt(0).toUpperCase());
      renderSettings();
    });
    avatarBtns.appendChild(removeBtn);
  }

  avatarRow.appendChild(avatarBtns);
  card.appendChild(avatarRow);
  container.appendChild(card);
}

function renderNotificationsEditor(container) {
  const card = makeCard();

  // Permission check banner
  if (Notification.permission === 'denied') {
    const banner = document.createElement('div');
    banner.className = 'settings-empty';
    banner.style.cssText = 'background:rgba(255,69,58,0.08);border:1px solid rgba(255,69,58,0.2);border-radius:var(--r-md);padding:var(--s3);margin-bottom:var(--s3);color:rgba(255,69,58,0.9)';
    banner.textContent = 'Notifications are blocked in your browser. Go to browser Settings → Site Settings → Notifications to allow them.';
    card.appendChild(banner);
  } else if (Notification.permission === 'default') {
    const reqBtn = document.createElement('button');
    reqBtn.className = 'btn-primary';
    reqBtn.textContent = 'Enable Notifications';
    reqBtn.style.marginBottom = 'var(--s3)';
    reqBtn.addEventListener('click', () => {
      Notification.requestPermission().then(() => renderSettings());
    });
    card.appendChild(reqBtn);
  }

  const schedule = getCustomSchedule();
  const prefs    = getNotifPrefs();

  const headerRow = document.createElement('div');
  headerRow.className = 'notif-section-header';
  const lbl = document.createElement('span');
  lbl.className = 'section-label';
  lbl.textContent = 'Schedule Alerts';
  const allOnBtn = document.createElement('button');
  allOnBtn.className = 'notif-master-btn';

  const allOn = schedule.every((_, i) => prefs[`schedule_${i}`] !== false);
  allOnBtn.textContent = allOn ? 'Disable All' : 'Enable All';
  allOnBtn.addEventListener('click', () => {
    const newPrefs = getNotifPrefs();
    schedule.forEach((_, i) => { newPrefs[`schedule_${i}`] = allOn ? false : true; });
    saveNotifPrefs(newPrefs);
    scheduleAllReminders();
    renderSettings();
  });
  headerRow.appendChild(lbl);
  headerRow.appendChild(allOnBtn);
  card.appendChild(headerRow);

  schedule.forEach((item, index) => {
    const itemKey  = `schedule_${index}`;
    const enabled  = prefs[itemKey] !== false;
    const timePart = item.split(/\s*[–—]\s*/)[0].trim();
    const textPart = item.split(/\s*[–—]\s*/).slice(1).join(' – ') || item;

    const row = document.createElement('div');
    row.className = 'notif-row';

    const info = document.createElement('div');
    info.className = 'notif-row-info';
    info.innerHTML = `<span class="notif-row-label">${textPart}</span><span class="notif-row-time">${timePart}</span>`;

    const toggle = document.createElement('button');
    toggle.className = 'notif-toggle-switch' + (enabled ? ' on' : '');
    toggle.setAttribute('aria-label', enabled ? 'Disable alert' : 'Enable alert');
    toggle.addEventListener('click', () => {
      const p = getNotifPrefs();
      p[itemKey] = !enabled;
      saveNotifPrefs(p);
      scheduleAllReminders();
      renderSettings();
    });

    row.appendChild(info);
    row.appendChild(toggle);
    card.appendChild(row);
  });

  container.appendChild(card);
}

function renderEditableList(container, items, placeholder, onEdit, onDelete, onAdd) {
  const listWrap = document.createElement('div');
  listWrap.className = 'settings-list';
  if (items.length === 0) { const empty = document.createElement('p'); empty.className = 'settings-empty'; empty.textContent = 'No items yet. Add one below.'; listWrap.appendChild(empty); }
  items.forEach((item, i) => {
    const row = document.createElement('div'); row.className = 'settings-row';
    const text = document.createElement('div'); text.className = 'settings-item-text'; text.contentEditable = 'true'; text.textContent = item; text.spellcheck = false;
    text.addEventListener('blur', () => { const val = text.textContent.trim(); if (val && val !== item) onEdit(i, val); else if (!val) text.textContent = item; });
    text.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); text.blur(); } });
    const delBtn = document.createElement('button'); delBtn.className = 'settings-del-btn'; delBtn.textContent = '×'; delBtn.setAttribute('aria-label', 'Delete');
    delBtn.addEventListener('click', () => onDelete(i));
    row.appendChild(text); row.appendChild(delBtn); listWrap.appendChild(row);
  });
  container.appendChild(listWrap);

  const addRow = document.createElement('div'); addRow.className = 'settings-add-row';
  const addInput = document.createElement('input'); addInput.type = 'text'; addInput.className = 'settings-add-input'; addInput.placeholder = placeholder;
  const addBtn = document.createElement('button'); addBtn.className = 'add-btn'; addBtn.setAttribute('aria-label', 'Add');
  addBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 3v10M3 8h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;
  const doAdd = () => { const val = addInput.value.trim(); if (val) { onAdd(val); addInput.value = ''; } };
  addBtn.addEventListener('click', doAdd);
  addInput.addEventListener('keydown', e => { if (e.key === 'Enter') doAdd(); });
  addRow.appendChild(addInput); addRow.appendChild(addBtn); container.appendChild(addRow);
}

function makeCard(extra = '') {
  const c = document.createElement('div'); c.className = `card fade-in ${extra}`.trim();
  c.style.setProperty('--delay', '0.05s'); c.style.marginBottom = 'var(--s3)'; return c;
}
function addSectionLabel(parent, text) {
  const lbl = document.createElement('span'); lbl.className = 'section-label'; lbl.textContent = text; parent.appendChild(lbl);
}

// ── Tab Navigation ─────────────────────────────
function initTabs() {
  document.querySelectorAll('.tab-item').forEach(tab => {
    tab.addEventListener('click', () => {
      const id = tab.dataset.tab;
      document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
      const screen = document.getElementById(`screen-${id}`);
      if (screen) screen.classList.add('active');
      if (id === 'settings') renderSettings();
      if (id === 'stats')    updateStatsScreen();
    });
  });

  document.querySelectorAll('.settings-subtab').forEach(stab => {
    stab.addEventListener('click', () => { currentSettingsTab = stab.dataset.stab; renderSettings(); });
  });

  document.getElementById('resetDefaultsBtn')?.addEventListener('click', () => {
    if (!confirm('Reset all workouts, schedule, hydration, and quotes to original defaults?')) return;
    ['custom_workouts','custom_schedule','custom_hydration'].forEach(k => localStorage.removeItem(k));
    loadRoutine(); renderSettings();
  });

  document.getElementById('relaunchWizardBtn')?.addEventListener('click', openWizard);
}

// ── Boot ───────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  if ('Notification' in window && Notification.permission !== 'granted') Notification.requestPermission();

  loadRoutine();
  loadTodos();
  updatePerformanceScore(); // final pass — all lists now rendered
  updateStatsScreen();
  loadPhotos();
  setupPhotoUpload();
  setupAvatarUpload();
  scheduleAllReminders();
  scheduleTodoReminders();
  scheduleBiWeeklyWeightReminder();
  scheduleNextPhotoReminder();
  initTabs();
  initWizard();

  document.getElementById('weightTile')?.addEventListener('click', showWeightPrompt);
  document.getElementById('addTaskBtn')?.addEventListener('click', addTodo);
  document.getElementById('newTodo')?.addEventListener('keydown', e => { if (e.key === 'Enter') addTodo(); });
  document.getElementById('wcDismiss')?.addEventListener('click', dismissWorkoutComplete);

  // Show wizard on first launch
  if (!localStorage.getItem('wizardComplete')) {
    openWizard();
  } else {
    closeWizard(); // hide overlay immediately
  }
});
