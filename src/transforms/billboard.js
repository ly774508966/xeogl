/**
 A **Billboard** causes associated {{#crossLink "Entity"}}Entities{{/crossLink}} to be always oriented towards the Camera.

 <ul>
 <li>**Spherical** billboards are free to rotate their {{#crossLink "Entity"}}Entities{{/crossLink}} in any direction and always face the {{#crossLink "Camera"}}{{/crossLink}} perfectly.</li>
 <li>**Cylindrical** billboards rotate their {{#crossLink "Entity"}}Entities{{/crossLink}} towards the {{#crossLink "Camera"}}{{/crossLink}}, but only around the Y-axis.</li>
 <li>A Billboard will cause {{#crossLink "Scale"}}{{/crossLink}} transformations to have no effect on its {{#crossLink "Entity"}}Entities{{/crossLink}}</li>
 </ul>
<br>
 <img src="../../../assets/images/Billboard.png"></img>

 ### Example

 ```` javascript
 var geometry = new XEO.Geometry({
        primitive: "triangles",
        positions: [3, 3, 0, -3, 3, 0, -3, -3, 0, 3, -3, 0],
        normals: [-1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0],
        uv: [1, 1, 0, 1, 0, 0, 1, 0],
        indices: [2, 1, 0, 3, 2, 0] // Ensure these will be front-faces
    });

 var material = new XEO.PhongMaterial({
        emissiveMap: new XEO.Texture({
            src: "textures/diffuse/teapot.jpg"
        })
    });

 var billboard = new XEO.Billboard({
        spherical: true
    });

 for (var i = 0; i < 1000; i++) {

        new XEO.Entity({
            geometry: geometry,
            material: material,
            billboard: billboard,
            transform: new XEO.Translate({
                xyz: [Math.random() * 100 - 50, Math.random() * 100 - 50, Math.random() * 100 - 50]
            })
        });
  }

 var scene = XEO.scene;

 // Move the camera back a bit

 scene.camera.view.zoom(120);

 // Orbit the eye position about the look position.

 scene.on("tick",
     function () {

          var view = scene.camera.view;

          view.rotateEyeY(0.2);
          view.rotateEyeX(0.1);
     });
 ````

 @class Billboard
 @module XEO
 @submodule transforms
 @constructor
 @param [scene] {Scene} Parent {{#crossLink "Scene"}}Scene{{/crossLink}} - creates this Billboard in the default
 {{#crossLink "Scene"}}Scene{{/crossLink}} when omitted.
 @param [cfg] {*} Configs
 @param [cfg.id] {String} Optional ID, unique among all components in the parent scene, generated automatically when omitted.
 @param [cfg.meta] {String:Object} Optional map of user-defined metadata to attach to this Billboard.
 @param [cfg.active=true] {Boolean} Indicates if this Billboard is active or not.
 @param [cfg.spherical=true] {Boolean} Indicates if this Billboard is spherical (true) or cylindrical (false).
 @extends Component
 */
(function () {

    "use strict";

    XEO.Billboard = XEO.Component.extend({

        type: "XEO.Billboard",

        _init: function (cfg) {

            this._super(cfg);

            this._state = new XEO.renderer.Billboard({
                active: true,
                spherical: true,
                hash: "a;s;"
            });

            this.active = cfg.active !== false;
            this.spherical = cfg.spherical !== false;
        },

        _props: {

            /**
             * Flag which indicates whether this Billboard is active or not.
             *
             * Fires an {{#crossLink "Billboard/active:event"}}{{/crossLink}} event on change.
             *
             * @property active
             * @type Boolean
             */
            active: {

                set: function (value) {

                    value = !!value;

                    if (this._state.active === value) {
                        return;
                    }

                    this._state.active = value;

                    this._state.hash = (this._state.active ? "a;" : ";") + (this._state.spherical ? "s;" : ";");

                    this.fire("dirty", true);

                    /**
                     * Fired whenever this Billboard's {{#crossLink "Billboard/active:property"}}{{/crossLink}} property changes.
                     * @event active
                     * @param value The property's new value
                     */
                    this.fire('active', this._state.active);
                },

                get: function () {
                    return this._state.active;
                }
            },

            /**
             * Flag which indicates whether this Billboard is spherical (true) or cylindrical (false).
             *
             * Fires an {{#crossLink "Billboard/spherical:event"}}{{/crossLink}} event on change.
             *
             * @property spherical
             * @type Boolean
             */
            spherical: {

                set: function (value) {

                    value = !!value;

                    if (this._state.spherical === value) {
                        return;
                    }

                    this._state.spherical = value;

                    this._state.hash = (this._state.active ? "a;" : ";") + (this._state.spherical ? "s;" : ";");

                    this.fire("dirty", true);

                    /**
                     * Fired whenever this Billboard's {{#crossLink "Billboard/spherical:property"}}{{/crossLink}} property changes.
                     * @event spherical
                     * @param value The property's new value
                     */
                    this.fire('spherical', this._state.spherical);
                },

                get: function () {
                    return this._state.spherical;
                }
            }
        },

        _compile: function () {
            this._renderer.billboard = this._state;
        },


        _getJSON: function () {
            return {
                active: this._state.active
            };
        }
    });

})();
