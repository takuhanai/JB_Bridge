
window.onload = function(){
	// constant
	const numDrawMode = 5;
	const FPS = 60;
	const FPS_blender = 24;
	const OPENING_SPEED = 0.1;
	//const OPENING_LENGTH = 10.0 / OPENING_SPEED * FPS;
	const OPENING_LENGTH = 0.0;
	// test

  // variables
	let resourcePath = './resource/';
	let title = 'oshima_bridge';
	//let scene_name = 'oshima_bridge';
	let scene_name = 'tower_01';
	//let FPS;
	let drawMode = 0;//0: draw all, 1: omit window, 2: omit window and roof
	let eText = document.getElementById('text');

	let drawMap = false;
	let selectedObject = null;
	let pointable = false;

	let text01 = 'Oshima Bridge';
	let text01location = [20.0, 50.0, 0.0, 0.0];
	//let selObLoc3D = [0.0, 0.0, 0.0, 1.0];

	let commentBoxWidth = 280;//px
	let memoCols = 20;
	let memoRows = 5;

	let mousePressed = false;
	let shiftKeyPressed = false;
	let prevMouseLocation;
	let currentMouseLocation;
	let wheelDelta = 0.00005;

	let touched = false;
	let prevTouchLocations;
	let currentTouchLocations;

	let opening_count = 0;

	let cameraVertAngle = 0.0;
	//const cameraVertAngleMax = 12.0 * Math.PI / 180.0;
	//const cameraVertAngleMin = -78.0 * Math.PI / 180.0;
	/*
	let cameraTranslationDelta = 1.0;
	let cameraTranslationRange = [420.0, -420.0, 420.0, -420.0, 150.0, 0.0]; //X max, X min, Y max, Y min, Z max, Z min
	let cameraVertAngleMax = 10.0 * Math.PI / 180.0;
	let cameraVertAngleMin = -80.0 * Math.PI / 180.0;
	let cameraViewAngleMax = 1.2;
	let cameraViewAngleMin = 0.1;
	*/

	let cameraOriginZSpeed;
	let cameraOriginZDest;

	let cameraDirection = [];

	console.log(navigator.userAgent);
	let browser;
	if (navigator.userAgent.indexOf('Chrome') != -1) {
		browser = 'Chrome';
	} else if (navigator.userAgent.indexOf('Firefox') != -1) {
		browser = 'Firefox';
		wheelDelta = 0.005;
	} else if (navigator.userAgent.indexOf('Safari') != -1) {
		browser = 'Safari';
	}
	console.log(browser);

  // canvasエレメントを取得
  let c = document.getElementById('canvas1');
  //c.width = 900;
  //c.height = 540;

	let camMode = 0;
    // webglコンテキストを取得
	let gl = c.getContext('webgl') || c.getContext('experimental-webgl');

  // 頂点シェーダとフラグメントシェーダの生成
  let v_shader = create_shader('vs');
  let f_shader = create_shader('fs');
  let prg = create_program(v_shader, f_shader);
  let attLocation = new Array();
  attLocation[0] = gl.getAttribLocation(prg, 'position');
  attLocation[1] = gl.getAttribLocation(prg, 'textureCoord');
  let attStride = new Array();
  attStride[0] = 3;
  attStride[1] = 2;
  let uniLocation = new Array();
  uniLocation[0] = gl.getUniformLocation(prg, 'color');
  uniLocation[1] = gl.getUniformLocation(prg, 'mvpMatrix');
  uniLocation[2] = gl.getUniformLocation(prg, 'invMatrix');
  uniLocation[3] = gl.getUniformLocation(prg, 'texture');
  uniLocation[4] = gl.getUniformLocation(prg, 'alpha');
  uniLocation[5] = gl.getUniformLocation(prg, 'tex_shift');
  uniLocation[6] = gl.getUniformLocation(prg, 'texMatrix');
  uniLocation[7] = gl.getUniformLocation(prg, 'textureShade');
  uniLocation[8] = gl.getUniformLocation(prg, 'mMatrix');
	uniLocation[9] = gl.getUniformLocation(prg, 'texture2');
	uniLocation[10] = gl.getUniformLocation(prg, 'drawMap');
	uniLocation[11] = gl.getUniformLocation(prg, 'selected');

  gl.useProgram(prg);

	// 各種行列の生成と初期化
  let m = new matIV();
  let vMatrix = m.identity(m.create());
	let pMatrix = m.identity(m.create());
  let p1Matrix = m.identity(m.create());
	let vpoMatrix = m.identity(m.create());//For UI
  let vpMatrix = m.identity(m.create());
	let mvpMatrix = m.identity(m.create());
	let invMatrix = m.identity(m.create());
	let tMatrix = m.identity(m.create());
	let vTempMatrix = m.identity(m.create());

	//let tmvpMatrix = m.identity(m.create());

	let q = new qtnIV();

	//m.ortho(0.0, 0.02 * c.width, 0.02 * c.height, 0.0, 0.1, 300, vpoMatrix);
	m.ortho(0.0, c.width, c.height, 0.0, 0.1, 300, vpoMatrix);
	m.translate(vpoMatrix, [0, 0, -20], vpoMatrix);

  let obNames = []; // Not used

	let obCamera = []; // List of camera objects

	let obLoading = []; // List of objects used for loading screen

	let obResp = []; // List of objects responding to mouse (touch) action

	let Annoatation = function (_loc, _ob, _desc) {
		this.loc = _loc; //3D vecotr
		this.ob = _ob;
		this.desc = _desc;
	}
	let annotations = [
		new Annoatation([0.0, -1.7, 25.137], 'lower_strat_wall_S', ''),
		new Annoatation([0.0, 1.7, 25.137], 'lower_strat_wall_C', '')
	];

	//let obUI = []; // List of UI objects
	let obUI = new Array(); // List of UI objects

	let Scene = function (name) {
		this.name = name;
		this.cameraTranslationDelta = 1.0;
		this.cameraTranslationRange = [420.0, -420.0, 420.0, -420.0, 150.0, 0.0]; //X max, X min, Y max, Y min, Z max, Z min
		this.cameraVertAngleMax = 10.0 * Math.PI / 180.0;
		this.cameraVertAngleMin = -80.0 * Math.PI / 180.0;
		this.cameraViewAngleMax = 1.2;
		this.cameraViewAngleMin = 0.1;
	}
	let scene = new Scene(scene_name);

	let objects = new Array();
	let Object = function (name) {
		this.name = name;
	}

	let allDataReady = false;
	let numDataReady = 0;

	readSceneData();

	for (let i in objects) {
		read3DModelData(resourcePath + scene.name, objects[i].name, 'object');
	}

	readUIData();

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
		let ob = objects[oa.object];
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
	comment.style.width = commentBoxWidth.toString() + "px";

	let memoContainerElement = document.getElementById("memoContainer");
	let memo = document.createElement("textarea");
	memo.className = "floating-memo";
	memoContainerElement.appendChild(memo);
	//memo.style.visibility = 'hidden';
	memo.cols = memoCols.toString();
	memo.rows = memoRows.toString();
	memo.style.visibility = 'hidden'
	memo.style.resize = 'none';

/*
	let overlayElement = document.getElementById('overlay');
	let textElement = document.getElementById('text');
	let textNode = document.createTextNode('');
	textElement.appendChild(textNode);
*/

	render();

    function render(){
		//gl.clearColor(0.4, 0.6, 1.0, 1.0);
		gl.clearColor(0.95, 0.95, 0.9, 1.0);
		/*
        // is load ready
        if ((allDataReady === true) && (isInitialize === false)){
            isInitialize = true;
            // 全てのロードが完了した際に一度だけ行いたい処理
        }
		*/
        // アニメーション
        requestAnimationFrame(render);

				//console.log('allDataReady:', allDataReady);

        if (allDataReady === true) {
			// 全てのリソースのロードが完了している

			if (opening_count < OPENING_LENGTH) {
				//openingUpdate();
			}

			//drawUpdate();
			if (supportTouch) {
				touchUpdate();
			} else {
				mouseUpdate();
			}

      // objects の更新
      actionUpdate();

			//manualUpdate();

			// UI の更新
			//UIUpdate();

			gl.enable(gl.DEPTH_TEST);
			gl.enable(gl.CULL_FACE);
			gl.enable(gl.BLEND);
			//gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
			gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE);
			//gl.blendFuncSeparate(gl.ONE, gl.ZERO, gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
			//gl.blendFuncSeparate(gl.ONE, gl.ZERO, gl.ONE, gl.ONE);
			//gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

			cameraUpdate();

			// canvasを初期化
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            gl.viewport(0, 0, c.width, c.height);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            // objects の描画
            objectRender();
            // hud 関連
            UIRender();

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

		opening_count += 1;

	}

	function mouseUpdate() {
		if (mousePressed) {
			let deltaX = currentMouseLocation.x - prevMouseLocation.x;
			let deltaY = currentMouseLocation.y - prevMouseLocation.y;
			cameraInteractionUpdate(deltaX, deltaY);

			prevMouseLocation = currentMouseLocation;
		}
	}

	function touchUpdate() {
		if (touched) {
			if (currentTouchLocations.length === 1) {//rotation
				let deltaX = currentTouchLocations[0].x - prevTouchLocations[0].x;
				let deltaY = currentTouchLocations[0].y - prevTouchLocations[0].y;
				cameraInteractionUpdate(deltaX, deltaY);
				prevTouchLocations = currentTouchLocations;
			} else if (currentTouchLocations.length === 2) {//zoom up
				let ct0 = currentTouchLocations[0];
				let ct1 = currentTouchLocations[1];
				let currentDist = Math.sqrt((ct1.x - ct0.x) * (ct1.x - ct0.x) + (ct1.y - ct0.y) * (ct1.y - ct0.y));
				let pt0 = prevTouchLocations[0];
				let pt1 = prevTouchLocations[1];
				let prevDist = Math.sqrt((pt1.x - pt0.x) * (pt1.x - pt0.x) + (pt1.y - pt0.y) * (pt1.y - pt0.y));

				let ay = objects[obCamera[camMode]].angle_y;
				ay -= 0.001 * (currentDist - prevDist);
				if (ay < scene.cameraViewAngleMax && ay > scene.cameraViewAngleMin) {
					objects[obCamera[camMode]].angle_y = ay;
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
		if (camMode == 0) {
			if (shiftKeyPressed) {
				//m.translate(objects['camera_whole_origin'].mMatrix0, [-1.0 * dX, 0, 1.0 * dY],
				m.translate(objects['camera_whole_origin'].mMatrix0, [-scene.cameraTranslationDelta * dX, 0, scene.cameraTranslationDelta * dY], objects['camera_whole_origin'].mMatrix0);
				//console.log(objects['camera_whole_origin'].mMatrix0)
				for (var i = 0; i < 3; i++) {
					if (objects['camera_whole_origin'].mMatrix0[i + 12] > scene.cameraTranslationRange[i * 2]) {
						objects['camera_whole_origin'].mMatrix0[i + 12] = scene.cameraTranslationRange[i * 2];
					}
					if (objects['camera_whole_origin'].mMatrix0[i + 12] < scene.cameraTranslationRange[i * 2 + 1]) {
						objects['camera_whole_origin'].mMatrix0[i + 12] = scene.cameraTranslationRange[i * 2 + 1];
					}
				}
			} else {
				m.rotate(objects['camera_whole_origin'].mMatrix0, -0.003 * dX, [0, 0, 1], objects['camera_whole_origin'].mMatrix0);

				let deltaRotY = -0.003 * dY;
				if (cameraVertAngle + deltaRotY < scene.cameraVertAngleMax && cameraVertAngle + deltaRotY > scene.cameraVertAngleMin) {
					let rMatrix = m.identity(m.create());
					m.rotate(rMatrix, deltaRotY, [1, 0, 0], rMatrix);
					m.multiply(rMatrix, objects['camera_whole'].mMatrix0, objects['camera_whole'].mMatrix0);
					cameraVertAngle += deltaRotY;
				}
			}
		}
	}

	function drawUpdate() {
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

	}

    // camera update
  function cameraUpdate(){
			let _obCamera = objects[obCamera[camMode]];
			switch (_obCamera.camera_type) {// 0: PERSP, 1: ORTHO
				case 0: //PERSP
					m.perspective(_obCamera.angle_y / 1.0 * 180.0 / Math.PI, c.width / c.height, _obCamera.clip_start, _obCamera.clip_end, _obCamera.pMatrix);
					break;
			}
			m.inverse(_obCamera.mMatrix, vMatrix);
	    m.multiply(_obCamera.pMatrix, vMatrix, vpMatrix);

			//m.multiplyV(_obCamera.mMatrix, [0.0, 0.0, -1.0, 1.0], cameraDirection);
			m.multiplyV(vMatrix, [0.0, 0.0, -1.0, 1.0], cameraDirection);
			//eText.textContent = cameraDirection[0] + ', ' + cameraDirection[1] + ', ' + cameraDirection[2];
			//eText.textContent = _obCamera.mMatrix[12] + ', ' + _obCamera.mMatrix[13] + ', ' + _obCamera.mMatrix[14];
			//eText.textContent = vMatrix[12] + ', ' + vMatrix[13] + ', ' + vMatrix[14];
  }

    // action update
		function actionUpdate(){
      // 全てのリソースを処理する
      for (var i = 0 in objects) {
			// アクションの更新
        if (objects[i].hasOwnProperty('objectAction') && objects[i].objectAction.play != 0) {
            objects[i].mMatrix0 = evaluateAction(actions[objects[i].objectAction.name], objects[i].objectAction.animation_count, objects[i].location, objects[i].rotation, objects[i].scale, objects[i].rotation_mode);

						actionIncrement(objects[i].objectAction, actions[objects[i].objectAction.name]);
					}

				if (objects[i].hasOwnProperty('materialAction') && objects[i].materialAction.play != 0) {
					objects[i].alpha = evaluateMaterialAction(actions[i].materialAction, actions[i].materialAction.animation_count).alpha;
				}
			// 特例のあるオブジェクト（drone_body or parent=none）
            var mMatrixLocal = m.identity(m.create());
            if (i == 'mambo_body') {
                m.multiply(objects[i].mMatrix0, drone.gMatrix, mMatrixLocal);
			} else if (i === 'camera_follow') {
				m.multiply(objects[i].mMatrix0, camera_follow_gMatrix, mMatrixLocal);
			} else if (i === 'camera_front') {
				m.multiply(objects[i].mMatrix0, camera_front_gMatrix, mMatrixLocal);
            } else {
                m.multiply(objects[i].mMatrix0, mMatrixLocal, mMatrixLocal);
            }
            //if (objects[i].parent != 'none') {
						if (objects[i].parent != '') {
                var po = objects[objects[i].parent];
								if (po.dataReady) {
                    m.multiply(po.mMatrix, mMatrixLocal, objects[i].mMatrix);
                }
            } else {
                objects[i].mMatrix = mMatrixLocal;
            }
        }
    }

	function manualUpdate() {
		if (Math.abs(cameraOriginZDest - objects['camera_origin'].mMatrix0[14]) > 0.01) {
			objects['camera_origin'].mMatrix0[14] += cameraOriginZSpeed;
		}
	}

	function actionIncrement(ob, ac) {
		if (ob.forward) {
			ob.animation_count += ob.speed;
		} else {
			ob.animation_count -= ob.speed;
		}
		if (ob.animation_count > ac.frame_end) {
			if (ob.play == 1) {
				ob.animation_count = ac.frame_start;
			} else if (ob.play == 2) {
				ob.play = 0;
				ob.animation_count = ac.frame_start;
				if (ob.nextAction !== undefined) {
					ob.nextAction();
					delete ob.nextAction;
				}
			} else if (ob.play == 3) {
				ob.play = 0;
				ob.animation_count = ac.frame_end;
			}
		}
		if (ob.animation_count < ac.frame_start) {
			if (ob.play == 1) {
				ob.animation_count = ac.frame_end;
			} else if (ob.play == 2) {
				ob.animation_count = ac.frame_end;
				ob.play = 0;
			} else if (ob.play == 3) {
				ob.play = 0;
				ob.animation_count = ac.frame_start;
			}
		}
	}

  // objects rendering
  function objectRender(){
		// uniform変数にテクスチャを登録
        gl.uniform1i(uniLocation[3], 0); //texture
        gl.uniform1i(uniLocation[7], 6);
				gl.uniform1i(uniLocation[9], 1); //texture2

				for (var i = 0 in objects) {
					if (objects[i].one_sided) {
						if (dot(objects[i].normal, cameraDirection) < 0.0) {
							objects[i].draw = true;
							//objects[i].facing = true;
						} else {
							objects[i].draw = false;
							//objects[i].facing = false;
						}
					}
            if (
                objects[i].type === 0 &&
								objects[i].kind === 'mesh' &&
                objects[i].draw === true &&
								//objects[i].facing === true &&
                //obUI.indexOf(i) === -1 &&
                obLoading.indexOf(i) === -1
            ) {
								//console.log('objectRender:', objects[i].name);
								set_attribute(objects[i].VBOList, attLocation, attStride);
								gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, objects[i].iIndex);

								gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_2D, objects[i].texture[i]);
								//gl.bindTexture(gl.TEXTURE_2D, objects[i].texture[0]);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);

								if (drawMap && i === '5P_tower_GL') {
									gl.uniform1i(uniLocation[10], drawMap);
									gl.activeTexture(gl.TEXTURE1);
									//gl.bindTexture(gl.TEXTURE_2D, objects[i].texture[1]);
									gl.bindTexture(gl.TEXTURE_2D, objects[i].texture[i + '_map']);
	                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
								} else {
									gl.uniform1i(uniLocation[10], false);
								}
								if (i === selectedObject) {
									gl.uniform1i(uniLocation[11], true);
								} else {
									gl.uniform1i(uniLocation[11], false);
								}

                gl.uniform1f(uniLocation[4], objects[i].alpha);
                gl.uniform2fv(uniLocation[5], objects[i].texture_shift);
                //gl.uniform1f(uniLocation[9], objects[i].shadow);
                //m.multiply(vpMatrix, mTempMatrix, mvpMatrix);
                m.multiply(vpMatrix, objects[i].mMatrix, mvpMatrix);

                gl.uniformMatrix4fv(uniLocation[1], false, mvpMatrix);
                gl.uniformMatrix4fv(uniLocation[2], false, invMatrix);
                gl.uniformMatrix4fv(uniLocation[6], false, tMatrix);
                gl.uniformMatrix4fv(uniLocation[8], false, objects[i].mMatrix);

                //gl.drawElements(gl.TRIANGLES, objects[i].numLoop, gl.UNSIGNED_SHORT, 0);
                gl.drawElements(gl.TRIANGLES, objects[i].numLoop, gl.UNSIGNED_SHORT, 0);
            }
        }
        //gl.uniform1f(uniLocation[9], 0.0);
    }

    // UI
    function UIRender(){
			for (var i = 0 in obUI) {
				if (obUI[i].draw && obUI[i].fix) {
					UIRendergl(obUI[i]);
				}
      }
			for (var i = 0; i < annotations.length; i++) {
				let annoOb = obUI['UI_annotation'];
				let _tMatrix = m.identity(m.create());
				let _v = from3DPointTo2D(annotations[i].loc.concat(1.0));
				m.translate(_tMatrix, _v.slice(0, 3), _tMatrix);
				annoOb.mMatrix = _tMatrix;
				if (objects[annotations[i].ob].draw) {
					UIRendergl(annoOb);
				}
			}
    }

		function UIRendergl(_ob) {
			set_attribute(_ob.VBOList, attLocation, attStride);
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, _ob.iIndex);
			gl.uniform1i(uniLocation[10], false);
			gl.uniform1i(uniLocation[11], false);
			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, _ob.texture[_ob.name]);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);

			gl.uniform2fv(uniLocation[5], _ob.texture_shift);

			m.multiply(vpoMatrix, _ob.mMatrix, mvpMatrix);
			gl.uniformMatrix4fv(uniLocation[1], false, mvpMatrix);
			gl.uniformMatrix4fv(uniLocation[2], false, invMatrix);
			gl.uniform1f(uniLocation[4], _ob.alpha);

			gl.drawElements(gl.TRIANGLES, _ob.numLoop, gl.UNSIGNED_SHORT, 0);
		}

    // プログレス表示
    function progressRender(){
        gl.uniform2fv(uniLocation[5], [0.0, 0.0]);
        for (var i = 0 in obLoading) {
            //eText.textContent = numDataReady + ': ' + obNames.length;
            //if (objects[obLoading[i]].dataReady && objects[obLoading[i]].texture[objects[obLoading[i]].name] && !allDataReady) {
            if (objects[obLoading[i]].dataReady && objects[obLoading[i]].texture[obLoading[i]]) {
                set_attribute(objects[obLoading[i]].VBOList, attLocation, attStride);
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, objects[obLoading[i]].iIndex);

                gl.bindTexture(gl.TEXTURE_2D, objects[obLoading[i]].texture[obLoading[i]]);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT);

                // uniform変数にテクスチャを登録
                //gl.uniform1f(uniLocation[7], 1.0);

                var mTempMatrix = m.identity(m.create());
                if (obLoading[i] == 'progress_bar') {
                    m.scale(mTempMatrix, [numDataReady / (obNames.length * 2), 1, 1], mTempMatrix);
                }
                m.multiply(objects[obLoading[i]].mMatrix, mTempMatrix, mTempMatrix);

                m.multiply(vpoMatrix, mTempMatrix, mvpMatrix);
                gl.uniformMatrix4fv(uniLocation[1], false, mvpMatrix);
                gl.uniformMatrix4fv(uniLocation[2], false, invMatrix);
                gl.uniform1f(uniLocation[4], 1.0);

                gl.drawElements(gl.TRIANGLES, objects[obLoading[i]].numLoop, gl.UNSIGNED_SHORT, 0);
            }
        }
    }

		function textRender() {
			if (selectedObject != null) {
				text01location = fromObTo2D(objects[selectedObject]);
				//m.multiply(vpMatrix, objects[selectedObject].mMatrix, tmvpMatrix);
				//text01location = tmvpMatrix.slice(12);
				//text01location[0] = (text01location[0] / text01location[3] + 1.0) * c.width * 0.5;
				//text01location[1] = (1.0 - text01location[1] / text01location[3]) * c.height * 0.5;
			}
			/*
			ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
			ctx.font = '12pt Arial';
			ctx.fillText(text01, text01location[0], text01location[1]);
			*/
			//eText.textContent = text01location[0] + ', ' + text01location[1];
			if (text01location[0] < 0.0) {
				text01location[0] = 0.0;
			} else if (text01location[0] > c.width - commentBoxWidth) {
				text01location[0] = c.width - commentBoxWidth;
			}
			if (text01location[1] < 0.0) {
				text01location[1] = 0.0;
			} else if (text01location[1] > c.height - 160) {
				text01location[1] = c.height - 160.0;
			}
			comment.style.left = Math.floor(text01location[0]) + "px";
			comment.style.top  = Math.floor(text01location[1]) + "px";
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
			//console.log(i);
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

	function create_texture(_path, source, i_source, _type){
		var img = new Image();
		//img.src = './resource/textures/' + i_source + '.png';
		//img.src = resourcePath + scene.name + '/textures/' + i_source + '.png';
		img.src = _path + '/textures/' + i_source + '.png';
		img.onload = function(){
			/*
			var tex = gl.createTexture();
			gl.bindTexture(gl.TEXTURE_2D, tex);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
			gl.generateMipmap(gl.TEXTURE_2D);
			gl.bindTexture(gl.TEXTURE_2D, null);
			objects[source].texture[i_source] = tex;
			*/
			if (_type === 'object') {
				var ob = objects[source];
			} else if (_type === 'UI') {
				var ob = obUI[source];
			}
			//objects[source].texture[i_source] = create_texture_gl(img);
			ob.texture[i_source] = create_texture_gl(img);
			numDataReady += 1;
			allDataReady = checkAllDataReady();
		};
		//img.src = './resource/textures/' + i_source + '.png';
		//console.log(i_source);
	}

	function create_texture_gl(img) {
		var tex = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, tex);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
		gl.generateMipmap(gl.TEXTURE_2D);
		gl.bindTexture(gl.TEXTURE_2D, null);
		return tex;
	}

	function readSceneData() {
		var data = new XMLHttpRequest();
		data.open("GET", resourcePath + 'scenes/' + title + '-' + scene.name + '.csv', false); //true:非同期,false:同期
		data.send(null);

		let LF = String.fromCharCode(10); //改行ｺｰﾄﾞ
		let lines = data.responseText.split(LF);
		let _sceneData = lines[1].split(',');
		let sdIndex = 0;
		scene.num_object = Number(_sceneData[sdIndex++]);
		scene.UI = _sceneData[sdIndex++];
		scene.cameraTranslationDelta = Number(_sceneData[sdIndex++]);
		scene.cameraTranslationRange = _sceneData.slice(sdIndex, sdIndex + 6).map(Number);
		sdIndex += 6;
		scene.cameraVertAngleMax = Number(_sceneData[sdIndex++]) * Math.PI / 180.0;
		scene.cameraVertAngleMin = Number(_sceneData[sdIndex++]) * Math.PI / 180.0;
		scene.cameraViewAngleMax = Number(_sceneData[sdIndex++]);
		scene.cameraViewAngleMin = Number(_sceneData[sdIndex++]);
		let dList = new Array();
		for (var i = 3; i < scene.num_object + 3; i++) {
			let _line = lines[i].split(',');
			let lIndex = 0;
			let _name = _line[lIndex++];
			let _kind = _line[lIndex++];
			let _texture = _line.slice(lIndex, lIndex + 2);
			lIndex += 2;
			let _parent = _line[lIndex++];
			let _camera = _line[lIndex++] === 'yes' ? true : false;
			let _selectMesh = _line[lIndex++];
			let _UI = _line[lIndex++] === 'yes' ? true : false;
			let _oneSide = _line[lIndex++] === 'yes' ? true : false;
			let _normal = _line.slice(lIndex, lIndex + 3).map(Number);
			lIndex += 3;
			let _description = _line[lIndex++];
			const ob = new Object(_name);
			ob.texture = new Array(); // WebGL texture
			ob.dataReady = false;
			ob.parent = _parent;
			ob.kind = _kind;
			ob.textureList = []; // List of textures (string)

			for (var j = 0 in _texture) {
				if (_texture[j] != '') {
					//ob.texture[_texture] = null;
					ob.textureList.push(_texture[j]);
				}
			}

			ob.selectMesh = _selectMesh;
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
	    objects[_name] = ob;

			if (_camera) {
				obCamera.push(_name);
			}
			if (_selectMesh != '') {
				obResp.push(_name);
			}
			/*
			if (_UI) {
				obUI.push(_name);
			}
			*/
		}

	}

	function read3DModelData(_path, _objectName, _type) { //csvﾌｧｲﾙﾉ相対ﾊﾟｽor絶対ﾊﾟｽ
		var coord = new Array();
		var norm = new Array();
		var uv_coord = new Array();
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
			var off = 0;
			if (_type === 'object') {
				var ob = objects[_objectName];
			} else if (_type === 'UI') {
				var ob = obUI[_objectName];
			}

			ob.type = dv.getInt32(off, true); //0:MESH, 7:EMPTY, 8:CAMERA
			off += 4;
			ob.rotation_mode = dv.getInt32(off, true);
			off += 4;

			for (var i = 0; i < 3; i++) {
				location.push(dv.getFloat32(off, true));
				off += 4;
			}
			ob.location = location;

			var rotation_comp = 4;
			if (ob.rotation_mode != 0) {
				rotation_comp = 3;
			}
			for (var i = 0; i < rotation_comp; i++) {
				rotation.push(dv.getFloat32(off, true));
				off += 4;
			}
			ob.rotation = rotation;

			for (var i = 0; i < 3; i++) {
				scale.push(dv.getFloat32(off, true));
				off += 4;
			}
			ob.scale = scale;

			for (var i = 0; i < 3; i++) {
				dimensions.push(dv.getFloat32(off, true));
				off += 4;
			}
			ob.dimensions = dimensions;

			ob.mMatrix0 = transformationMatrix(ob.location, ob.rotation, ob.scale, ob.rotation_mode);//Local coordinate
			ob.mMatrix = transformationMatrix(ob.location, ob.rotation, ob.scale, ob.rotation_mode);//Global coordinate

			if (ob.type == 0) {//object type 'MESH'
				ob.numLoop = dv.getInt32(off, true);
				off += 4;

				for	(var i = 0; i < ob.numLoop; ++i) {
					for (var j = 0; j < 3; ++ j) {
						coord.push(dv.getFloat32(off, true));
						off += 4;
					}
				}
				if (ob.kind === 'selection_mesh' || ob.name === ob.selectMesh) {
					let im = m.identity(m.create());
					m.transpose(ob.mMatrix, im);
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
						uv_coord.push(dv.getFloat32(off, true));
						off += 4;
					}
				}

				var ind = new Array();
				for (var ii = 0; ii < ob.numLoop;++ii) {
					ind.push(ii);
				}

				var vPosition     = create_vbo(coord);
				var vTextureCoord = create_vbo(uv_coord);
				ob.VBOList       = [vPosition, vTextureCoord];
				ob.iIndex        = create_ibo(ind);

				for (var i = 0 in ob.textureList) {
					create_texture(_path, ob.name, ob.textureList[i], _type);
				}
			} else if (ob.type == 8) {//object type 'CAMERA'
				var _pMatrix = m.identity(m.create());
				ob.camera_type = dv.getInt32(off, true);
				off += 4;
				ob.clip_start = dv.getFloat32(off, true);
				off += 4;
				ob.clip_end = dv.getFloat32(off, true);
				off += 4;
				switch (ob.camera_type) {// 0: PERSP, 1: ORTHO
					case 0: //PERSP
						ob.angle_y = dv.getFloat32(off, true);
						ob.angle_y0 = ob.angle_y; //initial value. Do not change!
						m.perspective(ob.angle_y / 1.0 * 180.0 / Math.PI, c.width / c.height, ob.clip_start, ob.clip_end, _pMatrix);
						break;
					case 1: //ORTHO
						ob.ortho_scale = dv.getFloat32(off, true);
						m.ortho(-ob.ortho_scale * c.width, ob.ortho_scale * c.width, ob.ortho_scale * c.height, -ob.ortho_scale * c.height, ob.clip_start, ob.clip_end, _pMatrix);
						break;
				}
				ob.pMatrix = _pMatrix;
			}

			//objects[_objectName].dataReady = true;
			ob.dataReady = true;
			numDataReady += 1;
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
			let _fix = _line[lIndex++];
			//let _texture = _line.slice(lIndex, lIndex + 2);
			//console.log('[readUIData] name: ' + _name + ', texture: ' + _texture);
			let ob = new Object(_name);
			ob.texture = new Array(); // WebGL texture
			ob.dataReady = false;
			ob.textureList = []; // List of textures (string)
			ob.texture_shift = [0.0, 0.0];

			for (var j = 0 in _texture) {
				if (_texture[j] != '') {
					ob.textureList.push(_texture[j]);
				}
			}

			ob.fix = _fix ==='yes' ? true : false;
			ob.draw = true;
			ob.alpha = 1.0;

			console.log(_name, _texture);
			obUI[_name] = ob;
			read3DModelData(resourcePath + 'UI/' + scene.UI, _name, 'UI');
		}
	}

	function checkAllDataReady() {
		var ready = true;
		for (var i = 0 in objects) {
			if (!objects[i].dataReady) {
				ready = false;
				//console.log('checkAllDataReady:', objects[i].name);
			}
			if (objects[i].type == 0 && objects[i].kind === 'mesh' && !objects[i].texture[i]) {
				//console.log('checkAllDataReady:', objects[i].name);
				ready = false;
			}
		}
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

	function readParentList() {
		var data = new XMLHttpRequest();
		data.open("GET", './resource/parent_list.csv', false); //true:非同期,false:同期
		data.send(null);

		var LF = String.fromCharCode(10); //改行ｺｰﾄﾞ
		var lines = data.responseText.split(LF);
		var pList = new Array();
		for (var i = 0 in lines) {
			var a = lines[i].split(',');
			pList[a[0]] = a[1];
		}

		return pList;
	}

	function readDescriptionList() {
		var data = new XMLHttpRequest();
		data.open("GET", './resource/object_description.csv', false); //true:非同期,false:同期
		data.send(null);

		let LF = String.fromCharCode(10); //改行ｺｰﾄﾞ
		let lines = data.responseText.split(LF);
		let dList = new Array();
		for (var i = 0 in lines) {
			let a = lines[i].split(',');
			//let b = a[1].split('¥');
			//b.join('a');
			//console.log(a[0], b);
			//let st = "大島\n大橋";
			dList[a[0]] = a[1];
			//console.log(st);
		}

		return dList;
	}

	function evaluateAction(_action, _x, _loc, _rot, _scale, _rotation_mode) {
		let locVec = _loc.slice();
		let rotVec = _rot.slice();
		let scVec = _scale.slice();

		for (var i = 0; i < _action.numCurve; i++) {
			if (_action.curves[i].data_path == 'location') {
				locVec[_action.curves[i].array_index] = bezier2D(_action.curves[i].handles, _x);
			} else if (_action.curves[i].data_path == 'scale') {
				scVec[_action.curves[i].array_index] = bezier2D(_action.curves[i].handles, _x);
			} else if (_action.curves[i].data_path == 'rotation_euler') {
				rotVec[_action.curves[i].array_index] = bezier2D(_action.curves[i].handles, _x);
			} else if (_action.curves[i].data_path == 'rotation_quaternion') {
				rotVec[_action.curves[i].array_index] = bezier2D(_action.curves[i].handles, _x);
			}
		}

		return transformationMatrix(locVec, rotVec, scVec, _rotation_mode);
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
		var tMatrix = m.identity(m.create());
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

		m.translate(tMatrix, _loc, tMatrix);
		m.scale(sMatrix, _scale, sMatrix);

		m.multiply(tMatrix, sMatrix, mMatrix);
		m.multiply(mMatrix, rMatrix, mMatrix);
		return mMatrix;
	}

	function bezier2D(_handles, _x) {
		if ((_handles[0].co.x > _x) || (_handles[_handles.length - 1].co.x < _x)) {
			return null;
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

	function cross(a, b) {
		return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
	}

	function dot(a, b) {
		return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
	}

	function vecSub(a, b) {
		return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
	}

	function fromObTo2D(_ob) {
		let tmvpMatrix = m.identity(m.create());
		m.multiply(vpMatrix, _ob.mMatrix, tmvpMatrix);
		let _2dLocation = tmvpMatrix.slice(12);
		_2dLocation[0] = (_2dLocation[0] / _2dLocation[3] + 1.0) * c.width * 0.5;
		_2dLocation[1] = (1.0 - _2dLocation[1] / _2dLocation[3]) * c.height * 0.5;
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

	function selection_3D(_location) {

		var x = (2.0 * _location.x) / c.width -1.0;
		var y = 1.0 - (2.0 * _location.y) /c.height;
		var z = 1.0;

		let _obCamera = objects[obCamera[camMode]];
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

		let sel = null;
		for (var i = 0 in obResp) {
			let _oR = objects[objects[obResp[i]].selectMesh];
			_oR.depth = 1000000;
			for (let l = 0; l < _oR.numLoop * 3; l += 9) {
				_p0 = _oR.coord.slice(l, l + 3);
				_p1 = _oR.coord.slice(l + 3, l + 6);
				_p2 = _oR.coord.slice(l + 6, l + 9);
				_o = _obCamera.mMatrix.slice(12, 15);
				_d = ray_wld;
				_e = vecSub(_o, _p0);
				_e1 = vecSub(_p1, _p0);
				_e2 = vecSub(_p2, _p0);
				_q = cross(_d, _e2);
				_r = cross(_e, _e1);
				_t = dot(_r, _e2) / dot(_q, _e1);
				_u = dot(_q, _e) / dot(_q, _e1);
				_v = dot(_r, _d) / dot(_q, _e1);
				if (_u > 0 && _v > 0 && 1 - _u - _v > 0 && _t < _oR.depth) {
					_oR.depth = _t;
				}
			}
			if (sel === null) {
				if (_oR.depth < 10000) {
					sel = obResp[i];
				}
			} else {
				if (_oR.depth < objects[sel].depth) {
					sel = obResp[i];
				}
			}
		}

		eText.textContent = sel;

		if (sel != null) {
			while (comment.firstChild) comment.removeChild(comment.firstChild);
			if (sel === selectedObject) {
				selectedObject = null;
				text01 = '';
				comment.style.visibility = 'hidden';
			} else {
				selectedObject = sel;
				let _strArray = objects[selectedObject].description.split('¥');
				for (var i = 0 in _strArray) {
					comment.appendChild(document.createTextNode(_strArray[i]));
					comment.appendChild(document.createElement('br'));
				}
				text01 = selectedObject.substring(0, selectedObject.length - 3);
			}
		}
	}

	function UIInteractionUpdate(){
		if (comment.style.visibility === 'visible') {
			textRender();
		}
	}

	function buttonPressed(_button, _location) {
		console.log(_button, obUI[_button]);
		if (obUI[_button] != null) {
			let loc = obUI[_button].location;
			let dim = obUI[_button].dimensions;
			if (_location.x > loc[0] - 0.5 * dim[0] && _location.x < loc[0] + 0.5 * dim[0] && c.height - _location.y > loc[1] - 0.5 * dim[1] && c.height - _location.y < loc[1] + 0.5 * dim[1]) {
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
			let obc = objects['camera_whole'];
			let obco = objects['camera_whole_origin'];
			obc.angle_y = obc.angle_y0;
			obc.mMatrix0 = transformationMatrix(obc.location, obc.rotation, obc.scale, obc.rotation_mode);
			obco.mMatrix0 = transformationMatrix(obco.location, obco.rotation, obco.scale, obco.rotation_mode);
			cameraVertAngle = 0.0;
			objects['sea_surface_GL'].draw = true;
			objects['terrain_GL'].draw = true;
			drawMap = false;
			selectedObject = null;
			comment.style.visibility = 'hidden';
		}
		if (buttonPressed('UI_terrain_button', _location)) {
			objects['sea_surface_GL'].draw = !objects['sea_surface_GL'].draw;
			objects['terrain_GL'].draw = !objects['terrain_GL'].draw;
		}
		if (buttonPressed('UI_map_button', _location)) {
			drawMap = !drawMap;
		}
		if (buttonPressed('UI_info_button', _location)) {
			if (selectedObject != null) {
				if (comment.style.visibility === 'visible') {
					comment.style.visibility = 'hidden';
				} else if (comment.style.visibility === 'hidden') {
					comment.style.visibility = 'visible';
					textRender();
				}
			}
		}
		if (buttonPressed('UI_point_button', _location)) {
			pointable　= !pointable;
			obUI['UI_point_button'].texture_shift[0] = pointable ? 0.5: 0.0;
		}
	}

	function mouseDown(e) {
		if (opening_count >= OPENING_LENGTH ) {
			mousePressed = true;
			prevMouseLocation = getMouseLocation(e);
			currentMouseLocation = prevMouseLocation;
			selection_3D(currentMouseLocation);
			UIInteractionUpdate();
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
			UIInteractionUpdate();
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
			currentMouseLocation = getMouseLocation(e);
			checkButtons(currentMouseLocation);

			eText.textContent = selectedObject;
			//console.log(text01location, tmvpMatrix);
		}
	}

	function wheel(e) {
		if (opening_count >= OPENING_LENGTH) {
			//wheelDelta = e.deltaY;
			let ay = objects[obCamera[camMode]].angle_y;
			ay += wheelDelta * e.deltaY;
			if (ay < scene.cameraViewAngleMax && ay > scene.cameraViewAngleMin) {
				objects[obCamera[camMode]].angle_y = ay;
			}
			//eText.textContent = ay;
		}
	}

	function touchStart(e) {
		if (opening_count >= OPENING_LENGTH) {
			touched = true;
			prevTouchLocations = getTouchLocations(e);
			currentTouchLocations = prevTouchLocations;
			selection_3D(currentTouchLocations[0]);
			UIInteractionUpdate();
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
			UIInteractionUpdate();
			/*
			if (comment.style.visibility === 'visible') {
				textRender();
			}
			*/
			eText.textContent = currentTouchLocations.length;
			e.preventDefault();
		}

	}

	function touchEnd(e) {
		if (opening_count >= OPENING_LENGTH) {
			touched = false;
			//currentTouchLocations = getTouchLocations(e);
			//eText.textContent = currentTouchLocations[0].x
			checkButtons(currentTouchLocations[0]);

			eText.textContent = selectedObject;
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
			drawUpdate();
		}
		switch (e.keyCode) {
			case 16: //shift key
				shiftKeyPressed = false;
				break;
			case 48: //0 key
				camMode = 0;
				break;
			case 49: //1 key
				camMode = 1;
				break;
			case 50: //2 key
				camMode = 2;
				break;
			case 51: //3 key
				camMode = 3;
				break;
			case 52: //4 key
				camMode = 4;
				break;
			case 53: //5 key
				camMode = 5;
				break;
			case 77: //m key
				drawMap = !drawMap;
			default:
				return;
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
		if (objects['camera_origin'].objectAction.play === 0) {
			objects['camera_origin'].objectAction.play = 1;
		} else {
			objects['camera_origin'].objectAction.play = 0;
		}
	}

};
