import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const TradingAcademy = () => {
    const navigate = useNavigate();
    const [selectedLevel, setSelectedLevel] = useState('beginner');
    const [selectedTopic, setSelectedTopic] = useState('all');

    // Educational playlists organized by topic and level
    const playlists = {
        fundamentals: {
            beginner: [
                {
                    title: 'Trading Basics for Beginners',
                    description: 'Learn the fundamentals of trading from scratch',
                    url: 'https://www.youtube.com/playlist?list=PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf',
                    duration: '5 hours',
                    videos: 25
                },
                {
                    title: 'Understanding Markets',
                    description: 'How financial markets work',
                    url: 'https://www.youtube.com/playlist?list=PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf',
                    duration: '3 hours',
                    videos: 15
                }
            ],
            intermediate: [
                {
                    title: 'Advanced Market Analysis',
                    description: 'Deeper understanding of market dynamics',
                    url: 'https://www.youtube.com/playlist?list=PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf',
                    duration: '7 hours',
                    videos: 30
                },
                {
                    title: 'Economic Indicators',
                    description: 'How to interpret economic data',
                    url: 'https://www.youtube.com/playlist?list=PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf',
                    duration: '4 hours',
                    videos: 20
                }
            ],
            pro: [
                {
                    title: 'Institutional Trading Strategies',
                    description: 'Trade like the professionals',
                    url: 'https://www.youtube.com/playlist?list=PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf',
                    duration: '10 hours',
                    videos: 45
                }
            ]
        },
        technical: {
            beginner: [
                {
                    title: 'Chart Patterns for Beginners',
                    description: 'Recognize and trade basic patterns',
                    url: 'https://www.youtube.com/playlist?list=PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf',
                    duration: '4 hours',
                    videos: 20
                },
                {
                    title: 'Candlestick Analysis',
                    description: 'Master candlestick reading',
                    url: 'https://www.youtube.com/playlist?list=PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf',
                    duration: '3 hours',
                    videos: 15
                }
            ],
            intermediate: [
                {
                    title: 'Advanced Indicators',
                    description: 'RSI, MACD, Bollinger Bands and more',
                    url: 'https://www.youtube.com/playlist?list=PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf',
                    duration: '6 hours',
                    videos: 28
                },
                {
                    title: 'Price Action Trading',
                    description: 'Trade without indicators',
                    url: 'https://www.youtube.com/playlist?list=PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf',
                    duration: '5 hours',
                    videos: 22
                }
            ],
            pro: [
                {
                    title: 'Order Flow Analysis',
                    description: 'Advanced market microstructure',
                    url: 'https://www.youtube.com/playlist?list=PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf',
                    duration: '8 hours',
                    videos: 35
                },
                {
                    title: 'Algorithmic Trading Basics',
                    description: 'Introduction to automated trading',
                    url: 'https://www.youtube.com/playlist?list=PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf',
                    duration: '9 hours',
                    videos: 40
                }
            ]
        },
        risk: {
            beginner: [
                {
                    title: 'Risk Management 101',
                    description: 'Protect your capital',
                    url: 'https://www.youtube.com/playlist?list=PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf',
                    duration: '3 hours',
                    videos: 12
                },
                {
                    title: 'Position Sizing',
                    description: 'How much to risk per trade',
                    url: 'https://www.youtube.com/playlist?list=PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf',
                    duration: '2 hours',
                    videos: 10
                }
            ],
            intermediate: [
                {
                    title: 'Portfolio Management',
                    description: 'Diversification and allocation',
                    url: 'https://www.youtube.com/playlist?list=PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf',
                    duration: '5 hours',
                    videos: 25
                },
                {
                    title: 'Psychology of Trading',
                    description: 'Master your emotions',
                    url: 'https://www.youtube.com/playlist?list=PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf',
                    duration: '4 hours',
                    videos: 18
                }
            ],
            pro: [
                {
                    title: 'Advanced Risk Models',
                    description: 'VaR, Monte Carlo, and more',
                    url: 'https://www.youtube.com/playlist?list=PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf',
                    duration: '7 hours',
                    videos: 30
                },
                {
                    title: 'Crisis Management',
                    description: 'Navigate extreme market conditions',
                    url: 'https://www.youtube.com/playlist?list=PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf',
                    duration: '6 hours',
                    videos: 25
                }
            ]
        }
    };

    const topics = [
        { id: 'all', name: 'All Topics', icon: '📚', gradient: 'from-blue-600 to-cyan-600' },
        { id: 'fundamentals', name: 'Fundamentals', icon: '📊', gradient: 'from-emerald-600 to-green-600' },
        { id: 'technical', name: 'Technical Analysis', icon: '📈', gradient: 'from-purple-600 to-pink-600' },
        { id: 'risk', name: 'Risk Management', icon: '🛡️', gradient: 'from-orange-600 to-red-600' }
    ];

    const levels = [
        { id: 'beginner', name: 'Débutant', icon: '🌱', color: 'text-green-400' },
        { id: 'intermediate', name: 'Intermédiaire', icon: '⚡', color: 'text-yellow-400' },
        { id: 'pro', name: 'Pro', icon: '🏆', color: 'text-purple-400' }
    ];

    const getFilteredPlaylists = () => {
        let filtered = [];

        if (selectedTopic === 'all') {
            Object.keys(playlists).forEach(topic => {
                filtered = [...filtered, ...playlists[topic][selectedLevel].map(p => ({ ...p, topic }))];
            });
        } else {
            filtered = playlists[selectedTopic][selectedLevel].map(p => ({ ...p, topic: selectedTopic }));
        }

        return filtered;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
            {/* Header */}
            <div className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 shadow-xl sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="text-gray-400 hover:text-white transition-colors"
                            >
                                ← Back to Dashboard
                            </button>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                                🎓 Trading Academy
                            </h1>
                        </div>
                    </div>
                    <p className="text-gray-400 text-sm mt-2">Master trading with curated educational content</p>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-6 py-8">

                {/* Level Selector */}
                <div className="mb-8">
                    <h2 className="text-xl font-bold mb-4">Select Your Level</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {levels.map((level) => (
                            <motion.button
                                key={level.id}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setSelectedLevel(level.id)}
                                className={`p-6 rounded-2xl border-2 transition-all duration-300 ${selectedLevel === level.id
                                        ? 'bg-gradient-to-br from-gray-700 to-gray-800 border-blue-500 shadow-lg shadow-blue-500/20'
                                        : 'bg-gray-800/50 border-gray-700 hover:border-gray-600'
                                    }`}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-3xl">{level.icon}</span>
                                    {selectedLevel === level.id && (
                                        <span className="text-blue-400 text-sm font-bold">✓ Selected</span>
                                    )}
                                </div>
                                <h3 className={`text-xl font-bold ${level.color}`}>{level.name}</h3>
                                <p className="text-sm text-gray-400 mt-1">
                                    {level.id === 'beginner' && 'Start your trading journey'}
                                    {level.id === 'intermediate' && 'Build advanced skills'}
                                    {level.id === 'pro' && 'Master institutional strategies'}
                                </p>
                            </motion.button>
                        ))}
                    </div>
                </div>

                {/* Topic Filter */}
                <div className="mb-8">
                    <h2 className="text-xl font-bold mb-4">Topics</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {topics.map((topic) => (
                            <motion.button
                                key={topic.id}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setSelectedTopic(topic.id)}
                                className={`p-4 rounded-xl font-bold transition-all duration-300 border ${selectedTopic === topic.id
                                        ? `bg-gradient-to-r ${topic.gradient} border-transparent shadow-lg`
                                        : 'bg-gray-800/50 border-gray-700 hover:border-gray-600'
                                    }`}
                            >
                                <div className="text-3xl mb-2">{topic.icon}</div>
                                <div className="text-sm">{topic.name}</div>
                            </motion.button>
                        ))}
                    </div>
                </div>

                {/* Playlists Grid */}
                <div>
                    <h2 className="text-xl font-bold mb-4">
                        {selectedTopic === 'all' ? 'All Courses' : topics.find(t => t.id === selectedTopic)?.name}
                        {' '}- {levels.find(l => l.id === selectedLevel)?.name}
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {getFilteredPlaylists().map((playlist, index) => (
                            <motion.a
                                key={index}
                                href={playlist.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                whileHover={{ y: -8 }}
                                className="group bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700/50 overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 hover:border-blue-500/50"
                            >
                                {/* Thumbnail Area */}
                                <div className="relative h-48 bg-gradient-to-br from-blue-600/20 to-purple-600/20 flex items-center justify-center border-b border-gray-700/50">
                                    <div className="text-6xl group-hover:scale-110 transition-transform duration-300">
                                        {playlist.topic === 'fundamentals' && '📊'}
                                        {playlist.topic === 'technical' && '📈'}
                                        {playlist.topic === 'risk' && '🛡️'}
                                    </div>

                                    {/* Play overlay */}
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 flex items-center justify-center transition-all duration-300">
                                        <div className="w-16 h-16 rounded-full bg-blue-600 opacity-0 group-hover:opacity-100 flex items-center justify-center transform scale-75 group-hover:scale-100 transition-all duration-300">
                                            <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M8 5v14l11-7z" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-6">
                                    <h3 className="text-lg font-bold mb-2 group-hover:text-blue-400 transition-colors">
                                        {playlist.title}
                                    </h3>
                                    <p className="text-sm text-gray-400 mb-4">
                                        {playlist.description}
                                    </p>

                                    {/* Stats */}
                                    <div className="flex items-center justify-between text-xs text-gray-500">
                                        <div className="flex items-center space-x-4">
                                            <span className="flex items-center gap-1">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                {playlist.duration}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                </svg>
                                                {playlist.videos} videos
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </motion.a>
                        ))}
                    </div>
                </div>

                {/* CTA Section */}
                <div className="mt-16 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-2xl border border-blue-500/30 p-8 text-center backdrop-blur-sm">
                    <h2 className="text-2xl font-bold mb-3">Ready to Start Learning?</h2>
                    <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
                        Choose your level, pick a topic, and start your journey to becoming a professional trader
                    </p>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="px-8 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 rounded-xl font-bold transition-all duration-300 shadow-lg hover:shadow-blue-500/40"
                    >
                        Start Trading Now →
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TradingAcademy;
