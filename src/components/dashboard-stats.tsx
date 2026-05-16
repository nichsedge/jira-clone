
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Ticket, Clock, CheckCircle2, AlertCircle, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

interface DashboardStatsProps {
  tickets: any[];
}

export function DashboardStats({ tickets }: DashboardStatsProps) {
  const total = tickets.length;
  const open = tickets.filter(t => {
    const statusId = typeof t.status === 'object' ? t.status?.id : t.status;
    return statusId === 'status-open' || statusId === 'status-todo';
  }).length;
  const inProgress = tickets.filter(t => {
    const statusId = typeof t.status === 'object' ? t.status?.id : t.status;
    return statusId === 'status-in-progress';
  }).length;
  const done = tickets.filter(t => {
    const statusId = typeof t.status === 'object' ? t.status?.id : t.status;
    return statusId === 'status-done';
  }).length;

  const stats = [
    {
      title: "Total Tickets",
      value: total,
      icon: Ticket,
      gradient: "from-blue-500 to-cyan-400",
      shadow: "shadow-blue-500/20",
    },
    {
      title: "Open/Todo",
      value: open,
      icon: Clock,
      gradient: "from-amber-500 to-orange-400",
      shadow: "shadow-amber-500/20",
    },
    {
      title: "In Progress",
      value: inProgress,
      icon: AlertCircle,
      gradient: "from-purple-500 to-pink-400",
      shadow: "shadow-purple-500/20",
    },
    {
      title: "Completed",
      value: done,
      icon: CheckCircle2,
      gradient: "from-emerald-500 to-teal-400",
      shadow: "shadow-emerald-500/20",
    },
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="grid gap-6 md:grid-cols-2 lg:grid-cols-4"
    >
      {stats.map((stat, i) => (
        <motion.div key={stat.title} variants={item}>
          <Card className="overflow-hidden border-border/50 bg-card/50 backdrop-blur-md transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl hover:border-primary/20 group relative">
            <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${stat.gradient} opacity-[0.03] rounded-bl-full group-hover:opacity-[0.08] transition-opacity`} />
            
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground group-hover:text-foreground transition-colors">
                {stat.title}
              </CardTitle>
              <div className={`p-2.5 rounded-xl bg-gradient-to-br ${stat.gradient} text-white shadow-lg ${stat.shadow} group-hover:scale-110 transition-transform duration-300`}>
                <stat.icon className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <div className="text-3xl font-black tracking-tighter">{stat.value}</div>
                {stat.value > 0 && (
                  <div className="text-[10px] font-bold text-emerald-500 flex items-center gap-0.5 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">
                    <TrendingUp className="h-2 w-2" />
                    Active
                  </div>
                )}
              </div>
              <p className="text-xs font-medium text-muted-foreground mt-2 flex items-center gap-1">
                {stat.title === "Completed" ? (
                  <span className="text-emerald-500/80 italic">"Excellence is a habit"</span>
                ) : (
                  <span>Focus on progress</span>
                )}
              </p>
            </CardContent>
            <div className={`h-1.5 w-full bg-gradient-to-r ${stat.gradient} opacity-20 group-hover:opacity-40 transition-opacity`} />
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );
}
