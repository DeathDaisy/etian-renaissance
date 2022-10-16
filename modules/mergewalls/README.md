### Description
- A module to reduce the number of walls in your map by merging those that have common points and are in the same line. When loaded a recycle icon is added to the walls button list, which when pressed will merge walls. It can take some time for complex maps - so be patient and wait for the UI notification that it has finished.
- It resepects wall type/direction and will only merge walls of the same type.
- The module does not make much difference on hand drawn wall sets but on some downloaded map sets, e.g. from Roll20 or DunGen can reduce the number of walls by 30%.
- There are two configuration parameters, angleToMerge, which is the largest angle on incidence for which walls will be considered to be aligned. Typical values are 5 degrees, agressive is 20, for maps with no curved lines you can go higher, but this is likely to remove some walls you really wanted. You can run the module with increasing angles to see what happens.
- The second segment length, is the largest segment size to cull. All segments of that size or smaller are removed. Walls that shared an endpoint with the deleted wall have that end point moved to the centre of the deleted segement. This works well for deleting itty bitty walls that join other, but not so well for itty bitty walls placed to block vision. The default value is 1 pixel
- Always works on the viewed scene.

v0.8.3 Added compatibility with the "levels" module and walls with height.  
v0.8.1 Update module.json (thanks for those who pointed out the error).  
v0.8.0 Foundry 0.8.6 compatibility  

v0.0.12 Added some configuration options.
Merge Doors: If true doors will be merged in the "in the same line" test. You probably don't want this set, since it will convert all your double doors to wider single doors.
Scale Percentage: You can set the percentage to scale walls on mouse wheel. Shift-wheel will scale at the given percentage and and ctrl-wheel at one tenth of that, so a setting of 5 will scale the walls up/down by 5% on shfit-wheel and 0.5% on ctrl-wheel. Suitable values are 1, 5 or 10. Bigger than that is possibly too brave.
v0.0.8 Add the ability to cull short walls. Set the maximum wall length to cull in the config setting. 10 pixels seems like a good value to try. 
v0.0.7 Adds the ability to scale walls.
Select a group of walls and use the mouse wheel with shift/Ctl to scale the selected walls. Shift scales faster than control. Probably not great for vast wall re-scaling, but useful for a set of walls that is "off by a bit".
### Notes
When first using the module back up your world before trying it out to see if it works for you. Ths modules will make permanent changes to your world so backing up is important.

### Install
To install the module, follow these instructions:
1. From foundry select install module from the Add-on modules tab of the setup screen.
1. Paste the url for the module.json https://gitlab.com/tposney/mergewalls/raw/master/module.json into the manifest UIRL field and press install.

OR do a direct download of the module:

1. [Download the zip]https://gitlab.com/tposney/mergewalls/raw/master/mergewalls.zip file included in the module directory.
2. Extract the included folder to `Data/modules` in your Foundry Virtual Tabletop data folder.
3. Restart Foundry Virtual Tabletop.  

### Using
As well as the button on the walls menu you can call it from the console

From the developere console:
```await MergeWalls().filter(game.scenes.entities.find(s=>s.name ==="Scene Name"), 5)```
or
```game.scenes.entities.forEach(s => {
    console.log(s.name);
    console.log(`before cleanup there are ${s.data.walls.length} walls`, 5);
    console.log(`after cleanup there are ${await MergeWalls().filter(s)} walls`);
})```

You can pass the angle to use for merging on the console

The numeric parameter sets the maximum difference in degrees between two segments for them to be considered in the same line.

### Bugs

