class Core {

	constructor(vessel, exhaust, intake){

		this.vessel = vessel;
		this.isMobile = navigator.userAgent.match(/Android|BlackBerry|iPhone|iPad|iPod|Opera Mini|IEMobile/i) ? true : false;

		this.problems = [];
		this.problemStats = false;
		this.cells = [];
		this.help = false;
		this.helpShown = false;
		this.helpClosed = false;
		this.exhaust = exhaust || false;
		this.intake = intake || false;

		this.levelId = 0;
		this.levels = [

			{	
				id: 0,
				header: 'Часть I',
				description: '<h1>Таблица умножения</h1><p>Её нужно запомнить один раз — это сильно упростит жизнь, проблемы уйдут сами собой, а волосы станут мягкими и шелковистыми.</p><p>Лучший способо запомнить — решать задачи. Когда на экране появится что-то вроде <b>5 ⋅ 2 =</b>, просто введи на клавиатуре ответ <b>10</b>.</p><p>Жми enter или бесячую стрелку в правом нижнем углу экрана, как только соберешься с духом.</p><h2>Чтобы перейти ко второй части нужно:</h2><ul><li>Решить все примеры правильно</li><li>Исправить те, что решены неправильно</li></ul>',
				streak: 5,
				normal: false,
				variance: false,
				getProgress: function(){
					let total = this.problems.length;
					let complete = 0;
					for (let i = 0; i < this.problems.length; i++){
						if (this.problems[i].weight < 1) complete++;
					}
					return complete / total;
				}.bind(this)
			},
			{	
				id: 1,
				header: 'Часть II',
				description: '<h1>Всё круто</h1><p>Теперь ты во второй части! В каждом заходе будет по 10 примеров, а на результат влияет время решения. Если твоя реакция — норм, то беспокоиться не о чем.</p><h2>Чтобы перейти к третьей части нужно:</h2><ul><li>Продолжать решать примеры правильно</li><li>Укладываться в 5 секунд на ответ</li></ul>',
				streak: 10,
				normal: 5000,
				variance: false,
				getProgress: function(){
					let total = 0;
					for (let i = 0; i < this.problems.length; i++){
						total += this.problems[i].weight;
					}
					return Math.min(8.1 / total, 1);
				}.bind(this)
			},
			{	
				id: 2,
				header: 'Часть III',
				description: '<h1>Феноменально!</h1><p>Ты в части 3. Теперь нужно решать быстрее трех секунд. А еще появятся хитрые примеры.</p><h2>Чтобы перейти к четвёртой части нужно:</h2><ul><li>Ничего. Это пока последняя часть.</li></ul>',
				streak: 10,
				normal: 3000,
				variance: true,
				getProgress: function(){
					return 0;
				}.bind(this)
			}

		];

		this.prizes = {
			c1: {name: 'Было несложно', description: 'Открыть первую часть', unlocked: false, check: function(){return this.levelId >= 0 ? true : false}.bind(this), source: 'p01.png'},
			c2: {name: 'Как-то мрачненько', description: 'Открыть вторую часть', unlocked: false, check: function(){return this.levelId >= 1 ? true : false}.bind(this), source: 'p02.png'},
			c3: {name: 'Уже всё?', description: 'Открыть третью часть', unlocked: false, check: function(){return this.levelId >= 2 ? true : false}.bind(this), source: 'p03.png'},
			total100: {name: 'Соточка', description: 'Решить сто примеров', unlocked: false, check: function(){return this.total >= 100 ? true : false}.bind(this), source: 'p04.png'},
			total1000: {name: 'Штука', description: 'Решить тысячу примеров', unlocked: false, check: function(){return this.total >= 1000 ? true : false}.bind(this), source: 'p04.png'},
			total10000: {name: 'Зад. Рот.', description: 'Решить десять тысяч примеров', unlocked: false, check: function(){return this.total >= 10000 ? true : false}.bind(this), source: 'p04.png'},
			combo100: {name: 'Комбо', description: 'Решить 100 примеров подряд без ошибок', unlocked: false, check: function(){return this.combo >= 100 ? true : false}.bind(this), source: 'p05.png'},
			combo250: {name: 'Бруталити', description: 'Решить 250 примеров подряд без ошибок.', unlocked: false, check: function(){return this.combo >= 250 ? true : false}.bind(this), source: 'p04.png'},
			combo500: {name: 'Ботаналити', description: 'Решить 500 примеров подряд без ошибок.', unlocked: false, check: function(){return this.combo >= 500 ? true : false}.bind(this), source: 'p04.png'},
			fast2: {name: 'Я робот', description: 'Решать примеры быстрее чем за 2 секунды', unlocked: false, check: function(){return this.average != 0 && this.average <= 2000 ? true : false}.bind(this), source: 'p06.png'},
			wait5: {name: 'Всё лень', description: 'Тупить 5 минут, не запуская игру', unlocked: false, check: function(){return false}.bind(this), source: 'p05.png'},
			enter10: {name: 'Профи', description: 'Запустить игру энтером 10 раз', unlocked: false, check: function(){return this.enterCombo >= 10 ? true : false}.bind(this), source: 'p04.png'},
			fast05: {name: 'Судорога', description: 'Решить пример верно менее чем за полсекунды', unlocked: false, check: function(){return false}.bind(this), source: 'p07.png'},
			false10: {name: 'Так себе достижение', description: 'Ошибиться десять раз подряд', unlocked: false, check: function(){return this.falseCombo >= 10 ? true : false}.bind(this), source: 'p04.png'}
		};

		this.mode = false;
		this.ready = false;
		this.combo = 0;
		this.total = 0;
		this.progressFraction = 0;
		this.enterCombo = 0;
		this.falseCombo = 0;

		// this.mainSet = [[58,15,110,255],[140,40,129,255],[221,73,104,255],[253,158,108,255],[251,251,190,255]];
		this.mainSet = [[178,255,215,1],[116,223,91,1],[249,204,58,1],[246,53,94,1]];
		
		this.zeroCurrent();
		this.loadProgress();
		this.updateLevel(this.levelId);
		this.generateProblems();
		this.generateBlah();
		this.generateGrid();
		this.generateHelp();
		this.switchMode('lobby');
		this.setListeners();
		
	}

