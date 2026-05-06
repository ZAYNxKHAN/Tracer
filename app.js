// ===== Constants =====
const STORAGE_KEYS = {
    PROFILES_LIST: 'zaynTracker_profiles',
    ACTIVE_PROFILE: 'zaynTracker_activeProfile',
    PROFILE_DATA: 'zaynTracker_profile_'
};

const DEFAULT_TASKS = [
    { id: 1, name: 'Cracked 1 Last Year Paper ANF/FIA', points: 14, category: 'critical' },
    { id: 2, name: 'Study CSS (2:00 hrs)', points: 12, category: 'critical' },
    { id: 3, name: 'Study FIA (2:00 hrs)', points: 12, category: 'critical' },
    { id: 4, name: 'No Fap + No Smoke/Vape', points: 12, category: 'critical' },
    { id: 5, name: 'Fajar Namaz (On Time)', points: 6, category: 'ibaadat' },
    { id: 6, name: 'Zohar Namaz (On Time)', points: 6, category: 'ibaadat' },
    { id: 7, name: 'Asar Namaz (On Time)', points: 6, category: 'ibaadat' },
    { id: 8, name: 'Maghrib Namaz (On Time)', points: 6, category: 'ibaadat' },
    { id: 9, name: 'Isha Namaz (On Time)', points: 6, category: 'ibaadat' },
    { id: 10, name: 'Sleep at 3 AM (Wake 10 AM)', points: 10, category: 'important' },
    { id: 11, name: 'Exercise/Running (30 min)', points: 8, category: 'important' },
    { id: 12, name: 'Avoided Reels/Social Media', points: 8, category: 'important' },
    { id: 13, name: 'Vocabulary + Current Affairs (1 hr)', points: 8, category: 'important' },
    { id: 14, name: 'Morning Revision (30 min)', points: 8, category: 'important' },
    { id: 15, name: '10k Steps Walking', points: 6, category: 'important' },
    { id: 16, name: 'Dinner Before Job (6 PM)', points: 6, category: 'good' },
    { id: 17, name: 'Breakfast After Wake (10:30 AM)', points: 6, category: 'good' },
    { id: 18, name: 'No Sugar/Junk Food Today', points: 6, category: 'good' },
    { id: 19, name: 'Cold Shower (Morning)', points: 6, category: 'good' },
    { id: 20, name: 'Water (10+ glasses)', points: 6, category: 'good' },
    { id: 21, name: 'Stretching (15 min)', points: 6, category: 'good' },
    { id: 22, name: 'Read 5 Pages (Book/CSS)', points: 6, category: 'bonus' },
    { id: 23, name: 'Bath Before Sleep', points: 6, category: 'bonus' },
    { id: 24, name: 'Skin Care Routine', points: 6, category: 'bonus' },
    { id: 25, name: 'Gratitude/Journal (5 min)', points: 6, category: 'bonus' }
];

const NAMAZ_LIST = ['Fajar', 'Zohar', 'Asar', 'Maghrib', 'Isha'];
const MILESTONES = [3, 5, 7, 10, 15, 20, 30];

// ===== Global State =====
let allProfiles = [];
let activeProfileId = null;
let appState = null;

// ===== State Initialization =====
function getDefaultState() {
    return {
        settings: { totalDays: 30 },
        streak: { currentDay: 1, bestStreak: 1 },
        tasks: JSON.parse(JSON.stringify(DEFAULT_TASKS)),
        today: {
            dateKey: getTodayDateKey(),
            checkedTaskIds: [],
            todayScore: 0,
            namaz: {}
        }
    };
}

function getTodayDateKey() {
    const now = new Date();
    const karachiOffset = 5 * 60;
    const localOffset = now.getTimezoneOffset();
    const karachiTime = new Date(now.getTime() + (karachiOffset + localOffset) * 60000);
    const year = karachiTime.getFullYear();
    const month = String(karachiTime.getMonth() + 1).padStart(2, '0');
    const day = String(karachiTime.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// ===== Profile Management =====
function loadAllProfiles() {
    try {
        const data = localStorage.getItem(STORAGE_KEYS.PROFILES_LIST);
        allProfiles = data ? JSON.parse(data) : [];
    } catch (e) {
        allProfiles = [];
    }
}

function saveAllProfiles() {
    localStorage.setItem(STORAGE_KEYS.PROFILES_LIST, JSON.stringify(allProfiles));
}

function getActiveProfileId() {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_PROFILE);
}

function setActiveProfileId(id) {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_PROFILE, id);
    activeProfileId = id;
}

