import { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

// 3D Imports
import { Canvas, useFrame } from '@react-three/fiber';
import { Text, Float, Environment, PerspectiveCamera, Stars, OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';

// --- 3D COMPONENTS: FULL PAGE BACKGROUND VISUALIZATION ---

// Market Depth Visualization
const MarketDepthWall = () => {
  const groupRef = useRef();
  const [depthData, setDepthData] = useState([]);
  
  useEffect(() => {
    // Generate market depth data
    const data = [];
    for (let i = -15; i <= 15; i++) {
      data.push({
        x: i * 0.8,
        height: Math.max(0, Math.random() * 3 + Math.abs(i * 0.1)),
        color: i > 0 ? '#10b981' : '#ef4444',
        opacity: 0.6 - Math.abs(i * 0.02)
      });
    }
    setDepthData(data);
  }, []);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.05;
    }
  });

  return (
    <group ref={groupRef} position={[0, -5, -25]}>
      {depthData.map((bar, i) => (
        <mesh key={i} position={[bar.x, bar.height / 2, 0]}>
          <boxGeometry args={[0.6, bar.height, 0.6]} />
          <meshStandardMaterial 
            color={bar.color}
            transparent
            opacity={bar.opacity}
            emissive={bar.color}
            emissiveIntensity={0.2}
          />
        </mesh>
      ))}
    </group>
  );
};

// Floating Trading Signals
const TradingSignal = ({ position }) => {
  const meshRef = useRef();
  const isBuy = useMemo(() => Math.random() > 0.5, []);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.3;
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.5;
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <octahedronGeometry args={[0.4, 0]} />
      <meshStandardMaterial 
        color={isBuy ? '#10b981' : '#ef4444'}
        emissive={isBuy ? '#10b981' : '#ef4444'}
        emissiveIntensity={0.5}
        transparent
        opacity={0.8}
      />
    </mesh>
  );
};

// Connection Lines Network
const DataConnection = ({ start, end, speed = 1 }) => {
  const lineRef = useRef();
  const materialRef = useRef();
  
  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.opacity = 0.3 + Math.sin(state.clock.elapsedTime * speed) * 0.2;
    }
  });

  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(...start),
    new THREE.Vector3(
      (start[0] + end[0]) / 2 + (Math.random() - 0.5) * 2,
      (start[1] + end[1]) / 2 + 1,
      (start[2] + end[2]) / 2
    ),
    new THREE.Vector3(...end)
  ]);

  return (
    <mesh>
      <tubeGeometry args={[curve, 20, 0.03, 8, false]} />
      <meshStandardMaterial 
        ref={materialRef}
        color="#3b82f6" 
        transparent 
        opacity={0.3}
        emissive="#3b82f6"
        emissiveIntensity={0.1}
      />
    </mesh>
  );
};

