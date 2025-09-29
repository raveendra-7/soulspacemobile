import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Smile, BookOpen, Sun, Users, Gamepad, Calendar, Loader2 } from 'lucide-react';

// --- Local Storage Keys ---
const GUEST_ID_KEY = 'soulspace_guest_id';
const MOOD_LOG_KEY = 'soulspace_mood_log';
const JOURNAL_ENTRIES_KEY = 'soulspace_journal_entries';

// Helper to format date as YYYY-MM-DD
const formatDate = (date) => new Date(date).toISOString().split('T')[0];

/**
 * Custom hook to initialize the App in persistent Guest Mode using localStorage.
 */
const useGuestSetup = () => {
    const [userId, setUserId] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    
    // --- Data Storage State ---
    const [moodLog, setMoodLog] = useState([]);
    const [journalEntries, setJournalEntries] = useState([]);

    useEffect(() => {
        let currentUserId = localStorage.getItem(GUEST_ID_KEY);
        
        if (!currentUserId) {
            // Create a new unique ID for the Guest
            currentUserId = crypto.randomUUID();
            localStorage.setItem(GUEST_ID_KEY, currentUserId);
        }
        setUserId(currentUserId);

        // Load data from localStorage
        const storedMoods = JSON.parse(localStorage.getItem(MOOD_LOG_KEY) || '[]');
        const storedJournals = JSON.parse(localStorage.getItem(JOURNAL_ENTRIES_KEY) || '[]');
        
        // Sort moods (newest first)
        storedMoods.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        setMoodLog(storedMoods);
        setJournalEntries(storedJournals);
        setIsAuthReady(true);
    }, []);

    // Function to save mood data (updated to use localStorage)
    const saveMoodData = useCallback((newMood, date) => {
        const logEntry = { mood: newMood.name, date: date, loggedAt: new Date().toISOString() };
        
        const currentMoods = JSON.parse(localStorage.getItem(MOOD_LOG_KEY) || '[]');
        const todayFormatted = formatDate(date);

        // Check if today is already logged (prevent duplicates)
        const isLogged = currentMoods.some(log => formatDate(log.date) === todayFormatted);

        if (!isLogged) {
            const updatedMoods = [...currentMoods, logEntry];
            updatedMoods.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            
            localStorage.setItem(MOOD_LOG_KEY, JSON.stringify(updatedMoods));
            setMoodLog(updatedMoods);
            return true;
        }
        return false;
    }, []);

    // Function to save journal data (updated to use localStorage)
    const saveJournalData = useCallback((text) => {
        const entry = { text, createdAt: new Date().toISOString(), date: formatDate(new Date()) };
        
        const currentJournals = JSON.parse(localStorage.getItem(JOURNAL_ENTRIES_KEY) || '[]');
        const updatedJournals = [entry, ...currentJournals];

        localStorage.setItem(JOURNAL_ENTRIES_KEY, JSON.stringify(updatedJournals));
        setJournalEntries(updatedJournals);
    }, []);

    return { userId, isAuthReady, moodLog, journalEntries, saveMoodData, saveJournalData };
};


// --- UI Constants ---
const MOOD_OPTIONS = [
    { name: "Joyful", emoji: "😊", colorClass: "bg-warning-subtle", hover: "bg-warning" },
    { name: "Calm", emoji: "😌", colorClass: "bg-success-subtle", hover: "bg-success" },
    { name: "Anxious", emoji: "😟", colorClass: "bg-info-subtle", hover: "bg-info" },
    { name: "Stressed", emoji: "😩", colorClass: "bg-danger-subtle", hover: "bg-danger" },
    { name: "Tired", emoji: "😴", colorClass: "bg-primary-subtle", hover: "bg-primary" },
    { name: "Sad", emoji: "😭", colorClass: "bg-secondary-subtle", hover: "bg-secondary" },
];

const EMOTIONAL_COLORS = [
    { name: "Joy", color: "bg-warning", key: 'joy' },
    { name: "Calm", color: "bg-success", key: 'calm' },
    { name: "Anxiety", color: "bg-info", key: 'anxiety' },
    { name: "Stress", color: "bg-danger", key: 'stress' },
    { name: "Tired", color: "bg-primary", key: 'tired' },
    { name: "Sad", color: "bg-secondary", key: 'sad' },
];

