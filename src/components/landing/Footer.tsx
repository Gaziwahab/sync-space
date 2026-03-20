import { Github, Twitter } from "lucide-react";
import { motion } from "framer-motion";

const Footer = () => {
  return (
    <footer className="relative mt-24 py-16 px-4 overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 bg-secondary/50" />
      <div className="absolute -bottom-48 -left-48 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-8 clay-panel p-8 md:p-12">
        <div className="flex items-center gap-3 group interactive">
          <motion.div 
            whileHover={{ rotate: 180 }}
            transition={{ type: "spring", stiffness: 200, damping: 10 }}
            className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center shadow-lg"
          >
            <span className="text-primary-foreground font-black text-lg">S</span>
          </motion.div>
          <span className="font-bold text-xl tracking-tight">SyncSpace</span>
        </div>

        <div className="flex flex-wrap justify-center items-center gap-6 md:gap-10 text-sm font-medium text-muted-foreground">
          <a href="#" className="hover:text-primary transition-colors interactive">About</a>
          <a href="#" className="hover:text-primary transition-colors interactive">Docs</a>
          <a href="#" className="hover:text-primary transition-colors interactive">Blog</a>
          <a href="#" className="hover:text-primary transition-colors interactive">Pricing</a>
        </div>

        <div className="flex items-center gap-5">
          <motion.a 
            whileHover={{ y: -5, scale: 1.1 }}
            href="#" 
            className="w-10 h-10 rounded-full bg-background flex items-center justify-center text-muted-foreground hover:text-primary hover:shadow-lg transition-all interactive"
          >
            <Github className="w-5 h-5" />
          </motion.a>
          <motion.a 
            whileHover={{ y: -5, scale: 1.1 }}
            href="#" 
            className="w-10 h-10 rounded-full bg-background flex items-center justify-center text-muted-foreground hover:text-primary hover:shadow-lg transition-all interactive"
          >
            <Twitter className="w-5 h-5" />
          </motion.a>
        </div>
      </div>
      
      <div className="relative max-w-6xl mx-auto mt-8 text-center text-sm font-medium text-muted-foreground/60">
        © 2026 SyncSpace. All rights reserved. Built with ❤️ and AI.
      </div>
    </footer>
  );
};

export default Footer;