	generateHelp(){

		this.help = document.createElement('div');
		this.help.classList.add('help');
		if (this.helpShown && !this.helpClosed) this.closeHelp();
		this.help.innerHTML = this.level.description;
		this.applyHelpClose();
		this.vessel.appendChild(this.help);

		this.help.addEventListener('click',()=>{

			if (this.helpClosed) {
				this.openHelp();
			}

		});

	}

	applyHelpClose(){

		let closeButton = document.createElement('div');
		closeButton.classList.add('closehelp');
		closeButton.innerHTML = 'Всё ясно!<div class="hint"></div>';
		this.help.appendChild(closeButton);
		closeButton.addEventListener('click',(e)=>{
			e.stopPropagation();
			this.closeHelp();
			this.saveProgress();
		});

	}

	closeHelp(){

		this.help.classList.add('closed');
		this.helpShown = true;
		this.helpClosed = true;

	}

	openHelp(){

		this.help.classList.remove('closed');
		setTimeout(()=>{
			this.helpClosed = false;
		},300);

	}

	updateLevel(lvl) {

		this.levelId = lvl;
		this.level = this.levels[lvl];
		this.streak = this.level.streak;
		this.normal = this.level.normal;
		this.progressFraction = this.level.getProgress();
		if (this.help) {
			this.help.innerHTML = this.level.description;
			this.applyHelpClose();
			if (this.helpClosed) this.openHelp();
		};

		//SHADOW
		if (this.levelId === 1) {
			this.vessel.classList.add('shadow');
			document.body.classList.add('bodyShadow');
		} else if (this.levelId === 2) {
			this.vessel.classList.add('vivid');
			document.body.classList.add('bodyVivid');
		}

	}

