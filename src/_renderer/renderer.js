(function () {

    "use strict";

    XEO.renderer = XEO.renderer || {};

    /**
     *
     */
    XEO.renderer.Renderer = function (stats, canvas, gl, options) {

        options = options || {};

        this.stats = stats || {};

        this.gl = gl;
        this.canvas = canvas;

        this._programFactory = new XEO.renderer.ProgramFactory(this.stats, gl);
        this._objectFactory = new XEO.renderer.ObjectFactory();
        this._chunkFactory = new XEO.renderer.ChunkFactory();

        /**
         * Indicates if the canvas is transparent
         * @type {boolean}
         */
        this.transparent = options.transparent === true;

        /**
         * Optional callback to fire when renderer wants to
         * bind an output framebuffer. This is useful when we need to bind a stereo output buffer for WebVR.
         *
         * When this is missing, the renderer will implicitly bind
         * WebGL's default framebuffer.
         *
         * The callback takes one parameter, which is the index of the current
         * rendering pass in which the buffer is to be bound.
         *
         * Use like this: myRenderer.bindOutputFramebuffer = function(pass) { .. });
         */
        this.bindOutputFramebuffer = null;

        /**
         * Optional callback to fire when renderer wants to
         * unbind any output drawing framebuffer that was
         * previously bound with #bindOutputFramebuffer.
         *
         * The callback takes one parameter, which is the index of the current
         * rendering pass in which the buffer is to be bound.
         *
         * Use like this: myRenderer.unbindOutputFramebuffer = function(pass) { .. });
         *
         * Callback takes no parameters.
         */
        this.unbindOutputFramebuffer = null;

        // Objects mapped to their IDs
        this.objects = {};

        // The current ambient color, if available
        this._ambient = null;

        /**
         * The current ambient color.
         * @type Float32Array
         */
        this.ambientColor = XEO.math.vec4([0,0,0,1]);

        // Objects in a list, ordered by state
        this._objectList = [];
        this._objectListLen = 0;

        // List of objects that were rendered in the last picking pass,
        // for indexing when using color-index picking
        this._objectPickList = [];
        this._objectPickListLen = 0;

        // The frame context holds state shared across a single render of the
        // draw list, along with any results of the render, such as pick hits
        this._frameCtx = {
            canvas: this.canvas,
            renderTarget: null,
            renderBuf: null,
            depthbufEnabled: null,
            clearDepth: null,
            depthFunc: null,
            blendEnabled: false,
            backfaces: true,
            frontface: true, // true = "ccw" else "cw"
            textureUnit: 0,
            transparent: false, // True while rendering transparency bin
            ambientColor: null,
            drawElements: 0,
            useProgram: 0,
            bindTexture: 0,
            bindArray: null,
            pass: null,
            bindOutputFramebuffer: null,
            pickIndex: 0
        };

        //----------------- Render states --------------------------------------

        /**
         Visibility render state.
         @property visibility
         @type {renderer.Visibility}
         */
        this.visibility = null;

        /**
         Culling render state.
         @property cull
         @type {renderer.Cull}
         */
        this.cull = null;

        /**
         Modes render state.
         @property modes
         @type {renderer.Modes}
         */
        this.modes = null;

        /**
         Render state for an effects layer.
         @property layer
         @type {renderer.Layer}
         */
        this.layer = null;

        /**
         Render state for an effects pipeline stage.
         @property stage
         @type {renderer.Layer}
         */
        this.stage = null;

        /**
         Depth buffer render state.
         @property depthBuf
         @type {renderer.DepthBuf}
         */
        this.depthBuf = null;

        /**
         Color buffer render state.
         @property colorBuf
         @type {renderer.ColorBuf}
         */
        this.colorBuf = null;

        /**
         Lights render state.
         @property lights
         @type {renderer.Lights}
         */
        this.lights = null;

        /**
         Material render state.
         @property material
         @type {renderer.Material}
         */
        this.material = null;

        /**
         Environmental reflection render state.
         @property reflection
         @type {renderer.Reflect}
         */
        this.reflect = null;

        /**
         Modelling transform render state.
         @property modelTransform
         @type {renderer.Transform}
         */
        this.modelTransform = null;

        /**
         View transform render state.
         @property viewTransform
         @type {renderer.Transform}
         */
        this.viewTransform = null;

        /**
         Projection transform render state.
         @property projTransform
         @type {renderer.Transform}
         */
        this.projTransform = null;

        /**
         Billboard render state.
         @property billboard
         @type {renderer.Billboard}
         */
        this.billboard = null;

        /**
         Stationary render state.
         @property stationary
         @type {renderer.Stationary}
         */
        this.stationary = null;

        /**
         Color target render state.
         @property colorTarget
         @type {renderer.RenderTarget}
         */
        this.colorTarget = null;

        /**
         Depth target render state.
         @property depthTarget
         @type {renderer.RenderTarget}
         */
        this.depthTarget = null;

        /**
         Cross-section planes render state.
         @property clips
         @type {renderer.Clips}
         */
        this.clips = null;

        /**
         Custom shader render state.
         @property shader
         @type {renderer.Shader}
         */
        this.shader = null;

        /**
         Render state providing custom shader params.
         @property shaderParams
         @type {renderer.Shader}
         */
        this.shaderParams = null;

        /**
         Geometry render state.
         @property geometry
         @type {renderer.Geometry}
         */
        this.geometry = null;

        /**
         Viewport render state.
         @property viewport
         @type {renderer.Viewport}
         */
        this.viewport = null;

        //----------------- Renderer dirty flags -------------------------------

        /**
         * Flags the object list as needing to be rebuilt from the object map.
         */
        this.objectListDirty = true;

        /**
         * Flags the object list as needing state orders to be recomputed.
         */
        this.stateOrderDirty = true;

        /**
         * Flags the object list as needing to be state-sorted.
         */
        this.stateSortDirty = true;

        /**
         * Flags the image as needing to be redrawn from the object list.
         */
        this.imageDirty = true;
    };

    /**
     * Reallocates WebGL resources for objects within this renderer.
     */
    XEO.renderer.Renderer.prototype.webglRestored = function (gl) {

        this.gl = gl;

        // Re-allocate programs
        this._programFactory.webglRestored(gl);

        // Re-bind chunks to the programs
        this._chunkFactory.webglRestored();

        // Rebuild pick buffer

        if (this.pickBuf) {
            this.pickBuf.webglRestored(gl);
        }

        // Need redraw

        this.imageDirty = true;
    };

    /**
     * Internally creates (or updates) a {@link XEO.renderer.Object} of the given
     * ID from whatever component state cores are currently set on this {@link XEO.Renderer}.
     * The object is created if it does not already exist in the display, otherwise
     * it is updated with the current states, possibly replacing states already
     * referenced by the object.
     *
     * @param {String} objectId ID of object to create or update
     */
    XEO.renderer.Renderer.prototype.buildObject = function (objectId) {

        var object = this.objects[objectId];

        if (!object) {
            object = this._objectFactory.get(objectId);
            object.hash = "";
        }

        // Attach to the object any states that we need to get off it later.
        // Most of these will be used when composing the object's shader.

        object.stage = this.stage;
        object.layer = this.layer;
        object.colorTarget = this.colorTarget;
        object.depthTarget = this.depthTarget;
        object.material = this.material;
        object.reflect = this.reflect;
        object.geometry = this.geometry;
        object.visibility = this.visibility;
        object.cull = this.cull;
        object.modes = this.modes;
        object.billboard = this.billboard;
        object.stationary = this.stationary;
        object.viewport = this.viewport;

        // Build hash of the object's state configuration. This is used
        // to hash the object's shader so that it may be reused by other
        // objects that have the same state configuration.

        var hash = ([

            // Make sure that every state type
            // with a hash is concatenated here

            this.geometry.hash,
            this.shader.hash,
            this.clips.hash,
            this.material.hash,
            this.lights.hash,
            this.billboard.hash,
            this.stationary.hash

        ]).join(";");

        var newProgram = false;

        if (hash !== object.hash) {

            // Get new program for object

            if (object.program) {
                this._programFactory.put(object.program);
            }

            object.program = this._programFactory.get(hash, this);
            object.hash = hash;

            newProgram = true;

            // Handle shader error

            var programState = object.program;
            if (programState) {
                var program = programState.program;
                if (!program.allocated || !program.compiled || !program.validated || !program.linked) {
                    if (this.objects[objectId]) {
                        this.removeObject(objectId); // Don't keep faulty objects in the renderer
                    }
                    return {
                        error: true,
                        errorLog: program.errorLog
                    }
                }
            }
        }

        // Build list of draw chunks on the object

        // The order of some of these is important because some chunks will set
        // state on this._frameCtx to be consumed by other chunks downstream

        this._setChunk(object, 0, "program", object.program); // Must be first
        this._setChunk(object, 1, "modelTransform", this.modelTransform);
        this._setChunk(object, 2, "viewTransform", this.viewTransform);
        this._setChunk(object, 3, "projTransform", this.projTransform);
        this._setChunk(object, 4, "modes", this.modes);
        this._setChunk(object, 5, "shader", this.shader);
        this._setChunk(object, 6, "shaderParams", this.shaderParams);
        this._setChunk(object, 7, "depthBuf", this.depthBuf);
        this._setChunk(object, 8, "colorBuf", this.colorBuf);
        this._setChunk(object, 9, "lights", this.lights);
        this._setChunk(object, 10, this.material.type, this.material); // Supports different material systems
        this._setChunk(object, 11, "clips", this.clips);
        this._setChunk(object, 12, "viewport", this.viewport);
        this._setChunk(object, 13, "geometry", this.geometry);
        this._setChunk(object, 14, "draw", this.geometry, true); // Must be last

        // Ambient light is global across everything in display, and
        // can never be disabled, so grab it now because we want to
        // feed it to gl.clearColor before each display list render

        this._setAmbient(this.lights);

        if (!this.objects[objectId]) {
            this.objects[objectId] = object;
            this.objectListDirty = true;

        } else {

            // At the very least, the object sort order will need be recomputed
            this.stateOrderDirty = true;
        }

        object.compiled = true;

        return object;
    };

    /** Adds a render state chunk to a render graph object.
     */
    XEO.renderer.Renderer.prototype._setChunk = function (object, order, type, state, neg) {

        var id;

        var chunkType = this._chunkFactory.types[type];

        if (type === "program") {
            id = (object.program.id + 1) * 100000000;

        } else if (chunkType.constructor.prototype.programGlobal) {
            id = state.id;

        } else {
            id = ((object.program.id + 1) * 100000000) + ((state.id + 1));
        }

        if (neg) {
            id *= 100000;
        }

        var oldChunk = object.chunks[order];

        if (oldChunk) {
            this._chunkFactory.putChunk(oldChunk);
        }

        // Attach new chunk

        object.chunks[order] = this._chunkFactory.getChunk(id, type, object.program.program, state);
    };

    // Sets the singular ambient light.
    XEO.renderer.Renderer.prototype._setAmbient = function (state) {

        var lights = state.lights;
        var light;

        for (var i = 0, len = lights.length; i < len; i++) {

            light = lights[i];

            if (light.type === "ambient") {

                this._ambient = light;
            }
        }
    };

    /**
     * Removes an object from this Renderer
     *
     * @param {String} objectId ID of object to remove
     */
    XEO.renderer.Renderer.prototype.removeObject = function (objectId) {

        var object = this.objects[objectId];

        if (!object) {

            // Object not found
            return;
        }

        // Release draw chunks
        var chunks = object.chunks;
        for (var i = 0, len = chunks.length; i < len; i++) {
            this._chunkFactory.putChunk(chunks[i]);
        }

        // Release object's shader
        this._programFactory.put(object.program);

        object.program = null;
        object.hash = null;

        // Release object
        this._objectFactory.put(object);

        delete this.objects[objectId];

        // Need to repack object map into fast iteration list
        this.objectListDirty = true;
    };

    /**
     * Renders a new frame, if neccessary.
     */
    XEO.renderer.Renderer.prototype.render = function (params) {

        params = params || {};

        if (this.objectListDirty) {
            this._buildObjectList(); // Build the scene object list
            this.objectListDirty = false;
            this.stateOrderDirty = true; // Now needs state ordering
        }

        if (this.stateOrderDirty) {
            this._makeStateSortKeys(); // Determine the state sort order
            this.stateOrderDirty = false;
            this.stateSortDirty = true; // Now needs state sorting
        }

        if (this.stateSortDirty) {
            this._stateSort(); // State sort the scene object list
            this.stateSortDirty = false;
            this.imageDirty = true; // Now need to build object draw list
        }

        if (this.imageDirty || params.force) {
            this._renderObjectList({ // Render the draw list
                clear: (params.clear !== false), // Clear buffers by default
                opaqueOnly: params.opaqueOnly,
                pass: params.pass
            });
            this.stats.frame.frameCount++;
            this.imageDirty = false;
        }
    };

    /**
     * Builds the object list from the object map
     */
    XEO.renderer.Renderer.prototype._buildObjectList = function () {
        this._objectListLen = 0;
        for (var objectId in this.objects) {
            if (this.objects.hasOwnProperty(objectId)) {
                this._objectList[this._objectListLen++] = this.objects[objectId];
            }
        }
    };

    /**
     * Generates object state sort keys
     */
    XEO.renderer.Renderer.prototype._makeStateSortKeys = function () {
        var object;
        for (var i = 0, len = this._objectListLen; i < len; i++) {
            object = this._objectList[i];
            if (!object.program) { // Non-visual object (eg. sound)
                object.sortKey = -1;
            } else {
                object.sortKey =
                    ((object.stage.priority + 1) * 10000000000000000)
                    + ((object.modes.transparent ? 2 : 1) * 100000000000000)
                    + ((object.layer.priority + 1) * 10000000000000)
                    + ((object.program.id + 1) * 100000000)
                    + ((object.material.id + 1) * 10000)
                    + object.geometry.id;
            }
        }
    };

    /**
     * State-sorts the object list
     */
    XEO.renderer.Renderer.prototype._stateSort = function () {
        this._objectList.length = this._objectListLen;
        this._objectList.sort(function (a, b) {
            return a.sortKey - b.sortKey;
        });
    };

    XEO.renderer.Renderer.prototype._renderObjectList = function (params) {

        var gl = this.gl;

        // The extensions needs to be re-queried in case the context was lost and has been recreated.
        if (XEO.WEBGL_INFO.SUPPORTED_EXTENSIONS["OES_element_index_uint"]) {
            gl.getExtension("OES_element_index_uint");
        }

        var ambient = this._ambient;
        var ambientColor;
        if (ambient) {
            var color = ambient.color;
            var intensity = ambient.intensity;
            this.ambientColor[0] = color[0] * intensity;
            this.ambientColor[1] = color[1] * intensity;
            this.ambientColor[2] = color[2] * intensity;
        } else {
            this.ambientColor[0] = 0;
            this.ambientColor[1] = 0;
            this.ambientColor[2] = 0;
        }

        var frameCtx = this._frameCtx;

        frameCtx.renderTarget = null;
        frameCtx.renderBuf = null;
        frameCtx.depthbufEnabled = null;
        frameCtx.clearDepth = null;
        frameCtx.depthFunc = gl.LESS;
        frameCtx.blendEnabled = false;
        frameCtx.backfaces = true;
        frameCtx.frontface = true; // true == "ccw" else "cw"
        frameCtx.textureUnit = 0;
        frameCtx.transparent = false; // True while rendering transparency bin
        frameCtx.ambientColor = this.ambientColor;
        frameCtx.drawElements = 0;
        frameCtx.useProgram = 0;
        frameCtx.bindTexture = 0;
        frameCtx.bindArray = 0;
        frameCtx.pass = params.pass;
        frameCtx.bindOutputFramebuffer = this.bindOutputFramebuffer;
        frameCtx.pickViewMatrix = params.pickViewMatrix;
        frameCtx.pickProjMatrix = params.pickProjMatrix;
        frameCtx.pickIndex = 0;

        // The extensions needs to be re-queried in case the context was lost and has been recreated.
        if (XEO.WEBGL_INFO.SUPPORTED_EXTENSIONS["OES_element_index_uint"]) {
            gl.getExtension("OES_element_index_uint");
        }

        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);

        if (this.transparent || params.pickObject || params.pickSurface) {

            // Canvas is transparent - set clear color with zero alpha
            // to allow background to show through
            gl.clearColor(0, 0, 0, 0);
        } else {

            // Canvas is opaque - set clear color to the current ambient
            gl.clearColor(this.ambientColor[0], this.ambientColor[1], this.ambientColor[2], 1.0);
        }


        gl.enable(gl.DEPTH_TEST);
        gl.frontFace(gl.CCW);
        gl.disable(gl.CULL_FACE);
        gl.disable(gl.BLEND);

        var i;
        var len;
        var j;
        var lenj;
        var chunks;
        var chunk;

        var lastChunkId = this._lastChunkId = this._lastChunkId || new Int32Array(30);
        for (i = 0; i < 20; i++) {
            lastChunkId[i] = -9999999999999;
        }

        if (params.pickObject) {

            // Pick an object

            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            this._objectPickListLen = 0;

            var object;

            for (i = 0, len = this._objectListLen; i < len; i++) {

                object = this._objectList[i];

                if (!object.compiled) {
                    continue;
                }

                if (object.cull.culled === true) {
                    continue;
                }

                if (object.visibility.visible === false) {
                    continue;
                }

                if (object.modes.pickable === false) {
                    continue;
                }

                this._objectPickList[this._objectPickListLen++] = object;

                chunks = object.chunks;

                for (j = 0, lenj = chunks.length; j < lenj; j++) {

                    chunk = chunks[j];

                    if (chunk) {

                        // As we apply the state chunk lists we track the ID of most types
                        // of chunk in order to cull redundant re-applications of runs
                        // of the same chunk - except for those chunks with a 'unique' flag,
                        // because we don't want to collapse runs of draw chunks because
                        // they contain the GL drawElements calls which render the objects.

                        if (chunk.pickObject && (chunk.unique || lastChunkId[j] !== chunk.id)) {
                            chunk.pickObject(frameCtx);
                            lastChunkId[j] = chunk.id;
                        }
                    }
                }
            }

        } else if (params.pickSurface) {

            // Pick a triangle on an object

            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            if (params.object) {

                chunks = params.object.chunks;

                for (i = 0, len = chunks.length; i < len; i++) {
                    chunk = chunks[i];
                    if (chunk.pickPrimitive) {
                        chunk.pickPrimitive(frameCtx);
                    }
                }
            }

        } else {

            // Render all objects

            var startTime = (new Date()).getTime();

            if (this.bindOutputFramebuffer) {
                this.bindOutputFramebuffer(params.pass);
            }

            if (params.clear) {
                gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            }

            for (i = 0, len = this._objectListLen; i < len; i++) {

                object = this._objectList[i];

                if (!object.compiled) {
                    continue;
                }

                if (object.cull.culled === true) {
                    continue;
                }

                if (object.visibility.visible === false) {
                    continue;
                }

                chunks = object.chunks;

                for (j = 0, lenj = chunks.length; j < lenj; j++) {

                    chunk = chunks[j];

                    if (chunk) {

                        // As we apply the state chunk lists we track the ID of most types
                        // of chunk in order to cull redundant re-applications of runs
                        // of the same chunk - except for those chunks with a 'unique' flag,
                        // because we don't want to collapse runs of draw chunks because
                        // they contain the GL drawElements calls which render the objects.

                        if (chunk.draw && (chunk.unique || lastChunkId[j] !== chunk.id)) {
                            chunk.draw(frameCtx);
                            lastChunkId[j] = chunk.id;
                        }
                    }
                }
            }

            var endTime = Date.now();

            var frameStats = this.stats.frame;

            frameStats.renderTime = (endTime - startTime) / 1000.0;
            frameStats.drawElements = frameCtx.drawElements;
            frameStats.useProgram = frameCtx.useProgram;
            frameStats.bindTexture = frameCtx.bindTexture;
            frameStats.bindArray = frameCtx.bindArray;

            if (frameCtx.renderBuf) {
                frameCtx.renderBuf.unbind();
            }

            var numTextureUnits = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);

            for (var ii = 0; ii < numTextureUnits; ++ii) {
                gl.activeTexture(gl.TEXTURE0 + ii);
                gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
                gl.bindTexture(gl.TEXTURE_2D, null);
            }

            if (this.unbindOutputFramebuffer) {
                this.unbindOutputFramebuffer(params.pass);
            }
        }
    };

    /**
     * Attempts to pick an object.
     *
     * @param {*} params Picking params.
     * @returns {*} Hit result, if any.
     */
    XEO.renderer.Renderer.prototype.pick = (function () {

        var math = XEO.math;

        var tempVec3a = math.vec3();
        var tempMat4a = math.mat4();
        var up = math.vec3([0, 1, 0]);
        var pickFrustumMatrix = math.frustumMat4(-1, 1, -1, 1, 0.1, 10000);

        return function (params) {

            var hit = null;
            var pickBuf = this.pickBuf;

            if (!pickBuf) {  // Lazy-create the pick buffer
                pickBuf = new XEO.renderer.webgl.RenderBuffer(this.canvas, this.gl);
                this.pickBuf = pickBuf;
            }

            // Do any pending render
            this.render();

            pickBuf.bind();
            pickBuf.clear();


            var pickBufX;
            var pickBufY;
            var origin;
            var direction;
            var look;
            var pickViewMatrix = null;
            var pickProjMatrix = null;

            if (!params.canvasPos) {

                // Ray-picking with arbitrarily World-space ray

                origin = params.origin || math.vec3([0, 0, 0]);
                direction = params.direction || math.vec3([0, 0, 1]);
                look = math.addVec3(origin, direction, tempVec3a);

                pickViewMatrix = math.lookAtMat4v(origin, look, up, tempMat4a);
                pickProjMatrix = pickFrustumMatrix;

                pickBufX = this.canvas.clientWidth * 0.5;
                pickBufY = this.canvas.clientHeight * 0.5;

            } else {

                if (params.canvasPos) {
                    pickBufX = params.canvasPos[0];
                    pickBufY = params.canvasPos[1];

                } else {
                    pickBufX = this.canvas.clientWidth * 0.5;
                    pickBufY = this.canvas.clientHeight * 0.5;
                }
            }

            this._renderObjectList({
                pickObject: true,
                clear: true,
                pickViewMatrix: pickViewMatrix,
                pickProjMatrix: pickProjMatrix
            });

            //     gl.finish();

            // Convert picked pixel color to object index

            var pix = pickBuf.read(pickBufX, pickBufY);
            var pickedObjectIndex = pix[0] + pix[1] * 256 + pix[2] * 65536;
            pickedObjectIndex = (pickedObjectIndex >= 1) ? pickedObjectIndex - 1 : -1;

            var object = this._objectPickList[pickedObjectIndex];

            if (object) {

                // Object was picked

                hit = {
                    entity: object.id
                };

                // Now do a primitive-pick if requested

                if (params.pickSurface) {

                    pickBuf.clear();

                    this._renderObjectList({
                        pickSurface: true,
                        object: object,
                        pickViewMatrix: pickViewMatrix,
                        pickProjMatrix: pickProjMatrix,
                        clear: true
                    });

                    this.gl.finish();

                    // Convert picked pixel color to primitive index

                    pix = pickBuf.read(pickBufX, pickBufY);
                    var primIndex = pix[0] + (pix[1] * 256) + (pix[2] * 256 * 256) + (pix[3] * 256 * 256 * 256);
                    primIndex *= 3; // Convert from triangle number to first vertex in indices

                    hit.primIndex = primIndex;

                    if (pickViewMatrix) {
                        hit.origin = origin;
                        hit.direction = direction;
                    }
                }
            }

            pickBuf.unbind();

            return hit;
        };
    })();

    /**
     * Reads the colors of some pixels in the last rendered frame.
     *
     * @param {Float32Array} pixels
     * @param {Float32Array} colors
     * @param {Number} len
     * @param {Boolean} opaqueOnly
     */
    XEO.renderer.Renderer.prototype.readPixels = function (pixels, colors, len, opaqueOnly) {

        if (!this._readPixelBuf) {
            this._readPixelBuf = new XEO.renderer.webgl.RenderBuffer(this.canvas, this.gl);
        }

        this._readPixelBuf.bind();

        this._readPixelBuf.clear();

        this.render({
            force: true,
            opaqueOnly: opaqueOnly
        });

        var color;
        var i;
        var j;
        var k;

        for (i = 0; i < len; i++) {

            j = i * 2;
            k = i * 4;

            color = this._readPixelBuf.read(pixels[j], pixels[j + 1]);

            colors[k] = color[0];
            colors[k + 1] = color[1];
            colors[k + 2] = color[2];
            colors[k + 3] = color[3];
        }

        this._readPixelBuf.unbind();
    };

    /**
     * Destroys this Renderer.
     */
    XEO.renderer.Renderer.prototype.destroy = function () {
        this._programFactory.destroy();
    };
})();
