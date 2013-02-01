/*
 *Scoreの追加・音符の描画・データの保存を行う
*/

var stage, canvas;
var SoundManager = {}, playing = false;
var bpm, lineMaxIndex = [], lmi = 0, lineIndexes;//lineMaxIndexのindex
var playHead, rectContainer, scoreTitle = "No Title";
var snappedLine, thisId;
var titleDom;
var AllScores = [], csi = 0; //Current Score Index;
var AllOptions = [];

/*編集画面の初期化（ボタン/Stageの配置)*/
require(["dojo/query","dojo/dom-construct","dojo/dom","dojo/dom-attr","dojo/dom-class","dojo/on","dojo/store/Memory","dojo/store/Observable","dojo/domReady!"],
    function(query,domConst,dom,domAttr,domClass,on,Memory,Observable){
    var secEdit = dom.byId("section_edit");
    
    canvas = domConst.create("canvas",{
                width: 831, height: 150, class:"scoreCanvas"
                },dom.byId("canvasArea"));
    stage = new createjs.Stage(canvas);
    
    /*各スコアの追加・削除・変更を監視
    scoreMemory = new Observable(new Memory({data:AllScores}));
    var resultScore = scoreMemory.query()
    
    /*スコアが追加されると呼ばれる
    var scoreHandle = resultScore.observe(function(object,removedFrom,insertedInto){
        console.log(object);
        noteMemory = new Observable(new Memory({data:object.Note, idProperty:object.id}));
        var resultNote = noteMemory.query();
    });*/
    
    //init();
    
    var playBtn = dom.byId("btn_play");
    
    on(playBtn,"click",function(e){
        /*bpmの取得・設定*/
        bpm = dom.byId("bpmNumber").value;
        if(bpm <= 0 || !bpm)
            bpm = 120;
        
        domClass.toggle(playBtn,"playing");
        saveNotes();
        scrollHead();
    });
    
    on(dom.byId("btn_stop"),"click",function(e){
        
        lineIndexes = {
            0:0, 1:0, 2:0, 3:0, 4:0, 5:0, 6:0
        };
        
        csi = 0;
        playHead.x = 55;
        playHead.y = 0;
        
        domClass.toggle(playBtn,"playing",false);
        
        if(playing)
            scrollHead();
        
        saveNotes();    
        stage.update();
        
        console.log(lineIndexes);
    });
    
    var handle;
    on(dom.byId("btn_record"),"click",function(e){
        
        setTimeout(function(){
            on.emit(playBtn,"click",e);
        },1000);
        
        if(!handle){
            handle = query("#drumset > span").on("click",function(e){
                var yPos;
                switch(e.target.id){
                    case "snear_drum":
                        yPos = rectContainer.getChildAt(4).y + 7.5;
                        break;
                    case "floor_drum":
                        yPos = rectContainer.getChildAt(5).y + 7.5;
                        break;
                    case "high_hut":
                        yPos = rectContainer.getChildAt(2).y + 7.5;
                        break;
                    case "high_tum":
                    case "low_tum":
                        yPos = rectContainer.getChildAt(3).y + 7.5;
                        break;
                    case "bass_drum":
                        yPos = rectContainer.getChildAt(6).y + 7.5;
                        break;
                    case "simbul":
                        yPos = rectContainer.getChildAt(1).y + 7.5;
                        break;
                }
                yPos += csi*120;
                createNote({stageX: playHead.x, 
                            stageY: yPos,
                            context: AllScores[csi]});
            });
        }else{
            handle.remove();
            handle = null;
        }    
    });
    
    /*Titleテキスト*/
    
    titleDom = dom.byId("scoreTitle");
    on(titleDom,"click",function(e){
        if(domAttr.get(this,"value") == "No Title")
            domAttr.set(this,"value","");
    });
    on(titleDom,"blur",function(e){
        var title = domAttr.get(this,"value");
        if(title == "")
            domAttr.set(this,"value","No Title");
        else if(title.length > 8)
            this.style.width = title.length*14 + "px";
        
        scoreTitle = this.value;
        
    });
    
});


function edit(id){
    thisId = id;
    init();
}

