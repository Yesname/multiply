function mapNumber(num,from,to,mFrom,mTo,interpolation){
					if (interpolation == 'CubeDecel'){
						return mFrom + (mTo - mFrom)*interCubeDecel((num - from)/(to - from));
					} else if (interpolation == 'CubeAccel'){
						return mFrom + (mTo - mFrom)*interCubeAccel((num - from)/(to - from));
					} else {
						return mFrom + (mTo - mFrom)*(num - from)/(to - from);
					};
			};
function mapColor(num,from,to,rs,gs,bs,rf,gf,bf){
			var r = Math.floor(mapNumber(num,from,to,rs,rf));
			var g = Math.floor(mapNumber(num,from,to,gs,gf));
			var b = Math.floor(mapNumber(num,from,to,bs,bf));
			r = r < 0 ? 0 : r > 255 ? 255 : r;
			g = g < 0 ? 0 : g > 255 ? 255 : g;
			b = b < 0 ? 0 : b > 255 ? 255 : b;
			return 'rgba('+r+','+g+','+b+',1)';
	};

function Resource(parent,link){
	//this.parent = parent;
	this.img = new Image();
	this.img.src = link;
	this.img.onload = function(){
		parent.resourcesLoaded++;
		parent.checkIfReady(); 
	};
};

function Cell(parentDW,a,b,weight,timesShown,lastFired,lastTime){
	//this.parent = parent;
	this.a = a;
	this.b = b;
	this.c = a*b;
	this.string = a+' ⋅ '+b+' = '; //⋅×
	this.weight = weight || parentDW;
	this.timesShown = timesShown || 0;
	this.lastFired = lastFired || false;
	this.lastTime = lastTime || false;
};

