import { useState, useEffect, useRef, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// 3D & Animation Imports
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Float, Html } from '@react-three/drei';

// --- Performance Optimized 3D Component ---
const FuturisticMesh = ({ darkMode }) => {
  const meshRef = useRef();
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (meshRef.current) {
      meshRef.current.rotation.y = t * 0.2;
      meshRef.current.rotation.z = t * 0.1;
    }
  });

  return (
    <Float floatIntensity={2} speed={2}>
      <mesh ref={meshRef} castShadow>
        <torusKnotGeometry args={[1.2, 0.3, 128, 32]} />
        <meshStandardMaterial 
          color={darkMode ? '#38bdf8' : '#0ea5e9'} 
          metalness={0.8} 
          roughness={0.2} 
          transparent 
          opacity={0.9} 
        />
      </mesh>
    </Float>
  );
};

const LandingPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(true);
  const [particlesInit, setParticlesInit] = useState(false);

  // Initialize Particles Engine
  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => setParticlesInit(true));
  }, []);

  // Sync Dark Mode & Language
  useEffect(() => {
    const savedMode = localStorage.getItem('darkMode') || 'true';
    const isDark = savedMode === 'true';
    setDarkMode(isDark);
    document.documentElement.classList.toggle('dark', isDark);
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
  }, [i18n.language]);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', newMode);
    document.documentElement.classList.toggle('dark', newMode);
  };

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  const navigateToPlan = (plan) => {
    navigate('/checkout', { state: { plan } });
  };

  const startFreeTrial = async () => {
    try {
      const res = await axios.post('/api/demo/free-trial');
      const { access_token, user, challenge } = res.data;
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('challengeId', challenge.id);
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      navigate('/dashboard');
    } catch (err) {
      console.error('Free trial error:', err);
      alert('Free trial unavailable pour le moment.');
    }
  };

  return (
    <div className={`relative min-h-screen transition-all duration-500 overflow-x-hidden ${darkMode ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* Background Particles */}
      {particlesInit && (
        <Particles
          id="tsparticles"
          options={{
            fpsLimit: 60,
            particles: {
              color: { value: darkMode ? "#38bdf8" : "#0ea5e9" },
              links: { enable: true, color: darkMode ? "#38bdf8" : "#0ea5e9", distance: 150, opacity: 0.1 },
              move: { enable: true, speed: 0.8 },
              number: { value: 50 },
              opacity: { value: 0.2 },
              size: { value: { min: 1, max: 3 } },
            },
          }}
          className="fixed inset-0 z-0 pointer-events-none"
        />
      )}

      {/* Navigation */}
      <nav className={`fixed top-0 w-full border-b z-50 backdrop-blur-xl transition-colors ${darkMode ? 'bg-slate-950/80 border-slate-800' : 'bg-white/80 border-slate-200'}`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-400 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <span className="text-white font-black text-xl">PS</span>
            </div>
            <span className="text-2xl font-black tracking-tighter">PropSense</span>
          </div>

          <div className="hidden lg:flex items-center space-x-8">
            <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-xl">
              {['fr', 'en', 'ar'].map(l => (
                <button key={l} onClick={() => changeLanguage(l)} className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${i18n.language === l ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500'}`}>{l.toUpperCase()}</button>
              ))}
            </div>
            <button onClick={toggleDarkMode} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
              {darkMode ? '🌙' : '☀️'}
            </button>
            <button onClick={() => navigate('/login')} className="font-bold hover:text-blue-500 transition-colors">Sign In</button>
            <button onClick={() => navigate('/register')} className="px-6 py-2 bg-blue-600 text-white font-bold rounded-full hover:scale-105 transition-all shadow-xl shadow-blue-500/20">Get Started</button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-32 pb-20 px-6 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className={`inline-block px-4 py-2 rounded-full text-xs font-bold mb-6 ${darkMode ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-blue-50 text-blue-900'}`}>
              Institutional-Grade Prop Firm
            </div>
            <h1 className="text-6xl lg:text-7xl font-black mb-6 leading-none">
              Trade. Prove.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">Get Funded.</span>
            </h1>
            <p className="text-xl text-slate-400 mb-10 leading-relaxed max-w-lg">
              Clear rules, bank-level infrastructure, and fast funding decisions. Focus on execution while we handle risk, compliance, and payouts.
            </p>
            <div className="flex flex-wrap gap-4 mb-12">
              <button onClick={() => navigate('/register')} className="px-10 py-4 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-500 transition-all shadow-2xl shadow-blue-500/30">Start Trading</button>
              <button onClick={() => navigate('/login')} className="px-10 py-4 font-black rounded-2xl border-2 border-slate-700 hover:bg-slate-800 transition-all">Client Portal</button>
            </div>
            <div className="flex gap-12 pt-8 border-t border-slate-800">
               <div><p className="text-3xl font-black">1000+</p><p className="text-slate-500 text-sm">Traders</p></div>
               <div><p className="text-3xl font-black">$2M+</p><p className="text-slate-500 text-sm">Distributed</p></div>
               <div><p className="text-3xl font-black">24/7</p><p className="text-slate-500 text-sm">Support</p></div>
            </div>
          </div>

          {/* 3D Visualizer Container */}
          <div className="relative h-[500px] w-full bg-slate-900/40 backdrop-blur-3xl rounded-[40px] border border-white/5 shadow-inner overflow-hidden">
            <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
              <ambientLight intensity={0.5} />
              <pointLight position={[10, 10, 10]} />
              <Suspense fallback={null}>
                <FuturisticMesh darkMode={darkMode} />
                <OrbitControls enableZoom={false} />
              </Suspense>
              <Html center>
                <div className="absolute top-10 w-[200px] text-center p-3 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 text-blue-300 font-bold text-xs uppercase tracking-widest">
                  Live 3D Analytics
                </div>
              </Html>
            </Canvas>
            
            {/* HUD Overlay Stats */}
            <div className="absolute bottom-8 left-8 right-8 p-6 bg-slate-900/80 border border-white/5 rounded-3xl backdrop-blur-2xl">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Equity Balance</p>
                  <p className="text-3xl font-black">$125,847.32</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 text-green-400 font-bold">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                    +12.5%
                  </div>
                  <p className="text-[10px] text-slate-500">REAL-TIME DATA</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section - Preserved Content with 3D Card Style */}
      <section className="py-24 px-6 max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <p className="text-blue-500 font-bold uppercase tracking-widest text-xs mb-3">Funding Programs</p>
          <h2 className="text-4xl lg:text-5xl font-black mb-4">Clear rules. Straightforward funding.</h2>
          <p className="text-slate-400">Max daily loss 5% | Max total loss 10% | Profit target 10%</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {[
            { name: 'Starter', price: '200', capital: '10 000 DH virtual', split: '80%' },
            { name: 'Pro', price: '500', capital: '25 000 DH virtual', split: '85%' },
            { name: 'Elite', price: '1000', capital: '50 000 DH virtual', split: '90%' }
          ].map((plan) => (
            <div key={plan.name} className="p-10 rounded-[40px] bg-slate-900/50 border border-slate-800 hover:border-blue-500 transition-all group relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-600/10 blur-3xl group-hover:bg-blue-600/20 transition-all"></div>
              <p className="text-sm font-bold text-blue-500 mb-2 uppercase">{plan.name}</p>
              <h3 className="text-5xl font-black mb-1">{plan.price} <span className="text-lg text-slate-500">DH</span></h3>
              <p className="text-xs text-slate-500 mb-8">One-time evaluation fee</p>
              
              <ul className="space-y-4 mb-10">
                {[`${plan.capital}`, `${plan.split} profit split`, "-5% max daily loss", "+10% profit target"].map(feat => (
                  <li key={feat} className="flex items-center gap-3 text-sm text-slate-300">
                    <span className="w-5 h-5 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 font-bold text-[10px]">✓</span>
                    {feat}
                  </li>
                ))}
              </ul>

              <div className="space-y-3">
                <button onClick={() => navigateToPlan(plan)} className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/20">Pay with CMI</button>
                <button onClick={() => navigateToPlan(plan)} className="w-full py-4 bg-slate-800 text-white font-bold rounded-2xl hover:bg-slate-700 transition-all">Pay with Crypto</button>
              </div>
            </div>
          ))}
        </div>

        {/* Demo Hook: Free Trial */}
        <div className="mt-12 p-10 rounded-[40px] bg-gradient-to-r from-blue-600/10 to-transparent border border-blue-500/20 flex flex-col lg:flex-row justify-between items-center gap-8">
          <div>
            <h4 className="text-2xl font-black mb-2">Test the platform for free</h4>
            <p className="text-slate-400">Experience our 5,000 DH demo account with all rules applied automatically.</p>
          </div>
          <button onClick={startFreeTrial} className="px-10 py-4 bg-green-600 text-white font-black rounded-2xl hover:bg-green-500 transition-all shadow-xl shadow-green-500/20">Launch Free Trial</button>
        </div>
      </section>

      {/* Simplified Features/Security - Keeping Content but Modernizing */}
      <section className="py-24 bg-slate-900/30">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 lg:grid-cols-3 gap-12">
          {[
            { title: 'Real-Time Data', desc: 'Live crypto and stock market data with sub-millisecond latency.', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
            { title: 'Advanced Analytics', desc: 'Professional charting powered by TradingView integration.', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2z' },
            { title: 'Risk Guard', desc: 'Automated rules monitoring to protect your trading capital.', icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6' }
          ].map(f => (
            <div key={f.title} className="group">
              <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center mb-6 border border-slate-700 group-hover:border-blue-500 transition-colors">
                <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={f.icon} /></svg>
              </div>
              <h5 className="text-xl font-bold mb-3">{f.title}</h5>
              <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t border-slate-900 px-6">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row justify-between items-center gap-8">
          <div className="flex items-center space-x-3">
             <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center"><span className="text-white font-bold text-xs">PS</span></div>
             <span className="font-black text-xl">PropSense</span>
          </div>
          <p className="text-slate-600 text-sm">© 2026 PropSense. Professional proprietary trading infrastructure.</p>
          <div className="flex gap-6 text-sm font-bold text-slate-400">
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;