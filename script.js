document.addEventListener('DOMContentLoaded', () => {
    const body = document.body;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    body.appendChild(canvas);

    const gridSize = 40; // Must match background-size in CSS
    const highlightCells = 6; // 6x6 area
    const highlightAreaSize = gridSize * highlightCells; // Total size of the highlighted area
    let animationFrameId = null;
    let mouseX = -10000; // Initial mouse position far off-screen
    let mouseY = -10000;
    let lastInteractionTime = 0;

    // Glow properties
    const maxGlowRadiusBase = highlightAreaSize * 0.35; // Base for max pulsating glow radius
    const glowColorCore = 'rgba(0, 180, 255, 0.4)'; // Core glow color
    const glowColorMid = 'rgba(0, 150, 255, 0.2)';  // Mid glow color
    const glowColorOuter = 'rgba(0, 120, 255, 0)'; // Outer glow (transparent)

    const lineHighlightColor = 'rgba(120, 180, 255, 0.7)'; // Highlighted grid lines

    const FADE_OUT_START_DELAY = 350; // ms of inactivity before fade out begins (Increased for more natural lingering)
    const FADE_OUT_DURATION = 400; // ms for the effect to fade out completely

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        canvas.style.position = 'absolute';
        canvas.style.left = '0';
        canvas.style.top = '0';
        canvas.style.pointerEvents = 'none'; // Make canvas click-through
        canvas.style.zIndex = '2'; // Above CSS grid pseudo-element
    }

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    body.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        lastInteractionTime = Date.now();
        if (!animationFrameId) {
            animationFrameId = requestAnimationFrame(drawEffect);
        }
    });

    body.addEventListener('mouseleave', () => {
        // Setting lastInteractionTime to 0 effectively starts the fade-out process immediately
        // because the next check in drawEffect will see a large delta.
        // We don't move the mouseX/Y here as the fade is time-based.
        lastInteractionTime = 0;
    });

    function drawEffect() {
        const now = Date.now();
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        let timeSinceLastInteraction = now - lastInteractionTime;
        if (lastInteractionTime === 0) { // If mouseleave triggered
            timeSinceLastInteraction = FADE_OUT_START_DELAY + 1; // Force into fade logic
        }

        let overallOpacity = 1;

        if (timeSinceLastInteraction > FADE_OUT_START_DELAY) {
            overallOpacity = Math.max(0, 1 - (timeSinceLastInteraction - FADE_OUT_START_DELAY) / FADE_OUT_DURATION);
        }

        if (overallOpacity <= 0.01) { // Stop animation when fully faded
            animationFrameId = null;
            return;
        }

        // Calculate the top-left corner of the 6x6 highlight area, centered on mouse
        const snappedX = Math.round((mouseX - highlightAreaSize / 2) / gridSize) * gridSize;
        const snappedY = Math.round((mouseY - highlightAreaSize / 2) / gridSize) * gridSize;

        // Pulsating glow effect
        const pulseFactor = (Math.sin(Date.now() * 0.005) + 1) / 2; // Normalized pulse (0 to 1)
        const currentMaxGlowRadius = maxGlowRadiusBase * (0.8 + pulseFactor * 0.4); // Pulsates between 80% and 120% of base

        if (currentMaxGlowRadius * overallOpacity > 1) { // Only draw glow if it's visible enough
            const gradient = ctx.createRadialGradient(mouseX, mouseY, 0, mouseX, mouseY, currentMaxGlowRadius * overallOpacity);
            gradient.addColorStop(0, glowColorCore.replace(/[\d\.]+\)$/, `${parseFloat(glowColorCore.match(/[\d\.]+/g)[3]) * overallOpacity})`));
            gradient.addColorStop(0.6, glowColorMid.replace(/[\d\.]+\)$/, `${parseFloat(glowColorMid.match(/[\d\.]+/g)[3]) * overallOpacity})`));
            gradient.addColorStop(1, glowColorOuter); // Outer is already transparent

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(mouseX, mouseY, currentMaxGlowRadius * overallOpacity, 0, Math.PI * 2);
            ctx.fill();
        }

        // Draw highlighted grid lines
        ctx.strokeStyle = lineHighlightColor.replace(/[\d\.]+\)$/, `${parseFloat(lineHighlightColor.match(/[\d\.]+/g)[3]) * overallOpacity})`);
        ctx.lineWidth = 1.5;

        for (let i = 0; i <= highlightCells; i++) {
            // Vertical lines
            const x = snappedX + i * gridSize;
            ctx.beginPath();
            ctx.moveTo(x, snappedY);
            ctx.lineTo(x, snappedY + highlightAreaSize);
            ctx.stroke();

            // Horizontal lines
            const y = snappedY + i * gridSize;
            ctx.beginPath();
            ctx.moveTo(snappedX, y);
            ctx.lineTo(snappedX + highlightAreaSize, y);
            ctx.stroke();
        }

        animationFrameId = requestAnimationFrame(drawEffect);
    }

    // Start the animation loop if the mouse is already over the body (e.g. on page load)
    // but only if the page has focus.
    if (document.hasFocus()) {
        // We can't know the mouse position yet, so we don't trigger the effect
        // until the first mousemove. If we wanted an initial effect at (0,0) or center,
        // we could set initial mouseX/mouseY and call requestAnimationFrame.
        // For now, it's cleaner to wait for actual mouse interaction.
    }
});
