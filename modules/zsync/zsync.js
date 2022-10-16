// Hook into controlToken
// send a socket request to bring the controlled token to the top on everyone's client.
// Socket request should contain: the relevant scene (game.scenes.viewed.id)
// The token ID (token.id)
// That's it.
// On receiving a socket, set the zIndex of every token but the one that was just selected to 0
// Set the zIndex of the token that was just selected to 1.

Hooks.on('controlToken', (token, result) => {
    if (result === true){
        let token_id = token.id;
        let scene_id = game.scenes.viewed.id;
        let data = {"token_id":token_id, "scene_id":scene_id, "sort":token.document.sort, "elevation":token.document.elevation}
        game.socket.emit("module.zsync", data);
    }
})

Hooks.once('ready', async function () {
            game.socket.on("module.zsync", data => {
            let token_id = data.token_id;
            let scene_id = data.scene_id;

            if (game.scenes.viewed.id == scene_id){
                canvas.tokens.placeables.forEach(token=>{
                    if (token.id==token_id){
                        token.document.sort = data.sort;
                    } else {
                        if (token.document.elevation == data.elevation) {
                            if (data.sort == 1) token.document.sort = 0;
                        }
                    }
                })
            }
        })
});