function CoreM(container,linkArray,saveFunction,loadString){
	this.container = container;
	this.resources = [];
	this.resourcesLoaded = 0;
	this.isReady = false;
	this.saveFunction = saveFunction || function(){};
	this.loadString = loadString || false;

	// Setting up all texts
	this.grades = [
			{
				id : 0,
				header : 'Это таблица умножения',
				text : 'Её нужно запомнить один раз — это сильно упростит жизнь, проблемы уйдут сами собой, а волосы станут мягкими и шелковистыми.<br /> Нужно нажать энтер или ткнуть в экран, если в него можно тыкать.',
				image : false
			},
			{
				id : 1,
				header : 'Уже что-то',
				text : 'Теперь нужно сделать так, чтобы таблица стала зеленой, возможны вкрапления золота.',
				image : false
			},
			{
				id : 2,
				header : 'Похоже, ты уже знаешь таблицу умножения',
				text : 'Теперь нужно научиться считать очень быстро. Меньше трех секунд — хорошо, больше — плохо. Таблица должна стать золотой',
				image : false
			},
			{
				id : 3,
				header : 'Немногие знают таблицу умножения так, как ты',
				text : 'Даже не знаю, что еще можно сказать. Это очень круто. Но есть кое-что еще.',
				image : false
			}

		];

	this.mode = -1;
	this.currentExample = false;
	this.input = '';
	this.totalCount = 10; //Number of examples per streak
	this.count = 0;
	this.combo = 0;
	this.defaultWeight = 100;
	this.grade = 0;
	this.goodTime = 3000; // Answer time without penalty
	this.penalty = 2000; // Adds to the weight if you are wrong
	this.justFired = false;

	// Setting up table with default values
	this.storage = [];
	for (let i=0;i<81;i++){
		this.storage.push(new Cell(this.defaultWeight,Math.floor(i/9) + 1,i%9 + 1));
	};

	//Initializing resources
	if (linkArray){
		for (let i=0;i<linkArray.length;i++){
			this.resources.push(new Resource(this,linkArray[i]));
		}
	} else {
		this.isReady = true;
	}

	//Now adding all entrails
	this.guts = '<div class = "ssmt_half1"><div class = "ssmt_header" style="opacity: 0"><div class = "ssmt_banner"></div><h1 class = "ssmt_headerh1">Это таблица умножения</h1><p class = "ssmt_headertext">Её нужно запомнить один раз — это сильно упростит жизнь, проблемы уйдут сами собой, а волосы станут мягкими и шелковистыми.</p><div class = "ssmt_stats"><p>Примеров решено: <span class = "ssmt_totalCount">0</span></p><p>Комбо без ошибок: <span class = "ssmt_combo">0</span></p><p>Среднее время на ответ: <span class = "ssmt_atime">0</span></p><p>Нелюбимый пример: <span class = "ssmt_worst">0</span></p></div></div></div><div class = "ssmt_half2"><div class = "ssmt_table"></div></div><div class = "ssmt_example">x × y = </div><input class="ssmt_numpad" type="tel">';
	this.container.innerHTML = this.guts;

	//Getting entrails as variables
	this.nodes = [];
	this.nodes.example = document.getElementsByClassName('ssmt_example')[0];
	this.nodes.header = document.getElementsByClassName('ssmt_header')[0];
	this.nodes.table = document.getElementsByClassName('ssmt_table')[0];
	this.nodes.numpad = document.getElementsByClassName('ssmt_numpad')[0];
	this.nodes.half1 = document.getElementsByClassName('ssmt_half1')[0];
	this.nodes.half2 = document.getElementsByClassName('ssmt_half2')[0];

	this.nodes.totalCount = document.getElementsByClassName('ssmt_totalCount')[0];
	this.nodes.combo = document.getElementsByClassName('ssmt_combo')[0];
	this.nodes.aTime = document.getElementsByClassName('ssmt_atime')[0];
	this.nodes.worst = document.getElementsByClassName('ssmt_worst')[0];

	this.nodes.h1 = document.getElementsByClassName('ssmt_headerh1')[0];
	this.nodes.text = document.getElementsByClassName('ssmt_headertext')[0];
	//this.nodes.banner = document.getElementsByClassName('ssmt_banner')[0];

	//Setting up event listeners
	var shitcodeThis = this;
	window.onresize = function(e){
		shitcodeThis.updateLayout();
		console.log('Why are you moving stuff all around?')
	};
	window.addEventListener('keydown',function(e){
		if (shitcodeThis.mode == 1){
			if (e.keyCode <= 57){
				shitcodeThis.acceptKey(e.keyCode - 48);
			} else {
				shitcodeThis.acceptKey(e.keyCode - 96)
			}
		} else if (shitcodeThis.mode == 0 && e.keyCode == 13){
			shitcodeThis.switchMode(1);
		}
	});
	document.body.addEventListener('touchstart',function(){
		if (shitcodeThis.isMobile){
			if (shitcodeThis.mode == 0) {
				shitcodeThis.switchMode(1);
			}
			shitcodeThis.nodes.numpad.focus();
		}
	});
	this.nodes.numpad.addEventListener('blur',function(){
		if (shitcodeThis.isMobile && shitcodeThis.mode == 1){
			shitcodeThis.numpad.focus();
		}
	});

	//Looking for something to load
	if (this.loadString){
		var loadStringJSON = JSON.stringify(loadString);
		localStorage.setItem('MLTPLY', loadStringJSON);
	};

	// Checking if ready to run (probably not yet)
	if (this.isReady) this.run();
};
CoreM.prototype.checkIfReady = function(){
	if (this.resourcesLoaded >= this.resources.length){
		for (let i=0;i<this.grades.length;i++){
			this.grades[i].image = this.resources[i].img
		}
		this.isReady = true;
		console.log('All resources are ready');

		this.run();

	} else {
		console.log('Some resource is ready');
	}
};
CoreM.prototype.run = function(){
	this.deviceSetup();
	this.createCells();
	this.load();
}
CoreM.prototype.createCells = function(){
	for (let i=0; i < this.storage.length; i++){
		var div = document.createElement('div');

		var hint = document.createElement('div');
		hint.className = 'hint';

		div.style.top = Math.floor(i/9) * (100/9) + '%';
		div.style.left = i%9 * (100/9) + '%';
		div.style.width = (100/9)+'%';
		div.style.height = (100/9)+'%';
		
		div.innerHTML = this.storage[i].c;
		div.appendChild(hint);

		this.nodes.table.appendChild(div);
	}
}
CoreM.prototype.updateStats = function(){
	this.updateLayout();

	var totalCount = 0,
		aTime = 0,
		activeExamples = 0,
		worst = {weight:0,string:'Еще не встречался'};

	for (let i=0; i < this.storage.length; i++){
		var div = this.nodes.table.children[i];
		var hint = div.children[0];
		
		// Updating hint texts
		hint.innerHTML = (this.storage[i].string + this.storage[i].c + '<br />') + 
		((this.storage[i].timesShown > 0 ? 'Встречался '+this.storage[i].timesShown + ([2,3,4].indexOf(this.storage[i].timesShown%10) != -1 ? ' раза' : ' раз') : 'Не встречался') + 
		(this.storage[i].timesShown > 0 ? this.storage[i].lastTime > this.goodTime ? '<br />Нужно отвечать быстрее' : this.storage[i].lastTime > this.goodTime/2 ? '<br />Хорошая скорость ответа' : '<br />Отличная скорость ответа' : ''));

		// Updating cell colors
		if (this.storage[i].lastTime){
			if (this.storage[i].weight > this.defaultWeight){
				div.style.background = mapColor(this.storage[i].weight,100,10000,255,214,186,226,6,48);
			} else if (this.storage[i].weight > 1){
				div.style.background = mapColor(this.storage[i].weight,0,100,144,236,123,227,255,208);
			} else {
				div.style.background = 'rgb(255,242,96)';
			}
		} else {
			div.style.background = 'rgb(255,255,255)';
		}
		div.style.opacity = 0;

		totalCount += this.storage[i].timesShown;
		if (this.storage[i].lastTime){
			activeExamples ++;
			aTime += this.storage[i].lastTime;
			if (this.storage[i].weight > worst.weight) {
				worst.weight = this.storage[i].weight;
				worst.string = worst.weight > this.defaultWeight ? this.storage[i].string + '' + this.storage[i].c : 'Все любимые';
			};
		};

	};

	// Calculating text stats
	aTime = activeExamples > 0 ? Math.round(aTime / activeExamples)/1000+' с' : 'Еще не посчиталось'; 
	this.nodes.totalCount.innerHTML = totalCount;
	this.nodes.combo.innerHTML = this.combo;
	this.nodes.aTime.innerHTML = aTime;
	this.nodes.worst.innerHTML = worst.string;

	this.updateGrade();
};
CoreM.prototype.updateGrade = function(){
	var grade2 = true;
	var grade3 = true;
	for (let i=0;i<this.storage.length;i++){
		if (this.storage[i].lastTime && this.storage[i].weight < this.defaultWeight){
			if (this.grade == 0) this.grade = 1;
			if (this.storage[i].weight > 1) grade3 = false; 
		} else {
			grade2 = false;
		};
	};
	if (this.grade==1 && grade2) this.grade = 2;
	if (this.grade==2 && grade3) this.grade = 3;

	
	
	this.nodes.h1.innerHTML = this.grades[this.grade].header;
	this.nodes.text.innerHTML = this.grades[this.grade].text;
	//this.nodes.banner.innerHTML = '';
	//if (this.grades[this.grade].image) this.nodes.banner.appendChild(this.grades[this.grade].image);
};
CoreM.prototype.updateLayout = function(){
	var hRatio = .5;
	var vRatio = .6;
	if (this.container.offsetWidth > this.container.offsetHeight){
		var minSide = Math.min(this.container.offsetWidth * hRatio,this.container.offsetHeight);
		this.nodes.half1.style.width = 100 - hRatio*100 + '%';
		this.nodes.half2.style.left = 100 - hRatio*100 + '%';
		this.nodes.half1.style.top = this.nodes.half2.style.top = this.nodes.half1.style.left = '0';
		this.nodes.half1.style.height = this.container.offsetHeight + 'px';
		this.nodes.half2.style.width = this.nodes.half2.style.height = minSide + 'px'; 
	} else {
		var minSide = Math.min(this.container.offsetHeight * vRatio,this.container.offsetWidth);
		this.nodes.half1.style.height = 100 - vRatio*100 + '%';
		this.nodes.half2.style.top = 100 - vRatio*100 + '%';
		this.nodes.half1.style.top ='0';
		this.nodes.half1.style.width = this.container.offsetWidth + 'px';
		this.nodes.half2.style.width = this.nodes.half2.style.height = this.nodes.half1.style.width = minSide + 'px';
		this.nodes.half2.style.left = this.nodes.half1.style.left = (this.container.offsetWidth - minSide)*.5 + 'px';
	}
};
CoreM.prototype.deviceSetup = function(){
	var isMobile = navigator.userAgent.match(/Android|BlackBerry|iPhone|iPad|iPod|Opera Mini|IEMobile/i) ? true : false;
	if (isMobile){
		this.nodes.example.style.height = '50%';
		this.isMobile = true;
	} else {
		this.isMobile = false;
	}
};
CoreM.prototype.switchMode = function(signal){
	if (this.mode != 0 && signal == 0){
		this.count = 0;
		this.justFired = false;
		this.mode = 0;
		if (this.isMobile) this.nodes.numpad.blur();
		this.updateStats();
		if (this.currentExample){
			this.exampleOut(this.stopHammerTime.bind(this));
		} else {
			this.stopHammerTime();
		}
		
	} else if (this.mode != 1 && signal == 1){
		this.nodes.header.style.marginLeft = '0px';
		//this.nodes.banner.style.marginLeft = '0px';

		alive.animate(this.nodes.banner,'margin-left','-100px',900,'CubeAccel');
		alive.animate(this.nodes.header,'margin-left','-100px',900,'CubeAccel');

		var shitcodeThis = this;
		alive.animate(this.nodes.header,'opacity',0,900,function(){
			shitcodeThis.mode = 1;
			shitcodeThis.fireExample();
		});

		this.dissolveTable();
	};
};
CoreM.prototype.stopHammerTime = function(){
	this.nodes.header.style.marginLeft = '-100px';
	//this.nodes.banner.style.marginLeft = '-100px';
	//alive.animate(this.nodes.banner,'margin-left','0px',900,'CubeDecel');
	alive.animate(this.nodes.header,'margin-left','0px',900,'CubeDecel');
	alive.animate(this.nodes.header,'opacity',1,900);

	var children = this.nodes.table.children;
	for (let i=0; i < children.length; i++){
		alive.animate(children[i],'opacity',1,1200,Math.floor(Math.random()*2000));
	}
};
CoreM.prototype.dissolveTable = function(){
	var children = this.nodes.table.children;
	for (let i=0; i < children.length; i++){
		alive.animate(children[i],'opacity',0,300,Math.floor(Math.random()*600));
	};
};
CoreM.prototype.fireExample = function(){
	var cauldron = [];
	for (let i=0;i<this.storage.length; i++){
		if (this.storage[i] != this.justFired){
			for (let j=0;j<this.storage[i].weight;j++){
				cauldron.push(this.storage[i]);
			}
		}
	}
	var finger = Math.floor(Math.random()*cauldron.length);
	this.input = '';
	this.currentExample = cauldron[finger];
	this.justFired = this.currentExample;
	this.currentExample.timesShown ++;
	this.currentExample.lastFired = Date.now();
	this.nodes.example.innerHTML = this.currentExample.string;

	this.nodes.example.style.marginTop = '20px';
	alive.animate(this.nodes.example,'opacity',1,1000,'CubeDecel');
	alive.animate(this.nodes.example,'margin-top','0px',this.goodTime/2,'CubeDecel');
};
CoreM.prototype.exampleOut = function(endFunction){
	this.nodes.example.style.marginTop = '0px';
	alive.animate(this.nodes.example,'opacity',0,400,'CubeAccel');
	alive.animate(this.nodes.example,'margin-top','-10px',400,endFunction.bind(this),'CubeAccel');
};
CoreM.prototype.flash = function(isCorrect){
		this.nodes.example.style.color = isCorrect ? 'rgb(115,169,68)' : 'rgb(225,9,50)';
		alive.animate(this.nodes.example,'color','rgb(0,0,0)',600,'CubeDecel');
	}