	setListeners() {

		if (this.isMobile){

			this.numpad = document.createElement('input');
			this.numpad.classList.add('numpad');
			this.numpad.setAttribute('type', 'tel');
			document.body.appendChild(this.numpad);

			this.numpad.addEventListener('blur', () => {
				if (this.mode === 'game' && this.isMobile){
					this.numpad.focus();
				}
			});

			this.numpad.addEventListener('input', (e) => {
				if (this.mode === 'game'){
					if (!isNaN(+e.data) && e.data.length === 1){
						this.acceptDigit(e.data);
					}
					
				}
			});

		}

		this.button.addEventListener('click', () => {
			this.switchMode('game');
		});
		this.vessel.addEventListener('click', (e) => {
			if (!this.helpClosed) {
				this.closeHelp();
			}
		});

		if (!this.isMobile){
			window.addEventListener('keypress', (e) => {
				if (this.mode === 'lobby' && e.keyCode === 13){
					this.enterCombo++;
					this.switchMode('game');
				} else if (e.keyCode >= 48 && e.keyCode <= 57 && this.ready) {
					this.acceptDigit(e.keyCode - 48);
				} else if (this.mode === 'lobby' && (e.keyCode === 97 || e.keyCode === 1092)) {
					this.showAverage();
				} else if (this.mode === 'lobby' && (e.keyCode === 99 || e.keyCode === 1089)) {
					this.showErrors();
				} 
			});
			window.addEventListener('keydown', (e) => {
				if (this.mode === 'lobby' && e.keyCode === 27) {
					if (this.helpClosed) this.openHelp(); else this.closeHelp();
				}
			});
		}

	}

	acceptDigit(n) {

		this.currentAnswer += n;
		this.updateProblemString();

		if (this.currentAnswer.length === this.currentProblem.answers[this.variant].length){
			
			this.ready = false;
			let time = window.performance.now() - this.fireStamp;

			//LAST 5 AVERAGE
			this.currentProblem.lastFires.push(time);
			if (this.currentProblem.lastFires.length > 5) this.currentProblem.lastFires.shift();
			let total = 0;
			for (let i = 0; i < this.currentProblem.lastFires.length; i++){
				total += this.currentProblem.lastFires[i];
			}
			this.currentProblem.stats.averageTime = total / this.currentProblem.lastFires.length;

			if (this.currentAnswer === this.currentProblem.answers[this.variant]){

				//Lightning baje & falseCombo
				if (time <= 500) this.prizes.fast05.unlocked = true;
				this.falseCombo = 0;

				this.currentProblem.stats.corrects++;

				this.currentProblem.weight *= .5;
				let timeBuff = 0;
				if (this.level.normal) timeBuff = time - this.level.normal >= 0 ? Math.min((time - this.level.normal) / (this.level.normal * 4) * 20, 20) : time < this.level.normal * .5 ? this.currentProblem.weight * -.25 : 0;
				this.currentProblem.weight += timeBuff;
				
				if (this.currentProblem.trail) {
					this.currentProblem.trail.weight *= .75;
					// this.currentProblem.trail.weight += timeBuff * .5;
				}

				this.combo++;
				this.hideProblem(true);

			} else {

				this.falseCombo++;
				this.currentProblem.weight += 20;
				if (this.currentProblem.trail) this.currentProblem.trail.weight += 5;
				this.combo = 0;
				this.hideProblem(false);

			}

			if (this.currentStreak < this.streak){
				this.throwProblem();	
			} else {
				setTimeout(()=>{
					this.switchMode('lobby');
					this.saveProgress();
				}, 600);
				
			}
			

		}
		
	}

	updateProblemString(){

		this.currentProblem.html.innerHTML = this.variant === 0 ? this.currentProblem.variants[this.variant][0] + this.currentAnswer : this.variant === 1 ? this.currentProblem.variants[this.variant][0] + this.currentAnswer + this.currentProblem.variants[this.variant][1] : this.currentAnswer + this.currentProblem.variants[this.variant][1];

	}

	switchMode(mode){

		if (mode === 'lobby' && this.mode !== 'lobby'){

			this.progressFraction = this.level.getProgress();

			//PRE CONGRATULATIONS
			if (this.progressFraction >= 1) this.updateLevel(this.levelId + 1);

			this.updateBlah();
			this.assembleLobby();
			this.mode = 'lobby';
			this.zeroCurrent();
			if (this.numpad && this.isMobile) this.numpad.blur();

			//5 MIN
			this.idleTimer = setTimeout(()=>{
				this.prizes.wait5.unlocked = true;
				this.updatePrizes();
				this.saveProgress();
			},300000);

		} else if (mode === 'game' && this.mode !== 'game'){

			this.dissolveLobby();
			this.mode = 'game';
			this.throwProblem();
			if (this.isMobile) this.numpad.focus();

			clearTimeout(this.idleTimer);

		}

	}