// Enhanced Candle
const EnhancedCandle = ({ position, data, index }) => {
  const groupRef = useRef();
  
  useFrame((state) => {
    if (groupRef.current) {
      const time = state.clock.elapsedTime;
      groupRef.current.position.y = position[1] + Math.sin(time * 2 + index) * 0.05;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Wick */}
      <mesh position={[0, (data.high + data.low) / 2, 0]}>
        <cylinderGeometry args={[0.03, 0.03, data.high - data.low, 6]} />
        <meshStandardMaterial color="#64748b" />
      </mesh>
      {/* Body */}
      <mesh position={[0, (data.open + data.close) / 2, 0]}>
        <boxGeometry args={[0.6, Math.max(0.1, Math.abs(data.close - data.open)), 0.6]} />
        <meshStandardMaterial 
          color={data.close > data.open ? '#10b981' : '#ef4444'}
          emissive={data.close > data.open ? '#10b981' : '#ef4444'}
          emissiveIntensity={0.4}
          roughness={0.1}
          metalness={0.9}
        />
      </mesh>
    </group>
  );
};

// Main 3D Background Scene
const FullPage3DBackground = () => {
  const [signals, setSignals] = useState([]);
  const [connections, setConnections] = useState([]);
  const [candles, setCandles] = useState([]);

  useEffect(() => {
    // Generate trading signals
    const signalPoints = [];
    for (let i = 0; i < 40; i++) {
      signalPoints.push([
        (Math.random() - 0.5) * 50,
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 40 - 20
      ]);
    }
    setSignals(signalPoints);

    // Generate connections
    const conns = [];
    for (let i = 0; i < 15; i++) {
      const start = signalPoints[Math.floor(Math.random() * signalPoints.length)];
      const end = signalPoints[Math.floor(Math.random() * signalPoints.length)];
      conns.push({ start, end, speed: Math.random() * 2 + 0.5 });
    }
    setConnections(conns);

    // Generate candles
    const candleData = [];
    let lastClose = 0;
    for (let i = -8; i < 8; i++) {
      const open = lastClose;
      const close = open + (Math.random() - 0.5) * 2 + Math.sin(i * 0.5) * 0.5;
      const high = Math.max(open, close) + Math.random() * 1;
      const low = Math.min(open, close) - Math.random() * 1;
      
      candleData.push({
        position: [i * 1.8, 0, -8],
        data: { open, high, low, close }
      });
      lastClose = close;
    }
    setCandles(candleData);
  }, []);

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 5, 25]} fov={50} />
      <OrbitControls 
        enableZoom={false}
        enablePan={false}
        autoRotate
        autoRotateSpeed={0.3}
        maxPolarAngle={Math.PI / 2}
        minPolarAngle={Math.PI / 3}
        enableDamping
        dampingFactor={0.05}
      />
      
      {/* Lighting */}
      <ambientLight intensity={0.2} />
      <directionalLight 
        position={[10, 20, 15]} 
        intensity={0.8} 
        color="#1e40af"
        castShadow
      />
      <directionalLight 
        position={[-10, 10, -10]} 
        intensity={0.4} 
        color="#7c3aed"
      />
      <pointLight position={[0, 15, 0]} intensity={0.3} color="#ffffff" />
      
      {/* Stars */}
      <Stars 
        radius={200} 
        depth={80} 
        count={4000} 
        factor={6} 
        saturation={0} 
        fade 
        speed={0.3}
      />
      
      {/* Market Depth Wall */}
      <MarketDepthWall />
      
      {/* Main Trading Chart */}
      <group position={[0, 0, -8]}>
        {candles.map((candle, i) => (
          <EnhancedCandle key={i} index={i} {...candle} />
        ))}
        
        {/* Chart Grid Lines */}
        <mesh position={[0, -2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[30, 10, 30, 10]} />
          <meshBasicMaterial 
            color="#1e293b" 
            wireframe 
            transparent 
            opacity={0.1}
          />
        </mesh>
      </group>
      
      {/* Floating Signals */}
      <group>
        {signals.map((pos, i) => (
          <TradingSignal key={i} position={pos} />
        ))}
      </group>
      
      {/* Connection Network */}
      <group>
        {connections.map((conn, i) => (
          <DataConnection key={i} {...conn} />
        ))}
      </group>
      
      {/* Floating Numbers */}
      <Float speed={2} rotationIntensity={0.3} floatIntensity={0.5}>
        <Text
          position={[-20, 10, -15]}
          fontSize={1.2}
          color="#3b82f6"
          font="https://fonts.gstatic.com/s/roboto/v18/KFOmCnqEu92Fr1Mu4mxM.woff"
        >
          +2.45%
        </Text>
      </Float>
      
      <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.5}>
        <Text
          position={[18, 8, -10]}
          fontSize={0.8}
          color="#10b981"
          font="https://fonts.gstatic.com/s/roboto/v18/KFOmCnqEu92Fr1Mu4mxM.woff"
        >
          $1,024,580
        </Text>
      </Float>
      
      {/* Ground Grid */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -12, 0]}>
        <planeGeometry args={[200, 200, 40, 40]} />
        <meshBasicMaterial 
          color="#0f172a" 
          wireframe 
          transparent 
          opacity={0.05}
        />
      </mesh>
      
      <Environment preset="night" />
      <fog attach="fog" args={['#0f172a', 25, 120]} />
    </>
  );
};

