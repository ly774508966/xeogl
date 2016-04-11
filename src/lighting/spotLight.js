/**

 A **SpotLight** defines a positional light source that originates from a single point and spreads outward in all directions, to illuminate
 attached {{#crossLink "Entity"}}Entities{{/crossLink}}.

 <ul>
 <li>SpotLights are grouped, along with other light source types, within {{#crossLink "Lights"}}Lights{{/crossLink}} components,
 which are attached to {{#crossLink "Entity"}}Entities{{/crossLink}}.</li>
 <li>SpotLights have a position, but no direction.</li>
 <li>SpotLights may be defined in either **World** or **View** coordinate space. When in World-space, their positions
 are relative to the World coordinate system, and will appear to move as the {{#crossLink "Camera"}}{{/crossLink}} moves.
 When in View-space, their positions are relative to the View coordinate system, and will behave as if fixed to the viewer's
 head as the {{#crossLink "Camera"}}{{/crossLink}} moves.</li>
 <li>SpotLights have {{#crossLink "SpotLight/constantAttenuation:property"}}{{/crossLink}}, {{#crossLink "SpotLight/linearAttenuation:property"}}{{/crossLink}} and
 {{#crossLink "SpotLight/quadraticAttenuation:property"}}{{/crossLink}} factors, which indicate how their intensity attenuates over distance.</li>
 <li>See <a href="Shader.html#inputs">Shader Inputs</a> for the variables that SpotLights create within xeoEngine's shaders.</li>
 </ul>

 <img src="../../../assets/images/SpotLight.png"></img>

 ## Examples

 <ul>
 <li>[View-space point light](../../examples/#lights_point_view)</li>
 <li>[World-space point light](../../examples/#lights_point_world)</li>
 </ul>

 ## Usage

 ```` javascript
 var entity = new XEO.Entity(scene, {

        lights: new XEO.Lights({
            lights: [
                new XEO.SpotLight({
                    pos: [0, 100, 100],
                    color: [0.5, 0.7, 0.5],
                    intensity: 1
                    constantAttenuation: 0,
                    linearAttenuation: 0,
                    quadraticAttenuation: 0,
                    space: "view"
                })
            ]
        }),
 ,
        material: new XEO.PhongMaterial({
            diffuse: [0.5, 0.5, 0.0]
        }),

        geometry: new XEO.BoxGeometry()
  });
 ````

 @class SpotLight
 @module XEO
 @submodule lighting
 @constructor
 @extends Component
 @param [scene] {Scene} Parent {{#crossLink "Scene"}}Scene{{/crossLink}}, creates this SpotLight within the
 default {{#crossLink "Scene"}}Scene{{/crossLink}} when omitted
 @param [cfg] {*} The SpotLight configuration
 @param [cfg.id] {String} Optional ID, unique among all components in the parent {{#crossLink "Scene"}}Scene{{/crossLink}}, generated automatically when omitted.
 @param [cfg.meta] {String:Object} Optional map of user-defined metadata to attach to this SpotLight.
 @param [cfg.pos=[ 0.0, 1.0, 0.0 ]] {Array(Number)} Position, in either World or View space, depending on the value of the **space** parameter.
 @param [cfg.dir=[0.0, -1.0, 0.0]] {Array(Number)} A unit vector indicating the direction that the light is shining,
 @param [cfg.color=[0.7, 0.7, 0.8 ]] {Array(Number)} Color of this SpotLight.
 @param [cfg.intensity=1.0] {Number} Intensity of this SpotLight.
 @param [cfg.constantAttenuation=0] {Number} Constant attenuation factor.
 @param [cfg.linearAttenuation=0] {Number} Linear attenuation factor.
 @param [cfg.quadraticAttenuation=0] {Number} Quadratic attenuation factor.
 @param [cfg.space="view"] {String} The coordinate system this SpotLight is defined in - "view" or "world".
 */
