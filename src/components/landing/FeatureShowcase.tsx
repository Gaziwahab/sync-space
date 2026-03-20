import { motion } from "framer-motion";
import { Users, Bug, Rocket } from "lucide-react";

const features = [
  {
    icon: Users,
    title: "Multi-Agent System",
    description:
      "A team of specialized AI agents — Planner, Builder, Debugger — collaborate like office workers to turn your prompt into a polished website.",
  },
  {
    icon: Bug,
    title: "Smart Debugging",
    description:
      "The Debug Agent automatically catches errors, explains them in plain English, and fixes them — no stack traces to decipher.",
  },
  {
    icon: Rocket,
    title: "One-Click Deploy",
    description:
      "When your site is ready, deploy it instantly. Get a live URL, share it with the world — zero configuration needed.",
  },
];

const FeatureShowcase = () => {
  return (
    <section id="features" className="py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.h2
          className="text-3xl sm:text-4xl font-bold text-center mb-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          Everything You Need to <span className="text-gradient">Ship Fast</span>
        </motion.h2>
        <motion.p
          className="text-muted-foreground text-center mb-16 max-w-xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
        >
          From idea to production in minutes, not months.
        </motion.p>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                className="group clay-panel p-8 transition-all duration-500 hover:scale-[1.02] border border-white/5 relative overflow-hidden interactive"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ 
                  delay: i * 0.2, 
                  type: "spring",
                  stiffness: 100,
                  damping: 20
                }}
              >
                {/* Decorative background glow */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 rounded-full blur-3xl group-hover:bg-primary/30 transition-colors duration-500" />
                
                <div className="relative z-10">
                  <motion.div 
                    whileHover={{ rotate: [0, -10, 10, 0] }}
                    transition={{ duration: 0.5 }}
                    className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-8 shadow-inner border border-primary/20 group-hover:bg-primary/20 transition-colors"
                  >
                    <Icon className="w-8 h-8 text-primary group-hover:scale-110 transition-transform" />
                  </motion.div>
                  <h3 className="text-2xl font-bold mb-4 tracking-tight">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed text-lg">{feature.description}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeatureShowcase;
