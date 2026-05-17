var enemyLastDir = null;
var enemyLastPos = null;
var frameCount = 0;

function onIdle(me, enemy, game) {
  frameCount++;

  // v13: 防御性空值检查 - 防止核心对象缺失导致crash
  if (!me || !me.tank || !me.tank.position) return;
  if (!game || !game.map) return;

  var mx = me.tank.position[0];
  var my = me.tank.position[1];
  var myDir = me.tank.direction;
  var map = game.map;
  var H = map.length || 0;
  var W = (H > 0 && map[0]) ? map[0].length : 0;

  // v13: 安全获取enemy和bullet
  var enemyTank = (enemy && enemy.tank) ? enemy.tank : null;
  var enemyBullet = (enemy && enemy.bullet) ? enemy.bullet : null;
  var star = game.star || null;

  var DIR_V = { up: [0,-1], down: [0,1], left: [-1,0], right: [1,0] };
  var DIR_NAME = ["up","down","left","right"];
  var OPP = { up:"down", down:"up", left:"right", right:"left" };

  // v13: 安全的方向向量获取
  function getDirVec(dir) { return DIR_V[dir] || null; }

  function inBounds(x, y) { return x >= 0 && x < H && y >= 0 && y < W; }
  // v13: 防御性map[x]检查，防止锯齿数组
  function isWall(x, y) { return !inBounds(x, y) || !map[x] || map[x][y] === "x"; }
  function isPassable(x, y) { return inBounds(x, y) && map[x] && map[x][y] !== "x"; }
  function key(x, y) { return x + "," + y; }
  function manhattan(x1, y1, x2, y2) { return Math.abs(x1 - x2) + Math.abs(y1 - y2); }
  function dirToTarget(tx, ty) { if (mx === tx) return ty > my ? "down" : "up"; if (my === ty) return tx > mx ? "right" : "left"; return null; }
  function facing(dir) { return myDir === dir; }
  function passableNeighbors(x, y) { var count = 0; for (var i = 0; i < DIR_NAME.length; i++) { var d = DIR_NAME[i]; var dv = getDirVec(d); if (!dv) continue; if (isPassable(x + dv[0], y + dv[1])) count++; } return count; }
  function isDeadEnd(x, y) { return passableNeighbors(x, y) <= 1; }
  function isCornered(x, y) { return passableNeighbors(x, y) <= 2; }

  function bulletHeadingTowardMe(bullet) {
    if (!bullet) return false;
    var bx = bullet.position[0], by = bullet.position[1];
    var bDir = bullet.direction;
    var dv = getDirVec(bDir);
    if (!dv) return false;
    var dx = dv[0], dy = dv[1];
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
    var dv = getDirVec(bDir);
    if (!dv) return false;
    var dx = dv[0], dy = dv[1];
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

  function bulletWillHitMeSoon(bullet, frames) {
    if (!bullet) return false;
    frames = frames || 3;
    var bx = bullet.position[0], by = bullet.position[1];
    var bDir = bullet.direction;
    var dv = getDirVec(bDir);
    if (!dv) return false;
    var dx = dv[0], dy = dv[1];
    for (var f = 1; f <= frames; f++) {
      var nbx = bx + dx * f;
      var nby = by + dy * f;
      if (!inBounds(nbx, nby)) break;
      if (isWall(nbx, nby)) break;
      if (nbx === mx && nby === my) return true;
      if (dy === 0 && by === my) {
        if ((dx > 0 && bx < mx && nbx >= mx) || (dx < 0 && bx > mx && nbx <= mx)) return true;
      }
      if (dx === 0 && bx === mx) {
        if ((dy > 0 && by < my && nby >= my) || (dy < 0 && by > my && nby <= my)) return true;
      }
    }
    return false;
  }

  function bulletDist(bullet) { if (!bullet) return 9999; return manhattan(bullet.position[0], bullet.position[1], mx, my); }
  function getBulletDir(bullet) { return bullet ? bullet.direction : null; }
  function getDodgeDirs(bDir) { if (bDir === "left" || bDir === "right") return ["up", "down"]; return ["left", "right"]; }

  function isArenaMap() {
    if (H !== 15 || W !== 11) return false;
    var cx = Math.floor(H / 2);
    var cy = Math.floor(W / 2);
    var centerWalls = 0;
    for (var dx = -1; dx <= 1; dx++) {
      for (var dy = -1; dy <= 1; dy++) {
        var nx = cx + dx, ny = cy + dy;
        if (nx >= 0 && nx < H && ny >= 0 && ny < W && map[nx] && map[nx][ny] === "x") centerWalls++;
      }
    }
    return centerWalls >= 2;
  }
  var isArena = isArenaMap();
  var centerX = Math.floor(H / 2);
  var centerY = Math.floor(W / 2);

  function isCentralZone(x, y) {
    if (!isArena) return false;
    return manhattan(x, y, centerX, centerY) <= 3;
  }

  // v13: 安全的enemy位置获取
  function getEnemyPos() {
    if (!enemyTank || !enemyTank.position) return null;
    return enemyTank.position;
  }

  function isInEnemyLineOfFire() {
    if (!enemyTank) return false;
    var ePos = getEnemyPos();
    if (!ePos) return false;
    var ex = ePos[0], ey = ePos[1];
    var eDir = enemyTank.direction;
    if (!eDir || !getDirVec(eDir)) return false;
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

  function willBeInLineOfFire(x, y) {
    if (!enemyTank) return false;
    var ePos = getEnemyPos();
    if (!ePos) return false;
    var ex = ePos[0], ey = ePos[1];
    var eDir = enemyTank.direction;
    if (!eDir || !getDirVec(eDir)) return false;
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

  function willBeInLineOfFireNext(x, y) {
    if (!enemyTank) return false;
    var ePos = getEnemyPos();
    if (!ePos) return false;
    var ex = ePos[0], ey = ePos[1];
    var eDir = enemyTank.direction;
    if (!eDir || !getDirVec(eDir)) return false;
    if (willBeInLineOfFire(x, y)) return true;
    var ev = getDirVec(eDir);
    if (!ev) return false;
    var nex = ex + ev[0];
    var ney = ey + ev[1];
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
    return false;
  }

  function isInEnemyImmediateThreat() {
    if (!enemyTank) return false;
    var ePos = getEnemyPos();
    if (!ePos) return false;
    var ex = ePos[0], ey = ePos[1];
    var eDir = enemyTank.direction;
    if (!eDir || !getDirVec(eDir)) return false;
    if (ex !== mx && ey !== my) return false;
    var dist = manhattan(ex, ey, mx, my);
    if (dist > 8) return false;
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

  function trackEnemyMovement() {
    if (!enemyTank) return;
    var ePos = getEnemyPos();
    if (!ePos) return;
    var ex = ePos[0], ey = ePos[1];
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

  function predictEnemyPos() {
    if (!enemyTank) return null;
    var ePos = getEnemyPos();
    if (!ePos) return null;
    var ex = ePos[0], ey = ePos[1];
    var eDir = enemyTank.direction;
    var predicted = [ex, ey];
    if (eDir && getDirVec(eDir)) {
      var ev = getDirVec(eDir);
      var pex = ex + ev[0];
      var pey = ey + ev[1];
      if (isPassable(pex, pey)) {
        predicted = [pex, pey];
      }
    }
    if (enemyLastDir && enemyLastDir !== eDir && getDirVec(enemyLastDir)) {
      var ev2 = getDirVec(enemyLastDir);
      var pex2 = ex + ev2[0];
      var pey2 = ey + ev2[1];
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
    var ePos = getEnemyPos();
    if (!ePos) return null;
    var ex = ePos[0], ey = ePos[1];
    var eDir = enemyTank.direction;
    for (var s = 0; s < steps; s++) {
      if (!eDir || !getDirVec(eDir)) break;
      var ev = getDirVec(eDir);
      var nx = ex + ev[0];
      var ny = ey + ev[1];
      if (!isPassable(nx, ny)) break;
      ex = nx; ey = ny;
    }
    return [ex, ey];
  }

  function isAtDisadvantage() {
    var enemyHasStar = enemy.score > me.score;
    var iHaveStar = false;
    if (star && star[0] !== undefined && star[1] !== undefined && mx === star[0] && my === star[1]) iHaveStar = true;
    return enemyHasStar && !iHaveStar;
  }

  function isCloseRangePressure() {
    if (!enemyTank) return false;
    var ePos = getEnemyPos();
    if (!ePos) return false;
    var dist = manhattan(mx, my, ePos[0], ePos[1]);
    if (dist > 4) return false;
    var ex = ePos[0], ey = ePos[1];
    var eDir = enemyTank.direction;
    if (!eDir) return false;
    if (ex === mx || ey === my) {
      if (willBeInLineOfFire(mx, my)) return true;
      if (isInEnemyLineOfFire()) return true;
    }
    return false;
  }

  function getSafetyScore(x, y) {
    var score = 0;
    if (enemyTank) {
      var ePos = getEnemyPos();
      if (ePos) score += manhattan(x, y, ePos[0], ePos[1]) * 2;
    }
    if (willBeInLineOfFire(x, y)) score -= 50;
    if (willBeInLineOfFireNext(x, y)) score -= 30;
    if (isDeadEnd(x, y)) score -= 20;
    if (isCornered(x, y)) score -= 12;
    score += passableNeighbors(x, y) * 3;
    return score;
  }

  function getEscapeDir(preferStarDir) {
    var bestDir = null;
    var bestScore = -99999;
    for (var i = 0; i < DIR_NAME.length; i++) {
      var d = DIR_NAME[i];
      var dv = getDirVec(d);
      if (!dv) continue;
      var nx = mx + dv[0], ny = my + dv[1];
      if (!isPassable(nx, ny)) continue;

      var score = 0;

      if (enemyTank) {
        var ePos = getEnemyPos();
        if (ePos) {
          var ex = ePos[0], ey = ePos[1];
          var oldDist = manhattan(mx, my, ex, ey);
          var newDist = manhattan(nx, ny, ex, ey);
          score += (newDist - oldDist) * 4;
        }
      }

      if (enemyBullet && bulletHeadingTowardMe(enemyBullet)) {
        var bDir = getBulletDir(enemyBullet);
        var dodgeDirs = getDodgeDirs(bDir);
        var isDodgeDir = false;
        for (var j = 0; j < dodgeDirs.length; j++) {
          if (dodgeDirs[j] === d) { isDodgeDir = true; break; }
        }
        if (isDodgeDir) score += 20;
        if (bDir && d === OPP[bDir]) score -= 15;
      }

      if (willBeInLineOfFire(nx, ny)) score -= 30;
      if (willBeInLineOfFireNext(nx, ny)) score -= 15;

      if (isDeadEnd(nx, ny)) score -= 25;
      if (isCornered(nx, ny)) score -= 12;

      score += passableNeighbors(nx, ny) * 3;

      if (d === myDir) score += 2;

      if (isAtDisadvantage() && enemyTank) {
        var ePos = getEnemyPos();
        if (ePos) score += manhattan(nx, ny, ePos[0], ePos[1]) * 2;
      }

      if (isArena && isCentralZone(nx, ny)) score -= 35;

      if (preferStarDir && star && star[0] !== undefined && star[1] !== undefined) {
        var starDistOld = manhattan(mx, my, star[0], star[1]);
        var starDistNew = manhattan(nx, ny, star[0], star[1]);
        if (starDistNew < starDistOld) score += 15;
        else if (starDistNew > starDistOld) score -= 10;
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
      var dv = getDirVec(d);
      if (!dv) continue;
      var nx = mx + dv[0], ny = my + dv[1];
      if (!isPassable(nx, ny)) continue;
      if (willBeInLineOfFire(nx, ny) || willBeInLineOfFireNext(nx, ny)) {
        riskyDirs.push(d);
        continue;
      }
      var nextNeighbors = passableNeighbors(nx, ny);
      if (nextNeighbors >= 2) { safeDirs.push(d); } else { riskyDirs.push(d); }
    }
    return safeDirs.length > 0 ? safeDirs : riskyDirs;
  }

  function dodgeBullet(bullet) {
    var safeDirs = getSafeDodgeDirs(bullet);
    var bestDir = null;
    var bestScore = -99999;
    for (var i = 0; i < safeDirs.length; i++) {
      var d = safeDirs[i];
      var dv = getDirVec(d);
      if (!dv) continue;
      var nx = mx + dv[0], ny = my + dv[1];
      if (!isPassable(nx, ny)) continue;
      var score = 0;
      if (star && star[0] !== undefined && star[1] !== undefined) {
        var oldStarDist = manhattan(mx, my, star[0], star[1]);
        var newStarDist = manhattan(nx, ny, star[0], star[1]);
        if (newStarDist < oldStarDist) score += 12;
      }
      if (enemyTank) {
        var ePos = getEnemyPos();
        if (ePos) {
          var ex = ePos[0], ey = ePos[1];
          score += (manhattan(nx, ny, ex, ey) - manhattan(mx, my, ex, ey)) * 2;
        }
      }
      if (isDeadEnd(nx, ny)) score -= 20;
      if (d === myDir) score += 1;
      if (score > bestScore) {
        bestScore = score;
        bestDir = d;
      }
    }
    if (bestDir) return bestDir;
    var bDir = getBulletDir(bullet);
    if (bDir && OPP[bDir]) {
      var back = tryMove(OPP[bDir], false);
      if (back) return back;
    }
    for (var i = 0; i < DIR_NAME.length; i++) { var move = tryMove(DIR_NAME[i], false); if (move) return move; }
    return null;
  }

  function tryMove(dir, avoidDeadEnd) {
    var dv = getDirVec(dir);
    if (!dv) return null;
    var nx = mx + dv[0], ny = my + dv[1];
    if (!isPassable(nx, ny)) return null;
    if (avoidDeadEnd && isDeadEnd(nx, ny)) return null;
    return dir;
  }

  function bfs(targetPos, avoidDeadEnds) {
    if (!targetPos) return null;
    var tx = targetPos[0], ty = targetPos[1];
    if (tx === undefined || ty === undefined) return null;
    if (mx === tx && my === ty) return null;
    var maxDepth = isArena ? 20 : 35;
    var maxQueueSize = 500;
    var q = [[mx, my, null, 0]];
    var vis = {};
    vis[key(mx, my)] = true;
    var head = 0;
    while (head < q.length) {
      if (q.length > maxQueueSize) break;
      var curr = q[head++];
      var x = curr[0], y = curr[1], fm = curr[2], depth = curr[3];
      if (depth >= maxDepth) continue;
      for (var j = 0; j < DIR_NAME.length; j++) {
        var d = DIR_NAME[j];
        var dv = getDirVec(d);
        if (!dv) continue;
        var nx = x + dv[0], ny = y + dv[1];
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

  function bfsDistance(targetPos) {
    if (!targetPos) return 9999;
    var tx = targetPos[0], ty = targetPos[1];
    if (tx === undefined || ty === undefined) return 9999;
    if (mx === tx && my === ty) return 0;
    var maxDepth = isArena ? 20 : 35;
    var maxQueueSize = 500;
    var q = [[mx, my, 0]];
    var vis = {};
    vis[key(mx, my)] = true;
    var head = 0;
    while (head < q.length) {
      if (q.length > maxQueueSize) break;
      var curr = q[head++];
      var x = curr[0], y = curr[1], depth = curr[2];
      if (depth >= maxDepth) continue;
      for (var j = 0; j < DIR_NAME.length; j++) {
        var d = DIR_NAME[j];
        var dv = getDirVec(d);
        if (!dv) continue;
        var nx = x + dv[0], ny = y + dv[1];
        if (!isPassable(nx, ny)) continue;
        var k = key(nx, ny);
        if (vis[k]) continue;
        vis[k] = true;
        if (nx === tx && ny === ty) return depth + 1;
        q.push([nx, ny, depth + 1]);
      }
    }
    return 9999;
  }

  function hasClearShot(fx, fy, tx, ty) {
    if (fx === tx) { var minY = Math.min(fy, ty), maxY = Math.max(fy, ty); for (var y = minY + 1; y < maxY; y++) { if (isWall(fx, y)) return false; } return true; }
    if (fy === ty) { var minX = Math.min(fx, tx), maxX = Math.max(fx, tx); for (var x = minX + 1; x < maxX; x++) { if (isWall(x, fy)) return false; } return true; }
    return false;
  }

  function alignedWithEnemy() {
    if (!enemyTank) return false;
    var ePos = getEnemyPos();
    if (!ePos) return false;
    return hasClearShot(mx, my, ePos[0], ePos[1]);
  }

  function getShootDir() {
    if (!enemyTank) return null;
    var enemyShielded = false;
    var enemyCloaked = false;
    if (enemy && enemy.status) {
      if (enemy.status.shielded) enemyShielded = true;
      if (enemy.status.cloaked) enemyCloaked = true;
    }
    if (enemyShielded || enemyCloaked) return null;

    var ePos = getEnemyPos();
    if (!ePos) return null;
    var ex = ePos[0], ey = ePos[1];

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

  function canShootSafely() {
    if (!enemyTank) return true;
    var ePos = getEnemyPos();
    if (!ePos) return true;
    var ed = manhattan(mx, my, ePos[0], ePos[1]);
    if (ed <= 5 && isInEnemyLineOfFire()) return false;
    return true;
  }

  function canDodgeAfterShooting() {
    if (!enemyBullet) return true;
    if (bulletWillHitMeSoon(enemyBullet, 3)) return false;
    return true;
  }

  function isStarSafeToGet() {
    if (!star || !star[0] !== undefined || !star[1] !== undefined || !enemyTank) return true;
    var starDist = manhattan(mx, my, star[0], star[1]);
    var ePos = getEnemyPos();
    if (!ePos) return true;
    var enemyStarDist = manhattan(ePos[0], ePos[1], star[0], star[1]);
    if (enemyStarDist <= 3 && isInEnemyLineOfFire()) return false;
    if (enemyStarDist < starDist - 2) return false;
    if (isAtDisadvantage() && enemyStarDist <= starDist + 1) return false;
    return true;
  }

  function shouldGoForStar() {
    if (!star || !star[0] !== undefined || !star[1] !== undefined) return false;
    if (!enemyTank) return true;
    if (mx === star[0] && my === star[1]) return false;
    if (!isStarSafeToGet()) return false;
    if (isAtDisadvantage()) {
      var myDist = bfsDistance(star);
      var ePos = getEnemyPos();
      if (!ePos) return true;
      var enemyDist = bfsDistanceFrom(ePos[0], ePos[1], star);
      if (myDist < enemyDist - 1) return true;
      return false;
    }
    return true;
  }

  function bfsDistanceFrom(fromX, fromY, targetPos) {
    if (!targetPos) return 9999;
    var tx = targetPos[0], ty = targetPos[1];
    if (tx === undefined || ty === undefined) return 9999;
    if (fromX === tx && fromY === ty) return 0;
    var maxDepth = isArena ? 20 : 35;
    var maxQueueSize = 500;
    var q = [[fromX, fromY, 0]];
    var vis = {};
    vis[key(fromX, fromY)] = true;
    var head = 0;
    while (head < q.length) {
      if (q.length > maxQueueSize) break;
      var curr = q[head++];
      var x = curr[0], y = curr[1], depth = curr[2];
      if (depth >= maxDepth) continue;
      for (var j = 0; j < DIR_NAME.length; j++) {
        var d = DIR_NAME[j];
        var dv = getDirVec(d);
        if (!dv) continue;
        var nx = x + dv[0], ny = y + dv[1];
        if (!isPassable(nx, ny)) continue;
        var k = key(nx, ny);
        if (vis[k]) continue;
        vis[k] = true;
        if (nx === tx && ny === ty) return depth + 1;
        q.push([nx, ny, depth + 1]);
      }
    }
    return 9999;
  }

  function shouldUseCloak() {
    if (!me || !me.skill) return false;
    if (me.skill.remainingCooldownFrames === undefined || me.skill.remainingCooldownFrames === null) return false;
    if (me.skill.remainingCooldownFrames > 0) return false;

    var inLineOfFire = isInEnemyLineOfFire();
    var ePos = getEnemyPos();
    var dist = ePos ? manhattan(mx, my, ePos[0], ePos[1]) : 999;

    if (isCloseRangePressure()) {
      return true;
    }

    if (inLineOfFire && dist <= 4) {
      var hasSafeMove = false;
      for (var i = 0; i < DIR_NAME.length; i++) {
        var d = DIR_NAME[i];
        var dv = getDirVec(d);
        if (!dv) continue;
        var nx = mx + dv[0], ny = my + dv[1];
        if (isPassable(nx, ny) && !willBeInLineOfFire(nx, ny) && !isDeadEnd(nx, ny)) {
          hasSafeMove = true;
          break;
        }
      }
      if (!hasSafeMove) return true;
    }

    if (enemyBullet && bulletWillHitMe(enemyBullet) && inLineOfFire) {
      return true;
    }

    if (enemyBullet && bulletWillHitMe(enemyBullet)) {
      var bDist = bulletDist(enemyBullet);
      if (bDist <= 2) {
        var dodgeDirs = getDodgeDirs(getBulletDir(enemyBullet));
        var canDodge = false;
        for (var i = 0; i < dodgeDirs.length; i++) {
          var d = dodgeDirs[i];
          var dv = getDirVec(d);
          if (!dv) continue;
          var nx = mx + dv[0], ny = my + dv[1];
          if (isPassable(nx, ny)) { canDodge = true; break; }
        }
        if (!canDodge) return true;
      }
    }

    if (star && star[0] !== undefined && star[1] !== undefined) {
      var starDist = manhattan(mx, my, star[0], star[1]);
      if (starDist <= 2 && enemyTank) {
        var ePos2 = getEnemyPos();
        if (ePos2) {
          var enemyStarDist = manhattan(ePos2[0], ePos2[1], star[0], star[1]);
          if (enemyStarDist <= 3 && inLineOfFire) return true;
        }
      }
    }

    if (isAtDisadvantage() && inLineOfFire && dist <= 6) {
      return true;
    }

    return false;
  }

  function shouldKeepSafeDistance() {
    if (!enemyTank) return false;
    var ePos = getEnemyPos();
    if (!ePos) return false;
    var dist = manhattan(mx, my, ePos[0], ePos[1]);
    if (dist <= 6 && !enemyBullet && isInEnemyLineOfFire()) return true;
    if (isAtDisadvantage() && dist <= 5) return true;
    return false;
  }

  // v13: 安全调用me方法
  function safeCloak() { if (me && typeof me.cloak === 'function') me.cloak(); }
  function safeGo() { if (me && typeof me.go === 'function') me.go(); }
  function safeTurn(dir) { if (me && typeof me.turn === 'function') me.turn(dir); }
  function safeFire() { if (me && typeof me.fire === 'function') me.fire(); }

  // ========== MAIN DECISION LOGIC ==========

  if (isInEnemyImmediateThreat()) {
    if (shouldUseCloak()) { safeCloak(); return; }
    var escapeDir = getEscapeDir();
    if (escapeDir) {
      if (facing(escapeDir)) { safeGo(); return; }
      safeTurn(escapeDir); return;
    }
  }

  if (enemyBullet && bulletWillHitMeSoon(enemyBullet, 3)) {
    var dist = bulletDist(enemyBullet);
    if (dist <= 12) {
      var dodgeDir = dodgeBullet(enemyBullet);
      if (dodgeDir) {
        if (facing(dodgeDir)) { safeGo(); return; }
        safeTurn(dodgeDir); return;
      }
      if (dist <= 6 && shouldUseCloak()) { safeCloak(); return; }
    }
  }

  if (enemyTank) {
    var ePos = getEnemyPos();
    if (ePos) {
      var enemyDist = manhattan(mx, my, ePos[0], ePos[1]);
      if (enemyDist <= 3) {
        var shootDir = getShootDir();
        if (shootDir) {
          if (canShootSafely() && canDodgeAfterShooting()) {
            if (facing(shootDir)) { safeFire(); return; }
            safeTurn(shootDir); return;
          }
          if (shouldUseCloak()) { safeCloak(); return; }
          var escapeDir = getEscapeDir();
          if (escapeDir) {
            if (facing(escapeDir)) { safeGo(); return; }
            safeTurn(escapeDir); return;
          }
        }
        var ex = ePos[0], ey = ePos[1];
        if (ex === mx || ey === my) {
          var alignDir = dirToTarget(ex, ey);
          if (alignDir && tryMove(alignDir, false)) {
            var alignDv = getDirVec(alignDir);
            if (alignDv) {
              var alignNx = mx + alignDv[0], alignNy = my + alignDv[1];
              if (!willBeInLineOfFire(alignNx, alignNy) && !isDeadEnd(alignNx, alignNy)) {
                if (facing(alignDir)) { safeGo(); return; }
                safeTurn(alignDir); return;
              }
            }
          }
        }
        if (willBeInLineOfFire(mx, my) && enemyDist <= 2) {
          if (shouldUseCloak()) { safeCloak(); return; }
          var escapeDir2 = getEscapeDir();
          if (escapeDir2) {
            if (facing(escapeDir2)) { safeGo(); return; }
            safeTurn(escapeDir2); return;
          }
        }
      }
    }
  }

  if (isCloseRangePressure()) {
    if (shouldUseCloak()) { safeCloak(); return; }
    var escapeDir = getEscapeDir();
    if (escapeDir) {
      if (facing(escapeDir)) { safeGo(); return; }
      safeTurn(escapeDir); return;
    }
  }

  if (isArena && !enemyTank) {
    var bestDir = null;
    var bestScore = -99999;
    for (var i = 0; i < DIR_NAME.length; i++) {
      var d = DIR_NAME[i];
      var dv = getDirVec(d);
      if (!dv) continue;
      var nx = mx + dv[0], ny = my + dv[1];
      if (!isPassable(nx, ny)) continue;
      var score = 0;
      if (isCentralZone(nx, ny)) score -= 50;
      if (isDeadEnd(nx, ny)) score -= 30;
      if (isCornered(nx, ny)) score -= 15;
      score += passableNeighbors(nx, ny) * 5;
      if (d === myDir) score += 3;
      if (score > bestScore) { bestScore = score; bestDir = d; }
    }
    if (bestDir) {
      if (facing(bestDir)) { safeGo(); return; }
      safeTurn(bestDir); return;
    }
  }

  if (shouldKeepSafeDistance()) {
    var escapeDir = getEscapeDir();
    if (escapeDir) {
      if (facing(escapeDir)) { safeGo(); return; }
      safeTurn(escapeDir); return;
    }
    if (shouldUseCloak()) { safeCloak(); return; }
  }

  if (isInEnemyLineOfFire() && enemyTank) {
    var ePos = getEnemyPos();
    if (ePos) {
      var enemyDist = manhattan(mx, my, ePos[0], ePos[1]);
      if (enemyDist <= 6) {
        var escapeDir2 = getEscapeDir();
        if (escapeDir2) {
          if (facing(escapeDir2)) { safeGo(); return; }
          safeTurn(escapeDir2); return;
        }
        if (shouldUseCloak()) { safeCloak(); return; }
      }
    }
  }

  if (shouldUseCloak()) { safeCloak(); return; }

  var shootDir = getShootDir();
  if (shootDir) {
    if (isInEnemyLineOfFire() && enemyTank) {
      var ePos = getEnemyPos();
      if (ePos) {
        var ed = manhattan(mx, my, ePos[0], ePos[1]);
        if (ed <= 4) {
          var escapeDir3 = getEscapeDir();
          if (escapeDir3) {
            if (facing(escapeDir3)) { safeGo(); return; }
            safeTurn(escapeDir3); return;
          }
        }
      }
    }
    if (!canShootSafely()) {
      var escapeDir4 = getEscapeDir();
      if (escapeDir4) {
        if (facing(escapeDir4)) { safeGo(); return; }
        safeTurn(escapeDir4); return;
      }
    }
    if (!canDodgeAfterShooting()) {
      var escapeDir5 = getEscapeDir();
      if (escapeDir5) {
        if (facing(escapeDir5)) { safeGo(); return; }
        safeTurn(escapeDir5); return;
      }
    }
    if (facing(shootDir)) { safeFire(); return; }
    safeTurn(shootDir); return;
  }

  var target = null;
  var targetPriority = 0;

  if (star && star[0] !== undefined && star[1] !== undefined) {
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
    var ePos = getEnemyPos();
    if (ePos) {
      var enemyDist = manhattan(mx, my, ePos[0], ePos[1]);
      if (!isInEnemyLineOfFire() || enemyDist > 6) {
        target = ePos;
        targetPriority = 1;
      }
    }
  }

  if (target) {
    var moveDir = bfs(target, true);
    if (moveDir) {
      var moveDv = getDirVec(moveDir);
      if (moveDv) {
        var nx = mx + moveDv[0], ny = my + moveDv[1];
        var nxSafe = !willBeInLineOfFire(nx, ny) && !willBeInLineOfFireNext(nx, ny);
        if (isAtDisadvantage() && enemyTank) {
          var ePos = getEnemyPos();
          if (ePos) {
            var enemyDist = manhattan(nx, ny, ePos[0], ePos[1]);
            if (enemyDist < 4) nxSafe = false;
          }
        }
        if (isArena && isCentralZone(nx, ny)) nxSafe = false;
        if (nxSafe) {
          if (facing(moveDir)) { safeGo(); return; }
          safeTurn(moveDir); return;
        }
      }
    }

    moveDir = bfs(target, false);
    if (moveDir) {
      var moveDv2 = getDirVec(moveDir);
      if (moveDv2) {
        var nx2 = mx + moveDv2[0], ny2 = my + moveDv2[1];
        var nx2Safe = !willBeInLineOfFire(nx2, ny2) && !willBeInLineOfFireNext(nx2, ny2);
        if (isAtDisadvantage() && enemyTank) {
          var ePos = getEnemyPos();
          if (ePos) {
            var enemyDist2 = manhattan(nx2, ny2, ePos[0], ePos[1]);
            if (enemyDist2 < 4) nx2Safe = false;
          }
        }
        if (isArena && isCentralZone(nx2, ny2)) nx2Safe = false;
        if (nx2Safe) {
          if (facing(moveDir)) { safeGo(); return; }
          safeTurn(moveDir); return;
        }
      }
    }

    // v13: 增加star存在性检查
    if (star && star[0] !== undefined && star[1] !== undefined && (target === star || (target && target[0] === star[0] && target[1] === star[1]))) {
      var bestStarDir = null;
      var bestStarScore = -99999;
      for (var i = 0; i < DIR_NAME.length; i++) {
        var d = DIR_NAME[i];
        var dv = getDirVec(d);
        if (!dv) continue;
        var nx = mx + dv[0], ny = my + dv[1];
        if (!isPassable(nx, ny)) continue;
        var score = 0;
        var newStarDist = manhattan(nx, ny, star[0], star[1]);
        var oldStarDist = manhattan(mx, my, star[0], star[1]);
        score += (oldStarDist - newStarDist) * 5;
        if (willBeInLineOfFire(nx, ny)) score -= 25;
        if (willBeInLineOfFireNext(nx, ny)) score -= 15;
        if (isDeadEnd(nx, ny)) score -= 20;
        if (isCornered(nx, ny)) score -= 10;
        if (d === myDir) score += 2;
        if (score > bestStarScore) {
          bestStarScore = score;
          bestStarDir = d;
        }
      }
      if (bestStarDir) {
        if (facing(bestStarDir)) { safeGo(); return; }
        safeTurn(bestStarDir); return;
      }
    }
  }

  var escapeDir6 = getEscapeDir(star !== null);
  if (escapeDir6) {
    if (facing(escapeDir6)) { safeGo(); return; }
    safeTurn(escapeDir6); return;
  }

  var bestDir = null;
  var bestScore = -9999;
  for (var i = 0; i < DIR_NAME.length; i++) {
    var d = DIR_NAME[i];
    var dv = getDirVec(d);
    if (!dv) continue;
    var nx = mx + dv[0], ny = my + dv[1];
    if (!isPassable(nx, ny)) continue;
    var score = 0;
    if (d === myDir) score += 3;
    if (myDir && d === OPP[myDir]) score -= 5;
    if (isDeadEnd(nx, ny)) score -= 15;
    if (isCornered(nx, ny)) score -= 10;
    if (willBeInLineOfFire(nx, ny)) score -= 25;
    if (willBeInLineOfFireNext(nx, ny)) score -= 15;
    score += passableNeighbors(nx, ny);

    score -= manhattan(nx, ny, centerX, centerY) * 0.5;

    if (star && star[0] !== undefined && star[1] !== undefined) {
      var oldStarDist = manhattan(mx, my, star[0], star[1]);
      var newStarDist = manhattan(nx, ny, star[0], star[1]);
      if (newStarDist < oldStarDist) score += 5;
    }

    if (isAtDisadvantage() && enemyTank) {
      var ePos = getEnemyPos();
      if (ePos) score += manhattan(nx, ny, ePos[0], ePos[1]);
    }
    if (isArena && isCentralZone(nx, ny)) score -= 30;
    if (score > bestScore) { bestScore = score; bestDir = d; }
  }
  if (bestDir) {
    if (facing(bestDir)) { safeGo(); return; }
    safeTurn(bestDir); return;
  }

  if (myDir && getDirVec(myDir)) {
    var myDv = getDirVec(myDir);
    var nx = mx + myDv[0], ny = my + myDv[1];
    if (isPassable(nx, ny)) {
      safeGo(); return;
    }
  }
  safeTurn("right");
}