function init(){
    
    /*再生ヘッド　全体を行き来する*/
    if(!playHead){
        playHead = new createjs.Shape();
        playHead.graphics.setStrokeStyle(1);
        playHead.graphics.beginStroke("#cf6060");
        playHead.graphics.beginFill("#cf6060");
        playHead.graphics.moveTo(0,20);
        playHead.graphics.lineTo(-10,10);
        playHead.graphics.lineTo(10,10);
        playHead.graphics.lineTo(0,20);
        playHead.graphics.lineTo(0,130);
        playHead.x = 55;
        stage.addChild(playHead);
    }
    
    /*再生ヘッドを動かして、各線上の最も小さいノートと衝突判定*/
    lineIndexes = {
        0:0, 1:0, 2:0, 3:0, 4:0, 5:0, 6:0
    };
    
    SoundManager.tick = function(){
        playHead.x += 2;
        console.log(lineIndexes);
        for(var i=AllScores[csi].Notes.length-1; i>=0; i--){
            var notes = AllScores[csi].Notes;
            for(var m=notes.length-1; m>=0; m--){
                if(lineMaxIndex[csi][i] > lineIndexes[i]){
                    if(playHead.x-1 == notes[i][lineIndexes[i]].x ||
                        playHead.x == notes[i][lineIndexes[i]].x ||
                        playHead.x+1 == notes[i][lineIndexes[i]].x){
                        console.log("sound");
                        lineIndexes[i]++;
                    }
                }
            }
        }
        if(playHead.x > 810){
            if(AllScores.length-1 > csi){
                csi++;
                lineIndexes = {
                    0:0, 1:0, 2:0, 3:0, 4:0, 5:0, 6:0
                };
                playHead.x = 55;
                playHead.y += 120;
            }else{
                playHead.x = 810;
                scrollHead();
            }
        }
        stage.update();
    };
    
    createScore();
    createSavedScore();
    //loadRecordAnim();
}

function scrollHead(){
    if(playing)
        createjs.Ticker.removeListener(SoundManager);
    else{
        createjs.Ticker.useRAF = true;
        createjs.Ticker.setFPS(bpm/3);
        createjs.Ticker.addListener(SoundManager);
    }
    playing = !playing;
}  

function createScore(){
    /*一つ一つのスコア（横一列）を包むコンテナ*/
    var aScoreContainer = new createjs.Container();
    aScoreContainer.y = 15;
    stage.addChildAt(aScoreContainer,0);
    AllScores.push(aScoreContainer);
    
    
    /*lineMaxIndex(各音階の音符最大数-1)を
      スコアコンテナの分だけ拡張する*/
    lineMaxIndex[lmi++] = [];
    
    /*各コンテナに固有のノート配列*/
    aScoreContainer.Notes = [];
    /*Notes内を７つのコンテナに分割*/
    var i;
    for(i=0; i<7; i++){
        aScoreContainer.Notes[i] = [];
        /*ついでにlineMaxIndexも二次元配列にしとく*/
    }
    /*各コンテナに固有の四角領域*/
    aScoreContainer.Rects = [];
    /*各コンテナに固有の分割線*/
    aScoreContainer.Lines = [];
    
    var scoreImg = new Image();
    scoreImg.onload = imageLoaded;
    scoreImg.src = "images/a_score.png";
    
    function imageLoaded(){
        var scoreBM = new createjs.Bitmap(scoreImg);
        aScoreContainer.addChildAt(scoreBM,0);
        
        /*音符を乗せる四角形を生成*/
        rectContainer = new createjs.Container();
        for(i=0; i<7; i++){
            var scoreRect = new createjs.Shape();
            scoreRect.graphics.beginFill("rgba(255,255,255,0.05)");
            scoreRect.graphics.drawRect(0,0,831,14);
            scoreRect.y = 9 + i*14;
            scoreRect.onPress = createNote;
            rectContainer.addChild(scoreRect);
            aScoreContainer.Rects.push(scoreRect);
        }
        
        /*分割線用のグラフィクス*/
        var lineGra = new createjs.Graphics();
        lineGra.setStrokeStyle(1.5);
        lineGra.beginStroke("#99f");
        lineGra.moveTo(0,0);
        lineGra.lineTo(0,120);
        /*4つの小節それぞれに8分割線を生成*/
        var lineContainer = new createjs.Container();
        for(i=0; i<4; i++){
            for(var j=0; j<8; j++){
                var splitLine = new createjs.Shape(lineGra);
                splitLine.alpha = 0.3;
                /*第1小節は55~247px = 192px/小節
                  9個に分割->192px/10 = 21.3px
                  55+21.3に一つ目、以降21.3pxずつ右にずらす*/
                splitLine.x = 55 + (i*192) + (j+1)*21.3;
                lineContainer.addChild(splitLine);
                aScoreContainer.Lines.push(splitLine);
            }
        }
        aScoreContainer.addChildAt(rectContainer,1);
        aScoreContainer.addChildAt(lineContainer,2);
        
        stage.update();
    }
    
    /*plus/minusボタン*/
    require(["dojo/dom","dojo/dom-construct","dojo/on"],function(dom,domConst,on){
        
        var optionArea = domConst.create("div",{ class:"option_area",
                                                 id:AllOptions.length },dom.byId("canvasArea"));
        optionArea.style.top = 40 + AllOptions.length*120 + "px";
        
        AllOptions.push(optionArea);
        
        var removeBtn = domConst.create("span",{ class:"btn_removeAScore",
                                                 id:"remove"+AllOptions.length },optionArea);
        var addBtn = domConst.create("span",{ class:"btn_addAScore",
                                              id:"add"+AllOptions.length },optionArea);
        
        /*横一列スコアの追加*/
        on(addBtn,"click",function(e){
            
            if(playing)
                return;
            
            addScore(e);
        
            stage.update();
        });
    
        /*横一列スコアの削除*/
        on(removeBtn,"click",function(e){
            
            if(playing)
                return;
            
            removeScore(e);
            
            stage.update();
        });
    });
}
    