function loadProfileData(profileId) {
    try {
        const key = STORAGE_KEYS.PROFILE_DATA + profileId;
        const data = localStorage.getItem(key);
        if (data) {
            appState = JSON.parse(data);
            // Auto-reset if new day
            if (appState.today.dateKey !== getTodayDateKey()) {
                resetDailyState(false);
            }
        } else {
            appState = getDefaultState();
        }
    } catch (e) {
        appState = getDefaultState();
    }
}

function saveProfileData() {
    if (!activeProfileId) return;
    const key = STORAGE_KEYS.PROFILE_DATA + activeProfileId;
    localStorage.setItem(key, JSON.stringify(appState));
}

function createProfile(name, type) {
    const id = 'profile_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    const profile = {
        id,
        name,
        type,
        createdAt: new Date().toISOString()
    };
    allProfiles.push(profile);
    saveAllProfiles();
    
    // Initialize with default state
    const key = STORAGE_KEYS.PROFILE_DATA + id;
    localStorage.setItem(key, JSON.stringify(getDefaultState()));
    
    return profile;
}

function deleteProfile(profileId) {
    allProfiles = allProfiles.filter(p => p.id !== profileId);
    saveAllProfiles();
    localStorage.removeItem(STORAGE_KEYS.PROFILE_DATA + profileId);
    
    if (activeProfileId === profileId) {
        setActiveProfileId(null);
        appState = null;
    }
}

function switchToProfile(profileId) {
    setActiveProfileId(profileId);
    loadProfileData(profileId);
    renderAll();
}

// ===== Namaz Functions =====
function initNamazState() {
    if (!appState.today.namaz || Object.keys(appState.today.namaz).length === 0) {
        appState.today.namaz = {};
        NAMAZ_LIST.forEach(n => {
            appState.today.namaz[n] = null; // null = not marked, true = done, false = missed
        });
    }
}

function toggleNamaz(namazName) {
    initNamazState();
    const current = appState.today.namaz[namazName];
    
    if (current === null || current === false) {
        appState.today.namaz[namazName] = true; // mark done
    } else if (current === true) {
        appState.today.namaz[namazName] = false; // mark missed
    }
    
    saveProfileData();
    renderNamazStatus();
    checkNamazPunishment();
}

function checkNamazPunishment() {
    initNamazState();
    const missedCount = Object.values(appState.today.namaz).filter(v => v === false).length;
    const fajarMissed = appState.today.namaz['Fajar'] === false;
    const punishmentDiv = document.getElementById('namazPunishment');
    
    if (missedCount === 0) {
        punishmentDiv.classList.add('hidden');
        return;
    }
    
    let message = '';
    let extraStudy = 0;
    
    if (fajarMissed) {
        extraStudy += 30;
        message = '❌ FAJAR MISSED! +30 mins extra study';
    }
    if (missedCount >= 2 && missedCount < 5) {
        extraStudy = Math.max(extraStudy, 30);
        message += (message ? ' | ' : '') + `⚠️ ${missedCount} Namaz Missed! +30 mins extra study + No Reels`;
    }
    if (missedCount === 5) {
        message = '😤 ALL 5 NAMAZ MISSED! Streak will reset to 3 tomorrow!';
    }
    if (missedCount === 1 && !fajarMissed) {
        extraStudy = 15;
        message = `⚠️ 1 Namaz Missed! +15 mins extra study`;
    }
    
    punishmentDiv.textContent = message + (extraStudy > 0 ? ` (Total: +${extraStudy} mins)` : '');
    punishmentDiv.classList.remove('hidden');
}