const shuffleArray = (array) => {
    let newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
};

/**
 * Meditation Modal Component (NEW)
 */
const MeditationModal = ({ show, onClose, meditation }) => {
    if (!meditation) return null;

    const [timeLeft, setTimeLeft] = useState(0);
    const durationMinutes = parseInt(meditation.duration.split(' ')[0]) || 5;
    const durationSeconds = durationMinutes * 60;
    const timerRef = useRef(null);

    useEffect(() => {
        if (show) {
            setTimeLeft(durationSeconds);
            timerRef.current = setInterval(() => {
                setTimeLeft(prevTime => {
                    if (prevTime <= 1) {
                        clearInterval(timerRef.current);
                        onClose(); // Close modal when finished
                        return 0;
                    }
                    return prevTime - 1;
                });
            }, 1000);
        } else {
            clearInterval(timerRef.current);
        }

        return () => clearInterval(timerRef.current);
    }, [show, durationSeconds, onClose]);

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const progress = (1 - (timeLeft / durationSeconds)) * 100;

    return (
        <div className={`modal fade ${show ? 'show d-block' : 'd-none'}`} tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content rounded-4 shadow-lg text-center p-3">
                    <div className="modal-header border-0 pb-0">
                        <h5 className="modal-title fw-bold text-primary">{meditation.title}</h5>
                        <button type="button" className="btn-close" onClick={onClose} aria-label="Close"></button>
                    </div>
                    <div className="modal-body">
                        <span className="display-1">{meditation.icon}</span>
                        <p className="lead fw-bolder mt-3 text-secondary">
                            {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
                        </p>
                        <p className="small text-muted mb-4">Focus on your breathing. Inhale, exhale.</p>
                        
                        <div className="progress rounded-pill shadow-sm" style={{ height: '10px' }}>
                            <div 
                                className="progress-bar rounded-pill" 
                                role="progressbar" 
                                style={{ width: `${progress}%`, backgroundColor: meditation.color.replace('bg-', '#') }} 
                                aria-valuenow={progress} 
                                aria-valuemin="0" 
                                aria-valuemax="100"
                            ></div>
                        </div>

                    </div>
                    <div className="modal-footer border-0 pt-0 justify-content-center">
                         <button type="button" className="btn btn-danger rounded-pill" onClick={onClose}>
                            Stop Meditation
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};


/**
 * Mood Selection Component
 */
const MoodTracker = ({ selectedMood, setSelectedMood, saveMood, moodLog, isSaving }) => {
    const today = formatDate(new Date());
    const hasLoggedToday = moodLog.some(log => formatDate(log.date) === today);

    const MoodButton = ({ mood }) => (
        <button
            onClick={() => setSelectedMood(mood)}
            className={`d-flex flex-column align-items-center justify-content-center p-3 m-2 rounded-4 shadow-sm border-0 mood-btn transition ${mood.colorClass} 
                        ${selectedMood?.name === mood.name ? 'border border-3 border-primary' : ''}`}
            style={{ minWidth: '90px', minHeight: '90px', aspectRatio: '1 / 1' }}
        >
            <span className="fs-3">{mood.emoji}</span>
            <small className="fw-semibold mt-1 text-dark text-center">{mood.name}</small>
        </button>
    );

    // Simplified calculation for the streak
    let streakCount = 0;
    const todayLog = moodLog.find(log => formatDate(log.date) === today);
    if (todayLog) {
        streakCount++; // Start with 1 if today is logged
        let checkDate = new Date();
        checkDate.setDate(checkDate.getDate() - 1); // Start checking from yesterday

        for (let i = 0; i < 7; i++) {
            const checkDay = formatDate(checkDate);
            const logFound = moodLog.some(log => formatDate(log.date) === checkDay);
            
            if (logFound) {
                streakCount++;
                checkDate.setDate(checkDate.getDate() - 1); // Move back one day
            } else {
                break;
            }
        }
    }


    return (
        <div className="p-2 space-y-4">
            <h1 className="h3 fw-bold text-primary mb-4">
                How are you feeling today?
            </h1>

            <div className="d-flex flex-wrap justify-content-center gap-2">
                {MOOD_OPTIONS.map((mood) => (
                    <MoodButton key={mood.name} mood={mood} />
                ))}
            </div>

            {selectedMood && !hasLoggedToday && (
                <button 
                    onClick={saveMood}
                    disabled={isSaving}
                    className="w-100 py-3 mt-4 btn btn-primary fw-bold rounded-3 shadow-sm transition hover-scale-101"
                >
                    {isSaving ? 'Logging...' : `Log ${selectedMood.name} Mood`}
                </button>
            )}

            {hasLoggedToday && (
                <div className="text-center py-3 alert alert-success fw-bold rounded-3">
                    ✅ Mood logged for today!
                </div>
            )}
            
            <div className="pt-4 border-top border-light-subtle">
                <h2 className="h5 fw-bold text-secondary mb-3 d-flex align-items-center">
                    <Calendar size={18} className="me-2 text-info" /> Your Mood Streak
                </h2>
                <div className="text-center bg-light p-3 rounded-3 shadow-sm">
                    <p className="lead fw-bolder text-primary mb-0">{streakCount} days</p>
                    <p className="small text-muted mb-0">of consistent self-care!</p>
                </div>
                
                <h2 className="h5 fw-bold text-secondary mt-4 mb-3 d-flex align-items-center">
                    <Calendar size={18} className="me-2 text-info" /> Last 7 Days
                </h2>
                <div className="d-flex justify-content-between p-2">
                    {Array(7).fill(0).map((_, index) => {
                        const date = new Date();
                        date.setDate(date.getDate() - (6 - index)); 
                        const dateString = formatDate(date);
                        const log = moodLog.find(l => formatDate(l.date) === dateString);
                        
                        return (
                            <div key={index} className="d-flex flex-column align-items-center">
                                <span className="fs-4">
                                    {log ? MOOD_OPTIONS.find(m => m.name === log.mood)?.emoji || '⚪' : '⚪'}
                                </span>
                                <small className={`mt-1 fw-semibold ${log ? 'text-dark' : 'text-muted opacity-50'}`}>
                                    {new Date(date).toLocaleDateString('en-US', { weekday: 'short' })}
                                </small>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

/**
 * Daily Journal Component
 */
const DailyJournal = ({ journalEntries, isSavingJournal, setIsSavingJournal, saveJournalData }) => {
    const [journalText, setJournalText] = useState('');
    const [message, setMessage] = useState('');

    const handleSaveJournal = () => {
        if (journalText.trim() === '') {
            setMessage('Journal entry cannot be empty.');
            return;
        }

        setIsSavingJournal(true);
        setMessage('');

        try {
            // Call the synchronous save function
            saveJournalData(journalText);
            setJournalText('');
            setMessage('Journal entry saved successfully!');
        } catch (error) {
            // This catches any actual localStorage errors (e.g., storage full)
            console.error("Error saving journal entry: ", error);
            setMessage('Failed to save journal. Please try again.');
        } finally {
            setIsSavingJournal(false);
            setTimeout(() => setMessage(''), 3000);
        }
    };

    const latestEntry = journalEntries.length > 0 ? journalEntries[0] : null;

    return (
        <div className="p-2 space-y-4">
            <h1 className="h3 fw-bold text-primary d-flex align-items-center mb-4">
                <BookOpen size={30} className="me-2 text-danger"/> Daily Journal
            </h1>
            <p className="text-secondary">What's on your mind today? Write down your thoughts.</p>
            
            <textarea
                value={journalText}
                onChange={(e) => setJournalText(e.target.value)}
                placeholder="Today, I feel..."
                rows="8"
                className="form-control p-3 border border-primary-subtle rounded-3 shadow-sm transition resize-none"
            />
            
            <button 
                onClick={handleSaveJournal}
                disabled={isSavingJournal || journalText.trim() === ''}
                className="w-100 py-3 btn btn-danger fw-bold rounded-3 shadow transition hover-scale-101"
            >
                {isSavingJournal ? 'Saving...' : 'Continue & Save Entry'}
            </button>

            {message && (
                <div className={`p-3 rounded-3 fw-semibold text-center ${message.includes('saved') ? 'alert alert-success' : 'alert alert-danger'}`}>
                    {message}
                </div>
            )}

            <div className="pt-4 border-top border-light-subtle">
                <h2 className="h5 fw-bold text-primary mb-3">Latest Entry</h2>
                {latestEntry ? (
                    <div className="p-4 bg-light rounded-3 shadow-sm">
                        <p className="small text-dark-emphasis fst-italic">"{latestEntry.text.substring(0, 150)}{latestEntry.text.length > 150 ? '...' : ''}"</p>
                        <p className="small text-muted mt-2 text-end">
                            Logged: {new Date(latestEntry.createdAt).toLocaleDateString()}
                        </p>
                    </div>
                ) : (
                    <p className="text-muted">No journal entries yet.</p>
                )}
            </div>
        </div>
    );
};

/**
 * Meditation Library Component
 */
const MeditationLibrary = ({ startMeditation }) => {
    // Note: Colors need to be converted from bg-x to hex for the progress bar styling
    const MEDITATIONS = [
        { title: "Quick Focus", duration: "5 min", color: "#ffc107", icon: "🧠", description: "A rapid session to reset focus and clear the mind." }, // warning
        { title: "Sleep Prep", duration: "10 min", color: "#0d6efd", icon: "💤", description: "Wind down your thoughts and prepare your body for deep rest." }, // primary
        { title: "Social Anxiety Relief", duration: "15 min", color: "#dc3545", icon: "🫂", description: "Grounding techniques to reduce nervousness in social settings." }, // danger
        { title: "Mindful Eating", duration: "8 min", color: "#198754", icon: "🍎", description: "Focusing on the senses to enjoy your food and slow down." }, // success
    ];

    return (
        <div className="p-2 space-y-4">
            <h1 className="h3 fw-bold text-primary d-flex align-items-center mb-4">
                <Sun size={30} className="me-2 text-warning"/> Meditation Library
            </h1>
            <p className="text-secondary">Find bite-sized guided meditations for every mood.</p>
            
            <div className="space-y-3">
                {MEDITATIONS.map((m) => (
                    <div key={m.title} className={`d-flex justify-content-between align-items-center p-4 rounded-3 shadow transition hover-scale-101 cursor-pointer bg-light fw-bold`}
                         style={{ backgroundColor: m.color + '22' }}> 
                        <div className="d-flex align-items-center">
                            <span className="fs-3 me-3">{m.icon}</span>
                            <div>
                                <h2 className="h5 mb-0 text-dark">{m.title}</h2>
                                <p className="small fw-medium opacity-75 mb-0 text-dark">{m.duration}</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => startMeditation(m)}
                            className="btn btn-primary text-white px-4 py-2 rounded-pill small fw-semibold shadow-sm hover-scale-105 active-scale-95"
                        >
                            Start
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

/**
 * Safe Space (Mock Community Hub) Component
 */
const SafeSpace = () => {
    // State to manage user's new post input
    const [newPostText, setNewPostText] = useState('');
    const [selectedPostMood, setSelectedPostMood] = useState(MOOD_OPTIONS[0]); // Default to Joyful
    
    // State for initial mock posts and user-submitted posts
    const [mockPosts, setMockPosts] = useState([
        { user: "KindSoul42", mood: "😌 Calm", text: "Just finished a great focus session. Feeling centered and ready for the week ahead! ✨", color: "border-success", icon: "😌" },
        { user: "PixelPanda", mood: "😩 Stressed", text: "Midterms are hitting hard. Anyone else feeling overwhelmed? Deep breaths...", color: "border-danger", icon: "😩" },
        { user: "Z_Gen_Vibes", mood: "😊 Joyful", text: "Logged a 7-day mood streak! Small wins matter! Celebrating with some comfy socks. 🥳", color: "border-warning", icon: "😊" },
    ]);

    const handlePost = () => {
        if (!selectedPostMood || newPostText.trim() === '') {
            return; // Don't post if mood or text is missing
        }

        const newPost = {
            user: "Guest_" + Math.floor(Math.random() * 9999), // Anonymous Guest ID
            mood: `${selectedPostMood.emoji} ${selectedPostMood.name}`,
            text: newPostText.trim(),
            color: MOOD_OPTIONS.find(m => m.name === selectedPostMood.name)?.colorClass.replace('-subtle', '') || 'border-info',
            icon: selectedPostMood.emoji,
        };

        // Prepend new post to the top of the list
        setMockPosts([newPost, ...mockPosts]);
        setNewPostText('');
        setSelectedPostMood(MOOD_OPTIONS[0]);
    };

    const PostMoodButton = ({ mood }) => (
        <button
            onClick={() => setSelectedPostMood(mood)}
            className={`d-flex flex-column align-items-center justify-content-center p-2 rounded-3 transition border-0 ${mood.colorClass} 
                        ${selectedPostMood?.name === mood.name ? 'border border-3 border-primary' : ''}`}
            title={mood.name}
            style={{ width: '40px', height: '40px' }}
        >
            <span className="fs-5">{mood.emoji}</span>
        </button>
    );

    return (
        <div className="p-2 space-y-4">
            <h1 className="h3 fw-bold text-primary d-flex align-items-center mb-4">
                <Users size={30} className="me-2 text-info"/> Safe Space
            </h1>
            <p className="text-secondary">Connect with others in a supportive, anonymous community.</p>

            <div className="p-3 bg-light rounded-3 border border-primary-subtle">
                <p className="text-dark-emphasis fw-bold mb-2">Share your feelings anonymously:</p>
                
                <textarea
                    value={newPostText}
                    onChange={(e) => setNewPostText(e.target.value)}
                    placeholder="Type your thought..."
                    rows="3"
                    className="form-control mb-3 rounded-3 shadow-sm resize-none"
                />

                <div className="d-flex justify-content-between align-items-center">
                    <div className="d-flex gap-2 flex-wrap">
                        {MOOD_OPTIONS.map(m => <PostMoodButton key={m.name} mood={m} />)}
                    </div>
                    <button 
                        onClick={handlePost}
                        disabled={!selectedPostMood || newPostText.trim() === ''}
                        className="btn btn-primary text-white px-3 py-1 rounded-pill small fw-semibold hover-scale-105 active-scale-95"
                    >
                        Post
                    </button>
                </div>
            </div>

            <div className="space-y-3 pt-3">
                {mockPosts.map((post, index) => (
                    <div key={index} className={`p-3 bg-white rounded-3 shadow-sm border-start border-4 ${post.color}`}>
                        <div className="d-flex align-items-center mb-2">
                            <span className="fs-5 me-2">{post.icon}</span>
                            <span className="fw-bold text-dark">{post.user}</span>
                            <span className={`ms-3 small fw-semibold px-2 py-0 bg-light rounded-pill text-dark-emphasis`}>{post.mood}</span>
                        </div>
                        <p className="text-dark-emphasis mb-0">{post.text}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

/**
 * New Color Harmony Game Component (Interactive and Fun)
 */
const ColorHarmonyGame = () => {
    const GAME_DURATION = 45; // seconds
    const [gameStatus, setGameStatus] = useState('ready'); // 'ready', 'playing', 'finished'
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
    const [target, setTarget] = useState(null);
    const [options, setOptions] = useState([]);
    const timerRef = useRef(null);

    const generateChallenge = useCallback(() => {
        // 1. Pick a random target emotion/color
        const targetColor = EMOTIONAL_COLORS[Math.floor(Math.random() * EMOTIONAL_COLORS.length)];
        setTarget(targetColor);

        // 2. Create options: the target plus 3 random decoys
        let availableDecoys = EMOTIONAL_COLORS.filter(c => c.key !== targetColor.key);
        // Shuffle decoys and pick 3 (or fewer if less than 3 remain)
        availableDecoys = shuffleArray(availableDecoys).slice(0, 3);
        
        const challengeOptions = shuffleArray([...availableDecoys, targetColor]);
        setOptions(challengeOptions);
    }, []);

    const startGame = useCallback(() => {
        setScore(0);
        setTimeLeft(GAME_DURATION);
        setGameStatus('playing');
        generateChallenge();
    }, [generateChallenge]);

    const handleGuess = (guessedColorKey) => {
        if (gameStatus !== 'playing') return;

        if (guessedColorKey === target.key) {
            setScore(s => s + 1);
        }
        // Optional: Implement penalty or sound effect here
        generateChallenge();
    };

    useEffect(() => {
        if (gameStatus === 'playing') {
            timerRef.current = setInterval(() => {
                setTimeLeft(prevTime => {
                    if (prevTime <= 1) {
                        clearInterval(timerRef.current);
                        setGameStatus('finished');
                        return 0;
                    }
                    return prevTime - 1;
                });
            }, 1000);
        } else if (gameStatus === 'finished' || gameStatus === 'ready') {
            clearInterval(timerRef.current);
        }

        return () => clearInterval(timerRef.current);
    }, [gameStatus]);

    const renderGameContent = () => {
        if (gameStatus === 'ready') {
            return (
                <div className="text-center p-4 bg-light rounded-4 shadow-sm border border-primary-subtle">
                    <h2 className="h4 fw-bold text-primary mb-3">Ready to find your inner harmony?</h2>
                    <p className="text-secondary mb-4">Match the colored blobs to the target emotion as fast as you can in {GAME_DURATION} seconds.</p>
                    <button 
                        onClick={startGame}
                        className="btn btn-danger btn-lg fw-bolder rounded-pill shadow transition hover-scale-105 active-scale-95"
                    >
                        Start Harmony!
                    </button>
                </div>
            );
        }

        if (gameStatus === 'finished') {
            return (
                <div className="text-center p-4 alert alert-success rounded-4 shadow-lg">
                    <h2 className="h3 fw-bolder mb-3">Time's Up!</h2>
                    <p className="lead text-dark mb-4">Your final Harmony Score is:</p>
                    <span className="display-4 fw-black text-primary">{score}</span>
                    <p className="text-secondary mt-3">Great work, SoulSpace Explorer!</p>
                    <button 
                        onClick={() => setGameStatus('ready')}
                        className="mt-4 btn btn-primary fw-bold rounded-3 hover-scale-101 active-scale-95"
                    >
                        Play Again
                    </button>
                </div>
            );
        }

        return (
            <div className="space-y-4">
                {/* Score and Timer HUD */}
                <div className="d-flex justify-content-between align-items-center p-3 bg-white rounded-3 shadow-sm border">
                    <div className="text-center">
                        <p className="small text-muted mb-0">Score</p>
                        <p className="h4 fw-black text-primary mb-0">{score}</p>
                    </div>
                    <div className="text-center">
                        <p className="small text-muted mb-0">Time Left</p>
                        <p className={`h4 fw-black mb-0 ${timeLeft <= 10 ? 'text-danger animate-pulse' : 'text-success'}`}>{timeLeft}s</p>
                    </div>
                </div>

                {/* Target Instruction */}
                <div className="text-center p-3 bg-primary-subtle rounded-3 shadow-sm border-bottom border-4 border-primary">
                    <p className="h5 fw-bold text-dark mb-0">Match the: <span className="text-danger">{target?.name} Blob!</span></p>
                </div>

                {/* Game Options (Blobs) */}
                <div className="row g-3 p-3">
                    {options.map((option, index) => (
                        <div key={index} className="col-6">
                            <button
                                onClick={() => handleGuess(option.key)}
                                className={`d-flex align-items-center justify-content-center w-100 h-100 rounded-circle shadow-lg border-0 transition hover-scale-105 active-scale-95 ${option.color}`}
                                style={{ aspectRatio: '1 / 1', minHeight: '100px' }}
                            >
                                <span className="small text-white opacity-0">.</span>
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="p-3 d-flex flex-column align-items-center justify-content-center">
            <h1 className="h3 fw-bold text-primary d-flex align-items-center mb-4">
                <Gamepad size={30} className="me-2 text-danger"/> Color Harmony
            </h1>
            <p className="text-secondary text-center">Test your emotional recognition and reaction speed!</p>
            
            <div className="w-100" style={{ maxWidth: '350px' }}>
                {renderGameContent()}
            </div>
        </div>
    );
};


// --- Main App Component ---

const App = () => {
    const { userId, isAuthReady, moodLog, journalEntries, saveMoodData, saveJournalData } = useGuestSetup();
    
    // State for Navigation
    const [currentPage, setCurrentPage] = useState('mood'); 
    
    // State for Meditation
    const [showMeditationModal, setShowMeditationModal] = useState(false);
    const [currentMeditation, setCurrentMeditation] = useState(null);

    // State for Mood Tracking Interaction
    const [selectedMood, setSelectedMood] = useState(null);
    const [isSavingMood, setIsSavingMood] = useState(false);
    const [isSavingJournal, setIsSavingJournal] = useState(false);

    // Function to start a meditation session
    const startMeditation = (meditation) => {
        setCurrentMeditation(meditation);
        setShowMeditationModal(true);
    };

    // Function to close meditation modal
    const closeMeditationModal = () => {
        setShowMeditationModal(false);
        setCurrentMeditation(null);
    };

    // Handle saving the selected mood
    const saveMood = () => {
        if (!userId || !selectedMood) return;

        setIsSavingMood(true);
        const today = new Date();

        try {
            const saved = saveMoodData(selectedMood, today);
            if (saved) {
                // Success message handling could go here
            } else {
                // Already logged today
            }

            setSelectedMood(null);
        } catch (error) {
            console.error("Error saving mood log: ", error);
        } finally {
            setIsSavingMood(false);
        }
    };

    // Handle saving the journal entry (calls synchronous save function)
    const saveJournal = (text) => {
        if (!userId || text.trim() === '') return;
        
        setIsSavingJournal(true);
        try {
            saveJournalData(text);
        } catch (error) {
             console.error("Error saving journal entry: ", error);
        } finally {
            setIsSavingJournal(false);
        }
    };
    
    // Component Renderer
    const renderPage = () => {
        if (!isAuthReady) {
            return (
                <div className="d-flex flex-column align-items-center justify-content-center h-100 p-5" style={{ minHeight: '300px' }}>
                    <Loader2 size={36} className="text-primary animate-spin mb-3"/>
                    <div className="h5 fw-bold text-primary">Loading SoulSpace...</div>
                </div>
            );
        }

        // App logic starts here now that guest mode is automatic
        switch (currentPage) {
            case 'mood':
                return <MoodTracker {...{ selectedMood, setSelectedMood, saveMood, moodLog, isSaving: isSavingMood }}/>;
            case 'journal':
                // Pass the simplified, synchronous save function
                return <DailyJournal {...{ journalEntries, isSavingJournal, setIsSavingJournal, saveJournalData: saveJournal }}/>;
            case 'meditation':
                // Pass the startMeditation function down
                return <MeditationLibrary {...{ startMeditation }}/>;
            case 'safeSpace':
                return <SafeSpace />;
            case 'game':
                return <ColorHarmonyGame />;
            default:
                return <MoodTracker />;
        }
    };

    const NavButton = ({ page, icon: Icon, label }) => (
        <button
            onClick={() => setCurrentPage(page)}
            className={`btn d-flex flex-column align-items-center p-2 rounded-3 transition border-0 ${currentPage === page ? 'text-primary bg-primary-subtle fw-bold shadow-sm' : 'text-secondary hover-text-primary'}`}
            title={label}
        >
            <Icon size={24}/>
            <small className="mt-1 d-none d-sm-inline">{label}</small>
        </button>
    );

    return (
        <div className="min-vh-100 bg-light-subtle d-flex flex-column align-items-center p-0">
            
            {/* Bootstrap CDN for styling and JS components */}
            <link 
                href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" 
                rel="stylesheet" 
                xintegrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" 
                crossOrigin="anonymous" 
            />

            <div className="app-container w-100 bg-white shadow-lg rounded-0 d-flex flex-column" style={{ maxWidth: '400px', height: '100dvh', overflow: 'hidden' }}>
                
                {/* Header */}
                <header className="p-3 bg-white border-bottom border-light-subtle d-flex justify-content-between align-items-center flex-shrink-0">
                    <div className="d-flex align-items-center">
                        <span className="fs-4 fw-black text-primary">SoulSpace</span>
                        <span className="badge text-bg-info ms-2">Guest Mode</span>
                    </div>
                    {/* User Info / Guest ID */}
                    <div className="small text-muted text-end">
                        ID: {userId ? userId.substring(0, 6) : 'N/A'}...
                    </div>
                </header>

                {/* Main Content Area */}
                <main className="flex-grow-1 overflow-y-auto" style={{ padding: '0 0', flex: 1 }}>
                    {renderPage()}
                </main>

                {/* Footer Navigation */}
                <nav className="p-2 bg-white border-top border-light-subtle shadow-sm sticky-bottom flex-shrink-0">
                    <div className="d-flex justify-content-around">
                        <NavButton page="mood" icon={Smile} label="Mood" />
                        <NavButton page="journal" icon={BookOpen} label="Journal" />
                        <NavButton page="meditation" icon={Sun} label="Meditate" />
                        <NavButton page="safeSpace" icon={Users} label="Space" />
                        <NavButton page="game" icon={Gamepad} label="Game" />
                    </div>
                </nav>
            </div>
            
            {/* Meditation Modal (Rendered outside the main app container) */}
            <MeditationModal show={showMeditationModal} onClose={closeMeditationModal} meditation={currentMeditation} />

            {/* Bootstrap JS is required for modals, tooltips, etc. */}
            <script 
                src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js" 
                xintegrity="sha384-YvpcrYf0tY3lHB60NNkmXc5s9fDVZLESaAA55NDzOxhy9GkcIdslK1eN7N6jIeHz" 
                crossOrigin="anonymous"
            ></script>

            <style>
                {`
                    /* IMPORTANT: The universal box-sizing border-box prevents padding from causing horizontal overflow */
                    *, *::before, *::after {
                        box-sizing: border-box;
                    }

                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap');
                    body {
                        font-family: 'Inter', sans-serif;
                        margin: 0;
                        padding: 0;
                        /* Prevent accidental horizontal scroll */
                        overflow-x: hidden; 
                    }
                    
                    /* Custom utility styles */
                    .transition {
                        transition: all 0.2s ease-in-out;
                    }
                    .hover-scale-101:hover {
                        transform: scale(1.01);
                    }
                    .active-scale-95:active {
                        transform: scale(0.95);
                    }
                    .resize-none {
                        resize: none;
                    }
                    .animate-spin {
                        animation: spin 1s linear infinite;
                    }
                    @keyframes spin {
                        to { transform: rotate(360deg); }
                    }

                    /* Set primary color for better pastels */
                    .text-primary { color: #6a0dad !important; } /* Deep Purple */
                    .bg-primary-subtle { background-color: #e6e0f2 !important; }
                    /* Secondary colors for mood buttons */
                    .bg-warning { background-color: #ffc107 !important; }
                    .bg-success { background-color: #198754 !important; }
                    .bg-info { background-color: #0dcaf0 !important; }
                    .bg-danger { background-color: #dc3545 !important; }
                    .bg-primary { background-color: #0d6efd !important; }
                    .bg-secondary { background-color: #6c757d !important; }
                    
                    .bg-warning-subtle { background-color: #fff3cd !important; }
                    .bg-success-subtle { background-color: #d1e7dd !important; }
                    .bg-info-subtle { background-color: #cff4fc !important; }
                    .bg-danger-subtle { background-color: #f8d7da !important; }
                    
                    /* === MOBILE OPTIMIZATION === */
                    /* Ensure the whole body wrapper is 100vh */
                    .min-vh-100 {
                        min-height: 100vh;
                        height: 100vh;
                        padding: 0 !important; /* Remove outer padding */
                    }
                    
                    .app-container {
                        min-height: 100vh !important;
                        height: 100dvh; /* Use dynamic height for accurate mobile sizing */
                        border-radius: 0 !important; /* Full app look */
                        box-shadow: none !important;
                        max-width: 100% !important; 
                        
                        /* Layout adjustment */
                        display: flex; 
                        flex-direction: column;
                    }
                    
                    /* Resetting container padding added by App's parent flex */
                    .min-vh-100 {
                        padding: 0 !important;
                        margin: 0 !important;
                    }
                    
                    /* Ensure content pages don't have large padding that causes overflow */
                    /* Reduced padding in components to p-2 for tight mobile fit */

                `}
            </style>
        </div>
    );
};

export default App;
