import React, { useRef, useEffect, useState } from 'react';

const GameCanvas = () => {
  const canvasRef = useRef(null);
  const [width, setWidth] = useState(window.innerWidth);
  const [height, setHeight] = useState(window.innerHeight - 100); // 操作ボタン分引く

  const [playerX, setPlayerX] = useState(width / 2 - 15);
  const [playerLives, setPlayerLives] = useState(3);
  const [bullets, setBullets] = useState([]);
  const [enemies, setEnemies] = useState([]);
  const [enemyBullets, setEnemyBullets] = useState([]);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  const enemyDirection = useRef(1);
  const enemySpeed = 2;
  const enemyDropDistance = 10;

  // リサイズ対応
  useEffect(() => {
    const handleResize = () => {
      setWidth(window.innerWidth);
      setHeight(window.innerHeight - 100);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 初期敵配置
  useEffect(() => {
    const initialEnemies = [];
    const enemyWidth = 30;
    const enemyHeight = 15;
    const rows = 2;
    const cols = 6;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        initialEnemies.push({
          x: col * (enemyWidth + 10) + 30,
          y: row * (enemyHeight + 10) + 60,
          width: enemyWidth,
          height: enemyHeight,
        });
      }
    }
    setEnemies(initialEnemies);
  }, []);

  // 他の useEffect は変わらず、プレイヤー操作と描画に focus

  // キーボード操作
  useEffect(() => {
    if (gameOver) return;

    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        setPlayerX((prevX) => Math.max(prevX - 15, 0));
      } else if (e.key === 'ArrowRight') {
        setPlayerX((prevX) => Math.min(prevX + 15, width - 30));
      } else if (e.key === ' ') {
        setBullets((oldBullets) => [
          ...oldBullets,
          { x: playerX + 12, y: height - 40 },
        ]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [playerX, gameOver, width, height]);

  // 描画処理
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = 'green';
    ctx.fillRect(playerX, height - 30, 30, 10);

    ctx.fillStyle = 'red';
    bullets.forEach(({ x, y }) => {
      ctx.fillRect(x, y, 5, 10);
    });

    ctx.fillStyle = 'blue';
    enemies.forEach(({ x, y, width, height }) => {
      ctx.fillRect(x, y, width, height);
    });

    ctx.fillStyle = 'purple';
    enemyBullets.forEach(({ x, y }) => {
      ctx.fillRect(x, y, 5, 10);
    });

    ctx.fillStyle = 'black';
    ctx.font = '20px Arial';
    ctx.fillText(`得点: ${score}`, 10, 25);
    ctx.fillText(`残機: ${playerLives}`, 10, 50);

    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = 'white';
      ctx.font = '30px Arial';
      ctx.fillText('GAME OVER', width / 2 - 90, height / 2);
    }
  }, [playerX, bullets, enemies, enemyBullets, score, playerLives, gameOver, width, height]);

  // タッチ操作ハンドラー
  const handleLeft = () => {
    setPlayerX((prevX) => Math.max(prevX - 15, 0));
  };
  const handleRight = () => {
    setPlayerX((prevX) => Math.min(prevX + 15, width - 30));
  };
  const handleShoot = () => {
    setBullets((oldBullets) => [
      ...oldBullets,
      { x: playerX + 12, y: height - 40 },
    ]);
  };

  return (
    <div style={{ textAlign: 'center' }}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{ border: '1px solid black', touchAction: 'none' }}
      />
      {/* タッチボタン */}
      <div style={{ marginTop: 5 }}>
        <button onClick={handleLeft} style={{ fontSize: 20, marginRight: 10 }}>←</button>
        <button onClick={handleShoot} style={{ fontSize: 20, marginRight: 10 }}>●</button>
        <button onClick={handleRight} style={{ fontSize: 20 }}>→</button>
      </div>
    </div>
  );
};

export default GameCanvas;
