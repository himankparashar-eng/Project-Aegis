import React, { useEffect, useRef } from 'react';

export const Terminal = ({ lines, tone = 'emerald', testId }) => {
    const scrollRef = useRef(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [lines]);

    const toneClass = tone === 'red' ? 'text-red-300' : 'text-emerald-300';
    const cursorColor = tone === 'red' ? 'bg-red-400' : 'bg-emerald-400';

    return (
        <div
            data-testid={testId}
            ref={scrollRef}
            className="aegis-terminal relative h-56 overflow-y-auto border border-slate-800 bg-black/90 p-3 font-mono text-[11px] leading-relaxed"
        >
            {lines.length === 0 ? (
                <div className="text-slate-600">
                    &gt; awaiting oracle feed<span className={`ml-1 inline-block h-3 w-2 ${cursorColor} aegis-blink`} />
                </div>
            ) : (
                lines.map((line, i) => (
                    <div key={i} className={`animate-fade-in ${toneClass}`}>
                        {line}
                    </div>
                ))
            )}
        </div>
    );
};

export default Terminal;