function createNote(e){
    /*どのスコアコンテナを対象としているか contextの中身はaScoreContainer*/
    var context = (e.type=="onPress")? e.target.parent.parent: e.context;
    var note = new createjs.Shape();
    note.x = e.stageX;
    snapToNear(note,context);
    
    for(var r=context.Rects.length-1; r>=0; r--){
        var scoreRect = context.Rects[r];
        if(Math.abs(e.stageY-context.y - scoreRect.y-7.5) < 8){
            note.y = scoreRect.y + 7.5;
            /*r(=0から始まる音階)にノートを蓄積*/
            context.Notes[r].push(note);
            break;
        }
    }
        
    /*rの値からノートを書き分ける*/
    drawProperNote(note,r);
    note.onPress = onNotePressed;
    note.onDoubleClick = removeNote;
    context.addChild(note);
    stage.update();
    
    saveNotes();
    console.log("createNote");
};

function createSavedScore(){
    console.log(thisId);
    if(Scores[thisId] == undefined){
        Scores[thisId] = {};
        titleDom.value = "No Title";
    }else{
        /*セーブされているスコア分作成*/
        var maxScoreIndex = AllScores.length-1;
        
        /*セーブされているノートを作成*/
        var noteData = Scores[thisId].slice(1);//info(1番目)を除く
        console.log(noteData);
        for(var i=noteData.length-1; i>=0; i--){
            var aNote = noteData[i];//一つノート(x,y,ctx)
            
            if(aNote.ctx > maxScoreIndex){
                while(aNote.ctx != maxScoreIndex){ 
                    addScore();
                    maxScoreIndex++;
                }
            }
            
            createSavedNote({
                stageX: aNote.x,
                stageY: aNote.y,
                context: AllScores[aNote.ctx],
                r: ((aNote.y/14)>>0) - 1
            });
        }
        
        /*ついでにタイトルも設定*/
        titleDom.value = Scores[thisId][0].name;
    }
}

function createSavedNote(e){

        var note = new createjs.Shape();
        note.x = e.stageX;
        note.y = e.stageY;
        snapToNear(note,e.context); 
        
        drawProperNote(note,e.r);
        note.onPress = onNotePressed;
        note.onDoubleClick = removeNote;
        
        e.context.Notes[e.r].push(note);
        
        drawProperNote(note,e.r);
        note.onPress = onNotePressed;
        note.onDoubleClick = removeNote;
        
        e.context.addChild(note);
        stage.update();
}

/**/
function addScore(targetScore){
    require(["dojo/dom","dojo/dom-attr"],function(dom,domAttr){
        var myScore = dom.byId("section_myScore");
        var newHeight = parseInt(myScore.style.height) + 260;
        myScore.style.height = newHeight + "px";
        
        var canvasHeight = domAttr.get(canvas,"height");
        domAttr.set(canvas,"height",+canvasHeight+120);
        /*canvasを再設定*/
        stage.canvas = canvas;
        
        
        createScore();
        
        var scoreLength = AllScores.length;
        if(targetScore != undefined){
            /*idは個数目*/
            var id = targetScore.target.id.slice(3);
            console.log("id:"+id+",length:"+scoreLength);
            AllScores[scoreLength-1].y += 120*(id);
            
            
            for(var i=id; i<scoreLength-1; i++){
                AllScores[i].y += 120;
            }
        }else{
            AllScores[AllScores.length-1].y += 120*(AllScores.length-1);
        }
        AllScores.sort(function(a,b){
            return a.y - b.y;
        });
    });
}
    
