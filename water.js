(() => {
    const canvas = document.getElementById('water-background');
    const context = canvas.getContext('2d');
    const toggle = document.getElementById('motion-toggle');
    if (!context) return;

    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    let paused = false;
    try { paused = localStorage.getItem('water-paused') === 'true'; } catch {}
    let width = 0;
    let height = 0;
    let fish = [];
    let target = null;
    let frame = 0;
    let lastTime = 0;
    let time = 0;

    function resize() {
        width = window.innerWidth;
        height = window.innerHeight;
        const scale = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.round(width * scale);
        canvas.height = Math.round(height * scale);
        context.setTransform(scale, 0, 0, scale, 0, 0);
        fish = Array.from({ length: width < 600 ? 5 : 10 }, () => ({
            x: Math.random() * width,
            y: Math.random() * height,
            angle: Math.random() * Math.PI * 2,
            size: 10 + Math.random() * 8,
            speed: 9 + Math.random() * 9,
            phase: Math.random() * Math.PI * 2
        }));
        target = null;
        draw();
    }

    function drawFish(f) {
        context.save();
        context.translate(f.x, f.y);
        context.rotate(f.angle);
        context.scale(f.size, f.size);
        const tail = Math.sin(time * 3 + f.phase) * 0.14;
        context.fillStyle = 'rgba(65, 138, 127, 0.12)';
        context.strokeStyle = 'rgba(65, 138, 127, 0.19)';
        context.lineWidth = 0.055;
        context.beginPath();
        context.moveTo(-0.6, 0);
        context.lineTo(-1.25, -0.42 + tail);
        context.quadraticCurveTo(-1.05, tail, -1.25, 0.42 + tail);
        context.closePath();
        context.fill();
        context.stroke();
        context.beginPath();
        context.ellipse(0, 0, 0.85, 0.36, 0, 0, Math.PI * 2);
        context.fill();
        context.stroke();
        context.beginPath();
        context.moveTo(-0.15, -0.08);
        context.lineTo(-0.4, -0.55);
        context.lineTo(0.3, -0.3);
        context.stroke();
        context.beginPath();
        context.arc(0.48, -0.08, 0.045, 0, Math.PI * 2);
        context.fillStyle = 'rgba(65, 138, 127, 0.25)';
        context.fill();
        context.restore();
    }

    function draw() {
        context.clearRect(0, 0, width, height);
        context.lineWidth = 1;
        context.strokeStyle = 'rgba(65, 138, 127, 0.075)';
        for (let row = -1; row < height / 100 + 1; row++) {
            context.beginPath();
            for (let x = 0; x <= width + 24; x += 24) {
                const y = row * 100 + Math.sin(x / 150 + time * 0.16 + row) * 13
                    + Math.cos(x / 290 - time * 0.1) * 8;
                if (x === 0) context.moveTo(x, y);
                else context.lineTo(x, y);
            }
            context.stroke();
        }
        fish.forEach(drawFish);
    }

    function animate(now) {
        frame = requestAnimationFrame(animate);
        if (!lastTime) { lastTime = now; return; }
        const elapsed = now - lastTime;
        if (elapsed < 1000 / 30) return;
        const dt = Math.min(elapsed / 1000, 0.08);
        lastTime = now;
        time += dt;
        if (target && time > target.until) target = null;
        for (const f of fish) {
            let desired = f.angle + Math.sin(time * 0.45 + f.phase) * 0.2;
            if (target && Math.hypot(target.x - f.x, target.y - f.y) > 30) {
                desired = Math.atan2(target.y - f.y, target.x - f.x);
            }
            const turn = Math.atan2(Math.sin(desired - f.angle), Math.cos(desired - f.angle));
            f.angle += Math.max(-dt * 1.3, Math.min(dt * 1.3, turn));
            f.x += Math.cos(f.angle) * f.speed * dt;
            f.y += Math.sin(f.angle) * f.speed * dt;
            const margin = 40;
            if (f.x < -margin) f.x = width + margin;
            if (f.x > width + margin) f.x = -margin;
            if (f.y < -margin) f.y = height + margin;
            if (f.y > height + margin) f.y = -margin;
        }
        draw();
    }

    function syncMotion() {
        cancelAnimationFrame(frame);
        lastTime = 0;
        const stopped = paused || reducedMotion.matches;
        toggle.hidden = false;
        toggle.disabled = reducedMotion.matches;
        toggle.textContent = reducedMotion.matches ? 'Reduced motion' : paused ? 'Resume animation' : 'Pause animation';
        toggle.setAttribute('aria-pressed', String(stopped));
        if (!stopped && !document.hidden) frame = requestAnimationFrame(animate);
    }

    toggle.addEventListener('click', () => {
        paused = !paused;
        try { localStorage.setItem('water-paused', String(paused)); } catch {}
        syncMotion();
    });
    document.addEventListener('click', event => {
        if (paused || reducedMotion.matches || event.target.closest('a, button, input, textarea, label, select')) return;
        target = { x: event.clientX, y: event.clientY, until: time + 4 };
    });
    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', syncMotion);
    reducedMotion.addEventListener('change', syncMotion);
    resize();
    syncMotion();
})();
