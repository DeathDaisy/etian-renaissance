/**
 * A class which holds some constants
 */
export class targetRecall {
  static ID = 'target-recall';
  static NAME = 'targetRecall';
  
  static FLAGS = {
    TARGETRECALL: 'target-recall',
    SUPPRESS: 'suppress'
  }

  static KEYBINDS = {
    BACK: 'history-back',
    FORWARD: 'history-forward'
  }

  static TEMPLATES = {}

  static log(force, ...args) {  
    const shouldLog = force || game.modules.get('_dev-mode')?.api?.getPackageDebugValue(this.ID);

    if (shouldLog) {
      console.log(this.ID, '|', ...args);
    }
  }

}

export class recall{
  constructor(combat, combatant, userId) {
    this.combatant = combatant,
    this.combat = combat,
    this.userId = userId ?? game.user.id,
    this.targets = [[]],
    this.index = 0;

    this._initialize()
  }

  get combatants(){
    return this.combat.combatants
  }

  get currentRoundTargets(){
    return this.targets[0].filter(t => this.validTargets.includes(t));
  }

  get flag(){
    const obj = this.combatant.getFlag(targetRecall.ID, `${targetRecall.FLAGS.TARGETRECALL}.${this.userId}`)
    return {targets: obj?.targets ?? [[]], index: obj?.index ?? 0}
  }

  get hasIndexTargets(){
    return this.indexTargets?.length ? true : false
  }

  get indexMax(){
    return this.targets.length - 1
  }

  get indexTargets(){
    return this.targets[this.index] ? this.targets[this.index].filter(t => this.validTargets.includes(t)) : []
  }

  get user(){
    return game.users.get(this.userId)
  }

  get userTargets(){
    return this.user.targets.ids
  }

  get valid(){
    return (this.combat && this.combatant) ? true : false
  }

  get validTargets(){
    return this.combatants.filter(c => game.user.isGM || (!c.isDefeated && c.visible && canvas.tokens.placeables.find(p => p.id === c.token.id && p.visible))).map(c => c.token.id)
  }

  static clear(userId, checkIf = true){
    if (!(checkIf && !game.settings.get(targetRecall.ID, "clear"))) game.user.updateTokenTargets([]) //use game.user for this one
  }

  _initialize(){
    if(!this.valid){
      const token = canvas.scene.tokens.find(t => t.combatant && t.combatant.combat?.current?.combatantId === t.combatant.id && (t.isOwner || game.user.isGM))
      if(token){
        this.combat = token.combatant.combat;
        this.combatant = token.combatant;
      }
    }
    if(this.valid) this._load()
  }

  _load(){
    if (this.flag) mergeObject(this, this.flag, {insertKeys: false, enforceTypes: true}) 
  }

  async _next(){
    let result = false;
    if(this.hasIndexTargets && !this.combatant.token.getFlag(targetRecall.ID, targetRecall.FLAGS.SUPPRESS + `.${this.userId}`)){
      this.user.updateTokenTargets(this.indexTargets);
      this._setTargetsToUserTargets();
      result = true
    } 
    await this._save();
    targetRecall.log(false, 'next', {recall: this, result: result});
    return result
  }

  static async recall(past = false, combat = '', combatant = ''){
    if(!game.settings.get(targetRecall.ID, 'active')) return false
    const tr = new recall(combat, combatant)
    const result = await tr._recall(past)
    return result
  }

  async _recall(past = true){
    if(!this.valid) return
    if (!this.targets.length) return false
    if (this.index <= 1){
      past ? this.index++ : this.index = this.indexMax
    } else if (this.index===this.indexMax)  {
      past ? this.index =  1 : this.index--
    } else {
      past ? this.index++: this.index--
    }
    const result = await this._next();
    targetRecall.log(false, 'recall', this);
    return result
  }

  async _save() {
    await this.combatant.setFlag(targetRecall.ID, targetRecall.FLAGS.TARGETRECALL, {[this.userId]: {targets: this.targets, index: this.index}})
  }  
  
  static async set(combat, combatantId){
    const tr = new recall(combat, combatantId)
    await tr._set();
  }

  async _set(){
    if(!this.valid) return
    if(this.currentRoundTargets.length){
      if (this.targets.length > game.settings.get(targetRecall.ID, 'history')) this.targets.pop()
      this.targets.unshift([]);
    }
    this.index = 0;
    await this._save();
    targetRecall.log(false, 'set', this)
  }

  _setTargetsToUserTargets(){
    this.targets.splice(0, 1, this.userTargets)
  }

  static async target(){
    const tr = new recall()
    await tr._target();
  }

  async _target() {
    if(!this.valid) return
    this._setTargetsToUserTargets();
    await this._save();
    targetRecall.log(false, 'target', this);
  }

}
