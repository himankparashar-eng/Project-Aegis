import React from 'react';
import Terminal from './Terminal';

const formatUSD = (n) => {
    if (n === null || n === undefined) return '—';
    return n.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
    });
};

const formatPrice = (n) => {
    if (n === null || n === undefined) return '—';
    return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const VaultCard = ({
    variant,          // 'vulnerable' | 'secure'
    title,
    subtitle,
    priceLabel,
    priceValue,
    balance,
    status,           // 'HEALTHY' | 'DRAINED' | 'DEFENDED'
    breakerTripped,
    terminalLines,
    cardTestId,
    balanceTestId,
    statusTestId,
    terminalTestId,
    breakerTestId,
}) => {
    const isRed = variant === 'vulnerable';
    const accent = isRed ? 'red' : 'emerald';

    const borderClass = isRed ? 'border-red-500/50' : 'border-emerald-500/50';
    const glowClass = isRed ? 'shadow-glow-red' : 'shadow-glow-emerald';
    const titleClass = isRed ? 'text-red-300' : 'text-emerald-300';
    const balanceClass = isRed && status === 'DRAINED'
        ? 'text-red-400 aegis-flash-red'
        : isRed ? 'text-red-200' : 'text-emerald-200';
    const priceClass = isRed ? 'text-red-200' : 'text-emerald-200';

    const statusPill = () => {
        if (status === 'DRAINED') {
            return (
                <span
                    data-testid={statusTestId}
                    className="border border-red-500 bg-red-500/20 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-red-200"
                >
                    ▼ drained
                </span>
            );
        }
        if (status === 'DEFENDED') {
            return (
                <span
                    data-testid={statusTestId}
                    className="border border-emerald-500 bg-emerald-500/20 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-emerald-200"
                >
                    ▲ defended
                </span>
            );
        }
        return (
            <span
                data-testid={statusTestId}
                className="border border-slate-700 bg-slate-900/60 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-slate-300"
            >
                ● healthy
            </span>
        );
    };

    return (
        <div
            data-testid={cardTestId}
            className={`relative border ${borderClass} ${glowClass} bg-slate-950/70 p-6 backdrop-blur-xl aegis-grain`}
        >
            {/* Corner accents */}
            <span className={`absolute left-0 top-0 h-3 w-3 border-l-2 border-t-2 ${isRed ? 'border-red-400' : 'border-emerald-400'}`} />
            <span className={`absolute right-0 top-0 h-3 w-3 border-r-2 border-t-2 ${isRed ? 'border-red-400' : 'border-emerald-400'}`} />
            <span className={`absolute bottom-0 left-0 h-3 w-3 border-b-2 border-l-2 ${isRed ? 'border-red-400' : 'border-emerald-400'}`} />
            <span className={`absolute bottom-0 right-0 h-3 w-3 border-b-2 border-r-2 ${isRed ? 'border-red-400' : 'border-emerald-400'}`} />

            <div className="mb-6 flex items-start justify-between">
                <div>
                    <div className="flex items-center gap-3">
                        <span className={`h-2 w-2 ${accent === 'red' ? 'bg-red-400' : 'bg-emerald-400'}`} />
                        <h3 className={`font-display text-xl font-bold uppercase tracking-[0.2em] ${titleClass}`}>
                            {title}
                        </h3>
                    </div>
                    <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.25em] text-slate-500">
                        {subtitle}
                    </p>
                </div>
                {statusPill()}
            </div>

            <div className="mb-5 grid grid-cols-2 gap-4">
                <div className="border border-slate-800 bg-black/40 p-3">
                    <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-slate-500">
                        {priceLabel}
                    </div>
                    <div className={`mt-1 font-mono text-2xl font-bold tabular-nums ${priceClass}`}>
                        {formatPrice(priceValue)}
                    </div>
                </div>
                <div className="border border-slate-800 bg-black/40 p-3">
                    <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-slate-500">
                        vault liquidity
                    </div>
                    <div
                        data-testid={balanceTestId}
                        className={`mt-1 font-mono text-2xl font-bold tabular-nums ${balanceClass}`}
                    >
                        {formatUSD(balance)}
                    </div>
                </div>
            </div>

            {!isRed && (
                <div className="mb-4 flex items-center justify-between border border-slate-800 bg-black/40 px-3 py-2">
                    <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-slate-500">
                        circuit breaker
                    </span>
                    <span
                        data-testid={breakerTestId}
                        className={
                            breakerTripped
                                ? 'border border-emerald-400 bg-emerald-500 px-3 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-slate-950'
                                : 'border border-slate-700 px-3 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400'
                        }
                    >
                        {breakerTripped ? '⚡ tripped' : '○ armed'}
                    </span>
                </div>
            )}

            {isRed && (
                <div className="mb-4 flex items-center justify-between border border-slate-800 bg-black/40 px-3 py-2">
                    <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-slate-500">
                        oracle source
                    </span>
                    <span className="border border-red-500/60 px-3 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-red-300">
                        ✕ single spot feed
                    </span>
                </div>
            )}

            <Terminal
                lines={terminalLines}
                tone={accent}
                testId={terminalTestId}
            />
        </div>
    );
};

export default VaultCard;


