document.addEventListener('DOMContentLoaded', () => {
    // The visual container where the canvas and ::before grid live
    const visualContainer = document.getElementById('fixed-animation-container');
    // The layer that will actually capture mouse events
    const interactionLayer = document.getElementById('mouse-interaction-layer');

    if (!visualContainer || !interactionLayer) {
        console.error('Required container(s) not found! Need fixed-animation-container and mouse-interaction-layer.');
        return;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    visualContainer.appendChild(canvas); // Canvas is for visuals, appended to visual container

    const gridSize = 40; // Must match background-size in CSS
    const highlightCells = 6; // 6x6 area
    const highlightAreaSize = gridSize * highlightCells;
    let animationFrameId = null;
    let mouseX = -10000; // Initial mouse position far off-screen
    let mouseY = -10000;
    let lastInteractionTime = 0;

    // Glow properties - User Updated to Purple/Subtle
    const maxGlowRadiusBase = highlightAreaSize * 0.35;
    const glowColorCore = 'rgba(115, 0, 222, 0.2)';
    const glowColorMid = 'rgba(115, 0, 222, 0.15)';
    const glowColorOuter = 'rgba(115, 0, 255, 0.05)'; // Slight blue in outer user version

    // Line Highlight Color - User Updated to Purple/Subtle
    const lineHighlightColor = 'rgba(115, 0, 222, 0.3)';

    const FADE_OUT_START_DELAY = 350; // ms of inactivity before fade out begins
    const FADE_OUT_DURATION = 400; // ms for the effect to fade out completely

    // We get dimensions from visualContainer for canvas drawing,
    // but mouse events are relative to interactionLayer (which should be identical in size/pos).
    let visualContainerRect = visualContainer.getBoundingClientRect();

    function resizeCanvas() {
        visualContainerRect = visualContainer.getBoundingClientRect(); // Use visual container for canvas size
        canvas.width = visualContainerRect.width;
        canvas.height = visualContainerRect.height;
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

    // Event listeners are now on the interactionLayer
    interactionLayer.addEventListener('mousemove', (e) => {
        // Mouse coordinates are relative to the viewport, so we still use
        // visualContainerRect for calculations as it defines the drawing area.
        // interactionLayer and visualContainer are expected to be perfectly aligned.
        visualContainerRect = visualContainer.getBoundingClientRect();
        mouseX = e.clientX - visualContainerRect.left;
        mouseY = e.clientY - visualContainerRect.top;
        lastInteractionTime = Date.now();
        if (!animationFrameId) {
            animationFrameId = requestAnimationFrame(drawEffect);
        }
    });

    interactionLayer.addEventListener('mouseleave', () => {
        lastInteractionTime = 0; // Triggers fade out
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

        // Gradient highlighted lines
        ctx.lineWidth = 1.5;
        const baseLineColorRGB = lineHighlightColor.match(/\d+/g).slice(0, 3).join(', '); // Extracts "R, G, B"
        const baseHighlightOpacity = parseFloat(lineHighlightColor.match(/rgba?\([\d\s,]+\s*\/\s*([\d\.]+)\)/)?.[1] || lineHighlightColor.match(/rgba?\([\d\s,]+,\s*([\d\.]+)\)/)?.[1] || "0.7");

        // Max distance for fade effect calculation, typically half the size of the highlight area.
        // A larger divisor makes the gradient fall off more slowly (spreads it out).
        // A smaller divisor makes it fall off more quickly (concentrates it near the cursor).
        const falloffDivisor = highlightAreaSize / 2.5; // Tunable: controls "spread" of highlight

        for (let i = 0; i <= highlightCells; i++) {
            // Vertical lines
            const lineX = snappedX + i * gridSize;
            // Calculate distance from mouseX to the current vertical line
            const distToMouseX = Math.abs(lineX - mouseX);
            // Opacity based on X distance, power curve for sharper falloff near cursor
            let opacityX = Math.pow(Math.max(0, 1 - distToMouseX / falloffDivisor), 2);

            // Consider Y influence: if mouse Y is far from the line's segment, reduce opacity
            const lineCenterY = snappedY + highlightAreaSize / 2;
            const distToMouseYFromCenter = Math.abs(lineCenterY - mouseY);
            // Reduce opacity if mouse Y is outside the core highlight area for this line
            opacityX *= Math.pow(Math.max(0, 1 - distToMouseYFromCenter / (highlightAreaSize/1.5) ), 0.5);


            let currentLineOpacity = baseHighlightOpacity * opacityX * overallOpacity;
            if (currentLineOpacity > 0.015) { // Threshold to avoid drawing nearly invisible lines
                ctx.strokeStyle = `rgba(${baseLineColorRGB}, ${currentLineOpacity})`;
                ctx.beginPath();
                ctx.moveTo(lineX, snappedY);
                ctx.lineTo(lineX, snappedY + highlightAreaSize);
                ctx.stroke();
            }

            // Horizontal lines
            const lineY = snappedY + i * gridSize;
            // Calculate distance from mouseY to the current horizontal line
            const distToMouseY = Math.abs(lineY - mouseY);
            let opacityY = Math.pow(Math.max(0, 1 - distToMouseY / falloffDivisor), 2);

            // Consider X influence
            const lineCenterX = snappedX + highlightAreaSize / 2;
            const distToMouseXFromCenter = Math.abs(lineCenterX - mouseX);
            opacityY *= Math.pow(Math.max(0, 1 - distToMouseXFromCenter / (highlightAreaSize/1.5) ), 0.5);

            currentLineOpacity = baseHighlightOpacity * opacityY * overallOpacity;
            if (currentLineOpacity > 0.015) {
                ctx.strokeStyle = `rgba(${baseLineColorRGB}, ${currentLineOpacity})`;
                ctx.beginPath();
                ctx.moveTo(snappedX, lineY);
                ctx.lineTo(snappedX + highlightAreaSize, lineY);
                ctx.stroke();
            }
        }

        animationFrameId = requestAnimationFrame(drawEffect);
    }

    // No initial draw call needed here, effect starts on first mousemove into container.
});
