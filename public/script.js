let amuletData = null;
let rotationData = { a: 0, b: 0, g: 0 };
let sparkles = []; // キラキラを保存する配列
let myp5 = null;   // p5のインスタンスを管理
const socket = io();

// センサーデータの受信
socket.on('sensor_data', (data) => {
    rotationData = data;
});

// 1. ページ読み込み時にQRコードを自動生成
window.onload = () => {
    const currentUrl = window.location.href;
    // URLの最後が index.html なら smart.html に書き換え、なければ末尾に追加
    let baseUrl = currentUrl.split('?')[0].split('#')[0];
    if (baseUrl.endsWith('index.html')) {
        baseUrl = baseUrl.replace('index.html', 'smart.html');
    } else {
        baseUrl = baseUrl.endsWith('/') ? baseUrl + 'smart.html' : baseUrl + '/smart.html';
    }

    console.log("QR Code URL:", baseUrl); // デバッグ用

    // QRコードを表示する
    const qrElement = document.getElementById('qrcode');
    if (qrElement) {
        qrElement.innerHTML = `<img src="https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(baseUrl)}" alt="QR Code">`;
    }
};

// 2. お守り生成メイン関数
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
        
        if (result.data && result.data.length > 0) {
            amuletData = result.data[0];
        } else {
            throw new Error("データが空です");
        }

        // 画面の切り替え
        document.getElementById('setupArea').style.display = 'none';
        document.getElementById('resultArea').style.display = 'block';
        document.getElementById('amuletMessage').textContent = amuletData.message;
        document.getElementById('itemDisplay').textContent = "✧ Lucky Item: " + amuletData.item + " ✧";

        // 生成のたびにキラキラの位置をランダムに変える✧
        sparkles = [];
        for(let i=0; i<40; i++) {
            sparkles.push({
                x: Math.random() * 250 - 125,
                y: Math.random() * 250 - 125,
                z: Math.random() * 250 - 125,
                s: Math.random() * 2.5 + 1,
                offset: Math.random() * 1000
            });
        }

        // 既存のキャンバスを消去して新しく作成
        if (myp5) myp5.remove();
        myp5 = new p5(sketch, 'canvas-container');

    } catch (e) {
        console.error(e);
        alert("守護霊との交信に失敗しました。リロードしてやり直してください。");
    } finally {
        document.getElementById('loading').classList.remove('show');
    }
}

// 3. p5.js 描画ロジック
const sketch = (p) => {
    p.setup = () => {
        p.createCanvas(320, 320, p.WEBGL);
    };
    
    p.draw = () => {
        if (!amuletData) return;
        
        // 背景を透明にする（CSSの背景を活かすため）
        p.clear(); 

        // --- 光の設定（影を消して明るく見せる） ---
        p.ambientLight(255); 
        p.pointLight(255, 255, 255, 0, 0, 200);

        // ゆっくりとした浮遊感
        let floating = p.sin(p.frameCount * 0.04) * 12;

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
        p.stroke(255, 220); // 繊細な白い縁取り
        p.strokeWeight(1.5);

        // --- 図形の種類を分岐 ---
        const shape = (amuletData.shape || 'sphere').toLowerCase();
        
        if (shape === 'box') {
            p.box(75);
        } else if (shape === 'cone') {
            p.cone(55, 95);
        } else if (shape === 'torus') {
            p.torus(50, 18);
        } else if (shape === 'cylinder') {
            p.cylinder(45, 85);
        } else if (shape === 'ellipsoid') {
            p.ellipsoid(45, 65, 45);
        } else {
            p.sphere(58, 28, 28);
        }

        // 装飾：お守りの周りに「光の輪」を追加
        p.noFill();
        p.stroke(col);
        p.strokeWeight(1);
        p.ellipse(0, 0, 120, 120);
        
        p.pop();

        // 空間に漂うキラキラ✧
        p.noStroke();
        sparkles.forEach((s, i) => {
            p.push();
            // アニメーション
            let blink = p.map(p.sin(p.frameCount * 0.05 + s.offset), -1, 1, 80, 255);
            p.fill(255, 255, 255, blink);
            p.translate(s.x, s.y, s.z);
            p.sphere(s.s);
            p.pop();
        });
    };
};