	checkPrizes(){

		for (let i in this.prizes){
			if (!this.prizes[i].done && this.prizes[i].check()) this.prizes[i].unlocked = true;

		}

	}

	zeroCurrent(){

		this.currentProblem = false;
		this.currentAnswer = '';
		this.variant = false;
		this.lastProblemId = false;
		this.currentStreak = 0;
		this.fireStamp = false;

	}

	throwProblem() {

		this.currentStreak++;
		this.currentProblem = this.pickProblem();
		this.currentProblem.stats.times++;
		this.lastProblemId = this.currentProblem.id;
		this.currentAnswer = '';
		this.variant = this.level.variance ? Math.floor(Math.random()*3) : 0;

		setTimeout(()=>{
			this.currentProblem.html = document.createElement('div');
			this.currentProblem.html.classList.add('problem');
			this.currentProblem.html.innerHTML = this.currentProblem.variants[this.variant][0] + ' ' + this.currentProblem.variants[this.variant][1];
			this.vessel.appendChild(this.currentProblem.html);
		},300);

		setTimeout(()=>{
			this.currentProblem.html.style.transform = 'translate(0,0)';
			this.currentProblem.html.style.opacity = 1;
			this.ready = true;
			this.fireStamp = window.performance.now();
		},350);

	}

	pickProblem(){

		let random = Math.random();
		let total = 0;
		let base = 0;

		for (let i = 0; i < this.problems.length; i++){
			if (this.problems[i].id !== this.lastProblemId) total += this.problems[i].weight;
		}

		for (let i = 0; i < this.problems.length; i++){
			
			if (this.problems[i].id !== this.lastProblemId){
				if (random >= base && random < base + this.problems[i].weight / total){
					return this.problems[i];
				}
				base += this.problems[i].weight / total;
			}

		}

	}

	hideProblem(isCorrect) {

		if (isCorrect){

			this.currentProblem.html.style.color = '#2EAF6C';
			this.currentProblem.html.style.transition = 'transform .3s .3s ease-out, opacity .31s .3s ease-out, color .5s ease';
			this.currentProblem.html.style.transform = 'translate(0,-3rem)';
			this.currentProblem.html.style.opacity = 0;

		} else {

			this.currentProblem.html.style.color = '#CF2E2E';
			this.currentProblem.html.style.transition = 'transform .3s .3s ease-out, opacity .31s .3s ease-out, color .5s ease';
			this.currentProblem.html.style.transform = 'scale(.1)';
			this.currentProblem.html.style.opacity = 0;

		}

		this.currentProblem.html.addEventListener('transitionend',(e)=>{
			if (e.propertyName === 'opacity') this.vessel.removeChild(e.target);
		});

	}

	dissolveLobby(){

		if (!this.helpClosed) this.closeHelp();
		this.dissolveGrid();
		this.dissolveBlah();

	}

	assembleLobby(){

		this.assembleGrid();
		this.assembleBlah();

	}

	assembleBlah(){

		this.header.style.opacity = 1;
		this.statLine.style.opacity = 1;
		this.button.style.opacity = 1;
		this.prizeBlock.style.opacity = 1;

		this.header.style.transform = 'translate(0,0)';
		this.statLine.style.transform = 'translate(0,0)';
		this.button.style.transform = 'translate(0,0)';
		this.prizeBlock.style.transform = 'translate(0,0)';

	}

	dissolveBlah(){

		this.header.style.opacity = 0;
		this.statLine.style.opacity = 0;
		this.button.style.opacity = 0;
		this.prizeBlock.style.opacity = 0;

		this.header.style.transform = 'translate(0, -2rem)';
		this.statLine.style.transform = 'translate(0, -2rem)';
		this.button.style.transform = 'translate(0, 2rem)';
		this.prizeBlock.style.transform = 'translate(0, -2rem)';

	}

