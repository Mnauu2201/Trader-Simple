// src/components/DrawingToolbar.jsx
// v3: Full TradingView-style drawing toolbar
//
// Cải tiến:
//   - Submenu chia nhóm con (LINES, CHANNELS, PITCHFORKS; FIBONACCI, GANN...)
//   - Icon SVG sát với TradingView
//   - Magnet mode: Weak / Strong / Snap to indicators
//   - Keep Drawing toggle
//   - Lock All với submenu: Lock All / Always remove locked
//   - Hide với submenu: Hide options / Hide indicators / Hide positions / Hide all
//   - Delete với submenu: Remove drawings / Remove indicators / Remove all / Always remove locked
//   - Đường nét đứt price line đúng với mỗi tool
//   - Shortcut hints Alt+T, Alt+H, Alt+F...

import { useState, useRef, useEffect, useCallback } from 'react'

// ── SVG Icon helpers ──────────────────────────────────────────────────────────

function Icon({ d, size = 14, viewBox = "0 0 16 16", stroke = "currentColor", fill = "none", strokeWidth = 1.3, ...rest }) {
    return (
        <svg width={size} height={size} viewBox={viewBox} fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...rest}>
            <path d={d} />
        </svg>
    )
}

// Inline SVG icons matching TradingView style
const ICONS = {
    cursor: <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><path d="M2 1l9 5.5-4 1.5L9 13z" stroke="currentColor" strokeWidth="0.8" fill="none" /></svg>,
    cross: <svg width="14" height="14" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="1.4" fill="none"><line x1="7" y1="1" x2="7" y2="13" /><line x1="1" y1="7" x2="13" y2="7" /></svg>,
    dot_cursor: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="2.5" fill="currentColor" /><line x1="7" y1="1" x2="7" y2="4" stroke="currentColor" strokeWidth="1.2" /><line x1="7" y1="10" x2="7" y2="13" stroke="currentColor" strokeWidth="1.2" /><line x1="1" y1="7" x2="4" y2="7" stroke="currentColor" strokeWidth="1.2" /><line x1="10" y1="7" x2="13" y2="7" stroke="currentColor" strokeWidth="1.2" /></svg>,
    arrow_cursor: <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" stroke="none"><path d="M2 1 L2 11 L5 8.5 L7 13 L9 12 L7 7.5 L11 7.5 Z" /></svg>,
    demo_cursor: <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2"><circle cx="5" cy="9" r="3.5" /><line x1="7.5" y1="7" x2="12" y2="2" /><circle cx="12" cy="2" r="1.2" fill="currentColor" stroke="none" /></svg>,
    trendline: <svg width="14" height="14" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="1.4" fill="none"><line x1="2" y1="12" x2="12" y2="2" /><circle cx="2" cy="12" r="1.2" fill="currentColor" stroke="none" /><circle cx="12" cy="2" r="1.2" fill="currentColor" stroke="none" /></svg>,
    ray: <svg width="14" height="14" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="1.4" fill="none"><line x1="2" y1="10" x2="13" y2="3" /><circle cx="2" cy="10" r="1.2" fill="currentColor" stroke="none" /></svg>,
    infoline: <svg width="14" height="14" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="1.4" fill="none"><line x1="2" y1="11" x2="12" y2="3" /><circle cx="7" cy="7" r="2.5" /><text x="6" y="9" fontSize="4" fill="currentColor" stroke="none" fontFamily="sans-serif">i</text></svg>,
    extended: <svg width="14" height="14" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="1.4" fill="none"><line x1="1" y1="11" x2="13" y2="3" /><circle cx="4" cy="9" r="1.2" fill="currentColor" stroke="none" /><circle cx="10" cy="5" r="1.2" fill="currentColor" stroke="none" /></svg>,
    hline: <svg width="14" height="14" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="1.4" fill="none"><line x1="1" y1="7" x2="13" y2="7" /></svg>,
    hray: <svg width="14" height="14" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="1.4" fill="none"><line x1="2" y1="7" x2="13" y2="7" /><circle cx="2" cy="7" r="1.2" fill="currentColor" stroke="none" /></svg>,
    vline: <svg width="14" height="14" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="1.4" fill="none"><line x1="7" y1="1" x2="7" y2="13" /></svg>,
    crossline: <svg width="14" height="14" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="1.4" fill="none"><line x1="1" y1="7" x2="13" y2="7" /><line x1="7" y1="1" x2="7" y2="13" /><circle cx="7" cy="7" r="1.5" fill="currentColor" stroke="none" /></svg>,
    trend_angle: <svg width="14" height="14" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="1.4" fill="none"><line x1="2" y1="12" x2="12" y2="2" /><line x1="2" y1="12" x2="12" y2="12" /><path d="M9 12 A3 3 0 0 0 10.5 9" strokeDasharray="1.5 1" /></svg>,
    channel: <svg width="14" height="14" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="1.4" fill="none"><line x1="2" y1="4" x2="12" y2="2" /><line x1="2" y1="12" x2="12" y2="10" /><line x1="2" y1="8" x2="12" y2="6" strokeDasharray="2 1.5" strokeWidth="1" /></svg>,
    regression: <svg width="14" height="14" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="1.4" fill="none"><line x1="2" y1="11" x2="12" y2="3" /><line x1="2" y1="8" x2="12" y2="0" strokeDasharray="2 1.5" strokeWidth="1" /><line x1="2" y1="14" x2="12" y2="6" strokeDasharray="2 1.5" strokeWidth="1" /></svg>,
    flat_top: <svg width="14" height="14" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="1.4" fill="none"><line x1="2" y1="3" x2="12" y2="3" /><line x1="2" y1="11" x2="12" y2="8" /></svg>,
    disjoint: <svg width="14" height="14" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="1.4" fill="none"><line x1="2" y1="5" x2="7" y2="3" /><line x1="7" y1="11" x2="12" y2="9" /></svg>,
    pitchfork: <svg width="14" height="14" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="1.4" fill="none"><line x1="2" y1="7" x2="9" y2="7" /><line x1="9" y1="7" x2="12" y2="2" /><line x1="9" y1="7" x2="12" y2="12" /><line x1="9" y1="7" x2="12" y2="7" /></svg>,
    schiff_pitch: <svg width="14" height="14" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="1.4" fill="none"><line x1="3" y1="8" x2="8" y2="6" /><line x1="8" y1="6" x2="12" y2="2" /><line x1="8" y1="6" x2="12" y2="12" /></svg>,
    fib_ret: <svg width="14" height="14" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="1" fill="none"><line x1="1" y1="3" x2="13" y2="3" /><line x1="1" y1="7" x2="13" y2="7" /><line x1="1" y1="11" x2="13" y2="11" /><line x1="4" y1="3" x2="10" y2="11" strokeWidth="1.4" /></svg>,
    fib_ext: <svg width="14" height="14" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="1" fill="none"><line x1="1" y1="2" x2="13" y2="2" /><line x1="1" y1="5" x2="13" y2="5" /><line x1="1" y1="9" x2="13" y2="9" /><line x1="1" y1="13" x2="13" y2="13" /><line x1="4" y1="2" x2="10" y2="13" strokeWidth="1.4" /></svg>,
    fib_channel: <svg width="14" height="14" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="1" fill="none"><line x1="1" y1="4" x2="8" y2="2" /><line x1="1" y1="7" x2="8" y2="5" strokeDasharray="1.5 1" /><line x1="1" y1="10" x2="8" y2="8" /></svg>,
    fib_tz: <svg width="14" height="14" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="1.2" fill="none"><line x1="2" y1="1" x2="2" y2="13" /><line x1="5" y1="1" x2="5" y2="13" strokeOpacity="0.6" /><line x1="9" y1="1" x2="9" y2="13" strokeOpacity="0.5" /><line x1="13" y1="1" x2="13" y2="13" strokeOpacity="0.3" /></svg>,
    fib_fan: <svg width="14" height="14" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="1.2" fill="none"><line x1="2" y1="12" x2="12" y2="2" /><line x1="2" y1="12" x2="12" y2="5" strokeOpacity="0.7" /><line x1="2" y1="12" x2="12" y2="8" strokeOpacity="0.6" /><line x1="2" y1="12" x2="12" y2="12" strokeOpacity="0.4" /></svg>,
    fib_circles: <svg width="14" height="14" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="1.2" fill="none"><circle cx="4" cy="10" r="2" /><circle cx="4" cy="10" r="5" /></svg>,
    fib_spiral: <svg width="14" height="14" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="1.2" fill="none"><path d="M7 7 C7 5 9 3 11 5 C13 7 11 11 7 11 C3 11 1 7 3 5" /></svg>,
    fib_arcs: <svg width="14" height="14" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="1.2" fill="none"><path d="M2 12 Q7 6 12 12" /><path d="M2 12 Q7 2 12 12" strokeOpacity="0.6" /></svg>,
    fib_wedge: <svg width="14" height="14" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="1.2" fill="none"><line x1="2" y1="12" x2="12" y2="4" /><line x1="2" y1="12" x2="12" y2="8" strokeDasharray="2 1.5" /></svg>,
    pitchfan: <svg width="14" height="14" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="1.2" fill="none"><line x1="2" y1="7" x2="12" y2="3" /><line x1="2" y1="7" x2="12" y2="7" /><line x1="2" y1="7" x2="12" y2="11" /></svg>,
    gann_box: <svg width="14" height="14" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="1.2" fill="none"><rect x="2" y="2" width="10" height="10" /><line x1="2" y1="2" x2="12" y2="12" strokeOpacity="0.5" /><line x1="12" y1="2" x2="2" y2="12" strokeOpacity="0.5" /></svg>,
    gann_sq_fix: <svg width="14" height="14" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="1.2" fill="none"><rect x="1" y="1" width="12" height="12" /><rect x="3.5" y="3.5" width="7" height="7" strokeOpacity="0.5" /></svg>,
    gann_square: <svg width="14" height="14" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="1.2" fill="none"><rect x="2" y="2" width="10" height="10" /><line x1="7" y1="2" x2="7" y2="12" strokeOpacity="0.5" /><line x1="2" y1="7" x2="12" y2="7" strokeOpacity="0.5" /></svg>,
    gann_fan: <svg width="14" height="14" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="1.2" fill="none"><line x1="2" y1="12" x2="12" y2="2" /><line x1="2" y1="12" x2="12" y2="6" strokeOpacity="0.6" /><line x1="2" y1="12" x2="12" y2="12" strokeOpacity="0.4" /><line x1="2" y1="12" x2="6" y2="2" strokeOpacity="0.6" /></svg>,
    xabcd: <svg width="14" height="14" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="1.3" fill="none"><polyline points="1,11 4,4 7,9 10,3 13,7" /></svg>,
    cypher: <svg width="14" height="14" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="1.3" fill="none"><polyline points="1,10 4,3 7,8 10,2 13,6" /></svg>,
    hs: <svg width="14" height="14" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="1.3" fill="none"><polyline points="1,11 3,7 5,9 7,2 9,9 11,7 13,11" /><line x1="1" y1="11" x2="13" y2="11" strokeOpacity="0.4" strokeDasharray="2 1.5" /></svg>,
    abcd: <svg width="14" height="14" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="1.3" fill="none"><polyline points="1,11 5,3 9,9 13,3" /></svg>,
    triangle_pat: <svg width="14" height="14" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="1.3" fill="none"><polyline points="1,11 4,4 7,10 10,5 13,10" /><line x1="1" y1="11" x2="13" y2="11" /></svg>,
    three_drives: <svg width="14" height="14" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="1.3" fill="none"><polyline points="1,8 3,3 5,7 7,3 9,7 11,2 13,6" /></svg>,
    elliott_12345: <svg width="14" height="14" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="1.3" fill="none"><polyline points="1,11 3,4 5,9 7,3 9,8 11,3" /><text x="1" y="13" fontSize="4" fill="currentColor" stroke="none">1 2 3 4 5</text></svg>,
    elliott_abc: <svg width="14" height="14" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="1.3" fill="none"><polyline points="1,3 5,10 9,3 13,9" /><text x="1" y="13" fontSize="4" fill="currentColor" stroke="none">A  B  C</text></svg>,
    cycles: <svg width="14" height="14" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="1.2" fill="none"><line x1="2" y1="1" x2="2" y2="13" strokeDasharray="2 2" /><line x1="7" y1="1" x2="7" y2="13" strokeDasharray="2 2" /><line x1="12" y1="1" x2="12" y2="13" strokeDasharray="2 2" /></svg>,
    time_cycles: <svg width="14" height="14" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="1.2" fill="none"><path d="M2 7 Q4 2 7 7 Q10 12 12 7" /></svg>,
    sine_line: <svg width="14" height="14" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="1.2" fill="none"><path d="M1 7 Q3 2 5 7 Q7 12 9 7 Q11 2 13 7" /></svg>,
    long_pos: <svg width="14" height="14" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="1.2" fill="none"><line x1="1" y1="9" x2="13" y2="9" /><line x1="1" y1="4" x2="13" y2="4" strokeDasharray="2 1.5" /><polygon points="7,1 10,4 4,4" fill="currentColor" stroke="none" /></svg>,
    short_pos: <svg width="14" height="14" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="1.2" fill="none"><line x1="1" y1="5" x2="13" y2="5" /><line x1="1" y1="10" x2="13" y2="10" strokeDasharray="2 1.5" /><polygon points="7,13 10,10 4,10" fill="currentColor" stroke="none" /></svg>,
    pos_forecast: <svg width="14" height="14" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="1.2" fill="none"><rect x="1" y="5" width="12" height="4" /><line x1="7" y1="1" x2="7" y2="13" strokeDasharray="2 1.5" /></svg>,
    anchored_vwap: <svg width="14" height="14" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="1.2" fill="none"><path d="M2 10 Q5 3 8 8 Q11 13 12 6" /><circle cx="2" cy="10" r="1.5" fill="currentColor" stroke="none" /></svg>,
    vol_profile: <svg width="14" height="14" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="1.2" fill="none"><rect x="1" y="2" width="5" height="2" fill="currentColor" strokeWidth="0.5" /><rect x="1" y="5" width="8" height="2" fill="currentColor" strokeWidth="0.5" /><rect x="1" y="8" width="4" height="2" fill="currentColor" strokeWidth="0.5" /><rect x="1" y="11" width="6" height="2" fill="currentColor" strokeWidth="0.5" /></svg>,
    price_range: <svg width="14" height="14" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="1.2" fill="none"><line x1="7" y1="2" x2="7" y2="12" /><line x1="4" y1="2" x2="10" y2="2" /><line x1="4" y1="12" x2="10" y2="12" /></svg>,
    date_range: <svg width="14" height="14" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="1.2" fill="none"><line x1="2" y1="7" x2="12" y2="7" /><line x1="2" y1="4" x2="2" y2="10" /><line x1="12" y1="4" x2="12" y2="10" /></svg>,
    date_price: <svg width="14" height="14" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="1.2" fill="none"><line x1="2" y1="7" x2="12" y2="7" /><line x1="7" y1="2" x2="7" y2="12" /></svg>,
    brush: <svg width="14" height="14" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="1.2" fill="none"><path d="M10 2 L12 4 L5 11 Q3 13 2 12 Q1 11 3 9 Z" /></svg>,
    highlighter: <svg width="14" height="14" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="1.2" fill="none"><path d="M8 2 L12 6 L7 11 L3 7 Z" fill="currentColor" fillOpacity="0.2" /><path d="M7 11 L5 13 L6 11" /></svg>,
    arrow_marker: <svg width="14" height="14" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="1.2" fill="none"><line x1="3" y1="11" x2="11" y2="3" /><polyline points="7,3 11,3 11,7" /></svg>,
    arrow: <svg width="14" height="14" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="1.2" fill="none"><line x1="2" y1="12" x2="11" y2="3" /><polyline points="7,3 11,3 11,7" /></svg>,
    arrow_up: <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" stroke="none"><polygon points="7,2 12,9 2,9" /></svg>,
    arrow_down: <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" stroke="none"><polygon points="7,12 12,5 2,5" /></svg>,
    rect: <svg width="14" height="14" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="1.2" fill="none"><rect x="2" y="3" width="10" height="8" /></svg>,
    rot_rect: <svg width="14" height="14" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="1.2" fill="none"><polygon points="7,1 13,7 7,13 1,7" /></svg>,
    path_tool: <svg width="14" height="14" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="1.2" fill="none"><polyline points="2,11 5,5 8,9 12,3" /><circle cx="2" cy="11" r="1.2" fill="currentColor" stroke="none" /><circle cx="12" cy="3" r="1.2" fill="currentColor" stroke="none" /></svg>,
    circle: <svg width="14" height="14" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="1.2" fill="none"><circle cx="7" cy="7" r="5" /></svg>,
    ellipse: <svg width="14" height="14" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="1.2" fill="none"><ellipse cx="7" cy="7" rx="6" ry="4" /></svg>,
    polyline: <svg width="14" height="14" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="1.2" fill="none"><polyline points="2,12 5,5 9,10 13,3" /></svg>,
    triangle_shp: <svg width="14" height="14" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="1.2" fill="none"><polygon points="7,2 13,12 1,12" /></svg>,
    arc: <svg width="14" height="14" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="1.2" fill="none"><path d="M2 10 Q7 1 12 10" /></svg>,
    curve: <svg width="14" height="14" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="1.2" fill="none"><path d="M2 12 C4 2 10 2 12 12" /></svg>,
    double_curve: <svg width="14" height="14" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="1.2" fill="none"><path d="M1 10 C3 3 6 11 7 7 C8 3 11 11 13 4" /></svg>,
    text: <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" stroke="none"><text x="2" y="11" fontSize="11" fontFamily="serif" fontWeight="bold">T</text></svg>,
    anchored_txt: <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2"><text x="2" y="9" fontSize="8" fill="currentColor" stroke="none" fontFamily="serif">T</text><line x1="5" y1="11" x2="11" y2="11" /></svg>,
    note: <svg width="14" height="14" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="1.2" fill="none"><rect x="2" y="2" width="10" height="10" rx="1" /><line x1="4" y1="5" x2="10" y2="5" /><line x1="4" y1="8" x2="8" y2="8" /></svg>,
    price_note: <svg width="14" height="14" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="1.2" fill="none"><text x="1" y="9" fontSize="8" fill="currentColor" stroke="none" fontFamily="mono">$</text><line x1="5" y1="7" x2="13" y2="7" strokeDasharray="2 1.5" /></svg>,
    pin: <svg width="14" height="14" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="1.2" fill="none"><circle cx="7" cy="5" r="3" /><line x1="7" y1="8" x2="7" y2="13" /><line x1="5" y1="13" x2="9" y2="13" /></svg>,
    callout: <svg width="14" height="14" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="1.2" fill="none"><rect x="1" y="1" width="12" height="8" rx="2" /><polyline points="3,9 2,13 6,9" /></svg>,
    comment: <svg width="14" height="14" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="1.2" fill="none"><path d="M2 2 H12 A1 1 0 0 1 13 3 V9 A1 1 0 0 1 12 10 H5 L2 13 V10 H2 A1 1 0 0 1 1 9 V3 A1 1 0 0 1 2 2Z" /></svg>,
    price_label: <svg width="14" height="14" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="1.2" fill="none"><path d="M1 5 H9 L13 7 L9 9 H1 Z" /><line x1="3" y1="7" x2="3" y2="7" strokeWidth="2" strokeLinecap="round" /></svg>,
    signpost: <svg width="14" height="14" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="1.2" fill="none"><path d="M7 2 L13 5 L7 8 L1 5 Z" /><line x1="7" y1="8" x2="7" y2="13" /></svg>,
    flag: <svg width="14" height="14" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="1.2" fill="none"><line x1="3" y1="2" x2="3" y2="13" /><polygon points="3,2 12,5 3,8" fill="currentColor" fillOpacity="0.7" stroke="none" /></svg>,
    image_tool: <svg width="14" height="14" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="1.2" fill="none"><rect x="1" y="2" width="12" height="10" rx="1" /><circle cx="5" cy="6" r="1.5" /><polyline points="1,11 5,7 8,10 10,8 13,11" /></svg>,
    measure: <svg width="14" height="14" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="1.2" fill="none"><line x1="1" y1="7" x2="13" y2="7" /><line x1="1" y1="4" x2="1" y2="10" /><line x1="13" y1="4" x2="13" y2="10" /><line x1="4" y1="5" x2="4" y2="9" strokeOpacity="0.5" /><line x1="7" y1="5" x2="7" y2="9" strokeOpacity="0.5" /><line x1="10" y1="5" x2="10" y2="9" strokeOpacity="0.5" /></svg>,
    magnet_weak: <svg width="14" height="14" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="1.3" fill="none"><path d="M2 12 V6 A5 5 0 0 1 12 6 V12" /><line x1="2" y1="11" x2="5" y2="11" /><line x1="9" y1="11" x2="12" y2="11" /></svg>,
    lock: <svg width="14" height="14" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="1.2" fill="none"><rect x="3" y="7" width="8" height="6" rx="1" /><path d="M5 7 V5 A2 2 0 0 1 9 5 V7" /></svg>,
    unlock: <svg width="14" height="14" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="1.2" fill="none"><rect x="3" y="7" width="8" height="6" rx="1" /><path d="M5 7 V5 A2 2 0 0 1 9 5" /></svg>,
    eye: <svg width="14" height="14" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="1.2" fill="none"><path d="M1 7 Q7 1 13 7 Q7 13 1 7" /><circle cx="7" cy="7" r="2" /></svg>,
    eye_off: <svg width="14" height="14" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="1.2" fill="none"><path d="M1 7 Q7 1 13 7 Q7 13 1 7" /><line x1="2" y1="2" x2="12" y2="12" strokeOpacity="0.8" /></svg>,
    trash: <svg width="14" height="14" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="1.2" fill="none"><polyline points="2,4 12,4" /><path d="M5 4 V2 H9 V4" /><rect x="3" y="5" width="8" height="8" rx="1" /></svg>,
    keep_draw: <svg width="14" height="14" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="1.2" fill="none"><path d="M10 2 L12 4 L5 11 Q3 13 2 12 Q1 11 3 9 Z" /><path d="M11 5 L13 7" strokeOpacity="0.5" /></svg>,
    bar_pattern: <svg width="14" height="14" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="1.2" fill="none"><rect x="1" y="3" width="12" height="8" /><line x1="4" y1="3" x2="4" y2="11" strokeOpacity="0.5" /><line x1="8" y1="3" x2="8" y2="11" strokeOpacity="0.5" /></svg>,
    ghost_feed: <svg width="14" height="14" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="1.2" fill="none"><path d="M3 12 V5 A4 4 0 0 1 11 5 V12 L9 10 L7 12 L5 10 Z" /></svg>,
    sector: <svg width="14" height="14" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="1.2" fill="none"><path d="M7 13 L7 7 L13 7 A6 6 0 0 1 7 13Z" fillOpacity="0.15" fill="currentColor" /></svg>,
}

