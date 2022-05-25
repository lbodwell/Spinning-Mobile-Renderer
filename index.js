"use strict"

// Initialize global variables
let fileUploader = null;
let gl = null;
let program = null;
let aspectRatio = 1.0;

let modelMatrixStack = [];
let points = [];
let colors = [];
let normals = [];
let texCoords = [];
let cachedCube = {vertices: [], normals: [], scale: 0.5};
let cachedSphere = {vertices: [], normals: []};
let light = {position: vec4(0.0, 0.0, 16.0, 1.0), ambient: vec4(0.4, 0.4, 0.4, 1.0), diffuse: vec4(1.0, 1.0, 1.0, 1.0), specular: vec4(1.0, 1.0, 1.0, 1.0), coneAngle: 0.995};
let eye = vec3(0.0, 0.0, 4.0);

let emeraldMaterial = {ambient: vec4(0.0215, 0.1745, 0.0215, 0.55), diffuse: vec4(0.07568, 0.61424, 0.07568, 0.55), specular: vec4(0.633, 0.727811, 0.633, 0.55), shininess: 76.8};
let rubyMaterial = {ambient: vec4(0.1745, 0.01175, 0.01175, 0.55), diffuse: vec4(0.61424, 0.04136, 0.04136, 0.55), specular: vec4(0.727811, 0.626959, 0.626959, 0.55), shininess: 76.8};
let turquoiseMaterial = {ambient: vec4(0.1, 0.18725, 0.1745, 0.8), diffuse: vec4(0.396, 0.74151, 0.69102, 0.8), specular: vec4(0.297254, 0.30829, 0.306678, 0.8), shininess: 12.8};
let goldMaterial = {ambient: vec4(0.24725, 0.1995, 0.0745, 1.0), diffuse: vec4(0.75164, 0.60648, 0.22648, 1.0), specular: vec4(0.628281, 0.555802, 0.366065, 1.0), shininess: 51.2};
let obsidianMaterial = {ambient: vec4(0.05375, 0.05, 0.06625, 0.82), diffuse: vec4(0.18275, 0.17, 0.22525, 0.82), specular: vec4(0.332741, 0.328634, 0.346435, 0.82), shininess: 38.4};
let bluePlasticMaterial = {ambient: vec4(0.0,  0.0,  0.0,  1.0), diffuse: vec4(0.0, 0.0, 0.5, 1.0), specular: vec4(0.6, 0.6, 0.7, 1.0), shininess: 32.0};
let magentaRubberMaterial = {ambient: vec4(0.05, 0.0, 0.05, 1.0), diffuse: vec4(0.5, 0.3, 0.5, 1.0), specular: vec4(0.7, 0.04, 0.7, 1.0), shininess: 10.0};

let vertexBuffer = null;
let colorBuffer = null;
let normalBuffer = null;
let texCoordBuffer = null;

let projMatrixLocation = null;
let modelMatrixLocation = null;
let lightPositionLocation = null;
let diffuseProductLocation = null;
let specularProductLocation = null;
let ambientProductLocation = null;
let materialShininessLocation = null;
let spotlightConeAngleLocation = null;
let doLightLocation = null;
let doReflectLocation = null;
let doRefractLocation = null;
let doTextureLocation = null;
let textureLocation = null;
let cubeMapLocation = null;

let theta = 0.0;
let currentShadingMethod = "gouraud";
let areShadowsEnabled = true;
let areTexturesEnabled = true;
let isReflectionEnabled = false;
let isRefractionEnabled = false;
let areExperimentalFeaturesEnabled = false;
let lastMouseX = 0.0;
let lastMouseY = 0.0;
let isMouseDown = false;

/**
 * Runs when the window is loaded
 */
