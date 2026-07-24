import React from 'react';
import { AEGIS } from '../../constants/testIds';

const fmt = (n, opts = {}) =>
    Number(n).toLocaleString('en-US', { maximumFractionDigits: 0, ...opts });

export const AttackHistory = ({ runs, stats, loading }) => {
    return (
        <section
            data-testid={AEGIS.historyPanel}
            className="border border-slate-800 bg-slate-950/60 p-6 backdrop-blur-xl"
        >
            <div className="mb-5 flex items-center justify-between">
                <div>
                    <h3 className="font-display text-lg font-bold uppercase tracking-[0.24em] text-slate-100">
                        forensic ledger
                    </h3>
                    <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-slate-500">
                        persistent record of simulated attacks
                    </p>
                </div>
                {stats && (
                    <div
                        data-testid={AEGIS.stats}
                        className="flex items-center gap-6 font-mono text-[10px] uppercase tracking-[0.25em]"
                    >
                        <StatItem label="runs" value={fmt(stats.total_runs)} />
                        <StatItem label="defended" value={fmt(stats.attacks_defended)} accent="emerald" />
                        <StatItem label="value saved" value={`$${fmt(stats.total_value_saved)}`} accent="cyan" />
                    </div>
                )}
            </div>

            <div className="overflow-x-auto border border-slate-800">
                <table className="w-full font-mono text-xs">
                    <thead className="bg-slate-900/70 text-slate-400">
                        <tr>
                            <Th>timestamp</Th>
                            <Th>peak spot</Th>
                            <Th>twap final</Th>
                            <Th>variance</Th>
                            <Th align="right">vulnerable</Th>
                            <Th align="right">secure</Th>
                            <Th align="center">breaker</Th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && (
                            <tr>
                                <td colSpan={7} className="p-6 text-center text-slate-500">
                                    &gt; syncing ledger...
                                </td>
                            </tr>
                        )}
                        {!loading && runs.length === 0 && (
                            <tr>
                                <td colSpan={7} className="p-6 text-center text-slate-500">
                                    &gt; no attack simulations logged yet — execute the first attack
                                </td>
                            </tr>
                        )}
                        {runs.map((r) => (
                            <tr
                                key={r.id}
                                data-testid={AEGIS.historyRow(r.id)}
                                className="border-t border-slate-800/70 hover:bg-slate-900/40"
                            >
                                <Td className="text-slate-400">
                                    {new Date(r.created_at).toLocaleTimeString()}
                                    <span className="ml-2 text-slate-600">
                                        {new Date(r.created_at).toLocaleDateString()}
                                    </span>
                                </Td>
                                <Td className="text-amber-300">${fmt(r.peak_spot_price, { maximumFractionDigits: 2 })}</Td>
                                <Td className="text-cyan-300">${fmt(r.twap_final, { maximumFractionDigits: 2 })}</Td>
                                <Td className="text-slate-200">{(r.variance_pct * 100).toFixed(1)}%</Td>
                                <Td align="right" className={r.vulnerable_status === 'DRAINED' ? 'text-red-300' : 'text-slate-200'}>
                                    ${fmt(r.vulnerable_final_balance)}
                                </Td>
                                <Td align="right" className={r.secure_status === 'DEFENDED' ? 'text-emerald-300' : 'text-slate-200'}>
                                    ${fmt(r.secure_final_balance)}
                                </Td>
                                <Td align="center">
                                    {r.circuit_breaker_tripped ? (
                                        <span className="border border-emerald-500/70 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-emerald-300">
                                            ⚡ tripped
                                        </span>
                                    ) : (
                                        <span className="text-slate-600">—</span>
                                    )}
                                </Td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    );
};

const Th = ({ children, align = 'left' }) => (
    <th
        className={`px-3 py-2 text-[10px] uppercase tracking-[0.2em] ${align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'}`}
    >
        {children}
    </th>
);
const Td = ({ children, className = '', align = 'left' }) => (
    <td
        className={`px-3 py-2 tabular-nums ${align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'} ${className}`}
    >
        {children}
    </td>
);

const StatItem = ({ label, value, accent }) => {
    const cls = accent === 'emerald'
        ? 'text-emerald-300'
        : accent === 'cyan'
            ? 'text-cyan-300'
            : 'text-slate-200';
    return (
        <div className="flex flex-col items-end">
            <span className="text-slate-500">{label}</span>
            <span className={`text-sm font-bold ${cls}`}>{value}</span>
        </div>
    );
};

export default AttackHistory;