// --- MAIN LANDING PAGE COMPONENT ---

const LandingPage = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    activeTraders: 1247,
    totalPayouts: 3285000,
    successRate: 92.5
  });

  // Animation Variants
  const fadeInUp = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2 }
    }
  };

  // Features Data
  const features = [
    { 
      icon: "⚡", 
      title: "Ultra-Low Latency", 
      description: "2ms execution speed with institutional-grade infrastructure",
      gradient: "from-blue-600/20 to-cyan-600/20"
    },
    { 
      icon: "💰", 
      title: "90% Profit Split", 
      description: "Keep the majority of your profits with transparent fee structure",
      gradient: "from-emerald-600/20 to-green-600/20"
    },
    { 
      icon: "🚀", 
      title: "Instant Scaling", 
      description: "Grow your account from $10K to $500K based on performance",
      gradient: "from-purple-600/20 to-pink-600/20"
    },
    { 
      icon: "🔄", 
      title: "24h Payouts", 
      description: "Withdraw your earnings anytime with instant processing",
      gradient: "from-orange-600/20 to-red-600/20"
    },
    { 
      icon: "📊", 
      title: "Advanced Analytics", 
      description: "Real-time performance metrics and risk management tools",
      gradient: "from-indigo-600/20 to-blue-600/20"
    },
    { 
      icon: "🛡️", 
      title: "Capital Protection", 
      description: "Risk management tools to protect your trading capital",
      gradient: "from-slate-700/20 to-slate-800/20"
    }
  ];

  const tradingPairs = [
    { symbol: "XAUUSD", price: "1,998.50", change: "+0.45%", volume: "1.2B", trend: "up" },
    { symbol: "EURUSD", price: "1.0850", change: "-0.12%", volume: "850M", trend: "down" },
    { symbol: "BTCUSD", price: "42,580", change: "+2.3%", volume: "24.5B", trend: "up" },
    { symbol: "NAS100", price: "15,842", change: "+0.8%", volume: "320M", trend: "up" },
    { symbol: "GBPJPY", price: "185.30", change: "+0.3%", volume: "450M", trend: "up" },
    { symbol: "OIL", price: "78.45", change: "-1.2%", volume: "1.5B", trend: "down" }
  ];

  const steps = [
    { number: "01", title: "Choose Your Plan", description: "Select from $10K to $500K starting capital" },
    { number: "02", title: "Pass Evaluation", description: "Meet profit targets with our flexible rules" },
    { number: "03", title: "Get Funded", description: "Receive live trading credentials instantly" },
    { number: "04", title: "Scale & Earn", description: "Grow your account and withdraw profits weekly" }
  ];

  return (
    <div className="relative min-h-screen text-white overflow-x-hidden font-sans selection:bg-blue-600 selection:text-white">
      
      {/* Full Page 3D Background */}
      <div className="fixed inset-0 z-0">
        <Canvas dpr={[1, 2]}>
          <Suspense fallback={null}>
            <FullPage3DBackground />
          </Suspense>
        </Canvas>
        
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0f172a]/95 via-[#0f172a]/80 to-[#0f172a]/95 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/5 via-transparent to-purple-900/5 pointer-events-none" />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 w-full border-b border-white/5 z-50 backdrop-blur-xl bg-[#0f172a]/90">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/')}>
             <div className="relative w-10 h-10 flex items-center justify-center">
                <div className="absolute inset-0 bg-blue-600 rounded-xl blur opacity-40 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center border border-white/10">
                  <span className="text-white font-bold text-lg tracking-tighter">PS</span>
                </div>
             </div>
             <span className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-300">PropSense</span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Pricing</a>
            <a href="#markets" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Markets</a>
            <button onClick={() => navigate('/login')} className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Client Portal</button>
            <button 
                onClick={() => navigate('/register')}
                className="relative px-6 py-2.5 group overflow-hidden rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold shadow-lg shadow-blue-500/30 transition-all hover:scale-105 hover:shadow-blue-500/50"
            >
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer" />
                Get Funded
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-40 pb-32 px-6 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          
          {/* Left: Text Content */}
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border border-blue-500/30 text-blue-400 text-xs font-bold uppercase tracking-widest mb-6">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              INSTITUTIONAL TRADING INFRASTRUCTURE
            </motion.div>
            
            <motion.h1 variants={fadeInUp} className="text-6xl lg:text-7xl font-bold leading-[1.1] mb-6 tracking-tight">
              Trade Like <br />
              <span className="relative inline-block">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-emerald-400 animate-gradient-x">
                  The Pros.
                </span>
                <div className="absolute -bottom-2 left-0 w-full h-1 bg-gradient-to-r from-blue-400 via-cyan-400 to-emerald-400 rounded-full opacity-60 animate-pulse"></div>
              </span>
            </motion.h1>
            
            <motion.p variants={fadeInUp} className="text-lg text-slate-400 mb-10 leading-relaxed max-w-lg">
              Access up to <span className="text-white font-bold">$500,000</span> in capital with our prop trading platform. 
              Ultra-low latency execution, 90% profit share, and weekly payouts.
            </motion.p>
            
            <motion.div variants={fadeInUp} className="flex flex-wrap gap-4">
              <button 
                onClick={() => navigate('/register')}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold rounded-xl hover:shadow-2xl hover:shadow-blue-500/30 transition-all flex items-center gap-2 group"
              >
                Start Free Trial
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>
              <button 
                onClick={() => navigate('/login')}
                className="px-8 py-4 bg-white/5 backdrop-blur-sm text-white font-bold rounded-xl border border-white/10 hover:border-white/30 transition-all hover:bg-white/10"
              >
                View Dashboard
              </button>
            </motion.div>

            {/* Stats */}
            <motion.div variants={fadeInUp} className="mt-16 grid grid-cols-3 gap-8 border-t border-white/10 pt-8">
                {[
                    { val: "<2ms", label: "Execution Speed", color: "blue-400" },
                    { val: "90%", label: "Profit Share", color: "emerald-400" },
                    { val: "24h", label: "Payouts", color: "purple-400" }
                ].map((stat, i) => (
                    <div key={i} className="group cursor-pointer">
                        <h3 className={`text-3xl font-bold text-white group-hover:text-${stat.color} transition-colors duration-300`}>{stat.val}</h3>
                        <p className="text-xs text-slate-400 uppercase tracking-wider mt-2">{stat.label}</p>
                    </div>
                ))}
            </motion.div>
          </motion.div>

          {/* Right: Live Markets Card */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="relative"
          >
            <div className="bg-gradient-to-br from-slate-900/90 to-slate-950/90 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
              {/* Card Header */}
              <div className="p-6 border-b border-white/10">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-white">Live Markets</h3>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-xs text-emerald-400 font-bold">LIVE</span>
                  </div>
                </div>
                <p className="text-sm text-slate-400 mt-1">Real-time market data streaming</p>
              </div>
              
              {/* Markets List */}
              <div className="p-6">
                <div className="space-y-4">
                  {tradingPairs.map((pair, i) => (
                    <div key={i} className="flex justify-between items-center p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors group cursor-pointer">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${pair.trend === 'up' ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
                          <span className={`text-lg ${pair.trend === 'up' ? 'text-emerald-400' : 'text-red-400'}`}>
                            {pair.trend === 'up' ? '↗' : '↘'}
                          </span>
                        </div>
                        <div>
                          <div className="font-bold text-white">{pair.symbol}</div>
                          <div className="text-xs text-slate-500">Volume: {pair.volume}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-white">{pair.price}</div>
                        <div className={`text-sm font-bold ${pair.trend === 'up' ? 'text-emerald-400' : 'text-red-400'}`}>
                          {pair.change}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Portfolio Summary */}
                <div className="mt-8 pt-8 border-t border-white/10">
                  <div className="flex justify-between items-center mb-4">
                    <div className="text-sm text-slate-400">Total Portfolio Value</div>
                    <div className="text-xs text-emerald-400">+2.45% today</div>
                  </div>
                  <div className="text-3xl font-bold text-white">$124,856.42</div>
                  <div className="flex gap-4 mt-6">
                    <div className="flex-1 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                      <div className="text-xs text-slate-400">Long Positions</div>
                      <div className="text-lg font-bold text-emerald-400">$86,450</div>
                    </div>
                    <div className="flex-1 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                      <div className="text-xs text-slate-400">Short Positions</div>
                      <div className="text-lg font-bold text-red-400">$38,406</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Decorative Elements */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-600/20 rounded-full blur-[60px] pointer-events-none animate-pulse"></div>
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-purple-600/20 rounded-full blur-[60px] pointer-events-none animate-pulse delay-1000"></div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-bold mb-4">Professional <span className="text-blue-500">Trading Tools</span></h2>
            <p className="text-slate-400 max-w-2xl mx-auto">Everything you need to trade like an institutional trader</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -8 }}
                className={`relative p-6 rounded-2xl bg-gradient-to-br ${feature.gradient} backdrop-blur-sm border border-white/10 group hover:border-white/20 transition-all`}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-shimmer pointer-events-none"></div>
                
                <div className="relative z-10">
                  <div className="w-14 h-14 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-32 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-4xl lg:text-5xl font-bold mb-4">Get Funded in <span className="text-blue-500">4 Steps</span></h2>
            <p className="text-slate-400 max-w-2xl mx-auto">Simple process to start trading with our capital</p>
          </motion.div>

          <div className="relative">
            {/* Connection Line */}
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-cyan-600/20 -translate-y-1/2 hidden lg:block"></div>
            
            <div className="grid lg:grid-cols-4 gap-8 relative z-10">
              {steps.map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.2 }}
                  className="text-center relative"
                >
                  <div className="relative inline-flex mb-6">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-full blur opacity-30 animate-pulse"></div>
                    <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-slate-900 to-slate-800 border border-white/10 flex items-center justify-center text-2xl font-bold text-white">
                      {step.number}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
                  <p className="text-slate-400 text-sm">{step.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-32 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-4xl lg:text-5xl font-bold mb-4">Choose Your <span className="text-blue-500">Capital Size</span></h2>
            <p className="text-slate-400 max-w-2xl mx-auto">Select your starting balance. All plans include 90% profit share.</p>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              { 
                name: 'STARTER', 
                price: '200', 
                capital: '10K', 
                monthlyTarget: '10%',
                maxDrawdown: '5%',
                dailyLoss: '3%',
                color: 'from-slate-800 to-slate-900',
                border: 'border-white/10'
              },
              { 
                name: 'PROFESSIONAL', 
                price: '500', 
                capital: '25K', 
                monthlyTarget: '8%',
                maxDrawdown: '6%',
                dailyLoss: '4%',
                color: 'from-blue-900/40 to-slate-900',
                border: 'border-blue-500/50',
                popular: true 
              },
              { 
                name: 'ELITE', 
                price: '1000', 
                capital: '50K', 
                monthlyTarget: '6%',
                maxDrawdown: '8%',
                dailyLoss: '5%',
                color: 'from-purple-900/40 to-slate-900',
                border: 'border-purple-500/50'
              }
            ].map((plan, i) => (
              <motion.div 
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -10 }}
                className={`relative p-8 rounded-3xl bg-gradient-to-b ${plan.color} border ${plan.border} backdrop-blur-xl group overflow-hidden`}
              >
                {plan.popular && (
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-blue-600 to-cyan-600 text-xs font-bold px-3 py-1 rounded-bl-xl text-white">
                    MOST POPULAR
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-shimmer pointer-events-none"></div>

                <h3 className="text-lg font-bold text-slate-300 mb-2 uppercase tracking-wider">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-5xl font-bold text-white">{plan.price}</span>
                  <span className="text-xl text-slate-500">DH</span>
                </div>
                
                <div className="w-full h-px bg-white/10 mb-6"></div>
                
                <div className="mb-8">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <p className="text-sm text-slate-400 mb-1">Starting Balance</p>
                      <p className="text-3xl font-bold text-white">{plan.capital}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-400 mb-1">Target</p>
                      <p className="text-xl font-bold text-emerald-400">{plan.monthlyTarget}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 rounded-lg bg-white/5">
                      <span className="text-sm text-slate-400">Max Drawdown</span>
                      <span className="text-sm font-bold text-white">{plan.maxDrawdown}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-lg bg-white/5">
                      <span className="text-sm text-slate-400">Daily Loss Limit</span>
                      <span className="text-sm font-bold text-white">{plan.dailyLoss}</span>
                    </div>
                  </div>
                </div>
                
                <button 
                  onClick={() => navigate('/checkout', { state: { plan } })}
                  className={`w-full py-4 rounded-xl font-bold transition-all ${plan.popular ? 
                    'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-lg shadow-blue-500/25' : 
                    'bg-white/10 hover:bg-white/20 text-white'}`}
                >
                  Select Plan
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-32 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { value: `${stats.activeTraders.toLocaleString()}+`, label: 'Active Traders', description: 'Growing community of professional traders' },
              { value: `$${(stats.totalPayouts / 1000000).toFixed(1)}M+`, label: 'Total Payouts', description: 'Paid to our traders this year' },
              { value: `${stats.successRate}%`, label: 'Success Rate', description: 'Of traders who pass our evaluation' }
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <h3 className="text-5xl font-bold text-white mb-2">{stat.value}</h3>
                <p className="text-lg font-semibold text-slate-300 mb-2">{stat.label}</p>
                <p className="text-sm text-slate-500">{stat.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 relative z-10">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl lg:text-5xl font-bold mb-6">Ready to Start <span className="text-blue-500">Trading</span>?</h2>
            <p className="text-lg text-slate-400 mb-10 max-w-2xl mx-auto">
              Join thousands of traders who have already started their journey with PropSense
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => navigate('/register')}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold rounded-xl hover:shadow-2xl hover:shadow-blue-500/30 transition-all"
              >
                Start Free Trial - No Credit Card Required
              </button>
              <button 
                onClick={() => navigate('/login')}
                className="px-8 py-4 bg-white/5 backdrop-blur-sm text-white font-bold rounded-xl border border-white/10 hover:border-white/30 transition-all"
              >
                Schedule a Demo
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-slate-950/50 backdrop-blur-xl pt-20 pb-10 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold">PS</span>
                </div>
                <span className="text-xl font-bold text-white">PropSense</span>
              </div>
              <p className="text-sm text-slate-400">
                Professional prop trading platform for serious traders.
              </p>
            </div>
            
            <div>
              <h4 className="text-white font-bold mb-6">Platform</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-sm text-slate-400 hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="text-sm text-slate-400 hover:text-white transition-colors">Markets</a></li>
                <li><a href="#" className="text-sm text-slate-400 hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="text-sm text-slate-400 hover:text-white transition-colors">API</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-bold mb-6">Legal</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-sm text-slate-400 hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="text-sm text-slate-400 hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="text-sm text-slate-400 hover:text-white transition-colors">Risk Disclosure</a></li>
                <li><a href="#" className="text-sm text-slate-400 hover:text-white transition-colors">Compliance</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-bold mb-6">Connect</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-sm text-slate-400 hover:text-white transition-colors">Twitter</a></li>
                <li><a href="#" className="text-sm text-slate-400 hover:text-white transition-colors">Discord</a></li>
                <li><a href="#" className="text-sm text-slate-400 hover:text-white transition-colors">Telegram</a></li>
                <li><a href="#" className="text-sm text-slate-400 hover:text-white transition-colors">Support</a></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-white/10 text-center">
            <p className="text-sm text-slate-500">© 2026 PropSense. All rights reserved.</p>
            <p className="text-xs text-slate-600 mt-2">Trading involves risk. Past performance is not indicative of future results.</p>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient-x {
          background-size: 200% auto;
          animation: gradient-x 3s ease infinite;
        }
      `}</style>
    </div>
  );
};

export default LandingPage;