window.onload = function() {
	// Set up the WebGL canvas
	setupCanvas();

	// Get file uploader from document
	fileUploader = document.getElementById("file-upload");
    // Add event listener to file uploader if found
	if (fileUploader) {
		fileUploader.addEventListener("change", updateSphereModelFile, false);
	}
	
	// Handle key presses
	window.onkeydown = function(evt) {
		const key = evt.keyCode;
		let newShadingMethod = null;

		switch (key) {
			case 65: {
				// A pressed
				areShadowsEnabled = !areShadowsEnabled;
			}
			break;
			case 66: {
				// B pressed
				areTexturesEnabled = !areTexturesEnabled;
			}
			break;
			case 67: {
				// C pressed
				isReflectionEnabled = !isReflectionEnabled;
			}
			break;
			case 68: {
				// D pressed
				isRefractionEnabled = !isRefractionEnabled;
			}
			break;
			case 73: {
				// I pressed
				if (light.coneAngle + 0.00005 <= 1.0) {
					light.coneAngle += 0.00005;
				} else {
					light.coneAngle = 1.0;
				}
			}
			break;
			case 80: {
				// P pressed
				if (light.coneAngle - 0.00005 >= 0.994) {
					light.coneAngle -= 0.00005;
				} else {
					light.coneAngle = 0.994;
				}
			}
			break;
			case 77: {
				// M pressed
				newShadingMethod = "gouraud";
			}
			break;
			case 78: {
				// N pressed
				newShadingMethod = "flat";
			}
			break;
			case 69: {
				// E pressed
				areExperimentalFeaturesEnabled = !areExperimentalFeaturesEnabled;

				// Update experimental feature control visibility
				const expControls1 = document.getElementById("exp-controls-1");
				const expControls2 = document.getElementById("exp-controls-2");
				const expControls3 = document.getElementById("exp-controls-3");
				const expControls4 = document.getElementById("exp-controls-4");
				const expControls5 = document.getElementById("exp-controls-5");
				expControls1.style.visibility = areExperimentalFeaturesEnabled ? "visible" : "hidden";
				expControls2.style.visibility = areExperimentalFeaturesEnabled ? "visible" : "hidden";
				expControls3.style.visibility = areExperimentalFeaturesEnabled ? "visible" : "hidden";
				expControls4.style.visibility = areExperimentalFeaturesEnabled ? "visible" : "hidden";
				expControls5.style.visibility = areExperimentalFeaturesEnabled ? "visible" : "hidden";

				// Reset spotlight and eye positions on experimental feature toggle
				light.position[0] = 0.0;
				light.position[1] = 0.0;
				eye[0] = 0.0;
				eye[1] = 0.0;
			}
			case 76: {
				// L pressed
				if (areExperimentalFeaturesEnabled) {
					if (light.position[0] + 0.1 <= 15.0) {
						light.position[0] += 0.1;
					} else {
						light.position[0] = 15.0;
					}
				}
			}
			break;
			case 74: {
				// J pressed
				if (areExperimentalFeaturesEnabled) {
					if (light.position[0] - 0.1 >= -15.0) {
						light.position[0] -= 0.1;
					} else {
						light.position[0] = -15.0;
					}
				}
			}
			break;
			case 79: {
				// O pressed
				if (areExperimentalFeaturesEnabled) {
					if (light.position[1] + 0.1 <= 15.0) {
						light.position[1] += 0.1;
					} else {
						light.position[1] = 15.0;
					}
				}
			}
			break;
			case 75: {
				// K pressed
				if (areExperimentalFeaturesEnabled) {
					if (light.position[1] - 0.1 >= -15.0) {
						light.position[1] -= 0.1;
					} else {
						light.position[1] = -15.0;
					}
				}
			}
		}

		// Update shading method and recalculate normals
		if (newShadingMethod && newShadingMethod != currentShadingMethod) {
			currentShadingMethod = newShadingMethod
			cachedCube.normals = calculateNormals(cachedCube.vertices, currentShadingMethod);
			cachedSphere.normals = calculateNormals(cachedSphere.vertices, currentShadingMethod);
		}
	}

	window.onmousedown = () => {
		isMouseDown = true;
	}

	window.onmouseup = () => {
		isMouseDown = false;
	}

	// Apply mouse move event listener
	document.addEventListener("mousemove", onMouseMove);
}

/**
 * Handles mouse movement
 * @param evt: mousemove event
 */
function onMouseMove(evt) {
	// Pan the camera by adjusting the eye position depending on the mouse's current position relative to its last
	if (areExperimentalFeaturesEnabled && isMouseDown) {
		if (evt.pageX > lastMouseX && Math.abs(evt.pageY - lastMouseY) <= 4) {
			if (eye[0] - 0.05 >= -4.0) {
				eye[0] -= 0.05;
			} else {
				eye[0] = -4.0;
			}
		} else if (evt.pageX < lastMouseX && Math.abs(evt.pageY - lastMouseY) <= 4) {
			if (eye[0] + 0.05 <= 4.0) {
				eye[0] += 0.05;
			} else {
				eye[0] = 4.0;
			}
		} else if (Math.abs(evt.pageX - lastMouseX) <= 4 && evt.pageY > lastMouseY) {
			if (eye[1] + 0.05 <= 4.0) {
				eye[1] += 0.05;
			} else {
				eye[1] = 4.0;
			}
		} else if (Math.abs(evt.pageX - lastMouseX) <= 4 && evt.pageY < lastMouseY) {
			if (eye[1] - 0.05 >= -0.75) {
				eye[1] -= 0.05;
			} else {
				eye[1] = -0.75;
			}
		}
	}

	// Update last mouse X and Y
	lastMouseX = evt.pageX;
	lastMouseY = evt.pageY;
}

/**
 * Sets up the WebGL canvas
 */
function setupCanvas() {
	// Get WebGL canvas from document
	const canvas = document.getElementById("gl-canvas");
	// Set initial canvas dimensions

	// Set up WebGL using provided libraries
	gl = WebGLUtils.setupWebGL(canvas);
	if (!gl) {
		alert("Unable to initialize WebGL. Your browser or machine may not support it.");
		return;
	}

	// Compile WebGL program using vertex and fragment shaders
	program = initShaders(gl, "vertex-shader", "fragment-shader");
	gl.useProgram(program);
	// Set viewport and clear color
	gl.viewport(0.0, 0.0, canvas.width, canvas.height);
	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	// Enable depth testing
	gl.enable(gl.DEPTH_TEST);
	// Enable back-face culling
	gl.enable(gl.CULL_FACE);
	gl.cullFace(gl.BACK);

	// Calculate canvas aspect ratio
	aspectRatio = canvas.width / canvas.height;

	// Create and bind vertex buffer
	vertexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
	// Enable vertex position attribute 
	const vPosition = gl.getAttribLocation(program, "vPosition");
	gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vPosition);

	// Create and bind normal buffer
	normalBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
	// Enable vertex color attribute
	const vNormal = gl.getAttribLocation(program, "vNormal");
	gl.vertexAttribPointer(vNormal, 4, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vNormal);

	// Create and bind color buffer
	colorBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
	// Enable vertex color attribute
	const vColor = gl.getAttribLocation(program, "vColor");
	gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vColor);

	// Create and bind texture coordinate buffer
	texCoordBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
	// Enable texture coordinate attribute
	const vTexCoord = gl.getAttribLocation(program, "vTexCoord");
	gl.vertexAttribPointer(vTexCoord, 2, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vTexCoord);

	// Get uniform locations
	projMatrixLocation = gl.getUniformLocation(program, "projMatrix");
	modelMatrixLocation = gl.getUniformLocation(program, "modelMatrix");
	lightPositionLocation = gl.getUniformLocation(program, "lightPosition");
	diffuseProductLocation = gl.getUniformLocation(program, "diffuseProduct");
	specularProductLocation = gl.getUniformLocation(program, "specularProduct");
	ambientProductLocation = gl.getUniformLocation(program, "ambientProduct");
	materialShininessLocation = gl.getUniformLocation(program, "materialShininess");
	spotlightConeAngleLocation = gl.getUniformLocation(program, "spotlightConeAngle");
	doLightLocation = gl.getUniformLocation(program, "doLight");
	doReflectLocation = gl.getUniformLocation(program, "doReflect");
	doRefractLocation = gl.getUniformLocation(program, "doRefract");
	doTextureLocation = gl.getUniformLocation(program, "doTexture");
	textureLocation = gl.getUniformLocation(program, "texture");
	cubeMapLocation = gl.getUniformLocation(program, "cubeMap");
	
	// Configure textures
	configureTextures();

	// Clear canvas
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}

