class VGMusicConfig extends FormApplication {
  constructor(object, options) {
    super(object || game.settings.get("vgmusic", "defaultMusic"), options);

    if (this.object.apps != null) this.object.apps[this.appId] = this;
  }

  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      title: game.i18n.localize("VGMusic.SceneMusic"),
      classes: ["scene-music"],
      width: 480,
      height: 360,
      template: "modules/vgmusic/templates/apps/music-config.hbs",
      closeOnSubmit: false,
      submitOnClose: true,
      submitOnChange: true,
      resizable: true,
      dragDrop: [{ dropSelector: ".playlist" }],
    });
  }

  get updateDataPrefix() {
    if (this.isDocument) return "flags.vgmusic";
    return "data.vgmusic";
  }

  get isDocument() {
    return this.object instanceof foundry.abstract.Document;
  }

  get data() {
    return getProperty(this.object, this.updateDataPrefix);
  }

  async updateObject(data) {
    // Turn update data follow a valid schema for the object
    data = Object.entries(data).reduce((cur, o) => {
      const key = `${this.updateDataPrefix}.${o[0]}`;
      cur[key] = o[1];

      return cur;
    }, {});

    // Handle Document
    if (this.isDocument) return this.object.update(data);

    // Handle config
    if (this.object.documentName === "DefaultMusic") {
      const prevData = game.settings.get("vgmusic", "defaultMusic");
      const updateData = foundry.utils.mergeObject(prevData, foundry.utils.expandObject(data), {
        inplace: false,
        performDeletions: true,
      });

      await game.settings.set("vgmusic", "defaultMusic", updateData);
      this.object = game.settings.get("vgmusic", "defaultMusic");
      return this.render();
    }
  }

  async _onDrop(event) {
    event.preventDefault();
    const section = event.currentTarget.dataset.section;

    const data = JSON.parse(event.dataTransfer.getData("text/plain"));
    if (!["Playlist", "PlaylistSound"].includes(data.type)) return;
    if (!data.uuid) return;

    const document = await fromUuid(data.uuid);
    let playlist, sound;
    if (document instanceof PlaylistSound) {
      playlist = document.parent;
      sound = document;
    } else {
      playlist = document;
    }

    const sectionConfig = CONFIG.VGMusic.playlistSections[this.object.documentName][section];
    const prio = sectionConfig.priority;

    const prevData = getProperty(this.data, `music.${section}`);
    const prefix = `music.${section}`;
    const updateData = {
      [`${prefix}.playlist`]: playlist.id,
      [`${prefix}.initialTrack`]: sound ? sound.id : "",
    };
    if (prevData?.priority == null) updateData[`${prefix}.priority`] = prio;

    await this.updateObject(updateData);
  }

  async getData() {
    const data = await super.getData();

    // Add playlist sections
    const sections = CONFIG.VGMusic.playlistSections[this.object.documentName];
    data.playlists = Object.entries(sections).map((o) => {
      const [k, v] = o;
      const playlist = game.playlists.get(getProperty(this.data, `music.${k}.playlist`));
      const tracks = (playlist?.playbackOrder ?? []).map((id) => {
        const track = playlist.sounds.get(id);
        return {
          id,
          name: track.name,
        };
      });

      return {
        key: k,
        label: game.i18n.localize(v.label),
        playlist,
        tracks,
        data: getProperty(this.data, `music.${k}`),
        allowPriority: true,
      };
    });

    return data;
  }

  activateListeners(html) {
    super.activateListeners(html);

    html.find(".playlist .control .delete").on("click", this._onDeletePlaylist.bind(this));
    html.find(`*[data-action="open-playlist"]`).on("click", this._onOpenPlaylist.bind(this));
  }

  async _onDeletePlaylist(event) {
    event.preventDefault();
    const section = event.currentTarget.closest(".playlist").dataset.section;
    await this.updateObject({ [`music.-=${section}`]: null });
  }

  _onOpenPlaylist(event) {
    event.preventDefault();

    const playlistId = event.currentTarget.closest(".playlist").dataset.itemId;
    const playlist = game.playlists.get(playlistId);
    if (playlist) playlist.sheet.render(true);
  }

  async close(...args) {
    if (this.object.apps != null) delete this.object.apps[this.appId];

    vgmusic.utils.MusicController.playCurrentTrack();
    return super.close(...args);
  }

  async _updateObject(event, formData) {
    event.preventDefault();

    await this.updateObject(formData);
  }
}

