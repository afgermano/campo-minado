//para iniciar na tela home
if (!document.referrer.includes('home.html') && 
    sessionStorage.getItem('veioDaHome') !== 'true') {
    window.location.href = './home.html';
}

const bombaImg = new Image();
bombaImg.src = "midia/bomba.png";

const bandeiraImg = new Image();
bandeiraImg.src = "midia/Group 1.png";

// redesenha quando as imagens terminarem de carregar
bombaImg.onload = () => draw();
bandeiraImg.onload = () => draw();

const explosionSound = new Audio("midia/explosao.mp3");
explosionSound.volume = 0.6;

function playExplosionSound(){
    const sound = explosionSound.cloneNode();
    sound.volume = 0.6;
    // se o arquivo não existir (ou o navegador bloquear o áudio), ignora o erro
    const promessa = sound.play();
    if (promessa) promessa.catch(() => {});
}

let particles = [];
let animandoParticulas = false;

function triggerExplosion(tile){
    const centerX = tile.i * step + tileSize / 2;
    const centerY = tile.j * step + tileSize / 2;

    for (let i = 0; i < 40; i++){
        particles.push({
            x: centerX,
            y: centerY,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.5) * 6,
            size: Math.random() * 6 + 4,
            life: 1
        });
    }

    // só abre um loop de animação por vez
    if (!animandoParticulas) animateParticles();
}

