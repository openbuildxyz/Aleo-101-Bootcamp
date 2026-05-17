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
    // 子弹水平飞行，检查是否在同一行且朝我飞来
    if (dy === 0) {
      if (by !== my) return false;
      return (dx > 0 && bx < mx) || (dx < 0 && bx > mx);
    }
    // 子弹垂直飞行，检查是否在同一列且朝我飞来
    if (dx === 0) {
      if (bx !== mx) return false;
      return (dy > 0 && by < my) || (dy < 0 && by > my);
    }
    return false;
  }

  // 检查子弹是否会在下一帧击中我（考虑我当前位置）
  function bulletWillHitMe(bullet) {
    if (!bullet) return false;
    var bx = bullet.position[0], by = bullet.position[1];
    var bDir = bullet.direction;
    var dx = DIR_V[bDir][0], dy = DIR_V[bDir][1];
    // 子弹下一位置
    var nbx = bx + dx, nby = by + dy;
    // 如果子弹下一位置就是我的位置，或者子弹路径经过我
    if (nbx === mx && nby === my) return true;
    // 检查子弹是否朝我方向且在同一行/列
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

  function getSafeDodgeDirs(bullet) {
    var bDir = getBulletDir(bullet);
    var dodgeDirs = getDodgeDirs(bDir);
    var safeDirs = [];
    var riskyDirs = [];
    for (var i = 0; i < dodgeDirs.length; i++) {
      var d = dodgeDirs[i];
      var nx = mx + DIR_V[d][0], ny = my + DIR_V[d][1];
      if (!isPassable(nx, ny)) continue;
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

  function shouldUseCloak() {
    if (!me.skill || me.skill.remainingCooldownFrames !== 0) return false;
    if (enemyTank && !enemy.status.cloaked) {
      var ex = enemyTank.position[0], ey = enemyTank.position[1];
      var dist = manhattan(mx, my, ex, ey);
      var enemyDir = dirToTarget(ex, ey);
      if (enemyDir === enemyTank.direction && dist <= 5 && hasClearShot(ex, ey)) { return true; }
      if (dist <= 2 && hasClearShot(ex, ey)) { return true; }
    }
    if (star) {
      var starDist = manhattan(mx, my, star[0], star[1]);
      if (starDist <= 3) {
        if (enemyTank) {
          var enemyStarDist = manhattan(enemyTank.position[0], enemyTank.position[1], star[0], star[1]);
          if (enemyStarDist <= 4) return true;
        }
        return true;
      }
    }
    if (enemyBullet && bulletWillHitMe(enemyBullet) && bulletDist(enemyBullet) <= 3) { return true; }
    return false;
  }

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

  // 2. 隐身技能优化使用
  if (shouldUseCloak()) { me.cloak(); return; }

  // 3. 射击逻辑（带预判）
  var shootDir = getShootDir();
  if (shootDir) {
    if (facing(shootDir)) { me.fire(); return; }
    me.turn(shootDir); return;
  }

  // 4. 目标选择：优先星星，其次敌人
  var target = star || (enemyTank && enemyTank.position);

  // 5. 向目标移动（避免死胡同）
  if (target) {
    var moveDir = bfs(target, true);
    if (moveDir) {
      if (facing(moveDir)) { me.go(); return; }
      me.turn(moveDir); return;
    }
    moveDir = bfs(target, false);
    if (moveDir) {
      if (facing(moveDir)) { me.go(); return; }
      me.turn(moveDir); return;
    }
  }

  // 6. 巡逻逻辑（避免走进死胡同）
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
    score += passableNeighbors(nx, ny);
    if (score > bestScore) { bestScore = score; bestDir = d; }
  }
  if (bestDir) {
    if (facing(bestDir)) { me.go(); return; }
    me.turn(bestDir); return;
  }
  me.turn("right");
}
