/**

 A **StencilBuf** configures the WebGL stencil buffer for attached {{#crossLink "Entity"}}Entities{{/crossLink}}.

 <img src="../../../assets/images/StencilBuf.png"></img>

 ## Usage

 This example creates a {{#crossLink "Entity"}}{{/crossLink}} with a StencilBuf
 with all the default property values:

 ````javascript
 new XEO.Entity({
     geometry: new XEO.BoxGeometry(),
     stencilBuf: new XEO.StencilBuf({
         active: true,
         clear: true,
         frontFunc: "always",
         frontRef: 0,
         frontSFail: "keep",
         frontDPPass: "keep",
         frontDPFail: "keep"
         backFunc: "always",
         backRef: 0,
         backSFail: "keep",
         backDPPass: "keep",
         backDPFail: "keep"
     })
 });
 ````

 ## Resources

 <ul>
 <li>[OpenGL Depth and Stencil Buffers](https://open.gl/depthstencils)</li>
 </ul>

 @class StencilBuf
 @module XEO
 @submodule rendering
 @constructor
 @param [scene] {Scene} Parent {{#crossLink "Scene"}}Scene{{/crossLink}}, creates this StencilBuf within the
 default {{#crossLink "Scene"}}Scene{{/crossLink}} when omitted.
 @param [cfg] {*} StencilBuf configuration
 @param [cfg.id] {String} Optional ID, unique among all components in the parent {{#crossLink "Scene"}}Scene{{/crossLink}}, generated automatically when omitted.
 @param [cfg.meta] {String:Object} Optional map of user-defined metadata to attach to this StencilBuf.
 @param [cfg.clear=false] {Boolean} Whether to clear the StencilBuf for each frame.
 @param [cfg.clearValue=0] {Number} The value that the stencil buffer is set to when cleared.
 @param [cfg.frontFunc="always"] {String} Comparison function for the front face stencil test.
 @param [cfg.frontRef=0] {Number} A value to compare the stencil value to using the front face comparison function selected
 by {{#crossLink "StencilBuf/frontFunc:property"}}{{/crossLink}}.
 @param [cfg.frontMask=0xff] {Number} Controls what bits are written to the front face stencil buffer.
 @param [cfg.frontSFail="keep"] {String} Action to take if the front face stencil test fails.
 @param [cfg.frontDPPass="keep"] {String} Action to take if the front face stencil test passes.
 @param [cfg.frontDPFail="keep"] {String} Action to take if the front face stencil passes, but the depth test fails.
 @param [cfg.backFunc="always"] {String} Comparison function for the back face stencil test.
 @param [cfg.backRef=0] {Number} A value to compare the stencil value to using the back face comparison function selected
 by {{#crossLink "StencilBuf/backFunc:property"}}{{/crossLink}}.
 @param [cfg.backMask=0xff] {Number} Controls what bits are written to the back face stencil buffer.
 @param [cfg.backSFail="keep"] {String} Action to take if the back face stencil test fails.
 @param [cfg.backDPPass="keep"] {String} Action to take if the back face stencil test passes.
 @param [cfg.backDPFail="keep"] {String} Action to take if the back face stencil passes, but the depth test fails.
 @extends Component
 */
