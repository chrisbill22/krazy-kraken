/* -- ARDUINO REFERENCE


LEO (CANNON)
Cannon Button
13 - Left of black wire
A0 - Left of white wire
Black and White to ground

Button One
12 - Green wire on harness
A1 - Red wure ib garbess
Blue & Black to ground

Button Two
11 - Green wire on harness
A2 - Red wure ib garbess
Blue & Black to ground

Button Three
10 - Green wire on harness
A3 - Red wure ib garbess
Blue & Black to ground

ARDUINO RESPONSABILITY
- Determine which direction to fire the UFO & damage the ship
  - Loop process picks a random direction at an interval and sends keyboard command to computer
  - Computer renders the result
  - If computer gets a command and the ufo is busy or destoryed, it's ignored

-- */

let audio;
let debug = false;

//Arduino communcaiton
let arduino_port;

/* GAMEPLAY VARIABLES */
/* Change these to adjust how the game is actually played*/
let bossStartScore = 2;
let musicIncrease = 0.25; //was 0.1
let cooldownTime = 1500;

/*END GAMEPLAY VARIABLES */

const CannonballWidth = 400;
const CannonballHeight = 400;
const CrosshairsHeight = 150;
const CrosshairsWidth = 150;

//timing for the next tentical to show up
const MinProcessTime = 3000
const RandomProcessTime = 5000 //added to min

const KEY_CODES = {
    REPAIR_LEFT: 'z',
    REPAIR_CENTER: 'x',
    REPAIR_RIGHT: 'c',
    CHARGE_READY: 'g',
    GAME_RESTART: 'r'
}

function getRandomInt(max) {
    max += 1; //so that max can equal what is passed in
    return Math.floor(Math.random() * max);
}

let gameHasStarted = false;
let gameHasEnded = false;
function startGame(){
    console.log("start game");
    score = 0;
    fireworks.stop();
    gameHasEnded = false;
    ufoWasHit = false;

    //$("#start-ship").addClass('ship-start-animation');
    $("#start-ship").fadeOut(2000);
    $("#title-text").fadeOut(2000);
    $("#game-over-ship").hide();
    $("#game-over-ship").removeClass('sink-ship');
    $('#ship').fadeIn(2000, () => {
        $("#start-ship").removeClass('ship-start-animation');
        $('#crosshairs').fadeIn();
        $('#ufo').fadeIn();
        $("#game-over-ship").hide();
        $("#start-ship").hide();
        gameHasStarted = true;
        sendArduinoIsCooledDown();
        startUFO();
        $('#start-ship').attr('style', 'display:none;');
    });
}
function endGame(won){
    if(gameHasEnded){
        return;
    }
    gameHasEnded = true;
    sendArduinoGameRestart();
    if(won){
        console.log("win");
        let p = $('#ufo').position();
        $('#ufo').offset({ top: p.top, left: p.left });
        $('#ufo').removeClass("idle_1");
        $('#ufo').addClass("ufo_destroyed");
        $("#title-text").html("Victory!");
        setTimeout(() => {
            fireworks.start();
            winSound();
        }, 1000);
        $("#start-ship").fadeIn(2000);
        $('#ship').fadeOut(2000);
        $('#crosshairs').fadeOut(2000);
        $("#title-text").fadeIn(2000);
        setTimeout(function(){
            damage = [false, false, false];
            repairDamage(0);
            repairDamage(1);
            repairDamage(2);
            $("#title-text").fadeOut(1000, () => {
                $("#title-text").html("Press Any Button to Start");
                $("#title-text").fadeIn(1000, () => {
                    //fireworks.stop();
                    gameHasStarted = false;
                });
            });
            $('#ufo').removeClass("ufo_destroyed");
            $('#ufo').attr('style', '');
            $('#ufo').hide();
        }, 5000);
    }else{
        console.log("lose");
        $("#title-text").html("Game Over");
        $("#game-over-ship").fadeIn(2000);
        $("#page-splash-screen").fadeIn(2000);
        $('#ship').fadeOut(2000);
        $('#crosshairs').fadeOut(2000);
        $("#title-text").fadeIn(2000);
        setTimeout(loseSound, 2000);
        setTimeout(function(){
            damage = [false, false, false];
            repairDamage(0);
            repairDamage(1);
            repairDamage(2);
            $("#game-over-ship").addClass('sink-ship');
            setTimeout(() => {
                gameHasStarted = false;
                $("#game-over-ship").fadeOut(2000);
            }, 5000);
            setTimeout(() => {
                $("#title-text").fadeOut(1000, () => {
                    $("#title-text").html("Press Any Button to Start");
                    $("#title-text").fadeIn(1000);
                });
            }, 4000);
        }, 3000);
    }
}

