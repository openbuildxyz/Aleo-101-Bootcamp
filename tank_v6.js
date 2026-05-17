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
  function isPassable(x, y) { return inBounds(x, y) && map[x][y] !== "x"; }
  function key(x, y) { return x + "," + y; }
  function manhattan(x1, y1, x2, y2) { return Math.abs(x1 - x2) + Math.abs(y1 - y2); }
  function dirToTarget(tx, ty) { if (mx === tx) return ty > my ? "down" : "up"; if (my === ty) return tx > mx ? "right" : "left"; return null; }
  function facing(dir) { return myDir === dir; }
  function passableNeighbors(x, y) { var count = 0; for (var i = 0; i < DIR_NAME.length; i++) { var d = DIR_NAME[i]; if (isPassable(x + DIR_V[d][0], y + DIR_V[d][1])) count++; } return count; }
  function isDeadEnd(x, y) { return passableNeighbors(x, y) <= 1; }

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

  // ========== v6: 增强敌人射击线检测 ==========
  function isInEnemyLineOfFire() {
    if (!enemyTank) return false;
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

  // ========== v6: 检查任意位置是否在敌人射击线上 ==========
  function willBeInLineOfFire(x, y) {
    if (!enemyTank) return false;
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

  // ========== v6: 检查位置是否会被敌人下一发子弹命中（考虑敌人移动后） ==========
  function willBeInLineOfFireNext(x, y) {
    if (!enemyTank) return false;
    var ex = enemyTank.position[0], ey = enemyTank.position[1];
    var eDir = enemyTank.direction;
    // 敌人当前位置射击
    if (willBeInLineOfFire(x, y)) return true;
    // 敌人向前移动一格后的射击
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

  // ========== v6: 预测敌人下一步位置（结合当前方向和历史移动） ==========
  function predictEnemyPos() {
    if (!enemyTank) return null;
    var ex = enemyTank.position[0], ey = enemyTank.position[1];
    var eDir = enemyTank.direction;
    var predicted = [ex, ey];
    // 优先使用当前面向方向
    if (eDir && DIR_V[eDir]) {
      var pex = ex + DIR_V[eDir][0];
      var pey = ey + DIR_V[eDir][1];
      if (isPassable(pex, pey)) {
        predicted = [pex, pey];
      }
    }
    // 如果历史方向与当前方向不同，也考虑历史方向
    if (enemyLastDir && enemyLastDir !== eDir && DIR_V[enemyLastDir]) {
      var pex2 = ex + DIR_V[enemyLastDir][0];
      var pey2 = ey + DIR_V[enemyLastDir][1];
      if (isPassable(pex2, pey2)) {
        // 如果历史方向更可能（比如敌人在拐角），选择历史方向
        if (manhattan(pex2, pey2, mx, my) < manhattan(predicted[0], predicted[1], mx, my)) {
          predicted = [pex2, pey2];
        }
      }
    }
    return predicted;
  }

  // ========== v6: 预测敌人多步位置 ==========
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

  // ========== v6: 计算安全分数（越高越安全） ==========
  function getSafetyScore(x, y) {
    var score = 0;
    // 远离敌人
    if (enemyTank) {
      var ex = enemyTank.position[0], ey = enemyTank.position[1];
      score += manhattan(x, y, ex, ey) * 2;
    }
    // 不在敌人射击线上
    if (willBeInLineOfFire(x, y)) score -= 50;
    if (willBeInLineOfFireNext(x, y)) score -= 30;
    // 不在死胡同
    if (isDeadEnd(x, y)) score -= 20;
    // 有更多出口
    score += passableNeighbors(x, y) * 3;
    return score;
  }

  // ========== v6: 增强版最佳逃跑方向 ==========
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

      // 避免走进敌人射击线（当前和下一步）
      if (willBeInLineOfFire(nx, ny)) score -= 30;
      if (willBeInLineOfFireNext(nx, ny)) score -= 15;

      // 避免死胡同
      if (isDeadEnd(nx, ny)) score -= 20;

      // 优先有更多出口的方向
      score += passableNeighbors(nx, ny) * 3;

      // 保持当前方向有微弱加成（避免频繁转向）
      if (d === myDir) score += 2;

      // 劣势时更保守：优先最大化距离
      if (isAtDisadvantage() && enemyTank) {
        var ex = enemyTank.position[0], ey = enemyTank.position[1];
        score += manhattan(nx, ny, ex, ey) * 2;
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
      // 避免躲进另一条射击线
      if (willBeInLineOfFire(nx, ny) || willBeInLineOfFireNext(nx, ny)) {
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

  // ========== v6: 增强版clear shot，支持任意两点 ==========
  function hasClearShot(fx, fy, tx, ty) {
    if (fx === tx) { var minY = Math.min(fy, ty), maxY = Math.max(fy, ty); for (var y = minY + 1; y < maxY; y++) { if (isWall(fx, y)) return false; } return true; }
    if (fy === ty) { var minX = Math.min(fx, tx), maxX = Math.max(fx, tx); for (var x = minX + 1; x < maxX; x++) { if (isWall(x, fy)) return false; } return true; }
    return false;
  }

  function alignedWithEnemy() { if (!enemyTank) return false; var ex = enemyTank.position[0], ey = enemyTank.position[1]; return hasClearShot(mx, my, ex, ey); }

  // ========== v6: 增强射击方向计算（多步预判） ==========
  function getShootDir() {
    if (!enemyTank) return null;
    // 检查敌人是否有护盾或隐身状态
    var enemyShielded = false;
    var enemyCloaked = false;
    if (enemy.status) {
      if (enemy.status.shielded) enemyShielded = true;
      if (enemy.status.cloaked) enemyCloaked = true;
    }
    if (enemyShielded || enemyCloaked) return null;

    var ex = enemyTank.position[0], ey = enemyTank.position[1];

    // 直接射击
    var directDir = dirToTarget(ex, ey);
    if (directDir && alignedWithEnemy()) return directDir;

    // 单步预判
    var predicted = predictEnemyPos();
    if (predicted) {
      var pDir = dirToTarget(predicted[0], predicted[1]);
      if (pDir && hasClearShot(mx, my, predicted[0], predicted[1])) return pDir;
    }

    // 多步预判（2步）
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
    // 如果敌人在附近且我在其射击线上，不安全
    if (ed <= 5 && isInEnemyLineOfFire()) return false;
    return true;
  }

  // ========== v6: 判断抢星星是否安全 ==========
  function isStarSafeToGet() {
    if (!star || !enemyTank) return true;
    var starDist = manhattan(mx, my, star[0], star[1]);
    var enemyStarDist = manhattan(enemyTank.position[0], enemyTank.position[1], star[0], star[1]);
    // 如果敌人离星星很近且我在敌人射击线上，不安全
    if (enemyStarDist <= 3 && isInEnemyLineOfFire()) return false;
    // 如果敌人离星星比我近很多，不安全
    if (enemyStarDist < starDist - 2) return false;
    // 劣势时更保守
    if (isAtDisadvantage() && enemyStarDist <= starDist + 1) return false;
    return true;
  }

  // ========== v6: 优化隐身技能使用 ==========
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

    return false;
  }

  // ========== v6: 当敌人在附近且没有子弹时，也要保持安全距离 ==========
  function shouldKeepSafeDistance() {
    if (!enemyTank) return false;
    var dist = manhattan(mx, my, enemyTank.position[0], enemyTank.position[1]);
    // 敌人在附近，没有子弹，但我在其射击线上
    if (dist <= 6 && !enemyBullet && isInEnemyLineOfFire()) return true;
    // 劣势时敌人靠近
    if (isAtDisadvantage() && dist <= 5) return true;
    return false;
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
      var escapeDir = getEscapeDir();
      if (escapeDir) {
        if (facing(escapeDir)) { me.go(); return; }
        me.turn(escapeDir); return;
      }
      if (shouldUseCloak()) { me.cloak(); return; }
    }
  }

  // 4. 隐身技能精准使用
  if (shouldUseCloak()) { me.cloak(); return; }

  // 5. 射击逻辑（带预判）- 但我在敌人射击线上时降低优先级
  var shootDir = getShootDir();
  if (shootDir) {
    // 如果我在敌人射击线上且敌人距离很近，先不射击，优先移动
    if (isInEnemyLineOfFire() && enemyTank) {
      var ed = manhattan(mx, my, enemyTank.position[0], enemyTank.position[1]);
      if (ed <= 4) {
        var escapeDir = getEscapeDir();
        if (escapeDir) {
          if (facing(escapeDir)) { me.go(); return; }
          me.turn(escapeDir); return;
        }
      }
    }
    // v6: 检查是否可以安全射击
    if (!canShootSafely()) {
      var escapeDir = getEscapeDir();
      if (escapeDir) {
        if (facing(escapeDir)) { me.go(); return; }
        me.turn(escapeDir); return;
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
    // 劣势时更保守地抢星
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

  // 如果没有星星目标或星星不安全，考虑追击敌人
  if (!target && enemyTank) {
    var enemyDist = manhattan(mx, my, enemyTank.position[0], enemyTank.position[1]);
    // 只有安全时才追击
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
      // 劣势时更严格
      if (isAtDisadvantage() && enemyTank) {
        var enemyDist = manhattan(nx, ny, enemyTank.position[0], enemyTank.position[1]);
        if (enemyDist < 4) nxSafe = false;
      }
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
      if (nx2Safe) {
        if (facing(moveDir)) { me.go(); return; }
        me.turn(moveDir); return;
      }
    }
  }

  // 8. 使用逃跑逻辑作为默认移动
  var escapeDir = getEscapeDir();
  if (escapeDir) {
    if (facing(escapeDir)) { me.go(); return; }
    me.turn(escapeDir); return;
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
    // 劣势时优先远离敌人
    if (isAtDisadvantage() && enemyTank) {
      var ex = enemyTank.position[0], ey = enemyTank.position[1];
      score += manhattan(nx, ny, ex, ey);
    }
    if (score > bestScore) { bestScore = score; bestDir = d; }
  }
  if (bestDir) {
    if (facing(bestDir)) { me.go(); return; }
    me.turn(bestDir); return;
  }
  me.turn("right");
}