function renderNamazStatus() {
    const container = document.getElementById('namazStatus');
    initNamazState();
    
    container.innerHTML = NAMAZ_LIST.map(namaz => {
        const status = appState.today.namaz[namaz];
        let className = 'namaz-badge';
        let icon = '⏳';
        
        if (status === true) {
            className += ' done';
            icon = '✅';
        } else if (status === false) {
            className += ' missed';
            icon = '❌';
        }
        
        return `<div class="${className}" onclick="toggleNamaz('${namaz}')" role="button" tabindex="0" aria-label="Toggle ${namaz}">
            ${icon} ${namaz}
        </div>`;
    }).join('');
    
    container.querySelectorAll('.namaz-badge').forEach(badge => {
        badge.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') badge.click();
        });
    });
    
    checkNamazPunishment();
}

// ===== Task Rendering =====
function renderTasks() {
    const container = document.getElementById('tasksContainer');
    container.innerHTML = '';
    
    if (!appState) return;
    
    appState.tasks.forEach(task => {
        const isChecked = appState.today.checkedTaskIds.includes(task.id);
        
        const row = document.createElement('div');
        row.className = `task-row category-${task.category}`;
        row.setAttribute('tabindex', '0');
        row.setAttribute('role', 'checkbox');
        row.setAttribute('aria-checked', isChecked);
        
        const categoryEmoji = {
            'critical': '🔥',
            'ibaadat': '🕌',
            'important': '⚡',
            'good': '✅',
            'bonus': '⭐'
        };
        
        row.innerHTML = `
            <input type="checkbox" class="task-checkbox" ${isChecked ? 'checked' : ''} aria-label="Toggle ${task.name}">
            <span class="category-tag">${categoryEmoji[task.category] || ''}</span>
            <input type="text" class="task-name-input" value="${escapeHtml(task.name)}" aria-label="Task name">
            <div class="task-points-wrapper">
                <input type="number" class="task-points-input" value="${task.points}" min="0" aria-label="Points">
                <span class="points-label">pts</span>
            </div>
        `;
        
        const checkbox = row.querySelector('.task-checkbox');
        const nameInput = row.querySelector('.task-name-input');
        const pointsInput = row.querySelector('.task-points-input');
        
        row.addEventListener('click', (e) => {
            if (e.target !== checkbox && e.target !== nameInput && e.target !== pointsInput) {
                checkbox.checked = !checkbox.checked;
                handleCheckboxChange(task.id, checkbox.checked);
            }
        });
        
        checkbox.addEventListener('change', (e) => {
            e.stopPropagation();
            handleCheckboxChange(task.id, checkbox.checked);
        });
        
        nameInput.addEventListener('change', () => {
            const newName = nameInput.value.trim();
            if (newName && newName !== task.name) {
                task.name = newName;
                saveProfileData();
                updateUI();
            } else if (!newName) {
                nameInput.value = task.name;
            }
        });
        
        pointsInput.addEventListener('change', () => {
            let newPoints = parseInt(pointsInput.value);
            if (isNaN(newPoints) || newPoints < 0) {
                pointsInput.value = task.points;
            } else {
                task.points = newPoints;
                saveProfileData();
                updateUI();
            }
        });
        
        nameInput.addEventListener('click', (e) => e.stopPropagation());
        pointsInput.addEventListener('click', (e) => e.stopPropagation());
        
        container.appendChild(row);
    });
    
    updateTotalPoints();
}

function handleCheckboxChange(taskId, isChecked) {
    if (isChecked) {
        if (!appState.today.checkedTaskIds.includes(taskId)) {
            appState.today.checkedTaskIds.push(taskId);
        }
    } else {
        appState.today.checkedTaskIds = appState.today.checkedTaskIds.filter(id => id !== taskId);
    }
    saveProfileData();
}

function updateTotalPoints() {
    if (!appState) return;
    const total = appState.tasks.reduce((sum, task) => sum + task.points, 0);
    document.getElementById('totalPoints').textContent = total;
    
    const warning = document.getElementById('totalWarning');
    if (total !== 200) {
        warning.classList.remove('hidden');
    } else {
        warning.classList.add('hidden');
    }
}

