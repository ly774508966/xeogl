(function () {

    "use strict";

    var glTFLoader = xeogl.GLTFLoader;

    /**
     A **Model** loads content from a <a href="https://github.com/KhronosGroup/glTF" target = "_other">glTF</a> file into its parent {{#crossLink "Scene"}}{{/crossLink}}.

     <ul><li>A Model begins loading as soon as it's {{#crossLink "Model/src:property"}}{{/crossLink}}
     property is set to the location of a valid glTF file.</li>
     <li>A Model keeps all its loaded components in a {{#crossLink "Collection"}}{{/crossLink}}.</li>
     <li>A Model can be attached to an animated and dynamically-editable
     modelling {{#crossLink "Transform"}}{{/crossLink}} hierarchy, to rotate, translate and scale it within the World-space coordinate system, in the
     same way that an {{#crossLink "Entity"}}{{/crossLink}} can.</li>
     <li>You can set a Model's {{#crossLink "Model/src:property"}}{{/crossLink}} property to a new file path at any time,
     which will cause it to load components from the new file (destroying any components loaded previously).</li>
     </ul>

     <img src="../../../assets/images/Model.png"></img>

     ## Examples

     <ul>
     <li>[Gearbox](../../examples/#importing_gltf_gearbox)</li>
     <li>[Buggy](../../examples/#importing_gltf_buggy)</li>
     <li>[Reciprocating Saw](../../examples/#importing_gltf_ReciprocatingSaw)</li>
     <li>[Textured Duck](../../examples/#importing_gltf_duck)</li>
     <li>[Model with entity explorer UI](../../examples/#demos_ui_explorer)</li>
     <li>[Fly camera to model entities](../../examples/#boundaries_flyToBoundary)</li>
     <li>[Ensuring individual materials on Model entities](../../examples/#importing_gltf_techniques_uniqueMaterials)</li>
     <li>[Baking transform hierarchies](../../examples/#importing_gltf_techniques_bakeTransforms)</li>
     <li>[Attaching transforms to Models, via constructor](../../examples/#importing_gltf_techniques_configTransform)</li>
     <li>[Attaching transforms to Models, via property](../../examples/#importing_gltf_techniques_attachTransform)</li>
     </ul>

     ## Tutorials

     Find API documentation for Model here:

     <ul>
     <li>[Importing glTF](https://github.com/xeolabs/xeogl/wiki/Importing-glTF)</li>
     </ul>

     @class Model
     @module xeogl
     @submodule importing
     @extends Component
     */
    xeogl.Model = xeogl.Component.extend({

        type: "xeogl.Model",

        _init: function (cfg) {

            this._super(cfg);

            // The xeogl.Collection that will hold all the components
            // we create from the glTF model; this will be available
            // as a public, immutable #collection property

            this._collection = this.create(xeogl.Collection);

            // Dummy transform to make it easy to graft user-supplied
            // transforms above loaded entities

            this._dummyRootTransform = this.create(xeogl.Transform, {
                meta: "dummy"
            });

            this._src = null;

            if (!cfg.src) {
                this.error("Config missing: 'src'");
                return;
            }

            if (!xeogl._isString(cfg.src)) {
                this.error("Value for config 'src' should be a string");
                return;
            }

            this.src = cfg.src;
            this.transform = cfg.transform;
        },

        _props: {

            /**
             Path to the glTF file.

             You can set this to a new file path at any time, which will cause the Model to load components from
             the new file (after first destroying any components loaded from a previous file path).

             Fires a {{#crossLink "Model/src:event"}}{{/crossLink}} event on change.

             @property src
             @type String
             */
            src: {

                set: function (value) {

                    if (!value) {
                        return;
                    }

                    if (!xeogl._isString(value)) {
                        this.error("Value for 'src' should be a string");
                        return;
                    }

                    if (value === this._src) { // Already loaded this model

                        /**
                         Fired whenever this Model has finished loading components from the glTF file
                         specified by {{#crossLink "Model/src:property"}}{{/crossLink}}.
                         @event loaded
                         */
                        this.fire("loaded");

                        return;
                    }

                    this._clear();

                    this._src = value;

                    glTFLoader.setCollection(this._collection);
                    glTFLoader.initWithPath(this.id, this._src);

                    var self = this;
                    var userInfo = null;
                    var options = null;
                    var rootTransform;
                    var dummyRootTransform = self._dummyRootTransform;

                    // Increment processes represented by loading spinner
                    // Spinner appears as soon as count is non-zero

                    var spinner = self.scene.canvas.spinner;
                    spinner.processes++;

                    glTFLoader.load(userInfo, options,
                        function () {

                            self._collection.iterate(function (component) {

                                if (component.isType("xeogl.Entity")) {

                                    // Insert the dummy transform above
                                    // each entity we just loaded

                                    rootTransform = component.transform;

                                    if (!rootTransform) {

                                        component.transform = dummyRootTransform;

                                    } else {

                                        while (rootTransform.parent) {

                                            if (rootTransform.id === dummyRootTransform.id) {

                                                // Since transform hierarchies created by the glTFLoader may contain
                                                // transforms that share the same parents, there is potential to find
                                                // our dummy root transform while walking up an entity's transform
                                                // path, when that path is joins a path that belongs to an Entity that
                                                // we processed earlier

                                                return;
                                            }

                                            rootTransform = rootTransform.parent;
                                        }

                                        if (rootTransform.id === dummyRootTransform.id) {
                                            return;
                                        }

                                        rootTransform.parent = dummyRootTransform;
                                    }
                                }
                            });

                            // Decrement processes represented by loading spinner
                            // Spinner disappears if the count is now zero
                            spinner.processes--;

                            /**
                             Fired whenever this Model has finished loading components from the glTF file
                             specified by {{#crossLink "Model/src:property"}}{{/crossLink}}.
                             @event loaded
                             */
                            self.fire("loaded");
                        });

                    /**
                     Fired whenever this Model's {{#crossLink "Model/src:property"}}{{/crossLink}} property changes.
                     @event src
                     @param value The property's new value
                     */
                    this.fire("src", this._src);
                },

                get: function () {
                    return this._src;
                }
            },

            /**
             * A {{#crossLink "Collection"}}{{/crossLink}} containing the scene components loaded by this Model.
             *
             * Whenever {{#crossLink "Model/src:property"}}{{/crossLink}} is set to the location of a valid glTF file,
             * and once the file has been loaded, this {{#crossLink "Collection"}}{{/crossLink}} will contain whatever
             * components were loaded from that file.
             *
             * Note that prior to loading the file, the Model will destroy any components in the {{#crossLink "Collection"}}{{/crossLink}}.
             *
             * @property collection
             * @type Collection
             * @final
             */
            collection: {

                get: function () {
                    return this._collection;
                }
            },

            /**
             * The Local-to-World-space (modelling) {{#crossLink "Transform"}}{{/crossLink}} attached to this Model.
             *
             * Must be within the same {{#crossLink "Scene"}}{{/crossLink}} as this Model.
             *
             * Internally, the given {{#crossLink "Transform"}}{{/crossLink}} will be inserted above each top-most
             * {{#crossLink "Transform"}}Transform{{/crossLink}} that the Model attaches to
             * its {{#crossLink "Entity"}}Entities{{/crossLink}}.
             *
             * Fires an {{#crossLink "Model/transform:event"}}{{/crossLink}} event on change.
             *
             * @property transform
             * @type Transform
             */
            transform: {

                set: function (value) {

                    /**
                     * Fired whenever this Model's {{#crossLink "Model/transform:property"}}{{/crossLink}} property changes.
                     *
                     * @event transform
                     * @param value The property's new value
                     */
                    this._attach({
                        name: "transform",
                        type: "xeogl.Transform",
                        component: value,
                        sceneDefault: false,
                        onAttached: {
                            callback: this._transformUpdated,
                            scope: this
                        }
                    });
                },

                get: function () {
                    return this._attached.transform;
                }
            }
        },

        _transformUpdated: function (transform) {
            this._dummyRootTransform.parent = transform;
        },

        _clear: function () {

            var c = [];

            this._collection.iterate(
                function (component) {
                    c.push(component);
                });

            while (c.length) {
                c.pop().destroy();
            }
        },

        _getJSON: function () {

            var json = {
                src: this._src
            };

            if (this._attached.transform) {
                json.transform = this._attached.transform.id;
            }

            return json;
        },

        _destroy: function () {
            this._clear();
        }
    });


})();