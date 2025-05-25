import React, { useRef, useEffect, useState } from 'react';

const GameCanvas = () => {
  const canvasRef = useRef(null);
  const width = 400;
  const height = 600;

  const [playerX, setPlayerX] = useState(width / 2 - 15);
  const [playerLives, setPlayerLives] = useState(3); // 残機3
  const [bullets, setBullets] = useState([]);
  const [enemies, setEnemies] = useState([]);
  const [enemyBullets, setEnemyBullets] = useState([]);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  const enemyDirection = useRef(1);
  const enemySpeed = 2;
  const enemyDropDistance = 10; // 下に落ちる距離

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

  // 敵の横移動＆下方向への移動
  useEffect(() => {
    if (gameOver) return;

    const interval = setInterval(() => {
      setEnemies((oldEnemies) => {
        if (oldEnemies.length === 0) {
          setGameOver(true); // 敵全部倒したらゲームクリア
          return oldEnemies;
        }

        // 横の最端調査
        const xs = oldEnemies.map((e) => e.x);
        const minX = Math.min(...xs);
        const maxX = Math.max(...xs) + oldEnemies[0].width;

        // 端で方向反転＋下に移動
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
          x: enemy.x + enemySpeed * newDirection,
          y: enemy.y + (needDrop ? enemyDropDistance : 0),
        }));

        // 敵がプレイヤーの高さに来たらゲームオーバー
        if (updatedEnemies.some((e) => e.y + e.height >= height - 30)) {
          setGameOver(true);
        }

        return updatedEnemies;
      });
    }, 500);

    return () => clearInterval(interval);
  }, [gameOver]);

  // プレイヤーの弾の移動と当たり判定
  useEffect(() => {
    if (gameOver) return;

    const interval = setInterval(() => {
      setBullets((oldBullets) =>
        oldBullets
          .map(({ x, y }) => ({ x, y: y - 15 }))
          .filter(({ y }) => y > 0)
      );

      setEnemies((oldEnemies) => {
        let updatedEnemies = [...oldEnemies];
        setBullets((oldBullets) => {
          let updatedBullets = [...oldBullets];

          for (let b = updatedBullets.length - 1; b >= 0; b--) {
            for (let e = updatedEnemies.length - 1; e >= 0; e--) {
              const bullet = updatedBullets[b];
              const enemy = updatedEnemies[e];

              if (
                bullet.x < enemy.x + enemy.width &&
                bullet.x + 5 > enemy.x &&
                bullet.y < enemy.y + enemy.height &&
                bullet.y + 10 > enemy.y
              ) {
                updatedBullets.splice(b, 1);
                updatedEnemies.splice(e, 1);
                setScore((s) => s + 10);
                break;
              }
            }
          }

          return updatedBullets;
        });

        return updatedEnemies;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [gameOver]);

  // 敵の弾発射＆移動＆当たり判定
  useEffect(() => {
    if (gameOver) return;

    const interval = setInterval(() => {
      setEnemyBullets((oldEnemyBullets) =>
        oldEnemyBullets
          .map(({ x, y }) => ({ x, y: y + 10 }))
          .filter(({ y }) => y < height)
      );

      // 敵がランダムで弾を撃つ（5%の確率）
      setEnemies((currentEnemies) => {
        if (currentEnemies.length === 0) return currentEnemies;

        if (Math.random() < 0.05) {
          const shooter = currentEnemies[Math.floor(Math.random() * currentEnemies.length)];
          setEnemyBullets((old) => [...old, { x: shooter.x + shooter.width / 2, y: shooter.y + shooter.height }]);
        }

        return currentEnemies;
      });

      // 敵弾とプレイヤーの当たり判定
      setEnemyBullets((oldEnemyBullets) => {
        let updatedEnemyBullets = [...oldEnemyBullets];
        updatedEnemyBullets.forEach((bullet, i) => {
          if (
            bullet.x > playerX &&
            bullet.x < playerX + 30 &&
            bullet.y + 10 >= height - 30
          ) {
            updatedEnemyBullets.splice(i, 1);
            setPlayerLives((lives) => {
              const newLives = lives - 1;
              if (newLives <= 0) setGameOver(true);
              return newLives;
            });
          }
        });
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
        setBullets((oldBullets) => [
          ...oldBullets,
          { x: playerX + 12, y: height - 40 },
        ]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [playerX, gameOver]);

  // 描画処理
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, width, height);

    // 自機
    ctx.fillStyle = 'green';
    ctx.fillRect(playerX, height - 30, 30, 10);

    // 弾
    ctx.fillStyle = 'red';
    bullets.forEach(({ x, y }) => {
      ctx.fillRect(x, y, 5, 10);
    });

    // 敵
    ctx.fillStyle = 'blue';
    enemies.forEach(({ x, y, width, height }) => {
      ctx.fillRect(x, y, width, height);
    });

    // 敵の弾
    ctx.fillStyle = 'purple';
    enemyBullets.forEach(({ x, y }) => {
      ctx.fillRect(x, y, 5, 10);
    });

    // 得点と残機表示
    ctx.fillStyle = 'black';
    ctx.font = '20px Arial';
    ctx.fillText(`得点: ${score}`, 10, 25);
    ctx.fillText(`残機: ${playerLives}`, 10, 50);

    // ゲームオーバー表示
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = 'white';
      ctx.font = '30px Arial';
      ctx.fillText('GAME OVER', width / 2 - 90, height / 2);
    }
  }, [playerX, bullets, enemies, enemyBullets, score, playerLives, gameOver]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{ border: '1px solid black' }}
    />
  );
};

export default GameCanvas;
