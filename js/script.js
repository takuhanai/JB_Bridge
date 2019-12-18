
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
	//let FPS;
	let drawMode = 0;//0: draw all, 1: omit window, 2: omit window and roof
	let eText = document.getElementById('text');

	let drawMap = false;
	let selectedObject = null;

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
	const cameraVertAngleMax = 10.0 * Math.PI / 180.0;
	const cameraVertAngleMin = -80.0 * Math.PI / 180.0;
	const cameraViewAngleMax = 1.2;
	const cameraViewAngleMin = 0.1;

	let cameraOriginZSpeed;
	let cameraOriginZDest;

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
	let vpoMatrix = m.identity(m.create());//For HUD
  let vpMatrix = m.identity(m.create());
	let mvpMatrix = m.identity(m.create());
	let invMatrix = m.identity(m.create());
	let tMatrix = m.identity(m.create());
	let vTempMatrix = m.identity(m.create());

	let q = new qtnIV();

	//m.ortho(0.0, 0.02 * c.width, 0.02 * c.height, 0.0, 0.1, 300, vpoMatrix);
	m.ortho(0.0, c.width, c.height, 0.0, 0.1, 300, vpoMatrix);
	m.translate(vpoMatrix, [0, 0, -20], vpoMatrix);

  const obNames = [
		'camera_whole',
		'camera_whole_origin',
		'view01',
		'view02',
		'view03',
		'view04',
		'view05',
		'2P_caisson_GL',
		'2P_tower_GL',
		'3P_caisson_GL',
		'3P_tower_GL',
		'4A_GL',
		'4A_road_girder_GL',
		'4A_shed_GL',
		'7A_GL',
		'7A_road_girder_GL',
		'7A_shed_GL',
		'P1_GL',
		'P2_GL',
		'P3_GL',
		'P4_GL',
		'P5_GL',
		'P6_GL',
		'cable_GL',
		'girder_GL',
		'north_side_span_GL',
		'south_side_span_GL',
		'suspender_GL',

		'sea_surface_GL',
		'terrain_GL',

		//'UI_back',
		'UI_revert_button',
		'UI_terrain_button',
		'UI_map_button'

		//'test'
					 ];

	const obCamera = [
		'camera_whole',
		'view01',
		'view02',
		'view03',
		'view04',
		'view05'
				];

	const obLoading = [];

	const obResp = [
		'2P_caisson_GL',
		'2P_tower_GL',
		'3P_caisson_GL',
		'3P_tower_GL',
		'4A_GL',
		'4A_road_girder_GL',
		'4A_shed_GL',
		'7A_GL',
		'7A_road_girder_GL',
		'7A_shed_GL',
		'P1_GL',
		'P2_GL',
		'P3_GL',
		'P4_GL',
		'P5_GL',
		'P6_GL',
		'cable_GL',
		'girder_GL',
		'north_side_span_GL',
		'south_side_span_GL',
		'suspender_GL'

	];
	const obHUD = [
		//'UI_back',
		'UI_revert_button',
		'UI_terrain_button',
		'UI_map_button'
	];
	let objects = new Array();
	let Object = function (name) {
		this.name = name;
	}

	let allDataReady = false;
	let numDataReady = 0;

	const parentList = readParentList();

	for (let i = 0; i < obNames.length; i++) {
		const ob = new Object(obNames[i]);

		ob.texture = new Array();

		ob.dataReady = false;

		ob.parent = parentList[ob.name];

		ob.draw = true;

		ob.texture_shift = [0.0, 0.0];

		ob.alpha = 1.0;

    ob.isHit = false;

    ob.shadow = 0.0;

		ob.depth = 1000000; // Z Depth from Camera

    objects[ob.name] = ob;
	}

	for (let i in objects) {
		readObjectData(objects[i].name);
	}

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

	render();

	let canvas2 = document.getElementById('canvas2');
	let ctx = canvas2.getContext('2d');  // CanvasRenderingContext2D

	ctx.font = '20pt Arial';

	ctx.fillText('Oshima Bridge', 360, 260);