// ── Tool Groups matching TradingView exactly ──────────────────────────────────

const TOOL_GROUPS = [
    {
        id: 'cursor',
        defaultTool: 'cross',
        iconKey: 'cross',
        tools: [
            { id: 'cross', label: 'Cross', iconKey: 'cross', shortcut: 'Esc' },
            { id: 'dot_cursor', label: 'Dot', iconKey: 'dot_cursor' },
            { id: 'cursor', label: 'Arrow', iconKey: 'arrow_cursor' },
            { id: 'demo_cursor', label: 'Demonstration', iconKey: 'demo_cursor' },
        ],
    },
    {
        id: 'lines',
        sections: [
            {
                label: 'LINES',
                tools: [
                    { id: 'trendline', label: 'Trendline', iconKey: 'trendline', shortcut: 'Alt+T' },
                    { id: 'ray', label: 'Ray', iconKey: 'ray' },
                    { id: 'infoline', label: 'Info line', iconKey: 'infoline' },
                    { id: 'extended', label: 'Extended line', iconKey: 'extended' },
                    { id: 'trend_angle', label: 'Trend angle', iconKey: 'trend_angle' },
                    { id: 'hline', label: 'Horizontal line', iconKey: 'hline', shortcut: 'Alt+H' },
                    { id: 'hray', label: 'Horizontal ray', iconKey: 'hray', shortcut: 'Alt+J' },
                    { id: 'vline', label: 'Vertical line', iconKey: 'vline', shortcut: 'Alt+V' },
                    { id: 'crossline', label: 'Cross line', iconKey: 'crossline', shortcut: 'Alt+C' },
                ],
            },
            {
                label: 'CHANNELS',
                tools: [
                    { id: 'channel', label: 'Parallel channel', iconKey: 'channel' },
                    { id: 'regression', label: 'Regression trend', iconKey: 'regression' },
                    { id: 'flat_top', label: 'Flat top/bottom', iconKey: 'flat_top' },
                    { id: 'disjoint', label: 'Disjoint channel', iconKey: 'disjoint' },
                ],
            },
            {
                label: 'PITCHFORKS',
                tools: [
                    { id: 'pitchfork', label: 'Pitchfork', iconKey: 'pitchfork' },
                    { id: 'schiff_pitch', label: 'Schiff pitchfork', iconKey: 'schiff_pitch' },
                    { id: 'mod_schiff', label: 'Modified Schiff pitchfork', iconKey: 'schiff_pitch' },
                    { id: 'inside_pitch', label: 'Inside pitchfork', iconKey: 'pitchfork' },
                ],
            },
        ],
        defaultTool: 'trendline',
        iconKey: 'trendline',
    },
    {
        id: 'fibonacci',
        sections: [
            {
                label: 'FIBONACCI',
                tools: [
                    { id: 'fib_ret', label: 'Fib retracement', iconKey: 'fib_ret', shortcut: 'Alt+F' },
                    { id: 'fib_ext', label: 'Trend-based fib extension', iconKey: 'fib_ext' },
                    { id: 'fib_channel', label: 'Fib channel', iconKey: 'fib_channel' },
                    { id: 'fib_tz', label: 'Fib time zone', iconKey: 'fib_tz' },
                    { id: 'fib_fan', label: 'Fib speed resistance fan', iconKey: 'fib_fan' },
                    { id: 'fib_circles', label: 'Fib circles', iconKey: 'fib_circles' },
                    { id: 'fib_spiral', label: 'Fib spiral', iconKey: 'fib_spiral' },
                    { id: 'fib_arcs', label: 'Fib speed resistance arcs', iconKey: 'fib_arcs' },
                    { id: 'fib_wedge', label: 'Fib wedge', iconKey: 'fib_wedge' },
                    { id: 'pitchfan', label: 'Pitchfan', iconKey: 'pitchfan' },
                ],
            },
            {
                label: 'GANN',
                tools: [
                    { id: 'gann_box', label: 'Gann box', iconKey: 'gann_box' },
                    { id: 'gann_sq_fix', label: 'Gann square fixed', iconKey: 'gann_sq_fix' },
                    { id: 'gann_square', label: 'Gann square', iconKey: 'gann_square' },
                    { id: 'gann_fan', label: 'Gann fan', iconKey: 'gann_fan' },
                ],
            },
        ],
        defaultTool: 'fib_ret',
        iconKey: 'fib_ret',
    },
    {
        id: 'patterns',
        sections: [
            {
                label: 'CHART PATTERNS',
                tools: [
                    { id: 'xabcd', label: 'XABCD pattern', iconKey: 'xabcd' },
                    { id: 'cypher', label: 'Cypher pattern', iconKey: 'cypher' },
                    { id: 'hs', label: 'Head and shoulders', iconKey: 'hs' },
                    { id: 'abcd', label: 'ABCD pattern', iconKey: 'abcd' },
                    { id: 'triangle_pat', label: 'Triangle pattern', iconKey: 'triangle_pat' },
                    { id: 'three_drives', label: 'Three drives pattern', iconKey: 'three_drives' },
                ],
            },
            {
                label: 'ELLIOTT WAVES',
                tools: [
                    { id: 'elliott_12345', label: 'Elliott impulse wave (1-2-3-4-5)', iconKey: 'elliott_12345' },
                    { id: 'elliott_abc', label: 'Elliott correction wave (A-B-C)', iconKey: 'elliott_abc' },
                    { id: 'elliott_abcde', label: 'Elliott triangle wave (A-B-C-D-E)', iconKey: 'elliott_abc' },
                    { id: 'elliott_wxy', label: 'Elliott double combo wave (W-X-Y)', iconKey: 'elliott_abc' },
                    { id: 'elliott_wxyz', label: 'Elliott triple combo wave (W-X-Y-X-Z)', iconKey: 'elliott_abc' },
                ],
            },
            {
                label: 'CYCLES',
                tools: [
                    { id: 'cyclic_lines', label: 'Cyclic lines', iconKey: 'cycles' },
                    { id: 'time_cycles', label: 'Time cycles', iconKey: 'time_cycles' },
                    { id: 'sine_line', label: 'Sine line', iconKey: 'sine_line' },
                ],
            },
        ],
        defaultTool: 'xabcd',
        iconKey: 'xabcd',
    },
    {
        id: 'forecasting',
        sections: [
            {
                label: 'FORECASTING',
                tools: [
                    { id: 'long_pos', label: 'Long position', iconKey: 'long_pos' },
                    { id: 'short_pos', label: 'Short position', iconKey: 'short_pos' },
                    { id: 'pos_forecast', label: 'Position forecast', iconKey: 'pos_forecast' },
                    { id: 'bar_pattern', label: 'Bar pattern', iconKey: 'bar_pattern' },
                    { id: 'ghost_feed', label: 'Ghost feed', iconKey: 'ghost_feed' },
                    { id: 'sector', label: 'Sector', iconKey: 'sector' },
                ],
            },
            {
                label: 'VOLUME-BASED',
                tools: [
                    { id: 'anchored_vwap', label: 'Anchored VWAP', iconKey: 'anchored_vwap' },
                    { id: 'vol_profile', label: 'Fixed range volume profile', iconKey: 'vol_profile' },
                    { id: 'anch_vol', label: 'Anchored volume profile', iconKey: 'vol_profile' },
                ],
            },
            {
                label: 'MEASURERS',
                tools: [
                    { id: 'price_range', label: 'Price range', iconKey: 'price_range' },
                    { id: 'date_range', label: 'Date range', iconKey: 'date_range' },
                    { id: 'date_price', label: 'Date and price range', iconKey: 'date_price' },
                ],
            },
        ],
        defaultTool: 'long_pos',
        iconKey: 'long_pos',
    },
    {
        id: 'brushes',
        sections: [
            {
                label: 'BRUSHES',
                tools: [
                    { id: 'brush', label: 'Brush', iconKey: 'brush' },
                    { id: 'highlighter', label: 'Highlighter', iconKey: 'highlighter' },
                ],
            },
            {
                label: 'ARROWS',
                tools: [
                    { id: 'arrow_marker', label: 'Arrow marker', iconKey: 'arrow_marker' },
                    { id: 'arrow', label: 'Arrow', iconKey: 'arrow' },
                    { id: 'arrow_up', label: 'Arrow mark up', iconKey: 'arrow_up' },
                    { id: 'arrow_down', label: 'Arrow mark down', iconKey: 'arrow_down' },
                ],
            },
            {
                label: 'SHAPES',
                tools: [
                    { id: 'rect', label: 'Rectangle', iconKey: 'rect', shortcut: 'Alt+Shift+R' },
                    { id: 'rot_rect', label: 'Rotated rectangle', iconKey: 'rot_rect' },
                    { id: 'path_tool', label: 'Path', iconKey: 'path_tool' },
                    { id: 'circle', label: 'Circle', iconKey: 'circle' },
                    { id: 'ellipse', label: 'Ellipse', iconKey: 'ellipse' },
                    { id: 'polyline', label: 'Polyline', iconKey: 'polyline' },
                    { id: 'triangle_shp', label: 'Triangle', iconKey: 'triangle_shp' },
                    { id: 'arc', label: 'Arc', iconKey: 'arc' },
                    { id: 'curve', label: 'Curve', iconKey: 'curve' },
                    { id: 'double_curve', label: 'Double curve', iconKey: 'double_curve' },
                ],
            },
        ],
        defaultTool: 'brush',
        iconKey: 'brush',
    },
    {
        id: 'annotation',
        label: 'Annotation tools',
        sections: [
            {
                label: '',
                tools: [
                    { id: 'text', label: 'Text', iconKey: 'text' },
                    { id: 'anchored_txt', label: 'Anchored text', iconKey: 'anchored_txt' },
                    { id: 'note', label: 'Note', iconKey: 'note' },
                    { id: 'price_note', label: 'Price note', iconKey: 'price_note' },
                    { id: 'pin', label: 'Pin', iconKey: 'pin' },
                    { id: 'table_tool', label: 'Table', iconKey: 'note' },
                    { id: 'callout', label: 'Callout', iconKey: 'callout' },
                    { id: 'comment', label: 'Comment', iconKey: 'comment' },
                    { id: 'price_label', label: 'Price label', iconKey: 'price_label' },
                    { id: 'signpost', label: 'Signpost', iconKey: 'signpost' },
                    { id: 'flag', label: 'Flag mark', iconKey: 'flag' },
                ],
            },
            {
                label: 'CONTENT',
                tools: [
                    { id: 'image_tool', label: 'Image', iconKey: 'image_tool' },
                ],
            },
        ],
        defaultTool: 'text',
        iconKey: 'text',
    },
    {
        id: 'measure',
        single: true,
        tools: [
            { id: 'measure', label: 'Measure', iconKey: 'measure', hint: 'Shift + Click on the chart' },
        ],
        defaultTool: 'measure',
        iconKey: 'measure',
    },
]

