export function getDistance(orig, dest){
    const t1 = new PIXI.Point(...canvas.grid.getCenter(orig.x, orig.y));
    const t2 = new PIXI.Point(...canvas.grid.getCenter(dest.x, dest.y));
    const ray = new Ray(t1, t2);
    return canvas.grid.measureDistances([{ray:ray}], {gridSpaces: true})[0];
}

export const wait = (delay) => new Promise((resolve) => setTimeout(resolve, delay));