	assembleGrid() {

		for (let i = 0; i < this.cells.length; i++){

			if (this.problems[i].weight < 1){
				this.cells[i].style.background = this.getColor(this.mainSet, 1 - this.problems[i].weight); //'rgba(46, 175, 108, '+ Math.min(1 - this.problems[i].weight, 1) +')';
			} else {
				this.cells[i].style.background = 'rgba(0, 0, 0, '+ Math.min(this.problems[i].weight / 100, 1)*.9 +')'
			}
			

			this.cells[i].style.transitionDelay = Math.floor(Math.random()*600) + 'ms';
			this.cells[i].style.transform = 'scale(1)';

		}

	}

	dissolveGrid() {

		for (let i = 0; i < this.cells.length; i++){

			this.cells[i].style.transitionDelay = Math.floor(Math.random()*300) + 'ms';
			this.cells[i].style.transform = 'scale(0)';

		}

	}

	generateBlah(){

		this.blah = document.createElement('div');
		this.blah.classList.add('blah');
		this.header = document.createElement('h1');
		this.header.classList.add('chapter');
		this.statLine = document.createElement('div');
		this.statLine.classList.add('statline');
		this.button = document.createElement('div');
		this.button.classList.add('button');
		if (this.isMobile) this.button.classList.add('b_mobile');
		if (!this.prizes.enter10.unlocked && !this.isMobile){
			this.hint = document.createElement('div');
			this.hint.classList.add('hint');
			this.button.appendChild(this.hint);
		}

		let statComboWrap = document.createElement('div');
		let statTotalWrap = document.createElement('div');
		let statAverageWrap = document.createElement('div');
		this.statCombo = document.createElement('div');
		this.statTotal = document.createElement('div');
		this.statAverage = document.createElement('div');
		let statComboLabel = document.createElement('p');
		let statTotalLabel = document.createElement('p');
		let statAverageLabel = document.createElement('p');
		statComboLabel.innerHTML = 'подряд';
		statTotalLabel.innerHTML = 'пройдено';
		statAverageLabel.innerHTML = 'реакция';
		this.progressBar = document.createElement('div');
		this.progressBar.classList.add('progressbar');
		this.progress = document.createElement('div');
		this.progress.classList.add('progress');
		this.subprogress = document.createElement('div');
		this.progressBar.appendChild(this.subprogress);
		this.progressBar.appendChild(this.progress);

		statComboWrap.appendChild(this.statCombo);
		statTotalWrap.appendChild(this.statTotal);
		statAverageWrap.appendChild(this.statAverage);
		statComboWrap.appendChild(statComboLabel);
		statTotalWrap.appendChild(statTotalLabel);
		statAverageWrap.appendChild(statAverageLabel);
		this.statLine.appendChild(this.progressBar);
		this.statLine.appendChild(statTotalWrap);
		this.statLine.appendChild(statComboWrap);
		this.statLine.appendChild(statAverageWrap);

		this.prizeBlock = this.generatePrizes();

		this.blah.appendChild(this.header);
		this.blah.appendChild(this.statLine);
		this.blah.appendChild(this.prizeBlock);
		this.vessel.appendChild(this.blah);

	}

	generatePrizes(){

		let block = document.createElement('div');
		block.classList.add('vanity');
		this.prizeCells = {};

		for (let i in this.prizes){

			let prize = document.createElement('div');
			prize.classList.add('prize', 'locked');
			let img = document.createElement('img');
			img.setAttribute('src', 'assets/lock.png');
			img.style.transitionDelay = Math.floor(Math.random() * 300) + 'ms';
			prize.appendChild(img);
			let hint = document.createElement('div');
			hint.innerHTML = '<h1>???</h1><p>'+ this.prizes[i].description + '</p>';
			this.prizeCells[i] = prize;
			prize.appendChild(hint);
			block.appendChild(prize);

		}

		return block;

	}

