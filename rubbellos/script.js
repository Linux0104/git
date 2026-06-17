const SYMBOLS = ['💎', '🍎', '🍊', '🍇', '⭐', '🎁', '🎰', '💰', '👑'];
const SCRATCH_THRESHOLD = 30; // % der Fläche die gekratzt werden muss

let gameState = {
    cards: [],
    scratchedCards: [],
    selectedCount: 0,
    isProcessing: false,
    canvases: []
};

window.addEventListener('message', (event) => {
    const data = event.data;

    if (data.action === 'setVisible') {
        if (data.data === true) {
            document.getElementById('container').style.display = 'flex';
            initializeGame();
        } else {
            document.getElementById('container').style.display = 'none';
            resetGame();
        }
    } else if (data.action === 'showWin') {
        showResult(true, data.data.prize);
    } else if (data.action === 'showLoss') {
        showResult(false, 0);
    }
});

function initializeGame() {
    gameState = {
        cards: [],
        scratchedCards: [],
        selectedCount: 0,
        isProcessing: false,
        canvases: []
    };

    const grid = document.getElementById('cardsGrid');
    grid.innerHTML = '';
    updateProgress();

    // 9 Zufallskarten generieren
    // Symbolverteilung: max. 2x pro Symbol, drittes nur mit 5% Chance
    let symbolCounts = {};
    for (let s of SYMBOLS) symbolCounts[s] = 0;
    for (let i = 0; i < 9; i++) {
        let available = SYMBOLS.filter(s => symbolCounts[s] < 2);
        let symbol = available[Math.floor(Math.random() * available.length)];
        // 5% Chance auf ein drittes Vorkommen
        if (symbolCounts[symbol] === 2) {
            if (Math.random() < 0.05) {
                symbolCounts[symbol]++;
            } else {
                // Wähle ein anderes Symbol mit weniger als 2 Vorkommen
                available = SYMBOLS.filter(s => symbolCounts[s] < 2);
                symbol = available[Math.floor(Math.random() * available.length)];
            }
        }
        symbolCounts[symbol]++;
        gameState.cards.push(symbol);
        // Container für Karte
        const cardContainer = document.createElement('div');
        cardContainer.className = 'card-wrapper';
        cardContainer.id = `card-wrapper-${i}`;
        // Symbol
        const card = document.createElement('div');
        card.className = 'card';
        card.id = `card-${i}`;
        card.innerHTML = `${symbol}`;
        cardContainer.appendChild(card);
        // Canvas für Kratzer-Effekt — Neon Cyan Glass-Look
        const canvas = document.createElement('canvas');
        canvas.className = 'scratch-canvas';
        canvas.id = `canvas-${i}`;
        canvas.width = 120;
        canvas.height = 120;
        const ctx = canvas.getContext('2d');

        // Base dark fill
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, '#0f172a');
        gradient.addColorStop(0.5, '#1e293b');
        gradient.addColorStop(1, '#0f172a');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Subtle radial cyan glow
        const radial = ctx.createRadialGradient(60, 60, 5, 60, 60, 80);
        radial.addColorStop(0, 'rgba(34, 211, 238, 0.25)');
        radial.addColorStop(1, 'rgba(34, 211, 238, 0)');
        ctx.fillStyle = radial;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Diagonal stripes for "scratch surface" feel
        ctx.strokeStyle = 'rgba(34, 211, 238, 0.10)';
        ctx.lineWidth = 1;
        for (let x = -canvas.height; x < canvas.width; x += 8) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x + canvas.height, canvas.height);
            ctx.stroke();
        }

        // Question mark in cyan
        ctx.fillStyle = 'rgba(34, 211, 238, 0.85)';
        ctx.font = 'bold 42px "Segoe UI", Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(34, 211, 238, 0.8)';
        ctx.shadowBlur = 12;
        ctx.fillText('?', canvas.width / 2, canvas.height / 2);
        ctx.shadowBlur = 0;

        // Inner neon border
        ctx.strokeStyle = 'rgba(34, 211, 238, 0.45)';
        ctx.lineWidth = 2;
        ctx.strokeRect(3, 3, canvas.width - 6, canvas.height - 6);

        canvas.addEventListener('mousedown', startScratch);
        canvas.addEventListener('mousemove', scratch);
        canvas.addEventListener('mouseup', stopScratch);
        canvas.addEventListener('mouseleave', stopScratch);
        cardContainer.appendChild(canvas);
        grid.appendChild(cardContainer);
        gameState.canvases.push({
            canvas: canvas,
            ctx: ctx,
            isDragging: false,
            scratchPercent: 0,
            index: i
        });
    }
}

