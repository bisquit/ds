var currentView = "MYSCORES_LIBRARY";

var isCanvasSupported = Modernizr.localstorage;

var libStage, libCanvas;
require(["dojo/query","dojo/dom","dojo/_base/fx","dojo/fx","dojo/fx/easing","dojo/on","dojo/window","dojo/json","dojo/domReady!"],
function(query,dom,baseFx,fx,easing,on,win,JSON){   
        
        /*画面サイズのRectangleを取得*/
        var windowRect = win.getBox(win.doc);
        var sectionMyScore = dom.byId("section_myScore");
        
        windowRect = win.getBox(win.doc);
        sectionMyScore.style.height = windowRect.h - 74 - 100 + "px";
        
    
        /*編集画面およびドラムセット・スニペットを右に隠す*/
        var sectionLib = dom.byId("section_library"),
            sectionEdit = dom.byId("section_edit"),
            drumContainer = dom.byId("drumset_container"),
            snipet = dom.byId("snipet");
        
        sectionEdit.style.left = windowRect.w + "px";
        sectionEdit.style.opacity = 0;
        drumContainer.style.display = "none";
        drumContainer.style.opacity = 0;
        snipet.style.opacity = 0;
        
        
        /*canvas及びlocalstorageのサポートで分岐*/
        /*storageにデータがあれば表示*/
        if(isCanvasSupported){
            console.log("canvas availlable");
            
            getStorageAndUpdate();
            
        }else{
            console.log("not suppot canvas");
        }
        
        /*addScore*/    
        on(dom.byId("btn_addScore"),"click",function(e){
            
            goForwardTransition();
            edit(Scores.length);
        });
        
        function getStorageAndUpdate(){
            try{
                Scores = localStorage.getItem("Scores")? localStorage.getItem("Scores") : [];
                if(!(typeof Scores == "object"))
                    Scores = JSON.parse(Scores);
                console.log(Scores);
            }catch(e){
                console.log(e);
            }
            libUpdate();
        }
        
        function goForwardTransition(){
            
            sectionEdit.style.opacity = 1;
            drumContainer.style.display = "block";
            
            var swipe = fx.combine([
                baseFx.animateProperty({
                    easing: easing.sinOut,
                    duration: 600,
                    node: sectionLib,
                    properties: {
                        left: -windowRect.w,
                        opacity: 0
                    }
                }),
                baseFx.animateProperty({
                    easing: easing.sinOut,
                    duration: 600,
                    node: sectionEdit,
                    properties: {
                        left: windowRect.w * 5 / 100
                    },
                    onEnd: function(){
                        baseFx.fadeIn({ node: dom.byId("btn_back") }).play();
                        baseFx.animateProperty({
                            easing: easing.quadOut,
                            duration: 500,
                            node: drumContainer,
                            properties: {
                                left: { start:windowRect.w/5,
                                        end:0},
                                opacity: 0.7
                            },
                            onEnd: setBackButton
                        }).play();
                        baseFx.animateProperty({
                            duration: 700,
                            node: snipet,
                            properties: {
                                right: { start: -windowRect.w/5,
                                         end: "20px"},
                                opacity: 1
                            }
                        }).play();
                    }
                })
            ]);
            
            swipe.play();
            currentView = "MYSCORES_EDIT";
        }
        
        /*メインメニュー*/ 
        /*on(dom.byId("a_my_scores"),"click",function(e){
            if(currentView != "MYSCORES_LIBRARY"){
                goBackTransition();
                removeAllScores();
                getStorageAndUpdate();
            }
            currentView = "MYSCORES_LIBRARY";
            e.preventDefault();
        });*/
        
        /*ヘルプメニュー*/
        on(dom.byId("a_how"),"click",function(e){
            
            switch(currentView){
                case "MYSCORES_LIBRARY":
                    
                    break;
                case "MYSCORES_EDIT":
                    
                    break;
            }
        });
        
        function setBackButton(){
            /*戻るボタンの設定*/
            on(dom.byId("btn_back"),"click",function(e){
                
                if(currentView != "MYSCORES_LIBRARY"){
                    saveNotes();//戻るボタンでもセーブされる;
                    goBackTransition();//画面遷移;
                    removeAllScores();//編集画面のキャンバスを真っ白にする;
                    getStorageAndUpdate();//ストレージを更新してライブラリ画面をリフレッシュする;
                }
                currentView = "MYSCORES_LIBRARY";
            });
        }
    
        function goBackTransition(){
            sectionLib.style.opacity = 1;
                
                var swipeBack = fx.combine([
                    baseFx.animateProperty({
                        easing: easing.sinOut,
                        duration: 600,
                        node: dom.byId("section_library"),
                        properties: {
                            left: windowRect.w * 5/100
                        }
                    }),
                    baseFx.animateProperty({
                        easing: easing.sinOut,
                        duration: 600,
                        node: sectionEdit,
                        properties: {
                            left: windowRect.w,
                            opacity: 0
                        },
                        onEnd: function(){
                            baseFx.fadeOut({ node: dom.byId("btn_back") }).play();
                            drumContainer.style.left = windowRect.w/5 + "px";
                            drumContainer.style.opacity = 0;
                            drumContainer.style.display = "none";
                            snipet.style.right = "-20px";
                            snipet.style.opacity = 0;
                        }
                    })
                ]);
                
                window.scrollTo(0,0);
                swipeBack.play();
        }
        
        function libUpdate(){
            require(["dojo/dom","dojo/dom-construct","dojo/dom-attr"],function(dom,domConst,domAttr){
                if(libStage && libStage.canvas)
                    libStage.clear();
                
                /*最初の一回だけ実行される*/
                if(!libCanvas){
                    libCanvas = domConst.create("canvas",{
                                width: 831, height: 1, id:"libCanvas"
                            },dom.byId("section_library"),"first");
                    
                }else{
                    /*myScoreセクションとcanvasを初期の大きさを戻す*/
                    var myScore = dom.byId("section_myScore");
                    myScore.style.height = win.getBox(win.doc).h + "px;"
                    
                    domAttr.set("libCanvas","height",1);
                }
                
                console.log(libCanvas);
                /*こちらも最初の一回のみ上が実行される*/
                if(!libStage){
                    libStage = new createjs.Stage(libCanvas);
                }else{
                    /*canvasを再設定*/
                    libStage.canvas = libCanvas;
                }
                    
                libStage.enableMouseOver();//高負荷なのですぐに解除する;
                console.log("libStage was created");
                
                /*一旦すべて削除する*/
                libStage.removeAllChildren();
                
                for(var i=0,colX=0,rowY=0; i<Scores.length; i++,colX++){
                    
                    var libContainer = new createjs.Container();
                    
                    var info = Scores[i][0];
                    if(i%5 == 0){
                        rowY++;
                        colX = 0;
                        var myScore = dom.byId("section_myScore");
                        var newHeight = parseInt(myScore.style.height) + 180;
                        myScore.style.height = newHeight + "px";
                        var canvasHeight = domAttr.get("libCanvas","height");
                        domAttr.set("libCanvas","height",+canvasHeight+180);
                        /*canvasを再設定*/
                        libStage.canvas = libCanvas;
                    }
                    
                    var libCircle = new createjs.Shape();
                    libCircle.graphics.beginFill("#ffde8d");
                    libCircle.graphics.drawCircle(0,0,70);
                    libCircle.x = -35;
                    libCircle.y = -35;
                    libContainer.addChild(libCircle);
                    
                    var param = new createjs.Text();
                    param.text = info.name + "\n" + info.date;
                    param.font = "bold 19px 'khmer UI'";
                    param.color = "#ff7d1a";
                    param.textAlign = "end";
                    param.x = 18;
                    param.y = -53;
                    libContainer.addChild(param);
                    
                    libContainer.x = 105 + colX*170;
                    libContainer.y = 105 + (rowY-1) * 200;
                    libContainer.id = info.id;
                    
                    libStage.addChild(libContainer);
                    
                    libContainer.onClick = function(){
                        goForwardTransition();
                        edit(this.id);
                    };
                    
                    //libContainer.onPress = dragScoreData;
                    var deleteBtn, timeoutId;
                    
                    libContainer.onMouseOver = function(e){
                        document.body.style.cursor = "pointer";
                        console.log(this);
                        var self = this;
                        
                        if(deleteBtn != null){
                            libStage.removeChild(deleteBtn);
                            libStage.update();
                            deleteBtn = null;
                        }
                        timeoutId = setTimeout(function(){
                            var id = self.id;
                            deleteBtn = createDeleteBtn(self.x,self.y);
                            libStage.addChild(deleteBtn);
                            deleteBtn.onClick = function(e){
                                console.log(Scores);
                                for(var s=0; s<Scores.length; s++){
                                    if(Scores[s][0].id == id){
                                        console.log("match");
                                        Scores.splice(s,1);
                                        Scores = JSON.stringify(Scores);
                                        localStorage.setItem("Scores",Scores);
                                        Scores = JSON.parse(Scores);
                                        libUpdate();
                                        return;
                                    }
                                }
                            };
                            libStage.update();
                        },1000);
                    };
                    
                    libContainer.onMouseOut = function(e){
                        document.body.style.cursor = "";
                        clearTimeout(timeoutId);
                    };
                    
                }
                
                libStage.update();
        
            });
        }
        
        function createDeleteBtn(bx,by){
            var btnContainer = new createjs.Container();
            
            var roundBtn = new createjs.Shape();
            roundBtn.graphics.beginFill("#fed");
            roundBtn.graphics.drawRoundRect(-2,0,55,20,3);
            roundBtn.alpha = 0.5;
            btnContainer.addChild(roundBtn);
            
            var txt = new createjs.Text("Delete?");
            txt.font = "bold 15px 'khmer UI'";
            txt.alpha = 0.6;
            btnContainer.addChild(txt);
            
            btnContainer.x = bx;
            btnContainer.y = by +40;
            btnContainer.alpha = 0.7;
            btnContainer.onMouseOver = function(){
                document.body.style.cursor = "pointer";
                btnContainer.alpha = 1;
                libStage.update();
            };
            btnContainer.onMouseOut = function(){
                document.body.style.cursor = "";
                btnContainer.alpha = 0.7;
                libStage.update();
            };
            return btnContainer;
        }
        /*スコアデータをプレスしてドラッグ可能にする*/
        /*function dragScoreData(e){
             
            e.onMouseMove = function(me){
                
                e.target.x = me.stageX;
                e.target.y = me.stageY;
                
                libStage.update();
            };
            
        }*/
        
        /*編集画面のすべてのスコアとオプションボタンを削除*/
        function removeAllScores(){
            require(["dojo/dom","dojo/dom-attr","dojo/dom-construct","dojo/query"],function(dom,domAttr,domConst,query){
                
                var max = AllScores.length; //=Options.length;
                
                lineMaxIndex = null;
                lineMaxIndex = [];
                lmi = 0;
                
                /*再生中だったら止めておく*/
                if(playing)
                    scrollHead();
                
                for(var i=max-1; i>=0; i--){
                    /*スコアをきれいに削除*/
                    AllScores[i].removeAllChildren();
                    stage.removeChild(AllScores[i]);
                    AllScores[i] = null;
                    AllScores.splice(i,1);
                    /*optionボタンを削除*/
                    var optionsList = query(".option_area");
                    domConst.destroy(optionsList[i]);
                    AllOptions.splice(i,1);
                }
                
                domAttr.set(canvas,"height",150);
                /*canvasを再設定*/
                stage.canvas = canvas;
                
                var myScore = dom.byId("section_myScore");
                myScore.style.height = win.getBox(win.doc).h + "px";
            });
        }
        
        window.scrollTo(0,0);
});



require(["dojo/dnd/Moveable","dojo/query","dojo/domReady!"],
    function(Moveable,query){
        query(".draggable").forEach(function(node){
            var dnd = new Moveable(node, {
                delay:20
            });
        });
});