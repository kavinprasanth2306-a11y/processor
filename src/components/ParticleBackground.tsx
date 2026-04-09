import { motion } from 'motion/react';

export default function ParticleBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ 
            x: Math.random() * 100 + '%', 
            y: Math.random() * 100 + '%',
            opacity: Math.random() * 0.5,
            scale: Math.random() * 0.5 + 0.5
          }}
          animate={{
            y: [null, '-20%', '120%'],
            x: [null, (Math.random() - 0.5) * 20 + '%'],
            rotate: [0, 360]
          }}
          transition={{
            duration: Math.random() * 20 + 20,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute w-64 h-64 rounded-full bg-blue-400/10 blur-3xl"
        />
      ))}
    </div>
  );
}