function startScratch(e) {
    if (gameState.isProcessing) return;
    const canvas = e.target;
    const canvasData = gameState.canvases.find(c => c.canvas === canvas);
    if (!canvasData || gameState.scratchedCards.includes(canvasData.index)) return;
    canvasData.isDragging = true;
}

function scratch(e) {
    const canvas = e.target;
    if (!canvas.classList.contains('scratch-canvas')) return;

    const canvasData = gameState.canvases.find(c => c.canvas === canvas);
    if (!canvasData || !canvasData.isDragging || gameState.scratchedCards.includes(canvasData.index)) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvasData.ctx;
    const brushSize = 25;

    // Kratzer-Effekt zeichnen
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';

    // Kratzer-Prozentsatz berechnen
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let transparentPixels = 0;

    for (let i = 3; i < imageData.data.length; i += 4) {
        if (imageData.data[i] < 128) {
            transparentPixels++;
        }
    }

    canvasData.scratchPercent = (transparentPixels / (canvas.width * canvas.height)) * 100;

    // Wenn genug gekratzt wurde
    if (canvasData.scratchPercent >= SCRATCH_THRESHOLD) {
        completeCardScratch(canvasData.index);
    }
}

function stopScratch(e) {
    const canvas = e.target;
    const canvasData = gameState.canvases.find(c => c.canvas === canvas);
    if (canvasData) {
        canvasData.isDragging = false;
    }
}

function completeCardScratch(index) {
    if (gameState.scratchedCards.includes(index)) return;

    gameState.scratchedCards.push(index);
    gameState.selectedCount++;
    updateProgress();

    const canvasData = gameState.canvases.find(c => c.index === index);
    const canvas = canvasData.canvas;

    // Canvas komplett transparent machen
    const ctx = canvasData.ctx;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    canvas.style.pointerEvents = 'none';

    // Karte zeigen
    const card = document.getElementById(`card-${index}`);
    card.classList.add('scratched');

    // Wenn alle 9 Karten aufgerubbelt
    if (gameState.selectedCount === 9) {
        gameState.isProcessing = true;

        setTimeout(() => {
            const selectedSymbols = gameState.scratchedCards.map(idx => gameState.cards[idx]);
            fetch(`https://${GetParentResourceName()}/scratchCard`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ symbols: selectedSymbols })
            });
        }, 500);
    }
}

function updateProgress() {
    const fill = document.getElementById('progressFill');
    const text = document.getElementById('progressText');
    if (!fill || !text) return;
    const pct = (gameState.selectedCount / 9) * 100;
    fill.style.width = `${pct}%`;
    text.textContent = `${gameState.selectedCount} / 9`;
}

function showResult(isWin, prize) {
    const resultDiv = document.getElementById('result');
    const resultTitle = document.getElementById('resultTitle');
    const resultMessage = document.getElementById('resultMessage');
    const resultContent = resultDiv.querySelector('.result-content');

    resultDiv.classList.remove('hidden');
    resultContent.classList.remove('win', 'loss');

    if (isWin) {
        resultContent.classList.add('win');
        resultTitle.textContent = '🎉 GEWONNEN! 🎉';
        resultMessage.innerHTML = ` <strong>+$${prize.toLocaleString('de-DE')}</strong><br><br>Herzlichen Glückwunsch!`;
    } else {
        resultContent.classList.add('loss');
        resultTitle.textContent = '😢 VERLOREN';
        resultMessage.textContent = 'Viel Glück beim nächsten Mal!';
    }
}

function closeGame() {
    document.getElementById('result').classList.add('hidden');
    document.getElementById('container').style.display = 'none';

    fetch(`https://${GetParentResourceName()}/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
    });
}

function resetGame() {
    gameState = {
        cards: [],
        scratchedCards: [],
        selectedCount: 0,
        isProcessing: false,
        canvases: []
    };
    document.getElementById('result').classList.add('hidden');
    updateProgress();
}

// Buttons verbinden (Funktionalität wie zuvor)
document.addEventListener('DOMContentLoaded', () => {
    const closeBtn = document.querySelector('.close-btn');
    if (closeBtn) closeBtn.addEventListener('click', closeGame);

    const resultBtn = document.getElementById('resultButton');
    if (resultBtn) resultBtn.addEventListener('click', closeGame);
});
