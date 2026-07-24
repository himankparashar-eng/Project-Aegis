import React from 'react';
import { AEGIS } from '../../constants/testIds';

export const AttackButton = ({ onAttack, onReset, status }) => {
    const isRunning = status === 'ATTACKING';
    const isResolved = status === 'RESOLVED';

    return (
        <div className="flex flex-col items-center gap-3 sm:flex-row">
            <button
                data-testid={AEGIS.attackBtn}
                onClick={onAttack}
                disabled={isRunning}
                className={[
                    'relative overflow-hidden border-2 px-8 py-4 font-display text-lg font-bold uppercase tracking-[0.3em] transition-all duration-200',
                    'disabled:cursor-not-allowed disabled:opacity-60',
                    isRunning
                        ? 'border-amber-400 bg-amber-500/20 text-amber-200 aegis-pulse-amber'
                        : 'border-amber-400 bg-slate-950 text-amber-300 hover:bg-amber-500 hover:text-slate-950 hover:shadow-glow-amber',
                ].join(' ')}
            >
                <span className="relative z-10 flex items-center gap-3">
                    <span className="font-mono text-xl">{isRunning ? '⟳' : '▶'}</span>
                    {isRunning ? 'attack in progress' : 'execute flash-loan attack'}
                </span>
                {!isRunning && (
                    <span className="pointer-events-none absolute inset-0 aegis-scan" aria-hidden />
                )}
            </button>

            <button
                data-testid={AEGIS.resetBtn}
                onClick={onReset}
                disabled={isRunning}
                className="border border-cyan-500/60 bg-transparent px-5 py-4 font-display text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300 transition-colors hover:bg-cyan-500/10 disabled:cursor-not-allowed disabled:opacity-40"
            >
                {isResolved ? 'reset simulation' : 'reset'}
            </button>
        </div>
    );
};

export default AttackButton;


