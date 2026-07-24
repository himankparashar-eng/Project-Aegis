import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { toast, Toaster } from 'sonner';
import Header from './Header';
import PriceChart from './PriceChart';
import AttackButton from './AttackButton';
import VaultCard from './VaultCard';
import AttackHistory from './AttackHistory';
import AegisProtocol, {
    INITIAL_VAULT,
    BASE_PRICE,
    ATTACK_TICK,
    TOTAL_TICKS,
    TWAP_WINDOW,
    VARIANCE_LIMIT,
} from '../../lib/aegisProtocol';
import { AEGIS } from '../../constants/testIds';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const buildInitialState = () => {
    const history = AegisProtocol.createInitialPriceHistory(TWAP_WINDOW);
    return {
        priceHistory: history,
        blockNumber: history.length,
        vulnerableBalance: INITIAL_VAULT,
        secureBalance: INITIAL_VAULT,
        vulnerableStatus: 'HEALTHY',
        secureStatus: 'HEALTHY',
        breakerTripped: false,
        vulnerableLogs: [
            '> aegis-node online :: vulnerable protocol v0.1',
            `> oracle mode :: SPOT (single feed)`,
            `> vault liquidity :: $${INITIAL_VAULT.toLocaleString()}`,
            '> awaiting borrow requests...',
        ],
        secureLogs: [
            '> aegis-node online :: secure protocol v1.0',
            `> oracle mode :: TWAP(${TWAP_WINDOW}) + variance guard`,
            `> variance limit :: ${(VARIANCE_LIMIT * 100).toFixed(0)}% per block`,
            `> vault liquidity :: $${INITIAL_VAULT.toLocaleString()}`,
            '> aegis-router :: armed :: awaiting anomalies...',
        ],
        attackStatus: 'IDLE',
    };
};

