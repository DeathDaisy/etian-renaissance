/*
// clean a single map
// You can pass an optional angle differene to consider walls to have the same direction (angle applies +/- so defies an arc twice as big as the angle passed)

await MergeWalls().filterNeighbours(game.scenes.entities.find(s=>s.name ==="DunGen Map: 09014532"))
await MergeWalls().filterNeighbours(game.scenes.entities.find(s=>s.name ==="DunGen Map: 09014532"), 20)

// Sample usage: clean up all maps

game.scenes.entities.forEach(s => {
    console.log(s.name);
    console.log(`before cleanup there are ${s.data.walls.length} walls`);
    console.log(`after cleanup there are ${await MergeWalls().filterNeighbours(s)} walls`);
})
*/

MergeWalls = function () {
  let maxAngleToMerge;

	getAngle = function (c) {
		let angle = Math.atan2(c[3] - c[1], c[2] - c[0]);
		// console.log(angle);
		while (angle < 0) angle += 2 * Math.PI;
		if (angle >= Math.PI) angle = angle - Math.PI;
		return angle;
	};

	sameAngle = function (angle1, angle2) {
		let angleDiff = Math.abs(angle1 - angle2);
		Math.min(angleDiff, Math.PI - angleDiff); // angle of intersection is at most a rightangle.
		return angleDiff < maxAngleToMerge;
	};

	samePoint = function (p1, p2) {
		return seglength(p1, p2) < 0.01;
		// return (p1[0] === p2[0] && p1[1] === p2[1]);
	};
	is_on_points = function (a, b, c) {
		let diff = Math.sqrt(seglength(a, c)) + Math.sqrt(seglength(b, c)) - Math.sqrt(seglength(a, b));
		return diff * diff < 0.1;
	};

	is_on_wall = function (wall, c) {
		return is_on_points(wall.c.slice(0, 2), wall.c.slice(2), c);
	};
	const gettouchingWalls = function (target, walls) {
		// console.log(target)
		// Only count walls that are exactly the same type as us. TODO check that the direction test actually works for chains of directed walls
		let touches = walls.filter((w) => {
			/* console.log(`${w._id} ${target._id} ${w.include} ${w.door} ${target.door} ${w.sense} ${target.sense} ${w.move} ${target.move} ${w.dir} ${target.dir}`);
            console.log(is_on_wall(target, w.c.slice(0,2)));
            console.log(is_on_wall(target, w.c.slice(2,)));
            console.log(w.flags?.wallHeight?.wallHeightBottom, target.flags?.wallHeight?.wallHeightBottom, (w.flags?.wallHeight?.wallHeightBottom ?? null) === (target.flags?.wallHeight?.wallHeightBottom ?? null))
            console.log(w.flags?.wallHeight?.wallHeightTop, target.flags?.wallHeight?.wallHeightTop, (w.flags?.wallHeight?.wallHeightTop ?? null) === (target.flags?.wallHeight?.wallHeightTop ?? null))
            */
			const returnValue = (
				target._id !== w._id &&
				w.include &&
				w.door === target.door &&
				w.sense === target.sense &&
				w.move === target.move &&
				w.dir === target.dir &&
        ((w.flags?.wallHeight?.wallHeightBottom ?? null) === (target.flags?.wallHeight?.wallHeightBottom ?? null)) &&
        ((w.flags?.wallHeight?.wallHeightTop ?? null) === (target.flags?.wallHeight?.wallHeightTop ?? null)) &&
				(is_on_wall(target, w.c.slice(0, 2)) || is_on_wall(target, w.c.slice(2)))
			);
      return returnValue;
		});
		// console.log("Touches are "); console.log(touches)
		return touches;
	};
	const getWalls = (p, walls) => {
		return walls.filter((w) => {
			return (w.include && samePoint(p, w.c.slice(0, 2))) || samePoint(p, w.c.slice(2));
		});
	};
	const seglength = function (p1, p2) {
		return (p1[0] - p2[0]) * (p1[0] - p2[0]) + (p1[1] - p2[1]) * (p1[1] - p2[1]);
	};

	let wallRes = 0.05;
	replacePoints = function (walls, w, np, targetPoint) {
		walls.filter(lw => {
     return  ((w.flags?.wallHeight?.wallHeightBottom ?? null) === (lw.flags?.wallHeight?.wallHeightBottom ?? null)) &&
      ((w.flags?.wallHeight?.wallHeightTop ?? null) === (lw.flags?.wallHeight?.wallHeightTop ?? null))
    }).map((lw) => {
			if (lw._id !== w._id) {
				for (let i = 0; i < 2; i++) {
					for (let j = 0; j < 2; j++) {
						if (
							Math.abs(lw.c[0 + 2 * i] - w.c[0 + 2 * j]) < wallRes &&
							Math.abs(lw.c[1 + i * 2] - w.c[1 + j * 2]) < wallRes
						) {
							//              if (((lw.c[0 + 2 * i] === w.c[0 + 2 * j]) ) && ((lw.c[1 + i * 2] === w.c[1 + j * 2]))) {
							// let t = duplicate(lw)
							lw.c[0 + i * 2] = targetPoint.x;
							lw.c[1 + i * 2] = targetPoint.y;
							// console.log("changed ", t, seglength(lw.c.slice(0,2), lw.c.slice(2,)), lw, duplicate(w));
							//                return lw;
						}
					}
				}
			}
			return lw;
		});
		return walls;
	};

	filterShortSegements = async function (wallLength = 0) {
		let gridPrecision = canvas.walls.gridPrecision;
		if (wallLength === 0) wallLength = game.settings.get("mergewalls", "minSegLength");
		wl2 = wallLength * wallLength;
		let walls = canvas.walls.placeables.map(w=>w.data.toJSON());
    let toDelete = walls.map(wd => wd._id);
		walls.sort((a, b) => {
			return seglength(a.c.slice(0, 2), a.c.slice(2)) - seglength(b.c.slice(0, 2), b.c.slice(2));
		});
		let length = 1;
		let shortWalls = walls.filter((w) => seglength(w.c.slice(0, 2), w.c.slice(2)) <= wl2);
		// console.log("longwalls pre merge ", duplicate(longWalls))
		// console.log("Short walls are ", duplicate(shortWalls), shortWalls.map(w=>seglength(w.c.slice(0,2), w.c.slice(2,))))
		let count = 0;
		while (shortWalls.length > 0 && count < 2000) {
			count += 1;
			let ww = shortWalls[0];
			// console.log("w is ", ww, walls)
			walls = walls.slice(1);
			let mergeX = Math.floor((ww.c[0] + ww.c[2]) / 2);
			let mergeY = Math.floor((ww.c[1] + ww.c[3]) / 2);
			let point = canvas.grid.getSnappedPosition(mergeX, mergeY, gridPrecision);
			// console.log("For point ", mergeX, mergeY, "new point is ", point, duplicate(ww))
			walls = replacePoints(walls, ww, [mergeX, mergeY], point);
			walls.sort((a, b) => {
				return seglength(a.c.slice(0, 2), a.c.slice(2)) - seglength(b.c.slice(0, 2), b.c.slice(2));
			});
			shortWalls = walls.filter((w) => seglength(w.c.slice(0, 2), w.c.slice(2)) <= wl2);
			// console.log("Short walls ", shortWalls.length)
		}
		let longWalls = walls.filter((w) => seglength(w.c.slice(0, 2), w.c.slice(2)) > wl2);
		wallsLength = longWalls.length;
		await canvas.scene.deleteEmbeddedDocuments("Wall", toDelete);
    await canvas.scene.createEmbeddedDocuments("Wall", longWalls);
    
		// console.log("Longwalls ", longWalls)
		return canvas.walls.placeables.length;
	};

	filterNeighbours = async function (angleToMerge = 0) {
    let mergeDoors = game.settings.get("mergewalls", "mergeDoors");
		if (angleToMerge === 0) angleToMerge = game.settings.get("mergewalls", "angleToMerge");
		maxAngleToMerge = (angleToMerge / 180) * Math.PI;
    let count = 0;
    let newWalls;
    
		while (true) {
      count +=1;
			newWalls = [];
			let walls = canvas.walls.placeables.map(w=>w.data.toJSON());
      let toDelete = walls.map(wd => wd._id)

			walls.forEach((w) => (w.include = true));
			walls.sort((b, a) => {
				return seglength(a.c.slice(0, 2), a.c.slice(2)) - seglength(b.c.slice(0, 2), b.c.slice(2));
			});
			walls.forEach((w) => {
				if (w.include) {
					let p1 = w.c.slice(0, 2);
					let p2 = w.c.slice(2);
					let newp1 = p1;
					let newp2 = p2;
					let neighbours = gettouchingWalls(w, walls);
					let wAngle = getAngle(w.c);
					neighbours.forEach((n) => {
            // don't merge self or walls that are doors if we are ignoring doors
						if (n._id !== w._id && (w.door === CONST.WALL_DOOR_TYPES.NONE || mergeDoors)) {
							// console.log(`doing w ${w._id} and ${n._id}`)
							let nAngle = getAngle(n.c);
							// console.log(`wangle is ${wAngle} and nangle is ${nAngle}`)
							if (sameAngle(wAngle, nAngle)) {
								// 3 cases of colinear pick the point and segmet
								/* WE have 3 cases
                                                        p1-------------- p2
                                                        p1---- np ------ p2                      no change Case 1
                                                        p1---------------p2 ---------- np        p2 -> np Case 2
                                                 np---- p1 --------------p2                      p1 -> np Case 3
                                */
								let np1 = n.c.slice(0, 2);
								let np2 = n.c.slice(2);
								let cl = seglength(newp1, newp2);
								n.include = false;
								let sl1 = seglength(newp1, np2);
								let sl2 = seglength(newp2, np2);

								// consider the first endpoint on the segment to be merged
								if (cl >= sl1 && cl >= sl2) {
									// case 1 point lies inside current segment do nothing
								} else if (sl1 > sl2) {
									// case 2
									newp2 = np2;
								} else {
									// case 3
									newp1 = np2;
								}
								// consider the other endpoint of the segment to merge
								cl = seglength(newp1, newp2);
								sl1 = seglength(newp1, np1);
								sl2 = seglength(newp2, np1);
								if (cl >= sl1 && cl >= sl2) {
									// case1 point lies inside current segment do nothing
								} else if (sl1 > sl2) {
									// case 2
									newp2 = np1;
								} else {
									newp1 = np1;
								}
							}
						}
					});
					newWall = duplicate(w);
					delete newWall.include;
					newWall.c = newp1.concat(newp2);
					newWalls.push(newWall);
				}
			});
			wallsLength = toDelete.length;
      await canvas.scene.deleteEmbeddedDocuments("Wall", toDelete);
      await canvas.scene.createEmbeddedDocuments("Wall", newWalls)
			// await scene.update({ walls: newWalls });
			if (wallsLength === newWalls.length ||  count > 20) break;
		}
		return newWalls.length;
	};

	Hooks.on("renderSceneDirectory", (app, html, data) => {});

	getSceneControlButtons = function (buttons) {
		let tokenButton = buttons.find((b) => b.name == "walls");
		if (tokenButton) {
			tokenButton.tools.push({
				name: "cleanWalls",
				title: "Clean up duplicate walls",
				icon: "fas fa-recycle",
				toggle: false,
				active: true,
				visible: game.user.isGM,
				onClick: async (value) => {

					if (Object.entries(globalThis.ui.windows).filter(entry=>{return entry[1] instanceof LevelsUI}).length > 0) {
						ui.notifications.error("You must close levels UI before proceeding");
						return;
					}
					// let scene = game.scenes.get(game.user.data.scene);
					ui.notifications.info("Cleaning up - please be patient");
					let wallCount = canvas.walls.placeables.length;
					let newCount = await filterShortSegements();
					newCount = await filterNeighbours();
          ui.notifications.info(`Cleanup complete walls ${wallCount} -> ${newCount} You may need to refresh the scene`);
				}
			});
    }
	};
	return { filter: filterNeighbours, getButtons: getSceneControlButtons };
};

