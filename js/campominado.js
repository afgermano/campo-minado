// imagem da bomba
const bombaImg = new Image();
bombaImg.src = "midia/bomba.png";

const bandeiraImg = new Image();
bandeiraImg.src = "midia/Group 1.png";

bombaImg.onload = () => {
    draw();
};

const canvas = document.getElementById('quadriculado');
const ctx = canvas.getContext('2d');

const placares = document.querySelectorAll(".contador");

const nTileX = 11;
const nTileY = 11;
const step = 51;
const tileSize = 50;

let tiles = [];
let gameOver = false;
let pontuacao = [0, 0];
let vidas = [3, 3];
let playerAtual = 0;

// funções
let functionsList = [];
let currentFunction = null;

// hover
let hoverTile = null;

// centro
const offsetX = Math.floor(nTileX / 2);
const offsetY = Math.floor(nTileY / 2);

// troca de turno

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

// ================= PONTUAÇÃO =================
function updateScore(){
    if (placares.length >= 2){
        placares[0].value = pontuacao[0].toString().padStart(3,'0');
        placares[1].value = pontuacao[1].toString().padStart(3,'0');
    }
}
// ================= TROCA DE TURNO =================
function updateVisualTurno(){
    // remove estilos antigos
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
function generateFunction(){
    let a, b, x, y;

    do {
        a = Math.floor(Math.random() * 5) + 1;
        b = Math.floor(Math.random() * 11) - 5;
        x = Math.floor(Math.random() * 11) - 5;

        y = a * x + b;

    } while (y < -5 || y > 5);

    return { a, b, x, y };
}

function generateFunctions(){
    functionsList = [];

    for(let i = 0; i < 10; i++){
        functionsList.push(generateFunction());
    }

    currentFunction = functionsList.shift();
    updateUI();
}

function updateUI(){
    const f = currentFunction;

    document.getElementById("showQuestao").innerText =
        `y = ${f.a}x ${f.b >= 0 ? '+' : ''} ${f.b} | x = ${f.x}`;
}

function addSolvedFunction(f){
    const el = document.getElementById("funcoesResolvidas");

    const div = document.createElement("div");
    div.innerText = `y = ${f.a}x ${f.b >= 0 ? '+' : ''} ${f.b} (x=${f.x})`;

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
function draw(){
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    tiles.forEach(drawTile);

    if (hoverTile) drawHoverBox();
}

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
            if (bandeiraImg.complete){
                ctx.drawImage(bandeiraImg, x, y, tileSize, tileSize);
            } else {
                ctx.fillStyle = "green"; // fallback
                ctx.fillRect(x, y, tileSize, tileSize);
            }
        }else if (tile.isBomb){
            if (bombaImg.complete){
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
canvas.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();

    const mouseX = (e.clientX - rect.left) * (canvas.width / rect.width);
    const mouseY = (e.clientY - rect.top) * (canvas.height / rect.height);

    const i = Math.floor(mouseX / step);
    const j = Math.floor(mouseY / step);

    hoverTile = getTile(i, j);

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

    if (hoverTile && el){
        el.innerText = `(${hoverTile.xValue}, ${hoverTile.yValue})`;
    }
}

// ================= CLIQUE =================

canvas.addEventListener("click", () => {
    if (gameOver || !hoverTile) return;

    const jogadorDaJogada = playerAtual; 

    const tile = hoverTile;
    const f = currentFunction;

    if (tile.isOpen) return;

    if (tile.xValue === f.x && tile.yValue === f.y){

        tile.isOpen = true;
        tile.correct = true;

        pontuacao[jogadorDaJogada] += 100;
        updateScore();

        addSolvedFunction(f);

        currentFunction = functionsList.shift();

        if (!currentFunction){
            endGame();
            return;
        } else {
            updateUI();
        }

    } else {
        tile.isOpen = true;
        tile.isBomb = true;

        vidas[jogadorDaJogada]--; 
        updateScore();

        // 💀 GAME OVER
        if (vidas[jogadorDaJogada] <= 0){
            gameOver = true;

            setTimeout(() => {
                let vencedor = (jogadorDaJogada === 0) ? 2 : 1;

                showModal(
                    "Game Over 💀",
                    `💀Jogador ${jogadorDaJogada + 1} perdeu!\n🏆 Jogador ${vencedor} venceu!`
                );
            }, 200);

            return;
        }

        // ❌ ERRO
        setTimeout(() => {
            showModal(
                "Erro!",
                `💥 Você perdeu 1 vida!\n${getHearts(vidas[jogadorDaJogada])}`
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
    pontuacao = [0, 0];
    vidas = [3, 3];
    playerAtual = 0;

    document.getElementById("funcoesResolvidas").innerHTML = "";

    generateTiles();
    generateFunctions();
    updateScore();
    draw();
    updateVisualTurno();
}

// ================= START =================
generateTiles();
generateFunctions();
updateScore();
draw();
updateVisualTurno();