/**
 * Renders the scene
 */
function render() {
	// Clear canvas
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	
	// Update rotation
	theta = ((theta + 0.2) % 360);

	// Set light position and cone angle uniforms
	gl.uniform4fv(lightPositionLocation, flatten(light.position));
	gl.uniform1f(spotlightConeAngleLocation, light.coneAngle);

	// Set up perspective projection
	const perspectiveProjection = perspective(45.0, aspectRatio, 0.01, 100.0);
	gl.uniformMatrix4fv(projMatrixLocation, false, flatten(perspectiveProjection));

	// Set up initial model view matrix
	modelMatrixStack = [];
	const at = vec3(0.0, 0.0, 0.0);
	const up = vec3(0.0, 1.0, 0.0);
	let modelViewMatrix = lookAt(eye, at, up);
	gl.uniformMatrix4fv(modelMatrixLocation, false, flatten(modelViewMatrix));
	modelMatrixStack.push(modelViewMatrix);
	
	// Draw and transform objects in hierarchical model
	// Left wall
	modelViewMatrix = mult(modelViewMatrix, translate(0.0, 0.0, -4.0));
	modelViewMatrix = mult(modelViewMatrix, rotateY(45.0));
	gl.uniformMatrix4fv(modelMatrixLocation, false, flatten(modelViewMatrix));
	drawPlane(20.0, 10.0, 0.0, vec4(0.0, 0.0, 1.0, 1.0), "stone");

	modelViewMatrix = modelMatrixStack.pop();
	modelMatrixStack.push(modelViewMatrix);

	// Right wall
	modelViewMatrix = mult(modelViewMatrix, translate(0.0, 0.0, -4.0));
	modelViewMatrix = mult(modelViewMatrix, rotateY(-45.0));
	gl.uniformMatrix4fv(modelMatrixLocation, false, flatten(modelViewMatrix));
	drawPlane(20.0, 10.0, 0.0, vec4(0.0, 0.0, 1.0, 1.0), "stone");

	modelViewMatrix = modelMatrixStack.pop();
	modelMatrixStack.push(modelViewMatrix);

	// Ground
	modelViewMatrix = mult(modelViewMatrix, translate(0.0, -1.0, 1.0));
	modelViewMatrix = mult(modelViewMatrix, rotateY(45.0));
	modelViewMatrix = mult(modelViewMatrix, rotateX(-90.0));
	gl.uniformMatrix4fv(modelMatrixLocation, false, flatten(modelViewMatrix));
	drawPlane(15.0, 15.0, 0.0, vec4(0.4, 0.4, 0.4, 1.0), "grass");

	modelViewMatrix = modelMatrixStack.pop();
	modelMatrixStack.push(modelViewMatrix);

	// Sphere A1
	modelViewMatrix = mult(modelViewMatrix, translate(0.0, 1.5, 0.0));
	modelViewMatrix = mult(modelViewMatrix, rotateY(theta));
	gl.uniformMatrix4fv(modelMatrixLocation, false, flatten(modelViewMatrix));
	drawSphere(emeraldMaterial);
	modelMatrixStack.push(modelViewMatrix);

	// Sphere A1 shadow
	if (areShadowsEnabled) {
		modelViewMatrix = calculateShadowMatrix(modelViewMatrix);
		gl.uniformMatrix4fv(modelMatrixLocation, false, flatten(modelViewMatrix));
		drawShadow();
		
		modelViewMatrix = modelMatrixStack.pop();
		modelMatrixStack.push(modelViewMatrix);
	}

	// Cube A1 hanger-bottom
	modelViewMatrix = mult(modelViewMatrix, translate(0.0, -0.375, 0.0));
	gl.uniformMatrix4fv(modelMatrixLocation, false, flatten(modelViewMatrix));
	drawLine("vertical", 0.25,);
	modelMatrixStack.push(modelViewMatrix);

	// Cube A1 hanger-crossbar
	modelViewMatrix = mult(modelViewMatrix, translate(0.0, -0.125, 0.0));
	gl.uniformMatrix4fv(modelMatrixLocation, false, flatten(modelViewMatrix));
	drawLine("horizontal", 2.0);
	modelMatrixStack.push(modelViewMatrix);

	// Cube B1 hanger-top
	modelViewMatrix = mult(modelViewMatrix, translate(-1.0, -0.125, 0.0));
	gl.uniformMatrix4fv(modelMatrixLocation, false, flatten(modelViewMatrix));
	drawLine("vertical", 0.25);

	// Cube B1
	modelViewMatrix = mult(modelViewMatrix, translate(0.0, -0.375, 0.0));
	modelViewMatrix = mult(modelViewMatrix, rotateY(-2 * theta));
	gl.uniformMatrix4fv(modelMatrixLocation, false, flatten(modelViewMatrix));
	drawCube(0.5, bluePlasticMaterial);
	modelMatrixStack.push(modelViewMatrix);

	// Cube B1 shadow
	if (areShadowsEnabled) {
		modelViewMatrix = calculateShadowMatrix(modelViewMatrix);
		gl.uniformMatrix4fv(modelMatrixLocation, false, flatten(modelViewMatrix));
		drawShadow();
		
		modelViewMatrix = modelMatrixStack.pop();
		modelMatrixStack.push(modelViewMatrix);
	}

	// Cube B1 hanger-bottom
	modelViewMatrix = mult(modelViewMatrix, translate(0.0, -0.375, 0.0));
	gl.uniformMatrix4fv(modelMatrixLocation, false, flatten(modelViewMatrix));
	drawLine("vertical", 0.25,);
	modelMatrixStack.push(modelViewMatrix);

	// Cube B1 hanger-crossbar
	modelViewMatrix = mult(modelViewMatrix, translate(0.0, -0.125, 0.0));
	gl.uniformMatrix4fv(modelMatrixLocation, false, flatten(modelViewMatrix));
	drawLine("horizontal", 1.0);
	modelMatrixStack.push(modelViewMatrix);

	// Cube C1 hanger-top
	modelViewMatrix = mult(modelViewMatrix, translate(-0.5, -0.125, 0.0));
	gl.uniformMatrix4fv(modelMatrixLocation, false, flatten(modelViewMatrix));
	drawLine("vertical", 0.25);
	modelMatrixStack.push(modelViewMatrix);
	
	// Cube C1
	modelViewMatrix = mult(modelViewMatrix, translate(0, -0.375, 0.0));
	modelViewMatrix = mult(modelViewMatrix, rotateY(-2 * theta));
	gl.uniformMatrix4fv(modelMatrixLocation, false, flatten(modelViewMatrix));
	drawCube(0.5, rubyMaterial);

	// Cube C1 shadow
	if (areShadowsEnabled) {
		modelViewMatrix = calculateShadowMatrix(modelViewMatrix);
		gl.uniformMatrix4fv(modelMatrixLocation, false, flatten(modelViewMatrix));
		drawShadow();
		
		modelViewMatrix = modelMatrixStack.pop();
		modelMatrixStack.push(modelViewMatrix);
	}
	
	modelViewMatrix = modelMatrixStack.pop();
	modelViewMatrix = modelMatrixStack.pop();

	// Cube C2 hanger-top
	modelViewMatrix = mult(modelViewMatrix, translate(0.5, -0.125, 0.0));
	gl.uniformMatrix4fv(modelMatrixLocation, false, flatten(modelViewMatrix));
	drawLine("vertical", 0.25);
	modelMatrixStack.push(modelViewMatrix);

	// Sphere C2
	modelViewMatrix = mult(modelViewMatrix, translate(0.0, -0.375, 0.0));
	modelViewMatrix = mult(modelViewMatrix, rotateY(-2 * theta));
	gl.uniformMatrix4fv(modelMatrixLocation, false, flatten(modelViewMatrix));
	drawSphere(magentaRubberMaterial);

	// Sphere C2 shadow
	if (areShadowsEnabled) {
		modelViewMatrix = calculateShadowMatrix(modelViewMatrix);
		gl.uniformMatrix4fv(modelMatrixLocation, false, flatten(modelViewMatrix));
		drawShadow();
		
		modelViewMatrix = modelMatrixStack.pop();
		modelMatrixStack.push(modelViewMatrix);
	}

	modelViewMatrix = modelMatrixStack.pop();
	modelViewMatrix = modelMatrixStack.pop();
	modelViewMatrix = modelMatrixStack.pop();
	modelViewMatrix = modelMatrixStack.pop();

	// Cube B2 hanger-top
	modelViewMatrix = mult(modelViewMatrix, translate(1.0, -0.125, 0.0));
	gl.uniformMatrix4fv(modelMatrixLocation, false, flatten(modelViewMatrix));
	drawLine("vertical", 0.25);
	modelMatrixStack.push(modelViewMatrix);

	// Sphere B2
	modelViewMatrix = mult(modelViewMatrix, translate(0.0, -0.375, 0.0));
	modelViewMatrix = mult(modelViewMatrix, rotateY(-2 * theta));
	gl.uniformMatrix4fv(modelMatrixLocation, false, flatten(modelViewMatrix));
	drawSphere(obsidianMaterial);
	modelMatrixStack.push(modelViewMatrix);

	// Sphere B2 shadow
	if (areShadowsEnabled) {
		modelViewMatrix = calculateShadowMatrix(modelViewMatrix);
		gl.uniformMatrix4fv(modelMatrixLocation, false, flatten(modelViewMatrix));
		drawShadow();
		
		modelViewMatrix = modelMatrixStack.pop();
		modelMatrixStack.push(modelViewMatrix);
	}

	// Cube B2 hanger-bottom
	modelViewMatrix = mult(modelViewMatrix, translate(0.0, -0.375, 0.0));
	gl.uniformMatrix4fv(modelMatrixLocation, false, flatten(modelViewMatrix));
	drawLine("vertical", 0.25,);
	modelMatrixStack.push(modelViewMatrix);

	// Cube B2 hanger-crossbar
	modelViewMatrix = mult(modelViewMatrix, translate(0.0, -0.125, 0.0));
	gl.uniformMatrix4fv(modelMatrixLocation, false, flatten(modelViewMatrix));
	drawLine("horizontal", 1.0);
	modelMatrixStack.push(modelViewMatrix);

	// Cube C3 hanger-top
	modelViewMatrix = mult(modelViewMatrix, translate(-0.5, -0.125, 0.0));
	gl.uniformMatrix4fv(modelMatrixLocation, false, flatten(modelViewMatrix));
	drawLine("vertical", 0.25);
	modelMatrixStack.push(modelViewMatrix);

	// Cube C3
	modelViewMatrix = mult(modelViewMatrix, translate(0.0, -0.375, 0.0));
	modelViewMatrix = mult(modelViewMatrix, rotateY(-2 * theta));
	gl.uniformMatrix4fv(modelMatrixLocation, false, flatten(modelViewMatrix));
	drawCube(0.5, goldMaterial);

	// Cube C3 shadow
	if (areShadowsEnabled) {
		modelViewMatrix = calculateShadowMatrix(modelViewMatrix);
		gl.uniformMatrix4fv(modelMatrixLocation, false, flatten(modelViewMatrix));
		drawShadow();
		
		modelViewMatrix = modelMatrixStack.pop();
		modelMatrixStack.push(modelViewMatrix);
	}

	modelViewMatrix = modelMatrixStack.pop();
	modelViewMatrix = modelMatrixStack.pop();

	// Cube C4 hanger-top
	modelViewMatrix = mult(modelViewMatrix, translate(0.5, -0.125, 0.0));
	gl.uniformMatrix4fv(modelMatrixLocation, false, flatten(modelViewMatrix));
	drawLine("vertical", 0.25);

	// Cube C4
	modelViewMatrix = mult(modelViewMatrix, translate(0.0, -0.375, 0.0));
	modelViewMatrix = mult(modelViewMatrix, rotateY(-2 * theta));
	gl.uniformMatrix4fv(modelMatrixLocation, false, flatten(modelViewMatrix));
	drawCube(0.5, turquoiseMaterial);

	if (areShadowsEnabled) {
		modelViewMatrix = calculateShadowMatrix(modelViewMatrix);
		gl.uniformMatrix4fv(modelMatrixLocation, false, flatten(modelViewMatrix));
		drawShadow();
	}
	
	// Request next animation frame
	requestAnimationFrame(render);
}

