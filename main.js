let audio;
let debug = false;
//test
let playerControlAim = true;
let crosshairLeft = 0;
let crosshairTop = 0;

/* GAMEPLAY VARIABLES */
/* Change these to adjust how the game is actually played*/
let bossStartScore = 2;
let musicIncrease = 0.25; //was 0.1
let cooldownTime = 1200;
const CrosshairHorizIncreaseAmount = 3.5; //1.6 2.8
const CrosshairVerticalIncreaseAmount = 2; //1
/*END GAMEPLAY VARIABLES */

const CannonballWidth = 400;
const CannonballHeight = 400;
const CrosshairsHeight = 150;
const CrosshairsWidth = 150;

//timing for the next tentical to show up
const MinProcessTime = 3000
const RandomProcessTime = 3000 //added to min

function getRandomInt(max) {
    max += 1; //so that max can equal what is passed in
    return Math.floor(Math.random() * max);
}

function togglePlayerAimControl(){
    if(playerControlAim){
        //turn off
        document.getElementById('crosshairs').classList.add('auto')
        playerControlAim = false;
    }else{
        //turn on
        document.getElementById('crosshairs').classList.remove('auto')
        window.requestAnimationFrame(animate);
        playerControlAim = true;
    }
}

$(document).ready(function(){
    
    /* ----------------- */
    /* HTML INTERACTIONS */
    /* ----------------- */
    $('#start-show').click(function(){
        $("#page-startup").hide();
        $("#page-show").show();
    });

    setupAnimation();

    if(!playerControlAim){
        document.getElementById('crosshairs').classList.add('auto')
    }else{
        crosshairLeft = ((document.body.clientWidth / 2) - (CrosshairsWidth / 2)) - 300;
        crosshairTop = ((document.body.clientHeight / 2) - (CrosshairsHeight)) - 100;
        window.requestAnimationFrame(animate);
    }

    let cannonballID = 0;
    document.body.onkeyup = function(e) {
        if (isCooledDown && (e.key == " " || e.code == "Space" || e.keyCode == 32)) {
            isCooledDown = false;
            setTimeout(function(){
                isCooledDown = true;
            }, cooldownTime)
            //let pos = $("#crosshairs").position();
            let pos = document.getElementById("crosshairs").getBoundingClientRect()
            let posX = pos.left + (CrosshairsWidth/2);
            let posY = pos.top + (CrosshairsHeight/2);
            let cannonBallX = posX - (CannonballWidth/2)
            let yOffset = 60;
            let cannonBallY = posY - (CannonballHeight/2) + yOffset;
            let debugClass = ''
            if(debug){
                document.getElementById('debug_blue').style.top = pos.top;
                document.getElementById('debug_blue').style.left = pos.left;
                document.getElementById('debug_blue').style.width = CrosshairsWidth;
                document.getElementById('debug_blue').style.height = CrosshairsHeight;

                document.getElementById('debug_green').style.top = posY;
                document.getElementById('debug_green').style.left = posX;
                document.getElementById('debug_green').style.width = 5;
                document.getElementById('debug_green').style.height = 5;
                debugClass = 'debug'
            }
            let cannonballHTML = `<div style="left:${cannonBallX}px; top:${cannonBallY}px" class="cannonball ${debugClass}" id="cannonball${cannonballID}"></div>`;
            $("#cannonballs").append(cannonballHTML);
            setTimeout(processCannonball.bind(null, cannonballID), 900);
            cannonSound();
            cannonballID++;
        }
        if(e.key == "p" || e.code =="p"){
            $("#page-startup").show();
            $("#bgAudioLevel").html(bgMusic.volume);
        }
        if(e.key == "o" || e.code == "o"){
            togglePlayerAimControl();
        }
    }

    function processCannonball(cannonballID){
        let scopeAdjust = 0;
        let scaleAdjust = 0.15
        let c_pos = $("#cannonball"+cannonballID).position();
        let c_left = (c_pos.left) + scopeAdjust;
        let c_top = (c_pos.top) + scopeAdjust;
        let c_right = (CannonballWidth*scaleAdjust)+c_left - scopeAdjust;
        let c_bottom = (CannonballHeight*scaleAdjust)+c_top - scopeAdjust;
        
        if(debug){
            document.getElementById('debug_red').style.top = c_pos.top;
            document.getElementById('debug_red').style.left = c_pos.left;
            document.getElementById('debug_red').style.width = (CannonballWidth*scaleAdjust);
            document.getElementById('debug_red').style.height = (CannonballHeight*scaleAdjust);
        }
        let hits = [];
        if(bossStarted){
            let t_pos = $("#boss").offset();
            if(t_pos == undefined){
                //oops
                hitSound(false);
                $("#cannonball"+cannonballID).remove();
                return;
            }
            let t_left = t_pos.left;
            let t_top = t_pos.top;
            let t_right = $("#boss").width()+t_left;
            let t_bottom = $("#boss").height()+t_top;
            let overlap = !(c_right < t_left || c_left > t_right || c_bottom < t_top || c_top > t_bottom);
            if(overlap){
                hitBoss();
            }
        }else{
            tenticals.forEach(function(t, i){
                if(t.active){
                    let t_css_bottom = $("#tid_"+t.id).css('bottom');
                    t_css_bottom = parseInt(t_css_bottom.replace('px', ''));
                    if(t_css_bottom > -400){ //make sure it's fully raised up
                        let t_pos = $("#tid_"+t.id).position();
                        let t_left = t_pos.left;
                        let t_top = t_pos.top;
                        let t_right = $("#tid_"+t.id).width()+t_left;
                        let t_bottom = $("#tid_"+t.id).height()+t_top;
                        let overlap = !(c_right < t_left || c_left > t_right || c_bottom < t_top || c_top > t_bottom);
                        if(overlap){
                            t.indexID = i;
                            hits.push(t);
                        }
                    }
                }
            });
            if(hits.length > 0){
                hitSound(true);
                if(bgMusic.volume <= 1){
                    let newVolumne = bgMusic.volume + musicIncrease;
                    if(newVolumne > 1){
                        bgMusic.volume = 1;
                    }else{
                        bgMusic.volume += musicIncrease;
                    }
                }
                hits.sort(function(a,b){
                    if(a.c < b.c){
                        return -1;
                    }else if(a.c > b.c){
                        return 1;
                    }
                    return 0;
                });
                $("#tid_"+hits[0].id).addClass("death");
                setTimeout(tenticalRemove.bind(null, hits[0].id), 2000);
                tenticals.splice(hits[0].indexID, 1);
                
                score++;
                if(score >= bossStartScore){
                    startBoss();
                }
            }else{
                hitSound(false);
            }
        }
        

        $("#cannonball"+cannonballID).remove();
    }
    
    /* ------------ */
    /* AUDIO STUFFS */
    /* ------------ */
    cannonBoom = document.getElementById('cannon-audio');
    cannonBoom.onloadeddata = function(){
        cannonBoom.play();
    }

    hitOrMiss = document.getElementById('hit-audio');
    hitOrMiss.onloadeddata = function(){
        hitOrMiss.play();
    }

    //bg wave loop
    bgAudio = document.getElementById('bg-audio');
    bgAudio.ontimeupdate = function(e){
        var buffer = .4
        if(this.currentTime > this.duration - buffer){
            this.currentTime = 0;
        }
    }
    //bg creaking loop
    bgCreakingAudio = document.getElementById('bg-creaking-audio');
    bgCreakingAudio.ontimeupdate = function(e){
        var buffer = .4
        if(this.currentTime > this.duration - buffer){
            this.currentTime = 0;
        }
    }

    //music loop
    bgMusic = document.getElementById('bg-music');
    bgMusic.ontimeupdate = function(e){
        var buffer = .4
        if(this.currentTime > this.duration - buffer){
            this.currentTime = 0;
        }
    }

    //pirate sound
    pirateTalk = document.getElementById('talk-audio');
    pirateTalk.ontimeupdate = function(e){
        var buffer = .4
        if(this.currentTime > this.duration - buffer){
            this.pause();
            newTalkSound();
            this.currentTime = 0;
            let waitTime = getRandomInt(10000)+8000;
            setTimeout(function(){
                pirateTalk.play();
            }, waitTime);
        }
    }
    /*
    bgAudio.onloadeddata = function(){
        bgAudio.play();
    }
    */
});