// ===== UI Updates =====
function updateUI() {
    if (!appState) return;
    
    document.getElementById('currentDayDisplay').textContent = appState.streak.currentDay;
    document.getElementById('totalDaysInput').value = appState.settings.totalDays;
    document.getElementById('streakCount').textContent = appState.streak.currentDay;
    document.getElementById('bestStreak').textContent = appState.streak.bestStreak;
    
    updateProgressUI();
    updateTotalPoints();
    renderProfileDropdown();
    renderLeaderboard();
}

function updateProgressUI() {
    if (!appState) return;
    const currentDay = appState.streak.currentDay;
    const totalDays = appState.settings.totalDays;
    const percentage = Math.min((currentDay / totalDays) * 100, 100);
    
    document.getElementById('progressFill').style.width = `${percentage}%`;
    document.getElementById('progressLabel').textContent = `Progress: ${currentDay} / ${totalDays} days`;
    document.getElementById('progressBar').setAttribute('aria-valuenow', Math.round(percentage));
}

// ===== Score Calculation =====
function calculateScore() {
    if (!appState) return;
    
    let score = 0;
    appState.today.checkedTaskIds.forEach(taskId => {
        const task = appState.tasks.find(t => t.id === taskId);
        if (task) score += task.points;
    });
    
    // Bonus for all 5 namaz done
    initNamazState();
    const allNamazDone = Object.values(appState.today.namaz).every(v => v === true);
    if (allNamazDone) score += 5;
    
    appState.today.todayScore = score;
    saveProfileData();
    displayScoreResult(score);
    return score;
}

