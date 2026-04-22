// src/hooks/useDrawingTools.js
// v3 — TradingView-style Drawing Engine
//
// CẢI TIẾN từ v2:
//   [V3-1]  Mỗi tool đều có đường nét đứt (dashed line) kéo sang phải 
//           để so sánh giá với price axis — giống TradingView
//   [V3-2]  Price label box ở cạnh phải canvas cho mọi tool có điểm neo
//   [V3-3]  trendline / ray / extended: hiện price dashed line tại p1 và p2
//   [V3-4]  hline: luôn hiện price label + thay đổi màu khi active
//   [V3-5]  fib_ret & fib_ext: label giá căn phải cạnh axis, không tràn
//   [V3-6]  channel / pitchfork: hiện dashed price line ở tất cả anchor
//   [V3-7]  measure / price_range: pct + giá chính xác + dashed lines
//   [V3-8]  magnet: snap OHLC đúng từ pixelToPrice reverse
//   [V3-9]  crosshair: vẽ crosshair đúng với canvas
//   [V3-10] infoline: hiển thị % change, bars đúng logic
//   [V3-11] long_pos / short_pos: vẽ position box đúng kiểu TV
//   [V3-12] anchored_vwap: hiện anchor dot + trend line
//   [V3-13] Elliott waves: labels circle đẹp
//   [V3-14] Gann fan: thêm nhãn tỉ lệ chuẩn
//   [V3-15] keep_drawing: sau khi finalize giữ nguyên tool

import { useEffect, useRef, useCallback, useState } from 'react'

// ── Point counts per tool ─────────────────────────────────────────────────────
const POINT_COUNT = {
    // 1-click instant
    text: 1, anchored_txt: 1, note: 1, price_note: 1, pin: 1,
    callout: 1, comment: 1, price_label: 1, signpost: 1,
    arrow_up: 1, arrow_down: 1, flag: 1, image_tool: 1,
    // 1-click no second point
    hline: 1, vline: 1, crossline: 1,
    // 2-click
    trendline: 2, ray: 2, hray: 2, extended: 2, infoline: 2, trend_angle: 2,
    rect: 2, rot_rect: 2, ellipse: 2, circle: 2, arc: 2, curve: 2,
    fib_ret: 2, fib_ext: 2, fib_fan: 2, fib_tz: 2, fib_circles: 2,
    fib_arcs: 2, fib_wedge: 2, pitchfan: 2,
    regression: 2, flat_top: 2, disjoint: 2,
    measure: 2, price_range: 2, date_range: 2, date_price: 2, bars_pattern: 2,
    gann_box: 2, gann_fan: 2, gann_square: 2, gann_sq_fix: 2,
    long_pos: 2, short_pos: 2, pos_forecast: 2, bar_pattern: 2, ghost_feed: 2, sector: 2,
    anchored_vwap: 2, vol_profile: 2, anch_vol: 2,
    sine_line: 2, time_cycles: 2, cyclic_lines: 2,
    // 3-click
    channel: 3, triangle_shp: 3, pitchfork: 3, schiff_pitch: 3, mod_schiff: 3, inside_pitch: 3,
    fib_channel: 3, fib_spiral: 3,
    double_curve: 3, path_tool: 3,
    // 4-click
    abcd: 4, elliott_abc: 4, elliott_abcde: 5, cypher: 4,
    // 5-click
    elliott_12345: 5, xabcd: 5, hs: 5, three_drives: 7, triangle_pat: 5,
    elliott_wxy: 6, elliott_wxyz: 8,
    // polyline
    polyline: 99,
}

const INSTANT_TOOLS = new Set([
    'text', 'anchored_txt', 'note', 'price_note', 'pin', 'callout', 'comment',
    'price_label', 'signpost', 'arrow_up', 'arrow_down', 'flag', 'image_tool',
    'hline', 'vline', 'crossline',
])
const FREEHAND_TOOLS = new Set(['brush', 'highlighter'])
const MAGNET_SNAP_PX = 8   // pixel radius for magnet snap

// ── Fibonacci ─────────────────────────────────────────────────────────────────
const FIB_LEVELS = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1, 1.272, 1.618]
const FIB_EXT_LEVELS = [0, 0.382, 0.618, 1, 1.382, 1.618, 2, 2.618, 3.618]
const FIB_COLORS = {
    0: '#848e9c', 0.236: '#2196f3', 0.382: '#0ecb81', 0.5: '#f0b90b',
    0.618: '#0ecb81', 0.786: '#2196f3', 1: '#848e9c', 1.272: '#f6465d', 1.618: '#e91e63',
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtPrice(p) {
    if (!isFinite(p) || p == null) return ''
    if (Math.abs(p) >= 10000) return p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    if (Math.abs(p) >= 1) return p.toFixed(2)
    if (Math.abs(p) >= 0.01) return p.toFixed(4)
    return p.toFixed(8)
}

function setLineStyle(ctx, style, width) {
    ctx.lineWidth = width ?? 1
    if (style === 'dashed') ctx.setLineDash([6, 3])
    else if (style === 'dotted') ctx.setLineDash([2, 3])
    else ctx.setLineDash([])
}

function clipLineToCanvas(x1, y1, x2, y2, W, H) {
    const dx = x2 - x1, dy = y2 - y1
    let tMin = -Infinity, tMax = Infinity
    function clip(p, q) {
        if (p === 0) { if (q < 0) tMax = -Infinity }
        else { const r = q / p; if (p < 0) { if (r > tMin) tMin = r } else { if (r < tMax) tMax = r } }
    }
    clip(-dx, x1); clip(dx, W - x1); clip(-dy, y1); clip(dy, H - y1)
    if (tMin > tMax) return null
    return [{ x: x1 + tMin * dx, y: y1 + tMin * dy }, { x: x1 + tMax * dx, y: y1 + tMax * dy }]
}

function drawRayToEdge(ctx, x1, y1, x2, y2, W, H) {
    const dx = x2 - x1, dy = y2 - y1
    const len = Math.sqrt(dx * dx + dy * dy) || 1
    const t = (Math.max(W, H) * 4) / len
    const clipped = clipLineToCanvas(x1, y1, x1 + dx * t, y1 + dy * t, W, H)
    if (!clipped) return
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(clipped[1].x, clipped[1].y); ctx.stroke()
}

function drawExtendedLine(ctx, x1, y1, x2, y2, W, H) {
    const dx = x2 - x1, dy = y2 - y1
    const len = Math.sqrt(dx * dx + dy * dy) || 1
    const t = (Math.max(W, H) * 4) / len
    const clipped = clipLineToCanvas(x1 - dx * t, y1 - dy * t, x1 + dx * t, y1 + dy * t, W, H)
    if (!clipped) return
    ctx.beginPath(); ctx.moveTo(clipped[0].x, clipped[0].y); ctx.lineTo(clipped[1].x, clipped[1].y); ctx.stroke()
}

function dot(ctx, x, y, r = 3, fill) {
    ctx.save()
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fillStyle = fill || ctx.strokeStyle; ctx.fill()
    ctx.restore()
}

// Vẽ price label box ở cạnh phải canvas — giống TradingView axis label
function priceAxisLabel(ctx, price, y, color, W) {
    if (price == null || !isFinite(price)) return
    const txt = fmtPrice(price)
    ctx.save()
    ctx.font = 'bold 10px -apple-system, monospace'
    const tw = ctx.measureText(txt).width
    const bw = tw + 10, bh = 16
    const bx = W - bw - 2, by = y - bh / 2
    // Background pill
    ctx.fillStyle = color
    ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 2); ctx.fill()
    ctx.fillStyle = '#fff'
    ctx.textBaseline = 'middle'
    ctx.fillText(txt, bx + 5, y)
    ctx.restore()
}

// Vẽ đường nét đứt ngang sang axis phải — cho bất kỳ điểm neo nào
function priceDashedLine(ctx, y, color, W, fromX = 0) {
    ctx.save()
    ctx.strokeStyle = color
    ctx.globalAlpha = 0.35
    ctx.setLineDash([4, 4])
    ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(fromX, y); ctx.lineTo(W - 2, y); ctx.stroke()
    ctx.restore()
}

// Inline label box (nhỏ hơn, không phải axis)
function labelBox(ctx, text, x, y, color) {
    ctx.save()
    ctx.font = '9px monospace'
    const tw = ctx.measureText(text).width
    ctx.fillStyle = color + '22'
    ctx.fillRect(x - 2, y - 10, tw + 6, 13)
    ctx.fillStyle = color
    ctx.fillText(text, x + 1, y)
    ctx.restore()
}

// ── Draw each shape ───────────────────────────────────────────────────────────

