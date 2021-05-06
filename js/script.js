window.onload = function(){

	// constant
	const numDrawMode = 5;
	const FPS = 60;
	const FPS_blender = 24;
	const OPENING_SPEED = 0.1;
	//const OPENING_LENGTH = 10.0 / OPENING_SPEED * FPS;
	const OPENING_LENGTH = 0.0;
	// test
	const ANIMATION_SPEED_MULTIPLIER = 1.0;

  // variables
	let resourcePath = './resource/';
	let title = 'jb_bridge';
	//let scene_name = 'hsbe';
	//let scene_name = 'kurushima_bridges';
	//let scene_name = 'oshima_bridge';
	let scene_name = document.getElementsByName('scene_name')[0].value;
	//let FPS;
	let drawMode = 0;//0: draw all, 1: omit window, 2: omit window and roof
	let eText = document.getElementById('text');

	let drawText = true;
	let drawTerrain = true;
	let drawMap = false;
	let selectedObject = null;
	//let pointable = false;
	let annotationMode = 0; //0:normal 1:pointable 2:temporary
	let selectedAnnotation = null;
	let drawInternal = false;
	let scrutinyMode = false;
	let stencilMode = false;
	let navigatable = true;

	let text01 = 'JB Bridges';
	//let text01location = [20.0, 50.0, 0.0, 0.0];
	//let selObLoc3D = [0.0, 0.0, 0.0, 1.0];

	let commentBoxWidth = 280;//px
	let memoCols = 20;
	let memoRows = 5;

	let mousePressed = false;
	let mouseButton = 0;//0: Left Button, 1: Middle Button, 2: Right Button
	let shiftKeyPressed = false;
	let prevMouseLocation;
	let currentMouseLocation;
	let wheelDelta = 0.00005;

	let touched = false;
	let prevTouchLocations;
	let currentTouchLocations;

	let staticallyPressed = false;
	let statPressedTime = new Date().getTime();

	let opening_count = 0;

	let cameraVertAngle = 0.0;

	let cameraOriginZSpeed;
	let cameraOriginZDest;

	let animationPosed = false;

	buttons = {
		revert:'UI_revert_button',
		terrain:'UI_terrain_button',
		map:'UI_map_button',
		info:'UI_info_button',
		exin:'UI_ex-in_button',
		point:'UI_point_button',
		show:'UI_show_button',
		whole:'UI_whole_button'
	}

	console.log(navigator.userAgent);
	let browser;
	if (navigator.userAgent.indexOf('Chrome') != -1) {
		browser = 'Chrome';
	} else if (navigator.userAgent.indexOf('Firefox') != -1) {
		browser = 'Firefox';
		wheelDelta = 0.00005;
		//wheelDelta = 0.005;
	} else if (navigator.userAgent.indexOf('Safari') != -1) {
		browser = 'Safari';
	}
	console.log(browser);
	//console.log(document.getElementsByName('scene_name')[0].value);
	//test();

  // canvasエレメントを取得
	const initialCanvasSize = [1200, 720];
  let c = document.getElementById('canvas1');
  //c.width = 900;
  //c.height = 540;

	//let camMode = 0;
    // webglコンテキストを取得
	//let gl = c.getContext('webgl') || c.getContext('experimental-webgl');
	let gl = c.getContext('webgl', {stencil: true}) || c.getContext('experimental-webgl', {stencil: true});

  // 頂点シェーダとフラグメントシェーダの生成
  let v_shader = create_shader('vs');
  let f_shader = create_shader('fs');
  let prg = create_program(v_shader, f_shader);
	VBOEnum = {
		position: 0,
		textureCoord: 1,
		boneIndices: 2,
		boneWeights: 3
	}
  let attLocation = new Array();
  attLocation[VBOEnum.position] = gl.getAttribLocation(prg, 'position');
  attLocation[VBOEnum.textureCoord] = gl.getAttribLocation(prg, 'textureCoord');
	attLocation[VBOEnum.boneIndices] = gl.getAttribLocation(prg, 'boneIndices');
	attLocation[VBOEnum.boneWeights] = gl.getAttribLocation(prg, 'boneWeights');
  let attStride = new Array();
  attStride[VBOEnum.position] = 3;
  attStride[VBOEnum.textureCoord] = 2;
	attStride[VBOEnum.boneIndices] = 2;
	attStride[VBOEnum.boneWeights] = 2;

	uniEnum = {
		color: 0,
		mvpMatrix: 1,
		texture: 2,
		texture2: 3,
		alpha: 4,
		tex_shift: 5,
		drawMap: 6,
		useBone: 7,
		bonemvpMatrix: 8
	}
  let uniLocation = new Array();
  uniLocation[uniEnum.color] = gl.getUniformLocation(prg, 'color');
  uniLocation[uniEnum.mvpMatrix] = gl.getUniformLocation(prg, 'mvpMatrix');
  uniLocation[uniEnum.texture] = gl.getUniformLocation(prg, 'texture');
	uniLocation[uniEnum.texture2] = gl.getUniformLocation(prg, 'texture2');
	uniLocation[uniEnum.alpha] = gl.getUniformLocation(prg, 'alpha');
  uniLocation[uniEnum.tex_shift] = gl.getUniformLocation(prg, 'tex_shift');
  uniLocation[uniEnum.drawMap] = gl.getUniformLocation(prg, 'drawMap');
	uniLocation[uniEnum.useBone] = gl.getUniformLocation(prg, 'useBone');
	uniLocation[uniEnum.bonemvpMatrix] = gl.getUniformLocation(prg, 'bonemvpMatrix');
	/*
	for (let i = 0; i < 20; i++) {
		uniLocation[uniEnum.bonemvpMatrix + i] = gl.getUniformLocation(prg, 'useBone[' + i.toString() + ']' );
		//console.log('useBone[' + i.toString() + ']');
	}
	*/

  gl.useProgram(prg);

	// 各種行列の生成と初期化
  let m = new matIV();
  let vMatrix = m.identity(m.create());
	//let pMatrix = m.identity(m.create());
  let p1Matrix = m.identity(m.create());
	let vpoMatrix = m.identity(m.create());//For UI
  let vpMatrix = m.identity(m.create());
	let mvpMatrix = m.identity(m.create());
	let vTempMatrix = m.identity(m.create());

	let q = new qtnIV();

	//m.ortho(0.0, 0.02 * c.width, 0.02 * c.height, 0.0, 0.1, 300, vpoMatrix);
	//m.ortho(0.0, c.width, c.height, 0.0, 0.1, 300, vpoMatrix);
	m.ortho(0.0, c.width, c.height, 0.0, 0.1, 5000, vpoMatrix);
	//m.translate(vpoMatrix, [0, 0, -300], vpoMatrix);
	m.translate(vpoMatrix, [0, 0, -5000], vpoMatrix);

	class obArray extends Array {
		constructor() {
			super();
		}
		name(_name) {
			let _foundName = this.find(o => o.name === _name);
			if (_foundName != undefined) {
				return _foundName;
			} else {
				return this[_name];
			}
		}
	}

  let obNames = []; // Not used

	//let obCamera = []; // List of camera objects
	let sceneCamera = 'camera_main';
	let activeCamera = sceneCamera; //Name of active camera
	//let activeCamera = 'camera_animation01'; //Name of active camera

	let obLoading = []; // List of objects used for loading screen

	let obResp = []; // List of objects responding to mouse (touch) action

	let Annoatation = function (_loc, _ob, _norm, _desc) {
		this.loc = _loc; //location in 3D space
		this.loc_2D = [0.0, 0.0, 0.0]; //location in UI space
		this.ob = _ob;
		this.normal = _norm;
		this.desc = _desc;
	}
	let annotations = [];
	let tempAnnotation = new Annoatation([0.0, 0.0, 0.0], null, [0.0, 0.0, 0.0], '');

	//let obUI = new Array(); // List of UI objects
	let obUI = new obArray(); // List of UI objects

	let obText = function () {

	}
	let obTexts = new obArray();

	let obTextures = new obArray();

	let Scene = function (name) {
		this.name = name;
		this.cameraTranslationDelta = 1.0;
		this.cameraTranslationRange = [420.0, -420.0, 420.0, -420.0, 150.0, 0.0]; //X max, X min, Y max, Y min, Z max, Z min
		this.cameraVertAngleMax = 10.0 * Math.PI / 180.0;
		this.cameraVertAngleMin = -80.0 * Math.PI / 180.0;
		this.cameraViewAngleMax = 1.2;
		this.cameraViewAngleMin = 0.1;
	}

	let object = function (name) {
		this.name = name;
	}

	let scene = new Scene(scene_name);

	//let objects = new Array();
	let objects = new obArray();

	//let obSounds = new obArray();

	//loadScene(scene_name);

	const objectActions = [
/*
						   {object: 'camera_origin',
						   objectAction: {name: 'camera_origin_action', speed: 0.005}
						   }
*/
						   ];

	const acNames = [
//			   'camera_origin_action',
			   ];

	const actions = new Array();

	for (let i = 0; i < acNames.length; i++) {
		actions[acNames[i]] = readActionData(acNames[i]);
	}

	for (var i = 0; i < objectActions.length; i++) {
		let oa = objectActions[i];
		//let ob = objects[oa.object];
		let ob = objects.name(oa.object);
		let at = ['objectAction', 'materialAction'];
		for (var j = 0; j < at.length; j++) {
			if (oa.hasOwnProperty(at[j])) {
				ob[at[j]] = {};
				if (oa[at[j]].hasOwnProperty('delay')) {
					ob[at[j]].animation_count = oa[at[j]].delay;
				} else {
					ob[at[j]].animation_count = actions[oa[at[j]].name].frame_start;
				}
				ob[at[j]].speed = oa[at[j]].speed;
				ob[at[j]].forward = true;
				ob[at[j]].name = oa[at[j]].name;
				ob[at[j]].play = 1;
			}
		}
	}
	//objects['camera_origin'].objectAction.play = 2;

	window.addEventListener('keydown', keyDown, false);
	window.addEventListener('keyup', keyUp, false);
	document.addEventListener('visibilitychange', visibilityChange, false);

	let supportTouch = 'ontouchend' in document;
	if (supportTouch) {
		c.addEventListener('touchstart', touchStart, false);
		c.addEventListener('touchmove', touchMove, false);
		c.addEventListener('touchend', touchEnd, false);
	} else {
		c.addEventListener('mousedown', mouseDown, false);
		c.addEventListener('mousemove', mouseMove, false);
		c.addEventListener('mouseup', mouseUp, false);
		c.addEventListener('wheel', wheel, false);
	}

	//let canvas2 = document.getElementById('canvas2');
	//let ctx = canvas2.getContext('2d');  // CanvasRenderingContext2D

	// look up the commentContainer
	let commentContainerElement = document.getElementById("commentContainer");
	// make the div
	let comment = document.createElement("div");
	// assign it a CSS class
	comment.className = "floating-comment";
	// add it to the commentContainer
	commentContainerElement.appendChild(comment);
	comment.style.visibility = 'hidden';
	//comment.style.width = commentBoxWidth.toString() + "px";

	let memoContainerElement = document.getElementById("memoContainer");
	memoContainerElement.style.visibility = 'hidden';
	let memo = document.createElement("textarea");
	memo.className = "floating-memo";
	memoContainerElement.appendChild(memo);
	memo.style.width = '150px';
	memo.style.height = '50px';
	memo.style.resize = 'none';

	let memoOK = document.createElement('input');
	memoOK.className = "floating-memoOK";
	memoOK.type = 'image';
	memoOK.src = './resource/UI/html/UI_annotation_check.png';
	memoOK.onclick = memoOKPressed;
	memoContainerElement.appendChild(memoOK);

	let memoCancel = document.createElement('input');
	memoCancel.className = "floating-memoCancel";
	memoCancel.type = 'image';
	memoCancel.src = './resource/UI/html/UI_annotation_cancel.png';
	memoCancel.onclick = memoCancelPressed;
	memoContainerElement.appendChild(memoCancel);

	let buttonContainerElement = document.getElementById("buttonContainer");
	buttonContainerElement.style.visibility = 'hidden';

	let obButton = document.createElement('input');
	obButton.className = "floating-buttonObject";
	obButton.type = 'image';
	obButton.src = './resource/UI/html/UI_obButton_hide.png';
	obButton.onclick = obButtonPressed;
	//obButton.style.visibility = 'hidden';
	buttonContainerElement.appendChild(obButton);

	let telop01Element = document.getElementById("telop01");
	telop01Element.className = "telop01";
	let telop01TextNode = document.createTextNode('');
	telop01Element.appendChild(telop01TextNode);

	let telop02Element = document.getElementById("telop02");
	telop02Element.className = "telop02";
	telop02Element.style.visibility = 'hidden';
	let telop02TextNode = document.createTextNode('100m');
	telop02Element.appendChild(telop02TextNode);

/*
	let overlayElement = document.getElementById('overlay');
	let textElement = document.getElementById('text');
	let textNode = document.createTextNode('');
	textElement.appendChild(textNode);
*/

	loadScene(scene_name);

	render();

	function test() {
		let _a = [1.0, 2.0, 5.0];
		let _b = _a;
		let _c = _a.slice();
		console.log(_b, _c);
		_b[1] = 10.0;
		console.log(_b, _c);
		/*
		class testA extends Array {
			constructor() {
				super();
			}
			name(_name) {
				let _foundName = this.find(o => o.name === _name);
				if (_foundName != undefined) {
					return _foundName;
				} else {
					return this[_name];
				}
				//return this.find(o => o.name === _name);
			}
		}
		let testOb = function (name) {
			this.name = name;
		}
		a = new testA();
		a.push(new testOb('hanai'));
		a.push(new testOb('taku'));
		a.push(new testOb('kyoko'));
		a['shoma'] = new testOb('shoma');
		for (let i in a) {
			console.log(i, a[i]);
		}
		*/
		//console.log(a[0], a[1], a[2]);
		//console.log(a.name('hanai'));
		//a.sort((_a, _b) => _a.name > _b.name);
		//console.log(a[0], a[1], a[2]);
		//console.log(a.name('shoma'));
		/*
		a = new Array();
		a.push(1);
		a.push(5);
		a.push(2);
		a['test'] = 'answer';
		console.log(a);
		console.log(a['test']);
		for (let i in a) {
			console.log('test1', i, a[i]);
		}
		for (let i = 0; i < a.length; i++) {
			console.log(a[i]);
		}
		a.sort();
		for (let i in a) {
			console.log('test1', i, a[i]);
		}
		console.log(a);
		console.log(a.length);

		b = [6, 1, 9];
		console.log(b);
		b['testB'] = 'answerB';
		console.log(b);
		console.log(b['testB']);
		console.log(b.length);
		*/
	}

	function render(){
		//gl.clearColor(0.4, 0.6, 1.0, 1.0);
		gl.clearColor(0.95, 0.95, 0.9, 1.0);
		//gl.clearColor(0.98, 0.98, 1.0, 1.0);
		//gl.clearColor(0.0, 0.0, 0.0, 1.0);
		/*
        // is load ready
        if ((allDataReady === true) && (isInitialize === false)){
            isInitialize = true;
            // 全てのロードが完了した際に一度だけ行いたい処理
        }
		*/
    // アニメーション
		requestAnimationFrame(render);

    if (allDataReady === true) {
			// 全てのリソースのロードが完了している

			if (opening_count < OPENING_LENGTH) {
				//openingUpdate();
			}

			//drawUpdate();
			if (scene.navigatable) {
				if (supportTouch) {
					touchUpdate();
				} else {
					mouseUpdate();
				}
			}

			sceneAnimationUpdate();
    	// objects の更新
      animationUpdate();

			// UI の更新
			//UIUpdate();

			gl.enable(gl.DEPTH_TEST);
			gl.depthFunc(gl.LESS);
			gl.enable(gl.CULL_FACE);
			gl.enable(gl.BLEND);
			//gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
			gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE);
			//gl.blendFuncSeparate(gl.ONE, gl.ZERO, gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
			//gl.blendFuncSeparate(gl.ONE, gl.ZERO, gl.ONE, gl.ONE);
			//gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
			//gl.enable(gl.STENCIL_TEST);

			cameraUpdate();

			// canvasを初期化
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
			//let _currentRect = c.getBoundingClientRect();
			//gl.viewport(0, 0, _currentRect.width, _currentRect.height);
      gl.viewport(0, 0, c.width, c.height);
      //gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
			//gl.clearStencil(0);
			gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);
      // objects の描画

			//eText.textContent = 'stencil mode: ' + stencilMode.toString() + ', scrutiny mode: ' + scrutinyMode.toString();
			if (!scrutinyMode && !stencilMode) {
				//eText.textContent = 'normal mode';
				objectRender(drawInternal);
			} else {
				//eText.textContent = 'stencil mode';
				gl.enable(gl.STENCIL_TEST);
				gl.clearStencil(0);

				stencilRender();

				gl.stencilOp(gl.KEEP, gl.KEEP, gl.KEEP);
				gl.stencilFunc(gl.NOTEQUAL, 1, ~0);
	      //objectRender('mesh');
				objectRender(false);

				gl.stencilFunc(gl.EQUAL, 1, ~0);
				//objectRender('stenciled_mesh');
				objectRender(true);
				/*
				gl.disable(gl.DEPTH_TEST);
				for (var i = 0 in obUI) {
					if (obUI[i].draw && obUI[i].UItype === 'stencil') {
						UIRendergl(obUI[i], [1.0, 1.0, 1.0, 0.0]);
					}
				}
				gl.enable(gl.DEPTH_TEST);
				*/
				gl.disable(gl.STENCIL_TEST);
			}

      // hud 関連
			//gl.disable(gl.DEPTH_TEST);

			//camMode = 1;
			if (sceneCamera === 'camera_main' && objects.indexOf('camera_UI3D') != -1) {
				activeCamera = 'camera_UI3D';
				cameraUpdate();
				UI3DRender();
			}
			//camMode = 0;
			//activeCamera = 'camera_main';
			activeCamera = sceneCamera;
			//console.log(activeCamera);
			gl.disable(gl.DEPTH_TEST);
			cameraUpdate();
			textRender();
			UIInteractionUpdate();
      UIRender();
			HTMLUpdate();
    }else{
      // canvasを初期化
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      // リソースのロードが完了していない
      // プログレス表示
      m.multiply(p1Matrix, vMatrix, vpMatrix);
      progressRender();
    }

      gl.flush();
  }

	function openingUpdate() {
		let speed_amp = FPS / OPENING_SPEED;
		/*
		if (opening_count > 1.0 * speed_amp && opening_count < 2.0 * speed_amp) {
			objects['camera'].angle_y -= 40.0 * Math.PI / 180.0 / speed_amp;
		}
		if (opening_count > 2.0 * speed_amp && opening_count < 3.0 * speed_amp) {
			objects['roof_01'].alpha -= 1.0 / speed_amp;
			objects['window'].alpha -= 1.0 / speed_amp;
		}
		if (opening_count >= 3.0 * speed_amp && objects['roof_01'].draw) {
			objects['roof_01'].draw = false;
			objects['window'].draw = false;
		}
		if (opening_count > 4.0 * speed_amp && opening_count < 5.0 * speed_amp) {
			objects['outer_03'].alpha -= 1.0 / speed_amp;
			objects['inner_3rd'].alpha -= 1.0 / speed_amp;
		}
		if (opening_count >= 5.0 * speed_amp && objects['outer_03'].draw) {
			objects['outer_03'].draw = false;
			objects['inner_3rd'].draw = false;
		}
		if (opening_count > 6.0 * speed_amp && opening_count < 7.0 * speed_amp) {
			objects['outer_02'].alpha -= 1.0 / speed_amp;
			objects['inner_2nd'].alpha -= 1.0 / speed_amp;
		}
		if (opening_count >= 7.0 * speed_amp && objects['outer_02'].draw) {
			objects['outer_02'].draw = false;
			objects['inner_2nd'].draw = false;
		}
		if (opening_count >= 8.0 * speed_amp && !objects['roof_01'].draw) {
			objects['roof_01'].draw = true;
			objects['window'].draw = true;
			objects['outer_03'].draw = true;
			objects['inner_3rd'].draw = true;
			objects['outer_02'].draw = true;
			objects['inner_2nd'].draw = true;
		}
		if (opening_count > 8.0 * speed_amp && opening_count < 9.0 * speed_amp) {
			objects['roof_01'].alpha += 1.0 / speed_amp;
			objects['window'].alpha += 1.0 / speed_amp;
			objects['outer_03'].alpha += 1.0 / speed_amp;
			objects['inner_3rd'].alpha += 1.0 / speed_amp;
			objects['outer_02'].alpha += 1.0 / speed_amp;
			objects['inner_2nd'].alpha += 1.0 / speed_amp;
			objects['camera'].angle_y += 40.0 * Math.PI / 180.0 / speed_amp;
		}
		*/
		opening_count += 1;

	}

	function mouseUpdate() {
		if (staticallyPressed) {
			let curPressedTime = new Date().getTime();
			if (curPressedTime - statPressedTime > 700) {
				scrutinyMode = true;
				navigatable = false;
				staticallyPressed = false;
			}
		}
		if (scrutinyMode) {
			for (var i = 0 in obUI) {
				if (obUI[i].UItype === 'stencil') {
					let _currentRect = c.getBoundingClientRect();
					let _asp = _currentRect.width / initialCanvasSize[0];
					let _tMatrix = m.identity(m.create());
					m.translate(_tMatrix, [currentMouseLocation.x / _asp, (_currentRect.height - currentMouseLocation.y) / _asp, 0.0], _tMatrix);
					obUI[i].mMatrix = _tMatrix;
				}
			}
		}
		//if (mousePressed && navigatable && !scrutinyMode) {
		if (mousePressed && navigatable) {
			let deltaX = currentMouseLocation.x - prevMouseLocation.x;
			let deltaY = currentMouseLocation.y - prevMouseLocation.y;
			cameraInteractionUpdate(deltaX, deltaY);

			prevMouseLocation = currentMouseLocation;
		}
	}

	function touchUpdate() {
		if (staticallyPressed) {
			let curPressedTime = new Date().getTime();
			if (curPressedTime - statPressedTime > 700) {
				scrutinyMode = true;
				navigatable = false;
				staticallyPressed = false;
			}
		}
		if (scrutinyMode) {
			for (var i = 0 in obUI) {
				if (obUI[i].UItype === 'stencil') {
					let _currentRect = c.getBoundingClientRect();
					let _asp = _currentRect.width / initialCanvasSize[0];
					let _tMatrix = m.identity(m.create());
					m.translate(_tMatrix, [currentTouchLocations[0].x / _asp, (_currentRect.height - currentTouchLocations[0].y) / _asp, 0.0], _tMatrix);
					obUI[i].mMatrix = _tMatrix;
				}
			}
		}
		//if (touched && navigatable && !scrutinyMode) {
		if (touched && navigatable) {
			if (currentTouchLocations.length === 1) {//rotation
				let deltaX = currentTouchLocations[0].x - prevTouchLocations[0].x;
				let deltaY = currentTouchLocations[0].y - prevTouchLocations[0].y;
				cameraInteractionUpdate(deltaX, deltaY);
				prevTouchLocations = currentTouchLocations;
			} else if (currentTouchLocations.length === 2) {//zoom up
				let ct0 = currentTouchLocations[0];
				let ct1 = currentTouchLocations[1];
				let pt0 = prevTouchLocations[0];
				let pt1 = prevTouchLocations[1];
				let vec0 = [ct0.x - pt0.x, ct0.y - pt0.y];
				let vec1 = [ct1.x - pt1.x, ct1.y - pt1.y];
				if (vec0[0] * vec1[0] + vec0[1] * vec1[1] > 0.0) {
					shiftKeyPressed = true;
					let deltaX = (ct0.x + ct1.x - pt0.x - pt1.x) / 2.0;
					let deltaY = (ct0.y + ct1.y - pt0.y - pt1.y) / 2.0;
					cameraInteractionUpdate(deltaX, deltaY);
				} else {
					let currentDist = Math.sqrt((ct1.x - ct0.x) * (ct1.x - ct0.x) + (ct1.y - ct0.y) * (ct1.y - ct0.y));
					let prevDist = Math.sqrt((pt1.x - pt0.x) * (pt1.x - pt0.x) + (pt1.y - pt0.y) * (pt1.y - pt0.y));

					let ay = objects.name(activeCamera).data.angle_y;
					ay -= 0.001 * (currentDist - prevDist);
					if (ay < scene.cameraViewAngleMax && ay > scene.cameraViewAngleMin) {
						objects.name(activeCamera).data.angle_y = ay;
					}
				}
				prevTouchLocations = currentTouchLocations;
			} else if (currentTouchLocations.length === 3) {//pan
				let ct0 = currentTouchLocations[0];
				let ct1 = currentTouchLocations[1];
				let ct2 = currentTouchLocations[2];
				let pt0 = prevTouchLocations[0];
				let pt1 = prevTouchLocations[1];
				let pt2 = prevTouchLocations[2];
				let deltaX = (ct0.x + ct1.x + ct2.x - pt0.x - pt1.x - pt2.x) / 3.0;
				let deltaY = (ct0.y + ct1.y + ct2.y - pt0.y - pt1.y - pt2.y) / 3.0;
				cameraInteractionUpdate(deltaX, deltaY);
				prevTouchLocations = currentTouchLocations;
			}
		}
	}

	function cameraInteractionUpdate(dX, dY) {
		if (navigatable) {
		//if (camMode == 0) {
			//let _cam_o = objects['camera_orbit_origin'];
			//let _cam = objects['camera_orbit'];
			let _cam_o = objects.name('camera_orbit_origin');
			//let _cam = objects.name('camera_orbit');
			let _cam = objects.name('camera_main');
			let _cam_UI3D = objects.name('camera_UI3D');
			if (shiftKeyPressed || mouseButton === 1) {
				//m.translate(objects['camera_whole_origin'].mMatrix0, [-1.0 * dX, 0, 1.0 * dY],
				let cameraCoeff = Math.tan(_cam.data.angle_y / 2.0) / Math.tan(_cam.data.angle_y0 / 2.0);
				if (scene.UI === 'first_layer') {
					m.translate(_cam_o.mMatrix0, [-scene.cameraTranslationDelta * cameraCoeff * dX, scene.cameraTranslationDelta * cameraCoeff * dY, 0], _cam_o.mMatrix0);
				} else {
					m.translate(_cam_o.mMatrix0, [-scene.cameraTranslationDelta * cameraCoeff * dX, 0, scene.cameraTranslationDelta * cameraCoeff * dY], _cam_o.mMatrix0);
				}
				//console.log(objects['camera_whole_origin'].mMatrix0)
				for (var i = 0; i < 3; i++) {
					if (_cam_o.mMatrix0[i + 12] > scene.cameraTranslationRange[i * 2]) {
						_cam_o.mMatrix0[i + 12] = scene.cameraTranslationRange[i * 2];
					}
					if (_cam_o.mMatrix0[i + 12] < scene.cameraTranslationRange[i * 2 + 1]) {
						_cam_o.mMatrix0[i + 12] = scene.cameraTranslationRange[i * 2 + 1];
					}
				}
				_cam_o.location[0] = _cam_o.mMatrix0[12];
				_cam_o.location[1] = _cam_o.mMatrix0[13];
				_cam_o.location[2] = _cam_o.mMatrix0[14];
			} else {
				if (scene.UI != 'first_layer') {
					m.rotate(_cam_o.mMatrix0, -0.003 * dX, [0, 0, 1], _cam_o.mMatrix0);
					_cam_o.rotation[2] += -0.003 * dX;
				}

				let deltaRotY = -0.003 * dY;
				if (cameraVertAngle + deltaRotY < scene.cameraVertAngleMax && cameraVertAngle + deltaRotY > scene.cameraVertAngleMin) {
					//console.log(_cam.mMatrix0, _cam_UI3D.mMatrix0);
					let rMatrix = m.identity(m.create());
					m.rotate(rMatrix, deltaRotY, [1, 0, 0], rMatrix);
					m.multiply(rMatrix, _cam.mMatrix0, _cam.mMatrix0);
					_cam.rotation[0] += deltaRotY;
					m.multiply(rMatrix, _cam_UI3D.mMatrix0, _cam_UI3D.mMatrix0);
					_cam_UI3D.rotation[0] += deltaRotY;
					cameraVertAngle += deltaRotY;
				}
			}
		}
	}

	function drawUpdate() {
		/*
		switch (drawMode) {
			case 0:
				objects['window'].draw = true;
				objects['roof_01'].draw = true;
				objects['outer_02'].draw = true;
				objects['outer_03'].draw = true;
				objects['inner_2nd'].draw = true;
				objects['inner_3rd'].draw = true;
				//objects['camera_origin'].mMatrix0[14] = 4.5;
				cameraOriginZDest = 4.5;
				cameraOriginZSpeed = (4.5 - objects['camera_origin'].mMatrix0[14]) / (0.3 * FPS);
				break;
			case 1:
				objects['window'].draw = false;
				break;
			case 2:
				objects['roof_01'].draw = false;
				//objects['camera_origin'].mMatrix0[14] = 7.9;
				cameraOriginZDest = 7.9;
				cameraOriginZSpeed = (7.9 - objects['camera_origin'].mMatrix0[14]) / (0.3 * FPS);
				break;
			case 3:
				objects['outer_03'].draw = false;
				objects['inner_3rd'].draw = false;
				//objects['camera_origin'].mMatrix0[14] = 4.4;
				cameraOriginZDest = 4.4;
				cameraOriginZSpeed = (4.4 - objects['camera_origin'].mMatrix0[14]) / (0.3 * FPS);
				break;
			case 4:
				objects['outer_02'].draw = false;
				objects['inner_2nd'].draw = false;
				//objects['camera_origin'].mMatrix0[14] = 2.1;
				cameraOriginZDest = 2.1;
				cameraOriginZSpeed = (2.1 - objects['camera_origin'].mMatrix0[14]) / (0.3 * FPS);
				break;
			default:
				return;
		}
		*/
	}

    // camera update
	function cameraUpdate() {
  //function cameraUpdate(_UI3D){
			//let _obCamera = objects[obCamera[camMode]];
			//let _obCamera = objects.name(obCamera[camMode]);
			let _obCamera = objects.name(activeCamera);
			switch (_obCamera.data.camera_type) {// 0: PERSP, 1: ORTHO
				case 0: //PERSP
					let _currentRect = c.getBoundingClientRect();
					m.perspective(_obCamera.data.angle_y / 1.0 * 180.0 / Math.PI, _currentRect.width / _currentRect.height, _obCamera.data.clip_start, _obCamera.data.clip_end, _obCamera.pMatrix);
					break;
			}
			m.inverse(_obCamera.mMatrix, vMatrix);
	    m.multiply(_obCamera.pMatrix, vMatrix, vpMatrix);
  }

	function sceneAnimationUpdate() {
		if (scene.sceneAnimations.length > 0) {
			let _anim = scene.sceneAnimations.name(scene.activeAnimation);
			if (_anim.play != 0 && !animationPosed) {
				if (_anim.animation_count > _anim.stencil_on && _anim.animation_count < _anim.stencil_off) {
					stencilMode = true;
				} else {
					stencilMode = false;
				}
				if (_anim.animation_count > _anim.text_off && _anim.animation_count < _anim.text_on) {
					drawText = false;
				} else {
					drawText = true;
				}

				if (telop02Element.style.visibility === 'hidden' && _anim.animation_count > _anim.altitude_on && _anim.animation_count < _anim.altitude_off) {
					console.log(_anim.animation_count, _anim.altitude_on);
					telop02Element.style.visibility = 'visible';
				} else if (telop02Element.style.visibility === 'visible' && (_anim.animation_count < _anim.altitude_on || _anim.animation_count > _anim.altitude_off)) {
					telop02Element.style.visibility = 'hidden';
				}

				actionIncrement(_anim);
			}
		}
	}

	function evaluateNLATracks(_ob) {
		if (_ob.hasOwnProperty('nLATracks')) {
			for (var j in _ob.nLATracks) {
				if (_ob.nLATracks[j].play != 0 && !animationPosed) {
					evaluateNLATrack(_ob, _ob.nLATracks[j]);
					actionIncrement(_ob.nLATracks[j]);
				}
			}
		}
	}

  function animationUpdate(){
    for (var i in objects) {
			let _ob = objects[i];
			evaluateNLATracks(_ob);
			/*
			if (_ob.hasOwnProperty('nLATracks')) {
				for (var j in _ob.nLATracks) {
					if (_ob.nLATracks[j].play != 0 && !animationPosed) {
						evaluateNLATrack(_ob, _ob.nLATracks[j]);
						//evaluateNLATrack(_ob.name, _ob.nLATracks[j]);
						actionIncrement(_ob.nLATracks[j]);
					}
				}
			}
			*/

			if (_ob.hasOwnProperty('data')) {
				evaluateNLATracks(_ob.data);
				/*
				if (_ob.data.hasOwnProperty('nLATracks')) {
					for (var j in _ob.data.nLATracks) {
						if (_ob.data.nLATracks[j].play != 0 && !animationPosed) {
							evaluateNLATrack(_ob.data, _ob.data.nLATracks[j]);
							//evaluateNLATrack(_ob.data.name, _ob.data.nLATracks[j]);
							actionIncrement(_ob.data.nLATracks[j]);
						}
					}
				}
				*/
			}
			if (_ob.hasOwnProperty('materialAction') && _ob.materialAction.play != 0) {
				_ob.alpha = evaluateMaterialAction(actions[i].materialAction, actions[i].materialAction.animation_count).alpha;
			}

      //var mMatrixLocal = m.identity(m.create());
      //m.multiply(_ob.mMatrix0, mMatrixLocal, mMatrixLocal);

			//_ob.mMatrix = mMatrixLocal;
			_ob.mMatrix = _ob.mMatrix0.slice();

			for (let ii in _ob.constraints) {
				if (_ob.constraints[ii].type == 23) {
					if (_ob.kind === 'UI3D') {
						_ob.mMatrix = evaluateUI3DOb(_ob.name, _ob.constraints[ii].target);
					} else {
						//console.log(_ob.name + ' has parent');
						let uimMatrix = evaluateParent(_ob.constraints[ii], false);
						//m.multiply(uimMatrix, mMatrixLocal, _ob.mMatrix);
						m.multiply(uimMatrix, _ob.mMatrix0, _ob.mMatrix);
					}
				}
			}
    }
  }

	function HTMLUpdate() {
		let _anim = scene.sceneAnimations.name(scene.activeAnimation);
		for (let i in _anim.telops) {
			let _telop = _anim.telops[i];
			if (_telop.active) {
				if (_anim.animation_count < _telop.frame_start + _telop.fade_frame) {
					telop01Element.style.opacity = (_anim.animation_count - _telop.frame_start) / _telop.fade_frame;
				}
				if (_anim.animation_count > _telop.frame_end - _telop.fade_frame) {
					telop01Element.style.opacity = (_telop.frame_end - _anim.animation_count) / _telop.fade_frame;
				}
				if (_anim.animation_count < _telop.frame_start || _anim.animation_count > _telop.frame_end) {
					telop01TextNode.nodeValue = '';
					_telop.active = false;
				}
			} else {
				if (_anim.animation_count > _telop.frame_start && _anim.animation_count < _telop.frame_end) {
					telop01Element.style.opacity = 0.0;
					telop01TextNode.nodeValue = _telop.telop;
					_telop.active = true;
				}
			}
		}
		if (objects.name('armature_visitor') != null) {
			telop02TextNode.nodeValue = Math.round(objects.name('armature_visitor').location[2]).toString() + 'm';
		}
	}

	function evaluateUI3DOb(_obName, _target) {
		let _ob = objects.name(_obName);
		let _tOb = objects.name(_target);
		//eText.textContent = _tOb.rotation[2];
		let locVec = _ob.location.slice();
		let rotVec = vecSub(_ob.rotation.slice(), _tOb.rotation.slice());
		let scVec = _ob.scale.slice();
		//let scVec = vecMult(_ob.scale.slice(), _tOb.scale.slice());
		//eText.textContent = rotVec[2];

		return transformationMatrix(locVec, rotVec, scVec, 1);
	}

	function evaluateParent(_constraint, _log) {
		let _ob = objects.name(_constraint.target);
		let locVec = _ob.location.slice();
		let rotVec = _ob.rotation.slice();
		let scVec = _ob.scale.slice();

		if (_log) {
			//console.log(_ob.name);
			//console.log(_ob.location, _ob.rotation, _ob.scale);
			//console.log(_constraint.useGeometries);
			//console.log(locVec[0], locVec[1], locVec[2], rotVec[0], rotVec[1], rotVec[2], scVec[0], scVec[1], scVec[2]);
		}
		/*
		for (let i = 0; i < 3; i++) {
			if (!_constraint.useGeometries[i]) {
				locVec[i] = 0.0;
			}
		}
		if (!_constraint.useGeometries[3] || !_constraint.useGeometries[4] || !_constraint.useGeometries[5]) {
			if (rotVec.length === 3) {
				rotVec = [0.0, 0.0, 0.0];
			} else {
				rotVec = [0.0, 0.0, 0.0, 0.0];
			}
		}
		for (let i = 6; i < 9; i++) {
			if (!_constraint.useGeometries[i]) {
				scVec[i - 6] = 1.0;
			}
		}
		//eText.textContent = _ob.rotation[2] + ', ' + rotVec[2];

		if (_log) {
			//console.log(locVec[0], locVec[1], locVec[2], rotVec[0], rotVec[1], rotVec[2], scVec[0], scVec[1], scVec[2]);
			//console.log(locVec, rotVec, scVec);
		}
		*/
		return transformationMatrix(locVec, rotVec, scVec, 1);
	}

	function actionIncrement(_ac) {
		let _frameStart = scene.sceneAnimations.name(scene.activeAnimation).frame_start;
		let _frameEnd =  scene.sceneAnimations.name(scene.activeAnimation).frame_end;
		if (_ac.forward) {
			_ac.animation_count += _ac.speed;
		} else {
			_ac.animation_count -= _ac.speed;
		}
		if (_ac.animation_count > _frameEnd) {
			if (_ac.play == 1) {
				_ac.animation_count = _frameStart;
				scene.sceneSounds.name(scene.mainSound).sound.currentTime = 0;
			} else if (_ac.play == 2) {
				_ac.play = 0;
				_ac.animation_count = _frameStart;
				scene.sceneSounds.name(scene.mainSound).sound.pause();
				scene.sceneSounds.name(scene.mainSound).sound.currentTime = 0;
			} else if (_ac.play == 3) {
				_ac.play = 0;
				_ac.animation_count = _frameEnd;
			}
		}
		if (_ac.animation_count < _frameStart) {
			if (_ac.play == 1) {
				_ac.animation_count = _frameEnd;
			} else if (_ac.play == 2) {
				_ac.animation_count = _frameEnd;
				_ac.play = 0;
			} else if (_ac.play == 3) {
				_ac.play = 0;
				_ac.animation_count = _frameStart;
			}
		}
	}

  // objects rendering
	function objectRender(_internal){
		for (var i in objects) {
			let _ob = objects[i];
			if (_ob.one_sided) {
				let _ray = vecSub(_ob.center, objects.name(activeCamera).mMatrix.slice(12, 15));
				if (dot(_ob.normal, _ray) < 0.0) {
					_ob.draw = true;
				} else {
					_ob.draw = false;
				}
			}
      if (
          _ob.type === 0 &&
					_ob.kind === 'mesh' &&
					_ob.draw === true &&
					((_internal && _ob.internal != 'external') || (!_internal && _ob.internal != 'internal')) &&
					!(_ob.terrain && !drawTerrain) &&
          obLoading.indexOf(i) === -1
      ) {
				let _color = [];
				if (_ob.name === selectedObject) {
					_color = [1.0, 0.0, 0.0, 0.3];
				} else {
					_color = [1.0, 1.0, 1.0, 0.0];
				}

				objectRendergl(_ob.name, _color);
      }
    }
	}

	function stencilRender() {
		//gl.disable(gl.DEPTH_TEST);
		//eText.textContent = 'stencilRender';

		gl.stencilFunc(gl.EQUAL, 0, ~0);
		gl.stencilOp(gl.KEEP, gl.INCR, gl.INCR);

		for (var i = 0 in obUI) {
			if (obUI[i].draw && obUI[i].UItype === 'stencil') {
				//console.log(obUI[i].name);
				UIRendergl(obUI[i], [1.0, 1.0, 1.0, 0.0]);
			}
		}

		//gl.enable(gl.DEPTH_TEST);

	}

	function UI3DRender(){
		for (var i = 0 in objects) {
			let _ob = objects[i];
			if (
					_ob.type === 0 &&
					_ob.kind === 'UI3D' &&
					_ob.draw === true &&
					//_ob.internal === drawInternal &&
					obLoading.indexOf(i) === -1
			) {
				//eText.textContent = _ob.rotation[2];
				let _color = [1.0, 1.0, 1.0, 0.0];

				//objectRendergl(i, _color);
				objectRendergl(_ob.name, _color);
			}
		}
	}

		function objectRendergl(_obName, _color){
			let _ob = objects.name(_obName);
			gl.uniform1i(uniLocation[uniEnum.texture], 0);
			gl.uniform1i(uniLocation[uniEnum.texture2], 1);
			set_attribute(_ob.VBOList, attLocation, attStride);
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, _ob.iIndex);

			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, obTextures.name(_ob.textureList[0]));
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);

			if (drawMap && _ob.mappable) {
				gl.uniform1i(uniLocation[uniEnum.drawMap], drawMap);
				gl.activeTexture(gl.TEXTURE1);
				gl.bindTexture(gl.TEXTURE_2D, obTextures.name(_ob.textureList[1]));
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
			} else {
				gl.uniform1i(uniLocation[uniEnum.drawMap], false);
			}
			gl.uniform4fv(uniLocation[uniEnum.color], _color);
			gl.uniform1f(uniLocation[uniEnum.alpha], _ob.alpha);
			gl.uniform2fv(uniLocation[uniEnum.tex_shift], _ob.texture_shift);
			gl.uniform1i(uniLocation[uniEnum.useBone], _ob.armature != '' ? true : false);
			if (_ob.armature === '') {
				m.multiply(vpMatrix, _ob.mMatrix, mvpMatrix);
				gl.uniformMatrix4fv(uniLocation[uniEnum.mvpMatrix], false, mvpMatrix);
			} else {
				let _matArray = [];
				for (let i = 0; i < _ob.vertexGroups.length; i++) {
					//eText.textContent = 'i: ' + i.toString() + ', name: ' + _ob.vertexGroups[i].name.toString() + ', index: ' + _ob.vertexGroups[i].index.toString()
					//console.log('i: ' + i.toString() + ', name: ' + _ob.vertexGroups[i].name.toString() + ', index: ' + _ob.vertexGroups[i].index.toString());
					let _mBoneMatrix = m.identity(m.create());
					let _armature = objects.name(_ob.armature);
					m.multiply(_armature.mMatrix, _armature.bones.name(_ob.vertexGroups[i].name).matrixV, _mBoneMatrix);
					m.multiply(vpMatrix, _mBoneMatrix, _mBoneMatrix);
					//m.multiply(vpMatrix, _armature.bones.name(_ob.vertexGroups[i].name).matrixV, _mBoneMatrix);
					//m.multiply(_armature.mMatrix, _mBoneMatrix, _mBoneMatrix);
					_matArray = _matArray.concat(Array.from(_mBoneMatrix));
				}
				gl.uniformMatrix4fv(uniLocation[uniEnum.bonemvpMatrix], false, _matArray);
			}

			gl.drawElements(gl.TRIANGLES, _ob.numLoop, gl.UNSIGNED_SHORT, 0);
		}

		function textRender() {
			let _drawLevel = -1;
			//eText.textContent = objects.name(activeCamera).data.angle_y;
			for (let i = 0; i < scene.textZoomAngle.length; i++) {
				if (scene.textZoomAngle[i] > objects.name(activeCamera).data.angle_y) {
					_drawLevel = i;
				}
			}
			for (let i in obTexts) {
				let _ot = obTexts[i];
				//console.log('obText:', _ot.name);
				if (
					drawText &&
					_ot.attributes.hasOwnProperty('level' + _drawLevel) &&
					!(drawInternal && _ot.attributes.hasOwnProperty('outer_text')) &&
					!(!drawInternal && _ot.attributes.hasOwnProperty('inner_text')) &&
					!(!drawTerrain && _ot.attributes.hasOwnProperty('terrain_text'))
				) {
					let _tMatrix = m.identity(m.create());
					let _v = from3DPointTo2D(_ot.location.concat(1.0));
					//_v[2] = 10;
					//console.log(_v);
					//eText.textContent = _v[2];
					m.translate(_tMatrix, _v.slice(0, 3), _tMatrix);
					_ot.mMatrix = _tMatrix;
					let _color = [1.0, 1.0, 1.0, 0.0];
					textRendergl(_ot, _color);
				}
			}
		}

		function textRendergl(_ot, _color) {
			//eText.textContent = obTextures.name(_ob.font).name;
			set_attribute(_ot.VBOList, attLocation, attStride);
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, _ot.iIndex);
			gl.uniform1i(uniLocation[uniEnum.drawMap], false);
			gl.uniform4fv(uniLocation[uniEnum.color], _color);
			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, obTextures.name(_ot.font));
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);

			gl.uniform2fv(uniLocation[uniEnum.tex_shift], [0, 0]);

			m.multiply(vpoMatrix, _ot.mMatrix, mvpMatrix);
			gl.uniformMatrix4fv(uniLocation[uniEnum.mvpMatrix], false, mvpMatrix);
			gl.uniform1f(uniLocation[uniEnum.alpha], 1.0);
			gl.uniform1i(uniLocation[uniEnum.useBone], false);

			gl.drawElements(gl.TRIANGLES, _ot.numLoop, gl.UNSIGNED_SHORT, 0);
		}

    // UI
    function UIRender(){
			// Draw Annoations
			for (var i = 0; i < annotations.length; i++) {
				//let annoOb = obUI['UI_annotation'];
				let annoOb = obUI.name('UI_annotation');
				let _tMatrix = m.identity(m.create());
				let _v = from3DPointTo2D(annotations[i].loc.concat(1.0));
				//eText.textContent = _v[0];
				annotations[i].loc_2D = _v.slice(0, 3);
				m.translate(_tMatrix, _v.slice(0, 3), _tMatrix);
				if (annotations[i] === selectedAnnotation) {
					m.scale(_tMatrix, [2.0, 2.0, 1.0], _tMatrix);
				}
				annoOb.mMatrix = _tMatrix;
				//console.log(objects[annotations[i].ob].draw);
				let _color = [1.0, 1.0, 1.0, 1.0];
				//if (objects[annotations[i].ob].draw) {
				if (objects.name(annotations[i].ob).draw) {
					//let _ray = vecSub(annotations[i].loc, objects[obCamera[camMode]].mMatrix.slice(12, 15));
					//let _ray = vecSub(annotations[i].loc, objects.name(obCamera[camMode]).mMatrix.slice(12, 15));
					let _ray = vecSub(annotations[i].loc, objects.name(activeCamera).mMatrix.slice(12, 15));
					if (dot(annotations[i].normal, _ray) < 0.0) {
						_color = [1.0, 0.0, 0.0, 1.0];
					} else {
						_color = [1.0, 0.6, 0.6, 1.0];
					}
				} else {
					_color = [1.0, 0.6, 0.6, 1.0];
				}
				//if (objects[annotations[i].ob].internal != drawInternal) {
				let _obInt = objects.name(annotations[i].ob).internal;
				if ((drawInternal && _obInt != 'external') || (!drawInternal && _obInt != 'internal')) {
				//if (objects.name(annotations[i].ob).internal != drawInternal) {
					_color = [1.0, 0.6, 0.6, 1.0];
				}
				UIRendergl(annoOb, _color);
			}
			//gl.disable(gl.DEPTH_TEST);
			// Draw Buttons
			for (var i = 0 in obUI) {
				//if (obUI[i].draw && obUI[i].fix) {
				//if (obUI[i].draw && obUI[i].UItype === 'fix') {
				if (obUI[i].draw && (obUI[i].UItype === 'fix' || (obUI[i].UItype === 'stencil' && (scrutinyMode || stencilMode)))) {
					UIRendergl(obUI[i], [1.0, 1.0, 1.0, 0.0]);
				}
      }
			// Draw Temporary Annotation Buttons
			if (annotationMode === 2) {
				//let annoEdOb = obUI['UI_annotation_edit'];
				let _tMatrix = m.identity(m.create());
				let _v = from3DPointTo2D(tempAnnotation.loc.concat(1.0));
				m.translate(_tMatrix, _v.slice(0, 3), _tMatrix);
				//obUI['UI_annotation_edit'].mMatrix = _tMatrix;
				//obUI['UI_annotation_edit'].location = _tMatrix.slice(12, 15);
				//UIRendergl(obUI['UI_annotation_edit'], [1.0, 1.0, 1.0, 0.0]);
				obUI.name('UI_annotation_edit').mMatrix = _tMatrix;
				obUI.name('UI_annotation_edit').location = _tMatrix.slice(12, 15);
				UIRendergl(obUI.name('UI_annotation_edit'), [1.0, 1.0, 1.0, 0.0]);
			}
    }

		function UIRendergl(_ob, _color) {
			set_attribute(_ob.VBOList, attLocation, attStride);
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, _ob.iIndex);
			gl.uniform1i(uniLocation[uniEnum.drawMap], false);
			gl.uniform4fv(uniLocation[uniEnum.color], _color);
			gl.activeTexture(gl.TEXTURE0);
			//gl.bindTexture(gl.TEXTURE_2D, _ob.texture[_ob.name]);
			gl.bindTexture(gl.TEXTURE_2D, obTextures.name(_ob.textureList[0]));
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);

			gl.uniform2fv(uniLocation[uniEnum.tex_shift], _ob.texture_shift);

			m.multiply(vpoMatrix, _ob.mMatrix, mvpMatrix);
			gl.uniformMatrix4fv(uniLocation[uniEnum.mvpMatrix], false, mvpMatrix);
			gl.uniform1f(uniLocation[uniEnum.alpha], _ob.alpha);
			gl.uniform1i(uniLocation[uniEnum.useBone], false);

			gl.drawElements(gl.TRIANGLES, _ob.numLoop, gl.UNSIGNED_SHORT, 0);
		}

    // プログレス表示
    function progressRender(){
        gl.uniform2fv(uniLocation[uniEnum.tex_shift], [0.0, 0.0]);
        for (var i = 0 in obLoading) {
            //eText.textContent = numDataReady + ': ' + obNames.length;
            //if (objects[obLoading[i]].dataReady && objects[obLoading[i]].texture[objects[obLoading[i]].name] && !allDataReady) {
						//let _obLoading = objects[obLoading[i]];
						let _obLoading = objects.name(obLoading[i]);
						if (_obLoading.dataReady && obTextures.name(_obLoading.textureList[0])) {
            //if (_obLoading.dataReady && _obLoading.texture[obLoading[i]]) {
                set_attribute(_obLoading.VBOList, attLocation, attStride);
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, _obLoading.iIndex);

								gl.bindTexture(gl.TEXTURE_2D, obTextures.name(_obLoading.texture[0]));
                //gl.bindTexture(gl.TEXTURE_2D, _obLoading.texture[obLoading[i]]);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT);

                var mTempMatrix = m.identity(m.create());
                if (obLoading[i] == 'progress_bar') {
                    m.scale(mTempMatrix, [numDataReady / (obNames.length * 2), 1, 1], mTempMatrix);
                }
                m.multiply(_obLoading.mMatrix, mTempMatrix, mTempMatrix);

                m.multiply(vpoMatrix, mTempMatrix, mvpMatrix);
                gl.uniformMatrix4fv(uniLocation[uniEnum.mvpMatrix], false, mvpMatrix);
                gl.uniform1f(uniLocation[uniEnum.alpha], 1.0);

                gl.drawElements(gl.TRIANGLES, _obLoading.numLoop, gl.UNSIGNED_SHORT, 0);
            }
        }
    }

		function adjustUI(_loc, _xLimit, _yLimit) {
			let adLoc = [0.0, 0.0];
			if (_loc[0] < _xLimit[0]) {
				adLoc[0] = _xLimit[0];
			} else if (_loc[0] > _xLimit[1]) {
				adLoc[0] = _xLimit[1];
			} else {
				adLoc[0] = _loc[0];
			}
			if (_loc[1] < _yLimit[0]) {
				adLoc[1] = _yLimit[0];
			} else if (_loc[1] > _yLimit[1]) {
				adLoc[1] = _yLimit[1];
			} else {
				adLoc[1] = _loc[1];
			}
			return adLoc;
		}

		function UIInteractionUpdate() {
			let _currentRect = c.getBoundingClientRect();
			if (selectedObject != null) {
				if (comment.style.visibility === 'visible') {
					//let commentLoc = fromObTo2D(objects[selectedObject]);
					let commentLoc = fromObTo2D(objects.name(selectedObject));
					let adComLoc = adjustUI(commentLoc, [0.0, _currentRect.width - comment.clientWidth], [0.0, _currentRect.height - 160.0]);
					//let adComLoc = adjustUI(commentLoc, [0.0, c.width - comment.clientWidth], [0.0, c.height - 160.0]);
					comment.style.left = Math.floor(adComLoc[0]) + "px";
					comment.style.top  = Math.floor(adComLoc[1]) + "px";
				}
				if (buttonContainerElement.style.visibility === 'visible') {
					//let buttonLoc = fromObTo2D(objects[selectedObject]);
					let buttonLoc = fromObTo2D(objects.name(selectedObject));
					buttonLoc[0] -= obButton.clientWidth / 2.0;
					//let adButtonLoc = adjustUI(buttonLoc, [0.0, c.width - obButton.clientWidth], [0.0, c.height - 160.0]);
					let adButtonLoc = adjustUI(buttonLoc, [0.0, _currentRect.width - obButton.clientWidth], [0.0, _currentRect.height - 160.0]);
					obButton.style.left = Math.floor(adButtonLoc[0]) + "px";
					obButton.style.top  = Math.floor(adButtonLoc[1]) + "px";
					//detailButton.style.left = Math.floor(adButtonLoc[0]) + "px";
					//detailButton.style.top  = Math.floor(adButtonLoc[1]) + "px";
				}
			}
			if (selectedAnnotation != null) {
				let annoTexLoc = selectedAnnotation.loc_2D.concat(0);
				//annoTexLoc[1] = c.height - annoTexLoc[1] + 2.0;
				annoTexLoc[1] = _currentRect.height - annoTexLoc[1] + 2.0;
				comment.style.visibility = 'visible'
				if (
					annoTexLoc[0] < 0.0 ||
					//annoTexLoc[0] > c.width - comment.clientWidth ||
					annoTexLoc[0] > _currentRect.width - comment.clientWidth ||
					annoTexLoc[1] < 0.0 ||
					//annoTexLoc[1] > c.height - 20
					annoTexLoc[1] > _currentRect.height - 20
				) {comment.style.visibility = 'hidden'}
				comment.style.left = Math.floor(annoTexLoc[0]) + "px";
				comment.style.top  = Math.floor(annoTexLoc[1]) + "px";
			}
		}

    // シェーダを生成する関数
    function create_shader(id){
        // シェーダを格納する変数
        var shader;

        // HTMLからscriptタグへの参照を取得
        var scriptElement = document.getElementById(id);

        // scriptタグが存在しない場合は抜ける
        if(!scriptElement){return;}

        // scriptタグのtype属性をチェック
        switch(scriptElement.type){

				// 頂点シェーダの場合
            case 'x-shader/x-vertex':
                shader = gl.createShader(gl.VERTEX_SHADER);
                break;

				// フラグメントシェーダの場合
            case 'x-shader/x-fragment':
                shader = gl.createShader(gl.FRAGMENT_SHADER);
                break;
            default :
                return;
        }

        // 生成されたシェーダにソースを割り当てる
        gl.shaderSource(shader, scriptElement.text);

        // シェーダをコンパイルする
        gl.compileShader(shader);

        // シェーダが正しくコンパイルされたかチェック
        if(gl.getShaderParameter(shader, gl.COMPILE_STATUS)){

            // 成功していたらシェーダを返して終了
            return shader;
        }else{

            // 失敗していたらエラーログをアラートする
            alert(gl.getShaderInfoLog(shader));
        }
    }

    // プログラムオブジェクトを生成しシェーダをリンクする関数
    function create_program(vs, fs){
        // プログラムオブジェクトの生成
        var program = gl.createProgram();

        // プログラムオブジェクトにシェーダを割り当てる
        gl.attachShader(program, vs);
        gl.attachShader(program, fs);

        // シェーダをリンク
        gl.linkProgram(program);

        // シェーダのリンクが正しく行なわれたかチェック
        if(gl.getProgramParameter(program, gl.LINK_STATUS)){

            // 成功していたらプログラムオブジェクトを有効にする
            gl.useProgram(program);

            // プログラムオブジェクトを返して終了
            return program;
        }else{

            // 失敗していたらエラーログをアラートする
            alert(gl.getProgramInfoLog(program));
        }
    }

    // VBOを生成する関数
    function create_vbo(data){
        // バッファオブジェクトの生成
        var vbo = gl.createBuffer();

        // バッファをバインドする
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);

        // バッファにデータをセット
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);

        // バッファのバインドを無効化
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        // 生成した VBO を返して終了
        return vbo;
    }

    // VBOをバインドし登録する関数
    function set_attribute(vbo, attL, attS){
        // 引数として受け取った配列を処理する
        for(var i in vbo){
					//console.log('set_attribute', i);
            // バッファをバインドする
            gl.bindBuffer(gl.ARRAY_BUFFER, vbo[i]);

            // attributeLocationを有効にする
            gl.enableVertexAttribArray(attL[i]);
			//console.log(i, attL[i]);

            // attributeLocationを通知し登録する
            gl.vertexAttribPointer(attL[i], attS[i], gl.FLOAT, false, 0, 0);
        }
    }

    // IBOを生成する関数
    function create_ibo(data){
        // バッファオブジェクトの生成
        var ibo = gl.createBuffer();

        // バッファをバインドする
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);

        // バッファにデータをセット
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Int16Array(data), gl.STATIC_DRAW);

        // バッファのバインドを無効化
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

        // 生成したIBOを返して終了
        return ibo;
    }

	//function create_texture(_path, source, i_source, _type){
	function create_texture(_path, i_source){
		//console.log('path:', _path, 'i_source:', i_source);
		if (!obTextures.find(o => o.name === i_source)) {
			var img = new Image();
			//img.src = _path + '/textures/' + i_source + '.png';
			img.src = _path + i_source + '.png';
			img.onload = function(){
				//ob.texture[i_source] = create_texture_gl(img);
				let _texture = create_texture_gl(img);
				_texture.name = i_source;
				obTextures.push(_texture);
				numDataReady += 1;
				allDataReady = checkAllDataReady();
			};
		}
	}

	function create_texture_gl(img) {
		var tex = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, tex);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
		gl.generateMipmap(gl.TEXTURE_2D);
		gl.bindTexture(gl.TEXTURE_2D, null);
		return tex;
	}

	function loadScene(_scene_name) {
		drawText = true;
		drawTerrain = true;
		cameraVertAngle = 0.0;
		drawMap = false;
		selectedObject = null;
		annotationMode = 0; //0:normal 1:pointable 2:temporary
		selectedAnnotation = null;
		drawInternal = false;
		scrutinyMode = false;
		stencilMode = false;
		navigatable = true;
		animationPosed = false;

		scene = new Scene(_scene_name);

		objects = new obArray();
		obUI = new obArray();
		obTexts = new obArray();
		obTextures = new obArray();
		//obSounds = new obArray();

		//camMode = 0;
		//obCamera = [];
		//sceneCamera = 'camera_main';
		//activeCamera = 'camera_animation01';

		allDataReady = false;
		numDataReady = 0;
		annotations = [];
		console.log('scene:', scene.name);
		readSceneData();
		//console.log(objects);
		for (let i in objects) {
			//console.log(objects[i].name);
			//read3DModelData(resourcePath + scene.name, objects[i].name, 'object');
			read3DModelData(resourcePath + scene.directory, objects[i].name, 'object');
		}
		/*
		for (let _name in objects) {
			//console.log(_name, objects[_name].constraints);
			//countOrder(_name);
			//console.log(_name, objects[_name].order);
		}
		*/

		hiddenObjects = [];
		readUIData();

		//readTextData(resourcePath + scene.name);
		readTextData(resourcePath + scene.directory);

		readSoundData(resourcePath + scene.directory);

		comment.style.visibility = 'hidden';
		buttonContainerElement.style.visibility = 'hidden';
	}

	function countOrder(_obName) {
		//let _ob = objects[_obName];
		//console.log(_obName);
		let _ob = objects.name(_obName);
		if (_ob.order == -1) {
			if (_ob.constraints.length > 0) {
				for (let i = 0; i < _ob.constraints.length; i++) {
					let _tempOrder = countOrder(_ob.constraints[i].target) + 1;
					if (_tempOrder > _ob.order) {
						_ob.order = _tempOrder;
					}
				}
			} else if (_ob.modifiers.length > 0) {
				for (let i = 0; i < _ob.modifiers.length; i++) {
					if (_ob.modifiers[i].type === 27) { //ARMATURE
						let _tempOrder = countOrder(_ob.modifiers[i].object) + 1;
						if (_tempOrder > _ob.order) {
							_ob.order = _tempOrder;
						}
					}
				}
			} else {
				_ob.order = 0;
			}
			/*
			if (_ob.constraints.length === 0) {
				_ob.order = 0;
			} else {
				for (let i = 0; i < _ob.constraints.length; i++) {
					let _tempOrder = countOrder(_ob.constraints[i].target) + 1;
					if (_tempOrder > _ob.order) {
						_ob.order = _tempOrder;
					}
				}
			}
			*/
		}
		return _ob.order;
	}

	function readSceneData() {
		var data = new XMLHttpRequest();
		data.open("GET", resourcePath + 'scenes/' + title + '-' + scene.name + '.csv', false); //true:非同期,false:同期
		data.send(null);

		let LF = String.fromCharCode(10); //改行ｺｰﾄﾞ
		let lines = data.responseText.split(LF);
		let _off = 1;
		let _sceneData = lines[_off].split(',');
		let sdIndex = 0;
		scene.num_object = Number(_sceneData[sdIndex++]);
		scene.directory = _sceneData[sdIndex++];
		scene.parent = _sceneData[sdIndex++];
		scene.UI = _sceneData[sdIndex++];
		scene.num_sceneAnimations = Number(_sceneData[sdIndex++]);
		scene.mainAnimation = _sceneData[sdIndex++];
		scene.activeAnimation = scene.mainAnimation;
		scene.navigatable = (_sceneData[sdIndex++] === 'yes') ? true : false;
		scene.num_sounds = Number(_sceneData[sdIndex++]);
		scene.mainSound = _sceneData[sdIndex++];
		_off += 2;
		sdIndex = 0;
		_sceneData = lines[_off].split(',');
		scene.cameraTranslationDelta = Number(_sceneData[sdIndex++]);
		scene.cameraTranslationRange = _sceneData.slice(sdIndex, sdIndex + 6).map(Number);
		sdIndex += 6;
		scene.cameraVertAngleMax = Number(_sceneData[sdIndex++]) * Math.PI / 180.0;
		scene.cameraVertAngleMin = Number(_sceneData[sdIndex++]) * Math.PI / 180.0;
		scene.cameraViewAngleMax = Number(_sceneData[sdIndex++]);
		scene.cameraViewAngleMin = Number(_sceneData[sdIndex++]);
		scene.textZoomAngle = [];
		scene.textZoomAngle.push(Number(_sceneData[sdIndex++]));
		scene.textZoomAngle.push(Number(_sceneData[sdIndex++]));
		scene.textZoomAngle.push(Number(_sceneData[sdIndex++]));
		//scene.num_sceneAnimations = Number(_sceneData[sdIndex++]);
		/*
		scene.textZoomAngle = {};
		scene.textZoomAngle.level0 = Number(_sceneData[sdIndex++]);
		scene.textZoomAngle.level1 = Number(_sceneData[sdIndex++]);
		scene.textZoomAngle.level2 = Number(_sceneData[sdIndex++]);
		*/
		console.log(scene);
		_off += 2;
		for (var i = 0; i < scene.num_object; i++) {
			let _line = lines[_off].split(',');
			let lIndex = 0;
			let _name = _line[lIndex++];
			let _kind = _line[lIndex++];
			let _texture = _line.slice(lIndex, lIndex + 2);
			lIndex += 2;
			let _openingAnimation = _line[lIndex++] === 'yes' ? true : false;
			//let _internal = _line[lIndex++] === 'yes' ? true : false;
			let _internal = _line[lIndex++];
			let _terrain = _line[lIndex++] === 'yes' ? true : false;
			let _selectMesh = _line[lIndex++];
			let _pointMesh = _line[lIndex++];
			let _mappable = _line[lIndex++] === 'yes' ? true : false;
			let _hasDetail = _line[lIndex++] === 'yes' ? true : false;
			let _hidable = _line[lIndex++] === 'yes' ? true : false;
			let _oneSide = _line[lIndex++] === 'yes' ? true : false;
			let _normal = _line.slice(lIndex, lIndex + 3).map(Number);
			lIndex += 3;
			let _description = _line[lIndex++];
			const ob = new object(_name);
			//ob.texture = new Array(); // WebGL texture
			ob.dataReady = false;
			ob.openingAnimation = _openingAnimation;
			ob.internal = _internal;
			ob.terrain = _terrain;
			ob.kind = _kind;
			ob.textureList = []; // List of textures (string)

			for (var j = 0 in _texture) {
				if (_texture[j] != '') {
					//ob.texture[_texture] = null;
					ob.textureList.push(_texture[j]);
				}
			}
			//console.log(ob.name, ob.terrain);

			ob.selectMesh = _selectMesh;
			ob.pointMesh = _pointMesh;
			ob.mappable = _mappable;
			ob.hasDetail = _hasDetail;
			ob.hidable = _hidable;
			ob.one_sided = _oneSide;
			ob.normal = _normal;
			ob.description = _description;
			ob.draw = true;
			//ob.facing = true;
			ob.texture_shift = [0.0, 0.0];
			ob.alpha = 1.0;
	    ob.isHit = false;
	    ob.shadow = 0.0;
			ob.depth = 1000000; // Z Depth from Camera
			ob.order = -1; //order of constraints (0: root, n: nth generation, -1: not decided)
	    //objects[_name] = ob;
			//console.log(ob.name);
			objects.push(ob);
			/*
			if (_kind === 'camera') {
				obCamera.push(_name);
				console.log(_name);
			}
			*/
			if (_selectMesh != '') {
				obResp.push(_name);
			}
			/*
			if (_UI) {
				obUI.push(_name);
			}
			*/
			_off += 1;
		}

		_off += 1;
		scene.sceneAnimations = new obArray();
		for (var i = 0; i < scene.num_sceneAnimations; i++) {
			//_off += 1;
			let _animData = lines[_off].split(',');
			//_off += 1;
			let _animation = {
				name: _animData[0],
				numItems: Number(_animData[1]),
				frame_start: Number(_animData[2]),
				frame_end: Number(_animData[3]),
				camera: _animData[4],
				sound: _animData[5],
				numTelops: Number(_animData[6])
			};
			_off += 1;
			console.log(_animation.name);
			for (var j = 0; j < _animation.numItems; j++) {
				let _line = lines[_off].split(',');
				_animation[_line[0]] = Number(_line[1]);
				_off += 1;
			}
			//_off += 1;
			_animation.telops = new obArray();
			for (var j = 0; j < _animation.numTelops; j++) {
				let _telopData = lines[_off].split(',');
				let _telop = {
					frame_start: Number(_telopData[0]),
					frame_end: Number(_telopData[1]),
					fade_frame: Number(_telopData[2]),
					telop: _telopData[3],
					active: false
				}
				_animation.telops.push(_telop);
				_off += 1;
			}
			_animation.animation_count = 0;
			//_animation.active = false;
			//0: stop, 1: play loop, 2: play once (return to first frame), 3: play once (stay at last frame)
			//_animation.play = 0;
			if (_animation.name === scene.mainAnimation) {
				//_animation.active = true;
				_animation.play = 1;
			} else {
				//_animation.active = false;
				_animation.play = 0;
			}

			_animation.forward = true;
			//_animation.speed = 0.4;
			_animation.speed = FPS_blender / FPS * ANIMATION_SPEED_MULTIPLIER;
			console.log(_animation);
			scene.sceneAnimations.push(_animation);

		}
		if (scene.num_sceneAnimations > 0) {
			sceneCamera = scene.sceneAnimations.name(scene.mainAnimation).camera;
		} else {
			sceneCamera = 'camera_main';
		}
		_off += 1;
		scene.sceneSounds = new obArray();
		for (var i = 0; i < scene.num_sounds; i++) {
			let _soundData = lines[_off].split(',');
			let _sound = {
				name: _soundData[0]
			};
			_off += 1;
			scene.sceneSounds.push(_sound);
		}
	}

	function readInt32(_dv, _counter) {
		let _val = _dv.getInt32(_counter.off, true);
		_counter.off += 4;
		return _val;
	}

	function readInt8(_dv, _counter) {
		let _val = _dv.getInt8(_counter.off, true);
		_counter.off += 1;
		return _val;
	}

	function readFloat32(_dv, _counter) {
		let _val = _dv.getFloat32(_counter.off, true);
		_counter.off += 4;
		return _val;
	}

	function readVec(_dv, _counter, _dim) {
		let _val = [];
		for (var i = 0; i < _dim; i++) {
			_val.push(readFloat32(_dv, _counter));
		}
		return _val;
	}

	function readMat(_dv, _counter, _dim) {
		let _val = [];
		for (var i = 0; i < _dim * _dim; i++) {
			_val.push(readFloat32(_dv, _counter))
		}
		/*
		for (var i = 0; i < _dim; i++) {
			let _row = [];
			for (var j = 0; j < _dim; j++) {
				_row.push(readFloat32(_dv, _counter))
			}
			_val.push(_row);
		}
		*/
		return _val;
	}

	function readString(_dv, _counter) {
		//Read string from binary data
		//Format: number of characters (Int32), string (Int8 x N)
		let _len = _dv.getInt32(_counter.off, true);
		let _nameArray = [];
		_counter.off += 4;
		for (var i = 0; i < _len; i++) {
			_nameArray.push(_dv.getUint8(_counter.off));
			_counter.off += 1;
		}
		let text_decoder = new TextDecoder('utf-8');
		return text_decoder.decode(Uint8Array.from(_nameArray).buffer);
	}

	function pathAnalisys(_str) {
		let _inQuote = false;
		let _foundIndices = [];
		let _result = [];
		for (let i = 0; i < _str.length; i++) {
			if (_str[i] === '"') {
				_inQuote = !_inQuote;
			} else if (_str[i] === '.' && !_inQuote) {
				_foundIndices.push(i);
			}
		}
		let _startIndex = 0;
		for (let i in _foundIndices) {
			_result.push(_str.substring(_startIndex, _foundIndices[i]));
			_startIndex = _foundIndices[i] + 1;
		}
		_result.push(_str.substring(_startIndex, _str.length));
		return _result;
	}

	function readString_back(_dv, _off) {
		//Read string from binary data
		//Format: number of characters (Int32), string (Int8 x N)
		let _strOb = {};
		_strOb.length = _dv.getInt32(_off, true);
		//let _lenT = _dv.getInt32(_off, true);
		//let _lenT = _dv.getUint32(_off, true);
		//console.log(_strOb.length);
		let _name = '';
		let _nameArray = [];
		_off += 4;
		for (var i = 0; i < _strOb.length; i++) {
		//for (var i = 0; i < _lenT; i++) {
			_nameArray.push(_dv.getUint8(_off));
			_name += String.fromCharCode(_dv.getUint8(_off));
			_off += 1;
		}
		let text_decoder = new TextDecoder('utf-8');
		_strOb.string = text_decoder.decode(Uint8Array.from(_nameArray).buffer);
		//let _decString = text_decoder.decode(Uint8Array.from(_nameArray).buffer);
		//console.log(_nameArray, _decString);
		//return _name;
		//return _decString;
		return _strOb
	}

	function readAction(_dv, _off, _openingAnimation) {
		let _action = new object();
		_action.frame_start = _dv.getFloat32(_off, true);
		_off += 4;
		_action.frame_end = _dv.getFloat32(_off, true);
		_off += 4;

		_action.numFCurves = _dv.getInt32(_off, true);
		_off += 4;

		_action.fCurves = [];
		for (var ii = 0; ii < _action.numFCurves; ++ii) {
			let _fCurve = new object();
			let _fdp = readString(_dv, _off);
			_fCurve.dataPath = _fdp.string;
			_off += 4 + _fdp.length;
			//_fCurve.dataPath = readString(_dv, _off);
			//_off += 4 + _fCurve.dataPath.length;
			_fCurve.arrayIndex = _dv.getInt32(_off, true);
			console.log('dataPath: ' + _fCurve.dataPath + ', ' + _fCurve.arrayIndex);
			_off += 4;
			_fCurve.numKP = _dv.getInt32(_off, true);
			_off += 4;

			_fCurve.handles = [];
			for (var jj = 0; jj < _fCurve.numKP; ++jj) {
				let _point = new object();
				_point.handle_left = new object();
				_point.handle_left.x = _dv.getFloat32(_off, true);
				_off += 4;
				_point.handle_left.y = _dv.getFloat32(_off, true);
				_off += 4;
				_point.co = new object();
				_point.co.x = _dv.getFloat32(_off, true);
				_off += 4;
				_point.co.y = _dv.getFloat32(_off, true);
				_off += 4;
				_point.handle_right = new object();
				_point.handle_right.x = _dv.getFloat32(_off, true);
				_off += 4;
				_point.handle_right.y = _dv.getFloat32(_off, true);
				_off += 4;
				_fCurve.handles.push(_point);
			}
			_action.fCurves.push(_fCurve);
		}
		_action.off = _off;
		_action.animation_count = _action.frame_start;
		if (_openingAnimation) {
			_action.play = 1;
		} else {
			_action.play = 0;
		} //0: stop, 1: play loop, 2: play once (return to first frame), 3: play once (stay at last frame)
		_action.forward = true;
		_action.speed = 0.4;
		return _action;
	}

	function readNLATracks(_data, _dv, _counter) {
		let _hasNLATracks = readInt8(_dv, _counter);
		if (_hasNLATracks) {
			_data.numNLATracks = readInt32(_dv, _counter);
			_data.nLATracks = new obArray();
			for (var i = 0; i < _data.numNLATracks; i++) {
				let _track = new object();
				_track.name = readString(_dv, _counter);
				//let _type = _track.name.split('.')[1];
				let _trackNameArray = _track.name.split('.');
				if (_trackNameArray.length > 1) {
					_track.type = _trackNameArray[1];
				} else {
					_track.type = 'transform';
				}
				/*
				if (_type === 'pose') {
				//if (_track.name.split('.')[1] === 'pose') {
					_track.type = 'pose';
				} else if (_type === 'prop') {
					_track.type =
				} else {
					_track.type = 'transform';
				}
				*/
				_track.numStrips = readInt32(_dv, _counter);
				_track.strips = new obArray();
				for (var j = 0; j < _track.numStrips; j++) {
					let _action = new object();
					_action.name = readString(_dv, _counter);
					_action.action_frame_start = readFloat32(_dv, _counter);
					_action.action_frame_end = readFloat32(_dv, _counter);
					_action.frame_start = readFloat32(_dv, _counter);
					_action.frame_end = readFloat32(_dv, _counter);
					_action.repeat = readFloat32(_dv, _counter);
					_action.scale = readFloat32(_dv, _counter);
					_action.numFCurves = readInt32(_dv, _counter);
					_action.groups = new obArray();
					for (var ii = 0; ii < _action.numFCurves; ++ii) {
						let _fCurve = new object();
						let _dataPath = readString(_dv, _counter);
						let _group;
						/*
						if (_track.type === 'transform') {
							_fCurve.dataPath = _dataPath;
							_group = 'transform';
						} else if (_track.type === 'pose') {
						*/
						if (_track.type === 'pose') {
							let _pathArray = pathAnalisys(_dataPath);
							_group = _pathArray[1].split('"')[1];
							_fCurve.dataPath = _pathArray[2];
						} else {
							_fCurve.dataPath = _dataPath;
							_group = _track.type;
						}
						_fCurve.arrayIndex = readInt32(_dv, _counter);
						_fCurve.numKP = readInt32(_dv, _counter);

						_fCurve.handles = [];
						for (var jj = 0; jj < _fCurve.numKP; ++jj) {
							let _point = new object();
							_point.interpolation = readInt32(_dv, _counter);
							//Interpolation Mode 0: constant, 2: bezier
							_point.handle_left = {
								x: readFloat32(_dv, _counter),
								y: readFloat32(_dv, _counter)
							}
							_point.co = {
								x: readFloat32(_dv, _counter),
								y: readFloat32(_dv, _counter)
							}
							_point.handle_right = {
								x: readFloat32(_dv, _counter),
								y: readFloat32(_dv, _counter)
							}
							_fCurve.handles.push(_point);
						}
						if (_action.groups.name(_group) === undefined) {
							_action.groups.push({
								name: _group,
								fCurves: []
							});
						}
						_action.groups.name(_group).fCurves.push(_fCurve);
					}
					_track.strips.push(_action);
				}
				_track.animation_count = scene.sceneAnimations.name(scene.mainAnimation).frame_start;
				if (_track.name.split('.')[0] == scene.mainAnimation) {
					_track.play = 1;
				} else {
					_track.play = 0;
				} //0: stop, 1: play loop, 2: play once (return to first frame), 3: play once (stay at last frame)
				//console.log('\t\tstate:', _track.play? 'play': 'stop');
				_track.forward = true;
				_track.speed =  FPS_blender / FPS * ANIMATION_SPEED_MULTIPLIER;
				_data.nLATracks.push(_track);
			}
		}
	}

	function read3DModelData(_path, _objectName, _type) { //csvﾌｧｲﾙﾉ相対ﾊﾟｽor絶対ﾊﾟｽ
		//var coord = new Array();
		//var uv_coord = new Array();
		var data = new XMLHttpRequest();
		//data.open("GET", resourcePath + scene.name + '/objects/' + _objectName + '.dat', true); //true:非同期,false:同期
		data.open("GET", _path + '/objects/' + _objectName + '.dat', true); //true:非同期,false:同期
		data.responseType = 'arraybuffer';
		data.send(null);
		//console.log(_path + '/objects/' + _objectName + '.dat');

		data.onload = function(e) {
			var arrayBuffer = data.response;
			var dv = new DataView(arrayBuffer);
			var location = [];
			var rotation = [];
			var scale = [];
			var dimensions = [];
			var bound_box = [];
			let _counter = { //to increment bit offset inside functions
				off: 0
			}
			if (_type === 'object') {
				var ob = objects.name(_objectName);
			} else if (_type === 'UI') {
				var ob = obUI.name(_objectName);
			}

			//* console.log('readString_new:', readString_new(dv, _counter));
			let _ns = readString(dv, _counter);
			ob.type = readInt32(dv, _counter); //0:MESH, 1:CURVE, 7:EMPTY, 8:CAMERA
			ob.rotation_mode = readInt32(dv, _counter);

			for (var i = 0; i < 3; i++) {
				location.push(readFloat32(dv, _counter));
			}
			ob.location_o = location; //original location
			ob.location = location.slice(); //location

			var rotation_comp = 4;
			if (ob.rotation_mode != 0) {
				rotation_comp = 3;
			}
			for (var i = 0; i < rotation_comp; i++) {
				rotation.push(readFloat32(dv, _counter));
			}
			ob.rotation_o = rotation; //original rotation
			ob.rotation = rotation.slice(); //rotation

			for (var i = 0; i < 3; i++) {
				scale.push(readFloat32(dv, _counter));
			}
			ob.scale_o = scale; //original scale
			ob.scale = scale.slice(); //scale

			//console.log(ob.name, ob.location, ob.rotation, ob.scale);

			for (var i = 0; i < 3; i++) {
				dimensions.push(readFloat32(dv, _counter));
			}
			ob.dimensions = dimensions;

			ob.mMatrix0 = transformationMatrix(ob.location, ob.rotation, ob.scale, ob.rotation_mode);//Local coordinate
			ob.mMatrix = transformationMatrix(ob.location, ob.rotation, ob.scale, ob.rotation_mode);//Global coordinate

			readNLATracks(ob, dv, _counter);
			/*
			let _hasNLATracks = readInt8(dv, _counter);
			if (_hasNLATracks) {
				ob.numNLATracks = readInt32(dv, _counter);
				ob.nLATracks = new obArray();
				for (var i = 0; i < ob.numNLATracks; i++) {
					let _track = new object();
					_track.name = readString(dv, _counter);
					if (_track.name.split('.')[1] === 'pose') {
						_track.type = 'pose';
					} else {
						_track.type = 'transform';
					}
					_track.numStrips = readInt32(dv, _counter);
					_track.strips = new obArray();
					for (var j = 0; j < _track.numStrips; j++) {
						let _action = new object();
						_action.name = readString(dv, _counter);
						_action.action_frame_start = readFloat32(dv, _counter);
						_action.action_frame_end = readFloat32(dv, _counter);
						_action.frame_start = readFloat32(dv, _counter);
						_action.frame_end = readFloat32(dv, _counter);
						_action.repeat = readFloat32(dv, _counter);
						_action.scale = readFloat32(dv, _counter);
						_action.numFCurves = readInt32(dv, _counter);
						_action.groups = new obArray();
						for (var ii = 0; ii < _action.numFCurves; ++ii) {
							let _fCurve = new object();
							let _dataPath = readString(dv, _counter);
							let _group;
							if (_track.type === 'transform') {
								_fCurve.dataPath = _dataPath;
								_group = 'transform';
							} else if (_track.type === 'pose') {
								let _pathArray = pathAnalisys(_dataPath);
								_group = _pathArray[1].split('"')[1];
								_fCurve.dataPath = _pathArray[2];
							}
							_fCurve.arrayIndex = readInt32(dv, _counter);
							_fCurve.numKP = readInt32(dv, _counter);

							_fCurve.handles = [];
							for (var jj = 0; jj < _fCurve.numKP; ++jj) {
								let _point = new object();
								_point.interpolation = readInt32(dv, _counter);
								//Interpolation Mode 0: constant, 2: bezier
								_point.handle_left = {
									x: readFloat32(dv, _counter),
									y: readFloat32(dv, _counter)
								}
								_point.co = {
									x: readFloat32(dv, _counter),
									y: readFloat32(dv, _counter)
								}
								_point.handle_right = {
									x: readFloat32(dv, _counter),
									y: readFloat32(dv, _counter)
								}
								_fCurve.handles.push(_point);
							}
							if (_action.groups.name(_group) === undefined) {
								_action.groups.push({
									name: _group,
									fCurves: []
								});
							}
							_action.groups.name(_group).fCurves.push(_fCurve);
						}
						_track.strips.push(_action);
					}
					_track.animation_count = scene.sceneAnimations.name(scene.mainAnimation).frame_start;
					if (_track.name.split('.')[0] == scene.mainAnimation) {
						_track.play = 1;
					} else {
						_track.play = 0;
					} //0: stop, 1: play loop, 2: play once (return to first frame), 3: play once (stay at last frame)
					//console.log('\t\tstate:', _track.play? 'play': 'stop');
					_track.forward = true;
					_track.speed =  FPS_blender / FPS * ANIMATION_SPEED_MULTIPLIER;
					ob.nLATracks.push(_track);
				}
			}
			*/
			// CONSTRAINTS
			ob.constraints = [];
			let _numConstraints = readInt32(dv, _counter);
			for (var i = 0; i < _numConstraints; ++i) {
				let _constraint = new object();
				_constraint.type = readInt32(dv, _counter);
				let _cts;
				switch (_constraint.type) {
					case 20: //TRACK_TO
						_constraint.target = readString(dv, _counter);
						_constraint.trackAxis = readInt32(dv, _counter);
						_constraint.upAxis = readInt32(dv, _counter);
						break;
					case 23: //CHILD_OF
						_constraint.target = readString(dv, _counter);
						_constraint.useGeometries = [];
						for (var j = 0; j < 9; ++j) {
							_constraint.useGeometries.push(readInt8(dv, _counter) === 1 ? true: false);
						}
						break;
					case 25: //FOLLOW_PATH
						_constraint.target = readString(dv, _counter);
						_constraint.useCurveFollow = readInt8(dv, _counter) === 1 ? true: false;
						_constraint.forwardAxis = readInt32(dv, _counter);
						//0: 'FORWARD_X', 1: 'FORWARD_Y', 2: 'FORWARD_Z', 3: 'TRACK_NEGATIVE_X', 4: 'TRACK_NEGATIVE_Y', 5: 'TRACK_NEGATIVE_Z'
						_constraint.upAxis = readInt32(dv, _counter);
						//0: 'UP_X', 1: 'UP_Y', 2: 'UP_Z'
						break;
					default:
						return;
				}
				ob.constraints.push(_constraint);
			}
			if (ob.constraints.length > 0) {
				console.log(ob.name, ob.constraints);
			}

			ob.armature = '';
			// MODIFIERS
			ob.modifiers = [];
			let _numModifiers = readInt32(dv, _counter);
			for (var i = 0; i < _numModifiers; ++i) {
				let _modifier = new object();
				_modifier.type = readInt32(dv, _counter);
				switch (_modifier.type) {
					case 27: //ARMATURE
						_modifier.object = readString(dv, _counter);
						ob.armature = _modifier.object;
						break;
					default:
						return;
				}
				ob.modifiers.push(_modifier);
			}

			let _indexChildOf = -1;
			for (var ii = 0; ii < ob.constraints.length; ii++) {
				if (ob.constraints[ii].type === 23) {
					_indexChildOf = ii;
					break;
				}
			}

			if (ob.type == 0) {//object type 'MESH'
				var coord = new Array();
				var uv_coord = new Array();
				let bone_index = new Array();
				let bone_weight = new Array();

				//console.log('object name:', ob.name);
				let im = m.identity(m.create());
				m.transpose(ob.mMatrix, im);
				ob.numVertexGroups = readInt32(dv, _counter);
				ob.vertexGroups = new obArray();
				for (var i = 0; i < ob.numVertexGroups; ++i) {
					ob.vertexGroups.push({
						name: readString(dv, _counter),
						index: readInt32(dv, _counter)
					})
				}
				//console.log('number of vertex groups:', ob.numVertexGroups);
				//console.log('vertex groups:', ob.vertexGroups);

				ob.numLoop = readInt32(dv, _counter);
				//console.log('numLoop:', ob.numLoop);

				for	(var i = 0; i < ob.numLoop; ++i) {
					for (var j = 0; j < 3; ++ j) {
						coord.push(readFloat32(dv, _counter));
					}
					if (ob.numVertexGroups > 0) {
						let _bi = [];
						let _bw = [];
						let _numVG = readInt32(dv, _counter);
						for (var j = 0; j < _numVG; ++j) {
							_bi.push(readInt32(dv, _counter));
							_bw.push(readFloat32(dv, _counter));
						}
						for (var j = 0; j < 2; ++j) {
							if (_numVG > j) {
								bone_index.push(_bi[j]);
								bone_weight.push(_bw[j]);
							} else {
								bone_index.push(0);
								bone_weight.push(0.0);
							}
						}
					} else {
						bone_index.push(0, 0);
						bone_weight.push(0.0, 0.0);
					}
					//console.log(coord.slice(-3), bone_index.slice(-2), bone_weight.slice(-2));
				}
				if (ob.kind === 'selection_mesh' || ob.name === ob.selectMesh || ob.name === ob.pointMesh) {
					//let im = m.identity(m.create());
					//m.transpose(ob.mMatrix, im);
					tc = [];
					for (i = 0; i < ob.numLoop * 3; i += 3) {
						_v = coord.slice(i, i + 3).concat(1);
						m.multiplyV(im, _v, _v);
						tc.push(_v[0]);
						tc.push(_v[1]);
						tc.push(_v[2]);
					}
					ob.coord = tc;
				}

				for	(var i = 0; i < ob.numLoop; ++i) {
					for (var j = 0; j < 2; ++ j) {
						uv_coord.push(readFloat32(dv, _counter));
					}
				}

				for (var i = 0; i < 8; ++i) {
					let tb = [];
					for (var j = 0; j < 3; ++j) {
						tb.push(readFloat32(dv, _counter));
					}
					m.multiplyV(im, tb.concat(1), tb);
					bound_box.push(tb);
				}
				ob.bound_box = bound_box;

				let _iniVal = 1000000;
				let _range = [[_iniVal, _iniVal, _iniVal], [-_iniVal, -_iniVal, -_iniVal]]; //[min[x, y, z], max[x, y, z]]
				for (var i = 0 in bound_box) {
					for (var j = 0 in bound_box[i]) {
						if (bound_box[i][j] < _range[0][j]) {
							_range[0][j] = bound_box[i][j];
						}
						if (bound_box[i][j] > _range[1][j]) {
							_range[1][j] = bound_box[i][j];
						}
					}
				}
				ob.center = [(_range[0][0] + _range[1][0]) * 0.5, (_range[0][1] + _range[1][1]) * 0.5, (_range[0][2] + _range[1][2]) * 0.5]
				//console.log(_objectName, ob.center);

				var ind = new Array();
				for (var ii = 0; ii < ob.numLoop;++ii) {
					ind.push(ii);
				}
				//console.log(ob.name);
				//console.log(coord);
				//console.log(uv_coord);
				//console.log(ind);

				let vPosition     = create_vbo(coord);
				let vTextureCoord = create_vbo(uv_coord);
				let vBoneIndex = create_vbo(bone_index);
				let vBoneWeight = create_vbo(bone_weight);
				ob.VBOList       = [vPosition, vTextureCoord, vBoneIndex, vBoneWeight];
				ob.iIndex        = create_ibo(ind);

				for (var i = 0 in ob.textureList) {
					//console.log(ob.name, i, ob.textureList[i]);
					//create_texture(_path, ob.name, ob.textureList[i], _type);
					create_texture(_path + '/textures/', ob.textureList[i]);
				}
			} else if (ob.type === 1) {//object type 'CURVE'
				let _numSplines = readInt32(dv, _counter);
				ob.splines = [];
				for (var ii = 0; ii < _numSplines; ++ii) {
					let _spline = new object();
					_spline.numP = readInt32(dv, _counter);
					_spline.points = [];
					for (var jj = 0; jj < _spline.numP * 9; ++jj) {
						_spline.points.push(readFloat32(dv, _counter));
					}
					ob.splines.push(_spline);
				}

				let _hasCurveAction = readInt8(dv, _counter);
				if (_hasCurveAction) {
					console.log(ob.name);
					ob.curveAction = readAction(dv, off, ob.openingAnimation);
					off = ob.curveAction.off;
				}

			} else if (ob.type == 5) {//object type 'ARMATURE'
				ob.numBones = readInt32(dv, _counter);
				ob.bones = new obArray();
				for (var i = 0; i < ob.numBones; ++i) {
					ob.bones.push({
						name: readString(dv, _counter),
						parent: readString(dv, _counter),
						length: readFloat32(dv, _counter),
						head: readVec(dv, _counter, 3),
						matrix_local: new Float32Array(readMat(dv, _counter, 4)),
						matrix: new Float32Array(readMat(dv, _counter, 3)),
						matrix0: m.identity(m.create()), // for animation (local transform)
						matrixV: m.identity(m.create()), // for animation (vertex transform)
						matrixTest: m.identity(m.create()), // for debagging purpose
						rotation_mode: readInt32(dv, _counter)
					})
				}
				//console.log('armature object:', ob.name);
				//console.log('number of bones:', ob.numBones);
				//console.log('bones:', ob.bones);

			} else if (ob.type == 8) {//object type 'CAMERA'
				var _pMatrix = m.identity(m.create());
				ob.data = new object();
				ob.data.camera_type = readInt32(dv, _counter);
				ob.data.clip_start = readFloat32(dv, _counter);
				ob.data.clip_end = readFloat32(dv, _counter);
				switch (ob.data.camera_type) {// 0: PERSP, 1: ORTHO
					case 0: //PERSP
						ob.data.angle_y = readFloat32(dv, _counter);
						ob.data.angle_y0 = ob.data.angle_y; //initial value. Do not change!
						m.perspective(ob.data.angle_y / 1.0 * 180.0 / Math.PI, c.width / c.height, ob.data.clip_start, ob.data.clip_end, _pMatrix);
						ob.data.sensor_height = readFloat32(dv, _counter);
						break;
					case 1: //ORTHO
						ob.data.ortho_scale = readFloat32(dv, _counter);
						m.ortho(-ob.data.ortho_scale * c.width, ob.data.ortho_scale * c.width, ob.data.ortho_scale * c.height, -ob.data.ortho_scale * c.height, ob.data.clip_start, ob.data.clip_end, _pMatrix);
						break;
				}
				readNLATracks(ob.data, dv, _counter);
				ob.pMatrix = _pMatrix;
			}

			//objects[_objectName].dataReady = true;
			ob.dataReady = true;
			numDataReady += 1;
			//console.log('read object', ob.name);
			allDataReady = checkAllDataReady();

		}
	}

	function readUIData() {
		var data = new XMLHttpRequest();
		data.open("GET", resourcePath + 'UI/UI/UI-' + scene.UI + '.csv', false); //true:非同期,false:同期
		data.send(null);

		let LF = String.fromCharCode(10); //改行ｺｰﾄﾞ
		let lines = data.responseText.split(LF);
		let _UIData = lines[1].split(',');
		let UIIndex = 0;
		let num_object = Number(_UIData[0]);

		for (var i = 3; i < num_object + 3; i++) {
			let _line = lines[i].split(',');
			let lIndex = 0;
			let _name = _line[lIndex++];
			let _texture = [_line[lIndex++]];
			//let _fix = _line[lIndex++];
			let _type = _line[lIndex++];
			//let _texture = _line.slice(lIndex, lIndex + 2);
			//console.log('[readUIData] name: ' + _name + ', texture: ' + _texture);
			let ob = new object(_name);
			//ob.texture = new Array(); // WebGL texture
			ob.dataReady = false;
			ob.textureList = []; // List of textures (string)
			ob.texture_shift = [0.0, 0.0];

			for (var j = 0 in _texture) {
				if (_texture[j] != '') {
					ob.textureList.push(_texture[j]);
				}
			}
			//console.log(_name, ob.textureList);

			//ob.fix = _fix ==='yes' ? true : false;
			ob.UItype = _type;
			ob.draw = true;
			ob.alpha = 1.0;

			//console.log(_name, _texture);
			//obUI[_name] = ob;
			obUI.push(ob);
			read3DModelData(resourcePath + 'UI/' + scene.UI, _name, 'UI');
		}
	}

	function readTextData(_path) {
		let data = new XMLHttpRequest();
		data.open("GET", _path + '/text/text.dat', true); //true:非同期,false:同期
		data.responseType = 'arraybuffer';
		data.send(null);

		data.onload = function(e) {
			let arrayBuffer = data.response;
			let dv = new DataView(arrayBuffer);
			//* let off = 0;
			let _counter = { //to increment bit offset inside functions
				off: 0
			}

			let _numOb = readInt32(dv, _counter);
			//* let _numOb = dv.getInt32(off, true);
			//* off += 4;
			for (let i = 0; i < _numOb; i++) {
				let _ot = new obText();
				let _numColl = readInt32(dv, _counter);
				//* let _numColl = dv.getInt32(off, true);
				//* off += 4;
				_ot.attributes = {};
				for (let j = 0; j < _numColl; j++) {
					let _col = readString(dv, _counter);
					//* let _cs = readString(dv, off);
					//* let _col = _cs.string;
					//* off += 4 + _cs.length;
					//let _col = readString(dv, off);
					//off += 4 + _col.length;
					_ot.attributes[_col] = true;
				}
				//console.log(_ot.collections);
				//_ot.level = dv.getInt32(off, true);
				//off += 4;
				_ot.name = readString(dv, _counter);
				//* let _ons = readString(dv, off);
				//* _ot.name = _ons.string;
				//* off += 4 + _ons.length;
				//_ot.name = readString(dv, off);
				//off += 4 + _ot.name.length;
				//console.log(_ot.name);
				_ot.font = readString(dv, _counter);
				//* let _ofs = readString(dv, off);
				//* _ot.font = _ofs.string;
				//* off += 4 + _ofs.length;
				//_ot.font = readString(dv, off);
				//console.log(_ot.font, unescape(_ot.font));
				//off += 4 + _ot.font.length;
				_ot.location = [];
				for (let j = 0; j < 3; j++) {
					_ot.location.push(readFloat32(dv, _counter));
					//* _ot.location.push(dv.getFloat32(off, true));
					//* off += 4;
				}
				_ot.ratio = readFloat32(dv, _counter);
				//* _ot.ratio = dv.getFloat32(off, true);
				//* off += 4;

				let _sizeX = 6.0 * _ot.ratio;
				let _sizeY = 6.0;
				let _coord = [
					_sizeX, -_sizeY, 0.0, -_sizeX, _sizeY, 0.0, -_sizeX, -_sizeY, 0.0,
					_sizeX, -_sizeY, 0.0, _sizeX, _sizeY, 0.0, -_sizeX, _sizeY, 0.0
				]
				let _uv_coord = [
					1.0, 1.0, 0.0, 0.0, 0.0, 1.0,
					1.0, 1.0, 1.0, 0.0, 0.0, 0.0
				]
				let _ind = [0, 1, 2, 3, 4, 5];
				let _vPosition     = create_vbo(_coord);
				let _vTextureCoord = create_vbo(_uv_coord);
				_ot.VBOList = [_vPosition, _vTextureCoord];
				_ot.iIndex = create_ibo(_ind);
				_ot.numLoop	= 6;

				obTexts.push(_ot);
				create_texture(_path + '/text/', _ot.font);
			}
			//console.log('obTexts:', obTexts);
		}
	}

	function readSoundData(_path) {
		for (let i in scene.sceneSounds) {
			//let _sound = new Audio(_path + '/sounds/' + scene.sceneSounds[i].name + '.mp3');
			let _sound = new Audio(_path + '/sounds/' + scene.sceneSounds[i].name + '.m4a');
			_sound.load();
			_sound.play();
			_sound.pause();
			_sound.currentTime = 0;
			_sound.loop = true;
			_sound.volume = 0.5;
			scene.sceneSounds[i].sound = _sound;
			/*
			if (scene.mainSound === scene.sceneSounds[i].name) {
				_sound.play();
			}
			*/
		}
	}

	function checkAllDataReady() {
		var ready = true;
		for (var i in objects) {
			let _ob = objects[i];
			if (!_ob.dataReady) {
				ready = false;
				break;
			}
			if (_ob.type == 0 && _ob.kind === 'mesh' && !obTextures.name(_ob.textureList[0])) {
				ready = false;
				break;
			}
		}
		for (var i = 0 in obUI) {
			if(!obUI[i].dataReady) {
				ready = false;
				break;
			}
			if (!obTextures.name(obUI[i].textureList[0])) {
				ready = false;
				break;
			}
		}
		if (ready) {
			for (let i in objects) {
				let _order = countOrder(objects[i].name);
			}
			objects.sort((a, b) => a.order > b.order);

			if (scene.mainSound != '') {
				let _sound = scene.sceneSounds.name(scene.mainSound).sound;
				// REFERENCE: https://qiita.com/shinkuFencer/items/b15488de72b32621acf9
				if (_sound.readyState === 4) {
					_sound.play();
				} else {
					ready = false;
				  // 再生可能状態でなければ再生可能状態になった時のイベント通知をセットします
				  _sound.addEventListener('canplaythrough', function (e) {
				    _sound.removeEventListener('canplaythrough', arguments.callee);
				    _sound.play();
						allDataReady = true;
				  });
				}
			}
		}
		//console.log(objects);
		return ready;
	}

	function readActionData(acName) {
		var Co = function (_co) {
			this.x = parseFloat(_co[0]);
			this.y = parseFloat(_co[1]);
		}
		var Point = function () {

		}
		var Bezier = function () {

		}
		var Action = function () {}

		var data = new XMLHttpRequest();
		data.open("GET", './resource/actions/' + acName + '.csv', false); //true:非同期,false:同期
		data.send(null);

		var LF = String.fromCharCode(10); //改行ｺｰﾄﾞ
		var lines = data.responseText.split(LF);
		var cl = 0

		let aT = lines[cl++]; //action type

		let frRange = lines[cl++].split(',');
		let nB = parseInt(lines[cl++]);
		let beziers = [];
		for (var i = 0; i < nB; ++i) {
			var bz = new Bezier();
			bz.data_path = lines[cl];
			bz.array_index = parseInt(lines[cl + 1]);
			bz.keyframe_points = parseInt(lines[cl + 2]);
			cl += 3;
			bz.handles = [];
			for (var j = 0; j < bz.keyframe_points; ++j) {
				var point = new Point();
				point.handle_left = new Co(lines[cl].split(','));
				point.co = new Co(lines[cl + 1].split(','));
				point.handle_right = new Co(lines[cl + 2].split(','));
				bz.handles.push(point);
				cl += 3;
			}
			beziers.push(bz);
		}

		var action = new Action();

		action.frame_start = parseFloat(frRange[0]);
		action.frame_end = parseFloat(frRange[1]);
		action.numCurve = nB;
		action.curves = beziers;

		if (aT === 'object action') {
			action.type = 0;
		} else if (aT === 'material action') {
			action.type = 1;
		}

		action.play = 1; //0: stop, 1: play loop, 2: play once (return to first frame), 3: play once (stay at last frame)
		action.forward = true;

		return action;
	}

	//function evaluateNLATrack(_obName, _track) {
	function evaluateNLATrack(_ob, _track) {
		//let _ob = objects.name(_obName);
		let _x = _track.animation_count;
		//let _stripIndex = 0;
		let _stripIndex = _track.strips.length - 1;
		for (var i = 0; i < _track.strips.length; i++) {
			if (_x <= _track.strips[i].frame_end) {
				_stripIndex = i;
				break;
			}
		}
		let _strip = _track.strips[_stripIndex];
		let _xAc = (_x - _strip.frame_start) / _strip.scale % (_strip.action_frame_end - _strip.action_frame_start) + _strip.action_frame_start;
		if ((_x - _strip.frame_start) / _strip.scale > (_strip.action_frame_end - _strip.action_frame_start) * _strip.repeat) {
			_xAc = _strip.action_frame_end;
		}
		if (_track.type === 'transform') {
			_ob.mMatrix0 = evaluateTransform(_ob.location, _ob.rotation, _ob.scale, _ob.rotation_mode, _strip.groups.name('transform'), _xAc);
		} else if (_track.type === 'pose') {
			for (var i = 0; i < _strip.groups.length; i++) {
				let _group = _strip.groups[i];
				let _bone = _ob.bones.name(_group.name);
				_bone.matrix0 = evaluateTransform([0.0, 0.0, 0.0], [0.0, 0.0, 0.0, 1.0], [1.0, 1.0, 1.0], _bone.rotation_mode, _group, _xAc);
			}
			for (var i = 0; i < _ob.bones.length; i++) {
				let _bone = _ob.bones[i];
				let _lMatrixInv = m.identity(m.create());
				m.inverse(_bone.matrix_local, _lMatrixInv);
				m.multiply(vertexTransformMatrixWithBone(_bone, _ob.bones), _lMatrixInv, _bone.matrixV);
			}
		} else if (_track.type === 'prop') {
			let _group = _strip.groups.name('prop');
			for (let i = 0; i < _group.fCurves.length; i++) {
				let _fCurve = _group.fCurves[i];
				if (_fCurve.dataPath == 'lens') {
					_ob.angle_y = 2.0 * Math.atan(_ob.sensor_height / bezier2D(_fCurve.handles, _xAc) / 2.0);
				}
			}
		}
	}

	function vertexTransformMatrixWithBone(_bone, _bones) {
		//console.log('\t\tparent bone: ', _bone.name);
		let _headMatrix = m.identity(m.create());
		let _boneMatrix = m.identity(m.create());
		let _m0Matrix = m.identity(m.create());
		m.translate(_headMatrix, _bone.head, _headMatrix);
		_bone.matrixTest = _headMatrix;
		m.to4x4(_bone.matrix, _boneMatrix);
		//m.transpose(_boneMatrix, _boneMatrix);

		m.multiply(_boneMatrix, _bone.matrix0, _m0Matrix);
		//m.multiply(_bone.matrix, _bone.matrix0, _m0Matrix);
		m.multiply(_headMatrix, _m0Matrix, _m0Matrix);
		if (_bone.parent != '') {
			let pBone = _bones.name(_bone.parent);
			let _lengthMatix = m.identity(m.create());
			m.translate(_lengthMatix, [0.0, pBone.length, 0.0], _lengthMatix);
			m.multiply(_lengthMatix, _m0Matrix, _m0Matrix);
			m.multiply(vertexTransformMatrixWithBone(pBone, _bones), _m0Matrix, _m0Matrix);
		}
		return _m0Matrix;
	}


	function evaluateTransform(_loc, _rot, _sc, _rotMode, _group, _xAc) {
		let _locVec = _loc;
		let _rotVec = _rot;
		let _scVec = _sc;
		let _rotation_mode = _rotMode;

		for (var i = 0; i < _group.fCurves.length; i++) {
			let _fCurve = _group.fCurves[i];
			if (_fCurve.dataPath == 'location') {
				_locVec[_fCurve.arrayIndex] = bezier2D(_fCurve.handles, _xAc);
			} else if (_fCurve.dataPath == 'scale') {
				_scVec[_fCurve.arrayIndex] = bezier2D(_fCurve.handles, _xAc);
			} else if (_fCurve.dataPath == 'rotation_euler') {
				_rotVec[_fCurve.arrayIndex] = bezier2D(_fCurve.handles, _xAc);
			} else if (_fCurve.dataPath == 'rotation_quaternion') {
				_rotVec[_fCurve.arrayIndex] = bezier2D(_fCurve.handles, _xAc);
			}
		}

		return transformationMatrix(_locVec, _rotVec, _scVec, _rotation_mode);
	}

	function evaluateAction(_obName, _action) {
	//function evaluateAction(_obName) {
		let _ob = objects.name(_obName);
		//let _action = _ob.objectAction;
		let _x = _action.animation_count;
		//let locVec = _ob.location.slice();
		//let rotVec = _ob.rotation.slice();
		//let scVec = _ob.scale.slice();
		let locVec = _ob.location;
		let rotVec = _ob.rotation;
		let scVec = _ob.scale;
		let _rotation_mode = _ob.rotation_mode;

		for (var i = 0; i < _action.numFCurves; i++) {
			if (_action.fCurves[i].dataPath == 'location') {
				locVec[_action.fCurves[i].arrayIndex] = bezier2D(_action.fCurves[i].handles, _x);
			} else if (_action.fCurves[i].dataPath == 'scale') {
				scVec[_action.fCurves[i].arrayIndex] = bezier2D(_action.fCurves[i].handles, _x);
			} else if (_action.fCurves[i].dataPath == 'rotation_euler') {
				rotVec[_action.fCurves[i].arrayIndex] = bezier2D(_action.fCurves[i].handles, _x);
			} else if (_action.fCurves[i].dataPath == 'rotation_quaternion') {
				rotVec[_action.fCurves[i].arrayIndex] = bezier2D(_action.fCurves[i].handles, _x);
			}
		}
		_ob.mMatrix0 = transformationMatrix(locVec, rotVec, scVec, _rotation_mode);
		//_ob.location = locVec;
		//_ob.rotation = rotVec;
		//_ob.scale = scVec;
	}

	function evaluateMaterialAction(_action, _x) {
		let material = function () {

		}
		for (var i = 0; i < _action.numCurve; i++) {
			if (_action.curves[i].data_path === 'alpha') {
				material.alpha = bezier2D(_action.curves[i].handles, _x);
			}
		}
		return material;
	}

	function transformationMatrix(_loc, _rot, _scale, _rot_mode) {
		var mMatrix = m.identity(m.create());

		var mQtn = q.identity(q.create());
		var rMatrix = m.identity(m.create());
		var _tMatrix = m.identity(m.create());
		var sMatrix = m.identity(m.create());

		switch (_rot_mode) {
			case 0:
				mQtn[0] = _rot[1];
				mQtn[1] = _rot[2];
				mQtn[2] = _rot[3];
				mQtn[3] = _rot[0];
				q.inverse(mQtn, mQtn);
				q.toMatIV(mQtn, rMatrix);
				break;
			case 1://XYZ
				//m.rotate(rMatrix, _rot[0], [1, 0, 0], rMatrix);
				//m.rotate(rMatrix, _rot[1], [0, 1, 0], rMatrix);
				m.rotate(rMatrix, _rot[2], [0, 0, 1], rMatrix);
				m.rotate(rMatrix, _rot[1], [0, 1, 0], rMatrix);
				m.rotate(rMatrix, _rot[0], [1, 0, 0], rMatrix);
				break;
			case 2://XZY
				m.rotate(rMatrix, _rot[0], [1, 0, 0], rMatrix);
				m.rotate(rMatrix, _rot[2], [0, 0, 1], rMatrix);
				m.rotate(rMatrix, _rot[1], [0, 1, 0], rMatrix);
				break;
			case 3://YXZ
				m.rotate(rMatrix, _rot[1], [0, 1, 0], rMatrix);
				m.rotate(rMatrix, _rot[0], [1, 0, 0], rMatrix);
				m.rotate(rMatrix, _rot[2], [0, 0, 1], rMatrix);
				break;
			case 4://YZX
				m.rotate(rMatrix, _rot[1], [0, 1, 0], rMatrix);
				m.rotate(rMatrix, _rot[2], [0, 0, 1], rMatrix);
				m.rotate(rMatrix, _rot[0], [1, 0, 0], rMatrix);
				break;
			case 5://ZXY
				m.rotate(rMatrix, _rot[2], [0, 0, 1], rMatrix);
				m.rotate(rMatrix, _rot[0], [1, 0, 0], rMatrix);
				m.rotate(rMatrix, _rot[1], [0, 1, 0], rMatrix);
				break;
			case 6://ZYX
				m.rotate(rMatrix, _rot[2], [0, 0, 1], rMatrix);
				m.rotate(rMatrix, _rot[1], [0, 1, 0], rMatrix);
				m.rotate(rMatrix, _rot[0], [1, 0, 0], rMatrix);
				break;
		}

		m.translate(_tMatrix, _loc, _tMatrix);
		m.scale(sMatrix, _scale, sMatrix);

		m.multiply(_tMatrix, sMatrix, mMatrix);
		m.multiply(mMatrix, rMatrix, mMatrix);
		//m.multiply(sMatrix, rMatrix, mMatrix);
		//m.multiply(mMatrix, _tMatrix, mMatrix);
		return mMatrix;
	}

	function bezier2D(_handles, _x) {
		if (_handles[0].co.x >= _x) {
			return _handles[0].co.y;
		} else if (_handles[_handles.length - 1].co.x <= _x) {
			return _handles[_handles.length - 1].co.y;
		//if ((_handles[0].co.x > _x) || (_handles[_handles.length - 1].co.x < _x)) {
		//	return null;
		} else {
			for (var ir = 0 in _handles) {
				if (_handles[ir].co.x > _x) {
					break;
				}
			}
			ir -= 1;
			var cp = [_handles[ir].co, _handles[ir].handle_right, _handles[ir + 1].handle_left, _handles[ir + 1].co];
			var t = (_x - cp[0].x) / (cp[3].x - cp[0].x);
			var delta = (t > 0.5) ? (1.0 - t) * 0.5 : t * 0.5;
			var pdif;
			var dif = 0.5;
			var n = 0;
			var ae = 0.0001;
			while (Math.abs(dif) > ae) {
				pdif = dif;
				dif = _x - (
							 cp[0].x * (1.0 - t) * (1.0 - t) * (1.0 - t)
							 + 3.0 * cp[1].x * t * (1.0 - t) * (1.0 - t)
							 + 3.0 * cp[2].x * t * t * (1.0 - t)
							 + cp[3].x * t * t * t
							 );
				if (dif * pdif < 0) {
					delta *= 0.5;
				}
				if (dif > ae) {
					t += delta;
				} else if (dif < -ae) {
					t -= delta;
				}
				n += 1;
			}
			var y = cp[0].y * (1.0 - t) * (1.0 - t) * (1.0 - t)
			+ 3.0 * cp[1].y * t * (1.0 - t) * (1.0 - t)
			+ 3.0 * cp[2].y * t * t * (1.0 - t)
			+ cp[3].y * t * t * t;

			return y;
		}

	}

	function fromObTo2D(_ob) {
		let _currentRect = c.getBoundingClientRect();
		let tmvpMatrix = m.identity(m.create());
		m.multiply(vpMatrix, _ob.mMatrix, tmvpMatrix);
		let _2dLocation = tmvpMatrix.slice(12);
		_2dLocation[0] = (_2dLocation[0] / _2dLocation[3] + 1.0) * _currentRect.width * 0.5;
		_2dLocation[1] = (1.0 - _2dLocation[1] / _2dLocation[3]) * _currentRect.height * 0.5;
		//_2dLocation[0] = (_2dLocation[0] / _2dLocation[3] + 1.0) * c.width * 0.5;
		//_2dLocation[1] = (1.0 - _2dLocation[1] / _2dLocation[3]) * c.height * 0.5;
		return _2dLocation;
	}

	function from3DPointTo2D(_v) {
		let _2dLocation = [0, 0, 0, 0];
		let _tvpMatrix = m.identity(m.create());
		m.transpose(vpMatrix, _tvpMatrix);
		m.multiplyV(_tvpMatrix, _v, _2dLocation);
		_2dLocation[0] = (_2dLocation[0] / _2dLocation[3] + 1.0) * c.width * 0.5;
		_2dLocation[1] = (_2dLocation[1] / _2dLocation[3] + 1.0) * c.height * 0.5;
		return _2dLocation;
	}

	function selectPoint(_location) {
		let _currentRect = c.getBoundingClientRect();
		let _selObInfo = selection_3D(_location, 'point');
		if (_selObInfo.object != null) {
			selectedAnnotation = null;
			//UIInteractionUpdate();
			annotationMode = 2;
			tempAnnotation.loc = _selObInfo.point;
			tempAnnotation.ob = _selObInfo.object;
			tempAnnotation.normal = _selObInfo.normal;
			memoContainerElement.style.visibility = 'visible';
			//memo.style.visibility = 'visible';
			navigatable = false;

			let _memo_x = _location.x;
			let _memo_y = _location.y;
			if (_memo_y > _currentRect.height - 120) {
			//if (_memo_y > c.height - 120) {
				_memo_y -= 80;
			}
			if (_memo_x > _currentRect.width - 200) {
			//if (_memo_x > c.width - 200) {
				_memo_x -= 200;
			}
			console.log(_location.x, _location.y, _memo_x, _memo_y);
			memoContainerElement.style.left = Math.floor(_memo_x) + "px";
			memoContainerElement.style.top  = Math.floor(_memo_y + 20) + "px";
			memo.style.left = Math.floor(_memo_x) + "px";
			memo.style.top  = Math.floor(_memo_y + 10) + "px";
			memoOK.style.left = Math.floor(_memo_x) + "px";
			memoOK.style.top  = Math.floor(_memo_y - 30) + "px";
			memoCancel.style.left = Math.floor(_memo_x) + "px";
			memoCancel.style.top  = Math.floor(_memo_y - 30) + "px";
			//memo.style.pointerEvents = 'auto';
			memoContainerElement.style.pointerEvents = 'auto';
			//eText.textContent = _location.x + ', ' + _location.y;
			//eText.textContent = memo.value;
		}
	}

	function selectBlock(_location) {
		let _selObInfo = selection_3D(_location, 'block');
		//console.log(_selObInfo.object);

		if (_selObInfo.object != null) {
			//console.log(_selObInfo.object, selectedObject);
			if (_selObInfo.object === selectedObject) {
				selectedObject = null;
				//text01 = '';
				comment.style.visibility = 'hidden';
				buttonContainerElement.style.visibility = 'hidden';
			} else {
				selectedObject = _selObInfo.object;
				let _selOb = objects.name(selectedObject);
				//console.log(objects[selectedObject].name, objects[selectedObject].hasDetail);

				if (_selOb.hidable) {
					obButton.src = './resource/UI/html/UI_obButton_hide.png';
					buttonContainerElement.style.visibility = 'visible';
					obButton.style.pointerEvents = 'auto';
					mousePressed = false;
					touched = false;
				} else if (_selOb.hasDetail) {
					obButton.src = './resource/UI/html/UI_obButton_detail.png';
					buttonContainerElement.style.visibility = 'visible';
					obButton.style.pointerEvents = 'auto';
					mousePressed = false;
					touched = false;
				} else {
					buttonContainerElement.style.visibility = 'hidden';
				}

				replaceCommentText(_selOb.description);
				text01 = selectedObject.substring(0, selectedObject.length - 3);
			}
		}
		//console.log(selectedObject);
	}

	function replaceCommentText(_string) {
		let _strArray = _string.split('¥');
		while (comment.firstChild) comment.removeChild(comment.firstChild);
		for (var i = 0 in _strArray) {
			comment.appendChild(document.createTextNode(_strArray[i]));
			comment.appendChild(document.createElement('br'));
		}
	}

	function selection_3D(_location, _type) {
		let _currentRect = c.getBoundingClientRect();
		var x = (2.0 * _location.x) / _currentRect.width -1.0;
		var y = 1.0 - (2.0 * _location.y) /_currentRect.height;
		//var x = (2.0 * _location.x) / c.width -1.0;
		//var y = 1.0 - (2.0 * _location.y) /c.height;
		var z = 1.0;

		//let _obCamera = objects[obCamera[camMode]];
		//let _obCamera = objects.name(obCamera[camMode]);
		let _obCamera = objects.name(activeCamera);
		//let _obCamera = objects.name(obCamera[0]);
		var invPMatrix = m.identity(m.create());
		m.transpose(_obCamera.pMatrix, invPMatrix);
		m.inverse(invPMatrix, invPMatrix);
		var invVMatrix = m.identity(m.create());

		m.inverse(_obCamera.mMatrix, vTempMatrix);
		m.transpose(vTempMatrix, invVMatrix);
		m.inverse(invVMatrix, invVMatrix);
		var ray_eye =[0, 0, 0, 0];
		var ray_wldt = [0, 0, 0, 0];
		m.multiplyV(invPMatrix, [x, y, -1.0, 1.0], ray_eye);
		m.multiplyV(invVMatrix, [ray_eye[0], ray_eye[1], -1.0, 0.0], ray_wldt);
		var len = Math.sqrt(ray_wldt[0] * ray_wldt[0] + ray_wldt[1] * ray_wldt[1] + ray_wldt[2] * ray_wldt[2]);
		var ray_wld = [ray_wldt[0] / len, ray_wldt[1] / len, ray_wldt[2] / len];

		let _selOb = null;
		let _depth = 1000000;
		let _selPoint = [0.0, 0.0, 0.0];
		let _selNormal = [0.0, 0.0, 0.0];

		for (var i in objects) {
			let _ob = objects[i];
			if (
				_type === 'point' &&
				_ob.pointMesh != '' &&
				_ob.draw &&
				((_ob.internal != 'internal' && !drawInternal) || (_ob.internal != 'external' && drawInternal)) &&
				!scrutinyMode
				//_ob.internal === drawInternal
			) {
				//let _selInfo = selectObject(objects[_ob.pointMesh], ray_wld);
				let _selInfo = selectObject(objects.name(_ob.pointMesh), ray_wld);
				if (_selInfo.depth < _depth) {
					_depth = _selInfo.depth;
					_selPoint = _selInfo.point;
					_selNormal = _selInfo.normal;
					_selOb = i;
				}
			}
			if (
				_type === 'block' &&
				_ob.draw &&
				_ob.selectMesh != '') {
				let _selInfo = selectObject(objects.name(_ob.selectMesh), ray_wld);
				if (_selInfo.depth < _depth) {
					_depth = _selInfo.depth;
					_selPoint = _selInfo.point;
					_selNormal = _selInfo.normal;
					//_selOb = i;
					_selOb = objects[i].name;
				}
			}
		}
		let _selObInfo = new object();
		_selObInfo.object = _selOb;
		_selObInfo.point = _selPoint;
		_selObInfo.normal = _selNormal;
		return _selObInfo;
	}

	function selectObject(_ob, _ray) {
		//_ob.depth = 1000000;
		let _depth = 1000000;
		let _selPoint = [0.0, 0.0, 0.0];
		let _selNormal = [0.0, 0.0, 0.0];
		for (let l = 0; l < _ob.numLoop * 3; l += 9) {
			_p0 = _ob.coord.slice(l, l + 3);
			_p1 = _ob.coord.slice(l + 3, l + 6);
			_p2 = _ob.coord.slice(l + 6, l + 9);
			//_o = objects[obCamera[camMode]].mMatrix.slice(12, 15);
			//_o = objects.name(obCamera[camMode]).mMatrix.slice(12, 15);
			_o = objects.name(activeCamera).mMatrix.slice(12, 15);
			_d = _ray;
			_e = vecSub(_o, _p0);
			_e1 = vecSub(_p1, _p0);
			_e2 = vecSub(_p2, _p0);
			_q = cross(_d, _e2);
			_r = cross(_e, _e1);
			_t = dot(_r, _e2) / dot(_q, _e1);
			_u = dot(_q, _e) / dot(_q, _e1);
			_v = dot(_r, _d) / dot(_q, _e1);
			if (_u > 0 && _v > 0 && 1 - _u - _v > 0 && _t < _depth) {
				_depth = _t;
				//_tuv = [_t, _u, _v];
				_selPoint = vecAdd(_p0, vecAdd(scalarVec(_u, _e1), scalarVec(_v, _e2)));
				_selNormal = normalize(cross(_e1, _e2));
			}
		}
		let _selInfo = new object();
		_selInfo.depth = _depth;
		_selInfo.point = _selPoint;
		_selInfo.normal = _selNormal;
		return _selInfo;
	}

	function buttonPressed(_button, _location) {
		let _currentRect = c.getBoundingClientRect();
		let _asp = _currentRect.width / initialCanvasSize[0];
		eText.textContent = _asp;
		//eText.textContent = c.width + ', ' + c.getBoundingClientRect().width + ', ' + initialCanvasSize[0];
		if (obUI.name(_button) != null) {
			let loc = obUI.name(_button).location;
			let dim = obUI.name(_button).dimensions;
			if (
				_location.x > (loc[0] - 0.5 * dim[0]) * _asp &&
				_location.x < (loc[0] + 0.5 * dim[0]) * _asp &&
				_currentRect.height - _location.y > (loc[1] - 0.5 * dim[1]) * _asp &&
				_currentRect.height - _location.y < (loc[1] + 0.5 * dim[1]) * _asp
			) {
			//if (_location.x > loc[0] - 0.5 * dim[0] && _location.x < loc[0] + 0.5 * dim[0] && c.height - _location.y > loc[1] - 0.5 * dim[1] && c.height - _location.y < loc[1] + 0.5 * dim[1]) {
				return true;
			} else {
				return false;
			}
		} else {
			return false;
		}
	}

	function checkButtons(_location) {
		if (buttonPressed('UI_revert_button', _location)) {
			for (let i in objects) {
				let _ob = objects[i];
				_ob.mMatrix0 = transformationMatrix(_ob.location_o, _ob.rotation_o, _ob.scale_o, _ob.rotation_mode);
				_ob.location = _ob.location_o.slice();
				_ob.rotation = _ob.rotation_o.slice();
				_ob.scale = _ob.scale_o.slice();
				if (_ob.type === 8) {
					_ob.data.angle_y = _ob.data.angle_y0;
				}
			}
			cameraVertAngle = 0.0;
			drawMap = false;
			drawInternal = false;
			scrutinyMode = false;
			stencilMode = false;
			navigatable = true;
			selectedObject = null;
			selectedAnnotation = null;
			comment.style.visibility = 'hidden';
			buttonContainerElement.style.visibility = 'hidden';
			if (obUI.name('UI_ex-in_button')) {
				obUI.name('UI_ex-in_button').texture_shift[0] = 0.0;
			}

			for (var i = 0; i < hiddenObjects.length; i++) {
				objects.name(hiddenObjects[i]).draw = true;
			}
			hiddenObjects = [];
			if (obUI.name('UI_show_button')) {
				obUI.name('UI_show_button').texture_shift[0] = 0.0;
			}
		}
		if (buttonPressed('UI_terrain_button', _location)) {
			drawTerrain = !drawTerrain;
		}
		if (buttonPressed('UI_map_button', _location)) {
			drawMap = !drawMap;
		}
		if (buttonPressed('UI_info_button', _location)) {
			drawText = !drawText;
			/*
			if (selectedObject != null) {
				if (comment.style.visibility === 'visible') {
					comment.style.visibility = 'hidden';
				} else if (comment.style.visibility === 'hidden') {
					comment.style.visibility = 'visible';
					UIInteractionUpdate();
				}
			}
			*/
		}
		if (buttonPressed('UI_ex-in_button', _location)) {
			drawInternal = !drawInternal;
			obUI.name('UI_ex-in_button').texture_shift[0] = drawInternal ? 0.5: 0.0;
		}
		/*
		if (buttonPressed('UI_scrutiny_button', _location)) {
			scrutinyMode = !scrutinyMode;
			drawInternal = false;
		}
		*/
		if (buttonPressed('UI_point_button', _location)) {
			switch (annotationMode) {
				case 0:
					annotationMode = 1;
					obUI.name('UI_point_button').texture_shift[0] = 0.5;
					break;
				case 1:
					annotationMode = 0;
					obUI.name('UI_point_button').texture_shift[0] = 0.0;
					break;
				default:
					return;
			}
		}
		if (buttonPressed('UI_show_button', _location)) {
			if (obUI.name('UI_show_button').texture_shift[0] === 0.5) {
				for (var i = 0; i < hiddenObjects.length; i++) {
					//objects[hiddenObjects[i]].draw = true;
					objects.name(hiddenObjects[i]).draw = true;
				}
				hiddenObjects = [];
				obUI.name('UI_show_button').texture_shift[0] = 0.0;
			}
		}
		if (buttonPressed('UI_whole_button', _location)) {
			loadScene(scene.parent);
		}
		if (buttonPressed('UI_play_pause_button', _location)) {
			if (animationPosed) {
				animationPosed = false;
				scene.sceneSounds.name(scene.mainSound).sound.play();
				obUI.name('UI_play_pause_button').texture_shift[0] = 0.0;
				//sceneCamera = scene.sceneAnimations.name('animation01').camera;
			} else {
				animationPosed = true;
				console.log(scene.sceneSounds.name(scene.mainSound).name);
				scene.sceneSounds.name(scene.mainSound).sound.pause();
				obUI.name('UI_play_pause_button').texture_shift[0] = 0.5;
			}
		}
	}

	function checkAnnotations(_location) {
		let _currentRect = c.getBoundingClientRect();
		let _asp = _currentRect.width / initialCanvasSize[0];
		let _selAnno = null;
		//selectedAnnotation = null;
		for (var i in annotations) {
			console.log(annotations[i].desc);
			let loc = annotations[i].loc_2D;
			let dim = obUI.name('UI_annotation').dimensions;
			if (
				_location.x > (loc[0] - 0.5 * dim[0]) * _asp &&
				_location.x < (loc[0] + 0.5 * dim[0]) * _asp &&
				_currentRect.height - _location.y > (loc[1] - 0.5 * dim[1]) * _asp &&
				_currentRect.height - _location.y < (loc[1] + 0.5 * dim[1]) * _asp
			) {
			//if (_location.x > loc[0] - 0.5 * dim[0] && _location.x < loc[0] + 0.5 * dim[0] && c.height - _location.y > loc[1] - 0.5 * dim[1] && c.height - _location.y < loc[1] + 0.5 * dim[1]) {
				//selectedAnnotation = annotations[i];
				_selAnno = annotations[i];
				//textContent = annotations[i].desc;
				break;
			}
		}
		if (_selAnno === selectedAnnotation) {
			selectedAnnotation = null;
		} else if (_selAnno != null){
			selectedAnnotation = _selAnno;
		}
		if (selectedAnnotation) {
			replaceCommentText(selectedAnnotation.desc);
			comment.style.border = 'none';
			comment.style.backgroundColor = 'transparent';
			comment.style.visibility = 'visible';
			//UIInteractionUpdate();
		} else {
			comment.style.visibility = 'hidden';
		}
	}

	function mouseDown(e) {
		if (opening_count >= OPENING_LENGTH ) {

			if (!animationPosed && scene.navigatable) {
				animationPosed = true;
			}
			/*
			for (var i in objects) {
				let _ob = objects[i];
				if (_ob.hasOwnProperty('animationData')) {
					for (var j in _ob.animationData) {
						_ob.animationData[j].play = 0;
					}
				}
			}
			*/
			mousePressed = true;
			mouseButton = e.button;
			staticallyPressed = true;
			statPressedTime = new Date().getTime();
			prevMouseLocation = getMouseLocation(e);
			currentMouseLocation = prevMouseLocation;
			switch (annotationMode) {
				case 0:
					selectBlock(currentMouseLocation);
					break;
				case 1:
					selectPoint(currentMouseLocation);
					break;
				default:
					return;
			}
			/*
			if (pointable) {
				selectPoint(currentMouseLocation);
			} else {
				selectBlock(currentMouseLocation);
			}
			*/
			//selection_3D(currentMouseLocation);
			//UIInteractionUpdate();
			/*
			if (comment.style.visibility === 'visible') {
				textRender();
			}
			*/
			if (prevMouseLocation.x > c.width * 0.9 && prevMouseLocation.y > c.height * 0.9) {
				//toggleCameraAction();
				//drawMode += 1;
				//drawMode %= numDrawMode;
				//drawUpdate();
			}
		}
	}

	function mouseMove(e) {
		if (opening_count >= OPENING_LENGTH) {
			currentMouseLocation = getMouseLocation(e);

			if (!scrutinyMode && staticallyPressed) {
				staticallyPressed = false;
			}
			/*
			c.style.cursor = 'default';
			for (let _key in buttons) {
				if (buttonPressed(buttons[_key], currentMouseLocation)) {
					c.style.cursor = 'pointer';
				}
			}

			if (selection_3D(currentMouseLocation, 'block').object != null) {
				c.style.cursor = 'pointer';
			};
			*/
			//UIInteractionUpdate();
			/*
			if (comment.style.visibility === 'visible') {
				textRender();
			}
			*/
		}
	}

	function mouseUp(e) {
		if (opening_count >= OPENING_LENGTH) {
			mousePressed = false;
			scrutinyMode = false;
			navigatable = true;
			staticallyPressed = false;
			currentMouseLocation = getMouseLocation(e);
			checkButtons(currentMouseLocation);
			if (annotations.length > 0) {
				checkAnnotations(currentMouseLocation);
			}
		}
	}

	function wheel(e) {
		if (opening_count >= OPENING_LENGTH && navigatable) {
			//wheelDelta = e.deltaY;
			//let _obCam = objects.name(obCamera[camMode]);
			if (scene.navigatable) {
				let _obCam = objects.name(activeCamera);
				let ay = _obCam.data.angle_y;
				ay += wheelDelta * e.deltaY;
				if (ay < scene.cameraViewAngleMax && ay > scene.cameraViewAngleMin) {
					_obCam.data.angle_y = ay;
				}
			}
			//UIInteractionUpdate();
			//eText.textContent = ay;
		}
	}

	function touchStart(e) {
		if (opening_count >= OPENING_LENGTH) {
			if (!animationPosed && scene.navigatable) {
				animationPosed = !animationPosed;
			}
			/*
			for (var i = 0 in objects) {
				let _ob = objects[i];
				if (_ob.hasOwnProperty('animationData')) {
					for (var j in _ob.animationData) {
						_ob.animationData[j].play = 0;
					}
				}
			}
			*/
			touched = true;
			staticallyPressed = true;
			statPressedTime = new Date().getTime();
			prevTouchLocations = getTouchLocations(e);
			currentTouchLocations = prevTouchLocations;
			switch (annotationMode) {
				case 0:
					selectBlock(currentTouchLocations[0]);
					break;
				case 1:
					selectPoint(currentTouchLocations[0]);
					break;
				default:
					return;
			}
			/*
			if (pointable) {
				selectPoint(currentTouchLocations[0]);
			} else {
				selectBlock(currentTouchLocations[0]);
			}
			*/
			//selectBlock(currentTouchLocations[0]);
			//selection_3D(currentTouchLocations[0]);
			//UIInteractionUpdate();
			/*
			if (comment.style.visibility === 'visible') {
				textRender();
			}
			*/
			if (prevTouchLocations.length === 1) {
				if (prevTouchLocations[0].x > c.width * 0.9 && prevTouchLocations[0].y > c.height * 0.9) {
					//toggleCameraAction();
					//drawMode += 1;
					//drawMode %= numDrawMode;
					//drawUpdate();
				}
			}
			if (prevTouchLocations.length === 3) {
				shiftKeyPressed = true;
			}
			e.preventDefault();
		}
	}

	function touchMove(e) {
		if (opening_count >= OPENING_LENGTH) {
			currentTouchLocations = getTouchLocations(e);

			if (!scrutinyMode && staticallyPressed) {
				staticallyPressed = false;
			}
			//UIInteractionUpdate();
			/*
			if (comment.style.visibility === 'visible') {
				textRender();
			}
			*/
			//eText.textContent = currentTouchLocations.length;
			e.preventDefault();
		}

	}

	function touchEnd(e) {
		if (opening_count >= OPENING_LENGTH) {
			touched = false;
			scrutinyMode = false;
			navigatable = true;
			staticallyPressed = false;
			//currentTouchLocations = getTouchLocations(e);
			//eText.textContent = currentTouchLocations[0].x
			checkButtons(currentTouchLocations[0]);
			if (annotations.length > 0) {
				checkAnnotations(currentTouchLocations[0]);
			}

			//eText.textContent = selectedObject;
			shiftKeyPressed = false;
			/*
			if (currentTouchLocations.length === 3) {
				shiftKeyPressed = false;
			}
			*/

			e.preventDefault();
		}
	}

	function keyDown(e) {
		switch (e.keyCode) {
			case 16: //shift key
				shiftKeyPressed = true;
				break;
			default:
				return;
		}
	}

	function keyUp(e) {
		console.log(e.keyCode);
		if (e.keyCode === 87 && opening_count >= OPENING_LENGTH) {//w key
			drawMode += 1;
			drawMode %= numDrawMode;
			//drawUpdate();
		}
		switch (e.keyCode) {
			case 16: //shift key
				shiftKeyPressed = false;
				break;
			/*
			case 32: //space key
					animationPosed = !animationPosed;
					break;
			*/
			case 48: //0 key
				//camMode = 0;
				activeCamera = 'camera_main';
				break;
			case 49: //1 key
				if (objects.name('camera_animation01') != undefined) {
					activeCamera = 'camera_animation01'
				}
				/*
				if (obCamera.length > 1) {
					camMode = 1;
				}
				*/
				break;
			/*
			case 50: //2 key
				if (obCamera.length > 2) {
					camMode = 2;
				}
				break;
			case 51: //3 key
				if (obCamera.length > 3) {
					camMode = 3;
				}
				break;
			case 52: //4 key
				if (obCamera.length > 4) {
					camMode = 4;
				}
				break;
			case 53: //5 key
				if (obCamera.length > 5) {
					camMode = 5;
				}
				break;
			*/
			case 77: //m key
				drawMap = !drawMap;
				break;
			default:
				return;
		}
	}

	function visibilityChange(e) {
		if (document.visibilityState === 'visible' && !animationPosed) {
			scene.sceneSounds.name(scene.mainSound).sound.play();
		} else if (document.visibilityState === 'hidden') {
			scene.sceneSounds.name(scene.mainSound).sound.pause();
		}
	}

	function getMouseLocation(e) {
		const mouseLocation = {};

		let rect = e.target.getBoundingClientRect();

		mouseLocation.x = e.clientX - rect.left;
		mouseLocation.y = e.clientY - rect.top;
		return mouseLocation;
	}

	function getTouchLocations(e) {
		const touchLocations = [];

		let rect = e.target.getBoundingClientRect();
		for (var i = 0; i < e.touches.length; i++) {
			const touchLocation = {};
			touchLocation.x = e.touches[i].clientX - rect.left;
			touchLocation.y = e.touches[i].clientY - rect.top;
			touchLocations.push(touchLocation);
		}
		return touchLocations;
	}

	function toggleCameraAction() {
		if (objects.name('camera_origin').objectAction.play === 0) {
			objects.name('camera_origin').objectAction.play = 1;
		} else {
			objects.name('camera_origin').objectAction.play = 0;
		}
		/*
		if (objects['camera_origin'].objectAction.play === 0) {
			objects['camera_origin'].objectAction.play = 1;
		} else {
			objects['camera_origin'].objectAction.play = 0;
		}
		*/
	}

	function memoOKPressed() {
		annotationMode = 0;
		obUI.name('UI_point_button').texture_shift[0] = 0.0;
		memoContainerElement.style.visibility = 'hidden';
		navigatable = true;
		let newAnnotation = Object.assign({}, tempAnnotation);
		newAnnotation.desc = memo.value;
		annotations.push(newAnnotation);
		memo.value = '';
		memoContainerElement.style.pointerEvents = 'none';
		mousePressed = false;
		touched = false;
	}

	function memoCancelPressed() {
		annotationMode = 0;
		obUI.name('UI_point_button').texture_shift[0] = 0.0;
		memoContainerElement.style.visibility = 'hidden';
		navigatable = true;
		memo.value = '';
		mousePressed = false;
		touched = false;
	}

	function obButtonPressed() {
		let _selOb = objects.name(selectedObject);
		if (_selOb.hasDetail) {
			buttonContainerElement.style.visibility = 'hidden';
			loadScene(_selOb.name);
		} else if (_selOb.hidable) {
			_selOb.draw = false;
			buttonContainerElement.style.visibility = 'hidden';
			hiddenObjects.push(selectedObject);
			obUI.name('UI_show_button').texture_shift[0] = 0.5;
			selectedObject = null;
		}
	}
};