CoreM.prototype.acceptKey = function(key){
	var correct = this.currentExample.c.toString();
	if (key in [1,2,3,4,5,6,7,8,9,0]){
		this.input += key;
		this.nodes.example.innerHTML += key;
	}
	if (this.input.length == correct.length) {
		this.currentExample.lastTime = Date.now() - this.currentExample.lastFired;
		if (this.input == correct){ 	// GOOD
			this.flash(true);
			this.combo ++;
			if (this.currentExample.lastTime <= this.goodTime){
				this.currentExample.weight /= 2;
				if (this.currentExample.lastTime <= this.goodTime / 2){
					this.currentExample.weight -= 4;
					if (this.currentExample.weight < 1) this.currentExample.weight = 1;
				}
			} else {
				this.currentExample.weight += mapNumber(this.currentExample.lastTime,this.goodTime,this.goodTime*5,0,this.penalty);
			}
		} else {						// BAD
			this.flash(false);
			this.combo = 0;
			this.currentExample.weight += this.penalty;		
		};
		this.save();
		this.count ++;
		if (this.count >= this.totalCount){
			this.save(true);
			this.switchMode(0);
		} else {
			this.exampleOut(this.fireExample);
		}
	}
};
CoreM.prototype.save = function(trueSave){
	var saveObj = {
		storage : this.storage,
		grade : this.grade,
		combo : this.combo
	};
	var saveString = JSON.stringify(saveObj);
	localStorage.setItem('MLTPLY', saveString);
	if (trueSave && this.saveFunction) {
		this.saveFunction(saveObj);
	}
};
CoreM.prototype.load = function(){
	var memory = JSON.parse(localStorage.getItem('MLTPLY'));
	
	if (memory){
		this.combo = memory.combo;
		this.grade = memory.grade;
		for (let i=0;i<81;i++){	
			this.storage[i] = new Cell(this.defaultWeight,Math.floor(i/9) + 1,i%9 + 1,memory.storage[i].weight,memory.storage[i].timesShown,memory.storage[i].lastFired,memory.storage[i].lastTime);
		}
		console.log('Loaded data from local storage');
		this.mode = -1;
	};
	this.switchMode(0);
	
};
CoreM.prototype.drop = function(){
	var drop = confirm("Cбросить все результаты и снова стать никем?");
        if (drop) {
            localStorage.clear();
            location.reload();
    	}
};