// adiciona imagem da bomba
const bombaImg = new Image();
bombaImg.src = "midia/bomba.png";

bombaImg.onload = () => {
    draw();
};

const canvas = document.getElementById('quadriculado');
const ctx = canvas.getContext('2d');

const nTileX = 11;
const nTileY = 11;
const step = 51;
const tileSize = 50;

let tiles = [];
let gameOver = false;

// funções
let functionsList = [];
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

// ================= PRINCIPAL =================

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

    // fundo
    ctx.fillStyle = "#aaa";
    ctx.fillRect(x, y, tileSize, tileSize);

    // eixo
    if (tile.xValue === 0 || tile.yValue === 0){
        ctx.fillStyle = "#ddd";
        ctx.fillRect(x, y, tileSize, tileSize);
    }

    // destaque do eixo
    if (hoverTile){
        if (tile.i === hoverTile.i || tile.j === hoverTile.j){
            ctx.fillStyle = "rgba(0,0,255,0.1)";
            ctx.fillRect(x, y, tileSize, tileSize);
        }
    }

    if (tile.isOpen){

        if (tile.correct){
            ctx.fillStyle = "green";
            ctx.fillRect(x, y, tileSize, tileSize);
        }

        else if (tile.isBomb){
            // tenta desenhar imagem
            if (bombaImg.complete){
                ctx.drawImage(bombaImg, x, y, tileSize, tileSize);
            } else {
                ctx.fillStyle = "red";
                ctx.fillRect(x, y, tileSize, tileSize);
            }
        }
    }

    // mostra números no canvs
    ctx.fillStyle = "black";
    ctx.font = "12px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    if (tile.j === offsetY){
        ctx.fillText(tile.xValue, x + tileSize/2, y + tileSize/2);
    }

    if (tile.i === offsetX){
        ctx.fillText(tile.yValue, x + tileSize/2, y + tileSize/2);
    }
}

// ================= HOVER =================

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

    ctx.strokeStyle = "blue";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, tileSize, tileSize);
}

function updateHoverUI(){
    const el = document.getElementById("coordenadaAtual");

    if (hoverTile && el){
        el.innerText = `(${hoverTile.xValue}, ${hoverTile.yValue})`;
    }
}

// ================= MOUSE =================

canvas.addEventListener("click", () => {
    if (gameOver || !hoverTile) return;

    const tile = hoverTile;
    const f = currentFunction;

    if (tile.isOpen) return;

    if (tile.xValue === f.x && tile.yValue === f.y){

        tile.isOpen = true;
        tile.correct = true;

        addSolvedFunction(f);

        currentFunction = functionsList.shift();

        if (!currentFunction){
            setTimeout(() => {
                alert("🏆 Você venceu!");
                restartGame();
            }, 200);
        } else {
            updateUI();
        }

    } else {
        tile.isOpen = true;
        tile.isBomb = true;

        setTimeout(() => {
            alert("💥 Errou!");
            restartGame();
        }, 200);
    }

    draw();
});

// ================= RESET DO JOGO =================

function restartGame(){
    gameOver = false;
    document.getElementById("funcoesResolvidas").innerHTML = "";

    generateTiles();
    generateFunctions();
    draw();
}

// ================= INICIO JOGO =================

generateTiles();
generateFunctions();
draw();