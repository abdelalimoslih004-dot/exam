import { useState, useEffect, Suspense, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';

// 3D & Animation
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, MeshDistortMaterial, Float } from '@react-three/drei';
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";

// --- Subtle 3D Background Element ---
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
          color="#1e40af"
          attach="material"
          distort={0.4}
          speed={2}
          roughness={0}
          metalness={1}
          wireframe
          opacity={0.15}
          transparent
        />
      </Sphere>
    </Float>
  );
};

const Login = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [particlesInit, setParticlesInit] = useState(false);

  // Initialize Particles
  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => setParticlesInit(true));

    // Force Dark Mode for this page
    document.documentElement.classList.add('dark');
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await login(formData.username, formData.password);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-950 flex items-center justify-center p-4 overflow-hidden">

      {/* 1. 3D Background Layer */}
      <div className="absolute inset-0 z-0">
        <Canvas camera={{ position: [0, 0, 5] }}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={1} />
          <Suspense fallback={null}>
            <FloatingDataSphere />
          </Suspense>
        </Canvas>
      </div>

      {/* 2. Particles Layer */}
      {particlesInit && (
        <Particles
          id="login-particles"
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

      {/* 3. Login Card (Glassmorphism) */}
      <div className="relative z-10 w-full max-w-md">

        {/* Logo Section */}
        <div className="text-center mb-10">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/40 transform hover:rotate-12 transition-transform">
              <span className="text-white font-black text-3xl">PS</span>
            </div>
            <div>
              <h1 className="text-4xl font-black text-white tracking-tighter">PropSense</h1>
              <p className="text-blue-400 font-bold text-xs uppercase tracking-[0.3em] mt-1">Terminal Login</p>
            </div>
          </div>
        </div>

        {/* The Card */}
        <div className="bg-slate-900/60 backdrop-blur-2xl rounded-[32px] shadow-2xl border border-white/10 p-10">
          <h2 className="text-xl font-bold text-white mb-8 text-center uppercase tracking-widest">Authentication</h2>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-xl animate-shake">
              <p className="text-red-400 text-sm font-medium text-center">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="group">
              <label className="block text-xs font-black text-slate-500 uppercase mb-2 ml-1">Identity</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  className="w-full pl-12 pr-5 py-4 bg-slate-800/50 border border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-slate-500 transition-all outline-none hover:bg-slate-800/70"
                  placeholder="Username or Email"
                />
              </div>
            </div>

            <div className="group">
              <label className="block text-xs font-black text-slate-500 uppercase mb-2 ml-1">Access Key</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full pl-12 pr-5 py-4 bg-slate-800/50 border border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-slate-500 transition-all outline-none hover:bg-slate-800/70"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`relative w-full py-4 rounded-2xl font-black text-white uppercase tracking-widest transition-all duration-300 overflow-hidden group ${loading
                  ? 'bg-slate-700 cursor-wait'
                  : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 shadow-xl shadow-blue-600/20 hover:shadow-blue-500/40 active:scale-95'
                }`}
            >
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer" />
              <span className="relative z-10">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Verifying...
                  </span>
                ) : 'Establish Connection'}
              </span>
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-800"></div></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="px-3 bg-transparent text-slate-600 font-bold">New Recruit?</span></div>
          </div>

          <div className="text-center space-y-4">
            <Link
              to="/register"
              className="block w-full py-3 text-blue-400 hover:text-white font-bold transition-colors"
            >
              Initialize New Account
            </Link>
            <Link
              to="/"
              className="inline-block text-slate-500 hover:text-slate-300 text-xs font-bold uppercase tracking-tighter transition-colors"
            >
              &larr; Abort to Home
            </Link>
          </div>
        </div>

        {/* Demo Info - Styled as a futuristic toast */}
        <div className="mt-8 p-4 bg-blue-500/5 border border-blue-500/20 rounded-2xl backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
            <p className="text-[10px] text-blue-300 font-bold uppercase tracking-wider">
              Simulation Credentials: <span className="text-white ml-2">admin / admin123</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;