import {targetRecall, recall} from "./target-recall.js";
import {api} from './api.js';
import {ui} from './ui.js';
import {tokenTarget} from './token.js';

export var targetRecallHasSequencer = false;

Hooks.once('init', async function() { 
    const module = 'target-recall';

	game.settings.register(module, "active", {
		name: game.i18n.localize("TARGETRECALL.setting.active.label"),
		hint: game.i18n.localize("TARGETRECALL.setting.active.description"),
		scope: "client",
		config: true,
		default: true,
		type: Boolean
	});

    game.settings.register(module, "control", {
		name: game.i18n.localize("TARGETRECALL.setting.control.label"),
		hint: game.i18n.localize("TARGETRECALL.setting.control.description"),
		scope: "client",
		config: true,
		default: false,
		type: Boolean
	});

    
    game.settings.register(module, "clear", {
		name: game.i18n.localize("TARGETRECALL.setting.clear.label"),
		hint: game.i18n.localize("TARGETRECALL.setting.clear.description"),
		scope: "client",
		config: true,
		default: false,
		type: Boolean
	});

    game.settings.register(module, "marker", {
        name: game.i18n.localize("TARGETRECALL.setting.marker.label"),
        hint: game.i18n.localize("TARGETRECALL.setting.marker.description"),
        scope: "world",
        config: true,
        default: '',
        type: String,
        filePicker: "imagevideo"
    });

    game.settings.register(module, "marker-scale", {
        name: game.i18n.localize("TARGETRECALL.setting.marker.scale.label"),
        hint: game.i18n.localize("TARGETRECALL.setting.marker.scale.description"),
        scope: "world",
        config: true,
        default: 1.0,
        type: Number,
        range: {
            min: 0.1,
            max: 10.0,
            step: 0.1
        }
    });

    game.settings.register(module, "marker-duration", {
        name: game.i18n.localize("TARGETRECALL.setting.marker.duration.label"),
        hint: game.i18n.localize("TARGETRECALL.setting.marker.duration.description"),
        scope: "client",
        config: true,
        default: 4000,
        type: Number,
        range: {
            min: 0,
            max: 10000,
            step: 100
        }
    });

    game.settings.register(module, "finder-duration", {
        name: game.i18n.localize("TARGETRECALL.setting.finder.duration.label"),
        hint: game.i18n.localize("TARGETRECALL.setting.finder.duration.description"),
        scope: "client",
        config: true,
        default: 4000,
        type: Number,
        range: {
            min: 0,
            max: 10000,
            step: 100
        }
    });

    game.settings.register(module, "finder-alias-suppress", {
		name: game.i18n.localize("TARGETRECALL.setting.finder.alias-suppress.label"),
		hint: game.i18n.localize("TARGETRECALL.setting.finder.alias-suppress.description"),
		scope: "world",
		config: true,
		default: false,
		type: Boolean
	});

    game.settings.register(module, "history", {
		name: game.i18n.localize("TARGETRECALL.setting.history.label"),
		hint: game.i18n.localize("TARGETRECALL.setting.history.description"),
		scope: "world",
		config: true,
        default: 5,
        type: Number,
        range: {
            min: 1,
            max: 10,
            step: 1
        }
	});

    game.settings.register(module, "keybind", {
		name: game.i18n.localize("TARGETRECALL.setting.keybind.label"),
		hint: game.i18n.localize("TARGETRECALL.setting.keybind.description"),
		scope: "world",
		config: true,
		default: true,
		type: Boolean,
		requiresReload: true
	});

    if(game.settings.get(targetRecall.ID, 'keybind')) {
        const {SHIFT, CONTROL, ALT} = KeyboardManager.MODIFIER_KEYS;
        game.keybindings.register(targetRecall.ID, targetRecall.KEYBINDS.BACK, {
            name: "Scroll Target History Backward",
            hint: "Scrolls back through user's target history for the selected combatant.",
            uneditable: [
            {
                key: "Comma",
                modifiers: [ CONTROL]
            }
            ],
            onDown: () => {
                recall.recall(true); 
            },
            onUp: () => {},
            restricted: false,
            precedence: CONST.KEYBINDING_PRECEDENCE.NORMAL
        });

        game.keybindings.register(targetRecall.ID, targetRecall.KEYBINDS.FORWARD, {
            name: "Scroll Target History Forward",
            hint: "Scrolls forward through user's target history for the selected combatant.",
            uneditable: [
            {
                key: "Period",
                modifiers: [CONTROL]
            }
            ],
            onDown: () => {
                recall.recall(false); 
            },
            onUp: () => {},
            restricted: false,
            precedence: CONST.KEYBINDING_PRECEDENCE.NORMAL
        });
    }
 });

Hooks.once('setup', async function() {
    api.register();
});

Hooks.once('ready', async function() {
    setModsAvailable();
});

/**
 * Register debug flag with developer mode's custom hook
 */
Hooks.once('devModeReady', ({ registerPackageDebugFlag }) => {
    registerPackageDebugFlag(targetRecall.ID);
});

Hooks.on('targetToken', (user, token, targeted) => {
    if(user?.isSelf && user.id && token.id) {
        targetRecall.log(false, 'Hook Target', {user: user, token: token, targeted: targeted});
        recall.target();
        ui.go(user.id)
    }
});

Hooks.on('controlToken', (token, controlled) => {
    if(controlled){
        targetRecall.log(false, 'Hook Control', {token: token, controlled: controlled});
        recall.target()
        ui.go()
    }
});

Hooks.on('updateCombat', async (combat, round, time, userId) => {
    if(!combat.started) return
    const previous = combat.combatants.find(c => c.id === combat.previous.combatantId)
    if(previous?.token?.isOwner) await recall.set(combat, previous)
    if (combat.combatant?.token?.isOwner){
        const result = await recall.recall(true, combat, combat.combatant);
        if(!result) recall.clear(userId)
        if(game.settings.get(targetRecall.ID, "control")) {
            canvas.tokens.releaseAll();
            canvas.tokens.get(combat.current.tokenId).control();
        }
    }
});

Hooks.on('renderTokenHUD', (app, html, options) => {
    tokenTarget.go(html, options)
});

function setModsAvailable () {
   if (game.modules.get("sequencer")?.active) targetRecallHasSequencer = true;
}