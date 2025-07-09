document.addEventListener('DOMContentLoaded', () => {
    const animationContainer = document.getElementById('fixed-animation-container');
    if (!animationContainer) {
        console.error('Fixed animation container not found!');
        return;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    animationContainer.appendChild(canvas);

    const gridSize = 40; // Must match background-size in CSS
    const highlightCells = 6; // 6x6 area
    const highlightAreaSize = gridSize * highlightCells;
    let animationFrameId = null;
    let mouseX = -10000; // Initial mouse position far off-screen
    let mouseY = -10000;
    let lastInteractionTime = 0;

    // Glow properties
    const maxGlowRadiusBase = highlightAreaSize * 0.35;
    const glowColorCore = 'rgba(0, 180, 255, 0.4)';
    const glowColorMid = 'rgba(0, 150, 255, 0.2)';
    const glowColorOuter = 'rgba(0, 120, 255, 0)';

    const lineHighlightColor = 'rgba(120, 180, 255, 0.7)';

    const FADE_OUT_START_DELAY = 350; // ms of inactivity before fade out begins
    const FADE_OUT_DURATION = 400; // ms for the effect to fade out completely

    let containerRect = animationContainer.getBoundingClientRect();

    function resizeCanvas() {
        containerRect = animationContainer.getBoundingClientRect();
        canvas.width = containerRect.width;
        canvas.height = containerRect.height;
        // Canvas is already absolutely positioned by default within its offset parent if no CSS is applied to it.
        // We ensure it's layered correctly with z-index if needed, but for now, direct append order might be enough.
        // Let's ensure it's explicitly positioned for clarity if issues arise.
        canvas.style.position = 'absolute';
        canvas.style.left = '0';
        canvas.style.top = '0';
        canvas.style.pointerEvents = 'none'; // Make canvas click-through
        canvas.style.zIndex = '2'; // Above CSS grid pseudo-element within the container
    }

    // Resize canvas initially and on window resize (as container size might be % based or change with viewport)
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas(); // Initial size setting

    animationContainer.addEventListener('mousemove', (e) => {
        // Get mouse position relative to the animationContainer
        containerRect = animationContainer.getBoundingClientRect(); // Update rect in case of scroll/resize
        mouseX = e.clientX - containerRect.left;
        mouseY = e.clientY - containerRect.top;
        lastInteractionTime = Date.now();
        if (!animationFrameId) {
            animationFrameId = requestAnimationFrame(drawEffect);
        }
    });

    animationContainer.addEventListener('mouseleave', () => {
        lastInteractionTime = 0; // Triggers fade out
        // No need to move mouseX/mouseY off-screen as fade is time-based
        // and mousemove won't be called until mouse re-enters.
    });

    function drawEffect() {
        const now = Date.now();
        // Clear only the canvas area
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        let timeSinceLastInteraction = now - lastInteractionTime;
        if (lastInteractionTime === 0) {
            timeSinceLastInteraction = FADE_OUT_START_DELAY + 1;
        }

        let overallOpacity = 1;

        if (timeSinceLastInteraction > FADE_OUT_START_DELAY) {
            overallOpacity = Math.max(0, 1 - (timeSinceLastInteraction - FADE_OUT_START_DELAY) / FADE_OUT_DURATION);
        }

        if (overallOpacity <= 0.01) {
            animationFrameId = null;
            return;
        }

        const snappedX = Math.round((mouseX - highlightAreaSize / 2) / gridSize) * gridSize;
        const snappedY = Math.round((mouseY - highlightAreaSize / 2) / gridSize) * gridSize;

        const pulseFactor = (Math.sin(Date.now() * 0.005) + 1) / 2;
        const currentMaxGlowRadius = maxGlowRadiusBase * (0.8 + pulseFactor * 0.4);

        if (currentMaxGlowRadius * overallOpacity > 1) {
            const gradient = ctx.createRadialGradient(mouseX, mouseY, 0, mouseX, mouseY, currentMaxGlowRadius * overallOpacity);
            gradient.addColorStop(0, glowColorCore.replace(/[\d\.]+\)$/, `${parseFloat(glowColorCore.match(/[\d\.]+/g)[3]) * overallOpacity})`));
            gradient.addColorStop(0.6, glowColorMid.replace(/[\d\.]+\)$/, `${parseFloat(glowColorMid.match(/[\d\.]+/g)[3]) * overallOpacity})`));
            gradient.addColorStop(1, glowColorOuter);

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(mouseX, mouseY, currentMaxGlowRadius * overallOpacity, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.strokeStyle = lineHighlightColor.replace(/[\d\.]+\)$/, `${parseFloat(lineHighlightColor.match(/[\d\.]+/g)[3]) * overallOpacity})`);
        ctx.lineWidth = 1.5;

        for (let i = 0; i <= highlightCells; i++) {
            const x = snappedX + i * gridSize;
            ctx.beginPath();
            ctx.moveTo(x, snappedY);
            ctx.lineTo(x, snappedY + highlightAreaSize);
            ctx.stroke();

            const y = snappedY + i * gridSize;
            ctx.beginPath();
            ctx.moveTo(snappedX, y);
            ctx.lineTo(snappedX + highlightAreaSize, y);
            ctx.stroke();
        }

        animationFrameId = requestAnimationFrame(drawEffect);
    }

    // No initial draw call needed here, effect starts on first mousemove into container.
});