function displayScoreResult(score) {
    const resultDiv = document.getElementById('scoreResult');
    const scoreValue = document.getElementById('scoreValue');
    const scoreMessage = document.getElementById('scoreMessage');
    
    resultDiv.classList.remove('hidden');
    
    const totalPossible = appState.tasks.reduce((sum, task) => sum + task.points, 0);
    scoreValue.textContent = `Today's Score: ${score} / ${totalPossible}`;
    
    scoreMessage.classList.remove('reward', 'neutral', 'punishment');
    
    if (score >= 180) {
        scoreMessage.textContent = '🏆 REWARD: 30 Mins Reels Time! Amazing Day! 🗿';
        scoreMessage.classList.add('reward');
    } else if (score >= 140) {
        scoreMessage.textContent = '🔥 STREAK ALIVE: Good job, but do better!';
        scoreMessage.classList.add('neutral');
    } else if (score >= 100) {
        scoreMessage.textContent = '⚠️ WARNING: Barely passed. Push harder tomorrow!';
        scoreMessage.classList.add('neutral');
    } else {
        scoreMessage.textContent = '❌ PUNISHMENT: Study 30 Mins More! Weak day!';
        scoreMessage.classList.add('punishment');
    }
    
    resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ===== Next Day Logic =====
function handleNextDay() {
    if (!appState) return;
    
    const todayScore = calculateScore();
    
    // Check namaz all missed
    initNamazState();
    const allNamazMissed = Object.values(appState.today.namaz).every(v => v === false);
    
    if (todayScore >= 100 && !allNamazMissed) {
        appState.streak.currentDay += 1;
        if (appState.streak.currentDay > appState.streak.bestStreak) {
            appState.streak.bestStreak = appState.streak.currentDay;
        }
    } else if (allNamazMissed) {
        appState.streak.currentDay = 3;
    } else {
        appState.streak.currentDay = Math.max(1, appState.streak.currentDay - 1);
        if (appState.streak.currentDay < 3 && todayScore < 80) {
            appState.streak.currentDay = 3;
        }
    }
    
    checkMilestones();
    resetDailyState(true);
    saveProfileData();
    updateUI();
    renderNamazStatus();
    document.getElementById('scoreResult').classList.add('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function checkMilestones() {
    const day = appState.streak.currentDay;
    
    const rewards = {
        3: '🎉 DAY 3: 15 Mins Reels Time! You earned it!',
        5: '🎮 DAY 5: 30 Mins Gaming/Chill Time! Keep going!',
        7: '🏏 DAY 7: 1 Hour - Watch Cricket/Match! Week complete!',
        10: '🍕 DAY 10: Favorite Biryani/Pizza! Double digits!',
        15: '🥳 DAY 15: Half Day Off - Friends Time! Halfway king!',
        20: '🎬 DAY 20: Movie/Binge Watch 1 Episode! Beast mode!',
        30: '👑 DAY 30: FULL DAY REST + CELEBRATION! LEGEND STATUS!'
    };
    
    if (rewards[day]) {
        displayMilestone(rewards[day]);
    }
}

function displayMilestone(text) {
    const milestoneDiv = document.getElementById('milestoneMessage');
    milestoneDiv.textContent = text;
    milestoneDiv.classList.remove('hidden');
    setTimeout(() => milestoneDiv.classList.add('hidden'), 6000);
    milestoneDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function resetDailyState(clearDateKey = true) {
    if (!appState) return;
    appState.today.checkedTaskIds = [];
    appState.today.todayScore = 0;
    appState.today.namaz = {};
    if (clearDateKey) {
        appState.today.dateKey = getTodayDateKey();
    }
    NAMAZ_LIST.forEach(n => { appState.today.namaz[n] = null; });
}

// ===== Profile Dropdown =====
function renderProfileDropdown() {
    const select = document.getElementById('profileSelect');
    select.innerHTML = '<option value="">-- Select Profile --</option>';
    
    allProfiles.forEach(profile => {
        const typeEmoji = {
            'self': '👤',
            'friend': '🤝',
            'rival': '🆚',
            'crush': '💕'
        };
        const option = document.createElement('option');
        option.value = profile.id;
        option.textContent = `${typeEmoji[profile.type] || ''} ${profile.name}`;
        if (profile.id === activeProfileId) option.selected = true;
        select.appendChild(option);
    });
}

// ===== Leaderboard =====
function renderLeaderboard() {
    const container = document.getElementById('leaderboard');
    
    if (allProfiles.length === 0) {
        container.innerHTML = '<p class="empty-state">Add profiles to see leaderboard!</p>';
        return;
    }
    
    const leaderboardData = allProfiles.map(profile => {
        const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROFILE_DATA + profile.id) || '{}');
        return {
            ...profile,
            streak: data.streak?.currentDay || 1,
            bestStreak: data.streak?.bestStreak || 1,
            score: data.today?.todayScore || 0
        };
    });
    
    leaderboardData.sort((a, b) => b.streak - a.streak);
    
    container.innerHTML = leaderboardData.map((p, i) => {
        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`;
        let rowClass = 'leaderboard-row';
        if (p.type === 'rival') rowClass += ' rival';
        if (p.type === 'crush') rowClass += ' crush';
        
        return `
            <div class="${rowClass}">
                <span class="leaderboard-rank">${medal}</span>
                <span class="leaderboard-name">${escapeHtml(p.name)}</span>
                <span class="leaderboard-score">Today: ${p.score}pts</span>
                <span class="leaderboard-streak">🔥 ${p.streak}</span>
            </div>
        `;
    }).join('');
}

// ===== Export/Import =====
function exportProfile() {
    if (!activeProfileId || !appState) {
        alert('Please select a profile first!');
        return;
    }
    const profile = allProfiles.find(p => p.id === activeProfileId);
    const exportData = {
        profile: profile,
        data: appState,
        exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `streak-tracker-${profile.name.toLowerCase().replace(/\s+/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function importProfile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const importData = JSON.parse(e.target.result);
            if (!importData.profile || !importData.data) {
                throw new Error('Invalid file format');
            }
            
            let profile = allProfiles.find(p => p.id === importData.profile.id);
            if (!profile) {
                profile = createProfile(importData.profile.name, importData.profile.type);
            }
            
            const key = STORAGE_KEYS.PROFILE_DATA + profile.id;
            localStorage.setItem(key, JSON.stringify(importData.data));
            
            alert('Profile imported successfully!');
            if (activeProfileId === profile.id) {
                loadProfileData(profile.id);
                renderAll();
            }
            renderProfileDropdown();
            renderLeaderboard();
        } catch (err) {
            alert('Invalid file! Please select a valid streak tracker export file.');
        }
    };
    reader.readAsDataURL(file);
}

// ===== Event Handlers =====
function handleTotalDaysChange() {
    if (!appState) return;
    const input = document.getElementById('totalDaysInput');
    let newTotal = parseInt(input.value);
    
    if (isNaN(newTotal) || newTotal < 1) {
        input.value = appState.settings.totalDays;
        return;
    }
    if (newTotal > 365) {
        newTotal = 365;
        input.value = 365;
    }
    
    appState.settings.totalDays = newTotal;
    if (appState.streak.currentDay > newTotal) {
        appState.streak.currentDay = newTotal;
    }
    saveProfileData();
    updateUI();
}

function handleResetDaily() {
    if (!appState) return;
    if (confirm('Reset today\'s progress? This clears all checkboxes and scores.')) {
        resetDailyState(true);
        saveProfileData();
        renderTasks();
        renderNamazStatus();
        updateUI();
        document.getElementById('scoreResult').classList.add('hidden');
        document.getElementById('milestoneMessage').classList.add('hidden');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// ===== Utility =====
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function renderAll() {
    if (!appState) {
        document.getElementById('tasksContainer').innerHTML = '<p style="text-align:center;padding:20px;color:var(--text-secondary)">Select or create a profile to start!</p>';
        document.getElementById('namazStatus').innerHTML = '';
        document.getElementById('scoreResult').classList.add('hidden');
        document.getElementById('milestoneMessage').classList.add('hidden');
        updateUI();
        return;
    }
    initNamazState();
    renderTasks();
    renderNamazStatus();
    updateUI();
    document.getElementById('scoreResult').classList.add('hidden');
    document.getElementById('milestoneMessage').classList.add('hidden');
}

// ===== Event Listeners =====
function attachEventListeners() {
    // Profile
    document.getElementById('profileSelect').addEventListener('change', (e) => {
        if (e.target.value) {
            switchToProfile(e.target.value);
        } else {
            activeProfileId = null;
            appState = null;
            renderAll();
        }
    });
    
    document.getElementById('addProfileBtn').addEventListener('click', () => {
        document.getElementById('profileModal').classList.remove('hidden');
        document.getElementById('newProfileName').focus();
    });
    
    document.getElementById('cancelProfileBtn').addEventListener('click', () => {
        document.getElementById('profileModal').classList.add('hidden');
        document.getElementById('newProfileName').value = '';
    });
    
    document.getElementById('saveProfileBtn').addEventListener('click', () => {
        const name = document.getElementById('newProfileName').value.trim();
        const type = document.getElementById('newProfileType').value;
        
        if (!name) {
            alert('Please enter a name!');
            return;
        }
        
        const profile = createProfile(name, type);
        document.getElementById('profileModal').classList.add('hidden');
        document.getElementById('newProfileName').value = '';
        switchToProfile(profile.id);
        renderProfileDropdown();
        renderLeaderboard();
    });
    
    document.getElementById('exportBtn').addEventListener('click', exportProfile);
    
    document.getElementById('importBtn').addEventListener('click', () => {
        document.getElementById('importFile').click();
    });
    
    document.getElementById('importFile').addEventListener('change', (e) => {
        if (e.target.files[0]) {
            importProfile(e.target.files[0]);
            e.target.value = '';
        }
    });
    
    // Main actions
    document.getElementById('totalDaysInput').addEventListener('change', handleTotalDaysChange);
    document.getElementById('calculateBtn').addEventListener('click', calculateScore);
    document.getElementById('nextDayBtn').addEventListener('click', handleNextDay);
    document.getElementById('resetDailyBtn').addEventListener('click', handleResetDaily);
    
    // Keyboard shortcut for modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.getElementById('profileModal').classList.add('hidden');
        }
    });
}

// ===== Initialize =====
function init() {
    loadAllProfiles();
    activeProfileId = getActiveProfileId();
    
    if (activeProfileId) {
        loadProfileData(activeProfileId);
    }
    
    renderAll();
    renderProfileDropdown();
    renderLeaderboard();
    attachEventListeners();
}

// Global function for namaz toggle
window.toggleNamaz = toggleNamaz;

document.addEventListener('DOMContentLoaded', init);