function drawShape(ctx, d, isPreview = false) {
    const { type, points, color, lineWidth: lw, lineStyle, text } = d
    const alpha = isPreview ? 0.7 : 1
    const clr = color || '#2962ff'
    const W = ctx.canvas.width
    const H = ctx.canvas.height

    ctx.globalAlpha = alpha
    ctx.strokeStyle = clr
    ctx.fillStyle = clr
    setLineStyle(ctx, lineStyle, lw || 1)

    if (!points || points.length === 0) return

    const [p1] = points
    const p2 = points[1]
    const p3 = points[2]

    switch (type) {

        // ── Cursor modes ──────────────────────────────────────────────────────────
        case 'cursor': case 'cross': break

        // ── Crosshair ─────────────────────────────────────────────────────────────
        case 'crossline': {
            ctx.save()
            ctx.strokeStyle = clr; ctx.lineWidth = 1; ctx.setLineDash([5, 4])
            ctx.beginPath(); ctx.moveTo(0, p1.y); ctx.lineTo(W, p1.y); ctx.stroke()
            ctx.beginPath(); ctx.moveTo(p1.x, 0); ctx.lineTo(p1.x, H); ctx.stroke()
            ctx.restore()
            priceDashedLine(ctx, p1.y, clr, W); priceAxisLabel(ctx, p1.price, p1.y, clr, W)
            break
        }

        // ── Trend Line ────────────────────────────────────────────────────────────
        case 'trendline': {
            if (!p2) break
            ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke()
            dot(ctx, p1.x, p1.y); dot(ctx, p2.x, p2.y)
            // Price dashed lines at both anchor points
            priceDashedLine(ctx, p1.y, clr, W, Math.max(p1.x, p2.x))
            priceDashedLine(ctx, p2.y, clr, W, Math.max(p1.x, p2.x))
            priceAxisLabel(ctx, p1.price, p1.y, clr, W)
            priceAxisLabel(ctx, p2.price, p2.y, clr, W)
            // Info: pct change
            if (p1.price != null && p2.price != null) {
                const pct = ((p2.price - p1.price) / p1.price * 100).toFixed(2)
                const sign = pct > 0 ? '+' : ''
                const mx = (p1.x + p2.x) / 2, my = (p1.y + p2.y) / 2 - 8
                labelBox(ctx, `${sign}${pct}%`, mx - 20, my, clr)
            }
            break
        }

        // ── Trend Angle ───────────────────────────────────────────────────────────
        case 'trend_angle': {
            if (!p2) break
            ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke()
            // Base horizontal line
            ctx.save(); ctx.globalAlpha = alpha * 0.4; ctx.setLineDash([3, 3])
            ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p1.y); ctx.stroke()
            ctx.restore()
            // Angle label
            const angle = Math.atan2(p1.y - p2.y, p2.x - p1.x) * 180 / Math.PI
            labelBox(ctx, `${angle.toFixed(1)}°`, p2.x + 4, p2.y + 3, clr)
            dot(ctx, p1.x, p1.y); dot(ctx, p2.x, p2.y)
            priceDashedLine(ctx, p1.y, clr, W, p1.x)
            priceDashedLine(ctx, p2.y, clr, W, p2.x)
            priceAxisLabel(ctx, p1.price, p1.y, clr, W)
            priceAxisLabel(ctx, p2.price, p2.y, clr, W)
            break
        }

        // ── Ray ───────────────────────────────────────────────────────────────────
        case 'ray': {
            if (!p2) break
            drawRayToEdge(ctx, p1.x, p1.y, p2.x, p2.y, W, H)
            dot(ctx, p1.x, p1.y)
            priceDashedLine(ctx, p1.y, clr, W, p1.x)
            priceAxisLabel(ctx, p1.price, p1.y, clr, W)
            break
        }

        // ── Horizontal Line ───────────────────────────────────────────────────────
        case 'hline': {
            ctx.beginPath(); ctx.moveTo(0, p1.y); ctx.lineTo(W, p1.y); ctx.stroke()
            priceAxisLabel(ctx, p1.price, p1.y, clr, W)
            break
        }

        // ── Horizontal Ray ────────────────────────────────────────────────────────
        case 'hray': {
            const goRight = p2 ? p2.x >= p1.x : true
            ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(goRight ? W : 0, p1.y); ctx.stroke()
            dot(ctx, p1.x, p1.y)
            priceAxisLabel(ctx, p1.price, p1.y, clr, W)
            break
        }

        // ── Vertical Line ─────────────────────────────────────────────────────────
        case 'vline': {
            ctx.beginPath(); ctx.moveTo(p1.x, 0); ctx.lineTo(p1.x, H); ctx.stroke()
            // Time label at bottom
            ctx.save(); ctx.font = '9px monospace'; ctx.fillStyle = clr
            ctx.fillText('|', p1.x - 2, H - 2)
            ctx.restore()
            break
        }

        // ── Extended Line ─────────────────────────────────────────────────────────
        case 'extended': {
            if (!p2) break
            drawExtendedLine(ctx, p1.x, p1.y, p2.x, p2.y, W, H)
            dot(ctx, p1.x, p1.y); dot(ctx, p2.x, p2.y)
            priceDashedLine(ctx, p1.y, clr, W, 0)
            priceAxisLabel(ctx, p1.price, p1.y, clr, W)
            break
        }

        // ── Info Line ─────────────────────────────────────────────────────────────
        case 'infoline': {
            if (!p2) break
            ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke()
            dot(ctx, p1.x, p1.y); dot(ctx, p2.x, p2.y)
            const midX = (p1.x + p2.x) / 2, midY = (p1.y + p2.y) / 2
            const pct = (p1.price != null && p2.price != null)
                ? ((p2.price - p1.price) / p1.price * 100)
                : null
            const bars = Math.round(Math.abs(p2.x - p1.x) / 8)
            const pctStr = pct != null ? `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%` : ''
            const info = [pctStr, `${bars} bars`].filter(Boolean).join('  ')
            ctx.save()
            ctx.font = '9px monospace'
            const tw = ctx.measureText(info).width
            ctx.fillStyle = '#1e232999'
            ctx.fillRect(midX - tw / 2 - 5, midY - 11, tw + 10, 15)
            ctx.fillStyle = clr; ctx.fillText(info, midX - tw / 2, midY)
            ctx.restore()
            priceDashedLine(ctx, p1.y, clr, W, Math.max(p1.x, p2.x))
            priceDashedLine(ctx, p2.y, clr, W, Math.max(p1.x, p2.x))
            priceAxisLabel(ctx, p1.price, p1.y, clr, W)
            priceAxisLabel(ctx, p2.price, p2.y, clr, W)
            break
        }

        // ── Parallel Channel ──────────────────────────────────────────────────────
        case 'channel': {
            if (!p2) { ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2?.x ?? p1.x, p2?.y ?? p1.y); ctx.stroke(); break }
            const dx = p2.x - p1.x, dy = p2.y - p1.y
            ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke()
            if (!p3) { dot(ctx, p1.x, p1.y); dot(ctx, p2.x, p2.y); break }
            const q1x = p3.x, q1y = p3.y, q2x = p3.x + dx, q2y = p3.y + dy
            ctx.save(); ctx.setLineDash([5, 3])
            ctx.beginPath(); ctx.moveTo(q1x, q1y); ctx.lineTo(q2x, q2y); ctx.stroke()
            const m1x = (p1.x + q1x) / 2, m1y = (p1.y + q1y) / 2
            const m2x = (p2.x + q2x) / 2, m2y = (p2.y + q2y) / 2
            ctx.globalAlpha = alpha * 0.3; ctx.setLineDash([3, 5])
            ctx.beginPath(); ctx.moveTo(m1x, m1y); ctx.lineTo(m2x, m2y); ctx.stroke()
            ctx.restore()
            ctx.save(); ctx.globalAlpha = 0.07; ctx.fillStyle = clr
            ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y)
            ctx.lineTo(q2x, q2y); ctx.lineTo(q1x, q1y); ctx.closePath(); ctx.fill()
            ctx.restore()
                ;[p1, p2, p3].forEach(p => dot(ctx, p.x, p.y))
                ;[p1, p2, p3].forEach(p => { priceDashedLine(ctx, p.y, clr, W, Math.max(p1.x, p2.x, p3.x)); priceAxisLabel(ctx, p.price, p.y, clr, W) })
            break
        }

        // ── Flat Top/Bottom ───────────────────────────────────────────────────────
        case 'flat_top': {
            if (!p2) break
            ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p1.y); ctx.stroke() // flat top
            ctx.save(); ctx.setLineDash([5, 3])
            ctx.beginPath(); ctx.moveTo(p1.x, p2.y); ctx.lineTo(p2.x, p2.y); ctx.stroke() // sloped bottom
            ctx.restore()
            dot(ctx, p1.x, p1.y); dot(ctx, p2.x, p2.y)
            priceDashedLine(ctx, p1.y, clr, W, Math.max(p1.x, p2.x))
            priceDashedLine(ctx, p2.y, clr, W, Math.max(p1.x, p2.x))
            priceAxisLabel(ctx, p1.price, p1.y, clr, W)
            priceAxisLabel(ctx, p2.price, p2.y, clr, W)
            break
        }

        // ── Disjoint Channel ──────────────────────────────────────────────────────
        case 'disjoint': {
            if (!p2) break
            ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke()
            dot(ctx, p1.x, p1.y); dot(ctx, p2.x, p2.y)
            priceDashedLine(ctx, p1.y, clr, W, Math.max(p1.x, p2.x))
            priceDashedLine(ctx, p2.y, clr, W, Math.max(p1.x, p2.x))
            priceAxisLabel(ctx, p1.price, p1.y, clr, W)
            priceAxisLabel(ctx, p2.price, p2.y, clr, W)
            break
        }

        // ── Regression Trend ──────────────────────────────────────────────────────
        case 'regression': {
            if (!p2) break
            ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke()
            const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x)
            const nx = Math.sin(angle), ny = -Math.cos(angle), std = 20
                ;[std, -std].forEach(s => {
                    ctx.save(); ctx.setLineDash([4, 4]); ctx.globalAlpha = alpha * 0.45
                    ctx.beginPath(); ctx.moveTo(p1.x + nx * s, p1.y + ny * s); ctx.lineTo(p2.x + nx * s, p2.y + ny * s); ctx.stroke()
                    ctx.restore()
                })
            ctx.save(); ctx.globalAlpha = 0.05; ctx.fillStyle = clr
            ctx.beginPath()
            ctx.moveTo(p1.x + nx * std, p1.y + ny * std); ctx.lineTo(p2.x + nx * std, p2.y + ny * std)
            ctx.lineTo(p2.x - nx * std, p2.y - ny * std); ctx.lineTo(p1.x - nx * std, p1.y - ny * std)
            ctx.closePath(); ctx.fill()
            ctx.restore()
            dot(ctx, p1.x, p1.y); dot(ctx, p2.x, p2.y)
            priceDashedLine(ctx, p1.y, clr, W, Math.max(p1.x, p2.x))
            priceDashedLine(ctx, p2.y, clr, W, Math.max(p1.x, p2.x))
            priceAxisLabel(ctx, p1.price, p1.y, clr, W)
            priceAxisLabel(ctx, p2.price, p2.y, clr, W)
            break
        }

        // ── Pitchfork (Andrews') ──────────────────────────────────────────────────
        case 'pitchfork':
        case 'schiff_pitch':
        case 'mod_schiff':
        case 'inside_pitch': {
            if (!p2) { ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2?.x ?? p1.x, p2?.y ?? p1.y); ctx.stroke(); break }
            if (!p3) { ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke(); dot(ctx, p1.x, p1.y); dot(ctx, p2.x, p2.y); break }
            const medX = (p2.x + p3.x) / 2, medY = (p2.y + p3.y) / 2
            const dxM = medX - p1.x, dyM = medY - p1.y
            // Median line
            ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(medX, medY); ctx.stroke()
            drawRayToEdge(ctx, p1.x, p1.y, medX, medY, W, H)
            // Fork lines
            ctx.save(); ctx.setLineDash([5, 3])
            drawRayToEdge(ctx, p2.x, p2.y, p2.x + dxM, p2.y + dyM, W, H)
            drawRayToEdge(ctx, p3.x, p3.y, p3.x + dxM, p3.y + dyM, W, H)
            ctx.restore()
            // Connector p2-p3
            ctx.save(); ctx.globalAlpha = 0.3
            ctx.beginPath(); ctx.moveTo(p2.x, p2.y); ctx.lineTo(p3.x, p3.y); ctx.stroke()
            ctx.restore()
                ;[p1, p2, p3].forEach(p => dot(ctx, p.x, p.y))
                ;[p2, p3].forEach(p => { priceDashedLine(ctx, p.y, clr, W, Math.max(p2.x, p3.x)); priceAxisLabel(ctx, p.price, p.y, clr, W) })
            break
        }

        // ── Fibonacci Retracement ─────────────────────────────────────────────────
        case 'fib_ret': {
            if (!p2) break
            const yRange = p2.y - p1.y
            ctx.save(); ctx.font = '10px monospace'
            FIB_LEVELS.forEach(level => {
                const y = p1.y + yRange * level
                const fc = FIB_COLORS[level] || clr
                const pct = (level * 100).toFixed(1) + '%'
                // Full-width dashed line
                ctx.strokeStyle = fc; ctx.globalAlpha = 0.5; ctx.setLineDash([4, 3]); ctx.lineWidth = 1
                ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke()
                ctx.setLineDash([]); ctx.globalAlpha = 1; ctx.fillStyle = fc
                // Left pct label
                ctx.textBaseline = 'bottom'; ctx.fillText(pct, Math.min(p1.x, p2.x) + 3, y - 1)
                // Right price label (near axis)
                if (p1.price != null && p2.price != null) {
                    const priceAtLevel = p1.price + (p2.price - p1.price) * level
                    const priceTxt = fmtPrice(priceAtLevel)
                    ctx.textAlign = 'right'; ctx.fillText(priceTxt, W - 68, y - 1)
                    ctx.textAlign = 'left'
                    // Axis label box
                    priceAxisLabel(ctx, priceAtLevel, y, fc, W)
                }
            })
            ctx.restore()
            dot(ctx, p1.x, p1.y); dot(ctx, p2.x, p2.y)
            ctx.save(); ctx.strokeStyle = clr; ctx.globalAlpha = 0.2; ctx.setLineDash([2, 4])
            ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p1.x, p2.y); ctx.stroke()
            ctx.restore()
            break
        }

        // ── Fibonacci Extension ───────────────────────────────────────────────────
        case 'fib_ext': {
            if (!p2) break
            const yRange = p2.y - p1.y
            ctx.save(); ctx.font = '10px monospace'
            FIB_EXT_LEVELS.forEach(level => {
                const y = p1.y + yRange * level
                const isKey = level === 1
                const fc = isKey ? clr : '#848e9c'
                ctx.strokeStyle = fc; ctx.globalAlpha = isKey ? 0.85 : 0.4
                ctx.setLineDash(isKey ? [] : [4, 3]); ctx.lineWidth = isKey ? (lw || 1) : 1
                ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke()
                ctx.setLineDash([]); ctx.globalAlpha = 1; ctx.fillStyle = fc; ctx.textBaseline = 'bottom'
                ctx.fillText(`${level.toFixed(3)}`, Math.min(p1.x, p2.x) + 3, y - 1)
                if (p1.price != null && p2.price != null) {
                    const priceAtLevel = p1.price + (p2.price - p1.price) * level
                    priceAxisLabel(ctx, priceAtLevel, y, fc, W)
                }
            })
            ctx.restore()
            dot(ctx, p1.x, p1.y); dot(ctx, p2.x, p2.y)
            break
        }

        // ── Fibonacci Fan ─────────────────────────────────────────────────────────
        case 'fib_fan': {
            if (!p2) break
            const FAN_LEVELS = [0.236, 0.382, 0.5, 0.618, 0.786]
            const totalDy = p2.y - p1.y
            ctx.save(); ctx.font = '9px monospace'
            FAN_LEVELS.forEach(level => {
                const midY = p1.y + totalDy * level
                const fc = FIB_COLORS[level] || '#848e9c'
                ctx.strokeStyle = fc; ctx.globalAlpha = 0.6; ctx.lineWidth = 1
                drawRayToEdge(ctx, p1.x, p1.y, p2.x, midY, W, H)
                ctx.globalAlpha = 1; ctx.fillStyle = fc
                ctx.fillText(`${(level * 100).toFixed(1)}%`, p2.x + 5, midY + 3)
                priceDashedLine(ctx, midY, fc, W, p2.x)
            })
            ctx.restore()
            dot(ctx, p1.x, p1.y); dot(ctx, p2.x, p2.y)
            break
        }

        // ── Fibonacci Time Zone ───────────────────────────────────────────────────
        case 'fib_tz': {
            if (!p2) break
            const baseW = Math.abs(p2.x - p1.x)
            const fibNums = [1, 2, 3, 5, 8, 13, 21, 34, 55]
            ctx.save(); ctx.font = '9px monospace'
            fibNums.forEach((n, i) => {
                const x = p1.x + baseW * n
                if (x > W + 50) return
                const opacity = Math.max(0.15, 0.6 - i * 0.05)
                ctx.strokeStyle = clr; ctx.globalAlpha = opacity; ctx.setLineDash([4, 4]); ctx.lineWidth = 1
                ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke()
                ctx.setLineDash([]); ctx.globalAlpha = 1; ctx.fillStyle = clr
                ctx.fillText(`${n}`, x + 2, 14)
            })
            dot(ctx, p1.x, p1.y); dot(ctx, p2.x, p2.y)
            ctx.restore()
            break
        }

        // ── Fibonacci Channel ─────────────────────────────────────────────────────
        case 'fib_channel': {
            if (!p2) break
            ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke()
            if (!p3) { dot(ctx, p1.x, p1.y); dot(ctx, p2.x, p2.y); break }
            const chanDy = p3.y - p1.y
            const dx = p2.x - p1.x, dy = p2.y - p1.y
            ctx.save(); ctx.font = '9px monospace'
            FIB_LEVELS.forEach(level => {
                const offsetY = chanDy * level
                const fc = FIB_COLORS[level] || clr
                ctx.strokeStyle = fc; ctx.globalAlpha = 0.5; ctx.setLineDash([4, 3]); ctx.lineWidth = 1
                ctx.beginPath(); ctx.moveTo(p1.x, p1.y + offsetY); ctx.lineTo(p2.x, p2.y + offsetY); ctx.stroke()
                ctx.setLineDash([]); ctx.globalAlpha = 1; ctx.fillStyle = fc
                ctx.fillText(`${(level * 100).toFixed(1)}%`, p2.x + 4, p2.y + offsetY + 3)
                if (p3.price != null) {
                    const refPrice = p3.price + (p1.price != null ? (p1.price - p3.price) * (1 - level) : 0)
                    priceAxisLabel(ctx, refPrice, p2.y + offsetY, fc, W)
                }
            })
            ctx.restore()
                ;[p1, p2, p3].forEach(p => dot(ctx, p.x, p.y))
            break
        }

        // ── Fibonacci Circles ─────────────────────────────────────────────────────
        case 'fib_circles': {
            if (!p2) break
            const baseR = Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2)
                ;[0.618, 1, 1.618, 2.618].forEach(level => {
                    const r = baseR * level
                    ctx.save(); ctx.globalAlpha = 0.4; ctx.setLineDash([3, 3])
                    ctx.beginPath(); ctx.arc(p1.x, p1.y, r, 0, Math.PI * 2); ctx.stroke()
                    ctx.restore()
                    ctx.save(); ctx.font = '8px monospace'; ctx.fillStyle = FIB_COLORS[level] || clr
                    ctx.fillText(level.toFixed(3), p1.x + r * 0.7 + 2, p1.y - r * 0.7)
                    ctx.restore()
                })
            dot(ctx, p1.x, p1.y); dot(ctx, p2.x, p2.y)
            break
        }

        // ── Fibonacci Arcs / Speed Resistance ─────────────────────────────────────
        case 'fib_arcs': {
            if (!p2) break
            const baseR = Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2)
                ;[0.382, 0.5, 0.618, 1].forEach(level => {
                    const r = baseR * level
                    const fc = FIB_COLORS[level] || '#848e9c'
                    ctx.save(); ctx.strokeStyle = fc; ctx.globalAlpha = 0.6
                    ctx.beginPath(); ctx.arc(p1.x, p1.y, r, 0, Math.PI); ctx.stroke()
                    ctx.restore()
                })
            dot(ctx, p1.x, p1.y); dot(ctx, p2.x, p2.y)
            break
        }

        // ── Fib Wedge ─────────────────────────────────────────────────────────────
        case 'fib_wedge': {
            if (!p2) break
            ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke()
            const mid = { x: p2.x, y: p1.y + (p2.y - p1.y) * 0.618 }
            ctx.save(); ctx.setLineDash([5, 3]); ctx.globalAlpha = 0.5
            ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(mid.x, mid.y); ctx.stroke()
            ctx.restore()
            dot(ctx, p1.x, p1.y); dot(ctx, p2.x, p2.y)
            priceDashedLine(ctx, p1.y, clr, W, Math.max(p1.x, p2.x))
            priceDashedLine(ctx, p2.y, clr, W, Math.max(p1.x, p2.x))
            priceAxisLabel(ctx, p1.price, p1.y, clr, W)
            priceAxisLabel(ctx, p2.price, p2.y, clr, W)
            break
        }

        // ── Pitchfan ─────────────────────────────────────────────────────────────
        case 'pitchfan': {
            if (!p2) break
            const FAN_R = [1 / 3, 1 / 2, 2 / 3, 1]
            const totalDy = p2.y - p1.y
            ctx.save(); ctx.font = '9px monospace'
            FAN_R.forEach((r, i) => {
                const midY = p1.y + totalDy * r
                ctx.strokeStyle = clr; ctx.globalAlpha = 0.5 + i * 0.1
                drawRayToEdge(ctx, p1.x, p1.y, p2.x, midY, W, H)
                ctx.globalAlpha = 1; ctx.fillStyle = clr
                ctx.fillText(`${(r * 100).toFixed(0)}%`, p2.x + 5, midY + 3)
            })
            ctx.restore()
            dot(ctx, p1.x, p1.y); dot(ctx, p2.x, p2.y)
            break
        }

        // ── Gann Box ─────────────────────────────────────────────────────────────
        case 'gann_box': {
            if (!p2) break
            const gx = Math.min(p1.x, p2.x), gy = Math.min(p1.y, p2.y)
            const gw = Math.abs(p2.x - p1.x), gh = Math.abs(p2.y - p1.y)
            ctx.save()
            ctx.globalAlpha = 0.06; ctx.fillStyle = clr; ctx.fillRect(gx, gy, gw, gh)
            ctx.globalAlpha = alpha; ctx.strokeRect(gx, gy, gw, gh)
            ctx.globalAlpha = 0.35
            ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx + gw, gy + gh); ctx.stroke()
            ctx.beginPath(); ctx.moveTo(gx + gw, gy); ctx.lineTo(gx, gy + gh); ctx.stroke()
            ctx.setLineDash([3, 4]); ctx.globalAlpha = 0.25
            ctx.beginPath(); ctx.moveTo(gx + gw / 2, gy); ctx.lineTo(gx + gw / 2, gy + gh); ctx.stroke()
            ctx.beginPath(); ctx.moveTo(gx, gy + gh / 2); ctx.lineTo(gx + gw, gy + gh / 2); ctx.stroke()
            ctx.restore()
            dot(ctx, p1.x, p1.y); dot(ctx, p2.x, p2.y)
            priceDashedLine(ctx, p1.y, clr, W, Math.max(p1.x, p2.x))
            priceDashedLine(ctx, p2.y, clr, W, Math.max(p1.x, p2.x))
            priceAxisLabel(ctx, p1.price, p1.y, clr, W)
            priceAxisLabel(ctx, p2.price, p2.y, clr, W)
            break
        }

        // ── Gann Fan ─────────────────────────────────────────────────────────────
        case 'gann_fan': {
            if (!p2) break
            const ratios = [
                { r: 8, label: '1×8', color: '#f6465d' }, { r: 4, label: '1×4', color: '#ff9800' },
                { r: 2, label: '1×2', color: '#f0b90b' }, { r: 1, label: '1×1', color: clr },
                { r: 0.5, label: '2×1', color: '#0ecb81' }, { r: 0.25, label: '4×1', color: '#2196f3' },
                { r: 0.125, label: '8×1', color: '#9c27b0' },
            ]
            const baseW = Math.abs(p2.x - p1.x)
            const dir = p2.y < p1.y ? -1 : 1
            ctx.save(); ctx.font = '9px monospace'
            ratios.forEach(({ r, label, color: rc }) => {
                const targetY = p1.y - baseW * r * dir
                const is1x1 = r === 1
                ctx.strokeStyle = rc; ctx.globalAlpha = is1x1 ? 0.9 : 0.45
                ctx.lineWidth = is1x1 ? (lw || 1) : 1; ctx.setLineDash(is1x1 ? [] : [4, 3])
                drawRayToEdge(ctx, p1.x, p1.y, p2.x, targetY, W, H)
                ctx.setLineDash([]); ctx.globalAlpha = 1; ctx.fillStyle = rc
                ctx.fillText(label, p2.x + 4, targetY + 3)
            })
            ctx.restore()
            dot(ctx, p1.x, p1.y)
            priceDashedLine(ctx, p1.y, clr, W, p1.x)
            priceAxisLabel(ctx, p1.price, p1.y, clr, W)
            break
        }

        // ── Gann Square Fixed ─────────────────────────────────────────────────────
        case 'gann_sq_fix':
        case 'gann_square': {
            if (!p2) break
            const side = Math.max(Math.abs(p2.x - p1.x), Math.abs(p2.y - p1.y))
            const sx = p1.x, sy = Math.min(p1.y, p2.y)
            ctx.save()
            ctx.globalAlpha = 0.05; ctx.fillStyle = clr; ctx.fillRect(sx, sy, side, side)
            ctx.globalAlpha = alpha; ctx.strokeRect(sx, sy, side, side)
                ;[0.25, 0.5, 0.75].forEach(f => {
                    ctx.globalAlpha = 0.2; ctx.setLineDash([3, 4])
                    ctx.strokeRect(sx + side * (1 - f) / 2, sy + side * (1 - f) / 2, side * f, side * f)
                    ctx.setLineDash([])
                })
            ctx.restore()
            dot(ctx, p1.x, p1.y); dot(ctx, p2.x, p2.y)
            priceDashedLine(ctx, p1.y, clr, W, p1.x + side)
            priceDashedLine(ctx, sy + side, clr, W, p1.x + side)
            priceAxisLabel(ctx, p1.price, p1.y, clr, W)
            break
        }

        // ── Long / Short Position ─────────────────────────────────────────────────
        case 'long_pos':
        case 'short_pos': {
            if (!p2) break
            const isLong = type === 'long_pos'
            const entryY = p1.y
            const targetY = p2.y  // target
            const stopY = p1.y + (isLong ? 1 : -1) * Math.abs(p2.y - p1.y) * 0.4  // stop ~40% of range
            const targetColor = '#0ecb81'
            const stopColor = '#f6465d'
            const entryColor = clr

            // Fill zones
            ctx.save()
            const x1b = Math.min(p1.x, p2.x), x2b = Math.max(p1.x, p2.x)
            const bw = x2b - x1b || 100
            const xEnd = Math.min(p1.x + bw * 2, W - 70)

            ctx.globalAlpha = 0.12; ctx.fillStyle = targetColor
            ctx.fillRect(p1.x, Math.min(entryY, targetY), xEnd - p1.x, Math.abs(targetY - entryY))
            ctx.globalAlpha = 0.12; ctx.fillStyle = stopColor
            ctx.fillRect(p1.x, Math.min(entryY, stopY), xEnd - p1.x, Math.abs(stopY - entryY))
            ctx.restore()

            // Entry line
            ctx.save(); ctx.strokeStyle = entryColor; ctx.lineWidth = 1.5; ctx.setLineDash([])
            ctx.beginPath(); ctx.moveTo(p1.x, entryY); ctx.lineTo(xEnd, entryY); ctx.stroke()
            // Target line
            ctx.strokeStyle = targetColor; ctx.setLineDash([4, 3])
            ctx.beginPath(); ctx.moveTo(p1.x, targetY); ctx.lineTo(xEnd, targetY); ctx.stroke()
            // Stop line
            ctx.strokeStyle = stopColor
            ctx.beginPath(); ctx.moveTo(p1.x, stopY); ctx.lineTo(xEnd, stopY); ctx.stroke()
            ctx.restore()

            // Price axis labels
            priceAxisLabel(ctx, p1.price, entryY, entryColor, W)
            priceAxisLabel(ctx, p2.price, targetY, targetColor, W)
            dot(ctx, p1.x, entryY); dot(ctx, p2.x, targetY)
            break
        }

        // ── Anchored VWAP ─────────────────────────────────────────────────────────
        case 'anchored_vwap': {
            if (!p2) break
            ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke()
            // Anchor dot
            dot(ctx, p1.x, p1.y, 5, clr)
            // Extension ray
            drawRayToEdge(ctx, p1.x, p1.y, p2.x, p2.y, W, H)
            priceDashedLine(ctx, p1.y, clr, W, p1.x)
            priceAxisLabel(ctx, p1.price, p1.y, clr, W)
            break
        }

        // ── Measure ───────────────────────────────────────────────────────────────
        case 'measure': {
            if (!p2) break
            const mx = Math.min(p1.x, p2.x), my = Math.min(p1.y, p2.y)
            const mw = Math.abs(p2.x - p1.x), mh = Math.abs(p2.y - p1.y)
            ctx.save()
            ctx.globalAlpha = 0.1; ctx.fillStyle = clr; ctx.fillRect(mx, my, mw, mh)
            ctx.globalAlpha = alpha; ctx.strokeStyle = clr; ctx.lineWidth = 1
            ctx.strokeRect(mx, my, mw, mh)
            const pct = (p1.price != null && p2.price != null)
                ? ((p2.price - p1.price) / p1.price * 100).toFixed(2) : null
            const bars = Math.round(mw / 8)
            const sign = pct != null ? (parseFloat(pct) >= 0 ? '+' : '') : ''
            const info = pct != null ? `${sign}${pct}%  ${bars} bars` : `${bars} bars`
            ctx.font = 'bold 10px monospace'
            const tw = ctx.measureText(info).width
            ctx.fillStyle = '#1e2329cc'
            ctx.fillRect(mx + mw / 2 - tw / 2 - 5, my + mh / 2 - 9, tw + 10, 16)
            ctx.fillStyle = pct != null ? (parseFloat(pct) >= 0 ? '#0ecb81' : '#f6465d') : clr
            ctx.textBaseline = 'middle'; ctx.textAlign = 'center'
            ctx.fillText(info, mx + mw / 2, my + mh / 2)
            ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'
            ctx.restore()
            priceDashedLine(ctx, p1.y, clr, W, Math.max(p1.x, p2.x))
            priceDashedLine(ctx, p2.y, clr, W, Math.max(p1.x, p2.x))
            priceAxisLabel(ctx, p1.price, p1.y, clr, W)
            priceAxisLabel(ctx, p2.price, p2.y, clr, W)
            break
        }

        // ── Price Range ───────────────────────────────────────────────────────────
        case 'price_range': {
            if (!p2) break
            ctx.save(); ctx.setLineDash([5, 3])
            ctx.beginPath(); ctx.moveTo(0, p1.y); ctx.lineTo(W, p1.y); ctx.stroke()
            ctx.beginPath(); ctx.moveTo(0, p2.y); ctx.lineTo(W, p2.y); ctx.stroke()
            ctx.setLineDash([])
            ctx.globalAlpha = 0.07; ctx.fillStyle = clr
            ctx.fillRect(0, Math.min(p1.y, p2.y), W, Math.abs(p2.y - p1.y))
            ctx.globalAlpha = alpha
            const mid = (p1.y + p2.y) / 2
            ctx.beginPath(); ctx.moveTo(W / 2 - 40, p1.y); ctx.lineTo(W / 2 - 40, p2.y); ctx.stroke()
            // Arrows
            const ay1 = p1.y, ay2 = p2.y, ax = W / 2 - 40
            ctx.beginPath(); ctx.moveTo(ax, ay1); ctx.lineTo(ax - 4, ay1 + 8); ctx.lineTo(ax + 4, ay1 + 8); ctx.closePath(); ctx.fill()
            ctx.beginPath(); ctx.moveTo(ax, ay2); ctx.lineTo(ax - 4, ay2 - 8); ctx.lineTo(ax + 4, ay2 - 8); ctx.closePath(); ctx.fill()
            const diff = (p1.price != null && p2.price != null)
                ? fmtPrice(Math.abs(p2.price - p1.price)) : `${Math.abs(p2.y - p1.y).toFixed(0)}px`
            const pct2 = (p1.price != null && p2.price != null)
                ? ((Math.abs(p2.price - p1.price) / p1.price) * 100).toFixed(2) + '%' : ''
            ctx.font = '10px monospace'
            const lb = `${diff}  ${pct2}`.trim()
            const tw = ctx.measureText(lb).width
            ctx.fillStyle = '#1e2329cc'; ctx.fillRect(W / 2 - 30 - tw / 2, mid - 8, tw + 8, 14)
            ctx.fillStyle = clr; ctx.textBaseline = 'middle'; ctx.textAlign = 'center'
            ctx.fillText(lb, W / 2 - 26, mid)
            ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'
            ctx.restore()
            priceAxisLabel(ctx, p1.price, p1.y, clr, W)
            priceAxisLabel(ctx, p2.price, p2.y, clr, W)
            break
        }

        // ── Date Range ────────────────────────────────────────────────────────────
        case 'date_range': {
            if (!p2) break
            ctx.save(); ctx.setLineDash([5, 3])
            ctx.beginPath(); ctx.moveTo(p1.x, 0); ctx.lineTo(p1.x, H); ctx.stroke()
            ctx.beginPath(); ctx.moveTo(p2.x, 0); ctx.lineTo(p2.x, H); ctx.stroke()
            ctx.setLineDash([])
            ctx.globalAlpha = 0.06; ctx.fillStyle = clr
            ctx.fillRect(Math.min(p1.x, p2.x), 0, Math.abs(p2.x - p1.x), H)
            ctx.globalAlpha = alpha
            const bars = Math.round(Math.abs(p2.x - p1.x) / 8)
            const cx2 = (p1.x + p2.x) / 2
            ctx.font = '10px monospace'
            const label = `${bars} bars`
            const tw = ctx.measureText(label).width
            ctx.fillStyle = '#1e2329cc'; ctx.fillRect(cx2 - tw / 2 - 4, H - 22, tw + 8, 14)
            ctx.fillStyle = clr; ctx.textBaseline = 'middle'; ctx.textAlign = 'center'
            ctx.fillText(label, cx2, H - 15)
            ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'
            ctx.restore()
            break
        }

        // ── Date & Price Range ────────────────────────────────────────────────────
        case 'date_price': {
            if (!p2) break
            const rx = Math.min(p1.x, p2.x), ry = Math.min(p1.y, p2.y)
            const rw = Math.abs(p2.x - p1.x), rh = Math.abs(p2.y - p1.y)
            ctx.save()
            ctx.globalAlpha = 0.06; ctx.fillStyle = clr; ctx.fillRect(rx, ry, rw, rh)
            ctx.globalAlpha = alpha; ctx.setLineDash([4, 3]); ctx.strokeRect(rx, ry, rw, rh)
            ctx.restore()
            dot(ctx, p1.x, p1.y); dot(ctx, p2.x, p2.y)
            priceDashedLine(ctx, p1.y, clr, W, Math.max(p1.x, p2.x))
            priceDashedLine(ctx, p2.y, clr, W, Math.max(p1.x, p2.x))
            priceAxisLabel(ctx, p1.price, p1.y, clr, W)
            priceAxisLabel(ctx, p2.price, p2.y, clr, W)
            break
        }

        // ── Bars Pattern ──────────────────────────────────────────────────────────
        case 'bars_pattern':
        case 'bar_pattern': {
            if (!p2) break
            const bx = Math.min(p1.x, p2.x), bw = Math.abs(p2.x - p1.x)
            ctx.save()
            ctx.globalAlpha = 0.07; ctx.fillStyle = clr; ctx.fillRect(bx, 0, bw, H)
            ctx.globalAlpha = alpha; ctx.strokeStyle = clr; ctx.setLineDash([3, 3]); ctx.strokeRect(bx, 0, bw, H)
            ctx.setLineDash([])
            const b = Math.round(bw / 8)
            ctx.font = '10px monospace'; ctx.fillStyle = clr; ctx.textAlign = 'center'
            ctx.fillText(`${b} bars`, bx + bw / 2, 14)
            ctx.textAlign = 'left'
            ctx.restore()
            break
        }

        // ── Volume Profile ────────────────────────────────────────────────────────
        case 'vol_profile':
        case 'anch_vol': {
            if (!p2) break
            const vx = Math.min(p1.x, p2.x), vw = Math.abs(p2.x - p1.x)
            const vy = Math.min(p1.y, p2.y), vh = Math.abs(p2.y - p1.y)
            ctx.save()
            ctx.globalAlpha = 0.08; ctx.fillStyle = clr; ctx.fillRect(vx, vy, vw, vh)
            ctx.globalAlpha = alpha; ctx.setLineDash([3, 3]); ctx.strokeRect(vx, vy, vw, vh)
            ctx.setLineDash([])
            // Simulated volume bars
            const bars = 10
            const barH = vh / bars
            for (let i = 0; i < bars; i++) {
                const barW = vw * (0.3 + Math.sin(i * 2.5) * 0.25 + 0.2)
                ctx.globalAlpha = 0.2; ctx.fillStyle = clr
                ctx.fillRect(vx, vy + i * barH, barW, barH - 1)
            }
            ctx.restore()
            dot(ctx, p1.x, p1.y)
            priceDashedLine(ctx, p1.y, clr, W, Math.max(p1.x, p2.x))
            priceDashedLine(ctx, p2.y, clr, W, Math.max(p1.x, p2.x))
            priceAxisLabel(ctx, p1.price, p1.y, clr, W)
            priceAxisLabel(ctx, p2.price, p2.y, clr, W)
            break
        }

        // ── Sine Line ─────────────────────────────────────────────────────────────
        case 'sine_line': {
            if (!p2) break
            const amp = (p2.y - p1.y) / 2
            const freq = Math.PI / Math.max(Math.abs(p2.x - p1.x), 1)
            ctx.save()
            ctx.beginPath(); ctx.moveTo(p1.x, p1.y)
            for (let x = p1.x; x <= W; x += 2) {
                const y = p1.y + amp * Math.sin(freq * (x - p1.x) * 2)
                if (x === p1.x) ctx.moveTo(x, y); else ctx.lineTo(x, y)
            }
            ctx.stroke()
            ctx.restore()
            dot(ctx, p1.x, p1.y); dot(ctx, p2.x, p2.y)
            priceDashedLine(ctx, p1.y, clr, W, Math.max(p1.x, p2.x))
            priceAxisLabel(ctx, p1.price, p1.y, clr, W)
            break
        }

        // ── Cyclic Lines ──────────────────────────────────────────────────────────
        case 'cyclic_lines':
        case 'time_cycles': {
            if (!p2) break
            const baseW = Math.abs(p2.x - p1.x)
            ctx.save(); ctx.font = '9px monospace'
            for (let n = 1; n <= 12; n++) {
                const x = p1.x + baseW * n
                if (x > W + 10) break
                ctx.strokeStyle = clr; ctx.globalAlpha = Math.max(0.1, 0.6 - n * 0.04)
                ctx.setLineDash([4, 4]); ctx.lineWidth = 1
                ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke()
                ctx.setLineDash([]); ctx.globalAlpha = 1; ctx.fillStyle = clr
                ctx.fillText(`${n}`, x + 2, 13)
            }
            dot(ctx, p1.x, p1.y); dot(ctx, p2.x, p2.y)
            ctx.restore()
            break
        }

        // ── Rectangle ────────────────────────────────────────────────────────────
        case 'rect': {
            if (!p2) break
            const rx = Math.min(p1.x, p2.x), ry = Math.min(p1.y, p2.y)
            const rw = Math.abs(p2.x - p1.x), rh = Math.abs(p2.y - p1.y)
            ctx.save(); ctx.globalAlpha = 0.07; ctx.fillStyle = clr; ctx.fillRect(rx, ry, rw, rh); ctx.restore()
            ctx.strokeRect(rx, ry, rw, rh)
                ;[[rx, ry], [rx + rw, ry], [rx, ry + rh], [rx + rw, ry + rh]].forEach(([hx, hy]) => dot(ctx, hx, hy))
            priceDashedLine(ctx, ry, clr, W, rx + rw); priceDashedLine(ctx, ry + rh, clr, W, rx + rw)
            priceAxisLabel(ctx, p1.price, ry, clr, W); priceAxisLabel(ctx, p2.price, ry + rh, clr, W)
            break
        }

        // ── Rotated Rectangle ────────────────────────────────────────────────────
        case 'rot_rect': {
            if (!p2) break
            const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x)
            const len = Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2)
            const h2 = len * 0.2
            const nx = Math.sin(angle) * h2, ny = -Math.cos(angle) * h2
            ctx.save()
            ctx.globalAlpha = 0.07; ctx.fillStyle = clr
            ctx.beginPath(); ctx.moveTo(p1.x + nx, p1.y + ny); ctx.lineTo(p2.x + nx, p2.y + ny); ctx.lineTo(p2.x - nx, p2.y - ny); ctx.lineTo(p1.x - nx, p1.y - ny); ctx.closePath(); ctx.fill()
            ctx.restore()
            ctx.beginPath(); ctx.moveTo(p1.x + nx, p1.y + ny); ctx.lineTo(p2.x + nx, p2.y + ny); ctx.lineTo(p2.x - nx, p2.y - ny); ctx.lineTo(p1.x - nx, p1.y - ny); ctx.closePath(); ctx.stroke()
            dot(ctx, p1.x, p1.y); dot(ctx, p2.x, p2.y)
            break
        }

        // ── Triangle ─────────────────────────────────────────────────────────────
        case 'triangle_shp': {
            if (!p2) break
            ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y)
            if (p3) {
                ctx.lineTo(p3.x, p3.y); ctx.closePath()
                ctx.save(); ctx.globalAlpha = 0.07; ctx.fillStyle = clr; ctx.fill(); ctx.restore()
            }
            ctx.stroke()
                ;[p1, p2, p3].filter(Boolean).forEach(p => dot(ctx, p.x, p.y))
            if (p3) {
                const topY = Math.min(p1.y, p2.y, p3.y)
                const maxX = Math.max(p1.x, p2.x, p3.x)
                priceAxisLabel(ctx, [p1, p2, p3].sort((a, b) => a.y - b.y)[0].price, topY, clr, W)
            }
            break
        }

        // ── Ellipse ───────────────────────────────────────────────────────────────
        case 'ellipse': {
            if (!p2) break
            const cx = (p1.x + p2.x) / 2, cy = (p1.y + p2.y) / 2
            const rx2 = Math.abs(p2.x - p1.x) / 2 || 1, ry2 = Math.abs(p2.y - p1.y) / 2 || 1
            ctx.save(); ctx.globalAlpha = 0.07; ctx.fillStyle = clr
            ctx.beginPath(); ctx.ellipse(cx, cy, rx2, ry2, 0, 0, Math.PI * 2); ctx.fill()
            ctx.restore()
            ctx.beginPath(); ctx.ellipse(cx, cy, rx2, ry2, 0, 0, Math.PI * 2); ctx.stroke()
            dot(ctx, p1.x, p1.y); dot(ctx, p2.x, p2.y)
            priceDashedLine(ctx, Math.min(p1.y, p2.y), clr, W, Math.max(p1.x, p2.x))
            priceDashedLine(ctx, Math.max(p1.y, p2.y), clr, W, Math.max(p1.x, p2.x))
            break
        }

        // ── Circle ───────────────────────────────────────────────────────────────
        case 'circle': {
            if (!p2) break
            const r = Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2)
            ctx.save(); ctx.globalAlpha = 0.07; ctx.fillStyle = clr
            ctx.beginPath(); ctx.arc(p1.x, p1.y, r, 0, Math.PI * 2); ctx.fill()
            ctx.restore()
            ctx.beginPath(); ctx.arc(p1.x, p1.y, r, 0, Math.PI * 2); ctx.stroke()
            dot(ctx, p1.x, p1.y)
            priceDashedLine(ctx, p1.y - r, clr, W, p1.x + r)
            priceDashedLine(ctx, p1.y + r, clr, W, p1.x + r)
            break
        }

        // ── Arc ──────────────────────────────────────────────────────────────────
        case 'arc': {
            if (!p2) break
            const r = Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2)
            ctx.beginPath(); ctx.arc(p1.x, p1.y, r, 0, Math.PI); ctx.stroke()
            dot(ctx, p1.x, p1.y); dot(ctx, p2.x, p2.y)
            break
        }

        // ── Curve / Double Curve ──────────────────────────────────────────────────
        case 'curve': {
            if (!p2) break
            const cpX = (p1.x + p2.x) / 2, cpY = p1.y - 60
            ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.quadraticCurveTo(cpX, cpY, p2.x, p2.y); ctx.stroke()
            dot(ctx, p1.x, p1.y); dot(ctx, p2.x, p2.y)
            break
        }
        case 'double_curve': {
            if (!p2) break
            const cp1x = p1.x + (p2.x - p1.x) / 3, cp1y = p1.y - 50
            const cp2x = p1.x + (p2.x - p1.x) * 2 / 3, cp2y = p2.y + 50
            if (p3) {
                ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p3.x, p3.y); ctx.stroke()
            } else {
                ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.quadraticCurveTo(cp1x, cp1y, p2.x, p2.y); ctx.stroke()
            }
            ;[p1, p2, p3].filter(Boolean).forEach(p => dot(ctx, p.x, p.y))
            break
        }

        // ── Path ─────────────────────────────────────────────────────────────────
        case 'path_tool': {
            if (points.length < 2) { dot(ctx, p1.x, p1.y); break }
            ctx.beginPath(); ctx.moveTo(points[0].x, points[0].y)
            for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y)
            ctx.stroke()
            points.forEach(p => dot(ctx, p.x, p.y))
            break
        }

        // ── Polyline ─────────────────────────────────────────────────────────────
        case 'polyline': {
            if (points.length < 2) break
            ctx.beginPath(); ctx.moveTo(points[0].x, points[0].y)
            for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y)
            ctx.stroke()
            points.forEach(p => dot(ctx, p.x, p.y))
            break
        }

        // ── Brush (freehand) ─────────────────────────────────────────────────────
        case 'brush':
        case 'highlighter': {
            if (!d.path || d.path.length < 2) break
            ctx.save()
            if (type === 'highlighter') { ctx.globalAlpha = 0.35; ctx.lineWidth = 10 }
            ctx.beginPath(); ctx.moveTo(d.path[0].x, d.path[0].y)
            for (let i = 1; i < d.path.length; i++) ctx.lineTo(d.path[i].x, d.path[i].y)
            ctx.stroke()
            ctx.restore()
            break
        }

        // ── Text annotation ───────────────────────────────────────────────────────
        case 'text':
        case 'anchored_txt': {
            const label = text || 'Text'
            ctx.save()
            ctx.font = `${12 + (lw || 1)}px -apple-system, sans-serif`
            ctx.fillStyle = clr; ctx.fillText(label, p1.x, p1.y)
            ctx.restore()
            if (type === 'anchored_txt') {
                dot(ctx, p1.x, p1.y + 5, 3)
                priceDashedLine(ctx, p1.y, clr, W, p1.x + ctx.measureText(label).width + 5)
                priceAxisLabel(ctx, p1.price, p1.y, clr, W)
            }
            break
        }

        // ── Note ─────────────────────────────────────────────────────────────────
        case 'note':
        case 'comment': {
            const label = text || (type === 'note' ? 'Note' : 'Comment')
            ctx.save()
            ctx.font = '11px -apple-system, sans-serif'
            const tw = ctx.measureText(label).width
            const bx = p1.x + 5, by = p1.y - 28, bw = tw + 14, bh = 22
            ctx.fillStyle = '#1e2329ee'; ctx.strokeStyle = clr; ctx.lineWidth = 1
            ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 4); ctx.fill(); ctx.stroke()
            ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(bx + 8, by + bh); ctx.stroke()
            ctx.fillStyle = clr; ctx.fillText(label, bx + 7, by + 15)
            ctx.restore()
            dot(ctx, p1.x, p1.y)
            priceDashedLine(ctx, p1.y, clr, W, p1.x + bw + 10)
            priceAxisLabel(ctx, p1.price, p1.y, clr, W)
            break
        }

        // ── Callout ───────────────────────────────────────────────────────────────
        case 'callout': {
            const label = text || 'Callout'
            ctx.save()
            ctx.font = '11px -apple-system, sans-serif'
            const tw = ctx.measureText(label).width
            const bx = p1.x + 12, by = p1.y - 30, bw = tw + 14, bh = 22
            ctx.fillStyle = '#1e2329ee'; ctx.strokeStyle = clr; ctx.lineWidth = 1
            ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 4); ctx.fill(); ctx.stroke()
            ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(bx + 10, by + bh); ctx.stroke()
            ctx.fillStyle = clr; ctx.fillText(label, bx + 7, by + 15)
            ctx.restore()
            dot(ctx, p1.x, p1.y)
            priceAxisLabel(ctx, p1.price, p1.y, clr, W)
            break
        }

        // ── Price Note / Price Label ───────────────────────────────────────────────
        case 'price_note':
        case 'price_label': {
            const price = p1.price != null ? fmtPrice(p1.price) : '–'
            ctx.save()
            ctx.font = 'bold 10px monospace'
            const tw = ctx.measureText(price).width
            ctx.fillStyle = clr + 'cc'
            ctx.beginPath(); ctx.roundRect(2, p1.y - 9, tw + 10, 16, 2); ctx.fill()
            ctx.fillStyle = '#fff'; ctx.textBaseline = 'middle'; ctx.fillText(price, 7, p1.y)
            ctx.textBaseline = 'alphabetic'
            ctx.restore()
            priceDashedLine(ctx, p1.y, clr, W, tw + 14)
            dot(ctx, p1.x, p1.y, 4)
            break
        }

        // ── Pin ───────────────────────────────────────────────────────────────────
        case 'pin':
        case 'signpost': {
            ctx.save()
            ctx.fillStyle = clr
            ctx.beginPath(); ctx.arc(p1.x, p1.y - 10, 6, 0, Math.PI * 2); ctx.fill()
            ctx.beginPath(); ctx.moveTo(p1.x, p1.y - 4); ctx.lineTo(p1.x, p1.y); ctx.stroke()
            if (text) {
                ctx.font = '9px sans-serif'; ctx.fillStyle = '#fff'; ctx.textAlign = 'center'
                ctx.fillText(text, p1.x, p1.y - 8); ctx.textAlign = 'left'
            }
            ctx.restore()
            priceDashedLine(ctx, p1.y, clr, W, p1.x)
            priceAxisLabel(ctx, p1.price, p1.y, clr, W)
            break
        }

        // ── Arrow Up / Down ───────────────────────────────────────────────────────
        case 'arrow_up':
        case 'arrow_marker': {
            ctx.save(); ctx.fillStyle = color || '#0ecb81'; ctx.strokeStyle = color || '#0ecb81'
            ctx.beginPath(); ctx.moveTo(p1.x, p1.y + 4); ctx.lineTo(p1.x - 7, p1.y + 18); ctx.lineTo(p1.x + 7, p1.y + 18); ctx.closePath(); ctx.fill()
            ctx.restore()
            priceDashedLine(ctx, p1.y, clr, W, p1.x)
            priceAxisLabel(ctx, p1.price, p1.y, clr, W)
            break
        }
        case 'arrow_down': {
            ctx.save(); ctx.fillStyle = color || '#f6465d'; ctx.strokeStyle = color || '#f6465d'
            ctx.beginPath(); ctx.moveTo(p1.x, p1.y - 4); ctx.lineTo(p1.x - 7, p1.y - 18); ctx.lineTo(p1.x + 7, p1.y - 18); ctx.closePath(); ctx.fill()
            ctx.restore()
            priceDashedLine(ctx, p1.y, clr, W, p1.x)
            priceAxisLabel(ctx, p1.price, p1.y, clr, W)
            break
        }

        // ── Arrow (directional) ───────────────────────────────────────────────────
        case 'arrow': {
            if (!p2) break
            ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke()
            const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x)
            ctx.save()
            ctx.translate(p2.x, p2.y); ctx.rotate(angle)
            ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-10, -5); ctx.lineTo(-10, 5); ctx.closePath(); ctx.fill()
            ctx.restore()
            dot(ctx, p1.x, p1.y)
            break
        }

        // ── Flag ─────────────────────────────────────────────────────────────────
        case 'flag': {
            ctx.save(); ctx.fillStyle = clr; ctx.strokeStyle = clr
            ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p1.x, p1.y - 32); ctx.stroke()
            ctx.beginPath(); ctx.moveTo(p1.x, p1.y - 32); ctx.lineTo(p1.x + 14, p1.y - 26); ctx.lineTo(p1.x, p1.y - 19); ctx.closePath()
            ctx.globalAlpha = 0.8; ctx.fill()
            ctx.restore()
            priceDashedLine(ctx, p1.y, clr, W, p1.x)
            priceAxisLabel(ctx, p1.price, p1.y, clr, W)
            break
        }

        // ── Elliott Wave ──────────────────────────────────────────────────────────
        case 'elliott_12345': case 'elliott_abcde': case 'elliott_abc':
        case 'elliott_wxy': case 'elliott_wxyz': {
            const labMap = {
                elliott_12345: ['1', '2', '3', '4', '5'],
                elliott_abcde: ['A', 'B', 'C', 'D', 'E'],
                elliott_abc: ['A', 'B', 'C'],
                elliott_wxy: ['W', 'X', 'Y'],
                elliott_wxyz: ['W', 'X', 'Y', 'X', 'Z'],
            }
            const labels = labMap[type] || ['1', '2', '3', '4', '5']
            if (points.length < 1) break
            ctx.save()
            ctx.beginPath(); ctx.moveTo(points[0].x, points[0].y)
            for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y)
            ctx.stroke()
            points.forEach((p, i) => {
                if (!labels[i]) return
                // Circle label
                ctx.fillStyle = clr; ctx.strokeStyle = clr
                ctx.beginPath(); ctx.arc(p.x, p.y - 12, 7, 0, Math.PI * 2); ctx.fill()
                ctx.fillStyle = '#131722'; ctx.font = 'bold 9px monospace'; ctx.textAlign = 'center'
                ctx.fillText(labels[i], p.x, p.y - 9); ctx.textAlign = 'left'
                dot(ctx, p.x, p.y, 3, clr)
            })
            ctx.restore()
            // Price dashed lines at first and last point
            if (points.length >= 1) priceAxisLabel(ctx, points[0].price, points[0].y, clr, W)
            if (points.length >= 2) priceAxisLabel(ctx, points[points.length - 1].price, points[points.length - 1].y, clr, W)
            break
        }

        // ── XABCD / ABCD / Head & Shoulders / Cypher / etc ──────────────────────
        case 'xabcd': case 'abcd': case 'hs': case 'cypher':
        case 'triangle_pat': case 'three_drives': {
            const labelMap = {
                xabcd: ['X', 'A', 'B', 'C', 'D'],
                abcd: ['A', 'B', 'C', 'D'],
                cypher: ['X', 'A', 'B', 'C', 'D'],
                hs: ['L', 'LS', 'H', 'RS', 'R'],
                triangle_pat: ['A', 'B', 'C', 'D', 'E'],
                three_drives: ['1', 'A', '2', 'B', '3'],
            }
            const labels = labelMap[type] || []
            if (points.length < 1) break
            ctx.save()
            ctx.beginPath(); ctx.moveTo(points[0].x, points[0].y)
            for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y)
            ctx.stroke()
            // Neckline for H&S
            if (type === 'hs' && points.length >= 4) {
                ctx.save(); ctx.globalAlpha = 0.4; ctx.setLineDash([4, 3])
                ctx.beginPath(); ctx.moveTo(points[1].x, points[1].y); ctx.lineTo(points[3].x, points[3].y)
                ctx.stroke(); ctx.restore()
            }
            points.forEach((p, i) => {
                dot(ctx, p.x, p.y, 4)
                ctx.fillStyle = clr; ctx.font = 'bold 10px monospace'; ctx.textAlign = 'center'
                ctx.fillText(labels[i] ?? i.toString(), p.x, p.y - 9)
                ctx.textAlign = 'left'
            })
            ctx.restore()
            if (points.length >= 1) priceAxisLabel(ctx, points[0].price, points[0].y, clr, W)
            if (points.length >= 2) priceAxisLabel(ctx, points[points.length - 1].price, points[points.length - 1].y, clr, W)
            break
        }

        // ── Fallback ──────────────────────────────────────────────────────────────
        default: {
            if (p1) dot(ctx, p1.x, p1.y, 5)
            break
        }
    }

    ctx.globalAlpha = 1
    ctx.setLineDash([])
}