/**
 * Calculates the shadow matrix used to project shadows onto the walls
 * @param modelViewMatrix: the current model view matrix after rendering the object whose shadow should be rendered
 */
function calculateShadowMatrix(modelViewMatrix) {
	let shadowMatrix = mat4();
	let shadowProjection = mat4();

	shadowProjection[3][3] = 0;
	shadowProjection[3][2] = -1 / light.position[2];

	shadowMatrix = mult(shadowMatrix, translate(light.position[0], light.position[1], light.position[2]));
	shadowMatrix = mult(shadowMatrix, shadowProjection);
	shadowMatrix = mult(shadowMatrix, translate(-light.position[0], -light.position[1], -light.position[2]));
	modelViewMatrix = mult(shadowMatrix, modelViewMatrix);
	modelViewMatrix = mult(translate(0.0, 0.0, -6.0), modelViewMatrix);

	return modelViewMatrix;
}

function drawShadow() {
	// Update colors
	colors = [];
	points.forEach(vertex => colors.push(vec4(0.0, 0.0, 0.0, 1.0)));

	// Set uniforms
	gl.uniform1i(doLightLocation, 0);
	gl.uniform1i(doTextureLocation, 0);
	gl.uniform1i(doReflectLocation, 0);
	gl.uniform1i(doRefractLocation, 0);

	// Buffer points, normals, and colors
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);
	gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);

	// Draw points
	gl.drawArrays(gl.TRIANGLES, 0, points.length);
}

