function flipControlledTokens(){const e=canvas.tokens?.controlled.map((e=>({_id:e.document.id,"flags.hex-size-support.alternateOrientation":!e.document.getFlag("hex-size-support","alternateOrientation")})));canvas.scene?.updateEmbeddedDocuments("Token",e)}const e={5:[[0,7/16],[.1,6/16],[.1,.25],[.2,3/16],[.2,1/16],[.3,0],[.4,1/16],[.5,0],[.6,1/16],[.7,0],[.8,1/16],[.8,3/16],[.9,.25],[.9,6/16],[1,7/16],[1,9/16],[.9,.625],[.9,.75],[.8,13/16],[.8,15/16],[.7,1],[.6,15/16],[.5,1],[.4,15/16],[.3,1],[.2,15/16],[.2,13/16],[.1,.75],[.1,.625],[0,9/16]]},t={5:[[7/16,0],[6/16,.1],[.25,.1],[3/16,.2],[1/16,.2],[0,.3],[1/16,.4],[0,.5],[1/16,.6],[0,.7],[1/16,.8],[3/16,.8],[.25,.9],[6/16,.9],[7/16,1],[9/16,1],[.625,.9],[.75,.9],[13/16,.8],[15/16,.8],[1,.7],[15/16,.6],[1,.5],[15/16,.4],[1,.3],[15/16,.2],[13/16,.2],[.75,.1],[.625,.1],[9/16,0]]};function isAltOrientation(e){return!!(game.settings.get("hex-size-support","altOrientationDefault")^(e.document.getFlag("hex-size-support","alternateOrientation")??!1))}class HSSHexagonalGrid extends HexagonalGrid{getAltBorderPolygon(e,t,o){const i=(this.columnar?this.constructor.FLAT_HEX_BORDERS[e]:this.constructor.POINTY_HEX_BORDERS[e])?.map((e=>[1-e[0],1-e[1]]));if(e!==t||!i)return null;const n=o/2,s=o/4;return({width:e,height:t}=this.getRect(e,t)),this.getPolygon(-s,-s,e+n,t+n,i)}_adjustSnapForTokenSize(e,t,o){if(o.document.height!==o.document.width)return super._adjustSnapForTokenSize(e,t,o);const i=isAltOrientation(o)?1:0,n=o.document.width===o.document.height?o.document.width:void 0;if(n<=1)return super._adjustSnapForTokenSize(e,t,o);const s=Math.floor((n+i-1)/2)%2;return this.columnar?t-=s*this.h/2:e-=s*this.w/2,[e,t]}_adjustPositionForTokenSize(e,t,o){const i=o.document.height===o.document.width?o.document.width:void 0;if(i){const n=isAltOrientation(o)?1:0,s=Math.floor((i+n-1)/2)%2;this.columnar&&(e+=s),this.columnar||(t+=s)}return[e,t]}getSnappedPosition(e,t,o=1,{token:i}={}){if(!i)return super.getSnappedPosition(e,t,o,{token:i});const n=isAltOrientation(i)?1:0,s=i.document.width===i.document.height?i.document.width:void 0;if(void 0===s||s<=1)return super.getSnappedPosition(e,t,o,{token:i});const r=Math.floor((s+n-1)/2)%2;this.columnar?t+=r*this.h/2:e+=r*this.w/2;const[a,l]=this._getGridPositionFromPixels(e,t,"round");let[p,d]=this.getPixelsFromGridPosition(a,l);return[p,d]=this._adjustSnapForTokenSize(p,d,i),{x:p,y:d}}}Hooks.once("init",(()=>{console.log("hex-size-support | Initializing module"),function registerSettings(){const canvasRedraw=()=>{canvas.ready&&canvas.draw()};game.settings.register("hex-size-support","alwaysShowBorder",{name:"hex-size-support.settings.alwaysShowBorder.name",hint:"hex-size-support.settings.alwaysShowBorder.hint",scope:"world",type:Boolean,config:!0,default:!1,onChange:canvasRedraw}),game.settings.register("hex-size-support","altOrientationDefault",{name:"hex-size-support.settings.altOrientationDefault.name",hint:"hex-size-support.settings.altOrientationDefault.hint",scope:"world",type:Boolean,config:!0,default:!1,onChange:canvasRedraw}),game.settings.register("hex-size-support","borderWidth",{name:"hex-size-support.settings.borderWidth.name",hint:"hex-size-support.settings.borderWidth.hint",scope:"world",type:Number,config:!0,default:2,range:{min:1,max:20,step:1},onChange:e=>{CONFIG.Canvas.objectBorderThickness=e,canvasRedraw()}}),CONFIG.Canvas.objectBorderThickness=game.settings.get("hex-size-support","borderWidth"),game.settings.register("hex-size-support","borderBehindToken",{name:"hex-size-support.settings.borderBehindToken.name",hint:"hex-size-support.settings.borderBehindToken.hint",scope:"world",type:Boolean,config:!0,default:!0,onChange:canvasRedraw}),game.settings.register("hex-size-support","fillBorder",{name:"hex-size-support.settings.fillBorder.name",hint:"hex-size-support.settings.fillBorder.hint",scope:"world",type:Boolean,config:!0,default:!1,onChange:canvasRedraw}),game.settings.register("hex-size-support","controlledColor",{name:"hex-size-support.settings.controlledColor.name",scope:"client",type:String,default:"#FF9829",config:!0,onChange:e=>{CONFIG.Canvas.dispositionColors.CONTROLLED=parseInt(e.substr(1),16),canvasRedraw()}}),CONFIG.Canvas.dispositionColors.CONTROLLED=parseInt(game.settings.get("hex-size-support","controlledColor").substr(1),16),game.settings.register("hex-size-support","partyColor",{name:"hex-size-support.settings.partyColor.name",scope:"client",type:String,default:"#0A7AB2",config:!0,onChange:e=>{CONFIG.Canvas.dispositionColors.PARTY=parseInt(e.substr(1),16),canvasRedraw()}}),CONFIG.Canvas.dispositionColors.PARTY=parseInt(game.settings.get("hex-size-support","partyColor").substr(1),16),game.settings.register("hex-size-support","friendlyColor",{name:"hex-size-support.settings.friendlyColor.name",scope:"client",type:String,default:"#0A7AB2",config:!0,onChange:e=>{CONFIG.Canvas.dispositionColors.FRIENDLY=parseInt(e.substr(1),16),canvasRedraw()}}),CONFIG.Canvas.dispositionColors.FRIENDLY=parseInt(game.settings.get("hex-size-support","friendlyColor").substr(1),16),game.settings.register("hex-size-support","neutralColor",{name:"hex-size-support.settings.neutralColor.name",scope:"client",type:String,default:"#F1D836",config:!0,onChange:e=>{CONFIG.Canvas.dispositionColors.NEUTRAL=parseInt(e.substr(1),16),canvasRedraw()}}),CONFIG.Canvas.dispositionColors.NEUTRAL=parseInt(game.settings.get("hex-size-support","neutralColor").substr(1),16),game.settings.register("hex-size-support","hostileColor",{name:"hex-size-support.settings.hostileColor.name",scope:"client",type:String,default:"#E72124",config:!0,onChange:e=>{CONFIG.Canvas.dispositionColors.HOSTILE=parseInt(e.substr(1),16),canvasRedraw()}}),CONFIG.Canvas.dispositionColors.HOSTILE=parseInt(game.settings.get("hex-size-support","hostileColor").substr(1),16),game.keybindings.register("hex-size-support","swapOrientation",{name:"hex-size-support.keybinds.swapOrientation.name",hint:"hex-size-support.keybinds.swapOrientation.hint",onDown:flipControlledTokens,editable:[],precedence:CONST.KEYBINDING_PRECEDENCE.NORMAL})}(),function extendHexBorders(){const o=foundry.utils.deepClone(HexagonalGrid.POINTY_HEX_BORDERS),i=foundry.utils.deepClone(HexagonalGrid.FLAT_HEX_BORDERS);o[2]=o[2].map((e=>[e[0],1-e[1]])),i[2]=i[2].map((e=>[1-e[0],e[1]])),HexagonalGrid.POINTY_HEX_BORDERS={...o,...e},HexagonalGrid.FLAT_HEX_BORDERS={...i,...t}}()})),Hooks.once("libWrapper.Ready",(()=>{!function registerBorderWrappers(){libWrapper.register("hex-size-support","Token.prototype._refreshBorder",(function(){const e=game.settings.get("hex-size-support","alwaysShowBorder"),t=game.settings.get("hex-size-support","fillBorder"),o={};if(e&&(o.hover=!0),this.border.clear(),!this.isVisible)return;const i=this._getBorderColor(o);if(null==i)return;const n=CONFIG.Canvas.objectBorderThickness;if(this.border.position.set(this.document.x,this.document.y),canvas.grid.isHex){const e=isAltOrientation(this)?canvas.grid.grid.getAltBorderPolygon(this.document.width,this.document.height,n):canvas.grid.grid.getBorderPolygon(this.document.width,this.document.height,n);if(e)return this.border.lineStyle(n,0,.8).drawPolygon(e),this.border.lineStyle(n/2,i,1).drawPolygon(e),void(t&&this.border.beginFill(i,.3).drawPolygon(e))}else if(canvas.grid.type===CONST.GRID_TYPES.GRIDLESS&&this.document.width===this.document.height)return this.border.lineStyle(n,0,.8).drawCircle(this.w/2,this.h/2,this.w/2),this.border.lineStyle(n/2,i,1).drawCircle(this.w/2,this.h/2,this.w/2),void(t&&this.border.beginFill(i,.3).drawCircle(this.w/2,this.h/2,this.w/2));const s=Math.round(n/2),r=Math.round(s/2);this.border.lineStyle(n,0,.8).drawRoundedRect(-r,-r,this.w+s,this.h+s,3),this.border.lineStyle(s,i,1).drawRoundedRect(-r,-r,this.w+s,this.h+s,3),t&&this.border.beginFill(i,.3).drawRoundedRect(0,0,this.w,this.h,3)}),"OVERRIDE")}(),function registerGridWrapper(){libWrapper.register("hex-size-support","BaseGrid.implementationFor",(function(e,t){const o=CONST.GRID_TYPES;return[o.HEXEVENR,o.HEXODDR,o.HEXEVENQ,o.HEXODDQ].includes(t)?HSSHexagonalGrid:e(t)}),"MIXED")}()})),Hooks.on("drawToken",(function hitAreaDraw(e){if(canvas?.grid.isHex){const t=isAltOrientation(e)?canvas.grid.grid.getAltBorderPolygon(e.document.width,e.document.height,0):canvas.grid.grid.getBorderPolygon(e.document.width,e.document.height,0);t&&(e.hitArea=new PIXI.Polygon(t))}else canvas.grid.type===CONST.GRID_TYPES.GRIDLESS&&e.document.width===e.document.height&&(e.hitArea=new PIXI.Circle(e.w/2,e.h/2,e.w/2))})),Hooks.on("updateToken",(function hitAreaUpdate(e,t){if(["width","height","texture.scaleX","texture.scaleY"].some((e=>Object.hasOwn(t,e)))||null!=foundry.utils.getProperty(t,"flags.hex-size-support.alternateOrientation"))if(canvas?.grid.isHex){const t=isAltOrientation(e.object)?canvas.grid.grid.getAltBorderPolygon(e.width,e.height,0):canvas.grid.grid.getBorderPolygon(e.width,e.height,0);t&&(e.object.hitArea=new PIXI.Polygon(t))}else canvas.grid.type===CONST.GRID_TYPES.GRIDLESS&&e.width===e.height&&(e.object.hitArea=new PIXI.Circle(e.object.w/2,e.object.h/2,e.object.w/2))})),Hooks.on("refreshToken",(function pivotToken(e){const t=e.document.getFlag("hex-size-support","pivotx"),o=e.document.getFlag("hex-size-support","pivoty");e.mesh.pivot.x=t??0,e.mesh.pivot.y=o??0})),Hooks.on("renderSettingsConfig",(function renderSettingsConfig(e,t){let o=game.settings.get("hex-size-support","neutralColor"),i=game.settings.get("hex-size-support","friendlyColor"),n=game.settings.get("hex-size-support","hostileColor"),s=game.settings.get("hex-size-support","partyColor"),r=game.settings.get("hex-size-support","controlledColor");t.find('[name="hex-size-support.controlledColor"]').parent().append(`<input type="color"value="${r}" data-edit="hex-size-support.controlledColor">`),t.find('[name="hex-size-support.partyColor"]').parent().append(`<input type="color" value="${s}" data-edit="hex-size-support.partyColor">`),t.find('[name="hex-size-support.friendlyColor"]').parent().append(`<input type="color" value="${i}" data-edit="hex-size-support.friendlyColor">`),t.find('[name="hex-size-support.neutralColor"]').parent().append(`<input type="color" value="${o}" data-edit="hex-size-support.neutralColor">`),t.find('[name="hex-size-support.hostileColor"]').parent().append(`<input type="color" value="${n}" data-edit="hex-size-support.hostileColor">`)})),Hooks.on("canvasReady",(function moveBorderLayer(){if(game.settings.get("hex-size-support","borderBehindToken"))return;const e=canvas.grid.borders;canvas.grid.removeChild(e),canvas.tokens.addChild(e)})),Hooks.on("renderTokenConfig",(function extendTokenConfig(e,t){t.find("[name=width]").closest(".form-group").after(`\n\t<div class="form-group slim">\n\t\t<label>${game.i18n.localize("hex-size-support.tokenConfig.artpivot.label")}</label>\n\t\t<div class="form-fields">\n\t\t\t<label>X</label>\n\t\t\t<input type="number" step="1" name="flags.hex-size-support.pivotx" placeholder="px" \t\t\t\tvalue="${e.object.getFlag("hex-size-support","pivotx")}">\n\t\t\t<label>Y</label>\n\t\t\t<input type="number" step="1" name="flags.hex-size-support.pivoty" placeholder="px" \t\t\t\tvalue="${e.object.getFlag("hex-size-support","pivoty")}">\n\t\t</div>\n\t</div>\n\t`),t.find("[name=mirrorX]").closest(".form-group").after(`\n\t<div class="form-group slim">\n\t\t<label>${game.i18n.localize("hex-size-support.tokenConfig.altOrientation.label")}</label>\n\t\t<div class="form-fields">\n\t\t\t<input type="checkbox" step="1" name="flags.hex-size-support.alternateOrientation" ${e.object.getFlag("hex-size-support","alternateOrientation")?"checked":""}>\n\t\t</div>\n\t</div>\n\t`),e.setPosition()}));
//# sourceMappingURL=hss.js.map
