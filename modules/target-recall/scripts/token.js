import {targetRecall} from "./target-recall.js";
export class tokenTarget {
    constructor(tokenId, html) {
      this.tokenId = tokenId,
      this.html = html
    }

    get action(){
        return this.html.find('div[data-action=target]')
    }

    get class(){
        return 'no-target-recall'
    }

    get escape(){
        return (!game.settings.get(targetRecall.ID, 'active') || !this.html || !this.tokenId || !this.token) ? true : false
    }

    get flag(){
        return this.token.getFlag(targetRecall.ID, `${this.flagPath}.${this.userId}`) 
    }

    get flagData(){
        return {[this.userId]: true} 
    }

    get flagPath(){
        return targetRecall.FLAGS.SUPPRESS
    }

    get token(){
        return canvas.scene.getEmbeddedDocument('Token', this.tokenId)
    }

    get userId(){
        return game.userId
    }

    async _add(){
        await this.token.setFlag(targetRecall.ID, this.flagPath, this.flagData);
        this._setClass()
    }

    _clearClass(){
        this.action.removeClass(this.class)
    }
  
    static async go(html, options){
        const token = new tokenTarget(options?._id, html)
        await token._record() 
    } 

    async _record(){
        if(this.escape) return
        this._loadClass()
        const data = this
        this.action.mousedown(function(event) {
            if(event.which === 3 && data.tokenId){
                data.tokenRecall()
            }
        })
    } 

    async _remove(){
        await this.token.update({[`flags.${targetRecall.ID}.${this.flagPath}.-=${this.userId}`]: null})
        this._clearClass()
    }

    _loadClass(){
        this.flag ? this._setClass() : this._clearClass()
    }

    _setClass(){
        this.action.addClass(this.class)
    }

    async tokenRecall() {
        if(this.token) !this.flag ? await this._add() : await this._remove()            
    }
}