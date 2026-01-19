import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        // Configure axios default header
        axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
      } catch (error) {
        console.error('Error parsing stored auth data:', error);
        // Clear corrupted data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const response = await axios.post('/api/login', {
        username,
        password
      });

      const { access_token, user: userData } = response.data;
      
      // Store in state
      setToken(access_token);
      setUser(userData);
      
      // Store in localStorage
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Configure axios default header
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Login failed'
      };
    }
  };

  const register = async (username, email, password, role = 'trader') => {
    try {
      const response = await axios.post('/api/register', {
        username,
        email,
        password,
        role
      });

      const { access_token, user: userData } = response.data;
      
      // Store in state
      setToken(access_token);
      setUser(userData);
      
      // Store in localStorage
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Configure axios default header
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      
      return { success: true };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Registration failed'
      };
    }
  };

  const logout = () => {
    // Clear state
    setToken(null);
    setUser(null);
    
    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Remove axios header
    delete axios.defaults.headers.common['Authorization'];
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

const FloatingTicker = () => {
  const count = 15;
  const texts = useMemo(() => {
    return new Array(count).fill(0).map((_, i) => ({
      position: [(Math.random() - 0.5) * 15, (Math.random() - 0.5) * 10, (Math.random() - 0.5) * 5 - 2],
      value: (Math.random() * 1000 + 1000).toFixed(2),
      speed: Math.random() * 0.02 + 0.01,
      color: Math.random() > 0.5 ? '#10b981' : '#ef4444'
    }));
  }, []);
  const groupRef = useRef();
  useFrame(() => { if (groupRef.current) groupRef.current.rotation.y += 0.002; });

  return (
    <group ref={groupRef}>
      {texts.map((item, i) => (
        <Float key={i} speed={2} rotationIntensity={0.5} floatIntensity={1}>
          <Text position={item.position} fontSize={0.4} color={item.color} font="https://fonts.gstatic.com/s/roboto/v18/KFOmCnqEu92Fr1Mu4mxM.woff" fillOpacity={0.6}>
            {item.value}
          </Text>
        </Float>
      ))}
    </group>
  );
};

const TradingScene = () => {
  const candles = useMemo(() => {
    const items = [];
    let lastClose = 0;
    for (let i = -6; i < 6; i++) {
      const isGreen = Math.random() > 0.4;
      const height = Math.random() * 2 + 0.5;
      const yPos = lastClose + (isGreen ? height/2 : -height/2) * 0.5;
      items.push({ position: [i * 1.2, yPos, 0], color: isGreen ? '#10b981' : '#ef4444', height: height });
      lastClose = yPos + (isGreen ? height/2 : -height/2);
    }
    return items;
  }, []);

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 12]} fov={45} />
      <ambientLight intensity={0.5} />
      <spotLight position={[10, 10, 10]} angle={0.3} penumbra={1} intensity={2} color="#3b82f6" />
      <pointLight position={[-10, -10, -10]} intensity={1} color="#f472b6" />
      <group rotation={[0, -0.2, 0]}> 
        {candles.map((candle, i) => (<Candle key={i} {...candle} />))}
      </group>
      <FloatingTicker />
      <Sparkles count={50} scale={12} size={4} speed={0.4} opacity={0.5} color="#ffffff" />
      <Environment preset="city" />
    </>
  );
};

// --- BACKGROUND COMPONENTS (NOUVEAU) ---

const ImmersiveBackground = () => (
  <div className="fixed inset-0 z-0 w-full h-full bg-[#020617] overflow-hidden">
    {/* 1. La Grille Cybernétique */}
    <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20"></div>
    
    {/* 2. Les Orbes de lumière mouvantes (CSS Animations) */}
    <div className="absolute top-[-10%] left-[-10%] w-[40rem] h-[40rem] bg-blue-600/20 rounded-full blur-[120px] animate-pulse-slow"></div>
    <div className="absolute bottom-[-10%] right-[-10%] w-[40rem] h-[40rem] bg-cyan-600/10 rounded-full blur-[120px] animate-pulse-slow delay-1000"></div>
    <div className="absolute top-[40%] left-[50%] transform -translate-x-1/2 w-[60rem] h-[60rem] bg-indigo-900/20 rounded-full blur-[150px] opacity-50"></div>

    {/* 3. Noise Texture (Grain fin pour effet premium) */}
    <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>
  </div>
);


// --- MAIN LANDING PAGE COMPONENT ---

