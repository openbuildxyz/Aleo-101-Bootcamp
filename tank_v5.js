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

  // ========== 新增：检查我是否处于敌人的射击线上 ==========
  function isInEnemyLineOfFire() {
    if (!enemyTank) return false;
    var ex = enemyTank.position[0], ey = enemyTank.position[1];
    var eDir = enemyTank.direction;
    // 不在同一行/列，肯定不在射击线上
    if (ex !== mx && ey !== my) return false;
    // 检查敌人方向是否朝向我
    if (ex === mx) {
      // 同一列，检查垂直方向
      if (ey < my && eDir === "down") return hasClearShot(ex, ey);
      if (ey > my && eDir === "up") return hasClearShot(ex, ey);
    }
    if (ey === my) {
      // 同一行，检查水平方向
      if (ex < mx && eDir === "right") return hasClearShot(ex, ey);
      if (ex > mx && eDir === "left") return hasClearShot(ex, ey);
    }
    return false;
  }

  // ========== 新增：检查某个位置是否会被敌人下一发子弹命中 ==========
  function willBeInLineOfFire(x, y) {
    if (!enemyTank) return false;
    var ex = enemyTank.position[0], ey = enemyTank.position[1];
    var eDir = enemyTank.direction;
    if (ex !== x && ey !== y) return false;
    if (ex === x) {
      if (ey < y && eDir === "down") return true;
      if (ey > y && eDir === "up") return true;
    }
    if (ey === y) {
      if (ex < x && eDir === "right") return true;
      if (ex > x && eDir === "left") return true;
    }
    return false;
  }

  // ========== 新增：获取最佳逃跑方向 ==========
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
        score += (newDist - oldDist) * 3;
      }

      // 远离子弹
      if (enemyBullet && bulletHeadingTowardMe(enemyBullet)) {
        var bDir = getBulletDir(enemyBullet);
        var dodgeDirs = getDodgeDirs(bDir);
        var isDodgeDir = false;
        for (var j = 0; j < dodgeDirs.length; j++) {
          if (dodgeDirs[j] === d) { isDodgeDir = true; break; }
        }
        if (isDodgeDir) score += 15;
        if (d === OPP[bDir]) score -= 10;
      }

      // 避免走进敌人射击线
      if (willBeInLineOfFire(nx, ny)) score -= 20;

      // 避免死胡同
      if (isDeadEnd(nx, ny)) score -= 15;

      // 优先有更多出口的方向
      score += passableNeighbors(nx, ny) * 2;

      // 保持当前方向有微弱加成（避免频繁转向）
      if (d === myDir) score += 1;

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
      if (willBeInLineOfFire(nx, ny)) {
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

  // ========== 优化：躲避后继续远离 ==========
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

  function hasClearShot(tx, ty) {
    if (mx === tx) { var minY = Math.min(my, ty), maxY = Math.max(my, ty); for (var y = minY + 1; y < maxY; y++) { if (isWall(mx, y)) return false; } return true; }
    if (my === ty) { var minX = Math.min(mx, tx), maxX = Math.max(mx, tx); for (var x = minX + 1; x < maxX; x++) { if (isWall(x, my)) return false; } return true; }
    return false;
  }

  function alignedWithEnemy() { if (!enemyTank) return false; var ex = enemyTank.position[0], ey = enemyTank.position[1]; return hasClearShot(ex, ey); }

  function predictEnemyPos() {
    if (!enemyTank) return null;
    var ex = enemyTank.position[0], ey = enemyTank.position[1];
    var eDir = enemyTank.direction;
    if (eDir && DIR_V[eDir]) {
      var pex = ex + DIR_V[eDir][0];
      var pey = ey + DIR_V[eDir][1];
      if (isPassable(pex, pey)) {
        if (pex === mx || pey === my) { return [pex, pey]; }
      }
    }
    return [ex, ey];
  }

  function getShootDir() {
    if (!enemyTank || enemy.status.shielded || enemy.status.cloaked) return null;
    var directDir = dirToTarget(enemyTank.position[0], enemyTank.position[1]);
    if (directDir && alignedWithEnemy()) return directDir;
    var predicted = predictEnemyPos();
    if (predicted) {
      var pDir = dirToTarget(predicted[0], predicted[1]);
      if (pDir && hasClearShot(predicted[0], predicted[1])) return pDir;
    }
    return null;
  }

  // ========== 优化：只在真正危险时使用隐身 ==========
  function shouldUseCloak() {
    if (!me.skill || me.skill.remainingCooldownFrames !== 0) return false;

    var inLineOfFire = isInEnemyLineOfFire();
    var dist = enemyTank ? manhattan(mx, my, enemyTank.position[0], enemyTank.position[1]) : 999;

    // 情况1：被敌人瞄准且距离很近，无法躲避
    if (inLineOfFire && dist <= 4) {
      // 检查是否有安全的躲避方向
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

    // 情况4：抢星星时敌人在附近
    if (star) {
      var starDist = manhattan(mx, my, star[0], star[1]);
      if (starDist <= 2 && enemyTank) {
        var enemyStarDist = manhattan(enemyTank.position[0], enemyTank.position[1], star[0], star[1]);
        if (enemyStarDist <= 3 && inLineOfFire) return true;
      }
    }

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

  // 2. 如果我在敌人射击线上且距离近，优先躲避/逃跑而不是对射
  if (isInEnemyLineOfFire() && enemyTank) {
    var enemyDist = manhattan(mx, my, enemyTank.position[0], enemyTank.position[1]);
    if (enemyDist <= 6) {
      // 尝试逃跑
      var escapeDir = getEscapeDir();
      if (escapeDir) {
        if (facing(escapeDir)) { me.go(); return; }
        me.turn(escapeDir); return;
      }
      // 无法逃跑才用隐身
      if (shouldUseCloak()) { me.cloak(); return; }
    }
  }

  // 3. 隐身技能精准使用
  if (shouldUseCloak()) { me.cloak(); return; }

  // 4. 射击逻辑（带预判）- 但我在敌人射击线上时降低优先级
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
    if (facing(shootDir)) { me.fire(); return; }
    me.turn(shootDir); return;
  }

  // 5. 目标选择：优先星星，其次敌人
  var target = star || (enemyTank && enemyTank.position);

  // 6. 向目标移动（避免死胡同，同时避免走进敌人射击线）
  if (target) {
    var moveDir = bfs(target, true);
    if (moveDir) {
      // 检查这个方向会不会走进射击线
      var nx = mx + DIR_V[moveDir][0], ny = my + DIR_V[moveDir][1];
      if (!willBeInLineOfFire(nx, ny)) {
        if (facing(moveDir)) { me.go(); return; }
        me.turn(moveDir); return;
      }
    }
    moveDir = bfs(target, false);
    if (moveDir) {
      var nx2 = mx + DIR_V[moveDir][0], ny2 = my + DIR_V[moveDir][1];
      if (!willBeInLineOfFire(nx2, ny2)) {
        if (facing(moveDir)) { me.go(); return; }
        me.turn(moveDir); return;
      }
    }
  }

  // 7. 使用逃跑逻辑作为默认移动
  var escapeDir = getEscapeDir();
  if (escapeDir) {
    if (facing(escapeDir)) { me.go(); return; }
    me.turn(escapeDir); return;
  }

  // 8. 最后的巡逻逻辑
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
    if (willBeInLineOfFire(nx, ny)) score -= 20;
    score += passableNeighbors(nx, ny);
    if (score > bestScore) { bestScore = score; bestDir = d; }
  }
  if (bestDir) {
    if (facing(bestDir)) { me.go(); return; }
    me.turn(bestDir); return;
  }
  me.turn("right");
}
