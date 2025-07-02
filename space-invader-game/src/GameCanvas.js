import React, { useRef, useEffect, useState } from 'react';
import enemyImg from './assets/enemy.png';

const messages = [
  "ジムに行ったらコロナになったね！",
  "僕の故郷は新潟の糸魚川だね！",
  "えっ、えっ、えっ、うぇっ！、聞こえないね！",
  "僕の作ったパエリアおいしいでしょ！",
  "いつかはげるよ！",
  "最近、不健康なんだよね！",
  "それはチャンスボール理論だね！",
  "今日はネットが高すぎるね！",
  "微分して！微分して！微分して！",
  "積分はどんどん飛ばすね！",
  "落ちるよ！",
  "北高の非常勤もうできないね！",
  "いっ！いでやぁ！！",
  "それは、首が、飛ぶね！",
  "やらしいね～でもできるよ！",
  "難しいね～でもできるよ！",
  "僕は女子は苦手だね！",
  "僕は昔、不登校の生徒の対応で苦労しましたね！",
  "朝生徒に怒鳴るとスッキリするね！",
];

const GameCanvas = () => {
  const canvasRef = useRef(null);
  const width = 300;
  const height = 400;

  const [playerX, setPlayerX] = useState(width / 2 - 15);
  const [playerLives, setPlayerLives] = useState(1);
  const [bullets, setBullets] = useState([]);
  const [enemies, setEnemies] = useState([]);
  const [enemyBullets, setEnemyBullets] = useState([]);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [level, setLevel] = useState(1);
  const [canFire, setCanFire] = useState(true);

  const enemyImageRef = useRef(null);
  const enemyDirection = useRef(1);

  const [message, setMessage] = useState('');
  const [messageTimeoutId, setMessageTimeoutId] = useState(null);

  // 敵画像を一度だけ読み込み

  useEffect(() => {
    const img = new Image();
    img.src = enemyImg;
    // img.src = '/enemy.png';  // publicフォルダ直下に置いてください
    img.onload = () => {
      enemyImageRef.current = img;
    };
  }, []);

  // 敵初期化
  const initEnemies = () => {
    const initialEnemies = [];
    const enemyWidth = 20;  // ここで描画サイズを指定（縮小サイズ）
    const enemyHeight = 30;
    const rows = 4;
    const cols = 8;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        initialEnemies.push({
          x: col * (enemyWidth + 10) + 30,
          y: row * (enemyHeight + 20) + 120,
          width: enemyWidth,
          height: enemyHeight,
        });
      }
    }
    setEnemies(initialEnemies);
  };

  useEffect(() => {
    initEnemies();
  }, [level]);

  // 敵の移動
  useEffect(() => {
    if (gameOver) return;

    const interval = setInterval(() => {
      setEnemies((oldEnemies) => {
        if (oldEnemies.length === 0) {
          setLevel((prev) => prev + 1);
          return [];
        }

        const xs = oldEnemies.map((e) => e.x);
        const minX = Math.min(...xs);
        const maxX = Math.max(...xs) + oldEnemies[0].width;

        let newDirection = enemyDirection.current;
        let needDrop = false;
        if (minX <= 0 && enemyDirection.current === -1) {
          newDirection = 1;
          needDrop = true;
        } else if (maxX >= width && enemyDirection.current === 1) {
          newDirection = -1;
          needDrop = true;
        }
        enemyDirection.current = newDirection;

        const updatedEnemies = oldEnemies.map((enemy) => ({
          ...enemy,
          x: enemy.x + (level + 1) *2* newDirection,
          y: enemy.y + (needDrop ? 15 : 0),
        }));

        if (updatedEnemies.some((e) => e.y + e.height >= height - 30)) {
          setGameOver(true);
        }

        return updatedEnemies;
      });
    }, 500);

    return () => clearInterval(interval);
  }, [gameOver, level]);

  // 弾と敵の当たり判定
  useEffect(() => {
    if (gameOver) return;

    const interval = setInterval(() => {
      setBullets((prevBullets) => {
        const movedBullets = prevBullets
          .map(({ x, y }) => ({ x, y: y - 15 }))
          .filter(({ y }) => y > 0);

        let updatedEnemies = enemies.slice();
        const remainingBullets = [];

        movedBullets.forEach((bullet) => {
          let hit = false;
          for (let i = 0; i < updatedEnemies.length; i++) {
            const enemy = updatedEnemies[i];
            if (
              bullet.x < enemy.x + enemy.width &&
              bullet.x + 5 > enemy.x &&
              bullet.y < enemy.y + enemy.height &&
              bullet.y + 10 > enemy.y
            ) {
              updatedEnemies.splice(i, 1);
              setScore((s) => s + 10);

              // ランダムメッセージ表示
              const randomMessage = messages[Math.floor(Math.random() * messages.length)];
              setMessage(randomMessage);
              if (messageTimeoutId) clearTimeout(messageTimeoutId);
              const timeoutId = setTimeout(() => setMessage(''), 3000);  // 3秒で消える
              setMessageTimeoutId(timeoutId);

              hit = true;
              break;
            }
          }
          if (!hit) remainingBullets.push(bullet);
        });

        setEnemies(updatedEnemies);
        return remainingBullets;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [gameOver, enemies]);

  // 敵弾の処理
  useEffect(() => {
    if (gameOver) return;

    const interval = setInterval(() => {
      setEnemyBullets((oldEnemyBullets) =>
        oldEnemyBullets
          .map(({ x, y }) => ({ x, y: y + 10 }))
          .filter(({ y }) => y < height)
      );

      setEnemies((currentEnemies) => {
        if (currentEnemies.length === 0) return currentEnemies;

        if (Math.random() < 0.05) {
          const shooter = currentEnemies[Math.floor(Math.random() * currentEnemies.length)];
          setEnemyBullets((old) => [...old, {
            x: shooter.x + shooter.width / 2,
            y: shooter.y + shooter.height
          }]);
        }

        return currentEnemies;
      });

      setEnemyBullets((oldEnemyBullets) => {
        let updatedEnemyBullets = [...oldEnemyBullets];
        for (let i = updatedEnemyBullets.length - 1; i >= 0; i--) {
          const bullet = updatedEnemyBullets[i];

          if (
            bullet.x > playerX &&
            bullet.x < playerX + 30 &&
            bullet.y + 10 >= height - 20
          ) {
            updatedEnemyBullets.splice(i, 1);
            setPlayerLives((lives) => {
              const newLives = lives - 1;
              if (newLives <= 0) setGameOver(true);
              return newLives;
            });
            break;
          }
        }
        return updatedEnemyBullets;
      });
    }, 200);

    return () => clearInterval(interval);
  }, [playerX, gameOver]);

  // キーボード操作
  useEffect(() => {
    if (gameOver) return;

    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        setPlayerX((prevX) => Math.max(prevX - 15, 0));
      } else if (e.key === 'ArrowRight') {
        setPlayerX((prevX) => Math.min(prevX + 15, width - 30));
      } else if (e.key === ' ') {
        e.preventDefault();
        fireBullet();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [playerX, gameOver, canFire]);

  const fireBullet = () => {
    if (!canFire) return;
    setCanFire(false);
    setTimeout(() => setCanFire(true), 300);

    setBullets((oldBullets) => [
      ...oldBullets,
      { x: playerX + (30 - 5) / 2, y: height - 40 }
    ]);
  };

  const restartGame = () => {
    setPlayerX(width / 2 - 15);
    setPlayerLives(1);
    setBullets([]);
    setEnemyBullets([]);
    setScore(0);
    setLevel(1);
    setGameOver(false);
    enemyDirection.current = 1;
    initEnemies();
  };

  // 描画
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, width, height);

    // プレイヤー
    ctx.fillStyle = 'green';
    ctx.fillRect(playerX, height - 30, 30, 10);

    // 弾
    ctx.fillStyle = 'red';
    bullets.forEach(({ x, y }) => {
      ctx.fillRect(x, y, 5, 10);
    });

    // 敵画像（大きい画像を指定サイズに縮小して描画）

    if (enemyImageRef.current) {
      enemies.forEach(({ x, y, width, height }) => {
        ctx.drawImage(enemyImageRef.current, x, y, width, height);
      });
    } else {
      ctx.fillStyle = 'blue';
      enemies.forEach(({ x, y, width, height }) => {
        ctx.fillRect(x, y, width, height);
      });
    }

    // 敵弾
    ctx.fillStyle = 'purple';
    enemyBullets.forEach(({ x, y }) => {
      ctx.fillRect(x, y, 5, 10);
    });

    // スコア等
    ctx.fillStyle = 'black';
    ctx.font = '16px Arial';
    ctx.fillText(`得点: ${score}`, 10, 25);
    ctx.fillText(`残機: ${playerLives}`, 10, 45);
    ctx.fillText(`レベル: ${level}`, 10, 65);

    // ランダムメッセージ表示
    if (message) {
      ctx.fillStyle = 'red';
      ctx.font = 'bold 11px Arial';
      ctx.fillText(message, 10, 85);
    }


    // ゲームオーバー表示
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = 'white';
      ctx.font = '30px Arial';
      ctx.fillText('GAME OVER', width / 2 - 90, height / 2);
    }
  }, [playerX, bullets, enemies, enemyBullets, score, playerLives, gameOver, level]);

  return (
    <div style={{ textAlign: 'center' }}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{ border: '1px solid black', touchAction: 'none' }}
      />
      <div style={{ marginTop: 10 }}>
        <button 
        style={{ fontSize: '24px', padding: '10px 20px', margin: '5px' }}
        onClick={() => setPlayerX((prevX) => Math.max(prevX - 15, 0))}>◀</button>
        <button
        style={{ fontSize: '24px', padding: '10px 20px', margin: '5px' }} 
        onClick={fireBullet}>🔫</button>
        <button 
        style={{ fontSize: '24px', padding: '10px 20px', margin: '5px' }}
        onClick={() => setPlayerX((prevX) => Math.min(prevX + 15, width - 30))}>▶</button>
      </div>
      {gameOver && (
        <div style={{ marginTop: 20 }}>
          <button onClick={restartGame}>🔁 もう一度</button>
        </div>
      )}
    </div>
  );
};

export default GameCanvas;