var applications = /*#__PURE__*/Object.freeze({
  __proto__: null,
  VGMusicConfig: VGMusicConfig
});

function registerSettings() {
  const modName = "vgmusic";

  /**
   * Silent Combat Music
   */
  game.settings.register(modName, "silentCombatMusicMode", {
    name: "VGMusic.SETTINGS.SilentCombatMusicMode.Name",
    hint: "VGMusic.SETTINGS.SilentCombatMusicMode.Hint",
    scope: "world",
    config: true,
    type: String,
    choices: {
      highestPriority: game.i18n.localize("VGMusic.SETTINGS.SilentCombatMusicMode.Options.highestPriority"),
      lastActor: game.i18n.localize("VGMusic.SETTINGS.SilentCombatMusicMode.Options.lastActor"),
      area: game.i18n.localize("VGMusic.SETTINGS.SilentCombatMusicMode.Options.area"),
      generic: game.i18n.localize("VGMusic.SETTINGS.SilentCombatMusicMode.Options.generic"),
    },
    default: "highestPriority",
    onChange: () => {
      vgmusic.utils.MusicController.playCurrentTrack();
    },
  });

  /**
   * Default Combat Music
   */
  game.settings.registerMenu(modName, "defaultMusic", {
    label: "VGMusic.SETTINGS.DefaultMusic.Label",
    name: "VGMusic.SETTINGS.DefaultMusic.Name",
    hint: "VGMusic.SETTINGS.DefaultMusic.Hint",
    icon: "fas fa-music",
    type: VGMusicConfig,
    restricted: true,
  });
  game.settings.register(modName, "defaultMusic", {
    name: "VGMusic.SETTINGS.DefaultMusic.Name",
    scope: "world",
    config: false,
    type: Object,
    default: {
      documentName: "DefaultMusic",
      data: {
        vgmusic: {
          music: {},
        },
      },
    },
  });

  game.settings.register(modName, "supress.area", {
    name: "supress.area",
    scope: "world",
    config: false,
    type: Boolean,
    default: false,
    onChange: () => {
      vgmusic.utils.MusicController.playCurrentTrack();
    },
  });
  game.settings.register(modName, "supress.combat", {
    name: "supress.combat",
    scope: "world",
    config: false,
    type: Boolean,
    default: false,
    onChange: () => {
      vgmusic.utils.MusicController.playCurrentTrack();
    },
  });
}

async function preloadTemplates() {
  const templatePaths = ["modules/vgmusic/templates/apps/components/playlists.hbs"];

  return loadTemplates(templatePaths);
}

const patchActorSheet = function () {
  const clsPath = "ActorSheet";
  const cls = ActorSheet;

  /* -------------------------------------- */
  /* _getHeaderButtons
  /* -------------------------------------- */
  libWrapper.register("vgmusic", `${clsPath}.prototype._getHeaderButtons`, function (wrapped) {
    let buttons = wrapped();

    // Add music selector
    if (game.user.isGM) {
      buttons.splice(0, 0, {
        label: game.i18n.localize("VGMusic.CombatMusic"),
        class: "configure-combat-music",
        icon: "fas fa-music",
        onclick: (ev) => {
          this._onConfigureCombatMusic(ev);
        },
      });
    }

    return buttons;
  });

  /* -------------------------------------- */
  /* _onConfigureCombatMusic
  /* -------------------------------------- */
  cls.prototype._onConfigureCombatMusic = function (event) {
    event.preventDefault();
    new vgmusic.applications.VGMusicConfig(this.actor, {
      top: this.position.top + 40,
      left: this.position.left + (this.position.width - 400) / 2,
    }).render(true);
  };
};