(function () {

    "use strict";

    XEO.SpotLight = XEO.Component.extend({

        type: "XEO.SpotLight",

        _init: function (cfg) {

            this._state = {
                type: "spot",
                pos: [0.0, 1.0, 0.0],
                dir: [0, -1, 0],
                color: [0.7, 0.7, 0.8],
                intensity: 1.0,
                innerCone: 0.25,
                outerCone: 0,

                // Packaging constant, linear and quadratic attenuation terms
                // into an array for easy insertion into shaders as a vec3
                attenuation: [0.0, 0.0, 0.0],
                space: "view"
            };

            this.pos = cfg.pos;
            this.dir = cfg.dir;
            this.color = cfg.color;
            this.innerCone = cfg.innerCone;
            this.outerCone = cfg.outerCone;
            this.intensity = cfg.intensity;
            this.constantAttenuation = cfg.constantAttenuation;
            this.linearAttenuation = cfg.linearAttenuation;
            this.quadraticAttenuation = cfg.quadraticAttenuation;
            this.space = cfg.space;
        },

        _props: {

            /**
             The position of this SpotLight.

             This will be either World- or View-space, depending on the value of {{#crossLink "SpotLight/space:property"}}{{/crossLink}}.

             Fires a {{#crossLink "SpotLight/pos:event"}}{{/crossLink}} event on change.

             @property pos
             @default [0.0, 1.0, 0.0]
             @type Array(Number)
             */
            pos: {

                set: function (value) {

                    value = value || [0.0, 1.0, 0.0];

                    var pos = this._state.pos;

                    pos[0] = value[0];
                    pos[1] = value[1];
                    pos[2] = value[2];

                    this._renderer.imageDirty = true;

                    /**
                     Fired whenever this SpotLight's  {{#crossLink "SpotLight/pos:property"}}{{/crossLink}} property changes.
                     @event pos
                     @param value The property's new value
                     */
                    this.fire("pos", this._state.pos);
                },

                get: function () {
                    return this._state.pos;
                }
            },

            /**
             The direction in which the light is shining.

             Fires a {{#crossLink "SpotLight/dir:event"}}{{/crossLink}} event on change.

             @property dir
             @default [0.0, -1.0, 1.0]
             @type Array(Number)
             */
            dir: {

                set: function (value) {

                    value = value || [0.0, -1.0, 0.0];

                    var dir = this._state.dir;

                    dir[0] = value[0];
                    dir[1] = value[1];
                    dir[2] = value[2];

                    this._renderer.imageDirty = true;

                    /**
                     * Fired whenever this SpotLight's  {{#crossLink "SpotLight/dir:property"}}{{/crossLink}} property changes.
                     * @event dir
                     * @param value The property's new value
                     */
                    this.fire("dir", dir);
                },

                get: function () {
                    return this._state.dir;
                }
            },

            /**
             The color of this SpotLight.

             Fires a {{#crossLink "SpotLight/color:event"}}{{/crossLink}} event on change.

             @property color
             @default [0.7, 0.7, 0.8]
             @type Array(Number)
             */
            color: {

                set: function (value) {

                    this._state.color = value || [0.7, 0.7, 0.8];

                    this._renderer.imageDirty = true;

                    /**
                     Fired whenever this SpotLight's  {{#crossLink "SpotLight/color:property"}}{{/crossLink}} property changes.
                     @event color
                     @param value The property's new value
                     */
                    this.fire("color", this._state.color);
                },

                get: function () {
                    return this._state.color;
                }
            },

            /**
             The innerCone of this SpotLight.

             Fires a {{#crossLink "SpotLight/innerCone:event"}}{{/crossLink}} event on change.

             @property innerCone
             @default 0.25
             @type Number
             */
            innerCone: {

                set: function (value) {

                    value = value !== undefined ? value : 0.25;

                    this._state.innerCone = value;

                    this._renderer.imageDirty = true;

                    /**
                     * Fired whenever this SpotLight's  {{#crossLink "SpotLight/innerCone:property"}}{{/crossLink}} property changes.
                     * @event innerCone
                     * @param value The property's new value
                     */
                    this.fire("innerCone", this._state.innerCone);
                },

                get: function () {
                    return this._state.innerCone;
                }
            },

            /**
             The outerCone of this SpotLight.

             Fires a {{#crossLink "SpotLight/outerCone:event"}}{{/crossLink}} event on change.

             @property outerCone
             @default 0
             @type Number
             */
            outerCone: {

                set: function (value) {

                    value = value !== undefined ? value : 0;

                    this._state.outerCone = value;

                    this._renderer.imageDirty = true;

                    /**
                     * Fired whenever this SpotLight's  {{#crossLink "SpotLight/outerCone:property"}}{{/crossLink}} property changes.
                     * @event outerCone
                     * @param value The property's new value
                     */
                    this.fire("outerCone", this._state.outerCone);
                },

                get: function () {
                    return this._state.outerCone;
                }
            },

            /**
             The intensity of this SpotLight.

             Fires a {{#crossLink "SpotLight/intensity:event"}}{{/crossLink}} event on change.

             @property intensity
             @default 1.0
             @type Number
             */
            intensity: {

                set: function (value) {

                    value = value !== undefined ? value : 1.0;

                    this._state.intensity = value;

                    this._renderer.imageDirty = true;

                    /**
                     * Fired whenever this SpotLight's  {{#crossLink "SpotLight/intensity:property"}}{{/crossLink}} property changes.
                     * @event intensity
                     * @param value The property's new value
                     */
                    this.fire("intensity", this._state.intensity);
                },

                get: function () {
                    return this._state.intensity;
                }
            },

            /**
             The constant attenuation factor for this SpotLight.

             Fires a {{#crossLink "SpotLight/constantAttenuation:event"}}{{/crossLink}} event on change.

             @property constantAttenuation
             @default 0
             @type Number
             */
            constantAttenuation: {

                set: function (value) {

                    this._state.attenuation[0] = value || 0.0;

                    this._renderer.imageDirty = true;

                    /**
                     Fired whenever this SpotLight's {{#crossLink "SpotLight/constantAttenuation:property"}}{{/crossLink}} property changes.

                     @event constantAttenuation
                     @param value The property's new value
                     */
                    this.fire("constantAttenuation", this._state.attenuation[0]);
                },

                get: function () {
                    return this._state.attenuation[0];
                }
            },

            /**
             The linear attenuation factor for this SpotLight.

             Fires a {{#crossLink "SpotLight/linearAttenuation:event"}}{{/crossLink}} event on change.

             @property linearAttenuation
             @default 0
             @type Number
             */
            linearAttenuation: {

                set: function (value) {

                    this._state.attenuation[1] = value || 0.0;

                    this._renderer.imageDirty = true;

                    /**
                     Fired whenever this SpotLight's  {{#crossLink "SpotLight/linearAttenuation:property"}}{{/crossLink}} property changes.

                     @event linearAttenuation
                     @param value The property's new value
                     */
                    this.fire("linearAttenuation", this._state.attenuation[1]);
                },

                get: function () {
                    return this._state.attenuation[1];
                }
            },

            /**
             The quadratic attenuation factor for this SpotLight.

             Fires a {{#crossLink "SpotLight/quadraticAttenuation:event"}}{{/crossLink}} event on change.

             @property quadraticAttenuation
             @default 0
             @type Number
             */
            quadraticAttenuation: {

                set: function (value) {

                    this._state.attenuation[2] = value || 0.0;

                    this._renderer.imageDirty = true;

                    /**
                     Fired whenever this SpotLight's {{#crossLink "SpotLight/quadraticAttenuation:property"}}{{/crossLink}} property changes.

                     @event quadraticAttenuation
                     @param value The property's new value
                     */
                    this.fire("quadraticAttenuation", this._state.attenuation[2]);
                },

                get: function () {
                    return this._state.attenuation[2];
                }
            },

            /**
             Indicates which coordinate space this SpotLight is in.

             Supported values are:

             <ul>
             <li>"view" - View space, aligned within the view volume as if fixed to the viewer's head</li>
             <li>"world" - World space, fixed within the world, moving within the view volume with respect to camera</li>
             </ul>

             Fires a {{#crossLink "SpotLight/space:event"}}{{/crossLink}} event on change.

             @property space
             @default "view"
             @type String
             */
            space: {

                set: function (value) {

                    this._state.space = value || "view";

                    this.fire("dirty", true); // Need to rebuild shader

                    /**
                     Fired whenever this SpotLight's  {{#crossLink "SpotLight/space:property"}}{{/crossLink}} property changes.

                     @event space
                     @param value The property's new value
                     */
                    this.fire("space", this._state.space);
                },

                get: function () {
                    return this._state.space;
                }
            }
        },

        _getJSON: function () {
            return {
                type: this._state.type,
                pos: this._state.pos,
                dir: this._state.dir,
                color: this._state.color,
                innerCone: this._state.innerCone,
                outerCone: this._state.outerCone,
                intensity: this._state.intensity,
                constantAttenuation: this._state.attenuation[0],
                linearAttenuation: this._state.attenuation[1],
                quadraticAttenuation: this._state.attenuation[2],
                space: this._state.space
            };
        }
    });

})();