/**
 * Draws a sphere to the canvas
 * @param color: the color of the cube
 */
function drawSphere(material) {
	// Set default color
	const color = vec4(1.0, 1.0, 1.0, 1.0);

	// Update points, normals, and colors
	points = cachedSphere.vertices;
	normals = cachedSphere.normals;
	colors = [];
	points.forEach(vertex => colors.push(color));

	// Apply material and set uniforms
	if (material) {
		applyMaterial(material);
		gl.uniform1i(doLightLocation, 1);
	} else {
		gl.uniform1i(doLightLocation, 0);
	}
	gl.uniform1i(doTextureLocation, 0);
	gl.uniform1i(doReflectLocation, Number(isReflectionEnabled));
	gl.uniform1i(doRefractLocation, Number(isRefractionEnabled));

	// Buffer points, normals, and colors
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);
	gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(normals), gl.STATIC_DRAW);
	gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);

	// Draw points
	gl.drawArrays(gl.TRIANGLES, 0, points.length);
}

/**
 * Draws a cube to the canvas
 * @param scale: the scale of the cube (default: 0.5) 
 * @param color: the color of the cube
 */
function drawCube(scale, material) {
	// Set default color
	const color = vec4(1.0, 1.0, 1.0, 1.0);

	// Regenerate cube if scale is different from default
	if (scale != 0.5) {
		generateCube(scale);
	}

	// Update points, normals, and colors
	points = cachedCube.vertices;
	normals = cachedCube.normals;
	colors = [];
	points.forEach(vertex => colors.push(color));
	
	// Apply material and set uniforms
	if (material) {
		applyMaterial(material);
		// Set lighting to true
		gl.uniform1i(doLightLocation, 1);
	} else {
		gl.uniform1i(doLightLocation, 0);
	}
	gl.uniform1i(doTextureLocation, 0);
	gl.uniform1i(doReflectLocation, Number(isReflectionEnabled));
	gl.uniform1i(doRefractLocation, Number(isRefractionEnabled));

	// Buffer points, normals, and colors
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);
	gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(normals), gl.STATIC_DRAW);
	gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);

	// Draw points
	gl.drawArrays(gl.TRIANGLES, 0, points.length);
}

