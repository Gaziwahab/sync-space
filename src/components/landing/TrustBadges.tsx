import { motion } from "framer-motion";
import { Wand2, Cpu, ShieldCheck } from "lucide-react";

const badges = [
  { icon: Wand2, label: "No coding required" },
  { icon: Cpu, label: "AI-powered" },
  { icon: ShieldCheck, label: "Auto debugging" },
];

const TrustBadges = () => {
  return (
    <section className="py-12 px-4 relative z-10 -mt-10">
      <div className="max-w-4xl mx-auto flex flex-wrap justify-center gap-6">
        {badges.map((badge, i) => {
          const Icon = badge.icon;
          return (
            <motion.div
              key={badge.label}
              className="flex items-center gap-3 px-6 py-4 rounded-full clay-panel shadow-lg interactive hover:scale-105 transition-transform"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: 0.5 + i * 0.1, type: "spring" }}
              whileHover={{ y: -5 }}
            >
              <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                <Icon className="w-4 h-4 text-accent" />
              </div>
              <span className="text-sm font-semibold text-foreground/80">{badge.label}</span>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};

export default TrustBadges;
