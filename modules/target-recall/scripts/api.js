import { targetRecall } from "./target-recall.js";

export class api {
  
  static register() {
      api.set();
  }
  
  static settings() {

  }

  static set() {
    $("#target-recall-targets-window").remove();
    $("body").append($('<div>').attr('id','target-recall-targets-window'));

    window[targetRecall.NAME] = {
        targetDistance : api._targetDistance
    }

    game.modules.get(targetRecall.ID).api = {
    }
  }

  static async _targetDistance(list){
    const dur = game.settings.get(targetRecall.ID, 'finder-duration');
    if(!dur) return
    const innerHtml = $('<div>').addClass('app').append(list)
    $("#target-recall-targets-window").html(innerHtml);
    $(innerHtml).fadeIn(200);
    
    setTimeout(() => {
        $(innerHtml).fadeOut(800, () => {
        $(innerHtml).remove();
        });
    }, dur);
  }
}

