import { useState, useEffect, Suspense, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';

// 3D & Animation
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, MeshDistortMaterial, Float } from '@react-three/drei';
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";

// --- Thematic 3D Element (Matching Login for Brand Consistency) ---
const FloatingDataSphere = () => {
  const sphereRef = useRef();
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (sphereRef.current) {
      sphereRef.current.rotation.x = t * 0.1;
      sphereRef.current.rotation.y = t * 0.15;
    }
  });

  return (
    <Float speed={3} rotationIntensity={1} floatIntensity={2}>
      <Sphere ref={sphereRef} args={[1, 100, 200]} scale={2.4}>
        <MeshDistortMaterial
          color="#3b82f6"
          attach="material"
          distort={0.4}
          speed={2}
          roughness={0}
          metalness={1}
          wireframe
          opacity={0.1}
          transparent
        />
      </Sphere>
    </Float>
  );
};

const Register = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { register } = useAuth();
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [particlesInit, setParticlesInit] = useState(false);

  // Initialize Particles and Layout
  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => setParticlesInit(true));
    
    document.documentElement.classList.add('dark');
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
  }, [i18n.language]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError(i18n.language === 'fr' ? 'Les mots de passe ne correspondent pas' : 'Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError(i18n.language === 'fr' ? 'Le mot de passe doit contenir au moins 6 caractères' : 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    const result = await register(formData.username, formData.email, formData.password, 'trader');

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-950 flex items-center justify-center p-4 overflow-hidden">
      
      {/* 3D Background */}
      <div className="absolute inset-0 z-0">
        <Canvas camera={{ position: [0, 0, 5] }}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={1} />
          <Suspense fallback={null}>
            <FloatingDataSphere />
          </Suspense>
        </Canvas>
      </div>

      {/* Particles Layer */}
      {particlesInit && (
        <Particles
          id="register-particles"
          options={{
            fpsLimit: 60,
            particles: {
              color: { value: "#3b82f6" },
              links: { enable: true, color: "#3b82f6", distance: 150, opacity: 0.1 },
              move: { enable: true, speed: 0.5 },
              number: { value: 30 },
              opacity: { value: 0.2 },
            }
          }}
          className="absolute inset-0 z-0 pointer-events-none"
        />
      )}

      <div className="relative z-10 w-full max-w-lg">
        {/* Logo Section */}
        <div className="text-center mb-8">
          <div className="flex flex-col items-center space-y-3">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/40">
              <span className="text-white font-black text-2xl">PS</span>
            </div>
            <h1 className="text-3xl font-black text-white tracking-tighter">PropSense</h1>
            <p className="text-blue-400 font-bold text-xs uppercase tracking-[0.2em]">Recruitment Phase</p>
          </div>
        </div>

        {/* Glassmorphic Form */}
        <div className="bg-slate-900/60 backdrop-blur-2xl rounded-[32px] shadow-2xl border border-white/10 p-8 lg:p-10">
          <h2 className="text-xl font-bold text-white mb-6 text-center uppercase tracking-widest">Enlist as Trader</h2>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-xl animate-shake">
              <p className="text-red-400 text-sm font-medium text-center">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <label className="block text-xs font-black text-slate-500 uppercase mb-2 ml-1">Codename (Username)</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                className="w-full px-5 py-3.5 bg-slate-800/50 border border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-white transition-all"
                placeholder="Choose username"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-black text-slate-500 uppercase mb-2 ml-1">Communication Channel (Email)</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-5 py-3.5 bg-slate-800/50 border border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-white transition-all"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-500 uppercase mb-2 ml-1">Secure Key</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
                className="w-full px-5 py-3.5 bg-slate-800/50 border border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-white transition-all"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-500 uppercase mb-2 ml-1">Verify Key</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="w-full px-5 py-3.5 bg-slate-800/50 border border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-white transition-all"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`md:col-span-2 py-4 rounded-2xl font-black text-white uppercase tracking-widest transition-all duration-300 mt-2 ${
                loading
                  ? 'bg-slate-700 cursor-wait'
                  : 'bg-blue-600 hover:bg-blue-500 shadow-xl shadow-blue-600/20 active:scale-95'
              }`}
            >
              {loading ? 'Initializing Profile...' : 'Authorize Registration'}
            </button>
          </form>

          <div className="text-center mt-8 pt-6 border-t border-slate-800">
            <p className="text-slate-500 text-sm">
              Already a member?{' '}
              <Link to="/login" className="text-blue-400 hover:text-white font-bold transition-colors">
                Return to Terminal
              </Link>
            </p>
          </div>
        </div>

        {/* Home Link */}
        <div className="text-center mt-6">
          <Link to="/" className="text-slate-600 hover:text-slate-400 text-xs font-bold uppercase tracking-tighter transition-colors">
            &larr; Back to Briefing
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;