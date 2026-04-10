// ── FOOD DATABASE ────────────────────────────────────────────────────
// Each entry: { id, name, cal, p(rotein), f(at), c(arbs), serving(default g/ml), unit, category }
// All macros are PER SERVING SIZE listed

const FOODS = [
  // PROTEINS
  { id:'chicken_breast', name:'Chicken Breast (cooked)', cal:165, p:31, f:3.6, c:0, serving:100, unit:'g', cat:'protein' },
  { id:'chicken_thigh', name:'Chicken Thigh (cooked)', cal:209, p:26, f:10.9, c:0, serving:100, unit:'g', cat:'protein' },
  { id:'ground_beef', name:'Ground Beef (lean, cooked)', cal:215, p:26, f:12, c:0, serving:100, unit:'g', cat:'protein' },
  { id:'beef_steak', name:'Beef Steak (cooked)', cal:250, p:30, f:14, c:0, serving:100, unit:'g', cat:'protein' },
  { id:'salmon', name:'Salmon (cooked)', cal:208, p:20, f:13, c:0, serving:100, unit:'g', cat:'protein' },
  { id:'tuna_can', name:'Tuna (canned, drained)', cal:116, p:26, f:1, c:0, serving:100, unit:'g', cat:'protein' },
  { id:'egg', name:'Egg (1 whole)', cal:72, p:6, f:5, c:0.4, serving:50, unit:'g', cat:'protein' },
  { id:'egg_white', name:'Egg White', cal:52, p:11, f:0.2, c:0.7, serving:100, unit:'g', cat:'protein' },
  { id:'shrimp', name:'Shrimp (cooked)', cal:99, p:24, f:0.3, c:0, serving:100, unit:'g', cat:'protein' },
  // DAIRY
  { id:'whole_milk', name:'Whole Milk', cal:61, p:3.2, f:3.3, c:4.8, serving:240, unit:'ml', cat:'dairy' },
  { id:'skim_milk', name:'Skim Milk', cal:35, p:3.4, f:0.1, c:5, serving:240, unit:'ml', cat:'dairy' },
  { id:'greek_yogurt', name:'Greek Yogurt (plain)', cal:59, p:10, f:0.4, c:3.6, serving:100, unit:'g', cat:'dairy' },
  { id:'cottage_cheese', name:'Cottage Cheese', cal:98, p:11, f:4.3, c:3.4, serving:100, unit:'g', cat:'dairy' },
  { id:'cheddar', name:'Cheddar Cheese', cal:402, p:25, f:33, c:1.3, serving:30, unit:'g', cat:'dairy' },
  // SUPPLEMENTS
  { id:'whey', name:'Whey Protein (1 scoop)', cal:120, p:24, f:2, c:3, serving:30, unit:'g', cat:'supplement' },
  { id:'casein', name:'Casein Protein (1 scoop)', cal:110, p:24, f:1, c:4, serving:30, unit:'g', cat:'supplement' },
  // GRAINS
  { id:'white_rice', name:'White Rice (cooked)', cal:130, p:2.7, f:0.3, c:28, serving:100, unit:'g', cat:'grain' },
  { id:'brown_rice', name:'Brown Rice (cooked)', cal:123, p:2.7, f:1, c:26, serving:100, unit:'g', cat:'grain' },
  { id:'oats', name:'Oats (dry)', cal:389, p:17, f:7, c:66, serving:80, unit:'g', cat:'grain' },
  { id:'pasta', name:'Pasta (cooked)', cal:158, p:5.8, f:0.9, c:31, serving:100, unit:'g', cat:'grain' },
  { id:'white_bread', name:'White Bread (1 slice)', cal:79, p:2.7, f:1, c:15, serving:30, unit:'g', cat:'grain' },
  { id:'ww_bread', name:'Whole Wheat Bread (1 slice)', cal:80, p:4, f:1, c:15, serving:35, unit:'g', cat:'grain' },
  { id:'potato', name:'Potato (boiled)', cal:87, p:1.9, f:0.1, c:20, serving:100, unit:'g', cat:'grain' },
  { id:'sweet_potato', name:'Sweet Potato (boiled)', cal:76, p:1.6, f:0.1, c:18, serving:100, unit:'g', cat:'grain' },
  // PAKISTANI FOODS
  { id:'roti', name:'Roti / Chapati (1 piece)', cal:120, p:4, f:2, c:22, serving:60, unit:'g', cat:'pakistani' },
  { id:'paratha', name:'Paratha (1 piece)', cal:300, p:6, f:14, c:40, serving:100, unit:'g', cat:'pakistani' },
  { id:'naan', name:'Naan (1 piece)', cal:262, p:9, f:5, c:45, serving:90, unit:'g', cat:'pakistani' },
  { id:'biryani', name:'Chicken Biryani', cal:170, p:9, f:6, c:21, serving:100, unit:'g', cat:'pakistani' },
  { id:'beef_biryani', name:'Beef Biryani', cal:185, p:10, f:8, c:21, serving:100, unit:'g', cat:'pakistani' },
  { id:'dal', name:'Dal (lentil curry)', cal:116, p:7, f:2, c:18, serving:100, unit:'g', cat:'pakistani' },
  { id:'chicken_karahi', name:'Chicken Karahi', cal:165, p:18, f:8, c:4, serving:100, unit:'g', cat:'pakistani' },
  { id:'haleem', name:'Haleem', cal:180, p:14, f:8, c:14, serving:100, unit:'g', cat:'pakistani' },
  { id:'saag', name:'Saag (spinach / mustard)', cal:70, p:4, f:3, c:8, serving:100, unit:'g', cat:'pakistani' },
  { id:'aloo_sabzi', name:'Aloo Sabzi (potato curry)', cal:130, p:3, f:5, c:20, serving:100, unit:'g', cat:'pakistani' },
  { id:'samosa', name:'Samosa (1 piece)', cal:130, p:3, f:7, c:15, serving:50, unit:'g', cat:'pakistani' },
  { id:'chai', name:'Chai (milk + sugar)', cal:60, p:2, f:2, c:9, serving:240, unit:'ml', cat:'pakistani' },
  { id:'lassi', name:'Lassi (sweet)', cal:180, p:6, f:6, c:26, serving:250, unit:'ml', cat:'pakistani' },
  { id:'dahi', name:'Dahi (plain yogurt)', cal:61, p:3.5, f:3.3, c:4.7, serving:100, unit:'g', cat:'pakistani' },
  { id:'nihari', name:'Nihari', cal:180, p:16, f:11, c:4, serving:100, unit:'g', cat:'pakistani' },
  { id:'seekh_kebab', name:'Seekh Kebab (1 piece)', cal:90, p:10, f:5, c:2, serving:45, unit:'g', cat:'pakistani' },
  { id:'puri', name:'Puri (1 piece)', cal:125, p:2, f:7, c:14, serving:40, unit:'g', cat:'pakistani' },
  { id:'khichdi', name:'Khichdi', cal:130, p:5, f:2, c:24, serving:100, unit:'g', cat:'pakistani' },
  { id:'achar', name:'Achar (pickle) 1 tbsp', cal:20, p:0, f:1.5, c:2, serving:15, unit:'g', cat:'pakistani' },
  { id:'raita', name:'Raita', cal:45, p:2, f:2, c:5, serving:100, unit:'g', cat:'pakistani' },
  { id:'chana', name:'Chana (chickpea curry)', cal:164, p:8.9, f:2.6, c:27, serving:100, unit:'g', cat:'pakistani' },
  // VEGETABLES
  { id:'broccoli', name:'Broccoli', cal:34, p:2.8, f:0.4, c:7, serving:100, unit:'g', cat:'vegetable' },
  { id:'spinach', name:'Spinach', cal:23, p:2.9, f:0.4, c:3.6, serving:100, unit:'g', cat:'vegetable' },
  { id:'tomato', name:'Tomato', cal:18, p:0.9, f:0.2, c:3.9, serving:100, unit:'g', cat:'vegetable' },
  { id:'cucumber', name:'Cucumber', cal:15, p:0.7, f:0.1, c:3.6, serving:100, unit:'g', cat:'vegetable' },
  { id:'onion', name:'Onion', cal:40, p:1.1, f:0.1, c:9.3, serving:100, unit:'g', cat:'vegetable' },
  { id:'carrot', name:'Carrot', cal:41, p:0.9, f:0.2, c:10, serving:100, unit:'g', cat:'vegetable' },
  { id:'capsicum', name:'Bell Pepper', cal:31, p:1, f:0.3, c:6, serving:100, unit:'g', cat:'vegetable' },
  { id:'mushroom', name:'Mushroom', cal:22, p:3.1, f:0.3, c:3.3, serving:100, unit:'g', cat:'vegetable' },
  { id:'cauliflower', name:'Cauliflower', cal:25, p:1.9, f:0.3, c:5, serving:100, unit:'g', cat:'vegetable' },
  // FRUITS
  { id:'banana', name:'Banana (1 medium)', cal:105, p:1.3, f:0.4, c:27, serving:120, unit:'g', cat:'fruit' },
  { id:'apple', name:'Apple (1 medium)', cal:95, p:0.5, f:0.3, c:25, serving:182, unit:'g', cat:'fruit' },
  { id:'mango', name:'Mango', cal:60, p:0.8, f:0.4, c:15, serving:100, unit:'g', cat:'fruit' },
  { id:'orange', name:'Orange (1 medium)', cal:62, p:1.2, f:0.2, c:15, serving:131, unit:'g', cat:'fruit' },
  { id:'dates', name:'Dates / Khajoor (1 piece)', cal:66, p:0.4, f:0, c:18, serving:24, unit:'g', cat:'fruit' },
  { id:'watermelon', name:'Watermelon', cal:30, p:0.6, f:0.2, c:8, serving:100, unit:'g', cat:'fruit' },
  { id:'grapes', name:'Grapes', cal:67, p:0.6, f:0.4, c:17, serving:100, unit:'g', cat:'fruit' },
  { id:'strawberries', name:'Strawberries', cal:32, p:0.7, f:0.3, c:8, serving:100, unit:'g', cat:'fruit' },
  // NUTS
  { id:'almonds', name:'Almonds (handful ~28g)', cal:164, p:6, f:14, c:6, serving:28, unit:'g', cat:'nut' },
  { id:'peanut_butter', name:'Peanut Butter (2 tbsp)', cal:190, p:8, f:16, c:7, serving:32, unit:'g', cat:'nut' },
  { id:'walnuts', name:'Walnuts (handful)', cal:185, p:4.3, f:18.5, c:4, serving:28, unit:'g', cat:'nut' },
  { id:'cashews', name:'Cashews (handful)', cal:157, p:5.2, f:12.4, c:8.6, serving:28, unit:'g', cat:'nut' },
  // FAST FOOD
  { id:'big_mac', name:"Big Mac (McDonald's)", cal:550, p:25, f:30, c:46, serving:200, unit:'g', cat:'fastfood' },
  { id:'kfc_piece', name:'KFC Chicken (1 piece)', cal:290, p:22, f:16, c:11, serving:120, unit:'g', cat:'fastfood' },
  { id:'pizza_slice', name:'Pizza Cheese (1 slice)', cal:285, p:12, f:10, c:36, serving:107, unit:'g', cat:'fastfood' },
  { id:'fries_med', name:'French Fries (medium)', cal:365, p:4, f:17, c:48, serving:117, unit:'g', cat:'fastfood' },
  { id:'shawarma', name:'Chicken Shawarma', cal:320, p:22, f:12, c:32, serving:150, unit:'g', cat:'fastfood' },
  { id:'burger', name:'Beef Burger (basic)', cal:354, p:20, f:17, c:29, serving:150, unit:'g', cat:'fastfood' },
  // SNACKS
  { id:'protein_bar', name:'Protein Bar', cal:220, p:20, f:7, c:22, serving:60, unit:'g', cat:'snack' },
  { id:'chips', name:'Chips / Crisps', cal:536, p:7, f:34, c:53, serving:30, unit:'g', cat:'snack' },
  { id:'biscuits', name:'Biscuits / Cookies (2)', cal:137, p:2.4, f:4.8, c:22, serving:30, unit:'g', cat:'snack' },
  { id:'dark_choc', name:'Dark Chocolate (70%, 2 squares)', cal:109, p:1, f:7, c:12, serving:20, unit:'g', cat:'snack' },
  { id:'rice_cakes', name:'Rice Cakes (2 pieces)', cal:70, p:1.5, f:0.5, c:15, serving:18, unit:'g', cat:'snack' },
  { id:'mixed_nuts', name:'Mixed Nuts (small handful)', cal:172, p:5, f:15, c:6, serving:28, unit:'g', cat:'snack' },
  // DRINKS
  { id:'cola', name:'Cola / Pepsi (330ml can)', cal:140, p:0, f:0, c:39, serving:355, unit:'ml', cat:'drink' },
  { id:'oj', name:'Orange Juice (glass)', cal:110, p:1.7, f:0.5, c:26, serving:240, unit:'ml', cat:'drink' },
  { id:'black_coffee', name:'Black Coffee', cal:2, p:0.3, f:0, c:0, serving:240, unit:'ml', cat:'drink' },
  { id:'energy_drink', name:'Energy Drink (250ml)', cal:110, p:1, f:0.5, c:28, serving:250, unit:'ml', cat:'drink' },
  { id:'protein_shake', name:'Protein Shake (with water)', cal:120, p:24, f:2, c:3, serving:330, unit:'ml', cat:'drink' },
  { id:'coconut_water', name:'Coconut Water', cal:45, p:1.7, f:0.5, c:9, serving:240, unit:'ml', cat:'drink' },
];