function removeScore(targetScore){
    require(["dojo/dom","dojo/dom-construct","dojo/dom-attr","dojo/query"],function(dom,domConst,domAttr,query){
        
        var id = targetScore.target.id.slice(6),
            max = AllScores.length;
        
        lineMaxIndex[lmi--] = null;
        
        if(max <= 1)
            return;
        
        AllScores[id-1].removeAllChildren();
        stage.removeChild(AllScores[id-1]);
        AllScores[id-1] = null;
        AllScores.splice(id-1,1);
        
        /*plus/minusボタンの削除*/
        /*var optionsList = query(".option_area");
        domConst.destroy(optionsList[id-1]);
        AllOptions.splice(id-1,1);
        console.log(AllOptions);*/
        var optionsList = query(".option_area");
        domConst.destroy(optionsList[AllOptions.length-1]);
        AllOptions.splice(AllOptions.length-1,1);
        console.log(AllOptions);
        
        AllScores.sort(function(a,b){
            return a.y - b.y;
        });
        
        AllOptions.sort(function(a,b){
            return a.id - b.id;
        });
        
        for(var i=id-1,max = AllScores.length; i<max; i++){
            AllScores[i].y -= 120;
        }
        
        var canvasHeight = domAttr.get(canvas,"height");
        domAttr.set(canvas,"height",+canvasHeight-120);
        /*canvasを再設定*/
        stage.canvas = canvas;
        
        var myScore = dom.byId("section_myScore");
        var newHeight = parseInt(myScore.style.height) - 260;
        myScore.style.height = newHeight + "px"; 
    });
}
    
var hitAreaObj = new createjs.Shape();
hitAreaObj.graphics.beginFill("#fff");
hitAreaObj.graphics.drawRect(-7,-7,14,14);
function drawProperNote(shape,r){
    switch(r){
        case 2:
        case 3:
        case 4:
        case 5:
            shape.graphics.clear();
            shape.graphics.beginFill("#000");
            shape.graphics.drawEllipse(-6.5,-5,13,10);
            shape.rotation = -25;
            shape.hitArea = hitAreaObj;
            break;
        case 1:
        case 6:
            shape.graphics.clear();
            shape.graphics.setStrokeStyle(1.5);
            shape.graphics.beginStroke("#000");
            shape.graphics.moveTo(-5,-5);
            shape.graphics.lineTo(5,5);
            shape.graphics.moveTo(-5,5);
            shape.graphics.lineTo(5,-5);
            shape.rotation = 0;
            shape.hitArea = hitAreaObj;
            break;
        case 0:
            shape.graphics.clear();
            shape.graphics.beginFill("#000");
            shape.graphics.moveTo(-0.5,-6.5);
            shape.graphics.lineTo(-7,0);
            shape.graphics.lineTo(0.5,6.5);
            shape.graphics.lineTo(7,0.5);
            shape.graphics.endFill();
            shape.graphics.beginFill("#fff");
            shape.graphics.moveTo(-1,-4);
            shape.graphics.lineTo(-4,-1);
            shape.graphics.lineTo(1.5,4);
            shape.graphics.lineTo(4,1);
            shape.graphics.endFill();
            shape.rotation = 0;
            shape.hitArea = hitAreaObj;
            break;
    }
}
    
function onNotePressed(e){
    
    var context = e.target.parent;
    /*配列から削除するかどうかのフラグ*/
    e.target.delete = true;
    cleanUpNotes(context);
    
    e.onMouseMove = function(me){
        e.target.x = me.stageX;
        e.target.y = me.stageY - context.y;
        
        /*漸近の分割線にスナップ*/
        snapToNear(e.target,context);
        
        /*枠外に出ないようにする*/
        checkBounds(e.target);
        stage.update();
    }
    e.onMouseUp = function(me){
        for(var r=context.Rects.length-1; r>=0; r--){
            var scoreRect = context.Rects[r];
            if(Math.abs(me.target.y - scoreRect.y-7) < 8){
                me.target.y = scoreRect.y + 7.5;
                /*r(=0から始まる音階)にノートを蓄積*/
                me.target.delete = false;
                context.Notes[r].push(me.target);
                break;
            }
        }
        
        drawProperNote(me.target,r);
        
        /*分割線のハイライトを消す*/
        if(snappedLine)
            snappedLine.alpha = 0.3;
        
        stage.update();
        
        saveNotes();
    }
}
    
