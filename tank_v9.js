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
  function isCornered(x, y) { return passableNeighbors(x, y) <= 2; }

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

  function bulletWillHitMeSoon(bullet, frames) {
    if (!bullet) return false;
    var bx = bullet.position[0], by = bullet.position[1];
    var bDir = bullet.direction;
    var dx = DIR_V[bDir][0], dy = DIR_V[bDir][1];
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
        if (map[cx + dx][cy + dy] === "x") centerWalls++;
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

  function willBeInLineOfFireNext(x, y) {
    if (!enemyTank) return false;
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

  function isAtDisadvantage() {
    var enemyHasStar = enemy.score > me.score;
    var iHaveStar = false;
    if (star && mx === star[0] && my === star[1]) iHaveStar = true;
    return enemyHasStar && !iHaveStar;
  }

  function isCloseRangePressure() {
    if (!enemyTank) return false;
    var dist = manhattan(mx, my, enemyTank.position[0], enemyTank.position[1]);
    if (dist > 4) return false;
    var ex = enemyTank.position[0], ey = enemyTank.position[1];
    var eDir = enemyTank.direction;
    if (!eDir) return false;
    if (ex === mx || ey === my) {
      if (willBeInLineOfFire(mx, my)) return true;
    }
    return false;
  }

  function getSafetyScore(x, y) {
    var score = 0;
    if (enemyTank) {
      var ex = enemyTank.position[0], ey = enemyTank.position[1];
      score += manhattan(x, y, ex, ey) * 2;
    }
    if (willBeInLineOfFire(x, y)) score -= 50;
    if (willBeInLineOfFireNext(x, y)) score -= 30;
    if (isDeadEnd(x, y)) score -= 20;
    if (isCornered(x, y)) score -= 12;
    score += passableNeighbors(x, y) * 3;
    return score;
  }

  // v9: Improved getEscapeDir with star-aware dodging
  function getEscapeDir(preferStarDir) {
    var bestDir = null;
    var bestScore = -99999;
    for (var i = 0; i < DIR_NAME.length; i++) {
      var d = DIR_NAME[i];
      var nx = mx + DIR_V[d][0], ny = my + DIR_V[d][1];
      if (!isPassable(nx, ny)) continue;

      var score = 0;

      if (enemyTank) {
        var ex = enemyTank.position[0], ey = enemyTank.position[1];
        var oldDist = manhattan(mx, my, ex, ey);
        var newDist = manhattan(nx, ny, ex, ey);
        score += (newDist - oldDist) * 4;
      }

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

      if (willBeInLineOfFire(nx, ny)) score -= 30;
      if (willBeInLineOfFireNext(nx, ny)) score -= 15;

      if (isDeadEnd(nx, ny)) score -= 20;
      if (isCornered(nx, ny)) score -= 12;

      score += passableNeighbors(nx, ny) * 3;

      if (d === myDir) score += 2;

      if (isAtDisadvantage() && enemyTank) {
        var ex = enemyTank.position[0], ey = enemyTank.position[1];
        score += manhattan(nx, ny, ex, ey) * 2;
      }

      if (isArena && isCentralZone(nx, ny)) score -= 35;

      // v9: Prefer directions toward star when specified
      if (preferStarDir && star) {
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
      var nx = mx + DIR_V[d][0], ny = my + DIR_V[d][1];
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

  // v9: Star-aware dodge - prefer dodge direction that moves toward star
  function dodgeBullet(bullet) {
    var safeDirs = getSafeDodgeDirs(bullet);
    var bestDir = null;
    var bestScore = -99999;
    for (var i = 0; i < safeDirs.length; i++) {
      var d = safeDirs[i];
      var move = tryMove(d, false);
      if (!move) continue;
      var score = 0;
      var nx = mx + DIR_V[d][0], ny = my + DIR_V[d][1];
      if (star) {
        var oldStarDist = manhattan(mx, my, star[0], star[1]);
        var newStarDist = manhattan(nx, ny, star[0], star[1]);
        if (newStarDist < oldStarDist) score += 12;
      }
      if (enemyTank) {
        var ex = enemyTank.position[0], ey = enemyTank.position[1];
        score += (manhattan(nx, ny, ex, ey) - manhattan(mx, my, ex, ey)) * 2;
      }
      if (d === myDir) score += 1;
      if (score > bestScore) {
        bestScore = score;
        bestDir = d;
      }
    }
    if (bestDir) return bestDir;
    var back = tryMove(OPP[getBulletDir(bullet)], false); if (back) return back;
    for (var i = 0; i < DIR_NAME.length; i++) { var move = tryMove(DIR_NAME[i], false); if (move) return move; }
    return null;
  }

  function tryMove(dir, avoidDeadEnd) {
    var nx = mx + DIR_V[dir][0], ny = my + DIR_V[dir][1];
    if (!isPassable(nx, ny)) return null;
    if (avoidDeadEnd && isDeadEnd(nx, ny)) return null;
    return dir;
  }

  function bfs(targetPos, avoidDeadEnds) {
    if (!targetPos) return null;
    var tx = targetPos[0], ty = targetPos[1];
    if (mx === tx && my === ty) return null;
    var maxDepth = isArena ? 25 : 40;
    var q = [[mx, my, null, 0]];
    var vis = {};
    vis[key(mx, my)] = true;
    for (var i = 0; i < q.length; i++) {
      var x = q[i][0], y = q[i][1], fm = q[i][2], depth = q[i][3];
      if (depth >= maxDepth) continue;
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

  // v9: BFS that returns distance
  function bfsDistance(targetPos) {
    if (!targetPos) return 9999;
    var tx = targetPos[0], ty = targetPos[1];
    if (mx === tx && my === ty) return 0;
    var maxDepth = isArena ? 25 : 40;
    var q = [[mx, my, 0]];
    var vis = {};
    vis[key(mx, my)] = true;
    for (var i = 0; i < q.length; i++) {
      var x = q[i][0], y = q[i][1], depth = q[i][2];
      if (depth >= maxDepth) continue;
      for (var j = 0; j < DIR_NAME.length; j++) {
        var d = DIR_NAME[j];
        var nx = x + DIR_V[d][0], ny = y + DIR_V[d][1];
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

  // v9: BFS from any position to target
  function bfsFrom(fromX, fromY, targetPos, maxDepth) {
    if (!targetPos) return null;
    if (maxDepth === undefined) maxDepth = isArena ? 25 : 40;
    var tx = targetPos[0], ty = targetPos[1];
    if (fromX === tx && fromY === ty) return null;
    var q = [[fromX, fromY, null, 0]];
    var vis = {};
    vis[key(fromX, fromY)] = true;
    for (var i = 0; i < q.length; i++) {
      var x = q[i][0], y = q[i][1], fm = q[i][2], depth = q[i][3];
      if (depth >= maxDepth) continue;
      for (var j = 0; j < DIR_NAME.length; j++) {
        var d = DIR_NAME[j];
        var nx = x + DIR_V[d][0], ny = y + DIR_V[d][1];
        if (!isPassable(nx, ny)) continue;
        var k = key(nx, ny);
        if (vis[k]) continue;
        vis[k] = true;
        var nextFm = fm || d;
        if (nx === tx && ny === ty) return nextFm;
        q.push([nx, ny, nextFm, depth + 1]);
      }
    }
    return null;
  }

  // v9: Distance from any position
  function distanceFrom(fromX, fromY, targetPos, maxDepth) {
    if (!targetPos) return 9999;
    if (maxDepth === undefined) maxDepth = isArena ? 25 : 40;
    var tx = targetPos[0], ty = targetPos[1];
    if (fromX === tx && fromY === ty) return 0;
    var q = [[fromX, fromY, 0]];
    var vis = {};
    vis[key(fromX, fromY)] = true;
    for (var i = 0; i < q.length; i++) {
      var x = q[i][0], y = q[i][1], depth = q[i][2];
      if (depth >= maxDepth) continue;
      for (var j = 0; j < DIR_NAME.length; j++) {
        var d = DIR_NAME[j];
        var nx = x + DIR_V[d][0], ny = y + DIR_V[d][1];
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

  function alignedWithEnemy() { if (!enemyTank) return false; var ex = enemyTank.position[0], ey = enemyTank.position[1]; return hasClearShot(mx, my, ex, ey); }

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

  function canShootSafely() {
    if (!enemyTank) return true;
    var ed = manhattan(mx, my, enemyTank.position[0], enemyTank.position[1]);
    if (ed <= 5 && isInEnemyLineOfFire()) return false;
    return true;
  }

  function canDodgeAfterShooting() {
    if (!enemyBullet) return true;
    if (bulletWillHitMeSoon(enemyBullet, 3)) return false;
    return true;
  }

  // v9: Revised - less restrictive, allows contesting
  function isStarSafeToGet() {
    if (!star || !enemyTank) return true;
    var starDist = manhattan(mx, my, star[0], star[1]);
    var enemyStarDist = manhattan(enemyTank.position[0], enemyTank.position[1], star[0], star[1]);
    // Only unsafe if enemy is right at star AND can shoot us
    if (enemyStarDist <= 2 && isInEnemyLineOfFire() && starDist > 3) return false;
    return true;
  }

  // v9: NEW - should aggressively rush star
  function shouldRushStar() {
    if (!star || !enemyTank) return false;
    var enemyHasStar = enemy.score > me.score;
    if (!enemyHasStar) return false;
    var myDist = bfsDistance(star);
    var enemyDist = distanceFrom(enemyTank.position[0], enemyTank.position[1], star);
    // Rush if we are closer or equal distance to star
    return myDist <= enemyDist;
  }

  // v9: NEW - can we reach star before enemy?
  function canReachStarFirst() {
    if (!star || !enemyTank) return true;
    var myDist = bfsDistance(star);
    var enemyDist = distanceFrom(enemyTank.position[0], enemyTank.position[1], star);
    return myDist < enemyDist;
  }

  // v9: NEW - get intercept position when enemy is closer to star
  function getInterceptTarget() {
    if (!star || !enemyTank) return null;
    var ex = enemyTank.position[0], ey = enemyTank.position[1];
    var eDir = enemyTank.direction;
    // Try to find position on enemy's path to star
    if (eDir && DIR_V[eDir]) {
      // Check positions between enemy and star
      var dx = star[0] - ex;
      var dy = star[1] - ey;
      // Try blocking positions
      for (var step = 1; step <= 3; step++) {
        var bx = ex;
        var by = ey;
        if (Math.abs(dx) >= Math.abs(dy) && dx !== 0) {
          bx = ex + (dx > 0 ? step : -step);
        } else if (dy !== 0) {
          by = ey + (dy > 0 ? step : -step);
        }
        if (isPassable(bx, by) && manhattan(bx, by, star[0], star[1]) < manhattan(ex, ey, star[0], star[1])) {
          // Check if we can reach this position
          var myDistToBlock = distanceFrom(mx, my, [bx, by]);
          var enemyDistToBlock = distanceFrom(ex, ey, [bx, by]);
          if (myDistToBlock <= enemyDistToBlock + 1) {
            return [bx, by];
          }
        }
      }
    }
    // Fallback: move toward star anyway
    return star;
  }

  function shouldUseCloak() {
    if (!me.skill) return false;
    if (me.skill.remainingCooldownFrames !== 0) return false;

    var inLineOfFire = isInEnemyLineOfFire();
    var dist = enemyTank ? manhattan(mx, my, enemyTank.position[0], enemyTank.position[1]) : 999;

    if (isCloseRangePressure()) {
      return true;
    }

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
          var nx = mx + DIR_V[d][0], ny = my + DIR_V[d][1];
          if (isPassable(nx, ny)) { canDodge = true; break; }
        }
        if (!canDodge) return true;
      }
    }

    if (star) {
      var starDist = manhattan(mx, my, star[0], star[1]);
      if (starDist <= 2 && enemyTank) {
        var enemyStarDist = manhattan(enemyTank.position[0], enemyTank.position[1], star[0], star[1]);
        if (enemyStarDist <= 3 && inLineOfFire) return true;
      }
    }

    if (isAtDisadvantage() && inLineOfFire && dist <= 6) {
      return true;
    }

    return false;
  }

  function shouldKeepSafeDistance() {
    if (!enemyTank) return false;
    var dist = manhattan(mx, my, enemyTank.position[0], enemyTank.position[1]);
    if (dist <= 6 && !enemyBullet && isInEnemyLineOfFire()) return true;
    if (isAtDisadvantage() && dist <= 5) return true;
    return false;
  }

  // ========== MAIN DECISION LOGIC ==========

  // 1. Bullet dodging (highest priority)
  if (enemyBullet && bulletWillHitMeSoon(enemyBullet, 3)) {
    var dist = bulletDist(enemyBullet);
    if (dist <= 12) {
      var dodgeDir = dodgeBullet(enemyBullet);
      if (dodgeDir) {
        if (facing(dodgeDir)) { me.go(); return; }
        me.turn(dodgeDir); return;
      }
      if (dist <= 6 && shouldUseCloak()) { me.cloak(); return; }
    }
  }

  // 2. v9: Close range combat - if enemy very close, prioritize shooting/alignment
  if (enemyTank) {
    var enemyDist = manhattan(mx, my, enemyTank.position[0], enemyTank.position[1]);
    if (enemyDist <= 3) {
      var shootDir = getShootDir();
      if (shootDir) {
        // We can shoot enemy - fire!
        if (facing(shootDir)) { me.fire(); return; }
        me.turn(shootDir); return;
      }
      // Try to align for shot
      var ex = enemyTank.position[0], ey = enemyTank.position[1];
      if (ex === mx || ey === my) {
        // Same row/col but wall blocking - try to find alignment move
        var alignDir = dirToTarget(ex, ey);
        if (alignDir && tryMove(alignDir, false)) {
          if (!willBeInLineOfFire(mx + DIR_V[alignDir][0], my + DIR_V[alignDir][1])) {
            if (facing(alignDir)) { me.go(); return; }
            me.turn(alignDir); return;
          }
        }
      }
      // If enemy can shoot us and we're too close, escape
      if (willBeInLineOfFire(mx, my) && enemyDist <= 2) {
        if (shouldUseCloak()) { me.cloak(); return; }
        var escapeDir = getEscapeDir();
        if (escapeDir) {
          if (facing(escapeDir)) { me.go(); return; }
          me.turn(escapeDir); return;
        }
      }
    }
  }

  // 3. Close range pressure (from v8)
  if (isCloseRangePressure()) {
    if (shouldUseCloak()) { me.cloak(); return; }
    var escapeDir = getEscapeDir();
    if (escapeDir) {
      if (facing(escapeDir)) { me.go(); return; }
      me.turn(escapeDir); return;
    }
  }

  // 4. Arena mode without enemy visible
  if (isArena && !enemyTank) {
    var bestDir = null;
    var bestScore = -99999;
    for (var i = 0; i < DIR_NAME.length; i++) {
      var d = DIR_NAME[i];
      var nx = mx + DIR_V[d][0], ny = my + DIR_V[d][1];
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
      if (facing(bestDir)) { me.go(); return; }
      me.turn(bestDir); return;
    }
  }

  // 5. Keep safe distance
  if (shouldKeepSafeDistance()) {
    var escapeDir = getEscapeDir();
    if (escapeDir) {
      if (facing(escapeDir)) { me.go(); return; }
      me.turn(escapeDir); return;
    }
    if (shouldUseCloak()) { me.cloak(); return; }
  }

  // 6. In enemy line of fire
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

  // 7. Use cloak if needed
  if (shouldUseCloak()) { me.cloak(); return; }

  // 8. Shooting logic
  var shootDir = getShootDir();
  if (shootDir) {
    if (isInEnemyLineOfFire() && enemyTank) {
      var ed = manhattan(mx, my, enemyTank.position[0], enemyTank.position[1]);
      if (ed <= 4) {
        var escapeDir3 = getEscapeDir();
        if (escapeDir3) {
          if (facing(escapeDir3)) { me.go(); return; }
          me.turn(escapeDir3); return;
        }
      }
    }
    if (!canShootSafely()) {
      var escapeDir4 = getEscapeDir();
      if (escapeDir4) {
        if (facing(escapeDir4)) { me.go(); return; }
        me.turn(escapeDir4); return;
      }
    }
    if (!canDodgeAfterShooting()) {
      var escapeDir5 = getEscapeDir();
      if (escapeDir5) {
        if (facing(escapeDir5)) { me.go(); return; }
        me.turn(escapeDir5); return;
      }
    }
    if (facing(shootDir)) { me.fire(); return; }
    me.turn(shootDir); return;
  }

  // ========== v9: TARGET SELECTION (major improvements) ==========
  var target = null;
  var targetPriority = 0;
  var useAggressivePath = false;

  // v9: Star target selection - ALWAYS consider star, but with smart logic
  if (star) {
    var starDist = manhattan(mx, my, star[0], star[1]);
    var enemyStarDist = enemyTank ? manhattan(enemyTank.position[0], enemyTank.position[1], star[0], star[1]) : 999;

    // v9: shouldRushStar - enemy has advantage and we can contest
    if (shouldRushStar()) {
      target = star;
      targetPriority = 3; // Highest
      useAggressivePath = true;
    }
    // v9: We can reach star first - always go for it
    else if (canReachStarFirst()) {
      target = star;
      targetPriority = 3;
      useAggressivePath = false;
    }
    // v9: Enemy is closer to star - try to intercept or contest
    else if (enemyTank && enemyStarDist < starDist) {
      // Try to intercept enemy path
      var intercept = getInterceptTarget();
      if (intercept && intercept[0] !== star[0] || intercept[1] !== star[1]) {
        target = intercept;
        targetPriority = 2;
      } else {
        // Still move toward star but carefully
        target = star;
        targetPriority = 2;
        useAggressivePath = false;
      }
    }
    // v9: Default - go for star
    else {
      target = star;
      targetPriority = 2;
    }
  }

  // Enemy target (lower priority than star when star exists)
  if (!target && enemyTank) {
    var enemyDist = manhattan(mx, my, enemyTank.position[0], enemyTank.position[1]);
    if (!isInEnemyLineOfFire() || enemyDist > 6) {
      target = enemyTank.position;
      targetPriority = 1;
    }
  }

  // v9: Move toward target with safety checks
  if (target) {
    // First try: BFS with dead end avoidance
    var moveDir = bfs(target, true);
    if (moveDir) {
      var nx = mx + DIR_V[moveDir][0], ny = my + DIR_V[moveDir][1];
      var nxSafe = true;

      // v9: Less strict safety when rushing star
      if (!useAggressivePath) {
        if (willBeInLineOfFire(nx, ny) || willBeInLineOfFireNext(nx, ny)) nxSafe = false;
      } else {
        // When rushing, only avoid immediate death
        if (willBeInLineOfFire(nx, ny) && enemyTank) {
          var ed = manhattan(nx, ny, enemyTank.position[0], enemyTank.position[1]);
          if (ed <= 3) nxSafe = false;
        }
      }

      if (isAtDisadvantage() && enemyTank && !useAggressivePath) {
        var enemyDist = manhattan(nx, ny, enemyTank.position[0], enemyTank.position[1]);
        if (enemyDist < 3) nxSafe = false;
      }
      if (isArena && isCentralZone(nx, ny)) nxSafe = false;

      if (nxSafe) {
        if (facing(moveDir)) { me.go(); return; }
        me.turn(moveDir); return;
      }
    }

    // Second try: BFS without dead end avoidance
    moveDir = bfs(target, false);
    if (moveDir) {
      var nx2 = mx + DIR_V[moveDir][0], ny2 = my + DIR_V[moveDir][1];
      var nx2Safe = true;

      if (!useAggressivePath) {
        if (willBeInLineOfFire(nx2, ny2) || willBeInLineOfFireNext(nx2, ny2)) nx2Safe = false;
      } else {
        if (willBeInLineOfFire(nx2, ny2) && enemyTank) {
          var ed2 = manhattan(nx2, ny2, enemyTank.position[0], enemyTank.position[1]);
          if (ed2 <= 2) nx2Safe = false;
        }
      }

      if (isAtDisadvantage() && enemyTank && !useAggressivePath) {
        var enemyDist2 = manhattan(nx2, ny2, enemyTank.position[0], enemyTank.position[1]);
        if (enemyDist2 < 3) nx2Safe = false;
      }
      if (isArena && isCentralZone(nx2, ny2)) nx2Safe = false;

      if (nx2Safe) {
        if (facing(moveDir)) { me.go(); return; }
        me.turn(moveDir); return;
      }
    }

    // v9: Third try - if target is star and we can't get there safely,
    // still try to move in star's general direction
    if (target === star || (target[0] === star[0] && target[1] === star[1])) {
      var bestStarDir = null;
      var bestStarScore = -99999;
      for (var i = 0; i < DIR_NAME.length; i++) {
        var d = DIR_NAME[i];
        var nx = mx + DIR_V[d][0], ny = my + DIR_V[d][1];
        if (!isPassable(nx, ny)) continue;
        var score = 0;
        var newStarDist = manhattan(nx, ny, star[0], star[1]);
        var oldStarDist = manhattan(mx, my, star[0], star[1]);
        score += (oldStarDist - newStarDist) * 5;
        if (willBeInLineOfFire(nx, ny)) score -= 20;
        if (willBeInLineOfFireNext(nx, ny)) score -= 10;
        if (isDeadEnd(nx, ny)) score -= 15;
        if (d === myDir) score += 2;
        if (score > bestStarScore) {
          bestStarScore = score;
          bestStarDir = d;
        }
      }
      if (bestStarDir) {
        if (facing(bestStarDir)) { me.go(); return; }
        me.turn(bestStarDir); return;
      }
    }
  }

  // v9: Escape if needed
  var escapeDir6 = getEscapeDir(star !== null);
  if (escapeDir6) {
    if (facing(escapeDir6)) { me.go(); return; }
    me.turn(escapeDir6); return;
  }

  // v9: Improved fallback - patrol toward center or open areas
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
    if (isCornered(nx, ny)) score -= 8;
    if (willBeInLineOfFire(nx, ny)) score -= 25;
    if (willBeInLineOfFireNext(nx, ny)) score -= 15;
    score += passableNeighbors(nx, ny);

    // v9: Move toward center of map when no target
    score -= manhattan(nx, ny, centerX, centerY) * 0.5;

    // v9: Move toward star if it exists (even if not primary target)
    if (star) {
      var oldStarDist = manhattan(mx, my, star[0], star[1]);
      var newStarDist = manhattan(nx, ny, star[0], star[1]);
      if (newStarDist < oldStarDist) score += 5;
    }

    if (isAtDisadvantage() && enemyTank) {
      var ex = enemyTank.position[0], ey = enemyTank.position[1];
      score += manhattan(nx, ny, ex, ey);
    }
    if (isArena && isCentralZone(nx, ny)) score -= 30;
    if (score > bestScore) { bestScore = score; bestDir = d; }
  }
  if (bestDir) {
    if (facing(bestDir)) { me.go(); return; }
    me.turn(bestDir); return;
  }
  me.turn("right");
}