const patchCombat = function () {
  const clsPath = "CONFIG.Combat.documentClass";

  /* -------------------------------------- */
  /* setupTurns
  /* -------------------------------------- */
  libWrapper.register("vgmusic", `${clsPath}.prototype.setupTurns`, function (wrapped, ...args) {
    const result = wrapped(...args);

    // Refresh combat music
    vgmusic.utils.MusicController.playCurrentTrack();

    return result;
  });
};

const patchSceneControls = function () {
  const clsPath = "SceneControls";

  /* -------------------------------------- */
  /* _getControlButtons
  /* -------------------------------------- */
  libWrapper.register("vgmusic", `${clsPath}.prototype._getControlButtons`, function (wrapped, ...args) {
    let result = wrapped(...args);

    {
      const tools = [
        {
          name: "supress-area-music",
          title: "VGMusic.SceneControls.SupressAreaMusic",
          icon: "fas fa-dungeon",
          toggle: true,
          active: game.settings.get("vgmusic", "supress.area"),
          onClick: (toggled) => {
            game.settings.set("vgmusic", "supress.area", toggled);
          },
        },
        {
          name: "supress-combat-music",
          title: "VGMusic.SceneControls.SupressCombatMusic",
          icon: "fas fa-fist-raised",
          toggle: true,
          active: game.settings.get("vgmusic", "supress.combat"),
          onClick: (toggled) => {
            game.settings.set("vgmusic", "supress.combat", toggled);
          },
        },
      ];

      const group = result.find((o) => o.name === "sounds");
      group.tools.push(...tools);
    }

    return result;
  });
};

var patch = /*#__PURE__*/Object.freeze({
  __proto__: null,
  patchActorSheet: patchActorSheet,
  patchCombat: patchCombat,
  patchSceneControls: patchSceneControls
});

const getFirstAvailableGM = function () {
  return (game.users
    .filter((o) => o.isGM && o.active)
    .sort((a, b) => {
      return a.id - b.id;
    }) || null)[0];
};

const isHeadGM = function () {
  return game.user === getFirstAvailableGM();
};

