import { motion } from "framer-motion";
import { MessageSquare, Cpu, Code, Bug, Rocket, UserRound } from "lucide-react";

const agents = [
  { icon: MessageSquare, label: "Prompt", color: "primary", delay: 0 },
  { icon: UserRound, label: "Leader", color: "warning", delay: 0.3 },
  { icon: Cpu, label: "Planner", color: "accent", delay: 0.6 },
  { icon: Code, label: "Builder", color: "primary", delay: 0.9 },
  { icon: Bug, label: "Debugger", color: "destructive", delay: 1.2 },
  { icon: Rocket, label: "Deploy", color: "success", delay: 1.5 },
];

const AgentFlowVisual = () => {
  return (
    <section className="py-20 px-4">
      <div className="max-w-5xl mx-auto">
        <motion.h2
          className="text-3xl sm:text-4xl font-bold text-center mb-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          Your AI Office, <span className="text-gradient">Working Together</span>
        </motion.h2>
        <motion.p
          className="text-muted-foreground text-center mb-16 max-w-xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
        >
          Each agent sits at their desk, passing work to the next — just like a real development team.
        </motion.p>

        <div className="relative flex flex-wrap justify-center gap-4 sm:gap-0 sm:flex-nowrap items-center">
          {/* Connection line */}
          <div className="hidden sm:block absolute top-1/2 left-[8%] right-[8%] h-px bg-gradient-to-r from-primary/30 via-accent/30 to-success/30" />

          {agents.map((agent, i) => {
            const Icon = agent.icon;
            return (
              <motion.div
                key={agent.label}
                className="relative z-10 flex flex-col items-center sm:flex-1"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: agent.delay * 0.5, duration: 0.5 }}
              >
                {/* Desk card */}
                <div className="glass rounded-xl p-4 flex flex-col items-center gap-3 w-28 hover:glow-primary transition-shadow duration-300">
                  <div className={`w-12 h-12 rounded-lg bg-${agent.color}/10 flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 text-${agent.color}`} />
                  </div>
                  <span className="text-sm font-medium">{agent.label}</span>
                  
                  {/* Speech bubble */}
                  <motion.div
                    className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded-md bg-card border border-border text-[10px] text-muted-foreground whitespace-nowrap"
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: agent.delay * 0.5 + 0.8 }}
                  >
                    {i === 0 && "✍️ Describe it"}
                    {i === 1 && "📋 Assigning..."}
                    {i === 2 && "🧠 Planning..."}
                    {i === 3 && "⚡ Coding..."}
                    {i === 4 && "🔍 Checking..."}
                    {i === 5 && "🚀 Live!"}
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 bg-card border-r border-b border-border" />
                  </motion.div>
                </div>

                {/* Arrow between agents */}
                {i < agents.length - 1 && (
                  <motion.div
                    className="hidden sm:block absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 text-muted-foreground/40"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: agent.delay * 0.5 + 0.4 }}
                  >
                    →
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default AgentFlowVisual;
