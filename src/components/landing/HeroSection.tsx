import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Sparkles, Code2, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useRef } from "react";

const HeroSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0]);

  return (
    <section ref={containerRef} className="relative min-h-screen flex items-center justify-center overflow-hidden pt-24 pb-12 px-4 selection:bg-primary/30">
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-background" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(249,115,22,0.05)_0%,transparent_50%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
      
      {/* Animated Glow Orbs */}
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
          x: [0, 50, 0]
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-primary/20 mix-blend-screen blur-[120px] pointer-events-none" 
      />
      <motion.div 
        animate={{ 
          scale: [1, 1.3, 1],
          opacity: [0.2, 0.4, 0.2],
          y: [0, -50, 0]
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] rounded-full bg-accent/20 mix-blend-screen blur-[120px] pointer-events-none" 
      />

      {/* Floating 3D Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div 
          animate={{ y: [-20, 20, -20], rotate: [0, 10, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[20%] left-[10%] clay-panel w-24 h-24 rounded-3xl flex items-center justify-center opacity-80"
        >
          <Code2 className="w-10 h-10 text-primary" />
        </motion.div>
        <motion.div 
          animate={{ y: [20, -20, 20], rotate: [0, -10, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute top-[30%] right-[12%] clay-panel w-32 h-32 rounded-full flex items-center justify-center opacity-70"
        >
          <Bot className="w-12 h-12 text-accent" />
        </motion.div>
      </div>

      <motion.div style={{ y, opacity }} className="relative z-10 max-w-6xl mx-auto text-center mt-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="flex justify-center mb-8"
        >
          <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full clay-panel text-sm font-medium text-foreground/80 border border-white/10 shadow-xl">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-accent"></span>
            </span>
            Meet your new AI Development Team
          </div>
        </motion.div>

        <motion.h1
          className="text-6xl sm:text-7xl lg:text-8xl font-black tracking-tighter leading-[1.05] mb-8 drop-shadow-sm"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        >
          Code the Future <br />
          <span className="relative inline-block mt-2">
            <span className="text-gradient">Without Coding</span>
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ duration: 1, delay: 0.8, ease: "circOut" }}
              className="absolute -bottom-2 left-0 h-3 bg-accent/30 rounded-full blur-sm"
            />
          </span>
        </motion.h1>

        <motion.p
          className="text-xl sm:text-2xl text-muted-foreground max-w-3xl mx-auto mb-12 font-light leading-relaxed"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          Stop writing boilerplate. Command a specialized team of AI agents—Boss, Planner, Designer, and Devs—to build, test, and deploy entire web apps from a single prompt.
        </motion.p>

        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-6"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <Button asChild size="lg" className="clay-btn text-lg px-10 py-7 shadow-2xl hover:scale-105 interactive group">
            <Link to="/signup">
              Hire Your AI Team 
              <motion.span
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              >
                <ArrowRight className="ml-2 w-5 h-5 group-hover:text-white" />
              </motion.span>
            </Link>
          </Button>
          
          <Button asChild variant="outline" size="lg" className="clay-panel bg-transparent text-lg px-10 py-7 border-2 border-primary/20 hover:border-primary/50 text-foreground interactive group">
            <a href="#features">
              <Sparkles className="mr-2 w-5 h-5 text-accent group-hover:animate-pulse" /> 
              See How It Works
            </a>
          </Button>
        </motion.div>
      </motion.div>
      
      {/* Decorative Bottom Gradient Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent z-20 pointer-events-none" />
    </section>
  );
};

export default HeroSection;