const LandingPage = () => {
  const { t } = useTranslation(); // Removed i18n if unused to clear warnings
  const navigate = useNavigate();

  // Animation Variants
  const fadeInUp = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const navigateToPlan = (plan) => {
    navigate('/checkout', { state: { plan } });
  };

  return (
    <div className="relative min-h-screen text-white font-sans selection:bg-blue-500 selection:text-white">
      
      {/* --- LE FOND IMMERSIF GLOBAL --- */}
      <ImmersiveBackground />

      {/* Navigation */}
      <nav className="fixed top-0 w-full border-b border-white/5 z-50 backdrop-blur-md bg-[#020617]/50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/')}>
             <div className="relative w-10 h-10 flex items-center justify-center">
                <div className="absolute inset-0 bg-blue-600 rounded-xl blur opacity-40 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center border border-white/10">
                  <span className="text-white font-bold text-lg tracking-tighter">PS</span>
                </div>
             </div>
             <span className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">PropSense</span>
          </div>

          <div className="hidden md:flex items-center gap-6">
            <button onClick={() => navigate('/login')} className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Client Portal</button>
            <button 
                onClick={() => navigate('/register')}
                className="relative px-6 py-2.5 group overflow-hidden rounded-lg bg-blue-600 text-white font-semibold shadow-lg shadow-blue-500/20 transition-all hover:scale-105 hover:shadow-blue-500/40"
            >
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer" />
                Get Funded
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-40 pb-20 px-6 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          
          {/* Left: Text Content */}
          <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
            <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest mb-6 backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              Institutional Infrastructure
            </motion.div>
            
            <motion.h1 variants={fadeInUp} className="text-6xl lg:text-7xl font-bold leading-[1.1] mb-6 tracking-tight">
              Master the <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-emerald-400 animate-gradient-x">
                Markets.
              </span>
            </motion.h1>
            
            <motion.p variants={fadeInUp} className="text-lg text-slate-400 mb-10 leading-relaxed max-w-lg border-l-2 border-slate-800 pl-6">
              Access up to <span className="text-white font-bold">$500,000</span> in capital. No hidden rules. High-frequency execution. Weekly payouts.
            </motion.p>
            
            <motion.div variants={fadeInUp} className="flex flex-wrap gap-4">
              <button 
                onClick={() => navigate('/register')}
                className="px-8 py-4 bg-white text-slate-950 font-bold rounded-xl hover:bg-slate-200 transition-all shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)] flex items-center gap-2"
              >
                Start Challenge
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
              </button>
              <button 
                 onClick={() => navigate('/login')}
                 className="px-8 py-4 bg-slate-800/50 backdrop-blur-sm text-white font-bold rounded-xl border border-slate-700 hover:border-slate-500 transition-all"
              >
                Free Trial
              </button>
            </motion.div>

            {/* Stats */}
            <motion.div variants={fadeInUp} className="mt-16 grid grid-cols-3 gap-8 border-t border-slate-800/50 pt-8 backdrop-blur-sm bg-slate-900/20 rounded-xl p-4">
                <div>
                    <h3 className="text-3xl font-bold text-white">2ms</h3>
                    <p className="text-xs text-slate-500 uppercase tracking-wider">Avg Latency</p>
                </div>
                <div>
                    <h3 className="text-3xl font-bold text-white">90%</h3>
                    <p className="text-xs text-slate-500 uppercase tracking-wider">Profit Split</p>
                </div>
                <div>
                    <h3 className="text-3xl font-bold text-white">24h</h3>
                    <p className="text-xs text-slate-500 uppercase tracking-wider">Payout Time</p>
                </div>
            </motion.div>
          </motion.div>

          {/* Right: 3D Visualization */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="relative h-[600px] w-full"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent rounded-[3rem] border border-blue-500/20 backdrop-blur-md shadow-2xl shadow-blue-900/20 overflow-hidden">
                <Canvas dpr={[1, 2]}>
                    <Suspense fallback={null}>
                        <TradingScene />
                    </Suspense>
                </Canvas>
                
                {/* HUD Overlay */}
                <div className="absolute top-6 left-6 right-6 flex justify-between items-start pointer-events-none">
                    <div className="bg-slate-900/80 backdrop-blur-md p-4 rounded-2xl border border-white/10 shadow-lg">
                        <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Current Pair</p>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                            <span className="text-xl font-bold font-mono">XAU/USD</span>
                        </div>
                    </div>
                    <div className="bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 text-xs font-mono text-blue-400">
                        LIVE MARKET DATA
                    </div>
                </div>

                <div className="absolute bottom-6 left-6 right-6 pointer-events-none">
                    <div className="bg-gradient-to-r from-slate-900/90 to-slate-900/50 backdrop-blur-xl border border-white/10 p-6 rounded-2xl flex justify-between items-end">
                         <div>
                            <p className="text-xs text-slate-500 mb-1">Your Virtual Equity</p>
                            <p className="text-4xl font-mono font-bold text-white tracking-tighter">$102,450.00</p>
                         </div>
                         <div className="text-right">
                            <p className="text-emerald-400 font-bold text-lg flex items-center justify-end gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                                +2.45%
                            </p>
                            <p className="text-[10px] text-slate-500 uppercase">Today's PnL</p>
                         </div>
                    </div>
                </div>
            </div>
            
            {/* Decorative Glows around Canvas */}
            <div className="absolute -top-10 -right-10 w-64 h-64 bg-blue-600/20 rounded-full blur-[100px] pointer-events-none animate-pulse"></div>
            <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-cyan-600/20 rounded-full blur-[100px] pointer-events-none animate-pulse delay-700"></div>
          </motion.div>
        </div>
      </section>

      {/* Pricing / Cards Section */}
      <section className="py-32 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center mb-20"
            >
                <h2 className="text-4xl lg:text-5xl font-bold mb-4">Choose Your <span className="text-blue-500">Weapon</span>.</h2>
                <p className="text-slate-400 max-w-2xl mx-auto">Select a capital level. Pass the evaluation. Keep up to 90% of the profits.</p>
            </motion.div>

            <div className="grid lg:grid-cols-3 gap-8">
                {[
                    { name: 'Starter', price: '200', capital: '10K', color: 'from-slate-800/80 to-slate-900/80', border: 'border-slate-700' },
                    { name: 'Professional', price: '500', capital: '25K', color: 'from-blue-900/40 to-slate-900/80', border: 'border-blue-500/50', popular: true },
                    { name: 'Elite', price: '1000', capital: '50K', color: 'from-purple-900/40 to-slate-900/80', border: 'border-purple-500/50' }
                ].map((plan, i) => (
                    <motion.div 
                        key={plan.name}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.1 }}
                        whileHover={{ y: -10 }}
                        className={`relative p-8 rounded-3xl bg-gradient-to-b ${plan.color} border ${plan.border} backdrop-blur-md group overflow-hidden shadow-2xl`}
                    >
                        {plan.popular && (
                            <div className="absolute top-0 right-0 bg-blue-600 text-xs font-bold px-3 py-1 rounded-bl-xl text-white">MOST POPULAR</div>
                        )}
                        
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-shimmer pointer-events-none"></div>

                        <h3 className="text-lg font-bold text-slate-300 mb-2 uppercase tracking-wider">{plan.name}</h3>
                        <div className="flex items-baseline gap-1 mb-6">
                            <span className="text-5xl font-bold text-white">{plan.price}</span>
                            <span className="text-xl text-slate-500">DH</span>
                        </div>

                        <div className="w-full h-px bg-slate-700/50 mb-6"></div>

                        <div className="mb-8">
                            <p className="text-sm text-slate-400 mb-1">Initial Capital</p>
                            <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">{plan.capital} USD</p>
                        </div>

                        <ul className="space-y-4 mb-8">
                            {['Profit Split up to 90%', 'News Trading Allowed', 'Weekend Holding', 'No Time Limit'].map((feat, idx) => (
                                <li key={idx} className="flex items-center gap-3 text-sm text-slate-300">
                                    <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                                        <svg className="w-3 h-3 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                    </div>
                                    {feat}
                                </li>
                            ))}
                        </ul>

                        <button 
                            onClick={() => navigateToPlan(plan)}
                            className={`w-full py-4 rounded-xl font-bold transition-all ${plan.popular ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/25' : 'bg-slate-700 hover:bg-slate-600 text-white'}`}
                        >
                            Select Plan
                        </button>
                    </motion.div>
                ))}
            </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800 bg-[#020617]/80 backdrop-blur-md pt-20 pb-10">
         <div className="max-w-7xl mx-auto px-6 text-center">
            <h2 className="text-[10vw] font-black text-slate-800 leading-none select-none opacity-50">PROPSENSE</h2>
            <div className="flex justify-center gap-8 mt-8 text-slate-500 text-sm">
                <a href="#" className="hover:text-blue-500 transition-colors">Privacy Policy</a>
                <a href="#" className="hover:text-blue-500 transition-colors">Terms of Service</a>
                <a href="#" className="hover:text-blue-500 transition-colors">Risk Disclosure</a>
            </div>
            <p className="mt-8 text-slate-600 text-xs">
                © 2026 PropSense. All trading involves risk. Only risk capital you're prepared to lose.
            </p>
         </div>
      </footer>

      <style>{`
        @keyframes shimmer { 100% { transform: translateX(100%); } }
        .animate-shimmer { animation: shimmer 2s infinite; }
        @keyframes pulse-slow { 0%, 100% { opacity: 0.2; transform: scale(1); } 50% { opacity: 0.3; transform: scale(1.1); } }
        .animate-pulse-slow { animation: pulse-slow 8s infinite ease-in-out; }
      `}</style>
    </div>
  );
};

export default LandingPage;