(function () {

    "use strict";

    var lookup = {

        // stencilFunc.func
        never: "NEVER",
        less: "LESS",
        equal: "EQUAL",
        lequal: "LEQUAL",
        greater: "GREATER",
        notequal: "NOTEQUAL",
        gequal: "GEQUAL",
        always: "ALWAYS",

        // stencilOp
        keep: "KEEP",
        zero: "ZERO",
        replace: "REPLACE",
        incr: "INCR",
        incr_wrap: "INCR_WRAP",
        decr: "DECR",
        decr_wrap: "DECR_WRAP",
        invert: "INVERT"
    };

    XEO.StencilBuf = XEO.Component.extend({

        type: "XEO.StencilBuf",

        _init: function (cfg) {

            this._state = new XEO.renderer.StencilBuf({
                active: null,
                clear: null,
                clearValue: null,
                frontFunc: null,
                frontRef: null,
                frontMask: null,
                frontSFail: null,
                frontDPPass: null,
                frontDPFail: null,
                backFunc: null,
                backRef: null,
                backMask: null,
                backSFail: null,
                backDPPass: null,
                backDPFail: null
            });

            this.active = cfg.active;
            this.clear = cfg.clear;
            this.clearValue = cfg.clearValue;
            this.frontFunc = cfg.frontFunc;
            this.frontRef = cfg.frontRef;
            this.frontMask = cfg.frontMask;
            this.frontSFail = cfg.frontSFail;
            this.frontDPPass = cfg.frontDPPass;
            this.frontDPFail = cfg.frontDPFail;
            this.backFunc = cfg.backFunc;
            this.backRef = cfg.backRef;
            this.backMask = cfg.backMask;
            this.backSFail = cfg.backSFail;
            this.backDPPass = cfg.backDPPass;
            this.backDPFail = cfg.backDPFail;
        },

        _props: {
            
            /**
             * Flag which indicates whether stencil testing is enabled for associated
             * {{#crossLink "Entity"}}Entities{{/crossLink}}.
             *
             * Fires an {{#crossLink "StencilBuf/active:event"}}{{/crossLink}} event on change.
             *
             * @property active
             * @default true
             * @type Boolean
             */
            active: {

                set: function (value) {

                    value = value !== false;

                    if (this._state.active === value) {
                        return;
                    }

                    this._state.active = value;
                    this._renderer.imageDirty = true;

                    /**
                     * Fired whenever this StencilBuf's {{#crossLink "StencilBuf/active:property"}}{{/crossLink}} property changes.
                     * @event active
                     * @param value The property's new value
                     */
                    this.fire("active", this._state.active);
                },

                get: function () {
                    return this._state.active;
                }
            },
            
            /**
             Whether to clear the stencil buffer for each frame render.

             Fires a {{#crossLink "StencilBuf/clear:event"}}{{/crossLink}} event on change.

             @property clear
             @default false
             @type Boolean
             */
            clear: {

                set: function (value) {

                    value = !!value;

                    if (value === this._state.clear) {
                        return;
                    }

                    this._state.clear = value;
                    this._renderer.imageDirty = true;

                    /**
                     Fired whenever this StencilBuf's {{#crossLink "StencilBuf/clear:property"}}{{/crossLink}} property changes.

                     @event clear
                     @param value {Boolean} The property's new value
                     */
                    this.fire("clear", this._state.clear);
                },

                get: function () {
                    return this._state.clear;
                }
            },

            /**
             The value that the stencil buffer is set to when cleared.

             Fires a {{#crossLink "StencilBuf/clearValue:event"}}{{/crossLink}} event on change.

             @property clearValue
             @default 0
             @type Number
             */
            clearValue: {

                set: function (value) {

                    value = value || 0;

                    if (value === this._state.clearValue) {
                        return;
                    }

                    this._state.clearValue = value;
                    this._renderer.imageDirty = true;

                    /**
                     Fired whenever this StencilBuf's {{#crossLink "StencilBuf/clearValue:property"}}{{/crossLink}} property changes.

                     @event clearValue
                     @param value {Number} The property's new value
                     */
                    this.fire("clearValue", this._state.clearValue);
                },

                get: function () {
                    return this._state.clearValue;
                }
            },

            /**
             Comparison function for the front face stencil.

             Supported values are 'keep', 'always', 'less', 'equal', 'lequal', 'greater', 'notequal' and 'gequal'.

             Fires a {{#crossLink "StencilBuf/frontFunc:event"}}{{/crossLink}} event on change.

             @property frontFunc
             @default "always"
             @type String
             */
            frontFunc: {

                set: function (value) {

                    value = value || "always";

                    if (value !== "keep" &&
                        value !== "always" &&
                        value !== "less" &&
                        value !== "equal" &&
                        value !== "lequal" &&
                        value !== "greater" &&
                        value !== "notequal" &&
                        value !== "gequal") {

                        this.error("Unsupported value for 'frontFunc': '" + value +
                            "' - defaulting to 'always' - supported values are 'keep', 'always', 'less', 'equal', 'lequal', 'greater', 'notequal' and 'gequal'.");

                        value = "always";
                    }

                    if (value === this._frontFunc) {
                        return;
                    }

                    this._frontFunc = value;
                    this._state.frontFunc = this.scene.canvas.gl[lookup[value]];
                    this._renderer.imageDirty = true;

                    /**
                     Fired whenever this StencilBuf's {{#crossLink "StencilBuf/frontFunc:property"}}{{/crossLink}} property changes.

                     @event frontFunc
                     @param value {String} The property's new value
                     */
                    this.fire("frontFunc", this._frontFunc);
                },

                get: function () {
                    return this._frontFunc;
                }
            },

            /**
             A value to compare the stencil value to using the front face comparison function selected
             by {{#crossLink "StencilBuf/frontFunc:property"}}{{/crossLink}}.

             Fires a {{#crossLink "StencilBuf/frontRef:event"}}{{/crossLink}} event on change.

             @property frontRef
             @default 0
             @type Number
             */
            frontRef: {

                set: function (value) {

                    value = value || 0;

                    if (value === this._state.frontRef) {
                        return;
                    }

                    this._state.frontRef = value;
                    this._renderer.imageDirty = true;

                    /**
                     Fired whenever this StencilBuf's {{#crossLink "StencilBuf/frontRef:property"}}{{/crossLink}} property changes.

                     @event frontRef
                     @param value {Number} The property's new value
                     */
                    this.fire("frontRef", this._state.frontRef);
                },

                get: function () {
                    return this._state.frontRef;
                }
            },

            /**
             Controls what bits are written to the front face stencil buffer.

             The default value is all ones, which means that the outcome of any operation is unaffected.

             Fires a {{#crossLink "StencilBuf/frontMask:event"}}{{/crossLink}} event on change.

             @property frontMask
             @default 0xff
             @type Number
             */
            frontMask: {

                set: function (value) {

                    value = value || 0xff;

                    if (value === this._state.frontMask) {
                        return;
                    }

                    this._state.frontMask = value;
                    this._renderer.imageDirty = true;

                    /**
                     Fired whenever this StencilBuf's {{#crossLink "StencilBuf/frontMask:property"}}{{/crossLink}} property changes.

                     @event frontMask
                     @param value {Number} The property's new value
                     */
                    this.fire("frontMask", this._state.frontMask);
                },

                get: function () {
                    return this._state.frontMask;
                }
            },

            /**
             Action to take if the front face stencil test fails.

             Supported values are 'keep', 'zero', 'replace', 'incr', 'incr_wrap', 'decr', 'decr_wrap' and 'invert'.

             Fires a {{#crossLink "StencilBuf/frontSFail:event"}}{{/crossLink}} event on change.

             @property frontSFail
             @default "keep"
             @type String
             */
            frontSFail: {

                set: function (value) {

                    value = value || "keep";

                    if (value !== "keep" &&
                        value !== "zero" &&
                        value !== "replace" &&
                        value !== "incr" &&
                        value !== "incr_wrap" &&
                        value !== "decr" &&
                        value !== "decr_wrap" &&
                        value !== "invert") {

                        this.error("Unsupported value for 'frontSFail': '" + value +
                            "' - defaulting to 'keep' - supported values are 'keep', 'zero', 'replace', 'incr', 'incr_wrap', 'decr', 'decr_wrap' and 'invert'.");

                        value = "keep";
                    }

                    if (value === this._frontSFail) {
                        return;
                    }

                    this._frontSFail = value;
                    this._state.frontSFail = this.scene.canvas.gl[lookup[value]];
                    this._renderer.imageDirty = true;

                    /**
                     Fired whenever this StencilBuf's {{#crossLink "StencilBuf/frontSFail:property"}}{{/crossLink}} property changes.

                     @event frontSFail
                     @param value {String} The property's new value
                     */
                    this.fire("frontSFail", this._frontSFail);
                },

                get: function () {
                    return this._frontSFail;
                }
            },

            /**
             Action to take if the front face stencil test passes.

             Supported values are 'keep', 'zero', 'replace', 'incr', 'incr_wrap', 'decr', 'decr_wrap' and 'invert'.

             Fires a {{#crossLink "StencilBuf/frontDPPass:event"}}{{/crossLink}} event on change.

             @property frontDPPass
             @default "keep"
             @type String
             */
            frontDPPass: {

                set: function (value) {

                    value = value || "keep";

                    if (value !== "keep" &&
                        value !== "zero" &&
                        value !== "replace" &&
                        value !== "incr" &&
                        value !== "incr_wrap" &&
                        value !== "decr" &&
                        value !== "decr_wrap" &&
                        value !== "invert") {

                        this.error("Unsupported value for 'frontDPPass': '" + value +
                            "' - supported values are 'keep', 'zero', 'replace', 'incr', 'incr_wrap', 'decr', 'decr_wrap' and 'invert'.");

                        value = "keep";
                    }

                    if (value === this._frontDPPass) {
                        return;
                    }

                    this._frontDPPass = value;
                    this._state.frontDPPass = this.scene.canvas.gl[lookup[value]];
                    this._renderer.imageDirty = true;

                    /**
                     Fired whenever this StencilBuf's {{#crossLink "StencilBuf/frontDPPass:property"}}{{/crossLink}} property changes.

                     @event frontDPPass
                     @param value {String} The property's new value
                     */
                    this.fire("frontDPPass", this._frontDPPass);
                },

                get: function () {
                    return this._frontDPPass;
                }
            },

            /**
             Action to take if the front face stencil passes, but the depth test fails.

             Ssupported values are 'keep', 'zero', 'replace', 'incr', 'incr_wrap', 'decr', 'decr_wrap' and 'invert'.

             Fires a {{#crossLink "StencilBuf/frontDPFail:event"}}{{/crossLink}} event on change.

             @property frontDPFail
             @default "keep"
             @type String
             */
            frontDPFail: {

                set: function (value) {

                    value = value || "keep";

                    if (value !== "keep" &&
                        value !== "zero" &&
                        value !== "replace" &&
                        value !== "incr" &&
                        value !== "incr_wrap" &&
                        value !== "decr" &&
                        value !== "decr_wrap" &&
                        value !== "invert") {

                        this.error("Unsupported value for 'frontDPFail': '" + value +
                            "' - defaulting to 'keep' - supported values are 'keep', 'zero', 'replace', 'incr', 'incr_wrap', 'decr', 'decr_wrap' and 'invert'.");

                        value = "keep";
                    }

                    if (value === this._frontDPFail) {
                        return;
                    }

                    this._frontDPFail = value;
                    this._state.frontDPFail = this.scene.canvas.gl[lookup[value]];
                    this._renderer.imageDirty = true;

                    /**
                     Fired whenever this StencilBuf's {{#crossLink "StencilBuf/frontDPFail:property"}}{{/crossLink}} property changes.

                     @event frontDPFail
                     @param value {String} The property's new value
                     */
                    this.fire("frontDPFail", this._frontDPFail);
                },

                get: function () {
                    return this._frontDPFail;
                }
            },

            /**

             Comparison function for the back face stencil.

             Supported values are 'keep', 'always', 'less', 'equal', 'lequal', 'greater', 'notequal' and 'gequal'.

             Fires a {{#crossLink "StencilBuf/backFunc:event"}}{{/crossLink}} event on change.

             @property backFunc
             @default "always"
             @type String
             */
            backFunc: {

                set: function (value) {

                    value = value || "always";

                    if (value !== "keep" &&
                        value !== "always" &&
                        value !== "less" &&
                        value !== "equal" &&
                        value !== "lequal" &&
                        value !== "greater" &&
                        value !== "notequal" &&
                        value !== "gequal") {

                        this.error("Unsupported value for 'backFunc': '" + value +
                            "' - defaulting to 'always' - supported values are 'keep', 'always', 'less', 'equal', 'lequal', 'greater', 'notequal' and 'gequal'.");

                        value = "always";
                    }

                    if (value === this._backFunc) {
                        return;
                    }

                    this._backFunc = value;
                    this._state.backFunc = this.scene.canvas.gl[lookup[value]];
                    this._renderer.imageDirty = true;

                    /**
                     Fired whenever this StencilBuf's {{#crossLink "StencilBuf/backFunc:property"}}{{/crossLink}} property changes.

                     @event backFunc
                     @param value {String} The property's new value
                     */
                    this.fire("backFunc", this._backFunc);
                },

                get: function () {
                    return this._backFunc;
                }
            },

            /**
             A value to compare the stencil value to using the back face comparison function indicated
             by {{#crossLink "StencilBuf/backFunc:property"}}{{/crossLink}}.

             Fires a {{#crossLink "StencilBuf/backRef:event"}}{{/crossLink}} event on change.

             @property backRef
             @default 0
             @type Number
             */
            backRef: {

                set: function (value) {

                    value = value || 0;

                    if (value === this._state.backRef) {
                        return;
                    }

                    this._state.backRef = value;
                    this._renderer.imageDirty = true;

                    /**
                     Fired whenever this StencilBuf's {{#crossLink "StencilBuf/backRef:property"}}{{/crossLink}} property changes.

                     @event backRef
                     @param value {Number} The property's new value
                     */
                    this.fire("backRef", this._state.backRef);
                },

                get: function () {
                    return this._state.backRef;
                }
            },

            /**
             Controls what bits are written to the back face stencil buffer.

             The default value is all ones, which means that the outcome of any operation is unaffected.

             Fires a {{#crossLink "StencilBuf/backMask:event"}}{{/crossLink}} event on change.

             @property backMask
             @default 0xff
             @type Number
             */
            backMask: {

                set: function (value) {

                    value = value || 0xff;

                    if (value === this._state.backMask) {
                        return;
                    }

                    this._state.backMask = value;
                    this._renderer.imageDirty = true;

                    /**
                     Fired whenever this StencilBuf's {{#crossLink "StencilBuf/backMask:property"}}{{/crossLink}} property changes.

                     @event backMask
                     @param value {Number} The property's new value
                     */
                    this.fire("backMask", this._state.backMask);
                },

                get: function () {
                    return this._state.backMask;
                }
            },

            /**
             Action to take if the back face stencil test fails.

             Supported values are 'keep', 'zero', 'replace', 'incr', 'incr_wrap', 'decr', 'decr_wrap' and 'invert'.

             Fires a {{#crossLink "StencilBuf/backSFail:event"}}{{/crossLink}} event on change.

             @property backSFail
             @default "keep"
             @type String
             */
            backSFail: {

                set: function (value) {

                    value = value || "keep";

                    if (value !== "keep" &&
                        value !== "zero" &&
                        value !== "replace" &&
                        value !== "incr" &&
                        value !== "incr_wrap" &&
                        value !== "decr" &&
                        value !== "decr_wrap" &&
                        value !== "invert") {

                        this.error("Unsupported value for 'backSFail': '" + value +
                            "' - defaulting to 'keep' - supported values are 'keep', 'zero', 'replace', 'incr', 'incr_wrap', 'decr', 'decr_wrap' and 'invert'.");

                        value = "keep";
                    }

                    if (value === this._backSFail) {
                        return;
                    }

                    this._backSFail = value;
                    this._state.backSFail = this.scene.canvas.gl[lookup[value]];
                    this._renderer.imageDirty = true;

                    /**
                     Fired whenever this StencilBuf's {{#crossLink "StencilBuf/backSFail:property"}}{{/crossLink}} property changes.

                     @event backSFail
                     @param value {String} The property's new value
                     */
                    this.fire("backSFail", this._backSFail);
                },

                get: function () {
                    return this._backSFail;
                }
            },

            /**
             Action to take if the back face stencil test passes.

             Supported values are 'keep', 'zero', 'replace', 'incr', 'incr_wrap', 'decr', 'decr_wrap' and 'invert'.

             Fires a {{#crossLink "StencilBuf/backDPPass:event"}}{{/crossLink}} event on change.

             @property backDPPass
             @default "keep"
             @type String
             */
            backDPPass: {

                set: function (value) {

                    value = value || "keep";

                    if (value !== "keep" &&
                        value !== "zero" &&
                        value !== "replace" &&
                        value !== "incr" &&
                        value !== "incr_wrap" &&
                        value !== "decr" &&
                        value !== "decr_wrap" &&
                        value !== "invert") {

                        this.error("Unsupported value for 'backDPPass': '" + value +
                            "' - defaulting to 'keep' - supported values are 'keep', 'zero', 'replace', 'incr', 'incr_wrap', 'decr', 'decr_wrap' and 'invert'.");

                        value = "keep";
                    }

                    if (value === this._backDPPass) {
                        return;
                    }

                    this._backDPPass = value;
                    this._state.backDPPass = this.scene.canvas.gl[lookup[value]];
                    this._renderer.imageDirty = true;

                    /**
                     Fired whenever this StencilBuf's {{#crossLink "StencilBuf/backDPPass:property"}}{{/crossLink}} property changes.

                     @event backDPPass
                     @param value {String} The property's new value
                     */
                    this.fire("backDPPass", this._backDPPass);
                },

                get: function () {
                    return this._backDPPass;
                }
            },

            /**
             Action to take if the back face stencil passes, but the depth test fails.

             Supported values are 'keep', 'zero', 'replace', 'incr', 'incr_wrap', 'decr', 'decr_wrap' and 'invert'.

             Fires a {{#crossLink "StencilBuf/backDPFail:event"}}{{/crossLink}} event on change.

             @property backDPFail
             @default "keep"
             @type String
             */
            backDPFail: {

                set: function (value) {

                    value = value || "keep";

                    if (value !== "keep" &&
                        value !== "zero" &&
                        value !== "replace" &&
                        value !== "incr" &&
                        value !== "incr_wrap" &&
                        value !== "decr" &&
                        value !== "decr_wrap" &&
                        value !== "invert") {

                        this.error("Unsupported value for 'backDPFail': '" + value +
                            "' - defaulting to 'keep' - supported values are 'keep', 'zero', 'replace', 'incr', 'incr_wrap', 'decr', 'decr_wrap' and 'invert'.");

                        value = "keep";
                    }

                    if (value === this._backDPFail) {
                        return;
                    }

                    this._backDPFail = value;
                    this._state.backDPFail = this.scene.canvas.gl[lookup[value]];
                    this._renderer.imageDirty = true;

                    /**
                     Fired whenever this StencilBuf's {{#crossLink "StencilBuf/backDPFail:property"}}{{/crossLink}} property changes.

                     @event backDPFail
                     @param value {String} The property's new value
                     */
                    this.fire("backDPFail", this._backDPFail);
                },

                get: function () {
                    return this._backDPFail;
                }
            }
        },

        _compile: function () {
            this._renderer.stencilBuf = this._state;
        },

        _getJSON: function () {
            return {
                active: this.active,
                clear: this.clear,
                clearValue: this.clearValue,
                frontFunc: this.frontFunc,
                frontRef: this.frontRef,
                frontMask: this.frontMask,
                frontSFail: this.frontSFail,
                frontDPPass: this.frontDPPass,
                frontDPFail: this.frontDPFail,
                backFunc: this.backFunc,
                backRef: this.backRef,
                backMask: this.backMask,
                backSFail: this.backSFail,
                backDPPass: this.backDPPass,
                backDPFail: this.backDPFail
            };
        },

        _destroy: function () {
            this._state.destroy();
        }
    });

})();