//	ctx.fillText('Taku Hanai', 20, 50);

    function render(){
		//gl.clearColor(0.6, 0.8, 1.0, 1.0);
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
			if (supportTouch) {
				touchUpdate();
			} else {
				mouseUpdate();
			}

            // objects の更新
            actionUpdate();

			//manualUpdate();

			// HUD の更新
			HUDUpdate();

			gl.enable(gl.DEPTH_TEST);
			gl.enable(gl.CULL_FACE);
			gl.enable(gl.BLEND);
			//gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
			gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE);
			//gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

			cameraUpdate();

			// canvasを初期化
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            gl.viewport(0, 0, c.width, c.height);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            // objects の描画
            objectRender();
            // hud 関連
            HUDRender();

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
				if (ay < cameraViewAngleMax && ay > cameraViewAngleMin) {
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
				m.translate(objects['camera_whole_origin'].mMatrix0, [-1.0 * dX, 0, 1.0 * dY], objects['camera_whole_origin'].mMatrix0);
				//console.log(objects['camera_whole_origin'].mMatrix0)
				if (objects['camera_whole_origin'].mMatrix0[12] > 420.0) {
					objects['camera_whole_origin'].mMatrix0[12] = 420.0;
				}
				if (objects['camera_whole_origin'].mMatrix0[12] < -420.0) {
					objects['camera_whole_origin'].mMatrix0[12] = -420.0;
				}
				if (objects['camera_whole_origin'].mMatrix0[13] > 420.0) {
					objects['camera_whole_origin'].mMatrix0[13] = 420.0;
				}
				if (objects['camera_whole_origin'].mMatrix0[13] < -420.0) {
					objects['camera_whole_origin'].mMatrix0[13] = -420.0;
				}
				if (objects['camera_whole_origin'].mMatrix0[14] > 150.0) {
					objects['camera_whole_origin'].mMatrix0[14] = 150.0;
				}
				if (objects['camera_whole_origin'].mMatrix0[14] < 0.0) {
					objects['camera_whole_origin'].mMatrix0[14] = 0.0;
				}
			} else {
				m.rotate(objects['camera_whole_origin'].mMatrix0, -0.003 * dX, [0, 0, 1], objects['camera_whole_origin'].mMatrix0);

				let deltaRotY = -0.003 * dY;
				if (cameraVertAngle + deltaRotY < cameraVertAngleMax && cameraVertAngle + deltaRotY > cameraVertAngleMin) {
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
            if (objects[i].parent != 'none') {
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
            if (
                objects[i].type === 0 &&
                objects[i].draw === true &&
                obHUD.indexOf(i) === -1 &&
                obLoading.indexOf(i) === -1
            ) {
				set_attribute(objects[i].VBOList, attLocation, attStride);
								gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, objects[i].iIndex);

								gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_2D, objects[i].texture[i]);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);

								if (drawMap && i === '2P_tower_GL') {
									gl.uniform1i(uniLocation[10], drawMap);
									gl.activeTexture(gl.TEXTURE1);
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
                gl.uniform1f(uniLocation[9], objects[i].shadow);
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
        gl.uniform1f(uniLocation[9], 0.0);
    }

    // HUD
    function HUDRender(){
		for (var i = 0 in obHUD) {
			if (objects[obHUD[i]].draw) {
				//console.log(i, obHUD[i]);
				set_attribute(objects[obHUD[i]].VBOList, attLocation, attStride);
				gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, objects[obHUD[i]].iIndex);
				gl.uniform1i(uniLocation[10], false);
				gl.activeTexture(gl.TEXTURE0);
				gl.bindTexture(gl.TEXTURE_2D, objects[obHUD[i]].texture[obHUD[i]]);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);

				/*
				if (objects[obHUD[i]].down) {
					gl.bindTexture(gl.TEXTURE_2D, objects[obHUD[i]].texture[obHUD[i] + '_down']);
				} else {
					gl.bindTexture(gl.TEXTURE_2D, objects[obHUD[i]].texture[obHUD[i]]);
				}

				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
				//gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT);
				//gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
				*/

				// uniform変数にテクスチャを登録
				//gl.uniform1f(uniLocation[7], 1.0);
				//gl.uniform1f(uniLocation[5], objects[obHUD[i]].texture_shift);
				gl.uniform2fv(uniLocation[5], objects[obHUD[i]].texture_shift);

				m.multiply(vpoMatrix, objects[obHUD[i]].mMatrix, mvpMatrix);
				gl.uniformMatrix4fv(uniLocation[1], false, mvpMatrix);
				gl.uniformMatrix4fv(uniLocation[2], false, invMatrix);
				//gl.uniform1f(uniLocation[4], 1.0);
				gl.uniform1f(uniLocation[4], objects[obHUD[i]].alpha);
				//gl.uniform1f(uniLocation[4], 0.5);

				gl.drawElements(gl.TRIANGLES, objects[obHUD[i]].numLoop, gl.UNSIGNED_SHORT, 0);
			}
        }
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

	function create_texture(source, i_source){
		var img = new Image();
		img.src = './resource/textures/' + i_source + '.png';
		img.onload = function(){
			/*
			var tex = gl.createTexture();
			gl.bindTexture(gl.TEXTURE_2D, tex);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
			gl.generateMipmap(gl.TEXTURE_2D);
			gl.bindTexture(gl.TEXTURE_2D, null);
			objects[source].texture[i_source] = tex;
			*/
			objects[source].texture[i_source] = create_texture_gl(img);
			numDataReady += 1;
			allDataReady = checkAllDataReady();
		};
		//img.src = './resource/textures/' + i_source + '.png';
		console.log(i_source);
	}

	function create_texture_gl(img) {
		var tex = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, tex);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
		gl.generateMipmap(gl.TEXTURE_2D);
		gl.bindTexture(gl.TEXTURE_2D, null);
		return tex;
	}

	function readObjectData(filePath) { //csvﾌｧｲﾙﾉ相対ﾊﾟｽor絶対ﾊﾟｽ
		var coord = new Array();
		var norm = new Array();
		var uv_coord = new Array();
		var data = new XMLHttpRequest();
		data.open("GET", './resource/objects/' + filePath + '.dat', true); //true:非同期,false:同期
		data.responseType = 'arraybuffer';
		data.send(null);

		data.onload = function(e) {
			var arrayBuffer = data.response;
			var dv = new DataView(arrayBuffer);
			var location = [];
			var rotation = [];
			var scale = [];
			var dimensions = [];
			var off = 0;
			var ob = objects[filePath];

			ob.type = dv.getInt32(off, true); //0:MESH, 8:CAMERA
			off += 4;
			ob.rotation_mode = dv.getInt32(off, true);
			//console.log(filePath, ob.rotation_mode);
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
				if (obResp.indexOf(filePath) != -1) {
					//console.log('response object: ' + filePath);
					console.log(ob.mMatrix);
					let im = m.identity(m.create());
					m.transpose(ob.mMatrix, im);
					tc = [];
					for (i = 0; i < ob.numLoop * 3; i += 3) {
						_v = coord.slice(i, i + 3).concat(1);
						//console.log('before translation' + _v);
						m.multiplyV(im, _v, _v);
						//console.log('after translation' + _v);
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

				create_texture(filePath, filePath);
				if (filePath === '2P_tower_GL') {
					create_texture(filePath, filePath + '_map');
				}
			} else if (ob.type == 8) {//object type 'CAMERA'
				console.log(filePath);
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

				//console.log(objects[filePath]);
			}

			objects[filePath].dataReady = true;
			numDataReady += 1;
			allDataReady = checkAllDataReady();

		}
	}

	function checkAllDataReady() {
		var ready = true;
		for (var i = 0 in objects) {
			if (!objects[i].dataReady) {
				ready = false;
			}
			if (objects[i].type == 0 && !objects[i].texture[i]) {
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

	function selection_3D(_location) {

		var x = (2.0 * _location.x) / c.width -1.0;
		var y = 1.0 - (2.0 * _location.y) /c.height;
		var z = 1.0;

		let _obCamera = objects[obCamera[camMode]];
		var invPMatrix = m.identity(m.create());
		//m.transpose(pMatrix, invPMatrix);
		m.transpose(_obCamera.pMatrix, invPMatrix);
		m.inverse(invPMatrix, invPMatrix);
		var invVMatrix = m.identity(m.create());

		//m.transpose(_obCamera.mMatrix, invVMatrix);
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
		//let sel = selectedObject;
		for (var i = 0 in obResp) {
			let _oR = objects[obResp[i]];
			_oR.depth = 1000000;
			//console.log(obResp[i], objects[obResp[i]].numLoop, objects[obResp[i]].coord.length);
			for (let l = 0; l < _oR.numLoop * 3; l += 9) {
				_p0 = _oR.coord.slice(l, l + 3);
				_p1 = _oR.coord.slice(l + 3, l + 6);
				_p2 = _oR.coord.slice(l + 6, l + 9);
				_o = _obCamera.mMatrix.slice(12, 15);
				//_o = _obCamera.location;
				_d = ray_wld;
				_e = vecSub(_o, _p0);
				_e1 = vecSub(_p1, _p0);
				_e2 = vecSub(_p2, _p0);
				_q = cross(_d, _e2);
				_r = cross(_e, _e1);
				_t = dot(_r, _e2) / dot(_q, _e1);
				_u = dot(_q, _e) / dot(_q, _e1);
				_v = dot(_r, _d) / dot(_q, _e1);
				//console.log(_t, _u, _v, 1 - _u - _v);
				if (_u > 0 && _v > 0 && 1 - _u - _v > 0 && _t < _oR.depth) {
					_oR.depth = _t;
					//console.log(_t, _u, _v, 1 - _u - _v);
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

		/*
		var testV = [0.0, 0.0, 0.0, 1.0];
		m.multiplyV(invVMatrix, testV, testV);

		var t = 1000000;
		var sel = null;
		for (var i = 0 in obResp) {
			var A = [testV[0] - objects[obResp[i]].location[0], testV[1] - objects[obResp[i]].location[1], testV[2] - objects[obResp[i]].location[2]];
			var b = ray_wld[0] * A[0] + ray_wld[1] * A[1] + ray_wld[2] * A[2];
			var cc = A[0] * A[0] + A[1] * A[1] + A[2] * A[2] - 10.0;
			var det = b * b - cc;
			console.log(obResp[i], -b, det);
			if (det >= 0.0) {
				if (- b + Math.sqrt(det) < t) {
					t = - b + Math.sqrt(det);
					sel = objects[obResp[i]].name;
				}
				if (- b - Math.sqrt(det) < t) {
					t = - b - Math.sqrt(det);
					sel = objects[obResp[i]].name;
				}
			}
		}
		*/
		eText.textContent = sel;
		return sel;
	}

	function HUDUpdate(){
	}

	function buttonPressed(_button, _location) {
		let loc = objects[_button].location;
		let dim = objects[_button].dimensions;
		if (_location.x > loc[0] - 0.5 * dim[0] && _location.x < loc[0] + 0.5 * dim[0] && c.height - _location.y > loc[1] - 0.5 * dim[1] && c.height - _location.y < loc[1] + 0.5 * dim[1]) {
			return true;
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
		}
		if (buttonPressed('UI_terrain_button', _location)) {
			objects['sea_surface_GL'].draw = !objects['sea_surface_GL'].draw;
			objects['terrain_GL'].draw = !objects['terrain_GL'].draw;
		}
		if (buttonPressed('UI_map_button', _location)) {
			drawMap = !drawMap;
		}
	}

	function mouseDown(e) {
		if (opening_count >= OPENING_LENGTH ) {
			mousePressed = true;
			prevMouseLocation = getMouseLocation(e);
			currentMouseLocation = prevMouseLocation;
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
		}
	}

	function mouseUp(e) {
		if (opening_count >= OPENING_LENGTH) {
			mousePressed = false;
			currentMouseLocation = getMouseLocation(e);
			checkButtons(currentMouseLocation);
			selectedObject = selection_3D(currentMouseLocation);
			eText.textContent = selectedObject;
		}
	}

	function wheel(e) {
		if (opening_count >= OPENING_LENGTH) {
			//wheelDelta = e.deltaY;
			let ay = objects[obCamera[camMode]].angle_y;
			ay += wheelDelta * e.deltaY;
			if (ay < cameraViewAngleMax && ay > cameraViewAngleMin) {
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
			selectedObject = selection_3D(currentTouchLocations[0]);
			eText.textContent = selectedObject;
			if (currentTouchLocations.length === 3) {
				shiftKeyPressed = false;
			}

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