// ── Main Hook ──────────────────────────────────────────────────────────────────

export function useDrawingTools({
    canvasRef,
    activeTool,
    drawingColor,
    lineWidth,
    lineStyle,
    onToolChange,
    pixelToPrice,
    pixelToTime,    // optional: (x: number) => Date|null — để hiện label ngày trên trục X
    keepDrawing = false,
    magnetMode = 'none',
    ohlcData,       // optional: [{x, open, high, low, close}] for magnet snap
}) {
    const [drawings, setDrawings] = useState([])
    const [hiddenAll, setHiddenAll] = useState(false)
    const [lockedAll, setLockedAll] = useState(false)

    const inProgressRef = useRef(null)
    const isDrawingRef = useRef(false)
    const rafRef = useRef(null)
    const drawingsRef = useRef(drawings)
    useEffect(() => { drawingsRef.current = drawings }, [drawings])

    const activeToolRef = useRef(activeTool)
    const drawingColorRef = useRef(drawingColor)
    const lineWidthRef = useRef(lineWidth)
    const lineStyleRef = useRef(lineStyle)
    const keepDrawingRef = useRef(keepDrawing)
    const magnetRef = useRef(magnetMode)
    const ohlcRef = useRef(ohlcData)
    const cursorRef = useRef(null)          // {x, y} vị trí chuột hiện tại
    const pixelToTimeRef = useRef(pixelToTime)   // (x) => Date|null
    useEffect(() => { activeToolRef.current = activeTool }, [activeTool])
    useEffect(() => { drawingColorRef.current = drawingColor }, [drawingColor])
    useEffect(() => { lineWidthRef.current = lineWidth }, [lineWidth])
    useEffect(() => { lineStyleRef.current = lineStyle }, [lineStyle])
    useEffect(() => { keepDrawingRef.current = keepDrawing }, [keepDrawing])
    useEffect(() => { magnetRef.current = magnetMode }, [magnetMode])
    useEffect(() => { ohlcRef.current = ohlcData }, [ohlcData])
    useEffect(() => { pixelToTimeRef.current = pixelToTime }, [pixelToTime])

    const isCursorMode = useCallback((tool) =>
        !tool || tool === 'cursor' || tool === 'cross' || tool === 'dot_cursor' || tool === 'demo_cursor'
        , [])

    function snapToOHLC(x, y) {
        const data = ohlcRef.current
        if (!data || !data.length || magnetRef.current === 'none') return { x, y }
        const threshold = magnetRef.current === 'strong' ? MAGNET_SNAP_PX * 2 : MAGNET_SNAP_PX
        let best = null, bestDist = threshold
        for (const candle of data) {
            const prices = [candle.open, candle.high, candle.low, candle.close]
            for (const pv of prices) {
                if (pv == null) continue
                const cy = pixelToPrice ? pixelToPrice(pv) : pv
                const dist = Math.sqrt((candle.x - x) ** 2 + (cy - y) ** 2)
                if (dist < bestDist) { bestDist = dist; best = { x: candle.x, y: cy } }
            }
        }
        return best || { x, y }
    }

    function makePoint(rawX, rawY) {
        const { x, y } = snapToOHLC(rawX, rawY)
        const price = pixelToPrice ? pixelToPrice(y) : null
        return { x, y, price }
    }

    function getCanvasXY(e) {
        const canvas = canvasRef.current
        if (!canvas) return null
        const rect = canvas.getBoundingClientRect()
        return { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }

    function getNeededPoints(tool) {
        return POINT_COUNT[tool] ?? 2
    }

    // ── Helper: format date/time cho trục X label (Vietnam UTC+7) ───────────
    function fmtDateTime(date) {
        if (!date) return ''
        // Luôn hiển thị theo giờ Việt Nam (UTC+7), bất kể timezone máy
        const vnOffset = 7 * 60 * 60 * 1000
        const vnDate = new Date(date.getTime() + vnOffset)
        const pad = n => String(n).padStart(2, '0')
        return `${pad(vnDate.getUTCMonth() + 1)}/${pad(vnDate.getUTCDate())} ${pad(vnDate.getUTCHours())}:${pad(vnDate.getUTCMinutes())}`
    }

    // ── Vẽ crosshair dóng khi đang kéo vẽ (inProgress) ──────────────────────
    // Giống TradingView: đường dọc dóng ngày (trục X) + đường ngang dóng giá (trục Y)
    function drawInProgressCrosshair(ctx, x, y, color) {
        const W = ctx.canvas.width
        const H = ctx.canvas.height
        const clr = color || '#2962ff'

        ctx.save()

        // ── Đường dọc dóng xuống trục thời gian ──────────────────────────────
        ctx.strokeStyle = clr
        ctx.globalAlpha = 0.55
        ctx.lineWidth = 1
        ctx.setLineDash([4, 4])
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, H)
        ctx.stroke()

        // ── Đường ngang dóng sang trục giá ───────────────────────────────────
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(W, y)
        ctx.stroke()
        ctx.setLineDash([])

        // ── Label giá ở trục Y (cạnh phải) ───────────────────────────────────
        const price = pixelToPrice ? pixelToPrice(y) : null
        if (price != null && isFinite(price)) {
            const priceTxt = fmtPrice(price)
            ctx.font = 'bold 10px -apple-system, monospace'
            const tw = ctx.measureText(priceTxt).width
            const bw = tw + 10, bh = 17
            const bx = W - bw - 2, by = y - bh / 2
            ctx.globalAlpha = 1
            ctx.fillStyle = clr
            ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 2); ctx.fill()
            ctx.fillStyle = '#fff'
            ctx.textBaseline = 'middle'
            ctx.fillText(priceTxt, bx + 5, y)
        }

        // ── Label ngày/giờ ở trục X (cạnh dưới) ──────────────────────────────
        const p2t = pixelToTimeRef.current
        const date = p2t ? p2t(x) : null
        const timeTxt = date ? fmtDateTime(date) : null
        if (timeTxt) {
            ctx.font = 'bold 10px -apple-system, monospace'
            const tw = ctx.measureText(timeTxt).width
            const bw = tw + 10, bh = 17
            const bx = x - bw / 2, by = H - bh - 2
            ctx.globalAlpha = 1
            ctx.fillStyle = clr
            ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 2); ctx.fill()
            ctx.fillStyle = '#fff'
            ctx.textBaseline = 'middle'
            ctx.textAlign = 'center'
            ctx.fillText(timeTxt, x, by + bh / 2)
            ctx.textAlign = 'left'
        }

        ctx.restore()
    }

    // ── Redraw ──────────────────────────────────────────────────────────────────
    const redraw = useCallback(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        if (hiddenAll) return
        drawingsRef.current.forEach(d => { if (!d.hidden) drawShape(ctx, d, false) })
        if (inProgressRef.current) {
            drawShape(ctx, inProgressRef.current, true)
        }
        // ── Crosshair dóng tại con trỏ chuột (giống TradingView) ──────────────
        // Hiện khi đang ở drawing mode — dù đã click điểm đầu hay chưa
        const curTool = activeToolRef.current
        if (!isCursorMode(curTool)) {
            const cur = cursorRef.current
            if (cur) {
                const toolColor = inProgressRef.current?.color || drawingColorRef.current || '#2962ff'
                drawInProgressCrosshair(ctx, cur.x, cur.y, toolColor)
            }
        }

        // ── Cursor overlay modes ──────────────────────────────────────────────
        const cur = cursorRef.current
        if (cur) {
            const { x, y } = cur
            const W2 = canvas.width, H2 = canvas.height

            if (curTool === 'cross') {
                // Full crosshair lines + price/time labels
                drawInProgressCrosshair(ctx, x, y, '#9598a1')
            } else if (curTool === 'dot_cursor') {
                // Dot in center + short tick lines
                ctx.save()
                ctx.strokeStyle = '#9598a1'
                ctx.lineWidth = 1
                ctx.setLineDash([])
                // Short ticks
                const T = 5
                ctx.beginPath()
                ctx.moveTo(x, y - T - 4); ctx.lineTo(x, y - T)
                ctx.moveTo(x, y + T); ctx.lineTo(x, y + T + 4)
                ctx.moveTo(x - T - 4, y); ctx.lineTo(x - T, y)
                ctx.moveTo(x + T, y); ctx.lineTo(x + T + 4, y)
                ctx.stroke()
                // Dot
                ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2)
                ctx.fillStyle = '#9598a1'; ctx.fill()
                ctx.restore()
            } else if (curTool === 'demo_cursor') {
                // Magnifier circle with crosshair ticks
                ctx.save()
                const R = 18
                ctx.strokeStyle = '#9598a1'
                ctx.lineWidth = 1.5
                ctx.setLineDash([])
                ctx.beginPath(); ctx.arc(x, y, R, 0, Math.PI * 2); ctx.stroke()
                // Handle line (bottom-right)
                ctx.lineWidth = 2
                ctx.beginPath(); ctx.moveTo(x + R * 0.7, y + R * 0.7); ctx.lineTo(x + R * 0.7 + 7, y + R * 0.7 + 7); ctx.stroke()
                // Inner cross ticks
                ctx.lineWidth = 1
                ctx.beginPath()
                ctx.moveTo(x, y - R + 2); ctx.lineTo(x, y - 4)
                ctx.moveTo(x, y + 4); ctx.lineTo(x, y + R - 2)
                ctx.moveTo(x - R + 2, y); ctx.lineTo(x - 4, y)
                ctx.moveTo(x + 4, y); ctx.lineTo(x + R - 2, y)
                ctx.stroke()
                ctx.restore()
            }
        }
    }, [canvasRef, hiddenAll])

    const scheduleRedraw = useCallback(() => {
        if (rafRef.current) return
        rafRef.current = requestAnimationFrame(() => {
            rafRef.current = null
            redraw()
        })
    }, [redraw])

    useEffect(() => { scheduleRedraw() }, [drawings, hiddenAll, scheduleRedraw])

    // ── Canvas resize ────────────────────────────────────────────────────────────
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const parent = canvas.parentElement
        if (!parent) return
        const ro = new ResizeObserver(() => {
            canvas.width = parent.clientWidth
            canvas.height = parent.clientHeight
            scheduleRedraw()
        })
        ro.observe(parent)
        canvas.width = parent.clientWidth
        canvas.height = parent.clientHeight
        scheduleRedraw()
        return () => ro.disconnect()
    }, [canvasRef, scheduleRedraw])

    // ── Mouse Down ────────────────────────────────────────────────────────────────
    const handleMouseDown = useCallback((e) => {
        const tool = activeToolRef.current
        if (isCursorMode(tool) || lockedAll) return
        const xy = getCanvasXY(e)
        if (!xy) return
        const point = makePoint(xy.x, xy.y)
        const color = drawingColorRef.current
        const lw2 = lineWidthRef.current
        const ls = lineStyleRef.current

        // Freehand
        if (FREEHAND_TOOLS.has(tool)) {
            inProgressRef.current = { type: tool, points: [point], path: [point], color, lineWidth: lw2, lineStyle: ls }
            isDrawingRef.current = true
            scheduleRedraw()
            return
        }

        // Instant tools
        if (INSTANT_TOOLS.has(tool)) {
            let textVal = null
            if (['text', 'anchored_txt', 'note', 'comment', 'callout'].includes(tool)) {
                textVal = window.prompt('Nhập nội dung:') || 'Text'
            }
            setDrawings(prev => [...prev, { id: Date.now(), type: tool, points: [point], color, lineWidth: lw2, lineStyle: ls, text: textVal }])
            scheduleRedraw()
            return
        }

        // Polyline special (add points on click, double-click to finish)
        if (tool === 'polyline') {
            if (!inProgressRef.current) {
                inProgressRef.current = { type: tool, points: [point], _fixedPoints: [point], color, lineWidth: lw2, lineStyle: ls }
            } else {
                const fixed = [...(inProgressRef.current._fixedPoints || []), point]
                inProgressRef.current = { ...inProgressRef.current, points: fixed, _fixedPoints: fixed }
            }
            isDrawingRef.current = true
            scheduleRedraw()
            return
        }

        // Multi-point tools
        const needed = getNeededPoints(tool)

        if (!inProgressRef.current) {
            inProgressRef.current = { type: tool, points: [point], _fixedPoints: [point], color, lineWidth: lw2, lineStyle: ls }
        } else {
            const fixedPoints = inProgressRef.current._fixedPoints ?? [inProgressRef.current.points[0]]
            const newFixed = [...fixedPoints, point]
            inProgressRef.current = { ...inProgressRef.current, points: newFixed, _fixedPoints: newFixed }

            if (newFixed.length >= needed) {
                const { _fixedPoints, ...cleanDrawing } = inProgressRef.current
                setDrawings(prev => [...prev, { ...cleanDrawing, id: Date.now(), points: newFixed }])
                inProgressRef.current = null
                // Keep drawing: auto-start next with same tool
                if (keepDrawingRef.current) {
                    // leave tool active, user can click again
                }
            }
        }

        isDrawingRef.current = true
        scheduleRedraw()
    }, [lockedAll, isCursorMode, scheduleRedraw])

    // ── Mouse Move (preview) ─────────────────────────────────────────────────────
    const handleMouseMove = useCallback((e) => {
        const tool = activeToolRef.current
        const xy = getCanvasXY(e)
        if (!xy) return

        // Luôn cập nhật vị trí con trỏ để redraw crosshair dóng
        cursorRef.current = { x: xy.x, y: xy.y }

        // Cursor overlay modes only need redraw
        if (tool === 'cross' || tool === 'dot_cursor' || tool === 'demo_cursor') {
            scheduleRedraw()
            return
        }

        if (isCursorMode(tool)) return

        if (FREEHAND_TOOLS.has(tool) && isDrawingRef.current && inProgressRef.current) {
            inProgressRef.current = { ...inProgressRef.current, path: [...(inProgressRef.current.path || []), { x: xy.x, y: xy.y }] }
            scheduleRedraw()
            return
        }

        if (inProgressRef.current) {
            const fixed = inProgressRef.current._fixedPoints ?? [inProgressRef.current.points[0]]
            const previewPoint = makePoint(xy.x, xy.y)
            inProgressRef.current = { ...inProgressRef.current, points: [...fixed, previewPoint] }
            scheduleRedraw()
        } else if (!isCursorMode(tool)) {
            // Chưa click điểm đầu nhưng đang ở drawing mode → vẫn cần redraw để hiện crosshair
            scheduleRedraw()
        }
    }, [isCursorMode, scheduleRedraw])

    // ── Mouse Leave — xóa crosshair khi rời canvas ───────────────────────────
    const handleMouseLeave = useCallback(() => {
        cursorRef.current = null
        scheduleRedraw()
    }, [scheduleRedraw])

    // ── Mouse Up ──────────────────────────────────────────────────────────────────
    const handleMouseUp = useCallback((e) => {
        if (FREEHAND_TOOLS.has(activeToolRef.current) && inProgressRef.current) {
            const { _fixedPoints, ...cleanDrawing } = inProgressRef.current
            setDrawings(prev => [...prev, { ...cleanDrawing, id: Date.now() }])
            inProgressRef.current = null
        }
        isDrawingRef.current = false
    }, [])

    // ── Right-click cancels ────────────────────────────────────────────────────
    const handleContextMenu = useCallback((e) => {
        if (inProgressRef.current) {
            e.preventDefault()
            inProgressRef.current = null
            scheduleRedraw()
        }
    }, [scheduleRedraw])

    // ── Double-click finalizes multi-point / ends polyline ────────────────────
    const handleDblClick = useCallback((e) => {
        if (inProgressRef.current) {
            const fixed = inProgressRef.current._fixedPoints ?? inProgressRef.current.points
            if (fixed.length >= 2) {
                const { _fixedPoints, ...cleanDrawing } = inProgressRef.current
                setDrawings(prev => [...prev, { ...cleanDrawing, id: Date.now(), points: fixed }])
                inProgressRef.current = null
                scheduleRedraw()
            }
        }
    }, [scheduleRedraw])

    // ── Keyboard shortcuts ────────────────────────────────────────────────────
    useEffect(() => {
        function handleKey(e) {
            if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') return
            if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                e.preventDefault(); setDrawings(prev => prev.slice(0, -1)); return
            }
            if (e.key === 'Escape') {
                if (inProgressRef.current) { inProgressRef.current = null; scheduleRedraw() }
                else { onToolChange?.('cursor') }
                return
            }
            if ((e.key === 'Delete' || e.key === 'Backspace') && !inProgressRef.current) {
                setDrawings(prev => prev.slice(0, -1))
            }
        }
        window.addEventListener('keydown', handleKey)
        return () => window.removeEventListener('keydown', handleKey)
    }, [scheduleRedraw, onToolChange])

    // ── Actions ───────────────────────────────────────────────────────────────
    function handleAction(action, payload) {
        switch (action) {
            case 'toggleLockAll': setLockedAll(v => !v); break
            case 'toggleHideAll': setHiddenAll(v => !v); break
            case 'deleteAll': setDrawings([]); inProgressRef.current = null; scheduleRedraw(); break
            case 'deleteDrawings': setDrawings([]); inProgressRef.current = null; scheduleRedraw(); break
            case 'undo': setDrawings(prev => prev.slice(0, -1)); break
            case 'hideOptions': setHiddenAll(v => !v); break
            case 'hideIndicators': break  // handled by parent
            case 'hidePositions': break
            default: break
        }
    }

    const cursorStyle = activeTool === 'cross' || activeTool === 'dot_cursor'
        ? 'none'   // we draw our own crosshair/dot on canvas
        : activeTool === 'demo_cursor'
            ? 'none'   // demonstration: magnifier-style, drawn on canvas
            : isCursorMode(activeTool)
                ? 'default'
                : activeTool === 'brush' || activeTool === 'highlighter' ? 'crosshair'
                    : activeTool === 'text' || activeTool === 'anchored_txt' ? 'text'
                        : activeTool === 'measure' || activeTool === 'price_range' || activeTool === 'date_range' ? 'cell'
                            : 'crosshair'

    return {
        drawings,
        drawingCount: drawings.length,
        hiddenAll,
        lockedAll,
        handleAction,
        scheduleRedraw,
        canvasProps: {
            onMouseDown: handleMouseDown,
            onMouseMove: handleMouseMove,
            onMouseUp: handleMouseUp,
            onMouseLeave: handleMouseLeave,
            onContextMenu: handleContextMenu,
            onDoubleClick: handleDblClick,
            style: {
                position: 'absolute', top: 0, left: 0,
                width: '100%', height: '100%',
                pointerEvents: (isCursorMode(activeTool) && activeTool !== 'cross' && activeTool !== 'dot_cursor' && activeTool !== 'demo_cursor') ? 'none' : 'all',
                cursor: cursorStyle,
                zIndex: 10,
            },
        },
    }
}