const MusicController = {
  context: null,
  _fadingTracks: [],

  get currentCombat() {
    return game.combats.find((o) => o.scene === this.currentScene);
  },
  get currentScene() {
    return game.scenes.find((o) => o.active);
  },

  get track() {
    return this.context?.track;
  },
  get currentTrackInfo() {
    if (!this.track) return {};
    return this.context?.scopeEntity?.getFlag("vgmusic", `playlist.${this.track.parent.id}.${this.track.id}`);
  },

  get documentNameSortPriority() {
    return ["Actor", "Scene", "DefaultMusic"];
  },

  getAllCurrentPlaylists() {
    let result = [];

    // Get scene area playlist
    const scene = this.currentScene;
    if (scene != null) {
      const ctx = vgmusic.utils.PlaylistContext.fromDocument(scene, "area", scene);
      if (ctx) result.push(ctx);
    }

    // Get combat playlists
    const combat = this.currentCombat;
    if (scene != null) {
      const ctx = vgmusic.utils.PlaylistContext.fromDocument(scene, "combat", combat);
      if (ctx) result.push(ctx);
    }

    // Get actor combat playlists
    if (combat != null) {
      for (const combatant of combat.combatants) {
        const ctx = vgmusic.utils.PlaylistContext.fromDocument(combatant.actor, "combat", combat);
        if (ctx) result.push(ctx);
      }
    }

    // Get default combat playlist
    if (combat != null) {
      const defaultMusicConfig = game.settings.get("vgmusic", "defaultMusic");
      if (defaultMusicConfig != null) {
        const ctx = vgmusic.utils.PlaylistContext.fromDocument(defaultMusicConfig, "combat", combat);
        if (ctx) result.push(ctx);
      }
    }

    return result;
  },

  filterPlaylists(ctx) {
    const combat = this.currentCombat;
    // Remove combat track without combat
    if (ctx.context === "combat" && !combat?.started) return false;
    // Remove combat track with combat music supressed
    if (ctx.context === "combat" && game.settings.get("vgmusic", "supress.combat") === true) return false;

    // Remove area track with area music supressed
    if (ctx.context === "area" && game.settings.get("vgmusic", "supress.area") === true) return false;

    return true;
  },

  sortPlaylists(a, b) {
    // Sort by current combatant
    const combat = this.currentCombat;
    const currentActor = combat?.combatant.actor;
    // Immediately return current combatant's playlist
    if (a.contextEntity === currentActor) return -1;
    if (b.contextEntity === currentActor) return 1;

    // Sort to make sure last actor's combat music will be playing
    const silentMode = game.settings.get("vgmusic", "silentCombatMusicMode");
    if (silentMode === "lastActor") {
      const combatants = combat.turns;
      const startIdx = combat.current.turn;
      if (startIdx >= 0 && combatants.length > 0) {
        let i = startIdx;
        while (i !== (startIdx + 1) % combatants.length) {
          i--;
          if (i < 0) i += combatants.length;

          const actor = combatants[i].actor;
          if (a.contextEntity === actor) return -1;
          if (b.contextEntity === actor) return 1;
        }
      }
    } else if (silentMode === "area") {
      if (a.contextEntity.documentName !== "Actor" && a.context === "area") return -1;
      if (b.contextEntity.documentName !== "Actor" && b.context === "area") return 1;
    } else if (silentMode === "generic") {
      if (a.contextEntity.documentName !== "Actor" && a.context === "combat") return -1;
      if (b.contextEntity.documentName !== "Actor" && b.context === "combat") return 1;
    }

    // Sort by priority
    if (a.priority !== b.priority) return b.priority - a.priority;
    if (a.contextEntity.documentName !== b.contextEntity.documentName) {
      const arr = this.documentNameSortPriority;
      return arr.indexOf(b.contextEntity.documentName) - arr.indexOf(a.contextEntity.documentName);
    }
    return 0;
  },

  getCurrentPlaylist() {
    const playlists = this.getAllCurrentPlaylists()
      .filter(this.filterPlaylists.bind(this))
      .sort(this.sortPlaylists.bind(this));
    if (playlists.length > 0) return playlists[0];

    return null;
  },

  async playCurrentTrack() {
    if (!vgmusic.utils.isHeadGM()) return;

    const newContext = this.getCurrentPlaylist();

    // Switch music
    await this.playMusic(newContext);
  },

  getPlaylistData(entity, playlistId, trackId) {
    const playlistData = entity.getFlag("vgmusic", `playlist.${playlistId}.${trackId}`);
    if (!playlistData) {
      return {
        id: playlistId,
        trackId,
        start: 0,
      };
    }
    return playlistData;
  },

  savePlaylistData(entity) {
    if (entity instanceof Combat && game.combats.get(entity.id) == null) return;

    const track = this.track;
    if (track == null || entity == null) return;

    if (vgmusic.utils.isHeadGM()) {
      return entity.setFlag("vgmusic", `playlist.${track.parent.id}.${track.id}`, {
        id: track.parent.id,
        trackId: track.id,
        start: (track.sound.currentTime ?? 0) % (track.sound.duration ?? 100),
      });
    }
  },

  async playMusic(playlistContext) {
    const prevTrack = this.track;
    const newTrack = playlistContext?.track;
    const fadingTrack = {
      prev: this._fadingTracks.find((o) => o.track === prevTrack) != null,
      new: this._fadingTracks.find((o) => o.track === newTrack) != null,
    };

    if (prevTrack !== newTrack && prevTrack != null) {
      await this.savePlaylistData(this.context?.scopeEntity);
      await prevTrack.update({ playing: false, pausedTime: null });
      if (prevTrack.fadeDuration > 0 && !fadingTrack.prev) {
        this._fadingTracks.push(new FadingTrack(prevTrack, prevTrack.fadeDuration));
      }
      this.context = null;
    }

    if (newTrack) {
      this.context = playlistContext;
      if (!fadingTrack.new) {
        await newTrack.update({ playing: true, pausedTime: this.currentTrackInfo?.start ?? 0 });
      }
    }
  },
};

