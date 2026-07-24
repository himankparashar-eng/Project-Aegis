// AegisProtocol — mock smart-contract engine for Project Aegis.
// Simulates block-by-block price feed, TWAP calculation, circuit breaker,
// and vault settlement for both a Vulnerable (spot-oracle) and Secure
// (TWAP + Circuit Breaker) lending protocol.

export const INITIAL_VAULT = 20_000_000;
export const BASE_PRICE = 10;
export const ATTACK_TICK = 23;
export const TOTAL_TICKS = 30;
export const TWAP_WINDOW = 10;             // last N blocks
export const VARIANCE_LIMIT = 0.15;        // 15 %
export const ATTACK_PEAK = 1000;

const randomBase = () => BASE_PRICE + (Math.random() - 0.5) * 0.4;

export function createInitialPriceHistory(size = TWAP_WINDOW) {
    const now = Date.now();
    return Array.from({ length: size }, (_, i) => ({
        block: i + 1,
        spot: parseFloat(randomBase().toFixed(3)),
        twap: BASE_PRICE,
        t: now - (size - i) * 1000,
    }));
}

export function computeTWAP(history, windowSize = TWAP_WINDOW) {
    if (!history.length) return BASE_PRICE;
    const window = history.slice(-windowSize);
    const sum = window.reduce((acc, p) => acc + p.spot, 0);
    return sum / window.length;
}

export function computeVariance(current, previous) {
    if (!previous || previous === 0) return 0;
    return Math.abs(current - previous) / previous;
}

// Generate the next price point for a given tick during a simulated attack.
export function nextPrice(tick, prevSpot) {
    if (tick === ATTACK_TICK) {
        return ATTACK_PEAK;               // Flash-loan spike
    }
    if (tick === ATTACK_TICK + 1) {
        return ATTACK_PEAK * 0.85;        // Small decay
    }
    if (tick === ATTACK_TICK + 2) {
        return BASE_PRICE + Math.random() * 2; // Price restored (loan repaid)
    }
    return parseFloat(randomBase().toFixed(3));
}

// Vulnerable Lender: naively uses spot price to determine collateral value.
// If spot > 100x normal, an attacker can drain the vault entirely.
export function vulnerableSettlement({ spot, currentBalance, tick }) {
    const log = [];
    let balance = currentBalance;
    let status = 'HEALTHY';

    if (tick === ATTACK_TICK) {
        log.push(`> block #${tick} :: incoming borrow request`);
        log.push(`> reading spot price from mock oracle...`);
        log.push(`> spot = $${spot.toFixed(2)}  (last block: $${BASE_PRICE.toFixed(2)})`);
        log.push(`> collateral valuation accepted [NO SANITY CHECK]`);
        log.push(`> issuing loan against inflated collateral...`);
        balance = 0;
        status = 'DRAINED';
        log.push(`> [FATAL] vault balance -> $0.00`);
        log.push(`> attacker withdrew $${INITIAL_VAULT.toLocaleString()} in stables`);
    } else if (tick === ATTACK_TICK + 3) {
        log.push(`> post-mortem: single-source oracle exploited`);
        log.push(`> forensic trace: 1 tx, 1 block, protocol drained`);
    }
    return { balance, status, log };
}

// Secure Lender: uses TWAP + variance check as a circuit breaker.
export function secureSettlement({ spot, twap, variance, currentBalance, tick, breakerActive }) {
    const log = [];
    let balance = currentBalance;
    let status = 'HEALTHY';
    let tripped = breakerActive;

    if (tick === ATTACK_TICK) {
        log.push(`> block #${tick} :: incoming borrow request`);
        log.push(`> aegis-router :: cross-referencing feeds`);
        log.push(`> spot = $${spot.toFixed(2)}  ::  twap(${TWAP_WINDOW}) = $${twap.toFixed(2)}`);
        log.push(`> variance = ${(variance * 100).toFixed(2)}%  limit = ${(VARIANCE_LIMIT * 100).toFixed(0)}%`);
        if (variance > VARIANCE_LIMIT) {
            tripped = true;
            status = 'DEFENDED';
            log.push(`> [ALERT] circuit breaker TRIPPED`);
            log.push(`> reverting tx :: flash-loan attack neutralised`);
            log.push(`> vault balance -> $${balance.toLocaleString()} [INTACT]`);
        }
    } else if (tick === ATTACK_TICK + 1 && tripped) {
        log.push(`> block #${tick} :: breaker cooldown active`);
        log.push(`> using twap fallback :: $${twap.toFixed(2)}`);
    } else if (tick === ATTACK_TICK + 3 && tripped) {
        log.push(`> price feed stabilised :: releasing breaker`);
        log.push(`> aegis-router :: back online :: vault SAFE`);
    }
    return { balance, status, tripped, log };
}

export const AegisProtocol = {
    INITIAL_VAULT,
    BASE_PRICE,
    ATTACK_TICK,
    TOTAL_TICKS,
    TWAP_WINDOW,
    VARIANCE_LIMIT,
    ATTACK_PEAK,
    createInitialPriceHistory,
    computeTWAP,
    computeVariance,
    nextPrice,
    vulnerableSettlement,
    secureSettlement,
};

export default AegisProtocol;

