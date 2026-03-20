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
                <div className="clay-panel rounded-2xl p-5 flex flex-col items-center gap-3 w-32 shadow-xl hover:-translate-y-2 transition-transform duration-300 relative group interactive">
                  <div className={`w-14 h-14 rounded-xl bg-${agent.color}/10 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform`}>
                    <Icon className={`w-7 h-7 text-${agent.color}`} />
                  </div>
                  <span className="text-sm font-bold tracking-tight">{agent.label}</span>
                  
                  {/* Speech bubble */}
                  <motion.div
                    className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg bg-foreground text-background text-xs font-medium whitespace-nowrap shadow-xl"
                    initial={{ opacity: 0, scale: 0.8, y: 10 }}
                    whileInView={{ opacity: 1, scale: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: agent.delay * 0.5 + 0.8, type: "spring" }}
                  >
                    {i === 0 && "✍️ Describe it"}
                    {i === 1 && "📋 Assigning..."}
                    {i === 2 && "🧠 Planning..."}
                    {i === 3 && "⚡ Coding..."}
                    {i === 4 && "🔍 Checking..."}
                    {i === 5 && "🚀 Live!"}
                    <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 bg-foreground" />
                  </motion.div>
                </div>

                {/* Arrow between agents */}
                {i < agents.length - 1 && (
                  <motion.div
                    className="hidden sm:block absolute right-[-20%] top-1/2 -translate-y-1/2 text-primary/40 z-0"
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: agent.delay * 0.5 + 0.4 }}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                      <polyline points="12 5 19 12 12 19"></polyline>
                    </svg>
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