function animateParticles(){
    animandoParticulas = true;

    function loop(){
        draw();

        particles.forEach((p) => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.1;
            p.life -= 0.02;
            p.size *= 0.96;

            if (p.life <= 0) return;

            ctx.fillStyle = `rgba(255, ${Math.floor(Math.random()*150)}, 0, ${p.life})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        });

        // remove as partículas mortas depois do forEach (sem splice dentro do loop)
        particles = particles.filter(p => p.life > 0);

        if (particles.length > 0){
            requestAnimationFrame(loop);
        } else {
            animandoParticulas = false;
            draw();
        }
    }

    loop();
}

let shakeIntensity = 0;
let shakeDuration = 0;

function triggerShake(intensity = 8, duration = 20){
    shakeIntensity = intensity;
    shakeDuration = duration;
}

function draw(){
    // limpa antes de aplicar o tremor, senão sobram faixas sujas nas bordas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();

    if (shakeDuration > 0){
        const dx = (Math.random() - 0.5) * shakeIntensity;
        const dy = (Math.random() - 0.5) * shakeIntensity;
        ctx.translate(dx, dy);
        shakeDuration--;
    }

    tiles.forEach(drawTile);
    if (hoverTile) drawHoverBox();

    ctx.restore();
}

const canvas = document.getElementById('quadriculado');
const ctx = canvas.getContext('2d');

const placares = document.querySelectorAll(".contador");

const nTileX = 11;
const nTileY = 11;
const step = 51;
const tileSize = 50;

let tiles = [];
let gameOver = false;
let bloqueado = false; // true enquanto o modal de "BOOM" ainda vai abrir
let pontuacao = [0, 0];
let vidas = [3, 3];
let playerAtual = 0;

// funções
const TOTAL_RODADAS = 10;
let rodadasRestantes = TOTAL_RODADAS;
let currentFunction = null;

// hover
let hoverTile = null;

// centro
const offsetX = Math.floor(nTileX / 2);
const offsetY = Math.floor(nTileY / 2);

class Tile {
    constructor(i, j){
        this.i = i;
        this.j = j;
        this.xValue = i - offsetX;
        this.yValue = offsetY - j;
        this.isOpen = false;
        this.isBomb = false;
        this.correct = false;
    }
}

// ================= PONTUAÇÃO E VIDAS =================
function updateScore(){
    if (placares.length >= 2){
        placares[0].value = pontuacao[0].toString().padStart(3,'0');
        placares[1].value = pontuacao[1].toString().padStart(3,'0');
    }
    updateVidas();
}

function updateVidas(){
    const v1 = document.getElementById("vidasJ1");
    const v2 = document.getElementById("vidasJ2");
    if (v1) v1.innerText = vidas[0] > 0 ? getHearts(vidas[0]) : "💀";
    if (v2) v2.innerText = vidas[1] > 0 ? getHearts(vidas[1]) : "💀";
}

// ================= TROCA DE TURNO =================
function updateVisualTurno(){
    canvas.classList.remove("player1-board", "player2-board");
    placares[0].classList.remove("player1", "player2");
    placares[1].classList.remove("player1", "player2");

    if (playerAtual === 0){
        canvas.classList.add("player1-board");
        placares[0].classList.add("player1");
    } else {
        canvas.classList.add("player2-board");
        placares[1].classList.add("player2");
    }
}

// ================= FIM DE JOGO =================
function endGame(){
    gameOver = true;

    let mensagem = "";

    if (pontuacao[0] > pontuacao[1]){
        mensagem = "🏆 Jogador 1 venceu!";
    } else if (pontuacao[1] > pontuacao[0]){
        mensagem = "🏆 Jogador 2 venceu!";
    } else {
        mensagem = "🤝 Empate!";
    }

    setTimeout(() => {
        showModal("Fim de jogo 🏁", mensagem);
    }, 200);
}

// ================= FUNÇÕES =================

function generateFunction() {
    let tipo;
    let a, b, c, x, y;
    let targetTile;
    let attempts = 0;
    const maxAttempts = 1000;

    tipo = Math.random() < 0.5 ? 1 : 2;

    if (tipo === 1) {
        do {
            // se tentar muitas vezes sem achar tile livre, tenta o outro tipo
            if (attempts > maxAttempts) {
                tipo = 2;
                attempts = 0;
                break;
            }

            a = Math.floor(Math.random() * 5) + 1;
            b = Math.floor(Math.random() * 11) - 5;
            x = Math.floor(Math.random() * 11) - 5;
            y = a * x + b;

            targetTile = tiles.find(t => t.xValue === x && t.yValue === y);
            attempts++;

        } while (y < -5 || y > 5 || !targetTile || targetTile.isOpen);

        if (tipo === 1) {
            return { tipo: 1, a, b, x, y };
        }
    }

    // 2º grau (também usado como fallback do 1º grau)
    attempts = 0;
    do {
        a = Math.floor(Math.random() * 3) + 1;
        b = Math.floor(Math.random() * 7) - 3;
        c = Math.floor(Math.random() * 7) - 3;
        x = Math.floor(Math.random() * 7) - 3;
        y = a * (x * x) + (b * x) + c;

        targetTile = tiles.find(t => t.xValue === x && t.yValue === y);
        attempts++;

        // segurança: se o tabuleiro estiver muito cheio, encerra o jogo
        if (attempts > maxAttempts) {
            endGame();
            return null;
        }

    } while (y < -5 || y > 5 || !targetTile || targetTile.isOpen);

    return { tipo: 2, a, b, c, x, y };
}

function generateFunctions() {
    rodadasRestantes = TOTAL_RODADAS;
    currentFunction = generateFunction();
    updateUI();
}

// monta o texto da função sem "1x", sem "+ 0" e sem espaço duplo
// ex.: y = x² - 3x + 2  |  y = 2x - 3  |  y = 3x
function formatPoly(f) {
    const termos = f.tipo === 1
        ? [[f.a, "x"], [f.b, ""]]
        : [[f.a, "x²"], [f.b, "x"], [f.c, ""]];

    let s = "";
    termos.forEach(([coef, variavel]) => {
        if (coef === 0) return;

        const abs = Math.abs(coef);
        const corpo = (variavel !== "" && abs === 1) ? variavel : `${abs}${variavel}`;

        if (s === "") {
            s = (coef < 0 ? "-" : "") + corpo;
        } else {
            s += (coef < 0 ? " - " : " + ") + corpo;
        }
    });

    return `y = ${s || "0"}`;
}

function updateUI() {
    const f = currentFunction;
    if (!f) return;

    document.getElementById("showQuestao").innerText =
        `${formatPoly(f)} | x = ${f.x}`;
}

function addSolvedFunction(f) {
    const el = document.getElementById("funcoesResolvidas");
    const div = document.createElement("div");

    div.innerText = `${formatPoly(f)} (x=${f.x})`;
    div.style.color = "gray";
    div.style.textDecoration = "line-through";

    el.appendChild(div);
}

// ================= GRID =================
function generateTiles(){
    tiles = [];

    for (let i = 0; i < nTileX; i++){
        for (let j = 0; j < nTileY; j++){
            tiles.push(new Tile(i, j));
        }
    }
}

function getTile(i, j){
    return tiles.find(t => t.i === i && t.j === j);
}

// ================= DESENHO =================
function drawTile(tile){
    let x = (tile.i * step) + 1;
    let y = (tile.j * step) + 1;

    ctx.fillStyle = "#aaa";
    ctx.fillRect(x, y, tileSize, tileSize);

    if (tile.xValue === 0 || tile.yValue === 0){
        ctx.fillStyle = "#9b9999";
        ctx.fillRect(x, y, tileSize, tileSize);
    }

    if (hoverTile){
        if (tile.i === hoverTile.i || tile.j === hoverTile.j){
            ctx.fillStyle = (playerAtual === 0) ? "#6a77cf67" : "#6acf7267";
            ctx.fillRect(x, y, tileSize, tileSize);
        }
    }

    if (tile.isOpen){
        if (tile.correct){
            if (bandeiraImg.complete && bandeiraImg.naturalWidth > 0){
                ctx.drawImage(bandeiraImg, x, y, tileSize, tileSize);
            } else {
                ctx.fillStyle = "green";
                ctx.fillRect(x, y, tileSize, tileSize);
            }
        } else if (tile.isBomb){
            if (bombaImg.complete && bombaImg.naturalWidth > 0){
                ctx.drawImage(bombaImg, x, y, tileSize, tileSize);
            } else {
                ctx.fillStyle = "red";
                ctx.fillRect(x, y, tileSize, tileSize);
            }
        }
    }

    ctx.fillStyle = "black";
    ctx.font = "15px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    if (tile.j === offsetY){
        ctx.fillText(tile.xValue, x + tileSize/2, y + tileSize/2);
    }

    if (tile.i === offsetX){
        ctx.fillText(tile.yValue, x + tileSize/2, y + tileSize/2);
    }
}

// ================= MOUSE =================

// converte a posição do mouse (tela) em tile, descontando a borda do canvas
// e a escala entre o tamanho do CSS e o tamanho interno do canvas
function tileFromEvent(e){
    const rect = canvas.getBoundingClientRect();
    const cs = getComputedStyle(canvas);

    const bordaEsq = parseFloat(cs.borderLeftWidth) || 0;
    const bordaTopo = parseFloat(cs.borderTopWidth) || 0;
    const bordaH = bordaEsq + (parseFloat(cs.borderRightWidth) || 0);
    const bordaV = bordaTopo + (parseFloat(cs.borderBottomWidth) || 0);

    const larguraUtil = rect.width - bordaH;
    const alturaUtil = rect.height - bordaV;
    if (larguraUtil <= 0 || alturaUtil <= 0) return undefined;

    const mouseX = (e.clientX - rect.left - bordaEsq) * (canvas.width / larguraUtil);
    const mouseY = (e.clientY - rect.top - bordaTopo) * (canvas.height / alturaUtil);

    return getTile(Math.floor(mouseX / step), Math.floor(mouseY / step));
}

canvas.addEventListener("mousemove", (e) => {
    hoverTile = tileFromEvent(e);

    updateHoverUI();
    draw();
});

canvas.addEventListener("mouseleave", () => {
    hoverTile = null;

    updateHoverUI();
    draw();
});

function drawHoverBox(){
    let x = (hoverTile.i * step) + 1;
    let y = (hoverTile.j * step) + 1;

    ctx.strokeStyle = (playerAtual === 0) ? "#6a77cf" : "#2d8134";
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, tileSize, tileSize);
}

function updateHoverUI(){
    const el = document.getElementById("coordenadaAtual");
    if (!el) return;

    el.innerText = hoverTile
        ? `(${hoverTile.xValue}, ${hoverTile.yValue})`
        : "(-, -)";
}

// ================= CLIQUE =================
canvas.addEventListener("click", (e) => {
    if (gameOver || bloqueado) return;

    // usa a posição do próprio clique, não o último mousemove
    const tile = tileFromEvent(e);
    if (!tile) return;
    hoverTile = tile;

    const jogadorDaJogada = playerAtual;
    const f = currentFunction;

    if (tile.isOpen) return;

    if (tile.xValue === f.x && tile.yValue === f.y){
        tile.isOpen = true;
        tile.correct = true;

        pontuacao[jogadorDaJogada] += 100;
        updateScore();

        addSolvedFunction(f);

        rodadasRestantes--;

        if (rodadasRestantes <= 0){
            endGame();
            draw();
            return;
        }

        currentFunction = generateFunction();
        if (!currentFunction){
            draw();
            return;
        }

        updateUI();

    } else {
        tile.isOpen = true;
        tile.isBomb = true;

        // impede cliques durante os 200 ms antes do modal abrir
        bloqueado = true;

        triggerExplosion(tile);
        triggerShake(10, 25);
        playExplosionSound();

        vidas[jogadorDaJogada]--;
        updateScore();

        if (vidas[jogadorDaJogada] <= 0){
            gameOver = true;
            draw();

            setTimeout(() => {
                bloqueado = false;
                let vencedor = (jogadorDaJogada === 0) ? 2 : 1;
                showModal(
                    "Game Over",
                    `Perdedor: ${jogadorDaJogada + 1}💀\n Vencedor: ${vencedor}🏆`
                );
            }, 200);

            return;
        }

        setTimeout(() => {
            bloqueado = false;
            showModal(
                "BOOM! 💣",
                `-1 vida... :( \n \n ${getHearts(vidas[jogadorDaJogada])}`
            );
        }, 200);
    }

    // 🔄 troca turno
    playerAtual = (playerAtual + 1) % 2;
    updateVisualTurno();

    updateScore();
    draw();
});

function getHearts(v){
    return "❤️".repeat(v);
}

// ================= RESET =================
function restartGame(){
    gameOver = false;
    bloqueado = false;
    pontuacao = [0, 0];
    vidas = [3, 3];
    playerAtual = 0;
    particles = [];
    shakeDuration = 0;
    hoverTile = null;

    document.getElementById("funcoesResolvidas").innerHTML = "";

    generateTiles();
    generateFunctions();
    updateScore();
    updateHoverUI();
    draw();
    updateVisualTurno();
}

// ================= START =================
generateTiles();
generateFunctions();
updateScore();
draw();
updateVisualTurno();