import { targetRecallHasSequencer} from './index.js';
import {targetRecall} from "./target-recall.js";
import {wait, getDistance} from './helpers.js';
const govrnr = {}
export class ui{
    constructor(userId = game.userId){
        this.userId = userId,
        this.id = foundry.utils.randomID(16)
    }

    get controlled(){
        return canvas.tokens.controlled?.[0]
    }

    get govrnVal(){
        return govrnr[this.userId][this.controlled.id]
    }

    get marker(){
        return game.settings.get(targetRecall.ID, 'marker');
    }

    get markerDuration(){
        return game.settings.get(targetRecall.ID, 'marker-duration')
    }

    get origin(){
        return 'target_recall_token_marker'
    }

    get showMarker(){
        return (targetRecallHasSequencer && this.marker && this.markerDuration) ? true : false
    }

    get targets(){
        return canvas.tokens.placeables.filter(t => this.userTargets.includes(t.id) && (this.user.isGM || t.visible))
    }

    get user(){
      return game.users.get(this.userId)
    }
  
    get userTargets(){
      return this.user.targets.ids
    }

    static async go(userId){
        const vis = new ui(userId)
        await vis._ui()
    }
    
    async _checkTargetGoverner(){
        return (this.id === this.govrnVal) ?  true : false
    }

    async _ui(){
        if(this.targets.length && this.controlled){
            this._setTargetGoverner();
            await wait(350);
            if(!await this._checkTargetGoverner()) return targetRecall.log(false, 'ui bypassed', {this: this, gov: this.govrnVal, match: this._checkTargetGoverner()});
            targetRecall.log(false, 'ui', this);
            await this._targetsNotify()
            await this._markTargets()
        } 
      }
    
    async _markTargets(){
        if(!this.showMarker) return
        await Sequencer.EffectManager.endEffects({origin: this.origin})
        let s = new Sequence()
        for (const token of this.targets) { 
            if(token) {
                s = s.effect()
                    .file(this.marker)
                    .scale((game.settings.get(targetRecall.ID, 'marker-scale') * Math.max(token.document.height, token.document.width)))
                    .opacity(.6)
                    .origin(this.origin)
                    .duration(this.markerDuration)
                    .fadeOut(this.markerDuration*.15, {ease: "linear", delay: 0})
                    .attachTo(token, {bindVisibility:true})
                    .elevation(token.document.elevation ?? 0)
                    .forUsers([this.userId])
            }
        }
        s.play()
    }

    _setTargetGoverner(){
        govrnr[this.userId] = {[this.controlled.id]: this.id};
    }
    
    async _targetsNotify(){
        let innerHtml = `<li><img src="${this.controlled.document.texture.src}"><span class="tr-crrt-alias">Distance from ${this.controlled.name}:</span></li>`; 
        const dim = canvas.scene.grid.units;
        for(const token of this.targets){
            const alias = (game.settings.get(targetRecall.ID, 'finder-alias-suppress') && !game.user.isGM) ? '' : token.name ;
            innerHtml += `<li><img src="${token.document.texture.src}"><span class="tr-ntfy-alias">${alias}</span><span class="tr-ntfy-dist">${getDistance(this.controlled, token)}${canvas.scene.grid.units}</span></li>`;
        }
        window.targetRecall.targetDistance(`<ol>${innerHtml}</ol>`);
    }
}