	updateBlah(){

		this.total = 0;
		this.average = 0;
		let notZero = 0;
		for (let i = 0; i < this.problems.length; i++){
			this.total += this.problems[i].stats.times;
			this.average += this.problems[i].stats.averageTime;
			notZero += this.problems[i].stats.averageTime === 0 ? 0 : 1;
		}
		this.average /= notZero === 0 ? 1 : notZero;

		this.header.innerHTML = this.level.header;
		this.statCombo.innerHTML = this.combo;
		this.statTotal.innerHTML = this.total;
		let reactionTime = Math.round(this.average / 100) / 10;
		this.statAverage.innerHTML = '<nobr title="'+reactionTime+' сек.">' + this.getReactionString(reactionTime) + '</nobr>';
		this.progress.style.width = this.subprogress.style.width = this.progressFraction * 100 + '%';



		this.checkPrizes();
		this.updatePrizes();

	}

	getReactionString(s) {
		// return s;
		return s >= 5 ? 'так себе' : s >= 3 ? 'нормальная' : s >= 2 ? 'хорошая' : s >= 1 ? 'супер' : s > 0 ? 'феноменальная' : '—';
	}

	updatePrizes(){

		for (let i in this.prizes){
			if (!this.prizes[i].done && this.prizes[i].unlocked) {
				this.prizeCells[i].innerHTML = '';
				let img = document.createElement('img');
				img.setAttribute('src', 'assets/' + this.prizes[i].source);
				img.style.transitionDelay = Math.floor(Math.random() * 300) + 'ms';
				this.prizeCells[i].appendChild(img);
				let hint = document.createElement('div');
				hint.innerHTML = '<h1>'+ this.prizes[i].name +'</h1><p>'+ this.prizes[i].description + '</p>';
				this.prizeCells[i].appendChild(hint);
				this.prizes[i].done = true;
				this.prizeCells[i].classList.remove('locked');
				setTimeout(()=>{
					this.prizeCells[i].classList.add('unlocked');
				}, 600);
			};

		}

	}

	generateGrid(){

		this.gridWrap = document.createElement('div');
		this.grid = document.createElement('div');
		this.grid.classList.add('grid');
		this.gridWrap.classList.add('gridWrap');

		for (let i = 0; i < this.problems.length; i++){

			let cell = document.createElement('div');
			// let cellHint = document.createElement('div');
			cell.classList.add('cell');
			// cellHint.classList.add('cellhint');
			cell.innerHTML = this.problems[i].c;
			// cellHint.innerHTML = '<nobr>' + this.problems[i].variants[0][0] + this.problems[i].c + '</nobr>';
			cell.style.top = (this.problems[i].a - 1) * 100 / 9 + '%';
			cell.style.left = (this.problems[i].b - 1) * 100 / 9 + '%';
			// cell.appendChild(cellHint);
			this.grid.appendChild(cell);
			this.cells.push(cell);

		}

		this.gridWrap.appendChild(this.grid);
		this.vessel.appendChild(this.gridWrap);
		this.vessel.appendChild(this.button);

		this.updateGridSize();

		window.addEventListener('resize', ()=>{
			this.updateGridSize();
		});

	}

	generateProblems(){

		for (let a = 1; a < 10; a++){

			for (let b = 1; b < 10; b++){

				this.problems.push(new Problem(a, b, this));
				if (this.problemStats){
					this.problems[this.problems.length - 1].weight = this.problemStats[this.problems.length - 1].weight;
					this.problems[this.problems.length - 1].lastFires = this.problemStats[this.problems.length - 1].lastFires;
					this.problems[this.problems.length - 1].stats = this.problemStats[this.problems.length - 1].stats;
				}

			}

		}
		this.generateTrails();

	}

	generateTrails(){
		for (let i = 0; i < 81; i++){

			for (let j = i; j < 81; j++){

				if (this.problems[i].trailId === this.problems[j].id) this.problems[i].setTrail(this.problems[j]);

			}

		}
	}

	updateGridSize(){

		let w = this.gridWrap.clientWidth * .8;
		let h = this.gridWrap.clientHeight * .8;

		let square = Math.min(w, h);
		square -= square % 9;

		this.grid.style.width = square + 'px';
		this.grid.style.height = square + 'px';

		if (this.blah) {

			let padding = Math.floor((this.gridWrap.clientHeight * .8 - square) / 2);
			this.blah.style.paddingTop = padding + 'px';

		}

	}