Hooks.on("getSceneControlButtons", (...args) => {
  MergeWalls().getButtons(...args);
  if (canvas?.walls) {
    canvas.walls.options.rotatableObjects = true;
  }
});

function _scaleCoords(wallData, scale, offset) {
	let coords = [];
	let newData = duplicate(wallData);
	for (let i = 0; i < 4; i++) {
		newData.c[i] = wallData.c[i] * scale + (i == 0 || i == 2 ? offset.x : offset.y);
	}
	return newData;
}

function _wallDist(c) {
	let d1 = c[0] ** 2 + c[1] ** 2;
	let d2 = c[2] ** 2 + c[3] ** 2;
	if (d1 < d2) return { d: d1, x: c[0], y: c[1] };
	else return { d: d2, x: c[2], y: c[3] };
}

async function onMouseWheel(wheelEvent) {
  let wallScale = 1 + (game.settings.get("mergewalls", "scalePercent") / 100);
  let smallScale = 1 + (game.settings.get("mergewalls", "scalePercent") / 100 / 10);
	// console.log("Walls layer mouse wheel event ", event);
  let scale = wheelEvent.shiftKey ? wallScale : smallScale;
	if (wheelEvent.wheelDelta < 0) scale = 1 / scale;
	// console.log("Scale is ", scale)
	const controlled = canvas.walls.controlled.map(w=>w.data.toJSON());
	let dists = controlled.map((w) => _wallDist(w.c));
	let topLeft = dists.reduce((topleft, next) => (topleft.d < next.d ? topleft : next));
	// console.log("Topleft is ", topLeft)
	const offset = { x: topLeft.x * (1 - scale), y: topLeft.y * (1 - scale) };
	// console.log("Offset is ", offset)
	// console.log("Crontolled are", controlled, controlled.map(w=>w.data.c));
	const newWallData = controlled.map(wd => _scaleCoords(wd, scale, offset));
	// console.log("Updates are", newWallData, newWallData.map(wd=>wd.c));
  await canvas.scene.updateEmbeddedDocuments("Wall", newWallData);
}

Hooks.once("ready", () => {
  WallsLayer.prototype._onMouseWheel = onMouseWheel;
	let options = {
		name: "Max Angle Degrees",
		hint: "Maximum Angle between lines to be considered in line - suggested 5-10 (20 aggressive)",
		scope: "client",
		config: true,
		default: 1,
		type: Number,
	};
	game.settings.register("mergewalls", "angleToMerge", options);
	options = {
		name: "Max Segment Length",
		hint: "All segments less than or equal to  this length will be deleted",
		scope: "client",
		config: true,
		default: 1,
		type: Number,
  };
	game.settings.register("mergewalls", "minSegLength", options);

  options = {
		name: "Merge Doors",
		hint: "Doors in the same line will be merged (you probably don't want this)",
		scope: "client",
		config: true,
		default: false,
		type: Boolean,
  };
	game.settings.register("mergewalls", "mergeDoors", options);
  
	options = {
		name: "Scale percentage",
		hint: "Percentage to scale walls on shift mousewheel, ctrl mouse wheel wil be 1/10 of that",
		scope: "client",
		config: true,
		default: 1,
    type: Number
  };
  game.settings.register("mergewalls", "scalePercent", options);
});