// ── Color palette ────────────────────────────────────────────────────────────
const COLORS = [
    '#f6465d', '#ff9800', '#f0b90b', '#0ecb81', '#2196f3', '#9c27b0',
    '#e91e63', '#00bcd4', '#4caf50', '#8bc34a', '#ffffff', '#848e9c',
    '#1a1d26', '#ff6b35', '#a855f7', '#06b6d4',
]

const LINE_STYLES = [
    { id: 'solid', label: 'Solid', dashArray: '' },
    { id: 'dashed', label: 'Dashed', dashArray: '6 3' },
    { id: 'dotted', label: 'Dotted', dashArray: '2 3' },
]

// ── Main component ────────────────────────────────────────────────────────────

export default function DrawingToolbar({
    activeTool,
    onToolChange,
    onAction,
    drawingColor,
    onColorChange,
    lineWidth,
    onLineWidthChange,
    lineStyle,
    onLineStyleChange,
    hiddenAll,
    lockedAll,
    drawingCount = 0,
    keepDrawing = false,
    onKeepDrawingChange,
    magnetMode = 'none',
    onMagnetModeChange,
}) {
    const [openGroup, setOpenGroup] = useState(null)
    const [showColorPicker, setShowColorPicker] = useState(false)
    const [showStylePanel, setShowStylePanel] = useState(false)
    const [showMagnet, setShowMagnet] = useState(false)
    const [showHideMenu, setShowHideMenu] = useState(false)
    const [showDeleteMenu, setShowDeleteMenu] = useState(false)
    const [showLockMenu, setShowLockMenu] = useState(false)
    const [alwaysRemoveLocked, setAlwaysRemoveLocked] = useState(false)
    const [snapToIndicators, setSnapToIndicators] = useState(false)

    // Per-group last selected tool
    const [groupActive, setGroupActive] = useState(() => {
        const m = {}
        TOOL_GROUPS.forEach(g => { m[g.id] = g.defaultTool })
        return m
    })

    const toolbarRef = useRef(null)

    // Close all panels on outside click
    useEffect(() => {
        function handleClick(e) {
            if (toolbarRef.current && !toolbarRef.current.contains(e.target)) {
                setOpenGroup(null)
                setShowColorPicker(false)
                setShowStylePanel(false)
                setShowMagnet(false)
                setShowHideMenu(false)
                setShowDeleteMenu(false)
                setShowLockMenu(false)
            }
        }
        document.addEventListener('mousedown', handleClick)
        return () => document.removeEventListener('mousedown', handleClick)
    }, [])

    // Keyboard shortcuts
    useEffect(() => {
        function handleKey(e) {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
            if (e.key === 'Escape') { onToolChange?.('cursor'); return }
            const key = (e.altKey ? 'Alt+' : '') + (e.shiftKey ? 'Shift+' : '') + e.key.toUpperCase()
            for (const g of TOOL_GROUPS) {
                const allTools = g.sections ? g.sections.flatMap(s => s.tools) : (g.tools || [])
                for (const t of allTools) {
                    if (t.shortcut && t.shortcut.toUpperCase() === key) {
                        onToolChange?.(t.id)
                        setGroupActive(prev => ({ ...prev, [g.id]: t.id }))
                        return
                    }
                }
            }
        }
        document.addEventListener('keydown', handleKey)
        return () => document.removeEventListener('keydown', handleKey)
    }, [onToolChange])

    function closeAll() {
        setOpenGroup(null)
        setShowColorPicker(false)
        setShowStylePanel(false)
        setShowMagnet(false)
        setShowHideMenu(false)
        setShowDeleteMenu(false)
        setShowLockMenu(false)
    }

    function selectTool(groupId, toolId) {
        onToolChange?.(toolId)
        setGroupActive(prev => ({ ...prev, [groupId]: toolId }))
        setOpenGroup(null)
    }

    function getActiveGroup(toolId) {
        for (const g of TOOL_GROUPS) {
            const allTools = g.sections ? g.sections.flatMap(s => s.tools) : (g.tools || [])
            if (allTools.some(t => t.id === toolId)) return g.id
        }
        return null
    }

    function getAllToolsForGroup(g) {
        if (g.sections) return g.sections.flatMap(s => s.tools)
        return g.tools || []
    }

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div
            ref={toolbarRef}
            className="relative flex flex-col items-center gap-0.5 py-2 px-1 select-none z-30"
            style={{
                width: 36,
                minHeight: '100%',
                background: '#131722',
                borderRight: '1px solid #2b3139',
            }}
        >

            {/* ── TOOL GROUPS ── */}
            {TOOL_GROUPS.map(group => {
                const allTools = getAllToolsForGroup(group)
                const currentToolId = groupActive[group.id]
                const currentTool = allTools.find(t => t.id === currentToolId) ?? allTools[0]
                const isGroupActive = allTools.some(t => t.id === activeTool)
                const isOpen = openGroup === group.id
                const isSingle = group.single || allTools.length === 1

                return (
                    <div key={group.id} className="relative w-full flex flex-col items-center">
                        <button
                            title={currentTool?.label + (currentTool?.shortcut ? `  (${currentTool.shortcut})` : '')}
                            onClick={() => {
                                if (isSingle) {
                                    selectTool(group.id, allTools[0].id)
                                } else {
                                    if (isGroupActive && !isOpen) {
                                        setOpenGroup(group.id)
                                    } else if (isOpen) {
                                        setOpenGroup(null)
                                    } else {
                                        selectTool(group.id, currentTool.id)
                                    }
                                }
                            }}
                            onContextMenu={(e) => {
                                e.preventDefault()
                                if (!isSingle) setOpenGroup(prev => prev === group.id ? null : group.id)
                            }}
                            className="w-7 h-7 flex items-center justify-center rounded transition-all relative"
                            style={{
                                background: isGroupActive ? '#2962ff22' : 'transparent',
                                color: isGroupActive ? '#2962ff' : '#868ea7',
                            }}
                        >
                            {ICONS[currentTool?.iconKey || group.iconKey]}
                            {/* Tiny arrow indicator for groups */}
                            {!isSingle && (
                                <span
                                    className="absolute bottom-0 right-0"
                                    style={{ width: 0, height: 0, borderStyle: 'solid', borderWidth: '0 0 4px 4px', borderColor: 'transparent transparent #868ea7 transparent', opacity: 0.6 }}
                                />
                            )}
                        </button>

                        {/* Expand button (small chevron area right side) */}
                        {!isSingle && (
                            <button
                                onClick={(e) => { e.stopPropagation(); setOpenGroup(prev => prev === group.id ? null : group.id); setShowColorPicker(false); setShowStylePanel(false) }}
                                className="absolute right-0 top-0 w-3 h-7 opacity-0 hover:opacity-100 transition-opacity"
                                style={{ zIndex: 1 }}
                            />
                        )}

                        {/* ── Submenu ── */}
                        {isOpen && (
                            <div
                                className="absolute left-full top-0 ml-1 z-50 rounded py-1"
                                style={{
                                    background: '#1e222d',
                                    border: '1px solid #2b3139',
                                    boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
                                    minWidth: 220,
                                }}
                            >
                                {/* group label */}
                                {group.label && (
                                    <div style={{ fontSize: 9, color: '#868ea7', padding: '2px 12px 6px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, borderBottom: '1px solid #2b3139', marginBottom: 4 }}>
                                        {group.label}
                                    </div>
                                )}

                                {group.sections ? group.sections.map((section, si) => (
                                    <div key={si}>
                                        {section.label && (
                                            <div style={{ fontSize: 9, color: '#4c535e', padding: '6px 12px 3px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
                                                {section.label}
                                            </div>
                                        )}
                                        {section.tools.map(tool => (
                                            <ToolMenuItem
                                                key={tool.id}
                                                tool={tool}
                                                activeTool={activeTool}
                                                onClick={() => selectTool(group.id, tool.id)}
                                            />
                                        ))}
                                    </div>
                                )) : (group.tools || []).map(tool => (
                                    <ToolMenuItem
                                        key={tool.id}
                                        tool={tool}
                                        activeTool={activeTool}
                                        onClick={() => selectTool(group.id, tool.id)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )
            })}

            {/* ── Divider ── */}
            <Divider />

            {/* ── Color swatch ── */}
            <div className="relative w-full flex justify-center">
                <button
                    title="Màu đường vẽ"
                    onClick={() => { setShowColorPicker(v => !v); setShowStylePanel(false); setOpenGroup(null) }}
                    className="w-7 h-7 flex items-center justify-center rounded transition-colors"
                    style={{ background: showColorPicker ? '#2b3139' : 'transparent' }}
                >
                    <div
                        style={{
                            width: 14, height: 14, borderRadius: 2,
                            background: drawingColor ?? '#f0b90b',
                            border: '1.5px solid rgba(255,255,255,0.2)',
                        }}
                    />
                </button>
                {showColorPicker && (
                    <Panel style={{ top: 0 }}>
                        <PanelLabel>Color</PanelLabel>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 3 }}>
                            {COLORS.map(c => (
                                <button
                                    key={c}
                                    onClick={() => { onColorChange?.(c); setShowColorPicker(false) }}
                                    style={{
                                        width: 18, height: 18, borderRadius: 3,
                                        background: c,
                                        border: drawingColor === c ? '2px solid #fff' : '1px solid rgba(255,255,255,0.1)',
                                        cursor: 'pointer',
                                        transform: drawingColor === c ? 'scale(1.2)' : 'scale(1)',
                                    }}
                                />
                            ))}
                        </div>
                        <input
                            type="color"
                            value={drawingColor ?? '#f0b90b'}
                            onChange={e => onColorChange?.(e.target.value)}
                            style={{ width: '100%', height: 28, marginTop: 6, borderRadius: 4, border: '1px solid #2b3139', background: 'transparent', cursor: 'pointer' }}
                        />
                    </Panel>
                )}
            </div>

            {/* ── Line style / width ── */}
            <div className="relative w-full flex justify-center">
                <button
                    title="Line style & width"
                    onClick={() => { setShowStylePanel(v => !v); setShowColorPicker(false); setOpenGroup(null) }}
                    className="w-7 h-7 flex items-center justify-center rounded transition-colors"
                    style={{ background: showStylePanel ? '#2b3139' : 'transparent', color: '#868ea7' }}
                >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke={drawingColor ?? '#f0b90b'}>
                        <line x1="1" y1="7" x2="13" y2="7" strokeWidth={lineWidth ?? 1} strokeDasharray={LINE_STYLES.find(s => s.id === lineStyle)?.dashArray || ''} strokeLinecap="round" />
                    </svg>
                </button>
                {showStylePanel && (
                    <Panel style={{ top: 0, width: 160 }}>
                        <PanelLabel>Line Width</PanelLabel>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 10 }}>
                            {[1, 2, 3, 4].map(w => (
                                <button
                                    key={w}
                                    onClick={() => onLineWidthChange?.(w)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 8, padding: '4px 8px', borderRadius: 4, border: 'none',
                                        background: lineWidth === w ? '#2962ff22' : 'transparent',
                                        cursor: 'pointer', color: lineWidth === w ? '#2962ff' : '#868ea7',
                                    }}
                                >
                                    <div style={{ flex: 1, height: w, borderRadius: w, background: lineWidth === w ? '#2962ff' : '#4c535e' }} />
                                    <span style={{ fontSize: 10, fontFamily: 'monospace' }}>{w}px</span>
                                </button>
                            ))}
                        </div>
                        <PanelLabel>Line Style</PanelLabel>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                            {LINE_STYLES.map(s => (
                                <button
                                    key={s.id}
                                    onClick={() => { onLineStyleChange?.(s.id); setShowStylePanel(false) }}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 8, padding: '4px 8px', borderRadius: 4, border: 'none',
                                        background: lineStyle === s.id ? '#2962ff22' : 'transparent',
                                        cursor: 'pointer', color: lineStyle === s.id ? '#2962ff' : '#868ea7',
                                    }}
                                >
                                    <svg width="36" height="8" viewBox="0 0 36 8">
                                        <line x1="0" y1="4" x2="36" y2="4" stroke={lineStyle === s.id ? '#2962ff' : '#868ea7'} strokeWidth="1.5" strokeDasharray={s.dashArray} strokeLinecap="round" />
                                    </svg>
                                    <span style={{ fontSize: 11 }}>{s.label}</span>
                                </button>
                            ))}
                        </div>
                    </Panel>
                )}
            </div>

            {/* ── Divider ── */}
            <Divider />

            {/* ── Magnet ── */}
            <div className="relative w-full flex justify-center">
                <button
                    title={`Magnet: ${magnetMode === 'none' ? 'Off' : magnetMode}`}
                    onClick={() => { setShowMagnet(v => !v); closeAll(); setShowMagnet(true) }}
                    className="w-7 h-7 flex items-center justify-center rounded transition-colors"
                    style={{
                        background: magnetMode !== 'none' ? '#2962ff22' : (showMagnet ? '#2b3139' : 'transparent'),
                        color: magnetMode !== 'none' ? '#2962ff' : '#868ea7',
                    }}
                >
                    {ICONS.magnet_weak}
                </button>
                {showMagnet && (
                    <Panel style={{ top: 0 }}>
                        <ActionItem
                            label="Weak magnet"
                            icon={ICONS.magnet_weak}
                            active={magnetMode === 'weak'}
                            onClick={() => { onMagnetModeChange?.('weak'); setShowMagnet(false) }}
                        />
                        <ActionItem
                            label="Strong magnet"
                            icon={ICONS.magnet_weak}
                            active={magnetMode === 'strong'}
                            onClick={() => { onMagnetModeChange?.('strong'); setShowMagnet(false) }}
                        />
                        <div style={{ height: 1, background: '#2b3139', margin: '4px 0' }} />
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', color: '#868ea7', fontSize: 12 }}>
                            <span style={{ flex: 1 }}>Snap to indicators</span>
                            <Toggle value={snapToIndicators} onChange={setSnapToIndicators} />
                        </div>
                    </Panel>
                )}
            </div>

            {/* ── Keep Drawing ── */}
            <button
                title={keepDrawing ? 'Keep Drawing: ON' : 'Keep Drawing: OFF'}
                onClick={() => onKeepDrawingChange?.(!keepDrawing)}
                className="w-7 h-7 flex items-center justify-center rounded transition-colors"
                style={{
                    background: keepDrawing ? '#2962ff22' : 'transparent',
                    color: keepDrawing ? '#2962ff' : '#868ea7',
                }}
            >
                {ICONS.keep_draw}
            </button>

            {/* ── Divider ── */}
            <Divider />

            {/* ── Lock All ── */}
            <div className="relative w-full flex justify-center">
                <button
                    title={lockedAll ? 'Unlock all drawings' : 'Lock all drawings'}
                    onClick={() => { setShowLockMenu(v => !v); closeAll(); setShowLockMenu(true) }}
                    className="w-7 h-7 flex items-center justify-center rounded transition-colors"
                    style={{
                        background: lockedAll ? '#f0b90b22' : (showLockMenu ? '#2b3139' : 'transparent'),
                        color: lockedAll ? '#f0b90b' : '#868ea7',
                    }}
                >
                    {lockedAll ? ICONS.lock : ICONS.unlock}
                </button>
                {showLockMenu && (
                    <Panel style={{ top: 0 }}>
                        <ActionItem
                            label="Lock all drawings"
                            onClick={() => { onAction?.('toggleLockAll'); setShowLockMenu(false) }}
                            active={lockedAll}
                        />
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', color: '#868ea7', fontSize: 12 }}>
                            <span style={{ flex: 1 }}>Always remove locked drawings</span>
                            <Toggle value={alwaysRemoveLocked} onChange={setAlwaysRemoveLocked} />
                        </div>
                    </Panel>
                )}
            </div>

            {/* ── Hide / Show ── */}
            <div className="relative w-full flex justify-center">
                <button
                    title={hiddenAll ? 'Show all' : 'Hide options'}
                    onClick={() => { setShowHideMenu(v => !v); closeAll(); setShowHideMenu(true) }}
                    className="w-7 h-7 flex items-center justify-center rounded transition-colors"
                    style={{
                        background: hiddenAll ? '#2196f322' : (showHideMenu ? '#2b3139' : 'transparent'),
                        color: hiddenAll ? '#64b5f6' : '#868ea7',
                    }}
                >
                    {hiddenAll ? ICONS.eye_off : ICONS.eye}
                </button>
                {showHideMenu && (
                    <Panel style={{ top: 0 }}>
                        <ActionItem label="Hide options" onClick={() => { onAction?.('hideOptions'); setShowHideMenu(false) }} />
                        <ActionItem label="Hide indicators" onClick={() => { onAction?.('hideIndicators'); setShowHideMenu(false) }} />
                        <ActionItem label="Hide positions and orders" onClick={() => { onAction?.('hidePositions'); setShowHideMenu(false) }} />
                        <ActionItem label="Hide all" active={hiddenAll} onClick={() => { onAction?.('toggleHideAll'); setShowHideMenu(false) }} />
                    </Panel>
                )}
            </div>

            {/* ── Delete ── */}
            <div className="relative w-full flex justify-center">
                <button
                    title={`Remove drawings${drawingCount > 0 ? ` (${drawingCount})` : ''}`}
                    onClick={() => { setShowDeleteMenu(v => !v); closeAll(); setShowDeleteMenu(true) }}
                    className="w-7 h-7 flex items-center justify-center rounded transition-colors"
                    style={{
                        background: showDeleteMenu ? '#f6465d22' : 'transparent',
                        color: drawingCount > 0 ? '#868ea7' : '#3d4350',
                    }}
                >
                    {ICONS.trash}
                </button>
                {showDeleteMenu && (
                    <Panel style={{ top: 0 }}>
                        <ActionItem
                            label={`Remove ${drawingCount} drawings`}
                            onClick={() => { onAction?.('deleteDrawings'); setShowDeleteMenu(false) }}
                            danger
                        />
                        <ActionItem
                            label="Remove 0 indicators"
                            onClick={() => { onAction?.('deleteIndicators'); setShowDeleteMenu(false) }}
                            danger
                        />
                        <ActionItem
                            label={`Remove ${drawingCount} drawings & 0 indicators`}
                            onClick={() => { if (window.confirm(`Remove all ${drawingCount} drawings?`)) { onAction?.('deleteAll'); } setShowDeleteMenu(false) }}
                            danger
                        />
                        <div style={{ height: 1, background: '#2b3139', margin: '4px 0' }} />
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', color: '#868ea7', fontSize: 12 }}>
                            <span style={{ flex: 1 }}>Always remove locked drawings</span>
                            <Toggle value={alwaysRemoveLocked} onChange={v => { setAlwaysRemoveLocked(v); onAction?.('setAlwaysRemoveLocked', v) }} />
                        </div>
                    </Panel>
                )}
            </div>

            {/* Active tool indicator dot */}
            {activeTool && activeTool !== 'cursor' && (
                <div style={{ position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)', width: 5, height: 5, borderRadius: '50%', background: '#2962ff', animation: 'pulse 2s infinite' }} />
            )}
        </div>
    )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Divider() {
    return <div style={{ width: 20, height: 1, background: '#2b3139', margin: '3px 0', flexShrink: 0 }} />
}

function Panel({ children, style = {} }) {
    return (
        <div
            className="absolute left-full top-0 ml-1 z-50 py-1 rounded"
            style={{
                background: '#1e222d',
                border: '1px solid #2b3139',
                boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
                minWidth: 200,
                ...style,
            }}
        >
            {children}
        </div>
    )
}

function PanelLabel({ children }) {
    return (
        <div style={{ fontSize: 9, color: '#4c535e', padding: '4px 12px 6px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
            {children}
        </div>
    )
}

function ToolMenuItem({ tool, activeTool, onClick }) {
    const isActive = activeTool === tool.id
    return (
        <button
            onClick={onClick}
            style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '6px 12px', border: 'none', cursor: 'pointer', textAlign: 'left',
                background: isActive ? '#2962ff22' : 'transparent',
                color: isActive ? '#2962ff' : '#c9d2e3',
                fontSize: 12, borderRadius: 0,
                transition: 'background 0.1s',
            }}
            onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#2b3139' }}
            onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
        >
            <span style={{ width: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: isActive ? '#2962ff' : '#868ea7' }}>
                {ICONS[tool.iconKey] || null}
            </span>
            <span style={{ flex: 1 }}>{tool.label}</span>
            {tool.shortcut && (
                <span style={{ fontSize: 10, color: '#4c535e', background: '#131722', padding: '1px 5px', borderRadius: 3, fontFamily: 'monospace', letterSpacing: '0.02em' }}>
                    {tool.shortcut}
                </span>
            )}
            {tool.hint && (
                <span style={{ fontSize: 10, color: '#4c535e' }}>{tool.hint}</span>
            )}
        </button>
    )
}

function ActionItem({ label, onClick, active = false, danger = false, icon }) {
    return (
        <button
            onClick={onClick}
            style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '6px 12px', border: 'none', cursor: 'pointer', textAlign: 'left',
                background: active ? (danger ? '#f6465d22' : '#2962ff22') : 'transparent',
                color: active ? (danger ? '#f6465d' : '#2962ff') : (danger ? '#868ea7' : '#c9d2e3'),
                fontSize: 12, borderRadius: 0,
                transition: 'background 0.1s',
            }}
            onMouseEnter={e => { if (!active) e.currentTarget.style.background = danger ? '#f6465d11' : '#2b3139' }}
            onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
        >
            {icon && <span style={{ width: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{icon}</span>}
            <span style={{ flex: 1 }}>{label}</span>
        </button>
    )
}

function Toggle({ value, onChange }) {
    return (
        <button
            onClick={() => onChange(!value)}
            style={{
                width: 28, height: 16, borderRadius: 8, border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0,
                background: value ? '#2962ff' : '#2b3139',
                position: 'relative', transition: 'background 0.2s',
            }}
        >
            <span style={{
                position: 'absolute', top: 2, left: value ? 14 : 2,
                width: 12, height: 12, borderRadius: '50%',
                background: '#fff', transition: 'left 0.2s',
            }} />
        </button>
    )
}