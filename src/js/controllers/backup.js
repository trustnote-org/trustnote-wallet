'use strict';

angular.module('trustnoteApp.controllers').controller('wordsController', function ($rootScope, $scope, $timeout, profileService, go, gettext, gettextCatalog, confirmDialog, notification, $log, isCordova, storageService) {

	var msg = gettextCatalog.getString('Are you sure you want to delete the backup words?');
	var successMsg = gettext('Backup words deleted');
	var self = this;
	self.show = false;
	var fc = profileService.focusedClient;
	var reg = new RegExp(/^[a-z]+$/);

// 更改代码 iOS客户端 不显示全备份
	if (typeof (window.cordova) == 'undefined') {
		this.isIOS = false;
	} else {
		this.isIOS = window.cordova.platformId;
	}


// 更改代码
	self.step = 'show_waring';

	self.delseed = false;

	self.gono00 = function () { self.step = 'show_jietu00'; };

	self.gono = function () { self.step = 'show_jietu'; };

	self.showword = function () { self.step = 'show_word'; };

	self.showinput = function () { self.step = 'show_input'; };

	self.del = function () { self.delseed = !self.delseed; };

	self.gorukou2 = function () { self.step = 'rukou2'; };

	self.dis = function () { return self.value == fc.getMnemonic() ? false : true };


	//self.mnemonic1 = 'lll'
	// self.arrStr = [self.mnemonic1, self.mnemonic2, self.mnemonic3, self.mnemonic4, self.mnemonic5, self.mnemonic6, self.mnemonic7, self.mnemonic8, self.mnemonic9, self.mnemonic10, self.mnemonic11, self.mnemonic12];
	// self.addStr = function (e) {
	// 	var inputList = document.getElementsByClassName('inptMnemonic2');
	// 	inputList[0].focus();
	// 	inputList[0].value = e;
    //
	// 	function aaa() {
	// 		return self.arrStr[0] = e;
	// 	}
	// 	aaa();
    //
	// 	console.log(self.arrStr[0])
	// };

	self.value = "";

	self.items = [];

	self.m1 = 0;

	self.num = -1;

	self.jumpNum = 1;
	self.jumpNext = function () {
		window.clearTimeout(self.t)
		var inputList = document.getElementsByClassName('inptMnemonic2');
		if(self.jumpNum == 12){
			return;
		}else{
			self.t = setTimeout(function () {
				inputList[self.jumpNum].focus();
				self.jumpNum++;
			},100);
		}
	};


// 点击提示列表 隐藏Ul and 清空self.items
	self.hideUlclearItems = function () {
		self.m1 = 0;
		self.items = [];
		self.strMnemonic();
		self.jumpNext();
	};

// input框中 内容变化时 触发对应函数
	self.funReg1 = function () {
		self.items = []
		self.m1 = self.jumpNum = 1;

		if(reg.test(self.mnemonic1)){
			self.str = self.mnemonic1;
			self.funReg();
			self.strMnemonic();
			self.compare();
		}
	};
	self.funReg2 = function () {
		self.items = []
		self.m1 = self.jumpNum = 2;

		if(reg.test(self.mnemonic2)){
			self.str = self.mnemonic2;
			self.funReg();
			self.strMnemonic();
			self.compare();
		}
	};
	self.funReg3 = function () {
		self.items = []
		self.m1 = self.jumpNum = 3;

		if(reg.test(self.mnemonic3)){
			self.str = self.mnemonic3;
			self.funReg();
			self.strMnemonic();
			self.compare();
		}
	};
	self.funReg4 = function () {
		self.items = []
		self.m1 = self.jumpNum = 4;

		if(reg.test(self.mnemonic4)){
			self.str = self.mnemonic4;
			self.funReg();
			self.strMnemonic();
			self.compare();
		}
	};
	self.funReg5 = function () {
		self.items = []
		self.m1 = self.jumpNum = 5;

		if(reg.test(self.mnemonic5)){
			self.str = self.mnemonic5;
			self.funReg();
			self.strMnemonic();
			self.compare();
		}
	};
	self.funReg6 = function () {
		self.items = []
		self.m1 = self.jumpNum = 6;

		if(reg.test(self.mnemonic6)){
			self.str = self.mnemonic6;
			self.funReg();
			self.strMnemonic();
			self.compare();
		}
	};
	self.funReg7 = function () {
		self.items = []
		self.m1 = self.jumpNum = 7;

		if(reg.test(self.mnemonic7)){
			self.str = self.mnemonic7;
			self.funReg();
			self.strMnemonic();
			self.compare();
		}
	};
	self.funReg8 = function () {
		self.items = []
		self.m1 = self.jumpNum = 8;

		if(reg.test(self.mnemonic8)){
			self.str = self.mnemonic8;
			self.funReg();
			self.strMnemonic();
			self.compare();
		}
	};
	self.funReg9 = function () {
		self.items = []
		self.m1 = self.jumpNum = 9;

		if(reg.test(self.mnemonic9)){
			self.str = self.mnemonic9;
			self.funReg();
			self.strMnemonic();
			self.compare();
		}
	};
	self.funReg10 = function () {
		self.items = []
		self.m1 = self.jumpNum = 10;

		if(reg.test(self.mnemonic10)){
			self.str = self.mnemonic10;
			self.funReg();
			self.strMnemonic();
			self.compare();
		}
	};
	self.funReg11 = function () {
		self.items = []
		self.m1 = self.jumpNum = 11;

		if(reg.test(self.mnemonic11)){
			self.str = self.mnemonic11;
			self.funReg();
			self.strMnemonic();
			self.compare();
		}
	};
	self.funReg12 = function () {
		self.items = []
		self.m1 = self.jumpNum = 12;

		if(reg.test(self.mnemonic12)){
			self.str = self.mnemonic12;
			self.funReg();
			self.strMnemonic();
			self.compare();
		}
	};

// 拼接12个助记词
	self.strMnemonic = function () {
		return 	self.value = self.mnemonic1 + ' ' + self.mnemonic2 + ' ' + self.mnemonic3 + ' ' + self.mnemonic4 + ' ' + self.mnemonic5  + ' ' + self.mnemonic6  + ' ' + self.mnemonic7  + ' ' + self.mnemonic8  + ' ' + self.mnemonic9  + ' ' + self.mnemonic10  + ' ' + self.mnemonic11 + ' ' + self.mnemonic12;
	};
// 判断全部输入正确后 ul列表要隐藏
	self.compare = function () {
		if(self.value == fc.getMnemonic()){
			self.m1 = 0;
		}
	};
// input输入框中 处理键盘事件
	self.handleKeyboard = function (e) {
		// 方向键控制选择 提示词
		if(e.keyCode == 40 || e.keyCode == 32){
			if(self.num >= self.items.length - 1){
				self.num = 0;
				//console.log('提示列表长度 = ' + self.items.length);
				//console.log('self.num = ' + self.num)
			}else{
				self.num++;
				//console.log('self.num = ' + self.num)
			}
			//self.mnemonic1 += self.items[self.num]
		}
		if(e.keyCode == 38){
			if(self.num == 0){
				self.num = self.items.length - 1;
			}else{
				self.num--;
			}
		}
	};

	// 12个 input 方向键 处理
	self.handleKeyboard1 = function (e) {
		self.handleKeyboard(e);
		// 回车键 选择候选词
		if(e.keyCode == 13){
			if(self.num == -1){return}
			self.m1 = 0;
			self.mnemonic1 += self.items[self.num];
			//console.log(self.num)
			self.num = -1;
			self.jumpNext();
		}
		self.strMnemonic();

	};
	self.handleKeyboard2 = function (e) {
		self.handleKeyboard(e);
		// 回车键 选择候选词
		if(e.keyCode == 13){
			if(self.num == -1){return}
			self.m1 = 0;
			self.mnemonic2 += self.items[self.num];
			self.num = -1;
			self.jumpNext();
		}
		self.strMnemonic();
	};
	self.handleKeyboard3 = function (e) {
		self.handleKeyboard(e);
		// 回车键 选择候选词
		if(e.keyCode == 13){
			if(self.num == -1){return}
			self.m1 = 0;
			self.mnemonic3 += self.items[self.num];
			self.num = -1;
			self.jumpNext();
		}
		self.strMnemonic();
	};
	self.handleKeyboard4 = function (e) {
		self.handleKeyboard(e);
		// 回车键 选择候选词
		if(e.keyCode == 13){
			if(self.num == -1){return}
			self.m1 = 0;
			self.mnemonic4 += self.items[self.num];
			self.num = -1;
			self.jumpNext();
		}
		self.strMnemonic();
	};
	self.handleKeyboard5 = function (e) {
		self.handleKeyboard(e);
		// 回车键 选择候选词
		if(e.keyCode == 13){
			if(self.num == -1){return}
			self.m1 = 0;
			self.mnemonic5 += self.items[self.num];
			self.num = -1;
			self.jumpNext();
		}
		self.strMnemonic();
	};
	self.handleKeyboard6 = function (e) {
		self.handleKeyboard(e);
		// 回车键 选择候选词
		if(e.keyCode == 13){
			if(self.num == -1){return}
			self.m1 = 0;
			self.mnemonic6 += self.items[self.num];
			self.num = -1;
			self.jumpNext();
		}
		self.strMnemonic();
	};
	self.handleKeyboard7 = function (e) {
		self.handleKeyboard(e);
		// 回车键 选择候选词
		if(e.keyCode == 13){
			if(self.num == -1){return}
			self.m1 = 0;
			self.mnemonic7 += self.items[self.num];
			self.num = -1;
			self.jumpNext();
		}
		self.strMnemonic();
	};
	self.handleKeyboard8 = function (e) {
		self.handleKeyboard(e);
		// 回车键 选择候选词
		if(e.keyCode == 13){
			if(self.num == -1){return}
			self.m1 = 0;
			self.mnemonic8 += self.items[self.num];
			self.num = -1;
			self.jumpNext();
		}
		self.strMnemonic();
	};
	self.handleKeyboard9 = function (e) {
		self.handleKeyboard(e);
		// 回车键 选择候选词
		if(e.keyCode == 13){
			if(self.num == -1){return}
			self.m1 = 0;
			self.mnemonic9 += self.items[self.num];
			self.num = -1;
			self.jumpNext();
		}
		self.strMnemonic();
	};
	self.handleKeyboard10 = function (e) {
		self.handleKeyboard(e);
		// 回车键 选择候选词
		if(e.keyCode == 13){
			if(self.num == -1){return}
			self.m1 = 0;
			self.mnemonic10 += self.items[self.num];
			self.num = -1;
			self.jumpNext();
		}
		self.strMnemonic();
	};
	self.handleKeyboard11 = function (e) {
		self.handleKeyboard(e);
		// 回车键 选择候选词
		if(e.keyCode == 13){
			if(self.num == -1){return}
			self.m1 = 0;
			self.mnemonic11 += self.items[self.num];
			self.num = -1;
			self.jumpNext();
		}
		self.strMnemonic();
	};
	self.handleKeyboard12 = function (e) {
		self.handleKeyboard(e);
		// 回车键 选择候选词
		if(e.keyCode == 13){
			if(self.num == -1){return}
			self.m1 = 0;
			self.mnemonic12 += self.items[self.num];
			self.num = -1;
			self.jumpNext();
		}
		self.strMnemonic();
	};



// 定义提示框内容
	self.funReg = function () {
		self.num = -1;
		var mnemonic = ['abandon', 'ability', 'able', 'about', 'above', 'absent', 'absorb', 'abstract', 'absurd', 'abuse', 'access', 'accident', 'account', 'accuse', 'achieve', 'acid', 'acoustic', 'acquire', 'across', 'act', 'action', 'actor', 'actress', 'actual', 'adapt', 'add', 'addict', 'address', 'adjust', 'admit', 'adult', 'advance', 'advice', 'aerobic', 'affair', 'afford', 'afraid', 'again', 'age', 'agent', 'agree', 'ahead', 'aim', 'air', 'airport', 'aisle', 'alarm', 'album', 'alcohol', 'alert', 'alien', 'all', 'alley', 'allow', 'almost', 'alone', 'alpha', 'already', 'also', 'alter', 'always', 'amateur', 'amazing', 'among', 'amount', 'amused', 'analyst', 'anchor', 'ancient', 'anger', 'angle', 'angry', 'animal', 'ankle', 'announce', 'annual', 'another', 'answer', 'antenna', 'antique', 'anxiety', 'any', 'apart', 'apology', 'appear', 'apple', 'approve', 'april', 'arch', 'arctic', 'area', 'arena', 'argue', 'arm', 'armed', 'armor', 'army', 'around', 'arrange', 'arrest', 'arrive', 'arrow', 'art', 'artefact', 'artist', 'artwork', 'ask', 'aspect', 'assault', 'asset', 'assist', 'assume', 'asthma', 'athlete', 'atom', 'attack', 'attend', 'attitude', 'attract', 'auction', 'audit', 'august', 'aunt', 'author', 'auto', 'autumn', 'average', 'avocado', 'avoid', 'awake', 'aware', 'away', 'awesome', 'awful', 'awkward', 'axis', 'baby', 'bachelor', 'bacon', 'badge', 'bag', 'balance', 'balcony', 'ball', 'bamboo', 'banana', 'banner', 'bar', 'barely', 'bargain', 'barrel', 'base', 'basic', 'basket', 'battle', 'beach', 'bean', 'beauty', 'because', 'become', 'beef', 'before', 'begin', 'behave', 'behind', 'believe', 'below', 'belt', 'bench', 'benefit', 'best', 'betray', 'better', 'between', 'beyond', 'bicycle', 'bid', 'bike', 'bind', 'biology', 'bird', 'birth', 'bitter', 'black', 'blade', 'blame', 'blanket', 'blast', 'bleak', 'bless', 'blind', 'blood', 'blossom', 'blouse', 'blue', 'blur', 'blush', 'board', 'boat', 'body', 'boil', 'bomb', 'bone', 'bonus', 'book', 'boost', 'border', 'boring', 'borrow', 'boss', 'bottom', 'bounce', 'box', 'boy', 'bracket', 'brain', 'brand', 'brass', 'brave', 'bread', 'breeze', 'brick', 'bridge', 'brief', 'bright', 'bring', 'brisk', 'broccoli', 'broken', 'bronze', 'broom', 'brother', 'brown', 'brush', 'bubble', 'buddy', 'budget', 'buffalo', 'build', 'bulb', 'bulk', 'bullet', 'bundle', 'bunker', 'burden', 'burger', 'burst', 'bus', 'business', 'busy', 'butter', 'buyer', 'buzz', 'cabbage', 'cabin', 'cable', 'cactus', 'cage', 'cake', 'call', 'calm', 'camera', 'camp', 'can', 'canal', 'cancel', 'candy', 'cannon', 'canoe', 'canvas', 'canyon', 'capable', 'capital', 'captain', 'car', 'carbon', 'card', 'cargo', 'carpet', 'carry', 'cart', 'case', 'cash', 'casino', 'castle', 'casual', 'cat', 'catalog', 'catch', 'category', 'cattle', 'caught', 'cause', 'caution', 'cave', 'ceiling', 'celery', 'cement', 'census', 'century', 'cereal', 'certain', 'chair', 'chalk', 'champion', 'change', 'chaos', 'chapter', 'charge', 'chase', 'chat', 'cheap', 'check', 'cheese', 'chef', 'cherry', 'chest', 'chicken', 'chief', 'child', 'chimney', 'choice', 'choose', 'chronic', 'chuckle', 'chunk', 'churn', 'cigar', 'cinnamon', 'circle', 'citizen', 'city', 'civil', 'claim', 'clap', 'clarify', 'claw', 'clay', 'clean', 'clerk', 'clever', 'click', 'client', 'cliff', 'climb', 'clinic', 'clip', 'clock', 'clog', 'close', 'cloth', 'cloud', 'clown', 'club', 'clump', 'cluster', 'clutch', 'coach', 'coast', 'coconut', 'code', 'coffee', 'coil', 'coin', 'collect', 'color', 'column', 'combine', 'come', 'comfort', 'comic', 'common', 'company', 'concert', 'conduct', 'confirm', 'congress', 'connect', 'consider', 'control', 'convince', 'cook', 'cool', 'copper', 'copy', 'coral', 'core', 'corn', 'correct', 'cost', 'cotton', 'couch', 'country', 'couple', 'course', 'cousin', 'cover', 'coyote', 'crack', 'cradle', 'craft', 'cram', 'crane', 'crash', 'crater', 'crawl', 'crazy', 'cream', 'credit', 'creek', 'crew', 'cricket', 'crime', 'crisp', 'critic', 'crop', 'cross', 'crouch', 'crowd', 'crucial', 'cruel', 'cruise', 'crumble', 'crunch', 'crush', 'cry', 'crystal', 'cube', 'culture', 'cup', 'cupboard', 'curious', 'current', 'curtain', 'curve', 'cushion', 'custom', 'cute', 'cycle', 'dad', 'damage', 'damp', 'dance', 'danger', 'daring', 'dash', 'daughter', 'dawn', 'day', 'deal', 'debate', 'debris', 'decade', 'december', 'decide', 'decline', 'decorate', 'decrease', 'deer', 'defense', 'define', 'defy', 'degree', 'delay', 'deliver', 'demand', 'demise', 'denial', 'dentist', 'deny', 'depart', 'depend', 'deposit', 'depth', 'deputy', 'derive', 'describe', 'desert', 'design', 'desk', 'despair', 'destroy', 'detail', 'detect', 'develop', 'device', 'devote', 'diagram', 'dial', 'diamond', 'diary', 'dice', 'diesel', 'diet', 'differ', 'digital', 'dignity', 'dilemma', 'dinner', 'dinosaur', 'direct', 'dirt', 'disagree', 'discover', 'disease', 'dish', 'dismiss', 'disorder', 'display', 'distance', 'divert', 'divide', 'divorce', 'dizzy', 'doctor', 'document', 'dog', 'doll', 'dolphin', 'domain', 'donate', 'donkey', 'donor', 'door', 'dose', 'double', 'dove', 'draft', 'dragon', 'drama', 'drastic', 'draw', 'dream', 'dress', 'drift', 'drill', 'drink', 'drip', 'drive', 'drop', 'drum', 'dry', 'duck', 'dumb', 'dune', 'during', 'dust', 'dutch', 'duty', 'dwarf', 'dynamic', 'eager', 'eagle', 'early', 'earn', 'earth', 'easily', 'east', 'easy', 'echo', 'ecology', 'economy', 'edge', 'edit', 'educate', 'effort', 'egg', 'eight', 'either', 'elbow', 'elder', 'electric', 'elegant', 'element', 'elephant', 'elevator', 'elite', 'else', 'embark', 'embody', 'embrace', 'emerge', 'emotion', 'employ', 'empower', 'empty', 'enable', 'enact', 'end', 'endless', 'endorse', 'enemy', 'energy', 'enforce', 'engage', 'engine', 'enhance', 'enjoy', 'enlist', 'enough', 'enrich', 'enroll', 'ensure', 'enter', 'entire', 'entry', 'envelope', 'episode', 'equal', 'equip', 'era', 'erase', 'erode', 'erosion', 'error', 'erupt', 'escape', 'essay', 'essence', 'estate', 'eternal', 'ethics', 'evidence', 'evil', 'evoke', 'evolve', 'exact', 'example', 'excess', 'exchange', 'excite', 'exclude', 'excuse', 'execute', 'exercise', 'exhaust', 'exhibit', 'exile', 'exist', 'exit', 'exotic', 'expand', 'expect', 'expire', 'explain', 'expose', 'express', 'extend', 'extra', 'eye', 'eyebrow', 'fabric', 'face', 'faculty', 'fade', 'faint', 'faith', 'fall', 'false', 'fame', 'family', 'famous', 'fan', 'fancy', 'fantasy', 'farm', 'fashion', 'fat', 'fatal', 'father', 'fatigue', 'fault', 'favorite', 'feature', 'february', 'federal', 'fee', 'feed', 'feel', 'female', 'fence', 'festival', 'fetch', 'fever', 'few', 'fiber', 'fiction', 'field', 'figure', 'file', 'film', 'filter', 'final', 'find', 'fine', 'finger', 'finish', 'fire', 'firm', 'first', 'fiscal', 'fish', 'fit', 'fitness', 'fix', 'flag', 'flame', 'flash', 'flat', 'flavor', 'flee', 'flight', 'flip', 'float', 'flock', 'floor', 'flower', 'fluid', 'flush', 'fly', 'foam', 'focus', 'fog', 'foil', 'fold', 'follow', 'food', 'foot', 'force', 'forest', 'forget', 'fork', 'fortune', 'forum', 'forward', 'fossil', 'foster', 'found', 'fox', 'fragile', 'frame', 'frequent', 'fresh', 'friend', 'fringe', 'frog', 'front', 'frost', 'frown', 'frozen', 'fruit', 'fuel', 'fun', 'funny', 'furnace', 'fury', 'future', 'gadget', 'gain', 'galaxy', 'gallery', 'game', 'gap', 'garage', 'garbage', 'garden', 'garlic', 'garment', 'gas', 'gasp', 'gate', 'gather', 'gauge', 'gaze', 'general', 'genius', 'genre', 'gentle', 'genuine', 'gesture', 'ghost', 'giant', 'gift', 'giggle', 'ginger', 'giraffe', 'girl', 'give', 'glad', 'glance', 'glare', 'glass', 'glide', 'glimpse', 'globe', 'gloom', 'glory', 'glove', 'glow', 'glue', 'goat', 'goddess', 'gold', 'good', 'goose', 'gorilla', 'gospel', 'gossip', 'govern', 'gown', 'grab', 'grace', 'grain', 'grant', 'grape', 'grass', 'gravity', 'great', 'green', 'grid', 'grief', 'grit', 'grocery', 'group', 'grow', 'grunt', 'guard', 'guess', 'guide', 'guilt', 'guitar', 'gun', 'gym', 'habit', 'hair', 'half', 'hammer', 'hamster', 'hand', 'happy', 'harbor', 'hard', 'harsh', 'harvest', 'hat', 'have', 'hawk', 'hazard', 'head', 'health', 'heart', 'heavy', 'hedgehog', 'height', 'hello', 'helmet', 'help', 'hen', 'hero', 'hidden', 'high', 'hill', 'hint', 'hip', 'hire', 'history', 'hobby', 'hockey', 'hold', 'hole', 'holiday', 'hollow', 'home', 'honey', 'hood', 'hope', 'horn', 'horror', 'horse', 'hospital', 'host', 'hotel', 'hour', 'hover', 'hub', 'huge', 'human', 'humble', 'humor', 'hundred', 'hungry', 'hunt', 'hurdle', 'hurry', 'hurt', 'husband', 'hybrid', 'ice', 'icon', 'idea', 'identify', 'idle', 'ignore', 'ill', 'illegal', 'illness', 'image', 'imitate', 'immense', 'immune', 'impact', 'impose', 'improve', 'impulse', 'inch', 'include', 'income', 'increase', 'index', 'indicate', 'indoor', 'industry', 'infant', 'inflict', 'inform', 'inhale', 'inherit', 'initial', 'inject', 'injury', 'inmate', 'inner', 'innocent', 'input', 'inquiry', 'insane', 'insect', 'inside', 'inspire', 'install', 'intact', 'interest', 'into', 'invest', 'invite', 'involve', 'iron', 'island', 'isolate', 'issue', 'item', 'ivory', 'jacket', 'jaguar', 'jar', 'jazz', 'jealous', 'jeans', 'jelly', 'jewel', 'job', 'join', 'joke', 'journey', 'joy', 'judge', 'juice', 'jump', 'jungle', 'junior', 'junk', 'just', 'kangaroo', 'keen', 'keep', 'ketchup', 'key', 'kick', 'kid', 'kidney', 'kind', 'kingdom', 'kiss', 'kit', 'kitchen', 'kite', 'kitten', 'kiwi', 'knee', 'knife', 'knock', 'know', 'lab', 'label', 'labor', 'ladder', 'lady', 'lake', 'lamp', 'language', 'laptop', 'large', 'later', 'latin', 'laugh', 'laundry', 'lava', 'law', 'lawn', 'lawsuit', 'layer', 'lazy', 'leader', 'leaf', 'learn', 'leave', 'lecture', 'left', 'leg', 'legal', 'legend', 'leisure', 'lemon', 'lend', 'length', 'lens', 'leopard', 'lesson', 'letter', 'level', 'liar', 'liberty', 'library', 'license', 'life', 'lift', 'light', 'like', 'limb', 'limit', 'link', 'lion', 'liquid', 'list', 'little', 'live', 'lizard', 'load', 'loan', 'lobster', 'local', 'lock', 'logic', 'lonely', 'long', 'loop', 'lottery', 'loud', 'lounge', 'love', 'loyal', 'lucky', 'luggage', 'lumber', 'lunar', 'lunch', 'luxury', 'lyrics', 'machine', 'mad', 'magic', 'magnet', 'maid', 'mail', 'main', 'major', 'make', 'mammal', 'man', 'manage', 'mandate', 'mango', 'mansion', 'manual', 'maple', 'marble', 'march', 'margin', 'marine', 'market', 'marriage', 'mask', 'mass', 'master', 'match', 'material', 'math', 'matrix', 'matter', 'maximum', 'maze', 'meadow', 'mean', 'measure', 'meat', 'mechanic', 'medal', 'media', 'melody', 'melt', 'member', 'memory', 'mention', 'menu', 'mercy', 'merge', 'merit', 'merry', 'mesh', 'message', 'metal', 'method', 'middle', 'midnight', 'milk', 'million', 'mimic', 'mind', 'minimum', 'minor', 'minute', 'miracle', 'mirror', 'misery', 'miss', 'mistake', 'mix', 'mixed', 'mixture', 'mobile', 'model', 'modify', 'mom', 'moment', 'monitor', 'monkey', 'monster', 'month', 'moon', 'moral', 'more', 'morning', 'mosquito', 'mother', 'motion', 'motor', 'mountain', 'mouse', 'move', 'movie', 'much', 'muffin', 'mule', 'multiply', 'muscle', 'museum', 'mushroom', 'music', 'must', 'mutual', 'myself', 'mystery', 'myth', 'naive', 'name', 'napkin', 'narrow', 'nasty', 'nation', 'nature', 'near', 'neck', 'need', 'negative', 'neglect', 'neither', 'nephew', 'nerve', 'nest', 'net', 'network', 'neutral', 'never', 'news', 'next', 'nice', 'night', 'noble', 'noise', 'nominee', 'noodle', 'normal', 'north', 'nose', 'notable', 'note', 'nothing', 'notice', 'novel', 'now', 'nuclear', 'number', 'nurse', 'nut', 'oak', 'obey', 'object', 'oblige', 'obscure', 'observe', 'obtain', 'obvious', 'occur', 'ocean', 'october', 'odor', 'off', 'offer', 'office', 'often', 'oil', 'okay', 'old', 'olive', 'olympic', 'omit', 'once', 'one', 'onion', 'online', 'only', 'open', 'opera', 'opinion', 'oppose', 'option', 'orange', 'orbit', 'orchard', 'order', 'ordinary', 'organ', 'orient', 'original', 'orphan', 'ostrich', 'other', 'outdoor', 'outer', 'output', 'outside', 'oval', 'oven', 'over', 'own', 'owner', 'oxygen', 'oyster', 'ozone', 'pact', 'paddle', 'page', 'pair', 'palace', 'palm', 'panda', 'panel', 'panic', 'panther', 'paper', 'parade', 'parent', 'park', 'parrot', 'party', 'pass', 'patch', 'path', 'patient', 'patrol', 'pattern', 'pause', 'pave', 'payment', 'peace', 'peanut', 'pear', 'peasant', 'pelican', 'pen', 'penalty', 'pencil', 'people', 'pepper', 'perfect', 'permit', 'person', 'pet', 'phone', 'photo', 'phrase', 'physical', 'piano', 'picnic', 'picture', 'piece', 'pig', 'pigeon', 'pill', 'pilot', 'pink', 'pioneer', 'pipe', 'pistol', 'pitch', 'pizza', 'place', 'planet', 'plastic', 'plate', 'play', 'please', 'pledge', 'pluck', 'plug', 'plunge', 'poem', 'poet', 'point', 'polar', 'pole', 'police', 'pond', 'pony', 'pool', 'popular', 'portion', 'position', 'possible', 'post', 'potato', 'pottery', 'poverty', 'powder', 'power', 'practice', 'praise', 'predict', 'prefer', 'prepare', 'present', 'pretty', 'prevent', 'price', 'pride', 'primary', 'print', 'priority', 'prison', 'private', 'prize', 'problem', 'process', 'produce', 'profit', 'program', 'project', 'promote', 'proof', 'property', 'prosper', 'protect', 'proud', 'provide', 'public', 'pudding', 'pull', 'pulp', 'pulse', 'pumpkin', 'punch', 'pupil', 'puppy', 'purchase', 'purity', 'purpose', 'purse', 'push', 'put', 'puzzle', 'pyramid', 'quality', 'quantum', 'quarter', 'question', 'quick', 'quit', 'quiz', 'quote', 'rabbit', 'raccoon', 'race', 'rack', 'radar', 'radio', 'rail', 'rain', 'raise', 'rally', 'ramp', 'ranch', 'random', 'range', 'rapid', 'rare', 'rate', 'rather', 'raven', 'raw', 'razor', 'ready', 'real', 'reason', 'rebel', 'rebuild', 'recall', 'receive', 'recipe', 'record', 'recycle', 'reduce', 'reflect', 'reform', 'refuse', 'region', 'regret', 'regular', 'reject', 'relax', 'release', 'relief', 'rely', 'remain', 'remember', 'remind', 'remove', 'render', 'renew', 'rent', 'reopen', 'repair', 'repeat', 'replace', 'report', 'require', 'rescue', 'resemble', 'resist', 'resource', 'response', 'result', 'retire', 'retreat', 'return', 'reunion', 'reveal', 'review', 'reward', 'rhythm', 'rib', 'ribbon', 'rice', 'rich', 'ride', 'ridge', 'rifle', 'right', 'rigid', 'ring', 'riot', 'ripple', 'risk', 'ritual', 'rival', 'river', 'road', 'roast', 'robot', 'robust', 'rocket', 'romance', 'roof', 'rookie', 'room', 'rose', 'rotate', 'rough', 'round', 'route', 'royal', 'rubber', 'rude', 'rug', 'rule', 'run', 'runway', 'rural', 'sad', 'saddle', 'sadness', 'safe', 'sail', 'salad', 'salmon', 'salon', 'salt', 'salute', 'same', 'sample', 'sand', 'satisfy', 'satoshi', 'sauce', 'sausage', 'save', 'say', 'scale', 'scan', 'scare', 'scatter', 'scene', 'scheme', 'school', 'science', 'scissors', 'scorpion', 'scout', 'scrap', 'screen', 'script', 'scrub', 'sea', 'search', 'season', 'seat', 'second', 'secret', 'section', 'security', 'seed', 'seek', 'segment', 'select', 'sell', 'seminar', 'senior', 'sense', 'sentence', 'series', 'service', 'session', 'settle', 'setup', 'seven', 'shadow', 'shaft', 'shallow', 'share', 'shed', 'shell', 'sheriff', 'shield', 'shift', 'shine', 'ship', 'shiver', 'shock', 'shoe', 'shoot', 'shop', 'short', 'shoulder', 'shove', 'shrimp', 'shrug', 'shuffle', 'shy', 'sibling', 'sick', 'side', 'siege', 'sight', 'sign', 'silent', 'silk', 'silly', 'silver', 'similar', 'simple', 'since', 'sing', 'siren', 'sister', 'situate', 'six', 'size', 'skate', 'sketch', 'ski', 'skill', 'skin', 'skirt', 'skull', 'slab', 'slam', 'sleep', 'slender', 'slice', 'slide', 'slight', 'slim', 'slogan', 'slot', 'slow', 'slush', 'small', 'smart', 'smile', 'smoke', 'smooth', 'snack', 'snake', 'snap', 'sniff', 'snow', 'soap', 'soccer', 'social', 'sock', 'soda', 'soft', 'solar', 'soldier', 'solid', 'solution', 'solve', 'someone', 'song', 'soon', 'sorry', 'sort', 'soul', 'sound', 'soup', 'source', 'south', 'space', 'spare', 'spatial', 'spawn', 'speak', 'special', 'speed', 'spell', 'spend', 'sphere', 'spice', 'spider', 'spike', 'spin', 'spirit', 'split', 'spoil', 'sponsor', 'spoon', 'sport', 'spot', 'spray', 'spread', 'spring', 'spy', 'square', 'squeeze', 'squirrel', 'stable', 'stadium', 'staff', 'stage', 'stairs', 'stamp', 'stand', 'start', 'state', 'stay', 'steak', 'steel', 'stem', 'step', 'stereo', 'stick', 'still', 'sting', 'stock', 'stomach', 'stone', 'stool', 'story', 'stove', 'strategy', 'street', 'strike', 'strong', 'struggle', 'student', 'stuff', 'stumble', 'style', 'subject', 'submit', 'subway', 'success', 'such', 'sudden', 'suffer', 'sugar', 'suggest', 'suit', 'summer', 'sun', 'sunny', 'sunset', 'super', 'supply', 'supreme', 'sure', 'surface', 'surge', 'surprise', 'surround', 'survey', 'suspect', 'sustain', 'swallow', 'swamp', 'swap', 'swarm', 'swear', 'sweet', 'swift', 'swim', 'swing', 'switch', 'sword', 'symbol', 'symptom', 'syrup', 'system', 'table', 'tackle', 'tag', 'tail', 'talent', 'talk', 'tank', 'tape', 'target', 'task', 'taste', 'tattoo', 'taxi', 'teach', 'team', 'tell', 'ten', 'tenant', 'tennis', 'tent', 'term', 'test', 'text', 'thank', 'that', 'theme', 'then', 'theory', 'there', 'they', 'thing', 'this', 'thought', 'three', 'thrive', 'throw', 'thumb', 'thunder', 'ticket', 'tide', 'tiger', 'tilt', 'timber', 'time', 'tiny', 'tip', 'tired', 'tissue', 'title', 'toast', 'tobacco', 'today', 'toddler', 'toe', 'together', 'toilet', 'token', 'tomato', 'tomorrow', 'tone', 'tongue', 'tonight', 'tool', 'tooth', 'top', 'topic', 'topple', 'torch', 'tornado', 'tortoise', 'toss', 'total', 'tourist', 'toward', 'tower', 'town', 'toy', 'track', 'trade', 'traffic', 'tragic', 'train', 'transfer', 'trap', 'trash', 'travel', 'tray', 'treat', 'tree', 'trend', 'trial', 'tribe', 'trick', 'trigger', 'trim', 'trip', 'trophy', 'trouble', 'truck', 'true', 'truly', 'trumpet', 'trust', 'truth', 'try', 'tube', 'tuition', 'tumble', 'tuna', 'tunnel', 'turkey', 'turn', 'turtle', 'twelve', 'twenty', 'twice', 'twin', 'twist', 'two', 'type', 'typical', 'ugly', 'umbrella', 'unable', 'unaware', 'uncle', 'uncover', 'under', 'undo', 'unfair', 'unfold', 'unhappy', 'uniform', 'unique', 'unit', 'universe', 'unknown', 'unlock', 'until', 'unusual', 'unveil', 'update', 'upgrade', 'uphold', 'upon', 'upper', 'upset', 'urban', 'urge', 'usage', 'use', 'used', 'useful', 'useless', 'usual', 'utility', 'vacant', 'vacuum', 'vague', 'valid', 'valley', 'valve', 'van', 'vanish', 'vapor', 'various', 'vast', 'vault', 'vehicle', 'velvet', 'vendor', 'venture', 'venue', 'verb', 'verify', 'version', 'very', 'vessel', 'veteran', 'viable', 'vibrant', 'vicious', 'victory', 'video', 'view', 'village', 'vintage', 'violin', 'virtual', 'virus', 'visa', 'visit', 'visual', 'vital', 'vivid', 'vocal', 'voice', 'void', 'volcano', 'volume', 'vote', 'voyage', 'wage', 'wagon', 'wait', 'walk', 'wall', 'walnut', 'want', 'warfare', 'warm', 'warrior', 'wash', 'wasp', 'waste', 'water', 'wave', 'way', 'wealth', 'weapon', 'wear', 'weasel', 'weather', 'web', 'wedding', 'weekend', 'weird', 'welcome', 'west', 'wet', 'whale', 'what', 'wheat', 'wheel', 'when', 'where', 'whip', 'whisper', 'wide', 'width', 'wife', 'wild', 'will', 'win', 'window', 'wine', 'wing', 'wink', 'winner', 'winter', 'wire', 'wisdom', 'wise', 'wish', 'witness', 'wolf', 'woman', 'wonder', 'wood', 'wool', 'word', 'work', 'world', 'worry', 'worth', 'wrap', 'wreck', 'wrestle', 'wrist', 'write', 'wrong', 'yard', 'year', 'yellow', 'you', 'young', 'youth', 'zebra', 'zero', 'zone', 'zoo'];
		var newlist = [];
		//var str = self.mnemonic1;
		var newStr = '';
		try{
			var reg1 = new RegExp('^' + self.str + '.*');
			for(var i = 0; i < mnemonic.length; i++){
				if(reg1.test(mnemonic[i])){
					newStr = mnemonic[i].substr(self.str.length);
					newlist.push(newStr);
				}
			}
		}catch (err){
			console.log(err);
		}

		self.items = newlist;

		if(self.items.length > 3){
			self.items.length = 3;
		}
	};
// 定义提示框内容  结束  -----------------------------------------------------------


	if (!isCordova) {
		var desktopApp = require('trustnote-common/desktop_app.js' + '');
		self.appDataDir = desktopApp.getAppDataDir();
	}
	self.isCordova = isCordova;


	if (fc.isPrivKeyEncrypted()) self.credentialsEncrypted = true;
	else {
		setWords(fc.getMnemonic());
	}

	if (fc.credentials && !fc.credentials.mnemonicEncrypted && !fc.credentials.mnemonic) {
		self.deleted = true;
	}

	self.toggle = function () {
		self.error = "";
		if (!self.credentialsEncrypted) {
			if (!self.show)
				$rootScope.$emit('Local/BackupDone');
			self.show = !self.show;
		}

		if (self.credentialsEncrypted)
			self.passwordRequest();

		$timeout(function () {
			$scope.$apply();
		}, 1);
	};


	// 删除口令
	self.delete = function () {
		confirmDialog.show(msg, function (ok) {
			if (ok) {
				fc.clearMnemonic();
				profileService.clearMnemonic(function () {
					self.deleted = true;
					notification.success(successMsg);
					go.walletHome();
				});
			}
		});
	};

	// 删除口令 修改后
	self.delteConfirm = function () {
		fc.clearMnemonic();
		profileService.clearMnemonic(function () {
			self.deleted = true;
			notification.success(successMsg);
			go.walletHome();
		});
	};


	$scope.$on('$destroy', function () {
		profileService.lockFC();
	});


	function setWords(words) {
		if (words) {
			self.mnemonicWords = words.split(/[\u3000\s]+/);
			self.mnemonicHasPassphrase = fc.mnemonicHasPassphrase();
			self.useIdeograms = words.indexOf("\u3000") >= 0;
			// alert(self.mnemonicWords );
			// alert(typeof (self.mnemonicWords));
			// alert(JSON.stringify(self.mnemonicWords));
		}
	};
	// strvalue = self.mnemonicWords.join(" ");
	// alert(fc.getMnemonic());


	self.passwordRequest = function () {
		try {
			setWords(fc.getMnemonic());
		} catch (e) {
			if (e.message && e.message.match(/encrypted/) && fc.isPrivKeyEncrypted()) {
				self.credentialsEncrypted = true;

				$timeout(function () {
					$scope.$apply();
				}, 1);

				profileService.unlockFC(null, function (err) {
					if (err) {
						self.error = gettextCatalog.getString('Could not decrypt') + ': ' + err.message;
						$log.warn('Error decrypting credentials:', self.error); //TODO
						return;
					}
					if (!self.show && self.credentialsEncrypted)
						self.show = !self.show;
					self.credentialsEncrypted = false;
					setWords(fc.getMnemonic());
					$rootScope.$emit('Local/BackupDone');
				});
			}
		}
	}


// 更改代码
	self.haschoosen = function () {
		storageService.hashaschoosen(2, function (err) {

			$scope.index.splashClick = false;
			$timeout(function () {
				$scope.$apply();
			}, 1);

			go.walletHome();
		});

	};
});