/**
 * Generates a cube model
 * @param scale: the scale of the cube (default: 0.5)
 */
function generateCube(scale) {
	// Generate the 6 quadrilaterals that make up the cube
	let quads = [];
	quads.push(generateQuad(1, 0, 3, 2, scale, scale, scale));
	quads.push(generateQuad(2, 3, 7, 6, scale, scale, scale));
	quads.push(generateQuad(3, 0, 4, 7, scale, scale, scale));
	quads.push(generateQuad(6, 5, 1, 2, scale, scale, scale));
	quads.push(generateQuad(4, 5, 6, 7, scale, scale, scale));
	quads.push(generateQuad(5, 4, 0, 1, scale, scale, scale));

	// Update vertices, normals, and scale of cached cube
	quads.forEach(quad => quad.forEach(vertex => cachedCube.vertices.push(vertex)));
	cachedCube.normals = calculateNormals(cachedCube.vertices, currentShadingMethod);
	cachedCube.scale = scale;
}

function drawPlane(width, height, depth, color, texture) {
	color = color ? color : vec4(1.0, 1.0, 1.0, 1.0);

	points = generateQuad(1, 0, 3, 2, width, height, depth);
	normals = [];
	colors = [];
	points.forEach(vertex => colors.push(color));
	texCoords = [];
	points.forEach(vertex => texCoords.push(vec2(vertex[0], vertex[1])));

	gl.uniform1i(doTextureLocation, Number(areTexturesEnabled));
	if (texture === "grass") {
		gl.uniform1i(textureLocation, 0);
	} else if (texture === "stone") {
		gl.uniform1i(textureLocation, 1);
	}

	// Set lighting to false
	gl.uniform1i(doLightLocation, 0);
	gl.uniform1i(doReflectLocation, 0);
	gl.uniform1i(doRefractLocation, 0);

	// Buffer points, normals, and colors
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);
	gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(normals), gl.STATIC_DRAW);
	gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);
	gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(texCoords), gl.STATIC_DRAW);

	// Draw points
	gl.drawArrays(gl.TRIANGLES, 0, points.length);
}

/**
 * Generates a quadrilateral
 * @param a: a coordinate of the quad
 * @param b: b coordinate of the quad
 * @param c: c coordinate of the quad
 * @param d: d coordinate of the quad
 * @param width: the width of the quad (default: 0.5)
 * @param width: the width of the quad (default: 0.5)
 */
function generateQuad(a, b, c, d, width, height, depth) {
	let verts = [];

	let vertices = [
		vec4(-width / 2, -height / 2, depth / 2, 1.0),
		vec4(-width / 2, height / 2, depth / 2, 1.0),
		vec4(width / 2, height / 2, depth / 2, 1.0),
		vec4(width / 2, -height / 2, depth / 2, 1.0),
		vec4(-width / 2, -height / 2, -depth / 2, 1.0),
		vec4(-width / 2, height / 2, -depth / 2, 1.0),
		vec4(width / 2, height / 2, -depth / 2, 1.0),
		vec4(width / 2, -height / 2, -depth / 2, 1.0)
	];

	let indices = [a, b, c, a, c, d];
	indices.forEach(index => verts.push(vertices[index]));

	return verts;
}

/**
 * Draws a line to the canvas
 * @param dir: the direction of the line (horizontal or vertial)
 * @param length: the length of the line
 * @param color: the color of the line
 */
function drawLine(dir, length, color) {
	// Set default color
	color = color ? color : vec4(0.9, 0.9, 0.9, 1.0);

	// Update points and colors
	points = [];
	colors = [];
	if (dir === "horizontal") {
		points.push(vec4(length * -0.5, 0.0, 0.0));
		points.push(vec4(length * 0.5, 0.0, 0.0));
	} else if (dir === "vertical") {
		points.push(vec4(0.0, length * -0.5, 0.0));
		points.push(vec4(0.0, length * 0.5, 0.0));
	}
	points.forEach(vertex => colors.push(color));

	// Set uniforms
	gl.uniform1i(doTextureLocation, 0);
	gl.uniform1i(doLightLocation, 0);
	gl.uniform1i(doReflectLocation, 0);
	gl.uniform1i(doRefractLocation, 0);

	// Buffer points and colors
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);
	gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);

	// Draw points
	gl.drawArrays(gl.LINES, 0, points.length);
}

