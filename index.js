var currentlyWaving = false;
var robot = document.querySelector('.robot');
var leftArm = document.querySelector('.left-arm');
var animationEvent = whichAnimationEvent(robot);
var es = new EventSource("/sse");

es.onmessage = function (event) {
  console.log(event.data);
};

robot.onclick = function(){
    if (!currentlyWaving) {
        robot.className += ' message';
        currentlyWaving = true;
    }            
}

animationEvent && leftArm.addEventListener(animationEvent, function() {
    robot.className = 'robot';
    currentlyWaving = false;
    console.log('Stop waving');
});

function whichAnimationEvent(el){
    var animations = {
        "animation"      : "animationend",
        "OAnimation"     : "oAnimationEnd",
        "MozAnimation"   : "animationend",
        "WebkitAnimation": "webkitAnimationEnd"
    }

    for(var animation in animations){
        if( el.style[animation] !== undefined ){
            return animations[animation];
        }
    }
}