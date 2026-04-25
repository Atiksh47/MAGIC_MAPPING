export function resamplePath(points, n = 64) {
    if (points.length < 2) return points;

    let totalLen = 0;
    for (let i = 1; i < points.length; i++)
        totalLen += Math.hypot(points[i].x - points[i-1].x, points[i].y - points[i-1].y);

    const interval = totalLen / (n - 1);
    let D = 0;
    const result = [{ ...points[0] }];
    let prev = points[0];

    for (let i = 1; i < points.length; i++) {
        const curr = points[i];
        const segLen = Math.hypot(curr.x - prev.x, curr.y - prev.y);
        let segD = 0;

        while (segD + (interval - D) <= segLen + 1e-9) {
            segD += interval - D;
            const t = segD / segLen;
            result.push({
                x: prev.x + t * (curr.x - prev.x),
                y: prev.y + t * (curr.y - prev.y)
            });
            D = 0;
            if (result.length >= n) break;
        }

        D += segLen - segD;
        prev = curr;
        if (result.length >= n) break;
    }

    while (result.length < n) result.push({ ...points[points.length - 1] });
    return result.slice(0, n);
}

export function normalizePath(rawPoints, n = 64) {
    if (!rawPoints || rawPoints.length < 5) return null;

    const pts = resamplePath(rawPoints, n);

    let cx = 0, cy = 0;
    for (const p of pts) { cx += p.x; cy += p.y; }
    cx /= pts.length;
    cy /= pts.length;

    const centered = pts.map(p => ({ x: p.x - cx, y: p.y - cy }));

    let maxD = 0;
    for (const p of centered) maxD = Math.max(maxD, Math.hypot(p.x, p.y));
    if (maxD < 1e-6) return null;

    return centered.map(p => ({ x: p.x / maxD, y: p.y / maxD }));
}

export function pathDistance(a, b) {
    let sum = 0;
    for (let i = 0; i < a.length; i++)
        sum += Math.hypot(a[i].x - b[i].x, a[i].y - b[i].y);
    return sum / a.length;
}