let fireworks;

$(document).ready(function(){
    
    const container = document.querySelector('.fireworks')
    fireworks = new Fireworks.default(container)

    $('#ship').hide();
    $('#crosshairs').hide();
    $('#ufo').hide();

    $("#game-over-ship").hide();

    /* ----------------- */
    /* HTML INTERACTIONS */
    /* ----------------- */
    $('#start-show').click(function(){
        $("#page-startup").addClass('hidden');
        $("#page-show").show();
    });

    document.getElementById('connect-arduino').addEventListener('click', async () => {
    // Prompt user to select a serial port
        arduino_port = await navigator.serial.requestPort();
        await arduino_port.open({ baudRate: 9600 });
    });

    document.getElementById('crosshairs').classList.add('auto')

    let cannonballID = 0;
    document.body.onkeyup = function(e) {
        if (isCooledDown && (e.key == " " || e.code == "Space" || e.keyCode == 32)) {
            if(!gameHasStarted){
                requestArduinoPort();
                startGame();
                return;
            }
            
            isCooledDown = false;
            setTimeout(function(){
                isCooledDown = true;
                sendArduinoIsCooledDown();
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
            $("#page-startup").removeClass('hidden');
            $("#bgAudioLevel").html(bgMusic.volume);
        }
        
        // if(e.key == KEY_CODES.DAMAGE_LEFT || e.code == KEY_CODES.DAMAGE_LEFT){
        //     UFOStartCharge(0);
        // }
        // if(e.key == KEY_CODES.DAMAGE_CENTER || e.code == KEY_CODES.DAMAGE_CENTER){
        //     UFOStartCharge(1);
        // }
        // if(e.key == KEY_CODES.DAMAGE_RIGHT || e.code == KEY_CODES.DAMAGE_RIGHT){
        //     UFOStartCharge(2);
        // }

        if(e.key == KEY_CODES.REPAIR_LEFT || e.code == KEY_CODES.REPAIR_LEFT){
            if(!gameHasStarted){
                startGame();
                return;
            }
            Ship_hitSound(true);
            repairDamage(0);
        }
        if(e.key == KEY_CODES.REPAIR_CENTER || e.code == KEY_CODES.REPAIR_CENTER){
            if(!gameHasStarted){
                startGame();
                return;
            }
            Ship_hitSound(true);
            repairDamage(1);
        }
        if(e.key == KEY_CODES.REPAIR_RIGHT || e.code == KEY_CODES.REPAIR_RIGHT){
            if(!gameHasStarted){
                startGame();
                return;
            }
            Ship_hitSound(true);
            repairDamage(2);
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

        //HIT UFO

        let t_pos = $("#ufo").offset();
        if(t_pos == undefined){
            //oops
            UFO_hitSound(false);
            $("#cannonball"+cannonballID).remove();
            return;
        }
        let t_left = t_pos.left;
        let t_top = t_pos.top;
        let t_right = $("#ufo").width()+t_left;
        let t_bottom = $("#ufo").height()+t_top;
        let overlap = !(c_right < t_left || c_left > t_right || c_bottom < t_top || c_top > t_bottom);
        if(overlap){
            ufoWasHit = true;
            score++;
            UFOCancelCharge();
            $("#ufo_damage").addClass("ufo_hit");
            UFO_hitSound(true);
            setTimeout(function(){
                $("#ufo_damage").removeClass("ufo_hit");
                if(score >= 3){
                    endGame(true);
                }
            }, 500);
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

    shipDamageAudio = document.getElementById('ship-damage-audio');
    shipDamageAudio.onloadeddata = function(){
        shipDamageAudio.volume = 0.5;
        shipDamageAudio.play();
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
//UFO
let ufoHP = [false, false, false];;
let ufoWasHit = false;
let ufoIsReadyForCommands = false;
function startUFO(){
    ufoHP = [false, false, false];
    ufoHit = false;
    $("#ufo").removeClass("ufo_hit");
    $("#ufo").removeClass("ufo_end");

    let d = getRandomInt(2) + 1;
    UFOApproach(1);
}
function UFOApproach(num){
    console.log("UFO APPROACH", num);
    $("#ufo").addClass("intro_"+num);
    setTimeout(function(){
        $("#ufo").removeClass("intro_"+num);
        $("#ufo").addClass("idle_"+num);
        UFOStartCharge();
    }, 3000);
}

function UFOCancelCharge(){
    console.log("UFO CANCEL CHARGE");
    $("#laser_charge").removeClass("charging");
}

let ufoNewFireDirection = 0;
//0 = left, 1 = center, 2 = right
function UFOStartCharge(){
    if(gameHasEnded){
        return;
    }
    let d = getRandomInt(2);
    ufoWasHit = false;
    console.log("UFO START CHARGE", d);
    if(isShipFullyDamaged()){
        console.log("SHIP IS FULLY DAMAGED (1)");
        return;
    }
    if(damage[d] === true){ 
        console.log("UFO CANCELED DUE TO DAMAGE");
        UFOStartCharge();
        return;
    }
    console.log("UFO CHARGING", d);
    ufoNewFireDirection = d;
    $("#laser_charge").addClass("charging");
    setTimeout(UFOLaserFire, 3000);
}
function UFOLaserFire(){
    console.log("UFO FIRE", ufoNewFireDirection);
    if(ufoWasHit){ 
        console.log("UFO CANCELED DUE TO BEING HIT");
        ufoWasHit = false;
        UFOStartCharge();
        return;
    }
    $("#laser_charge").removeClass("charging");
    if(gameHasEnded){
        console.log("UFO CANCELED DUE TO GAME END");
        return;
    }
    let d = ufoNewFireDirection;
    if(damage[d] === true){
        console.log("UFO CANCELED DUE TO DAMAGE ON FIRE DIRECTION");
        UFOLaserFire();
        return;
    }

    switch(d){
    case 0:
        UFOLaserLeft();
        break;
    case 1:
        UFOLaserCenter();
        break;
    case 2:
        UFOLaserRight();
            break;
    }

    sendArduinoHitCommand(d);

    setTimeout(UFOStartCharge, 3000);
}
function UFOLaserLeft(){
    console.log("UFO LASER LEFT");
    $("#laser_left").show();
    $("#laser_left").addClass("fire");
    Ship_hitSound(false);
    setTimeout(function(){
        $("#laser_left").removeClass("fire");
        $("#laser_left").hide();
        takeDamage(0);
    }, 300);
}
function UFOLaserCenter(){
    console.log("UFO LASER CENTER");
    $("#laser_center").show();
    $("#laser_center").addClass("fire");
    Ship_hitSound(false);
    setTimeout(function(){
        $("#laser_center").removeClass("fire");
        $("#laser_center").hide();
        takeDamage(1);
    }, 300);
}
function UFOLaserRight(){
    console.log("UFO LASER RIGHT");
    $("#laser_right").show();
    $("#laser_right").addClass("fire");
    Ship_hitSound(false);
    setTimeout(function(){
        $("#laser_right").removeClass("fire");
        $("#laser_right").hide();
        takeDamage(2);
    }, 300);
}


//DAMAGE
let damage = [false, false, false];
function isShipFullyDamaged(){
    if(damage[0] === true && damage[1] === true && damage[2] === true){
        endGame();
        return true;
    }
    return false;
}
function takeDamage(d){
    if(damage[d] === true){ return; }
    if(isShipFullyDamaged()){
        return;
    }
    console.log("damage");

    let tookDamange = false;
    while(tookDamange == false){
        if(d == undefined){
            d = getRandomInt(2);
        }
        if(damage[d] === false){
            damage[d] = true;
            let damagePart = d;
            console.log(damagePart);
            switch(damagePart){
                case 0:
                    $("#ship_left").attr('src', "images/ship_left_broken.png");
                break;
                case 1:
                    $("#ship_center").attr('src', "images/ship_center_broken.png");
                break;
                case 2:
                    $("#ship_right").attr('src', "images/ship_right_broken.png");
                break;
            }
            tookDamange = true;
            isShipFullyDamaged();
        }
    }
}
function repairDamage(id){
    
    switch(id){
        case 0:
            damage[0] = false;
            $("#ship_left").attr('src', "images/ship_left.png");
        break;
        case 1:
            damage[1] = false;
            $("#ship_center").attr('src', "images/ship_center.png");
        break;
        case 2:
            damage[2] = false;
            $("#ship_right").attr('src', "images/ship_right.png");
        break;
    }
}

//

let animate;


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

//ENABLE THIS TO ENABLE TENTICALS
//setTimeout(tick, 2000);
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
        UFO_hitSound(true);
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

function UFO_hitSound(wasHit){
    if(wasHit){
        switch(getRandomInt(2)){
            case 0:
                hitOrMiss.src = "audio/ufoHit1.m4a";
            break;
            case 1:
                hitOrMiss.src = "audio/ufoHit2.m4a";
            break;
            case 2:
                hitOrMiss.src = "audio/ufoHit3.m4a";
            break;
        }
    }else{
        hitOrMiss.src = "audio/splash"+(getRandomInt(1)+1)+".mp3";
    }
}
function Ship_hitSound(wasRepaired){
    if(wasRepaired){
        shipDamageAudio.src = "audio/shipRepair1.m4a";
    }else{
        shipDamageAudio.src = "audio/shipDamage1.m4a";
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
function loseSound(){
    hitOrMiss.volume = 0.5;
    hitOrMiss.src = "audio/gameover.wav";
    setTimeout(function(){
        hitOrMiss.volume = 1;
    }, 3000);
}

async function requestArduinoPort(){
    if(arduino_port != undefined){
        return;
    }
    arduino_port = await navigator.serial.requestPort();
    await arduino_port.open({ baudRate: 9600 });
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

function sendArduinoGameRestart(){
     if(arduino_port == undefined){
        console.error("No arduino connected");
        return;
    }
    console.log("SEND ARDUINO COMMAND: Game Restart ", KEY_CODES.GAME_RESTART);

    const writer = arduino_port.writable.getWriter();
    const data = new Uint8Array([KEY_CODES.GAME_RESTART.charCodeAt(0)]);
    writer.write(data);
    writer.releaseLock();
}
function sendArduinoIsCooledDown(){
     if(arduino_port == undefined){
        console.error("No arduino connected");
        return;
    }
    console.log("SEND ARDUINO COMMAND: Cannon is cooled ", KEY_CODES.CHARGE_READY);

    const writer = arduino_port.writable.getWriter();
    const data = new Uint8Array([KEY_CODES.CHARGE_READY.charCodeAt(0)]);
    writer.write(data);
    writer.releaseLock();
}
function sendArduinoHitCommand(hitPart){

    if(arduino_port == undefined){
        console.error("No arduino connected");
        return;
    }

    console.log("SEND ARDUINO HIT COMMAND", hitPart);

    let keyChar = '';
    switch(hitPart){
        case 0:
            keyChar = 'v';
        break;
        case 1:
            keyChar = 'b';
        break;
        case 2:
            keyChar = 'n';
        break;
    }

    const writer = arduino_port.writable.getWriter();
    const data = new Uint8Array([keyChar.charCodeAt(0)]);
    
    writer.write(data); // Send the data
    writer.releaseLock();
}
