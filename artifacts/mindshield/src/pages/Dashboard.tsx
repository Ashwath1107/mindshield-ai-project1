import { Layout } from '@/components/Layout';
import { useGetDashboard } from '@workspace/api-client-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';
import { format } from 'date-fns';
import { Loader2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { getEmotionColors, cn } from '@/lib/utils';

export function Dashboard() {
  const { data, isLoading, isError } = useGetDashboard();

  if (isLoading) {
    return (
      <Layout>
        <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
          <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
          <p>Compiling emotional insights...</p>
        </div>
      </Layout>
    );
  }

  if (isError || !data) {
    return (
      <Layout>
        <div className="w-full h-full flex flex-col items-center justify-center text-destructive">
          <AlertTriangle className="w-12 h-12 mb-4" />
          <h2 className="text-xl font-bold">Failed to load dashboard</h2>
          <p className="text-sm opacity-80">Could not retrieve emotional history.</p>
        </div>
      </Layout>
    );
  }

  // Prep data for charts
  const timelineData = data.records.map(r => ({
    time: format(new Date(r.timestamp), 'MMM dd HH:mm'),
    score: r.stability_score || 0
  })).reverse(); // Oldest first for timeline

  const emotionData = Object.entries(data.emotion_counts).map(([name, count]) => ({
    name, count
  }));

  const COLORS = ['#7c3aed', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#f43f5e', '#8b5cf6'];

  const riskColor = getEmotionColors(data.current_burnout_risk);

  return (
    <Layout>
      <div className="p-4 md:p-8 space-y-8">
        <header>
          <h1 className="text-3xl font-display font-bold">Emotional Analytics</h1>
          <p className="text-muted-foreground mt-1">Your mental health overview based on {data.total_sessions} sessions.</p>
        </header>

        {/* Top KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="glass-card p-6 rounded-2xl flex flex-col">
            <h3 className="text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wider">Current Burnout Risk</h3>
            <div className="mt-auto flex items-end justify-between">
              <span className={cn("text-4xl font-bold font-display capitalize", riskColor.split(' ')[0])}>
                {data.current_burnout_risk}
              </span>
              <ShieldCheck className={cn("w-10 h-10 opacity-50", riskColor.split(' ')[0])} />
            </div>
          </div>
          
          <div className="glass-card p-6 rounded-2xl flex flex-col relative overflow-hidden">
            <h3 className="text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wider">Mental Stability</h3>
            <div className="mt-auto flex items-end gap-2">
              <span className="text-4xl font-bold font-display text-white">{data.stability_score}</span>
              <span className="text-sm text-muted-foreground mb-1">/ 100</span>
            </div>
            {/* Progress Bar background */}
            <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/10">
              <div 
                className="h-full bg-gradient-to-r from-cyan-500 to-primary transition-all duration-1000" 
                style={{ width: `${data.stability_score}%` }} 
              />
            </div>
          </div>

          <div className="glass-card p-6 rounded-2xl flex flex-col">
            <h3 className="text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wider">Total Sessions</h3>
            <div className="mt-auto">
              <span className="text-4xl font-bold font-display text-white">{data.total_sessions}</span>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 glass-card p-6 rounded-2xl">
            <h3 className="text-lg font-display font-semibold mb-6">Stability Timeline</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                  <XAxis dataKey="time" stroke="#ffffff50" fontSize={12} tickMargin={10} />
                  <YAxis stroke="#ffffff50" fontSize={12} domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0B0C10', borderColor: '#ffffff20', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#06b6d4" 
                    strokeWidth={3}
                    dot={{ fill: '#06b6d4', strokeWidth: 0, r: 4 }}
                    activeDot={{ r: 6, fill: '#7c3aed' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass-card p-6 rounded-2xl flex flex-col">
            <h3 className="text-lg font-display font-semibold mb-2">Emotion Distribution</h3>
            <div className="flex-1 min-h-[250px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={emotionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="count"
                    stroke="none"
                  >
                    {emotionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0B0C10', borderColor: '#ffffff20', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {emotionData.map((entry, idx) => (
                <div key={entry.name} className="flex items-center gap-1.5 text-xs text-muted-foreground capitalize">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  {entry.name}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* History Table */}
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-white/10">
            <h3 className="text-lg font-display font-semibold">Recent Logs</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-white/5">
                <tr>
                  <th className="px-6 py-4 font-medium">Date</th>
                  <th className="px-6 py-4 font-medium">Emotion</th>
                  <th className="px-6 py-4 font-medium">Mental State</th>
                  <th className="px-6 py-4 font-medium">Burnout Risk</th>
                  <th className="px-6 py-4 font-medium text-right">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {data.records.slice(0, 10).map((record) => (
                  <tr key={record.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                      {format(new Date(record.timestamp), 'MMM dd, HH:mm')}
                    </td>
                    <td className="px-6 py-4 capitalize font-medium">
                      <span className={cn("px-2.5 py-1 rounded-md text-[11px] border", getEmotionColors(record.emotion))}>
                        {record.emotion}
                      </span>
                    </td>
                    <td className="px-6 py-4 capitalize">{record.mental_state || '-'}</td>
                    <td className="px-6 py-4 capitalize font-medium">
                      <span className={cn("px-2.5 py-1 rounded-md text-[11px] border", getEmotionColors(record.burnout_risk))}>
                        {record.burnout_risk}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-display font-bold">
                      {record.stability_score || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