let animate;

function setupAnimation(){
    /* SETUP ANIMATION */
    let wDown = false;
    let aDown = false;
    let sDown = false;
    let dDown = false;
    let swayHorizAmounts = [];
    let swayVerticalAmounts = [];

    let amount1 = 0.01
    let maxHorizAmount = 2.5;
    //far right
    for(let i = 0; i <= maxHorizAmount; i+=amount1){
        i = parseFloat(parseFloat(i).toFixed(2))
        swayHorizAmounts.push(i)
    }
    for(let i = maxHorizAmount; i >= 0; i -= amount1){
        i = parseFloat(parseFloat(i).toFixed(2))
        swayHorizAmounts.push(i)
    }
    //move back to left
    for(let i = 0; i >= maxHorizAmount*-1; i -= amount1){
        i = parseFloat(parseFloat(i).toFixed(2))
        swayHorizAmounts.push(i)
    }
    for(let i = maxHorizAmount*-1; i <= 0; i += amount1){
        i = parseFloat(parseFloat(i).toFixed(2))
        swayHorizAmounts.push(i)
    }

    //VERTICAL

    let maxVerticalAmount = 1;
    for(let i = 0; i <= (maxVerticalAmount-0.2); i+=amount1){
        i = parseFloat(parseFloat(i).toFixed(2))
        swayVerticalAmounts.push(i)
    }
    for(let i = (maxVerticalAmount-0.2); i >= 0; i -= amount1){
        i = parseFloat(parseFloat(i).toFixed(2))
        swayVerticalAmounts.push(i)
    }
    //move back top
    for(let i = 0; i >= maxVerticalAmount*-1; i -= amount1){
        i = parseFloat(parseFloat(i).toFixed(2))
        swayVerticalAmounts.push(i)
    }
    for(let i = maxVerticalAmount*-1; i <= 0; i += amount1){
        i = parseFloat(parseFloat(i).toFixed(2))
        swayVerticalAmounts.push(i)
    }

    let swayIndexHorizTracker = 0;
    let swayIndexVerticalTracker = 0;

    document.addEventListener("keydown", (e) => {
        if(playerControlAim){
            if(e.key == 'w' || e.code == 'w'){
                wDown = true;
            }
            if(e.key == 'a' || e.code == 'a'){
                aDown = true;
            }
            if(e.key == 's' || e.code == 's'){
                sDown = true;
            }
            if(e.key == 'd' || e.code == 'd'){
                dDown = true;
            }
        }
    })
    document.addEventListener("keyup", (e) => {
        if(playerControlAim){
            if(e.key == 'w' || e.code == 'w'){
                wDown = false;
            }
            if(e.key == 'a' || e.code == 'a'){
                aDown = false;
            }
            if(e.key == 's' || e.code == 's'){
                sDown = false;
            }
            if(e.key == 'd' || e.code == 'd'){
                dDown = false;
            }
        }
    })
    animate = () => {
        if(wDown){
            crosshairTop -= CrosshairVerticalIncreaseAmount;
        }
        if(aDown){
            crosshairLeft -= CrosshairHorizIncreaseAmount;
        }
        if(sDown){
            crosshairTop += CrosshairVerticalIncreaseAmount;
        }
        if(dDown){
            crosshairLeft += CrosshairHorizIncreaseAmount;
        }

        

        crosshairLeft += swayHorizAmounts[swayIndexHorizTracker];
        swayIndexHorizTracker++;
        if(swayIndexHorizTracker > swayHorizAmounts.length-1){
            swayIndexHorizTracker=0;
        }

        crosshairTop += swayVerticalAmounts[swayIndexVerticalTracker];
        swayIndexVerticalTracker++;
        if(swayIndexVerticalTracker > swayVerticalAmounts.length-1){
            swayIndexVerticalTracker=0;
        }

        if(crosshairTop < 0){
            crosshairTop = 0;
        }
        if(crosshairLeft < 0){
            crosshairLeft = 0;
        }
        if(crosshairTop > document.body.clientHeight - CrosshairsHeight){
            crosshairTop = document.body.clientHeight - CrosshairsHeight;
        }
        if(crosshairLeft > document.body.clientWidth - CrosshairsWidth){
            crosshairLeft = document.body.clientWidth - CrosshairsWidth;
        }

        document.getElementById('crosshairs').style.left = crosshairLeft+'px';
        document.getElementById('crosshairs').style.top = crosshairTop+'px';
        if(playerControlAim){
            window.requestAnimationFrame(animate);
        }
    }
}


