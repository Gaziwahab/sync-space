import { motion } from "framer-motion";
import { Wand2, Cpu, ShieldCheck } from "lucide-react";

const badges = [
  { icon: Wand2, label: "No coding required" },
  { icon: Cpu, label: "AI-powered" },
  { icon: ShieldCheck, label: "Auto debugging" },
];

const TrustBadges = () => {
  return (
    <section className="py-8 px-4">
      <div className="max-w-3xl mx-auto flex flex-wrap justify-center gap-6">
        {badges.map((badge, i) => {
          const Icon = badge.icon;
          return (
            <motion.div
              key={badge.label}
              className="flex items-center gap-3 px-6 py-3 rounded-full glass"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <Icon className="w-5 h-5 text-accent" />
              <span className="text-sm font-medium">{badge.label}</span>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};

export default TrustBadges;
