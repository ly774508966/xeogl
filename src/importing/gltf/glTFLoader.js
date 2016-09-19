/**
 * Private xeoEngine glTF loader core.
 *
 * Adapted from the THREE loader by Tony Parisi (http://www.tonyparisi.com)
 * https://github.com/KhronosGroup/glTF/blob/master/loaders/threejs/glTFLoaderUtils.js
 */
(function () {

    "use strict";

    function log(type, entryId, description) {
        console.log(type + ": " + entryId + ": " + JSON.stringify(description, null, 4));
    }

    // Resource management

    var ResourceEntry = function (entryID, object, description) {
        this.entryID = entryID;
        this.object = object;
        this.description = description;
    };

    var Resources = function () {
        this._entries = {};
    };

    Resources.prototype.setEntry = function (entryID, object, description) {
        if (!entryID) {
            console.error("No EntryID provided, cannot store", description);
            return;
        }

        if (this._entries[entryID]) {
            console.warn("entry[" + entryID + "] is being overwritten");
        }

        this._entries[entryID] = new ResourceEntry(entryID, object, description);
    };

    Resources.prototype.getEntry = function (entryID) {
        return this._entries[entryID];
    };

    Resources.prototype.clearEntries = function () {
        this._entries = {};
    };

    // Delegate for processing index buffers
    var IndicesDelegate = function () {
    };

    IndicesDelegate.prototype.handleError = function (errorCode, info) {
        // FIXME: report error
        console.log("ERROR(IndicesDelegate):" + errorCode + ":" + info);
    };

    IndicesDelegate.prototype.convert = function (resource, ctx) {
        return new Uint16Array(resource, 0, ctx.indices.count);
    };

    IndicesDelegate.prototype.resourceAvailable = function (glResource, ctx) {
        var geometry = ctx.geometry;
        geometry.indices = glResource;
        //geometry.checkFinished();
        return true;
    };

    function componentsPerElementForGLType(type) {

        var nElements = 0;

        switch (type) {
            case "SCALAR" :
                nElements = 1;
                break;
            case "VEC2" :
                nElements = 2;
                break;
            case "VEC3" :
                nElements = 3;
                break;
            case "VEC4" :
                nElements = 4;
                break;
            case "MAT2" :
                nElements = 4;
                break;
            case "MAT3" :
                nElements = 9;
                break;
            case "MAT4" :
                nElements = 16;
                break;
            default :
                debugger;
                break;
        }

        return nElements;
    }

    var indicesDelegate = new IndicesDelegate();

    var IndicesContext = function (indices, geometry) {
        this.indices = indices;
        this.geometry = geometry;
    };

    // Delegate for processing vertex attribute buffers
    var VertexAttributeDelegate = function () {
    };

    VertexAttributeDelegate.prototype.handleError = function (errorCode, info) {
        // FIXME: report error
        console.log("ERROR(VertexAttributeDelegate):" + errorCode + ":" + info);
    };

    VertexAttributeDelegate.prototype.convert = function (resource, ctx) {
        return resource;
    };

    VertexAttributeDelegate.prototype.resourceAvailable = function (glResource, ctx) {

        var geometry = ctx.geometry;
        var attribute = ctx.attribute;
        var semantic = ctx.semantic;

        //FIXME: Float32 is assumed here, but should be checked.

        if (semantic === "POSITION") {
            geometry.positions = new Float32Array(glResource, 0, attribute.count * componentsPerElementForGLType(attribute.type));

        } else if (semantic === "NORMAL") {
            geometry.normals = new Float32Array(glResource, 0, attribute.count * componentsPerElementForGLType(attribute.type));

        } else if ((semantic === "TEXCOORD_0") || (semantic === "TEXCOORD" )) {
            geometry.uv = new Float32Array(glResource, 0, attribute.count * componentsPerElementForGLType(attribute.type));
        }

        geometry.loadedAttributes++;

        //geometry.checkFinished();

        return true;
    };

    var vertexAttributeDelegate = new VertexAttributeDelegate();

    var VertexAttributeContext = function (attribute, semantic, geometry) {
        this.attribute = attribute;
        this.semantic = semantic;
        this.geometry = geometry;
    };


    XEO.GLTFLoader = Object.create(XEO.glTFParser, {

        setCollection: {
            value: function (collection) {
                this.collection = collection;
            }
        },

        load: {
            enumerable: true,
            value: function (userInfo, options, ok) {

                if (!this.collection) {
                    throw "collection not set";
                }

                this.resources = new Resources();

                XEO.glTFParser.handleLoadCompleted = ok;
                XEO.glTFParser.load.call(this, userInfo, options);
            }
        },

        _makeID: {
            value: function (entryID) {
                // https://github.com/KhronosGroup/glTF/blob/master/specification/README.md#ids-and-names
                return this._idPrefix + "#" + entryID;
            }
        },

        handleBuffer: {
            value: function (entryID, description, userInfo) {
                this.resources.setEntry(entryID, null, description);
                description.type = "ArrayBuffer";
                return true;
            }
        },

        handleBufferView: {
            value: function (entryID, description, userInfo) {
                this.resources.setEntry(entryID, null, description);

                var buffer = this.resources.getEntry(description.buffer);
                description.type = "ArrayBufferView";

                var bufferViewEntry = this.resources.getEntry(entryID);
                bufferViewEntry.buffer = buffer;
                return true;
            }
        },

        handleAccessor: {
            value: function (entryID, description, userInfo) {
                this.resources.setEntry(entryID, description, description);
                return true;
            }
        },

        handleTexture: {
            value: function (entryID, description, userInfo) {

                if (!description.source) {
                    return;
                }

                var image = this._json.images[description.source];

                var texture = new XEO.Texture(this.collection.scene, {
                    id: this._makeID(entryID),
                    src: image.uri,
                    flipY: true
                });

                this.collection.add(texture);

                this.resources.setEntry(entryID, texture, description);

                return true;
            }
        },

        handleMaterial: {
            value: function (entryID, description, userInfo) {

                //   log("material", entryID, description);

                var values = description.values || {};

                var diffuseVal = values.diffuse;
                var specularVal = values.specular;
                var shininessVal = values.shininess;
                var emissiveVal = values.emission;

                var cfg = {
                    id: this._makeID(entryID),
                    meta: {
                        userInfo: userInfo
                    },
                    shininess: shininessVal
                };

                var entry;

                if (diffuseVal) {
                    if (XEO._isString(diffuseVal)) {
                        entry = this.resources.getEntry(diffuseVal);
                        if (entry) {
                            cfg.diffuseMap = entry.object;
                        }
                    } else {
                        cfg.diffuse = diffuseVal.slice(0, 3);
                    }
                }

                if (specularVal) {
                    if (XEO._isString(specularVal)) {
                        entry = this.resources.getEntry(specularVal);
                        if (entry) {
                            cfg.specularMap = entry.object;
                        }
                    } else {
                        cfg.specular = specularVal.slice(0, 3);
                    }
                }

                if (emissiveVal) {
                    if (XEO._isString(emissiveVal)) {
                        entry = this.resources.getEntry(emissiveVal);
                        if (entry) {
                            cfg.emissiveMap = entry.object;
                        }
                    } else {
                        cfg.emissive = emissiveVal.slice(0, 3);
                    }
                }

                var material = new XEO.PhongMaterial(this.collection.scene, cfg);

                this.collection.add(material);

                this.resources.setEntry(entryID, material, description);

                return true;
            }
        },

        handleLight: {
            value: function (entryID, description, userInfo) {
                log("light", entryID, description);
                return true;
            }
        },

        handleMesh: {
            value: function (entryID, description, userInfo) {

                var mesh = [];

                this.resources.setEntry(entryID, mesh, description);

                var primitivesDescription = description.primitives;

                if (!primitivesDescription) {
                    //FIXME: not implemented in delegate
                    log("MISSING_PRIMITIVES for mesh:" + entryID);
                    return false;
                }

                for (var i = 0; i < primitivesDescription.length; i++) {
                    var primitiveDescription = primitivesDescription[i];

                    if (primitiveDescription.mode === WebGLRenderingContext.TRIANGLES) {

                        var geometry = new XEO.Geometry(this.collection.scene, {
                            id: this._makeID(entryID)
                        });

                        this.collection.add(geometry);

                        var materialEntry = this.resources.getEntry(primitiveDescription.material);
                        var material = materialEntry.object;

                        mesh.push({
                            geometry: geometry,
                            material: material
                        });

                        var allAttributes = Object.keys(primitiveDescription.attributes);

                        // count them first, async issues otherwise
                        geometry.totalAttributes += allAttributes.length;

                        var indices = this.resources.getEntry(primitiveDescription.indices);
                        var bufferEntry = this.resources.getEntry(indices.description.bufferView);
                        var indicesObject = {
                            bufferView: bufferEntry,
                            byteOffset: indices.description.byteOffset,
                            count: indices.description.count,
                            id: indices.entryID,
                            componentType: indices.description.componentType,
                            type: indices.description.type
                        };

                        var indicesContext = new IndicesContext(indicesObject, geometry);
                        var alreadyProcessedIndices = XEO.GLTFLoaderUtils.getBuffer(indicesObject, indicesDelegate, indicesContext);

                        // Load Vertex Attributes
                        allAttributes.forEach(function (semantic) {

                            var attribute;
                            var attributeID = primitiveDescription.attributes[semantic];
                            var attributeEntry = this.resources.getEntry(attributeID);
                            var bufferEntry;

                            if (!attributeEntry) {

                                //let's just use an anonymous object for the attribute
                                attribute = description.attributes[attributeID];
                                attribute.id = attributeID;
                                this.resources.setEntry(attributeID, attribute, attribute);

                                bufferEntry = this.resources.getEntry(attribute.bufferView);
                                attributeEntry = this.resources.getEntry(attributeID);

                            } else {
                                attribute = attributeEntry.object;
                                attribute.id = attributeID;
                                bufferEntry = this.resources.getEntry(attribute.bufferView);
                            }

                            var attributeObject = {
                                bufferView: bufferEntry,
                                byteOffset: attribute.byteOffset,
                                byteStride: attribute.byteStride,
                                count: attribute.count,
                                max: attribute.max,
                                min: attribute.min,
                                componentType: attribute.componentType,
                                type: attribute.type,
                                id: attributeID
                            };

                            var attribContext = new VertexAttributeContext(attributeObject, semantic, geometry);

                            var alreadyProcessedAttribute = XEO.GLTFLoaderUtils.getBuffer(attributeObject, vertexAttributeDelegate, attribContext);

                            /*if(alreadyProcessedAttribute) {
                             vertexAttributeDelegate.resourceAvailable(alreadyProcessedAttribute, attribContext);
                             }*/

                        }, this);
                    }
                }

                return true;
            }
        },

        handleCamera: {
            value: function (entryID, description, userInfo) {
                //log("camera", entryID, description);
                return true;
            }
        },

        handleScene: {
            value: function (entryID, description, userInfo) {

                var nodes = description.nodes;

                if (nodes) {

                    var node;
                    var transform;

                    for (var nodeId in nodes) {
                        if (nodes.hasOwnProperty(nodeId)) {

                            node = nodes [nodeId];
                            transform = null;

                            this._parseNode(node, transform);
                        }
                    }
                }
            }
        },

        _parseNode: {
            value: function (nodeId, transform) {

                var node = this._json.nodes[nodeId];

                if (!node) {
                    return;
                }

                var collection = this.collection;
                var scene = collection.scene;

                if (node.matrix) {
                    var matrix = node.matrix;
                    transform = new XEO.Transform(scene, {
                        id: this._makeID(nodeId + ".transform"),
                        matrix: matrix,
                        parent: transform
                    });
                    collection.add(transform);
                }

                if (node.translation) {
                    var translation = node.translation;
                    transform = new XEO.Translate(scene, {
                        id: this._makeID(nodeId + ".translation"),
                        xyz: [translation[0], translation[1], translation[2]],
                        parent: transform
                    });
                    collection.add(transform);
                }

                if (node.rotation) {
                    var rotation = node.rotation;
                    transform = new XEO.Rotate(scene, {
                        id: this._makeID(nodeId + ".rotation"),
                        xyz: [rotation[0], rotation[1], rotation[2]],
                        angle: rotation[3],
                        parent: transform
                    });
                    collection.add(transform);
                }

                if (node.scale) {
                    var scale = node.scale;
                    transform = new XEO.Scale(scene, {
                        id: this._makeID(nodeId + ".scale"),
                        xyz: [scale[0], scale[1], scale[2]],
                        parent: transform
                    });
                    collection.add(transform);
                }

                if (node.meshes) {

                    // One XEO.Visibility per mesh group

                    var visibility = new XEO.Visibility(scene, {
                        id: this._makeID(nodeId + ".visibility")
                    });

                    collection.add(visibility);

                    // One XEO.Cull per mesh group

                    var cull = new XEO.Cull(scene, {
                        id: this._makeID(nodeId + ".cull")
                    });

                    collection.add(cull);

                    // One XEO.Modes per mesh group

                    var modes = new XEO.Modes(scene, {
                        id: this._makeID(nodeId + ".modes")
                    });

                    collection.add(cull);

                    // One XEO.Entity per mesh, each sharing the same
                    // XEO.Visibility, XEO.Cull and XEO.Nodes

                    var meshes = node.meshes;
                    var imeshes;
                    var lenMeshes = meshes.length;
                    var mesh;
                    var i;
                    var len;
                    var material;
                    var geometry;
                    var entityId;
                    var j;
                    var entities = scene.types["XEO.Entity"];
                    var entity;

                    for (imeshes = 0; imeshes < lenMeshes; imeshes++) {

                        mesh = this.resources.getEntry(meshes[imeshes]);

                        if (!mesh) {
                            continue;
                        }

                        mesh = mesh.object;

                        for (i = 0, len = mesh.length; i < len; i++) {

                            material = mesh[i].material;
                            geometry = mesh[i].geometry;

                            entityId = this._makeID(nodeId + ".entity." + i);

                            //// Fake ID when clashing with existing entity ID
                            //for  (j = 0; entities[entityId]; j++) {
                            //    entityId = this._makeID(nodeId + ".entity." + i + "." + j);
                            //}

                            entity = new XEO.Entity(scene, {
                                id: entityId,
                                meta: {
                                    name: node.name
                                },
                                material: material,
                                geometry: geometry,
                                transform: transform,
                                visibility: visibility,
                                cull: cull,
                                modes: modes,

                                // Indicates that this Entity is freshly loaded -  increments the XEO.Spinner#processes
                                // count on the Scene Canvas, which will decrement again as soon as Entity is compiled
                                // into the render graph, causing the Spinner to show until this Entity is visible
                                loading: true
                            });

                            collection.add(entity);
                        }
                    }
                }

                if (node.children) {

                    var children = node.children;
                    var childNode;

                    for (i = 0, len = children.length; i < len; i++) {
                        childNode = children[i];
                        this._parseNode(childNode, transform);
                    }
                }

                return true;
            }
        }
    });

})();