/**
 * Sets the material properties of the object being lit by the vertex shader
 * @param material: the material properties to be applied
 */
function applyMaterial(material) {
	// Calculate diffuse, specular, and ambient products
	const ambientProduct = mult(light.ambient, material.ambient);
	const diffuseProduct = mult(light.diffuse, material.diffuse);
    const specularProduct = mult(light.specular, material.specular);
    
	// Set uniforms
    gl.uniform4fv(diffuseProductLocation, flatten(diffuseProduct));
    gl.uniform4fv(specularProductLocation, flatten(specularProduct));
    gl.uniform4fv(ambientProductLocation, flatten(ambientProduct));
    gl.uniform1f(materialShininessLocation, material.shininess);
}

/**
 * Configures all textures used in the scene
 */
async function configureTextures() {
	// Configure grass and stone textures
	configureTexture(await loadImage("https://web.cs.wpi.edu/~jmcuneo/grass.bmp"), 0);
	configureTexture(await loadImage("https://web.cs.wpi.edu/~jmcuneo/stones.bmp"), 1);

	// Configure cube map once all images are loaded
	Promise.all([
		loadImage("http://web.cs.wpi.edu/~jmcuneo/env_map_sides/nvposx.bmp"),
		loadImage("http://web.cs.wpi.edu/~jmcuneo/env_map_sides/nvnegx.bmp"),
		loadImage("http://web.cs.wpi.edu/~jmcuneo/env_map_sides/nvposx.bmp"),
		loadImage("http://web.cs.wpi.edu/~jmcuneo/env_map_sides/nvnegy.bmp"),
		loadImage("http://web.cs.wpi.edu/~jmcuneo/env_map_sides/nvposz.bmp"),
		loadImage("http://web.cs.wpi.edu/~jmcuneo/env_map_sides/nvnegz.bmp")
	]).then((images) => {
		const cubeMapImages = {posX: images[0], negX: images[1], posY: images[2], negY: images[3], posZ: images[4], negZ: images[5]};
		configureCubeMap(cubeMapImages, 2);
	});
}

/**
 * Loads an image asynchronously
 * @param url: the URL of the image
 */
function loadImage(url) {
	return new Promise((resolve, reject) => {
		const image = new Image();
		image.addEventListener("load", () => resolve(image));
		image.addEventListener("error", () => reject(new DOMException("Failed to load image at the specified url.")));
		image.crossOrigin = "";
		image.src = url;
	});
}

/**
 * 
 * @param image: the image to be used for texturing
 * @param activeTextureId: the id of the active texture unit
 */
function configureTexture(image, activeTextureId) {
	const texture = gl.createTexture();
	gl.activeTexture(getActiveTexture(activeTextureId));
	gl.bindTexture(gl.TEXTURE_2D, texture);

	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);

	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

	gl.uniform1i(textureLocation, activeTextureId);
}

/**
 * 
 * @param cubeMapImages: the six images that make up a cube map
 * @param activeTextureId: the id of the active texture unit
 */
function configureCubeMap(cubeMapImages, activeTextureId) {
	const cubeMap = gl.createTexture();
	gl.activeTexture(getActiveTexture(activeTextureId));
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeMap);

    gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, cubeMapImages.posX);
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_X, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, cubeMapImages.negX);
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Y, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, cubeMapImages.posY);
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, cubeMapImages.negY);
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Z, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, cubeMapImages.posZ);
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, cubeMapImages.negZ);

    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	
	gl.uniform1i(cubeMapLocation, activeTextureId);
}

/**
 * Returns the active texture unit given its id
 * @param activeTextureId: the id of the active texture unit
 */
function getActiveTexture(activeTextureId) {
	let activeTexture = null;

	if (activeTextureId === 0) {
		activeTexture = gl.TEXTURE0;
	} else if (activeTextureId === 1) {
		activeTexture = gl.TEXTURE1;
	} else if (activeTextureId === 2) {
		activeTexture = gl.TEXTURE2;
	}

	return activeTexture;
}

/**
 * Calculates the normal vectors of each vertex in a polygon
 * @param points: list of points of the polygon to find normals of 
 * @param shadingMethod: the current shading method (gouraud or flat)
 */
function calculateNormals(points, shadingMethod) {
	let surfaceNormals = [];
	let adjacentNormals = [];

	// Calculate surface normals of each polygon
	for (let i = 0; i < points.length - 2; i += 3) {
		let polygon = [];
		for (let j = i; j < i + 3; j++) {
			polygon.push(points[j]);
		}
		const normal = calculateSurfaceNormal(polygon);
		for (let j = i; j < i + 3; j++) {
			adjacentNormals.push({index: j, vertex: points[j], normal});
			surfaceNormals.push(normal);
		}
	}

	if (shadingMethod === "gouraud") {
		// Use vertex normals for gouraud shading
		let vertexNormals = [];
		let calculatedIndices = [];

		for (let i = 0; i < adjacentNormals.length; i++) {
			if (calculatedIndices.includes(i)) {
				continue;
			}
			let currentVertexIndices = [];
			let currentVertexAdjNormals = [];
			for (let j = 0; j < adjacentNormals.length; j++) {
				const vert1 = adjacentNormals[i].vertex;
				const vert2 = adjacentNormals[j].vertex;
				if (isDuplicateVector(vert1, vert2)) {
					currentVertexIndices.push(adjacentNormals[j].index);
					currentVertexAdjNormals.push(adjacentNormals[j].normal);
				}
			}
			// Remove duplicate adjacent surface normals
			currentVertexAdjNormals = Array.from(new Set(currentVertexAdjNormals.map(JSON.stringify)), JSON.parse)

			// Calculate vertex normal by averaging adjacent surface normals
			const vertexNormal = normalize(addVectors(currentVertexAdjNormals));
			// Update list of vertex normals
			currentVertexIndices.forEach(index => {
				vertexNormals[index] = vertexNormal;
				calculatedIndices.push(index);
			});
		}

		return vertexNormals;
	} else if (shadingMethod === "flat") {
		// Use surface normals for flat shading
		return surfaceNormals;
	} else {
		alert("Invalid shading method.");
		return null;
	}
}