// ── EXERCISE LISTS ───────────────────────────────────────────────────
const MUSCLES = ['Chest','Back','Shoulders','Biceps','Triceps','Quads','Hamstrings','Glutes','Calves','Core'];
const MUSCLE_IDS = ['chest','back','shoulders','biceps','triceps','quads','hamstrings','glutes','calves','core'];
const DAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const DAY_SHORT = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

const PR_EXERCISES = [
  'Barbell Bench Press','Incline Bench Press','Dumbbell Bench Press',
  'Back Squat','Front Squat','Goblet Squat',
  'Barbell Deadlift','Romanian Deadlift','Sumo Deadlift',
  'Overhead Press (Barbell)','Dumbbell Shoulder Press',
  'Barbell Row','T-Bar Row','Cable Row',
  'Pull-ups (reps)','Chin-ups (reps)','Dips (reps)',
  'Lat Pulldown','Leg Press','Leg Extension',
  'Leg Curl','Hip Thrust','Calf Raises',
  'Bicep Curl (Barbell)','Preacher Curl',
  'Tricep Pushdown','Skull Crushers','Close Grip Bench'
];

const COMMON_EXERCISES = [
  'Barbell Bench Press','Incline Bench Press','Decline Bench Press','Dumbbell Bench Press',
  'Incline Dumbbell Press','Dumbbell Flyes','Cable Crossover','Chest Dips','Push-ups',
  'Barbell Row','T-Bar Row','Dumbbell Row','Cable Row','Lat Pulldown',
  'Pull-ups','Chin-ups','Barbell Deadlift','Romanian Deadlift','Face Pulls','Hyperextensions',
  'Overhead Press (Barbell)','Dumbbell Shoulder Press','Arnold Press',
  'Lateral Raises','Front Raises','Rear Delt Flyes','Shrugs',
  'Bicep Curl (Barbell)','Dumbbell Curl','Preacher Curl','Hammer Curl','Cable Curl',
  'Skull Crushers','Tricep Pushdown','Overhead Tricep Extension','Close Grip Bench','Dips','Kickbacks',
  'Back Squat','Front Squat','Goblet Squat','Leg Press','Leg Extension','Leg Curl',
  'Romanian Deadlift','Hip Thrust','Lunges','Bulgarian Split Squat','Calf Raises','Seated Calf Raises',
  'Plank','Crunches','Leg Raises','Russian Twists','Cable Crunches','Ab Wheel Rollout','Hanging Leg Raises'
];

