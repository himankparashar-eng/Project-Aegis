import React from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { AEGIS } from '../../constants/testIds';

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="border border-slate-700 bg-slate-950/95 px-3 py-2 font-mono text-xs text-slate-200 shadow-glow-cyan">
            <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">block #{label}</div>
            {payload.map((p) => (
                <div key={p.dataKey} className="flex items-center justify-between gap-4">
                    <span className="uppercase" style={{ color: p.color }}>{p.dataKey}</span>
                    <span className="tabular-nums text-slate-100">${Number(p.value).toFixed(2)}</span>
                </div>
            ))}
        </div>
    );
};

export const PriceChart = ({ data }) => {
    return (
        <div
            data-testid={AEGIS.priceChart}
            className="relative h-[280px] w-full border border-slate-800 bg-slate-950/60 p-4 backdrop-blur-xl"
        >
            <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <span className="h-2 w-2 bg-cyan-400 shadow-glow-cyan aegis-blink" />
                    <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-slate-400">
                        live oracle feed // MKT/USDC
                    </span>
                </div>
                <div className="flex items-center gap-4 font-mono text-[10px] uppercase tracking-widest">
                    <span className="flex items-center gap-2 text-cyan-300">
                        <span className="inline-block h-[2px] w-4 bg-cyan-400" /> spot
                    </span>
                    <span className="flex items-center gap-2 text-amber-300">
                        <span className="inline-block h-[2px] w-4 bg-amber-400" /> twap({10})
                    </span>
                </div>
            </div>

            <ResponsiveContainer width="100%" height="88%">
                <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke="#1e293b" strokeDasharray="2 4" vertical={false} />
                    <XAxis
                        dataKey="block"
                        stroke="#475569"
                        tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                        tickLine={false}
                        axisLine={{ stroke: '#1e293b' }}
                    />
                    <YAxis
                        stroke="#475569"
                        tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                        tickLine={false}
                        axisLine={{ stroke: '#1e293b' }}
                        tickFormatter={(v) => `$${v}`}
                        domain={['auto', 'auto']}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#334155', strokeDasharray: '3 3' }} />
                    <ReferenceLine y={10} stroke="#334155" strokeDasharray="3 3" />
                    <Line
                        type="monotone"
                        dataKey="spot"
                        stroke="#22d3ee"
                        strokeWidth={2}
                        dot={false}
                        isAnimationActive
                        animationDuration={280}
                    />
                    <Line
                        type="monotone"
                        dataKey="twap"
                        stroke="#f59e0b"
                        strokeWidth={2}
                        strokeDasharray="4 4"
                        dot={false}
                        isAnimationActive
                        animationDuration={280}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

export default PriceChart;