/**
 * Calculates the surface normal vector of a polygon
 * @param polygon: the polygon to calculate surface normal vector of
 */
function calculateSurfaceNormal(polygon) {
	let x = 0;
	let y = 0;
	let z = 0;

	// Push the vertex to the end of the array to access the first point from the last using the same pattern
	polygon.push(polygon[0]);

	// Use the Newell Method to calculate the surface normal vector
	for (let i = 0; i < polygon.length - 1; i++) {
		x += (polygon[i][1] - polygon[i + 1][1]) * (polygon[i][2] + polygon[i + 1][2]);
		y += (polygon[i][2] - polygon[i + 1][2]) * (polygon[i][0] + polygon[i + 1][0]);
		z += (polygon[i][0] - polygon[i + 1][0]) * (polygon[i][1] + polygon[i + 1][1]);
	}
	
	return normalize(vec4(x, y, z, 0.0));
}

/**
 * Determines whether one vector is equivalent to another
 * @param vec1: the first vector
 * @param vec2: the second vector
 */
function isDuplicateVector(vec1, vec2) {
	return vec1[0] === vec2[0] && vec1[1] === vec2[1] && vec1[2] === vec2[2] && vec1[3] === vec2[3];
}

/**
 * Finds the sum of a list of vectors by recursively adding the last vector in the list to the all of the others
 * @param vecs: the list of vectors to add
 */
function addVectors(vecs) {
	if (vecs.length < 2) {
		return null;
	} else if (vecs.length == 2) {
		return add(vecs[0], vecs[1]);
	} else {
		const lastVec = vecs.pop();
		return add(addVectors(vecs), lastVec);
	}
}

/**
 * Draws an image from the newly uploaded file 
 */
async function updateSphereModelFile() {
    // Get file from calling function
    const file = this.files[0];
    // Await file lines from promise and draw them
	parseSphereModel(await readSphereModelFile(file));
	// Hide upload dialogue
	fileUploader.style.visibility = "hidden";
}

/**
 * Reads the uploaded file
 * @param file: the file to be read 
 */
function readSphereModelFile(file) {
    // Return the result of reading the file as a promise
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        // If the promise is resolved, return the file contents as an array split by line
        reader.onload = () => resolve(reader.result.split(/\r?\n/));

        // If the promise is rejected, throw an error
        reader.onerror = () => {
            reader.abort();
            reject(new DOMException("An error occurred while parsing the uploaded file."));
        }

        reader.readAsText(file);
    });
}

/**
 * Parses the uploaded file 
 * @param fileLines: The lines of the file to be parsed separated by line breaks
 */
function parseSphereModel(fileLines) {
	let numVertices = 0;
    let numPolygons = 0;
	let vertices = [];
	let polygons = [];
    let indexOfFirstVertex = -1;
    let indexOfFirstPolygon = -1;
    let isPastHeader = false;

	// Parse file line-by-line
	for (let i = 0; i < fileLines.length; i++) {
		const line = fileLines[i];
		if (line) {
			if (!isPastHeader) {
				// Get header information
				if (i === 0 && line != "ply") {
                    alert("An error occurred while parsing the uploaded file! Please make sure that it is properly formatted.");
                    break;
                } else if (line.includes("element")) {
                    const elementData = line.split(" ");
                    if (elementData[1] === "vertex") {
                        numVertices = parseInt(elementData[2]);
                    } else if (elementData[1] === "face") {
                        numPolygons = parseInt(elementData[2]);
                    }
                } else if (line === "end_header") {
                    indexOfFirstVertex = i + 1;
					indexOfFirstPolygon = indexOfFirstVertex + numVertices;
                    isPastHeader = true;
                }
			} else {
				if (i < indexOfFirstPolygon) {
					// Get vertex information
                    const vertexData = line.split(" ");
					const vertex = {x: parseFloat(vertexData[0]), y: parseFloat(vertexData[1]), z: parseFloat(vertexData[2])};
                    vertices.push({x: vertex.x, y: vertex.y, z: vertex.z});
                } else if (i < (parseInt(indexOfFirstPolygon) + parseInt(numPolygons))) {
					// Get polygon data
					const polygonData = line.trim().substring(2).split(" ");
					let polygon = [];
                    polygonData.forEach(vertexIndex => polygon.push(vertices[vertexIndex]));
					polygons.push(polygon);
				}
			}
		}	
	}

	// Populate points array with polygon vertices
	polygons.forEach(polygon => polygon.forEach(vertex => cachedSphere.vertices.push(vec4(vertex.x / 4, vertex.y / 4, vertex.z / 4, 1.0))));
	cachedSphere.normals = calculateNormals(cachedSphere.vertices, currentShadingMethod);

	// Generate initial cube
	generateCube(0.5);

	// Render the scene
	render();
}