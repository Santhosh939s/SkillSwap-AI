// server/utils/xpEngine.js

// XP Rules
const XP_PER_MINUTE = 0.3333; // ~20 XP per hour
const DAILY_GOAL_BONUS = 50;
const WEEKLY_GOAL_BONUS = 150;
const STREAK_BONUS_MULTIPLIER = 5; // e.g., streak of 5 days = +25 XP

exports.calculateXP = (durationMinutes, currentStreak = 0, goalCompleted = false, goalType = null) => {
    let xp = Math.round(durationMinutes * XP_PER_MINUTE);
    
    // Add streak bonus
    if (currentStreak > 1) {
        xp += currentStreak * STREAK_BONUS_MULTIPLIER;
    }

    // Add goal bonus
    if (goalCompleted) {
        if (goalType === 'Daily') xp += DAILY_GOAL_BONUS;
        if (goalType === 'Weekly') xp += WEEKLY_GOAL_BONUS;
    }

    return xp;
};

exports.calculateLevel = (totalXP) => {
    // Level 1: 0 XP
    // Level 2: 100 XP
    // Level 3: 250 XP
    // Formula: floor(sqrt(totalXP / 50)) + 1  or custom breakpoints
    if (totalXP < 100) return 1;
    if (totalXP < 250) return 2;
    if (totalXP < 500) return 3;
    if (totalXP < 1000) return 4;
    if (totalXP < 2000) return 5;
    
    // For very high XP:
    return Math.floor(Math.sqrt(totalXP / 100)) + 1;
};