function removeNote(e){
    this.delete = true;
    this.parent.removeChild(this);
    stage.update();
    
    saveNotes();
}

function loadRecordAnim(){
    var recordImg = new Image();
    recordImg.onload = recordImgLoaded;
    recordImg.src = "../../images/btn_record_sprite.png";
    
    function recordImgLoaded(){
        var recordSprite = new createjs.SpriteSheet({
            images: [recordImg],
            frames: {widht:133,height:134,regX:67,regY:67},
            animation: {record:[0,2,"record"]}
        });
        
        var bmpAnim = new createjs.BitmapAnimation(recordSprite);
        
    }
}

/*引数には対象のスコアコンテクストを取る*/
function cleanUpNotes(context){
    
    for(var n=context.Notes.length-1; n>=0; n--){
        for(var m=context.Notes[n].length-1; m>=0; m--){
            var theNote = context.Notes[n][m];
            /*deleteプロパティがtrueなら削除*/
            if(theNote.delete == true)
                context.Notes[n].splice(m,1);
            /*x値を整数にする*/
            else
                theNote.x = Math.round(theNote.x);
        }
    }
}

/*前半：x座標が小さい順にソートする
後半: 個々のスコアコンテナの7つの音階それぞれの音符数を取得*/
function sortAndSetMaxIndex(){      
    for(var s=AllScores.length-1; s>=0; s--){
        var Scontainer = AllScores[s];
        for(var i=Scontainer.Notes.length-1; i>=0; i--){
            Scontainer.Notes[i].sort(function(a,b){
                return a.x - b.x;
            });
            lineMaxIndex[s][i] = Scontainer.Notes[i].length;
        }
    }
}

/*引数には対象の音符とコンテクスト*/
function snapToNear(target,context){
    
    for(var l=context.Lines.length-1; l>=0; l--){
        var splitLine = context.Lines[l];
        if(Math.abs(target.x - splitLine.x) < 6){
            target.x = splitLine.x;
            splitLine.alpha = 1;
            snappedLine = splitLine;
            break;
        }
        else{
            splitLine.alpha = 0.3;
        }
    }
}
    
function checkBounds(target){
    //62 814 102 15
    if(target.x < 62)
        target.x = 62;
    else if(target.x > 814)
        target.x = 814;
    if(target.y < 15)
        target.y = 15;
    else if(target.y > 102)
        target.y = 102;
}

function saveNotes(){
    
    require(["dojo/json"],function(JSON){
        
        var storingNote = [{}];
        
        console.log(AllScores);
    
        for(var s=AllScores.length-1; s>=0; s--){ 
            for(var n=AllScores[s].Notes.length-1; n>=0; n--){
                for(var m=AllScores[s].Notes[n].length-1; m>=0; m--){
                    var theNote = AllScores[s].Notes[n][m];
                    /*deleteプロパティがtrueなら削除*/
                    if(theNote.delete == true){
                        AllScores[s].Notes[n].splice(m,1);
                    }else{
                        theNote.x = Math.round(theNote.x);
                        storingNote.push({x:theNote.x, y:theNote.y, ctx:s});
                    }
                }
                
                lineMaxIndex[s][n] = AllScores[s].Notes[n].length;
            }
        }
        
        for(var s=AllScores.length-1; s>=0; s--){
            var Scontainer = AllScores[s];
            for(var i=Scontainer.Notes.length-1; i>=0; i--){
                Scontainer.Notes[i].sort(function(a,b){
                    return a.x - b.x;
                });
                lineMaxIndex[s][i] = Scontainer.Notes[i].length;
            }
        }
        
        if(isCanvasSupported){

            if(!(typeof Scores == "object"))
                Scores = JSON.parse(Scores);
            var date = new Date(),
                dateStr = date.getFullYear()+"/"+date.getMonth()+1+"/"+
                date.getDate()+"\n"+date.getHours()+":"+date.getMinutes();
            storingNote.splice(0,1,{name:titleDom.value,date:dateStr,id:thisId,i:lineMaxIndex});
            Scores.splice(thisId,1,storingNote);
            Scores = JSON.stringify(Scores);
            localStorage.setItem("Scores",Scores);
            console.log("save complete");
        }
    });
    
}