class FadingTrack {
  constructor(track, fadeDuration) {
    this.track = track;
    this.fadeDuration = fadeDuration || 1000;

    window.setTimeout(this.delete.bind(this), this.fadeDuration + 10);
  }

  get controller() {
    return vgmusic.utils.MusicController;
  }

  delete() {
    const idx = this.controller._fadingTracks.indexOf(this);
    if (idx == null) return;
    this.controller._fadingTracks.splice(idx, 1);

    // Play fading track, if appropriate
    if (this.controller.track === this.track) {
      this.controller.playCurrentTrack();
    }
  }
}

class PlaylistContext {
  /**
   * @constructor
   * @param {string} context - The context for this descriptor. Either "area" or "combat" by default.
   * @param {object} contextEntity - A document (Actor, Scene, etc.)
   * @param {Playlist} playlist - The playlist to play for this context.
   * @param {string} trackId - The track ID to start at with this context.
   * @param {number} [priority=null] - The priority for this context. Plays higher priority contexts first.
   * @param {object} [scopeEntity] - An optional scope entity on which to save progress, such as a scene or combat.
   */
  constructor(context, contextEntity, playlist, trackId, priority = 0, scopeEntity = null) {
    this.context = context;
    this.contextEntity = contextEntity;
    this.playlist = playlist;
    this.trackId = trackId;
    this.priority = priority;
    this.scopeEntity = scopeEntity;
  }

  get track() {
    return this.playlist?.sounds.get(this.trackId);
  }

  /**
   * @param {object} document - A document (Actor, Scene, etc.) to get a playlist context from.
   * @param {string} [type="combat"] - The type of music to get. "area" and "combat" are supported by default.
   * @returns {PlaylistContext|null} The context, or null if no playlist was found.
   */
  static fromDocument(document, type = "combat", scopeEntity = null) {
    // Handle Document
    if (document instanceof foundry.abstract.Document) {
      const playlistId = document.getFlag("vgmusic", `music.${type}.playlist`);
      const playlist = playlistId ? game.playlists.get(playlistId) : null;
      if (!playlist) return null;

      const trackId = document.getFlag("vgmusic", `music.${type}.initialTrack`) || null;
      const priority = document.getFlag("vgmusic", `music.${type}.priority`) ?? 0;

      return new this(type, document, playlist, trackId, priority, scopeEntity);
    }

    // Handle something else
    else {
      if (document.documentName === "DefaultMusic") {
        const section = document.data?.vgmusic?.music?.[type];
        if (!section) return null;

        const playlistId = section.playlist;
        const playlist = playlistId ? game.playlists.get(playlistId) : null;
        if (!playlist) return null;

        const trackId = section.initialTrack || null;
        const priority = section.priority ?? 0;

        return new this(type, document, playlist, trackId, priority, scopeEntity);
      }
    }
  }
}

var utils = /*#__PURE__*/Object.freeze({
  __proto__: null,
  getFirstAvailableGM: getFirstAvailableGM,
  isHeadGM: isHeadGM,
  MusicController: MusicController,
  FadingTrack: FadingTrack,
  PlaylistContext: PlaylistContext
});

