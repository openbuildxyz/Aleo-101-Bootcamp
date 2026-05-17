function onIdle(me, enemy, game) {
  var mx = me.tank.position[0];
  var my = me.tank.position[1];
  var myDir = me.tank.direction;
  var map = game.map;
  var H = map.length;
  var W = map[0].length;
  var enemyTank = enemy.tank;
  var enemyBullet = enemy.bullet;
  var star = game.star;

  var DIR_V = { up: [0,-1], down: [0,1], left: [-1,0], right: [1,0] };
  var DIR_NAME = ["up","down","left","right"];
  var OPP = { up:"down", down:"up", left:"right", right:"left" };

  function inBounds(x, y) { return x >= 0 && x < H && y >= 0 && y < W; }
  function isWall(x, y) { return !inBounds(x, y) || map[x][y] === "x"; }
  function isGrass(x, y) { return inBounds(x, y) && map[x][y] === "o"; }
  function isPassable(x, y) { return inBounds(x, y) && map[x][y] !== "x"; }
  function key(x, y) { return x + "," + y; }
  function manhattan(x1, y1, x2, y2) { return Math.abs(x1 - x2) + Math.abs(y1 - y2); }
  function dirToTarget(tx, ty) { if (mx === tx) return ty > my ? "down" : "up"; if (my === ty) return tx > mx ? "right" : "left"; return null; }
  function facing(dir) { return myDir === dir; }
  function passableNeighbors(x, y) { var count = 0; for (var i = 0; i < DIR_NAME.length; i++) { var d = DIR_NAME[i]; if (isPassable(x + DIR_V[d][0], y + DIR_V[d][1])) count++; } return count; }
  function isDeadEnd(x, y) { return passableNeighbors(x, y) <= 1; }

  // ========== v7_fixed: 全局状态持久化（用于记录敌人最后已知位置） ==========
  var globalObj = (function() { return this; })();
  if (!globalObj) globalObj = {};
  if (!globalObj.tankAIState) {
    globalObj.tankAIState = {
      lastKnownEnemyPos: null,
      lastKnownEnemyDir: null,
      lastSeenFrame: 0,
      currentFrame: 0
    };
  }
  var aiState = globalObj.tankAIState;
  aiState.currentFrame++;

  // ========== v7_fixed: 更新敌人最后已知位置 ==========
  function updateEnemyTracking() {
    if (enemyTank) {
      aiState.lastKnownEnemyPos = [enemyTank.position[0], enemyTank.position[1]];
      aiState.lastKnownEnemyDir = enemyTank.direction;
      aiState.lastSeenFrame = aiState.currentFrame;
    }
  }
  updateEnemyTracking();

  // ========== v7_fixed: 获取敌人位置（使用最后已知位置作为后备） ==========
  function getEnemyPos() {
    if (enemyTank) return [enemyTank.position[0], enemyTank.position[1]];
    return aiState.lastKnownEnemyPos;
  }

  function getEnemyDir() {
    if (enemyTank) return enemyTank.direction;
    return aiState.lastKnownEnemyDir;
  }

  // ========== v7_fixed: 判断敌人是否最近消失在草地附近 ==========
  function enemyDisappearedNearGrass() {
    if (enemyTank) return false;
    if (!aiState.lastKnownEnemyPos) return false;
    var lx = aiState.lastKnownEnemyPos[0], ly = aiState.lastKnownEnemyPos[1];
    for (var i = 0; i < DIR_NAME.length; i++) {
      var d = DIR_NAME[i];
      if (isGrass(lx + DIR_V[d][0], ly + DIR_V[d][1])) return true;
    }
    if (isGrass(lx, ly)) return true;
    return false;
  }

  // ========== v7_fixed: 基于最后已知位置判断敌人是否可能在草地中瞄准我 ==========
  function enemyMightBeAimingFromGrass() {
    if (enemyTank) return false;
    if (!aiState.lastKnownEnemyPos) return false;
    var framesSinceSeen = aiState.currentFrame - aiState.lastSeenFrame;
    if (framesSinceSeen > 30) return false;
    var lx = aiState.lastKnownEnemyPos[0], ly = aiState.lastKnownEnemyPos[1];
    if (lx !== mx && ly !== my) return false;
    if (lx === mx) {
      var minY = Math.min(ly, my), maxY = Math.max(ly, my);
      for (var y = minY + 1; y < maxY; y++) {
        if (isGrass(lx, y)) return true;
      }
    }
    if (ly === my) {
      var minX = Math.min(lx, mx), maxX = Math.max(lx, mx);
      for (var x = minX + 1; x < maxX; x++) {
        if (isGrass(x, ly)) return true;
      }
    }
    return false;
  }

  // ========== v7_fixed: 地图感知 - 检测arena类地图（大量草地+中央墙壁） ==========
  function analyzeMap() {
    var grassCount = 0;
    var wallCount = 0;
    var totalCells = 0;
    for (var x = 0; x < H; x++) {
      for (var y = 0; y < W; y++) {
        totalCells++;
        if (map[x][y] === "o") grassCount++;
        if (map[x][y] === "x") wallCount++;
      }
    }
    var grassRatio = grassCount / totalCells;
    var wallRatio = wallCount / totalCells;
    return {
      isArenaLike: grassRatio > 0.1 && wallRatio > 0.15,
      grassRatio: grassRatio,
      wallRatio: wallRatio,
      centerX: Math.floor(H / 2),
      centerY: Math.floor(W / 2)
    };
  }
  var mapInfo = analyzeMap();

  // ========== v7_fixed: 检查位置是否在中央危险区域（只在arena地图启用） ==========
  function isCentralDangerZone(x, y) {
    if (!mapInfo.isArenaLike) return false;
    var cx = mapInfo.centerX, cy = mapInfo.centerY;
    var distToCenter = manhattan(x, y, cx, cy);
    if (distToCenter <= 3) return true;
    if (passableNeighbors(x, y) <= 2 && distToCenter <= 5) return true;
    return false;
  }

  function bulletHeadingTowardMe(bullet) {
    if (!bullet) return false;
    var bx = bullet.position[0], by = bullet.position[1];
    var bDir = bullet.direction;
    var dx = DIR_V[bDir][0], dy = DIR_V[bDir][1];
    if (dy === 0) {
      if (by !== my) return false;
      return (dx > 0 && bx < mx) || (dx < 0 && bx > mx);
    }
    if (dx === 0) {
      if (bx !== mx) return false;
      return (dy > 0 && by < my) || (dy < 0 && by > my);
    }
    return false;
  }

  function bulletWillHitMe(bullet) {
    if (!bullet) return false;
    var bx = bullet.position[0], by = bullet.position[1];
    var bDir = bullet.direction;
    var dx = DIR_V[bDir][0], dy = DIR_V[bDir][1];
    var nbx = bx + dx, nby = by + dy;
    if (nbx === mx && nby === my) return true;
    if (dy === 0 && by === my) {
      return (dx > 0 && bx < mx) || (dx < 0 && bx > mx);
    }
    if (dx === 0 && bx === mx) {
      return (dy > 0 && by < my) || (dy < 0 && by > my);
    }
    return false;
  }

  function bulletDist(bullet) { if (!bullet) return 9999; return manhattan(bullet.position[0], bullet.position[1], mx, my); }
  function getBulletDir(bullet) { return bullet ? bullet.direction : null; }
  function getDodgeDirs(bDir) { if (bDir === "left" || bDir === "right") return ["up", "down"]; return ["left", "right"]; }

  // ========== v7_fixed: 增强敌人射击线检测（支持最后已知位置，只在arena-like地图启用） ==========
  function isInEnemyLineOfFire() {
    if (enemyTank) {
      var ex = enemyTank.position[0], ey = enemyTank.position[1];
      var eDir = enemyTank.direction;
      if (ex !== mx && ey !== my) return false;
      if (ex === mx) {
        if (ey < my && eDir === "down") return hasClearShot(ex, ey, mx, my);
        if (ey > my && eDir === "up") return hasClearShot(ex, ey, mx, my);
      }
      if (ey === my) {
        if (ex < mx && eDir === "right") return hasClearShot(ex, ey, mx, my);
        if (ex > mx && eDir === "left") return hasClearShot(ex, ey, mx, my);
      }
      return false;
    }
    // 敌人不可见时，只在arena-like地图基于最后已知位置判断
    if (mapInfo.isArenaLike && enemyMightBeAimingFromGrass()) return true;
    return false;
  }

  // ========== v7_fixed: 检查任意位置是否在敌人射击线上（支持最后已知位置，只在arena-like地图启用） ==========
  function willBeInLineOfFire(x, y) {
    if (enemyTank) {
      var ex = enemyTank.position[0], ey = enemyTank.position[1];
      var eDir = enemyTank.direction;
      if (ex !== x && ey !== y) return false;
      if (ex === x) {
        if (ey < y && eDir === "down") return hasClearShot(ex, ey, x, y);
        if (ey > y && eDir === "up") return hasClearShot(ex, ey, x, y);
      }
      if (ey === y) {
        if (ex < x && eDir === "right") return hasClearShot(ex, ey, x, y);
        if (ex > x && eDir === "left") return hasClearShot(ex, ey, x, y);
      }
      return false;
    }
    // 基于最后已知位置，只在arena-like地图启用
    if (!mapInfo.isArenaLike) return false;
    if (!aiState.lastKnownEnemyPos || !aiState.lastKnownEnemyDir) return false;
    var lx = aiState.lastKnownEnemyPos[0], ly = aiState.lastKnownEnemyPos[1];
    var lDir = aiState.lastKnownEnemyDir;
    if (lx !== x && ly !== y) return false;
    if (lx === x) {
      if (ly < y && lDir === "down") return hasClearShot(lx, ly, x, y);
      if (ly > y && lDir === "up") return hasClearShot(lx, ly, x, y);
    }
    if (ly === y) {
      if (lx < x && lDir === "right") return hasClearShot(lx, ly, x, y);
      if (lx > x && lDir === "left") return hasClearShot(lx, ly, x, y);
    }
    return false;
  }

  // ========== v7_fixed: 检查位置是否会被敌人下一发子弹命中（支持最后已知位置，只在arena-like地图启用） ==========
  function willBeInLineOfFireNext(x, y) {
    if (enemyTank) {
      var ex = enemyTank.position[0], ey = enemyTank.position[1];
      var eDir = enemyTank.direction;
      if (willBeInLineOfFire(x, y)) return true;
      if (eDir && DIR_V[eDir]) {
        var nex = ex + DIR_V[eDir][0];
        var ney = ey + DIR_V[eDir][1];
        if (isPassable(nex, ney)) {
          if (nex === x && ney !== y) {
            if (ney < y && eDir === "down") return hasClearShot(nex, ney, x, y);
            if (ney > y && eDir === "up") return hasClearShot(nex, ney, x, y);
          }
          if (ney === y && nex !== x) {
            if (nex < x && eDir === "right") return hasClearShot(nex, ney, x, y);
            if (nex > x && eDir === "left") return hasClearShot(nex, ney, x, y);
          }
        }
      }
      return false;
    }
    // 基于最后已知位置，只在arena-like地图启用
    if (!mapInfo.isArenaLike) return false;
    if (!aiState.lastKnownEnemyPos || !aiState.lastKnownEnemyDir) return false;
    if (willBeInLineOfFire(x, y)) return true;
    var lx = aiState.lastKnownEnemyPos[0], ly = aiState.lastKnownEnemyPos[1];
    var lDir = aiState.lastKnownEnemyDir;
    if (lDir && DIR_V[lDir]) {
      var nlx = lx + DIR_V[lDir][0];
      var nly = ly + DIR_V[lDir][1];
      if (isPassable(nlx, nly)) {
        if (nlx === x && nly !== y) {
          if (nly < y && lDir === "down") return hasClearShot(nlx, nly, x, y);
          if (nly > y && lDir === "up") return hasClearShot(nlx, nly, x, y);
        }
        if (nly === y && nlx !== x) {
          if (nlx < x && lDir === "right") return hasClearShot(nlx, nly, x, y);
          if (nlx > x && lDir === "left") return hasClearShot(nlx, nly, x, y);
        }
      }
    }
    return false;
  }

  // ========== v6: 追踪敌人最近移动方向 ==========
  var enemyLastDir = null;
  var enemyLastPos = null;
  function trackEnemyMovement() {
    if (!enemyTank) return;
    var ex = enemyTank.position[0], ey = enemyTank.position[1];
    if (enemyLastPos) {
      var lx = enemyLastPos[0], ly = enemyLastPos[1];
      if (ex !== lx || ey !== ly) {
        if (ex > lx) enemyLastDir = "right";
        else if (ex < lx) enemyLastDir = "left";
        else if (ey > ly) enemyLastDir = "down";
        else if (ey < ly) enemyLastDir = "up";
      }
    }
    enemyLastPos = [ex, ey];
  }
  trackEnemyMovement();

  // ========== v6: 预测敌人下一步位置 ==========
  function predictEnemyPos() {
    if (!enemyTank) return null;
    var ex = enemyTank.position[0], ey = enemyTank.position[1];
    var eDir = enemyTank.direction;
    var predicted = [ex, ey];
    if (eDir && DIR_V[eDir]) {
      var pex = ex + DIR_V[eDir][0];
      var pey = ey + DIR_V[eDir][1];
      if (isPassable(pex, pey)) {
        predicted = [pex, pey];
      }
    }
    if (enemyLastDir && enemyLastDir !== eDir && DIR_V[enemyLastDir]) {
      var pex2 = ex + DIR_V[enemyLastDir][0];
      var pey2 = ey + DIR_V[enemyLastDir][1];
      if (isPassable(pex2, pey2)) {
        if (manhattan(pex2, pey2, mx, my) < manhattan(predicted[0], predicted[1], mx, my)) {
          predicted = [pex2, pey2];
        }
      }
    }
    return predicted;
  }

  function predictEnemyPosSteps(steps) {
    if (!enemyTank) return null;
    var ex = enemyTank.position[0], ey = enemyTank.position[1];
    var eDir = enemyTank.direction;
    for (var s = 0; s < steps; s++) {
      if (!eDir || !DIR_V[eDir]) break;
      var nx = ex + DIR_V[eDir][0];
      var ny = ey + DIR_V[eDir][1];
      if (!isPassable(nx, ny)) break;
      ex = nx; ey = ny;
    }
    return [ex, ey];
  }

  // ========== v6: 判断我方是否处于劣势 ==========
  function isAtDisadvantage() {
    var enemyHasStar = enemy.score > me.score;
    var iHaveStar = false;
    if (star && mx === star[0] && my === star[1]) iHaveStar = true;
    return enemyHasStar && !iHaveStar;
  }

  // ========== v7_fixed: 计算安全分数（越高越安全） ==========
  function getSafetyScore(x, y) {
    var score = 0;
    if (enemyTank) {
      var ex = enemyTank.position[0], ey = enemyTank.position[1];
      score += manhattan(x, y, ex, ey) * 2;
    }
    if (willBeInLineOfFire(x, y)) score -= 50;
    if (willBeInLineOfFireNext(x, y)) score -= 30;
    if (isDeadEnd(x, y)) score -= 20;
    score += passableNeighbors(x, y) * 3;
    // v7_fixed: arena地图中远离中央危险区域
    if (mapInfo.isArenaLike && isCentralDangerZone(x, y)) score -= 40;
    // v7_fixed: arena地图中避免靠近草地
    if (mapInfo.isArenaLike && isGrass(x, y)) score -= 25;
    if (mapInfo.isArenaLike) {
      for (var i = 0; i < DIR_NAME.length; i++) {
        var d = DIR_NAME[i];
        if (isGrass(x + DIR_V[d][0], y + DIR_V[d][1])) score -= 10;
      }
    }
    return score;
  }

  // ========== v7_fixed: 增强版最佳逃跑方向 ==========
  function getEscapeDir() {
    var bestDir = null;
    var bestScore = -99999;
    for (var i = 0; i < DIR_NAME.length; i++) {
      var d = DIR_NAME[i];
      var nx = mx + DIR_V[d][0], ny = my + DIR_V[d][1];
      if (!isPassable(nx, ny)) continue;

      var score = 0;

      // 远离敌人
      if (enemyTank) {
        var ex = enemyTank.position[0], ey = enemyTank.position[1];
        var oldDist = manhattan(mx, my, ex, ey);
        var newDist = manhattan(nx, ny, ex, ey);
        score += (newDist - oldDist) * 4;
      }

      // 远离子弹
      if (enemyBullet && bulletHeadingTowardMe(enemyBullet)) {
        var bDir = getBulletDir(enemyBullet);
        var dodgeDirs = getDodgeDirs(bDir);
        var isDodgeDir = false;
        for (var j = 0; j < dodgeDirs.length; j++) {
          if (dodgeDirs[j] === d) { isDodgeDir = true; break; }
        }
        if (isDodgeDir) score += 20;
        if (d === OPP[bDir]) score -= 15;
      }

      // 避免走进敌人射击线
      if (willBeInLineOfFire(nx, ny)) score -= 30;
      if (willBeInLineOfFireNext(nx, ny)) score -= 15;

      // 避免死胡同
      if (isDeadEnd(nx, ny)) score -= 20;

      // 优先有更多出口的方向
      score += passableNeighbors(nx, ny) * 3;

      // 保持当前方向有微弱加成
      if (d === myDir) score += 2;

      // v7_fixed: arena地图中避免中央区域
      if (mapInfo.isArenaLike && isCentralDangerZone(nx, ny)) score -= 35;

      // v7_fixed: arena地图中避免走进草地
      if (mapInfo.isArenaLike && isGrass(nx, ny)) score -= 30;

      // 劣势时更保守
      if (isAtDisadvantage() && enemyTank) {
        var ex = enemyTank.position[0], ey = enemyTank.position[1];
        score += manhattan(nx, ny, ex, ey) * 2;
      }

      // v7_fixed: arena地图中敌人消失时更保守
      if (mapInfo.isArenaLike && !enemyTank && aiState.lastKnownEnemyPos) {
        score += manhattan(nx, ny, aiState.lastKnownEnemyPos[0], aiState.lastKnownEnemyPos[1]) * 3;
        score += passableNeighbors(nx, ny) * 5;
      }

      if (score > bestScore) {
        bestScore = score;
        bestDir = d;
      }
    }
    return bestDir;
  }

  function getSafeDodgeDirs(bullet) {
    var bDir = getBulletDir(bullet);
    var dodgeDirs = getDodgeDirs(bDir);
    var safeDirs = [];
    var riskyDirs = [];
    for (var i = 0; i < dodgeDirs.length; i++) {
      var d = dodgeDirs[i];
      var nx = mx + DIR_V[d][0], ny = my + DIR_V[d][1];
      if (!isPassable(nx, ny)) continue;
      if (willBeInLineOfFire(nx, ny) || willBeInLineOfFireNext(nx, ny)) {
        riskyDirs.push(d);
        continue;
      }
      // v7_fixed: arena地图中避免躲进草地
      if (mapInfo.isArenaLike && isGrass(nx, ny)) {
        riskyDirs.push(d);
        continue;
      }
      var nextNeighbors = passableNeighbors(nx, ny);
      if (nextNeighbors >= 2) { safeDirs.push(d); } else { riskyDirs.push(d); }
    }
    return safeDirs.length > 0 ? safeDirs : riskyDirs;
  }

  function tryMove(dir, avoidDeadEnd) {
    var nx = mx + DIR_V[dir][0], ny = my + DIR_V[dir][1];
    if (!isPassable(nx, ny)) return null;
    if (avoidDeadEnd && isDeadEnd(nx, ny)) return null;
    return dir;
  }

  function dodgeBullet(bullet) {
    var safeDirs = getSafeDodgeDirs(bullet);
    for (var i = 0; i < safeDirs.length; i++) { var move = tryMove(safeDirs[i], false); if (move) return move; }
    var back = tryMove(OPP[getBulletDir(bullet)], false); if (back) return back;
    for (var i = 0; i < DIR_NAME.length; i++) { var move = tryMove(DIR_NAME[i], false); if (move) return move; }
    return null;
  }

  function bfs(targetPos, avoidDeadEnds) {
    if (!targetPos) return null;
    var tx = targetPos[0], ty = targetPos[1];
    if (mx === tx && my === ty) return null;
    var q = [[mx, my, null, 0]];
    var vis = {};
    vis[key(mx, my)] = true;
    for (var i = 0; i < q.length; i++) {
      var x = q[i][0], y = q[i][1], fm = q[i][2], depth = q[i][3];
      for (var j = 0; j < DIR_NAME.length; j++) {
        var d = DIR_NAME[j];
        var nx = x + DIR_V[d][0], ny = y + DIR_V[d][1];
        if (!isPassable(nx, ny)) continue;
        var k = key(nx, ny);
        if (vis[k]) continue;
        vis[k] = true;
        if (avoidDeadEnds && depth === 0 && isDeadEnd(nx, ny)) { if (nx !== tx || ny !== ty) continue; }
        var nextFm = fm || d;
        if (nx === tx && ny === ty) return nextFm;
        q.push([nx, ny, nextFm, depth + 1]);
      }
    }
    return null;
  }

  function hasClearShot(fx, fy, tx, ty) {
    if (fx === tx) { var minY = Math.min(fy, ty), maxY = Math.max(fy, ty); for (var y = minY + 1; y < maxY; y++) { if (isWall(fx, y)) return false; } return true; }
    if (fy === ty) { var minX = Math.min(fx, tx), maxX = Math.max(fx, tx); for (var x = minX + 1; x < maxX; x++) { if (isWall(x, fy)) return false; } return true; }
    return false;
  }

  function alignedWithEnemy() { if (!enemyTank) return false; var ex = enemyTank.position[0], ey = enemyTank.position[1]; return hasClearShot(mx, my, ex, ey); }

  // ========== v6: 增强射击方向计算（多步预判） ==========
  function getShootDir() {
    if (!enemyTank) return null;
    var enemyShielded = false;
    var enemyCloaked = false;
    if (enemy.status) {
      if (enemy.status.shielded) enemyShielded = true;
      if (enemy.status.cloaked) enemyCloaked = true;
    }
    if (enemyShielded || enemyCloaked) return null;

    var ex = enemyTank.position[0], ey = enemyTank.position[1];

    var directDir = dirToTarget(ex, ey);
    if (directDir && alignedWithEnemy()) return directDir;

    var predicted = predictEnemyPos();
    if (predicted) {
      var pDir = dirToTarget(predicted[0], predicted[1]);
      if (pDir && hasClearShot(mx, my, predicted[0], predicted[1])) return pDir;
    }

    var predicted2 = predictEnemyPosSteps(2);
    if (predicted2) {
      var pDir2 = dirToTarget(predicted2[0], predicted2[1]);
      if (pDir2 && hasClearShot(mx, my, predicted2[0], predicted2[1])) return pDir2;
    }

    return null;
  }

  // ========== v6: 判断是否可以安全射击 ==========
  function canShootSafely() {
    if (!enemyTank) return true;
    var ed = manhattan(mx, my, enemyTank.position[0], enemyTank.position[1]);
    if (ed <= 5 && isInEnemyLineOfFire()) return false;
    return true;
  }

  // ========== v7_fixed: 判断抢星星是否安全 ==========
  function isStarSafeToGet() {
    if (!star || !enemyTank) return true;
    var starDist = manhattan(mx, my, star[0], star[1]);
    var enemyStarDist = manhattan(enemyTank.position[0], enemyTank.position[1], star[0], star[1]);
    if (enemyStarDist <= 3 && isInEnemyLineOfFire()) return false;
    if (enemyStarDist < starDist - 2) return false;
    if (isAtDisadvantage() && enemyStarDist <= starDist + 1) return false;
    return true;
  }

  // ========== v7_fixed: 优化隐身技能使用 ==========
  function shouldUseCloak() {
    if (!me.skill) return false;
    if (me.skill.remainingCooldownFrames !== 0) return false;

    var inLineOfFire = isInEnemyLineOfFire();
    var dist = enemyTank ? manhattan(mx, my, enemyTank.position[0], enemyTank.position[1]) : 999;

    // 情况1：被敌人瞄准且距离很近，无法躲避
    if (inLineOfFire && dist <= 4) {
      var hasSafeMove = false;
      for (var i = 0; i < DIR_NAME.length; i++) {
        var d = DIR_NAME[i];
        var nx = mx + DIR_V[d][0], ny = my + DIR_V[d][1];
        if (isPassable(nx, ny) && !willBeInLineOfFire(nx, ny) && !isDeadEnd(nx, ny)) {
          hasSafeMove = true;
          break;
        }
      }
      if (!hasSafeMove) return true;
    }

    // 情况2：被夹击（子弹+敌人瞄准）
    if (enemyBullet && bulletWillHitMe(enemyBullet) && inLineOfFire) {
      return true;
    }

    // 情况3：子弹很近且无处可躲
    if (enemyBullet && bulletWillHitMe(enemyBullet)) {
      var bDist = bulletDist(enemyBullet);
      if (bDist <= 2) {
        var dodgeDirs = getDodgeDirs(getBulletDir(enemyBullet));
        var canDodge = false;
        for (var i = 0; i < dodgeDirs.length; i++) {
          var d = dodgeDirs[i];
          var nx = mx + DIR_V[d][0], ny = my + DIR_V[d][1];
          if (isPassable(nx, ny)) { canDodge = true; break; }
        }
        if (!canDodge) return true;
      }
    }

    // 情况4：抢星星时敌人在附近且不安全
    if (star) {
      var starDist = manhattan(mx, my, star[0], star[1]);
      if (starDist <= 2 && enemyTank) {
        var enemyStarDist = manhattan(enemyTank.position[0], enemyTank.position[1], star[0], star[1]);
        if (enemyStarDist <= 3 && inLineOfFire) return true;
      }
    }

    // 情况5：劣势时被敌人近距离瞄准
    if (isAtDisadvantage() && inLineOfFire && dist <= 6) {
      return true;
    }

    // v7_fixed: 情况6：arena地图中敌人消失在草地附近且距离很近
    if (mapInfo.isArenaLike && !enemyTank && enemyDisappearedNearGrass()) {
      var ePos = getEnemyPos();
      if (ePos && manhattan(mx, my, ePos[0], ePos[1]) <= 5) {
        return true;
      }
    }

    return false;
  }

  // ========== v7_fixed: 当敌人在附近且没有子弹时，也要保持安全距离 ==========
  function shouldKeepSafeDistance() {
    if (!enemyTank) {
      // v7_fixed: 只在arena-like地图中，敌人消失时如果在草地附近也保持安全
      if (mapInfo.isArenaLike && enemyDisappearedNearGrass()) return true;
      return false;
    }
    var dist = manhattan(mx, my, enemyTank.position[0], enemyTank.position[1]);
    if (dist <= 6 && !enemyBullet && isInEnemyLineOfFire()) return true;
    if (isAtDisadvantage() && dist <= 5) return true;
    return false;
  }

  // ========== v7_fixed: arena地图中敌人消失时的保守移动策略 ==========
  function getConservativeMove() {
    var bestDir = null;
    var bestScore = -99999;
    var ePos = getEnemyPos();
    for (var i = 0; i < DIR_NAME.length; i++) {
      var d = DIR_NAME[i];
      var nx = mx + DIR_V[d][0], ny = my + DIR_V[d][1];
      if (!isPassable(nx, ny)) continue;

      var score = 0;

      // 远离最后已知敌人位置
      if (ePos) {
        score += manhattan(nx, ny, ePos[0], ePos[1]) * 3;
      }

      // 避免射击线
      if (willBeInLineOfFire(nx, ny)) score -= 40;
      if (willBeInLineOfFireNext(nx, ny)) score -= 25;

      // 避免死胡同
      if (isDeadEnd(nx, ny)) score -= 30;

      // 优先有更多出口
      score += passableNeighbors(nx, ny) * 5;

      // 避免中央危险区域
      if (isCentralDangerZone(nx, ny)) score -= 40;

      // 避免草地
      if (isGrass(nx, ny)) score -= 35;
      for (var j = 0; j < DIR_NAME.length; j++) {
        var d2 = DIR_NAME[j];
        if (isGrass(nx + DIR_V[d2][0], ny + DIR_V[d2][1])) score -= 15;
      }

      // 保持当前方向
      if (d === myDir) score += 3;

      if (score > bestScore) {
        bestScore = score;
        bestDir = d;
      }
    }
    return bestDir;
  }

  // ========== v7_fixed: arena地图中安全巡逻 ==========
  function getSafePatrolDir() {
    var bestDir = null;
    var bestScore = -99999;
    var ePos = getEnemyPos();
    for (var i = 0; i < DIR_NAME.length; i++) {
      var d = DIR_NAME[i];
      var nx = mx + DIR_V[d][0], ny = my + DIR_V[d][1];
      if (!isPassable(nx, ny)) continue;

      var score = 0;

      // 远离敌人最后位置
      if (ePos) {
        score += manhattan(nx, ny, ePos[0], ePos[1]) * 2;
      }

      // 避免射击线
      if (willBeInLineOfFire(nx, ny)) score -= 30;
      if (willBeInLineOfFireNext(nx, ny)) score -= 20;

      // 避免死胡同
      if (isDeadEnd(nx, ny)) score -= 25;

      // 优先开阔区域
      score += passableNeighbors(nx, ny) * 4;

      // 避免中央危险区域
      if (isCentralDangerZone(nx, ny)) score -= 35;

      // 避免草地
      if (isGrass(nx, ny)) score -= 30;

      // 保持方向
      if (d === myDir) score += 4;
      if (d === OPP[myDir]) score -= 3;

      if (score > bestScore) {
        bestScore = score;
        bestDir = d;
      }
    }
    return bestDir;
  }

  // ========== 主逻辑 ==========

  // 1. 最高优先级：躲避子弹（更早预警，距离<=9）
  if (enemyBullet && bulletWillHitMe(enemyBullet)) {
    var dist = bulletDist(enemyBullet);
    if (dist <= 9) {
      var dodgeDir = dodgeBullet(enemyBullet);
      if (dodgeDir) {
        if (facing(dodgeDir)) { me.go(); return; }
        me.turn(dodgeDir); return;
      }
      if (dist <= 4 && shouldUseCloak()) { me.cloak(); return; }
    }
  }

  // v7_fixed: arena-like地图中敌人消失时的保守策略
  if (mapInfo.isArenaLike && !enemyTank) {
    // 如果有星星且安全，谨慎移动
    if (star && isStarSafeToGet()) {
      var moveDir = bfs(star, true);
      if (moveDir) {
        var nx = mx + DIR_V[moveDir][0], ny = my + DIR_V[moveDir][1];
        if (!isCentralDangerZone(nx, ny) && !willBeInLineOfFire(nx, ny) && !isGrass(nx, ny)) {
          if (facing(moveDir)) { me.go(); return; }
          me.turn(moveDir); return;
        }
      }
    }

    // 使用保守移动策略
    var conservativeDir = getConservativeMove();
    if (conservativeDir) {
      if (facing(conservativeDir)) { me.go(); return; }
      me.turn(conservativeDir); return;
    }

    // 安全巡逻
    var patrolDir = getSafePatrolDir();
    if (patrolDir) {
      if (facing(patrolDir)) { me.go(); return; }
      me.turn(patrolDir); return;
    }

    // 最后手段
    if (shouldUseCloak()) { me.cloak(); return; }
  }

  // 2. v6: 敌人在附近且没有子弹时，也要保持安全距离
  if (shouldKeepSafeDistance()) {
    var escapeDir = getEscapeDir();
    if (escapeDir) {
      if (facing(escapeDir)) { me.go(); return; }
      me.turn(escapeDir); return;
    }
    if (shouldUseCloak()) { me.cloak(); return; }
  }

  // 3. 如果我在敌人射击线上且距离近，优先躲避/逃跑而不是对射
  if (isInEnemyLineOfFire() && enemyTank) {
    var enemyDist = manhattan(mx, my, enemyTank.position[0], enemyTank.position[1]);
    if (enemyDist <= 6) {
      var escapeDir2 = getEscapeDir();
      if (escapeDir2) {
        if (facing(escapeDir2)) { me.go(); return; }
        me.turn(escapeDir2); return;
      }
      if (shouldUseCloak()) { me.cloak(); return; }
    }
  }

  // v7_fixed: arena-like地图中基于最后已知位置的射击线威胁（敌人消失时）
  if (mapInfo.isArenaLike && !enemyTank && enemyMightBeAimingFromGrass()) {
    var escapeDir3 = getEscapeDir();
    if (escapeDir3) {
      if (facing(escapeDir3)) { me.go(); return; }
      me.turn(escapeDir3); return;
    }
    if (shouldUseCloak()) { me.cloak(); return; }
  }

  // 4. 隐身技能精准使用
  if (shouldUseCloak()) { me.cloak(); return; }

  // 5. 射击逻辑（带预判）- 但我在敌人射击线上时降低优先级
  var shootDir = getShootDir();
  if (shootDir) {
    if (isInEnemyLineOfFire() && enemyTank) {
      var ed = manhattan(mx, my, enemyTank.position[0], enemyTank.position[1]);
      if (ed <= 4) {
        var escapeDir4 = getEscapeDir();
        if (escapeDir4) {
          if (facing(escapeDir4)) { me.go(); return; }
          me.turn(escapeDir4); return;
        }
      }
    }
    if (!canShootSafely()) {
      var escapeDir5 = getEscapeDir();
      if (escapeDir5) {
        if (facing(escapeDir5)) { me.go(); return; }
        me.turn(escapeDir5); return;
      }
    }
    if (facing(shootDir)) { me.fire(); return; }
    me.turn(shootDir); return;
  }

  // 6. v6: 目标选择逻辑优化
  var target = null;
  var targetPriority = 0;

  if (star) {
    var starDist = manhattan(mx, my, star[0], star[1]);
    if (isAtDisadvantage()) {
      if (isStarSafeToGet()) {
        target = star;
        targetPriority = 2;
      }
    } else {
      target = star;
      targetPriority = 2;
    }
  }

  if (!target && enemyTank) {
    var enemyDist = manhattan(mx, my, enemyTank.position[0], enemyTank.position[1]);
    if (!isInEnemyLineOfFire() || enemyDist > 6) {
      target = enemyTank.position;
      targetPriority = 1;
    }
  }

  // 7. 向目标移动（避免死胡同，同时避免走进敌人射击线）
  if (target) {
    var moveDir = bfs(target, true);
    if (moveDir) {
      var nx = mx + DIR_V[moveDir][0], ny = my + DIR_V[moveDir][1];
      var nxSafe = !willBeInLineOfFire(nx, ny) && !willBeInLineOfFireNext(nx, ny);
      if (isAtDisadvantage() && enemyTank) {
        var enemyDist = manhattan(nx, ny, enemyTank.position[0], enemyTank.position[1]);
        if (enemyDist < 4) nxSafe = false;
      }
      // v7_fixed: arena地图避免中央区域和草地
      if (mapInfo.isArenaLike && isCentralDangerZone(nx, ny)) nxSafe = false;
      if (mapInfo.isArenaLike && isGrass(nx, ny)) nxSafe = false;
      if (nxSafe) {
        if (facing(moveDir)) { me.go(); return; }
        me.turn(moveDir); return;
      }
    }
    moveDir = bfs(target, false);
    if (moveDir) {
      var nx2 = mx + DIR_V[moveDir][0], ny2 = my + DIR_V[moveDir][1];
      var nx2Safe = !willBeInLineOfFire(nx2, ny2) && !willBeInLineOfFireNext(nx2, ny2);
      if (isAtDisadvantage() && enemyTank) {
        var enemyDist2 = manhattan(nx2, ny2, enemyTank.position[0], enemyTank.position[1]);
        if (enemyDist2 < 4) nx2Safe = false;
      }
      if (mapInfo.isArenaLike && isCentralDangerZone(nx2, ny2)) nx2Safe = false;
      if (mapInfo.isArenaLike && isGrass(nx2, ny2)) nx2Safe = false;
      if (nx2Safe) {
        if (facing(moveDir)) { me.go(); return; }
        me.turn(moveDir); return;
      }
    }
  }

  // 8. 使用逃跑逻辑作为默认移动
  var escapeDir6 = getEscapeDir();
  if (escapeDir6) {
    if (facing(escapeDir6)) { me.go(); return; }
    me.turn(escapeDir6); return;
  }

  // 9. 最后的巡逻逻辑
  var bestDir = null;
  var bestScore = -9999;
  for (var i = 0; i < DIR_NAME.length; i++) {
    var d = DIR_NAME[i];
    var nx = mx + DIR_V[d][0], ny = my + DIR_V[d][1];
    if (!isPassable(nx, ny)) continue;
    var score = 0;
    if (d === myDir) score += 3;
    if (d === OPP[myDir]) score -= 5;
    if (isDeadEnd(nx, ny)) score -= 10;
    if (willBeInLineOfFire(nx, ny)) score -= 25;
    if (willBeInLineOfFireNext(nx, ny)) score -= 15;
    score += passableNeighbors(nx, ny);
    // v7_fixed: arena地图避免中央区域和草地
    if (mapInfo.isArenaLike && isCentralDangerZone(nx, ny)) score -= 30;
    if (mapInfo.isArenaLike && isGrass(nx, ny)) score -= 25;
    if (isAtDisadvantage() && enemyTank) {
      var ex = enemyTank.position[0], ey = enemyTank.position[1];
      score += manhattan(nx, ny, ex, ey);
    }
    // v7_fixed: arena地图中敌人消失时更保守
    if (mapInfo.isArenaLike && !enemyTank && aiState.lastKnownEnemyPos) {
      score += manhattan(nx, ny, aiState.lastKnownEnemyPos[0], aiState.lastKnownEnemyPos[1]) * 2;
    }
    if (score > bestScore) { bestScore = score; bestDir = d; }
  }
  if (bestDir) {
    if (facing(bestDir)) { me.go(); return; }
    me.turn(bestDir); return;
  }
  me.turn("right");
}