// ── UTILITY FUNCTIONS (used by app.js) ──────────────────────────────
function searchFoodsDB(query) {
  if (!query || query.trim() === '') return FOODS.slice(0, 30);
  const q = query.toLowerCase().trim();
  return FOODS.filter(f => f.name.toLowerCase().includes(q)).slice(0, 40);
}

function calcNutrition(food, amount) {
  const ratio = amount / food.serving;
  return {
    cal: Math.round(food.cal * ratio),
    p: parseFloat((food.p * ratio).toFixed(1)),
    f: parseFloat((food.f * ratio).toFixed(1)),
    c: parseFloat((food.c * ratio).toFixed(1))
  };
}

function calc1RM(weight, reps) {
  if (reps <= 0) return 0;
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30));
}

function rateSplit(trainingDays) {
  const numDays = trainingDays.length;
  const restDays = 7 - numDays;
  const freq = {};
  MUSCLE_IDS.forEach(m => freq[m] = 0);
  trainingDays.forEach(day => {
    (day.muscles || []).forEach(m => { if (freq[m] !== undefined) freq[m]++; });
  });

  let score = 0;
  const feedback = [];

  // Frequency (40 pts)
  const bigMuscles = ['chest','back','quads','shoulders'];
  const smallMuscles = ['biceps','triceps','hamstrings','glutes','calves','core'];
  bigMuscles.forEach(m => {
    const label = m[0].toUpperCase() + m.slice(1);
    if (freq[m] === 2) score += 6;
    else if (freq[m] === 1) { score += 3; feedback.push(`${label} hit only 1×/week — aim for 2× for optimal growth`); }
    else if (freq[m] >= 3) { score += 4; feedback.push(`${label} hit ${freq[m]}×/week — may hurt recovery`); }
    else { feedback.push(`⚠️ ${label} not trained at all this week`); }
  });
  smallMuscles.forEach(m => {
    if (freq[m] >= 2) score += 2.5;
    else if (freq[m] === 1) score += 1.5;
  });

  // Balance (30 pts)
  const push = freq['chest'] + freq['shoulders'] + freq['triceps'];
  const pull = freq['back'] + freq['biceps'];
  const ratio = push / (pull || 1);
  if (ratio >= 0.8 && ratio <= 1.4) score += 30;
  else if (ratio >= 0.5 && ratio <= 2.0) { score += 18; feedback.push('Push/pull ratio is off — try to balance pulling and pushing volume'); }
  else { score += 8; feedback.push('⚠️ Poor push/pull balance — add more pulling movements'); }

  // Rest (15 pts)
  if (restDays === 2) score += 15;
  else if (restDays === 1) { score += 10; feedback.push('Only 1 rest day — prioritise sleep and nutrition'); }
  else if (restDays >= 3) { score += 10; feedback.push('Multiple rest days — consider adding a training day for faster progress'); }
  else { feedback.push('⚠️ No rest days scheduled — overtraining risk'); }

  // Days/week (15 pts)
  if (numDays === 4 || numDays === 5) score += 15;
  else if (numDays === 3) { score += 10; feedback.push('3 days/week is solid — great for beginners and intermediates'); }
  else if (numDays === 6) score += 12;

  const finalScore = Math.round(Math.min(score, 100));
  let grade = 'D', gradeColor = '#ef4444';
  if (finalScore >= 90) { grade = 'A+'; gradeColor = '#10b981'; }
  else if (finalScore >= 80) { grade = 'A'; gradeColor = '#10b981'; }
  else if (finalScore >= 70) { grade = 'B'; gradeColor = '#3b82f6'; }
  else if (finalScore >= 60) { grade = 'C'; gradeColor = '#f59e0b'; }

  return { score: finalScore, grade, gradeColor, feedback, frequencies: freq };
}