	showAverage() {

		let max = 0;
		for (let i = 0; i < this.cells.length; i++){
			max = Math.max(max, this.problems[i].stats.averageTime);
		}
		for (let i = 0; i < this.cells.length; i++){
			if (this.problems[i].stats.averageTime) {
				this.cells[i].style.background = 'rgba(32, 68, 214, '+ (max - this.problems[i].stats.averageTime)/max +')';
			} else {
				this.cells[i].style.background = 'none';
			}	
		}

	}

	showErrors() {

		let max = 0;
		for (let i = 0; i < this.cells.length; i++){
			max = Math.max(max, this.problems[i].stats.times - this.problems[i].stats.corrects)
		}
		for (let i = 0; i < this.cells.length; i++){
			if (this.problems[i].stats.times - this.problems[i].stats.corrects > 0){
				this.cells[i].style.background = 'rgba(214, 32, 68, '+ (this.problems[i].stats.times - this.problems[i].stats.corrects) / max +')';
			} else {
				this.cells[i].style.background = 'none';
			}
		}

	}

	saveProgress() {

		let essence = [];
		let prizes = [];
		for (let i = 0; i < this.problems.length; i++){
			essence.push({weight: this.problems[i].weight, lastFires: this.problems[i].lastFires, stats: this.problems[i].stats});
		}
		for (let i in this.prizes){
			if (this.prizes[i].unlocked) prizes.push(i);
		}

		let save = {
			problemStats: essence,
			combo: this.combo,
			levelId: this.level.id,
			helpShown: this.helpShown,
			prizes: prizes
		};

		let gem = JSON.stringify(save);
		if (this.exhaust) this.exhaust(gem);
		localStorage.setItem('MultiplyIII', gem);

	}

	loadProgress() {
		let load = this.intake ? JSON.parse(this.intake) : JSON.parse(localStorage.getItem('MultiplyIII'));

		if (load) {

			this.combo = load.combo;
			this.levelId = load.levelId;
			this.problemStats = load.problemStats;
			this.helpShown = load.helpShown;

			for (let i = 0; i < load.prizes.length; i++){

				this.prizes[load.prizes[i]].unlocked = true;

			}

		}

	}

	getColor(set, fraction){

		let log = Math.exp(fraction * Math.log(100)) / 100;
		if (log > 1) log = 1;

		let interval = 1 / (set.length - 1);
		let part = Math.floor(log / interval);
		let subfraction = log % interval;

		if (part === set.length - 1){
			let last = set[set.length - 1];
			return 'rgba('+last[0]+','+last[1]+','+last[2]+','+last[3]+')';
		} else {

			let from = set[part];
			let to = set[part + 1];

			let r = Math.floor(from[0] + (to[0] - from[0]) * subfraction);
			let g = Math.floor(from[1] + (to[1] - from[1]) * subfraction);
			let b = Math.floor(from[2] + (to[2] - from[2]) * subfraction);
			let a = from[3] + (to[3] - from[3]) * subfraction || 1;

			return 'rgba('+r+','+g+','+b+','+a+')';

		}

	}

	drop(){
		let drop = confirm('Все сбросится. Все достижения пропадут. Как будто ничего и не делалось. Солнце потухнет. Точно начать всё заново?');
		if (drop) {
			localStorage.setItem('MultiplyIII',false);
			location.reload();
		}

	}

}

class Problem {

	constructor(a, b, core){

			this.core = core;

			this.a = a;
			this.b = b;
			this.c = a * b;

			this.id = (this.a + 66 * this.b) * (this.c + 666);
			this.trailId = (this.b + 66 * this.a) * (this.c + 666) === this.id ? false : (this.b + 66 * this.a) * (this.c + 666);
			this.trail = false;

			this.variants = [
				[a + ' ⋅ ' + b + ' = ', ''],
				[a + ' ⋅ ', ' = ' + this.c],
				['', ' ⋅ ' + b + ' = ' + this.c]
			];
			this.answers = [
				this.c.toString(),
				this.b.toString(),
				this.a.toString()
			];

			this.weight = 1;
			this.lastFires = [];
			this.stats = {
				times: 0,
				corrects: 0,
				averageTime: 0
			}

			this.html = false;

	}

	setTrail(problem){

		if (problem.id === this.trailId && this.trail !== problem){
			this.trail = problem;
			problem.trail = this;
		}

	}

}