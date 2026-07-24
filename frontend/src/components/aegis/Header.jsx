import React from 'react';
import { AEGIS } from '../../constants/testIds';

export const Header = ({ blockNumber, status }) => {
    return (
        <header
            data-testid={AEGIS.header}
            className="sticky top-0 z-30 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md"
        >
            <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-6 px-6 py-4 lg:px-10">
                <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center border border-cyan-400/60 bg-slate-950 shadow-glow-cyan">
                        <span className="font-mono text-lg font-bold text-cyan-300">Æ</span>
                    </div>
                    <div className="leading-tight">
                        <h1 className="font-display text-2xl font-bold uppercase tracking-[0.18em] text-slate-50">
                            Project Aegis
                        </h1>
                        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-slate-500">
                            secure oracle router // flash-loan defense
                        </p>
                    </div>
                </div>

                <div className="hidden items-center gap-8 md:flex">
                    <TickerItem label="network" value="hardhat // localnet" />
                    <TickerItem
                        label="block"
                        value={`#${blockNumber.toString().padStart(6, '0')}`}
                        testId={AEGIS.blockTicker}
                        accent="cyan"
                    />
                    <TickerItem label="status" value={status} accent={status === 'ATTACKING' ? 'amber' : 'emerald'} />
                </div>
            </div>
        </header>
    );
};

const TickerItem = ({ label, value, testId, accent }) => {
    const accentClass = accent === 'cyan'
        ? 'text-cyan-300'
        : accent === 'amber'
            ? 'text-amber-300'
            : accent === 'emerald'
                ? 'text-emerald-300'
                : 'text-slate-200';
    return (
        <div className="flex flex-col items-end" data-testid={testId}>
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-slate-500">
                {label}
            </span>
            <span className={`font-mono text-sm font-bold tracking-widest ${accentClass}`}>
                {value}
            </span>
        </div>
    );
};

export default Header;