let isCooledDown = true;

let tID = 0; //so we can identify each tentical to shoot down
let cycle = 1; //cycles through left, center, and right.
let tenticals = [];
let maxT = 6;

function processTenticals(){

    let oldTID = null;
    if(tenticals.length > 0){
        //remove active
        oldTID = tenticals.length-1
        
        $("#tid_"+tenticals[oldTID].id).addClass("death");
        setTimeout(tenticalRemove.bind(null, tenticals[oldTID].id), 2000);
    }

    //create new one
    generateTenticalHTML();

    //remove the old one for real
    setTimeout(deactivateOldTentical.bind(null, oldTID), 700)
}
function deactivateOldTentical(oldTID){
    if(tenticals.length > 1){
        //officially destory the old one
        tenticals[oldTID].active = false;
        tenticals.splice(tenticals[oldTID].indexID, 1);
    }
}

function generateTenticalHTML(){

    

    if(tenticals.length < maxT && !bossStarted){
        let t_num = getRandomInt(5); //tentical number
        let c_num = getRandomInt(3) + 1; //container number
        let x_num = getRandomInt(24); //left number as %
        switch(cycle){
            case 2:
                x_num += 24;
            break;
            case 3:
                x_num += 56;
                cycle = 0;
            break;
        }
        cycle++;
        let s_num = 1 - c_num*0.05; //scale number
        let s_html = `left:${x_num}%; scale:${s_num}`;
        let debugClass = ''
        if(debug){
            debugClass = 'debug'
        }
        let t_html = `<div id="tid_${tID}" style="${s_html}" class="tentical_intro"><div class="tentical ${debugClass} t_${t_num}"></div></div>`;
        $('#tc_'+c_num).append(t_html);
        tenticals.push({id:tID, c:c_num, active:false});
        tID++;

        setTimeout(activeDelay.bind(null, tenticals.length-1), 200)
        
    }
    //console.log(c_num, t_num, x_num, s_num);
}