export const AegisDashboard = () => {
    const [state, setState] = useState(buildInitialState);
    const [runs, setRuns] = useState([]);
    const [stats, setStats] = useState(null);
    const [loadingRuns, setLoadingRuns] = useState(true);
    const intervalRef = useRef(null);
    const savedRef = useRef(false);

    const fetchRuns = useCallback(async () => {
        try {
            const [runsRes, statsRes] = await Promise.all([
                axios.get(`${API}/attack-runs?limit=15`),
                axios.get(`${API}/attack-runs/stats`),
            ]);
            setRuns(runsRes.data || []);
            setStats(statsRes.data || null);
        } catch (e) {
            console.error('failed to load ledger', e);
        } finally {
            setLoadingRuns(false);
        }
    }, []);

    useEffect(() => {
        fetchRuns();
    }, [fetchRuns]);

    // Ambient block tick when idle
    useEffect(() => {
        if (state.attackStatus !== 'IDLE') return;
        const interval = setInterval(() => {
            setState((prev) => {
                if (prev.attackStatus !== 'IDLE') return prev;
                const nextBlock = prev.blockNumber + 1;
                const newSpot = AegisProtocol.nextPrice(0, BASE_PRICE);
                const history = [...prev.priceHistory.slice(-49), {
                    block: nextBlock,
                    spot: newSpot,
                    twap: AegisProtocol.computeTWAP([...prev.priceHistory, { spot: newSpot }]),
                    t: Date.now(),
                }];
                return { ...prev, priceHistory: history, blockNumber: nextBlock };
            });
        }, 1500);
        return () => clearInterval(interval);
    }, [state.attackStatus]);

    const persistRun = useCallback(async (finalState) => {
        const lastSpot = finalState.priceHistory[finalState.priceHistory.length - 1]?.spot ?? BASE_PRICE;
        const peakSpot = Math.max(...finalState.priceHistory.map((p) => p.spot));
        const twapFinal = AegisProtocol.computeTWAP(finalState.priceHistory);
        const priorTwap = finalState.priceHistory[finalState.priceHistory.length - 6]?.twap ?? BASE_PRICE;
        const variance = AegisProtocol.computeVariance(peakSpot, priorTwap);

        try {
            await axios.post(`${API}/attack-runs`, {
                duration_ticks: TOTAL_TICKS,
                peak_spot_price: peakSpot,
                twap_final: twapFinal,
                vulnerable_final_balance: finalState.vulnerableBalance,
                secure_final_balance: finalState.secureBalance,
                circuit_breaker_tripped: finalState.breakerTripped,
                variance_pct: variance,
                vulnerable_status: finalState.vulnerableStatus === 'DRAINED' ? 'DRAINED' : 'SAFE',
                secure_status: finalState.secureStatus === 'DEFENDED' ? 'DEFENDED' : 'COMPROMISED',
                logs_vulnerable: finalState.vulnerableLogs.slice(-30),
                logs_secure: finalState.secureLogs.slice(-30),
            });
            toast.success('attack run logged to forensic ledger', {
                description: `secure vault saved $${finalState.secureBalance.toLocaleString()}`,
            });
            fetchRuns();
        } catch (e) {
            console.error('failed to persist run', e);
            toast.error('failed to log attack run');
        }
    }, [fetchRuns]);

    const handleAttack = useCallback(() => {
        if (state.attackStatus === 'ATTACKING') return;
        savedRef.current = false;

        setState((prev) => ({
            ...prev,
            attackStatus: 'ATTACKING',
            vulnerableLogs: [...prev.vulnerableLogs, '> [!] anomalous borrow tx entering mempool...'],
            secureLogs: [...prev.secureLogs, '> aegis-router :: elevated risk score detected'],
        }));

        let localTick = 0;
        const startBlock = state.blockNumber;

        intervalRef.current = setInterval(() => {
            localTick += 1;
            const tick = localTick;

            setState((prev) => {
                const nextBlock = startBlock + tick;
                const prevSpot = prev.priceHistory[prev.priceHistory.length - 1]?.spot ?? BASE_PRICE;
                const newSpot = AegisProtocol.nextPrice(tick, prevSpot);
                const nextHistory = [...prev.priceHistory, {
                    block: nextBlock,
                    spot: newSpot,
                    twap: 0,
                    t: Date.now(),
                }];
                const twap = AegisProtocol.computeTWAP(nextHistory);
                nextHistory[nextHistory.length - 1].twap = twap;

                const priorTwap = prev.priceHistory[prev.priceHistory.length - 1]?.twap ?? BASE_PRICE;
                const variance = AegisProtocol.computeVariance(newSpot, priorTwap);

                const vuln = AegisProtocol.vulnerableSettlement({
                    spot: newSpot,
                    currentBalance: prev.vulnerableBalance,
                    tick,
                });
                const sec = AegisProtocol.secureSettlement({
                    spot: newSpot,
                    twap,
                    variance,
                    currentBalance: prev.secureBalance,
                    tick,
                    breakerActive: prev.breakerTripped,
                });

                const next = {
                    ...prev,
                    priceHistory: nextHistory.slice(-60),
                    blockNumber: nextBlock,
                    vulnerableBalance: vuln.balance,
                    vulnerableStatus: vuln.status !== 'HEALTHY' ? vuln.status : prev.vulnerableStatus,
                    vulnerableLogs: vuln.log.length
                        ? [...prev.vulnerableLogs, ...vuln.log]
                        : prev.vulnerableLogs,
                    secureBalance: sec.balance,
                    secureStatus: sec.status !== 'HEALTHY' ? sec.status : prev.secureStatus,
                    breakerTripped: sec.tripped,
                    secureLogs: sec.log.length
                        ? [...prev.secureLogs, ...sec.log]
                        : prev.secureLogs,
                };

                if (tick >= ATTACK_TICK + 5) {
                    // Simulation completes 5 ticks after the attack (post-attack forensics)
                    clearInterval(intervalRef.current);
                    intervalRef.current = null;
                    const resolved = {
                        ...next,
                        attackStatus: 'RESOLVED',
                        vulnerableLogs: [...next.vulnerableLogs, '> simulation halted :: awaiting operator...'],
                        secureLogs: [...next.secureLogs, '> simulation halted :: aegis armed'],
                    };
                    if (!savedRef.current) {
                        savedRef.current = true;
                        setTimeout(() => persistRun(resolved), 100);
                    }
                    return resolved;
                }
                return next;
            });
        }, 150);
    }, [state.attackStatus, state.blockNumber, persistRun]);

    const handleReset = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        setState(buildInitialState());
        toast('simulation reset :: vaults refunded', { description: 'aegis-router armed' });
    }, []);

    useEffect(() => () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
    }, []);

    const currentSpot = state.priceHistory[state.priceHistory.length - 1]?.spot ?? BASE_PRICE;
    const currentTwap = useMemo(() => AegisProtocol.computeTWAP(state.priceHistory), [state.priceHistory]);

    return (
        <div data-testid={AEGIS.root} className="min-h-screen bg-slate-950 text-slate-100">
            <Toaster theme="dark" position="top-right" toastOptions={{ style: { fontFamily: 'JetBrains Mono' } }} />
            <Header blockNumber={state.blockNumber} status={state.attackStatus} />

            <main className="mx-auto max-w-[1400px] px-6 py-8 lg:px-10">
                {/* Hero */}
                <section className="mb-8 grid grid-cols-1 items-end gap-6 lg:grid-cols-[1.2fr_1fr]">
                    <div>
                        <p className="mb-3 inline-block border border-cyan-500/40 bg-cyan-500/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.3em] text-cyan-300">
                            [ oracle security // fintech track ]
                        </p>
                        <h2 className="font-display text-4xl font-bold uppercase leading-none tracking-[0.02em] text-slate-50 sm:text-5xl lg:text-6xl">
                            Neutralising the <span className="text-amber-400">flash-loan</span>
                            <br />
                            <span className="text-cyan-300">oracle exploit.</span>
                        </h2>
                        <p className="mt-4 max-w-xl font-mono text-sm text-slate-400">
                            &gt; a live side-by-side simulation of a $20M DeFi vault. one uses a naive spot-price oracle.
                            the other runs the aegis router — TWAP consensus + 15% variance circuit breaker.
                            trigger the attack and watch which one survives.
                        </p>
                    </div>
                    <div className="flex flex-col items-start gap-4 lg:items-end">
                        <AttackButton
                            onAttack={handleAttack}
                            onReset={handleReset}
                            status={state.attackStatus}
                        />
                        <div className="flex gap-4 font-mono text-[10px] uppercase tracking-[0.25em] text-slate-500">
                            <div>attack tick :: <span className="text-amber-300">#{ATTACK_TICK}</span></div>
                            <div>twap window :: <span className="text-cyan-300">{TWAP_WINDOW}</span></div>
                            <div>variance cap :: <span className="text-emerald-300">{VARIANCE_LIMIT * 100}%</span></div>
                        </div>
                    </div>
                </section>

                {/* Price chart */}
                <section className="mb-8">
                    <PriceChart data={state.priceHistory} />
                </section>

                {/* Split view */}
                <section className="mb-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <VaultCard
                        variant="vulnerable"
                        title="vulnerable protocol"
                        subtitle="spot-oracle lending // v0.1"
                        priceLabel="spot price"
                        priceValue={currentSpot}
                        balance={state.vulnerableBalance}
                        status={state.vulnerableStatus}
                        terminalLines={state.vulnerableLogs}
                        cardTestId={AEGIS.vulnerableCard}
                        balanceTestId={AEGIS.vulnerableBalance}
                        statusTestId={AEGIS.vulnerableStatus}
                        terminalTestId={AEGIS.vulnerableTerminal}
                    />
                    <VaultCard
                        variant="secure"
                        title="aegis secure protocol"
                        subtitle={`twap(${TWAP_WINDOW}) + circuit breaker`}
                        priceLabel="twap price"
                        priceValue={currentTwap}
                        balance={state.secureBalance}
                        status={state.secureStatus}
                        breakerTripped={state.breakerTripped}
                        terminalLines={state.secureLogs}
                        cardTestId={AEGIS.secureCard}
                        balanceTestId={AEGIS.secureBalance}
                        statusTestId={AEGIS.secureStatus}
                        terminalTestId={AEGIS.secureTerminal}
                        breakerTestId={AEGIS.breakerBadge}
                    />
                </section>

                {/* History */}
                <AttackHistory runs={runs} stats={stats} loading={loadingRuns} />

                <footer className="mt-10 border-t border-slate-800 py-6 font-mono text-[10px] uppercase tracking-[0.3em] text-slate-600">
                    &gt; code crew // hackvsit 7.0 // fintech &amp; financial inclusion
                </footer>
            </main>
        </div>
    );
};

export default AegisDashboard;


