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

        <div className="grid md:grid-cols-3 gap-6">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                className="group glass rounded-2xl p-8 hover:glow-primary transition-all duration-300"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
              >
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                  <Icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeatureShowcase;