//wait for the tenticle to animate above the water before becoming active
function activeDelay(index){
    tenticals[index].active = true
}

setTimeout(tick, 2000);
function tick(){
    //generateTenticalHTML();
    processTenticals()
    let delayTime = getRandomInt(RandomProcessTime) + MinProcessTime;
    setTimeout(tick, delayTime);
}

function tenticalRemove(tid){
    $("#tid_"+tid).remove();
}

let score = 0;
let bossStarted = false;
let bossStep = 1;

let debugClass = ''
if(debug){
    debugClass = 'debug'
}

let bossHTML = `<div id="boss_intro"><div id="boss" class="${debugClass}"></div></div>`;
//TODO: have cannonball hit kraken
function startBoss(){
    bossStarted = true;
    tenticals.forEach(function(t, i){
        $("#tid_"+t.id).addClass("death");
        setTimeout(tenticalRemove.bind(null, t.id), 2000);
        tenticals = [];
    });
    
    $("#tc_"+bossStep).append(bossHTML);
}
function hitBoss(){
    bossStep++;
    if(bgMusic.volume <= 1){
        let newVolumne = bgMusic.volume + musicIncrease;
        if(newVolumne > 1){
            bgMusic.volume = 1;
        }else{
            bgMusic.volume += musicIncrease;
        }
    }
    if(bossStep == 2){
        $("#boss_intro").addClass("boss_end");
        setTimeout(function(){
            $("#boss_intro").remove();
            winTheGame();
        }, 3900);
        winSound();
    }else{
        hitSound(true);
        $("#boss_intro").addClass("boss_hit");
        setTimeout(function(){
            $("#boss_intro").remove();
            $("#tc_"+bossStep).append(bossHTML);
        }, 2000);
    }
}

function winTheGame(){
    bgMusic.volume = .7;
    setTimeout(function(){
        bgMusic.volume = .6;
    }, 1000)
    setTimeout(function(){
        bgMusic.volume = .5;
    }, 2000)
    setTimeout(function(){
        bgMusic.volume = .4;
    }, 3000)
    setTimeout(function(){
        bgMusic.volume = .3;
    }, 4000)
    setTimeout(function(){
        bgMusic.volume = .2;
    }, 5000)
    
    setTimeout(function(){
        score = 0;
        bossStarted = false;
        bossStep = 1;
        cannonballID = 0;
    }, 5000);
    
}

function hitSound(wasHit){
    if(wasHit){
        hitOrMiss.src = "audio/hit1.mp3";
    }else{
        hitOrMiss.src = "audio/splash"+(getRandomInt(1)+1)+".mp3";
    }
    
}
function cannonSound(){
    cannonBoom.src = "audio/cannon"+(getRandomInt(2)+1)+".m4a";
    //start playing background audio if it hasn't started yet.
    if(bgAudio.currentTime === 0 && bgAudio.paused){
        bgAudio.play();
        bgCreakingAudio.play();
        newTalkSound();
        pirateTalk.play();
        bgMusic.play();

        bgAudio.volume = 0.3; //wave
        bgCreakingAudio.volume = 0.3; //creaking
        pirateTalk.volume = 1;
        bgMusic.volume = 0.2;
    }
}
function winSound(){
    hitOrMiss.src = "audio/success"+(getRandomInt(1)+1)+".mp3";
}

let pTmax = 11;
let pTlast = [];
function newTalkSound(){
    let nextNum = getRandomInt(pTmax) +1;
    while(pTlast.indexOf(nextNum) != -1){
        nextNum = getRandomInt(pTmax)+1;
    }
    pTlast.push(nextNum);
    if(pTlast.length == pTmax-4){
        pTlast = [nextNum];
    }
    pirateTalk.src = "audio/pirate"+(nextNum)+".mp3";
}