const VGMusic = {
  playlistSections: {
    // Default music playlist sections
    DefaultMusic: {
      combat: {
        label: "VGMusic.Scene.PlaylistSection.Combat",
        priority: -5,
      },
    },

    // Scene playlist sections
    Scene: {
      area: {
        label: "VGMusic.Scene.PlaylistSection.Area",
        priority: -20,
      },
      combat: {
        label: "VGMusic.Scene.PlaylistSection.Combat",
        priority: -10,
      },
    },

    // Actor playlist sections
    Actor: {
      combat: {
        label: "VGMusic.Scene.PlaylistSection.Combat",
        priority: 0,
      },
    },
  },
};

const register = () => {
  // Toggle area music
  game.keybindings.register("vgmusic", "toggleAreaMusic", {
    name: "VGMusic.CONTROLS.ToggleAreaMusic.Name",
    onDown: () => {
      game.VGMusic.controls.toggleAreaMusic();
    },
  });

  // Toggle combat music
  game.keybindings.register("vgmusic", "toggleCombatMusic", {
    name: "VGMusic.CONTROLS.ToggleCombatMusic.Name",
    onDown: () => {
      game.VGMusic.controls.toggleCombatMusic();
    },
  });
};

const toggleAreaMusic = async function () {
  const value = game.settings.get("vgmusic", "supress.area");
  await game.settings.set("vgmusic", "supress.area", !value);
  ui.controls.initialize();
};

const toggleCombatMusic = async function () {
  const value = game.settings.get("vgmusic", "supress.combat");
  await game.settings.set("vgmusic", "supress.combat", !value);
  ui.controls.initialize();
};

var controls = /*#__PURE__*/Object.freeze({
  __proto__: null,
  register: register,
  toggleAreaMusic: toggleAreaMusic,
  toggleCombatMusic: toggleCombatMusic
});

/**
 * Author: Furyspark
 * Software License: MIT
 */

globalThis.vgmusic = {
  applications,
  utils,
  config: VGMusic,
  controls,
};

// Initialize module
Hooks.once("init", async () => {
  if (typeof libWrapper !== "function") return;
  console.log("vgmusic | Initializing vgmusic");

  // Assign custom classes and constants here
  CONFIG.VGMusic = VGMusic;

  // Register custom module settings
  registerSettings();
  vgmusic.controls.register();

  // Register sockets

  // Preload Handlebars templates
  await preloadTemplates();
});

Hooks.once("setup", () => {});

// When ready
Hooks.once("ready", async () => {
  // Do anything once the module is ready
  if (typeof libWrapper !== "function") return;

  // Patch stuff
  for (const fn of Object.values(patch)) {
    fn();
  }
});

// Add any additional hooks if necessary
Hooks.on("updateCombat", (combat, updateData) => {
  // If the combat turn is changed
  if (combat.started && (updateData.turn != null || updateData.round != null)) {
    MusicController.playCurrentTrack();
  }
});

Hooks.on("deleteCombat", () => {
  MusicController.playCurrentTrack();
});

Hooks.on("renderSceneConfig", (app, html) => {
  // Disable core stuff
  const elem = html.find(`select[name="playlistSound"]`).parent();

  const elemStr =
    `<button type="button" data-action="vgmusic-scene"><i class="fas fa-music"></i>` +
    `${game.i18n.localize("VGMusic.SceneMusic")}</button>`;
  elem.after(elemStr);

  html.find(`button[data-action="vgmusic-scene"]`).on("click", (event) => {
    event.preventDefault();
    new VGMusicConfig(app.object).render(true);
  });
});

Hooks.on("canvasReady", () => {
  MusicController.playCurrentTrack();
});

Hooks.on("updateScene", async (scene, updateData) => {
  if ("active" in updateData) {
    if (updateData.active !== true) {
      await scene.unsetFlag("vgmusic", "playlist");
    }
    MusicController.playCurrentTrack();
  }
});
//# sourceMappingURL=vgmusic.js.map
