import Texture from '../Renderer/Texture.js';
import vertShader from '../Shaders/TileVS.js';
import fragShader from '../Shaders/TileFS.js';

    function TileRenderer(options) {
        this._canvas = document.createElement('canvas');

        var canvas = this._canvas;
        canvas.width = options.width;
        canvas.height = options.height;

        this._lut = new Uint8Array(4096);
        var palette = [];
        var diff = null;
        var currentVal = 0;
        var currentValI = 0;
        var prevVal = 0;
        var diffVal = 1.0;
        var nextColor = new Uint8Array(4);
        var prevColor = new Uint8Array(4);

        function setPalette(color) {
            var i = palette.length;
            var index = color[0];

            palette[i] = [];
            palette[i].takeoff = [];
            palette[i].approach = [];
            palette[i].value = parseFloat(index);

            palette[i].takeoff.red = color[1][0];
            palette[i].takeoff.green = color[1][1];
            palette[i].takeoff.blue = color[1][2];

            var length = Object.keys(color[1]).length;

            if(i == 0 && length <= 4) {
                palette[i].takeoff.alpha = (typeof(color[1][3]) !== 'undefined' ? color[1][3] : 0);
                palette[i].approach.red = color[1][0];
                palette[i].approach.green = color[1][1];
                palette[i].approach.blue = color[1][2];
                palette[i].approach.alpha = (typeof(color[1][3]) !== 'undefined' ? color[1][3] : 0);
            } else if(i > 0 && length <= 4) {
                palette[i].takeoff.alpha = (typeof(color[1][3]) !== 'undefined' ? color[1][3] : 255);
                palette[i].approach.red = color[1][0];
                palette[i].approach.green = color[1][1];
                palette[i].approach.blue = color[1][2];
                palette[i].approach.alpha = (typeof(color[1][3]) !== 'undefined' ? color[1][3] : 255);
            } else if(i > 0 && length === 6) {
                palette[i].takeoff.alpha = 255;
                palette[i].approach.red = color[1][3];
                palette[i].approach.green = color[1][4];
                palette[i].approach.blue = color[1][5];
            } else if(i > 0 && length === 8) {
                palette[i].takeoff.alpha = color[1][3];
                palette[i].approach.red = color[1][4];
                palette[i].approach.green = color[1][5];
                palette[i].approach.blue = color[1][6];
                palette[i].approach.alpha = color[1][7];
            }
        }

        var i;
        for(i = 0; i < options.palette.length; i++) {
            setPalette(options.palette[i]);
        }

        diff = Math.abs(options.paletteMaximum - options.paletteMinimum);
        currentVal = parseFloat(options.paletteMinimum);
        prevVal = parseFloat(options.paletteMinimum);
        var stepSize = diff / 1024;

        for(i = 16; i < 4096; i += 4) {
            while (currentVal >= palette[currentValI].value && (currentValI+1) < palette.length) {
              prevColor[0] = palette[currentValI].takeoff.red;
              prevColor[1] = palette[currentValI].takeoff.green;
              prevColor[2] = palette[currentValI].takeoff.blue;
              prevColor[3] = palette[currentValI].takeoff.alpha;
              prevVal = palette[currentValI].value;
              currentValI++;
              diffVal = palette[currentValI].value - prevVal;
              nextColor[0] = palette[currentValI].approach.red;
              nextColor[1] = palette[currentValI].approach.green;
              nextColor[2] = palette[currentValI].approach.blue;
              nextColor[3] = palette[currentValI].approach.alpha;
            }
            if (currentVal >= palette[currentValI].value && (currentValI+1) >= palette.length) {
                prevColor[0] = palette[currentValI].approach.red;
                prevColor[1] = palette[currentValI].approach.green;
                prevColor[2] = palette[currentValI].approach.blue;
                prevColor[3] = palette[currentValI].approach.alpha;
                prevVal = options.paletteMaximum;
                currentVal = options.paletteMaximum;
                diffVal = 1.0;
                nextColor[0] = palette[currentValI].approach.red;
                nextColor[1] = palette[currentValI].approach.green;
                nextColor[2] = palette[currentValI].approach.blue;
                nextColor[3] = palette[currentValI].approach.alpha;
            }
            this._lut[i] = parseFloat(currentVal-prevVal) * (parseFloat(nextColor[0] - prevColor[0]) / diffVal) + prevColor[0];
            this._lut[i+1] = parseFloat(currentVal-prevVal) * parseFloat(nextColor[1] - prevColor[1]) / diffVal + prevColor[1];
            this._lut[i+2] = parseFloat(currentVal-prevVal) * parseFloat(nextColor[2] - prevColor[2]) / diffVal + prevColor[2];
            this._lut[i+3] = parseFloat(currentVal-prevVal) * parseFloat(nextColor[3] - prevColor[3]) / diffVal + prevColor[3];
            currentVal += stepSize;
        }

        this._lutSN = new Uint8Array(4096);

        if(options.paletteSnow.length > 0) {
            var palette = [];
            var diff = null;
            var currentVal = 0;
            var currentValI = 0;
            var prevVal = 0;
            var diffVal = 1.0;
            var nextColor = new Uint8Array(4);
            var prevColor = new Uint8Array(4);

            var i;
            for(i = 0; i < options.paletteSnow.length; i++) {
                setPalette(options.paletteSnow[i]);
            }

            diff = Math.abs(options.paletteMaximum - options.paletteMinimum);
            currentVal = parseFloat(options.paletteMinimum);
            prevVal = parseFloat(options.paletteMinimum);
            var stepSize = diff / 1024;

            for(i = 16; i < 4096; i += 4) {
                while (currentVal >= palette[currentValI].value && (currentValI+1) < palette.length) {
                  prevColor[0] = palette[currentValI].takeoff.red;
                  prevColor[1] = palette[currentValI].takeoff.green;
                  prevColor[2] = palette[currentValI].takeoff.blue;
                  prevColor[3] = palette[currentValI].takeoff.alpha;
                  prevVal = palette[currentValI].value;
                  currentValI++;
                  diffVal = palette[currentValI].value - prevVal;
                  nextColor[0] = palette[currentValI].approach.red;
                  nextColor[1] = palette[currentValI].approach.green;
                  nextColor[2] = palette[currentValI].approach.blue;
                  nextColor[3] = palette[currentValI].approach.alpha;
                }
                if (currentVal >= palette[currentValI].value && (currentValI+1) >= palette.length) {
                    prevColor[0] = palette[currentValI].approach.red;
                    prevColor[1] = palette[currentValI].approach.green;
                    prevColor[2] = palette[currentValI].approach.blue;
                    prevColor[3] = palette[currentValI].approach.alpha;
                    prevVal = options.paletteMaximum;
                    currentVal = options.paletteMaximum;
                    diffVal = 1.0;
                    nextColor[0] = palette[currentValI].approach.red;
                    nextColor[1] = palette[currentValI].approach.green;
                    nextColor[2] = palette[currentValI].approach.blue;
                    nextColor[3] = palette[currentValI].approach.alpha;
                }
                this._lutSN[i] = parseFloat(currentVal-prevVal) * (parseFloat(nextColor[0] - prevColor[0]) / diffVal) + prevColor[0];
                this._lutSN[i+1] = parseFloat(currentVal-prevVal) * parseFloat(nextColor[1] - prevColor[1]) / diffVal + prevColor[1];
                this._lutSN[i+2] = parseFloat(currentVal-prevVal) * parseFloat(nextColor[2] - prevColor[2]) / diffVal + prevColor[2];
                this._lutSN[i+3] = parseFloat(currentVal-prevVal) * parseFloat(nextColor[3] - prevColor[3]) / diffVal + prevColor[3];
                currentVal += stepSize;
            }
        } else {
            for(i = 16; i < 4096; i += 4) {
                this._lutSN[i] = 0;
                this._lutSN[i+1] = 0;
                this._lutSN[i+2] = 0;
                this._lutSN[i+3] = 0;
            }
        }

        this._lutIP = new Uint8Array(4096);

        if(options.paletteIcep.length > 0) {
            var palette = [];
            var diff = null;
            var currentVal = 0;
            var currentValI = 0;
            var prevVal = 0;
            var diffVal = 1.0;
            var nextColor = new Uint8Array(4);
            var prevColor = new Uint8Array(4);

            var i;
            for(i = 0; i < options.paletteIcep.length; i++) {
                setPalette(options.paletteIcep[i]);
            }

            diff = Math.abs(options.paletteMaximum - options.paletteMinimum);
            currentVal = parseFloat(options.paletteMinimum);
            prevVal = parseFloat(options.paletteMinimum);
            var stepSize = diff / 1024;

            for(i = 16; i < 4096; i += 4) {
                while (currentVal >= palette[currentValI].value && (currentValI+1) < palette.length) {
                  prevColor[0] = palette[currentValI].takeoff.red;
                  prevColor[1] = palette[currentValI].takeoff.green;
                  prevColor[2] = palette[currentValI].takeoff.blue;
                  prevColor[3] = palette[currentValI].takeoff.alpha;
                  prevVal = palette[currentValI].value;
                  currentValI++;
                  diffVal = palette[currentValI].value - prevVal;
                  nextColor[0] = palette[currentValI].approach.red;
                  nextColor[1] = palette[currentValI].approach.green;
                  nextColor[2] = palette[currentValI].approach.blue;
                  nextColor[3] = palette[currentValI].approach.alpha;
                }
                if (currentVal >= palette[currentValI].value && (currentValI+1) >= palette.length) {
                    prevColor[0] = palette[currentValI].approach.red;
                    prevColor[1] = palette[currentValI].approach.green;
                    prevColor[2] = palette[currentValI].approach.blue;
                    prevColor[3] = palette[currentValI].approach.alpha;
                    prevVal = options.paletteMaximum;
                    currentVal = options.paletteMaximum;
                    diffVal = 1.0;
                    nextColor[0] = palette[currentValI].approach.red;
                    nextColor[1] = palette[currentValI].approach.green;
                    nextColor[2] = palette[currentValI].approach.blue;
                    nextColor[3] = palette[currentValI].approach.alpha;
                }
                this._lutIP[i] = parseFloat(currentVal-prevVal) * (parseFloat(nextColor[0] - prevColor[0]) / diffVal) + prevColor[0];
                this._lutIP[i+1] = parseFloat(currentVal-prevVal) * parseFloat(nextColor[1] - prevColor[1]) / diffVal + prevColor[1];
                this._lutIP[i+2] = parseFloat(currentVal-prevVal) * parseFloat(nextColor[2] - prevColor[2]) / diffVal + prevColor[2];
                this._lutIP[i+3] = parseFloat(currentVal-prevVal) * parseFloat(nextColor[3] - prevColor[3]) / diffVal + prevColor[3];
                currentVal += stepSize;
            }
        } else {
            for(i = 16; i < 4096; i += 4) {
                this._lutIP[i] = 0;
                this._lutIP[i+1] = 0;
                this._lutIP[i+2] = 0;
                this._lutIP[i+3] = 0;
            }
        }

        this._lutZR = new Uint8Array(4096);

        if(options.paletteFrzr.length > 0) {
            var palette = [];
            var diff = null;
            var currentVal = 0;
            var currentValI = 0;
            var prevVal = 0;
            var diffVal = 1.0;
            var nextColor = new Uint8Array(4);
            var prevColor = new Uint8Array(4);

            var i;
            for(i = 0; i < options.paletteFrzr.length; i++) {
                setPalette(options.paletteFrzr[i]);
            }

            diff = Math.abs(options.paletteMaximum - options.paletteMinimum);
            currentVal = parseFloat(options.paletteMinimum);
            prevVal = parseFloat(options.paletteMinimum);
            var stepSize = diff / 1024;

            for(i = 16; i < 4096; i += 4) {
                while (currentVal >= palette[currentValI].value && (currentValI+1) < palette.length) {
                  prevColor[0] = palette[currentValI].takeoff.red;
                  prevColor[1] = palette[currentValI].takeoff.green;
                  prevColor[2] = palette[currentValI].takeoff.blue;
                  prevColor[3] = palette[currentValI].takeoff.alpha;
                  prevVal = palette[currentValI].value;
                  currentValI++;
                  diffVal = palette[currentValI].value - prevVal;
                  nextColor[0] = palette[currentValI].approach.red;
                  nextColor[1] = palette[currentValI].approach.green;
                  nextColor[2] = palette[currentValI].approach.blue;
                  nextColor[3] = palette[currentValI].approach.alpha;
                }
                if (currentVal >= palette[currentValI].value && (currentValI+1) >= palette.length) {
                    prevColor[0] = palette[currentValI].approach.red;
                    prevColor[1] = palette[currentValI].approach.green;
                    prevColor[2] = palette[currentValI].approach.blue;
                    prevColor[3] = palette[currentValI].approach.alpha;
                    prevVal = options.paletteMaximum;
                    currentVal = options.paletteMaximum;
                    diffVal = 1.0;
                    nextColor[0] = palette[currentValI].approach.red;
                    nextColor[1] = palette[currentValI].approach.green;
                    nextColor[2] = palette[currentValI].approach.blue;
                    nextColor[3] = palette[currentValI].approach.alpha;
                }
                this._lutZR[i] = parseFloat(currentVal-prevVal) * (parseFloat(nextColor[0] - prevColor[0]) / diffVal) + prevColor[0];
                this._lutZR[i+1] = parseFloat(currentVal-prevVal) * parseFloat(nextColor[1] - prevColor[1]) / diffVal + prevColor[1];
                this._lutZR[i+2] = parseFloat(currentVal-prevVal) * parseFloat(nextColor[2] - prevColor[2]) / diffVal + prevColor[2];
                this._lutZR[i+3] = parseFloat(currentVal-prevVal) * parseFloat(nextColor[3] - prevColor[3]) / diffVal + prevColor[3];
                currentVal += stepSize;
            }
        } else {
            for(i = 16; i < 4096; i += 4) {
                this._lutZR[i] = 0;
                this._lutZR[i+1] = 0;
                this._lutZR[i+2] = 0;
                this._lutZR[i+3] = 0;
            }
        }

        this._gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
        if (!this._gl) {
            alert("Failed to get WebGL context");
        }

        this._program = createProgram(this._gl, vertShader, fragShader);
    }

    function cloneCanvas(oldCanvas) {

        var newCanvas = document.createElement('canvas');
        newCanvas.width = oldCanvas.width;
        newCanvas.height = oldCanvas.height;

        var context = newCanvas.getContext('2d');
        context.drawImage(oldCanvas, 0, 0);

        return newCanvas;
    }

    function setRectangle(gl, x, y, width, height) {
      var x1 = x;
      var x2 = x + width;
      var y1 = y;
      var y2 = y + height;
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
         x1, y1,
         x2, y1,
         x1, y2,
         x1, y2,
         x2, y1,
         x2, y2,
      ]), gl.STATIC_DRAW);
    }

    function detectShaderError(gl, shader) {
        var compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
        if (!compiled) {
            var lastError = gl.getShaderInfoLog(shader);
            console.error("*** Error compiling shader '" + shader + "':" + lastError);
        }
    }

    function createProgram(gl, vertShaderSource, fragShaderSource) {
        var program = gl.createProgram();

        var vertShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vertShader, vertShaderSource);
        gl.compileShader(vertShader);
        detectShaderError(gl, vertShader);
        gl.attachShader(program, vertShader);

        var fragShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fragShader, fragShaderSource);
        gl.compileShader(fragShader);
        detectShaderError(gl, fragShader);
        gl.attachShader(program, fragShader);

        gl.linkProgram(program);
        var linked = gl.getProgramParameter(program, gl.LINK_STATUS);
        if (!linked) {
            // something went wrong with the link
            var lastError = gl.getProgramInfoLog(program);
            console.error("Error in program linking:" + lastError);

            gl.deleteProgram(program);
            return null;
        }
        return program;
    }

    TileRenderer.prototype.render = function(source) {
        var gl = this._gl;
        var program = this._program;

        // Tell it to use our program (pair of shaders)
        gl.useProgram(program);

        // look up where the vertex data needs to go.
        var positionLocation = gl.getAttribLocation(program, "a_position");
        var texCoordLocation = gl.getAttribLocation(program, "a_texCoord");

        // lookup uniforms
        var resolutionLocation = gl.getUniformLocation(program, "u_resolution");
        var imageLocation = gl.getUniformLocation(program, 'u_image');
        var LUTLocation = gl.getUniformLocation(program, 'u_lut');
        var LUTSNLocation = gl.getUniformLocation(program, 'u_lutSN');
        var LUTIPLocation = gl.getUniformLocation(program, 'u_lutIP');
        var LUTZRLocation = gl.getUniformLocation(program, 'u_lutZR');

        // Create a buffer to put three 2d clip space points in
        var positionBuffer = gl.createBuffer();

        // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        // Set a rectangle the same size as the image.
        setRectangle(gl, 0, 0, gl.canvas.width, gl.canvas.height);

        // provide texture coordinates for the rectangle.
        var texCoordBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            0.0,  0.0,
            1.0,  0.0,
            0.0,  1.0,
            0.0,  1.0,
            1.0,  0.0,
            1.0,  1.0]), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(texCoordLocation);
        gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);

        var imageTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, imageTexture);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);

        var LUTTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, LUTTexture);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1024, 0, gl.RGBA, gl.UNSIGNED_BYTE, this._lut);

        var LUTSNTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, LUTSNTexture);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1024, 0, gl.RGBA, gl.UNSIGNED_BYTE, this._lutSN);

        var LUTIPTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, LUTIPTexture);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1024, 0, gl.RGBA, gl.UNSIGNED_BYTE, this._lutIP);

        var LUTZRTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, LUTZRTexture);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1024, 0, gl.RGBA, gl.UNSIGNED_BYTE, this._lutZR);

        gl.uniform1i(imageLocation, 0);
        gl.uniform1i(LUTLocation, 1);
        gl.uniform1i(LUTSNLocation, 2);
        gl.uniform1i(LUTIPLocation, 3);
        gl.uniform1i(LUTZRLocation, 4);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, imageTexture);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, LUTTexture);
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, LUTSNTexture);
        gl.activeTexture(gl.TEXTURE3);
        gl.bindTexture(gl.TEXTURE_2D, LUTIPTexture);
        gl.activeTexture(gl.TEXTURE4);
        gl.bindTexture(gl.TEXTURE_2D, LUTZRTexture);

        // Tell WebGL how to convert from clip space to pixels
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        // Clear the canvas
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        // Turn on the position attribute
        gl.enableVertexAttribArray(positionLocation);

        // Bind the position buffer.
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

        // Tell the position attribute how to get data out of positionBuffer (ARRAY_BUFFER)
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

        // Turn on the teccord attribute
        gl.enableVertexAttribArray(texCoordLocation);

        // Bind the position buffer.
        gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);

        // Tell the position attribute how to get data out of positionBuffer (ARRAY_BUFFER)
        gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);

        // set the resolution
        gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height);

        // Draw the rectangle.
        gl.drawArrays(gl.TRIANGLES, 0, 6);

        var clonedCanvas = cloneCanvas(gl.canvas);

        return clonedCanvas;
    };

export default TileRenderer;
