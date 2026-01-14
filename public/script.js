let amuletData = null;
let rotationData = { a: 0, b: 0, g: 0 };
let sparkles = []; // キラキラを保存する配列
const socket = io();

socket.on('sensor_data', (data) => {
    rotationData = data;
});

async function generateAmulet() {
    const trouble = document.getElementById('troubleInput').value;
    if(!trouble) return alert("願いを入力してください");

    document.getElementById('loading').classList.add('show');

    try {
        const response = await fetch('/api/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ trouble: trouble })
        });
        const result = await response.json();
        amuletData = result.data[0];

        document.getElementById('setupArea').style.display = 'none';
        document.getElementById('resultArea').style.display = 'block';
        document.getElementById('amuletMessage').textContent = amuletData.message;
        document.getElementById('itemDisplay').textContent = "ラッキーアイテム: " + amuletData.item;

        // 生成のたびにキラキラの位置をランダムに変える
        sparkles = [];
        for(let i=0; i<30; i++) {
            sparkles.push({
                x: Math.random() * 200 - 100,
                y: Math.random() * 200 - 100,
                z: Math.random() * 200 - 100,
                s: Math.random() * 2 + 1
            });
        }

        new p5(sketch, 'canvas-container');
    } catch (e) {
        alert("通信エラーが発生しました");
    } finally {
        document.getElementById('loading').classList.remove('show');
    }
}

const sketch = (p) => {
    p.setup = () => p.createCanvas(300, 300, p.WEBGL);
    
    p.draw = () => {
        if (!amuletData) return;
        p.background(255); // 白背景で清潔感を出す

        // --- 光の設定（影を消して明るく見せる） ---
        p.ambientLight(255); // 全体を一番明るく
        p.pointLight(255, 255, 255, 0, 0, 150);

        // ゆっくりとした浮遊感
        let floating = p.sin(p.frameCount * 0.05) * 10;

        // スマホからの回転
        let rotX = p.radians(Number(rotationData.b) || 0);
        let rotY = p.radians(Number(rotationData.g) || 0);

        p.push();
        p.rotateX(rotX);
        p.rotateY(rotY);
        p.translate(0, floating, 0);

        // お守りの色と質感
        let col = p.color(amuletData.color || "#FFB6C1");
        p.fill(col);
        p.stroke(255, 200); // 繊細な白い縁取り
        p.strokeWeight(1);

        // --- 図形の種類を増やす（AIの指示に合わせて分岐） ---
        const shape = (amuletData.shape || 'sphere').toLowerCase();
        
        if (shape === 'box') {
            p.box(75);
        } else if (shape === 'cone') {
            p.cone(50, 90);
        } else if (shape === 'torus') {
            p.torus(50, 20);
        } else if (shape === 'cylinder') {
            p.cylinder(40, 80); // 新しい形：円柱
        } else if (shape === 'ellipsoid') {
            p.ellipsoid(40, 60, 40); // 新しい形：楕円
        } else {
            // デフォルトは球体
            p.sphere(55, 24, 24);
        }

        // 装飾：お守りの周りに「光の輪」をランダムな角度で追加
        p.noFill();
        p.stroke(col);
        p.ellipse(0, 0, 110, 110);
        
        p.pop();

        // 空間に漂うキラキラ（Wishcoreな演出）
        p.noStroke();
        sparkles.forEach((s, i) => {
            p.push();
            let blink = p.sin(p.frameCount * 0.1 + i) * 150 + 100;
            p.fill(255, 255, 255, blink);
            p.translate(s.x, s.y, s.z);
            p.sphere(s.s);
            p.pop();
        });
    };
};