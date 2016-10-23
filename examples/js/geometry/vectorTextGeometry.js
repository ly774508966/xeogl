/**
 A **VectorTextGeometry** defines vector text geometry for attached {{#crossLink "Entity"}}Entities{{/crossLink}}.

 ## Example

 ````javascript
 new xeogl.Entity({
     geometry: new xeogl.VectorTextGeometry({
         text: "Attack ships on fire off the Shoulder of Orion",
         xSize: 2,
         ySize: 2
     }),
     material: new xeogl.PhongMaterial({
         emissive: [0.5, 1.0, 1.0],
         lineWidth: 2
     }),
     lights: new xeogl.Lights({
         lights: [] // No lights - rely on emissive color
     }),
     transform: new xeogl.Translate({
         xyz: [0, 40, 0]
     })
 });
 ````

 @class VectorTextGeometry
 @module xeogl
 @submodule geometry
 @constructor
 @param [scene] {Scene} Parent {{#crossLink "Scene"}}Scene{{/crossLink}} - creates this VectorTextGeometry in the default
 {{#crossLink "Scene"}}Scene{{/crossLink}} when omitted.
 @param [cfg] {*} Configs
 @param [cfg.id] {String} Optional ID, unique among all components in the parent {{#crossLink "Scene"}}Scene{{/crossLink}},
 generated automatically when omitted.
 @param [cfg.meta] {String:Object} Optional map of user-defined metadata to attach to this VectorTextGeometry.
 @param [cfg.text=""] {String} The text.
 @extends Geometry
 */
(function () {

    "use strict";

    var letters;

    xeogl.VectorTextGeometry = xeogl.Geometry.extend({

        type: "xeogl.VectorTextGeometry",

        _init: function (cfg) {

            this._super(cfg);

            this.text = cfg.text;

            this.xSize = cfg.xSize;
            this.ySize = cfg.ySize;
        },

        /**
         * Implement protected virtual template method {{#crossLink "Geometry/method:_update"}}{{/crossLink}},
         * to generate geometry data arrays.
         *
         * @protected
         */
        _update: function () {

            if (!letters) {
                letters = buildStrokeData();
            }

            var positions = [];
            var indices = [];
            var lines = this._text.split("\n");
            var countVerts = 0;
            var y = 0;
            var x;
            var str;
            var len;
            var c;
            var mag = 1.0 / 25.0;
            var penUp;
            var p1;
            var p2;
            var needLine;
            var pointsLen;
            var a;

            for (var iLine = 0; iLine < lines.length; iLine++) {

                x = 0;
                str = lines[iLine];
                len = str.length;

                for (var i = 0; i < len; i++) {

                    c = letters[str.charAt(i)];

                    if (c == '\n') {
                        //alert("newline");
                    }

                    if (!c) {
                        continue;
                    }

                    penUp = 1;
                    p1 = -1;
                    p2 = -1;
                    needLine = false;

                    pointsLen = c.points.length;

                    for (var j = 0; j < pointsLen; j++) {
                        a = c.points[j];

                        if (a[0] == -1 && a[1] == -1) {
                            penUp = 1;
                            needLine = false;
                            continue;
                        }

                        positions.push(x + (a[0] * this._xSize) * mag);
                        positions.push(y + (a[1] * this._ySize) * mag);
                        positions.push(0);

                        if (p1 == -1) {
                            p1 = countVerts;
                        } else if (p2 == -1) {
                            p2 = countVerts;
                        } else {
                            p1 = p2;
                            p2 = countVerts;
                        }
                        countVerts++;

                        if (penUp) {
                            penUp = false;

                        } else {
                            indices.push(p1);
                            indices.push(p2);
                        }

                        needLine = true;
                    }
                    x += c.width * mag * this._xSize;

                }
                y -= 35 * mag * this._ySize;
            }

            this.primitive = "lines";
            this.positions = positions;
            this.normals = null;
            this.uv = null;
            this.indices = indices;
        },

        _props: {

            /**
             * The text for this VectorText
             *
             * Fires a {{#crossLink "VectorTextGeometry/text:event"}}{{/crossLink}} event on change.
             *
             * @property text
             * @default ""
             * @type String
             */
            text: {

                set: function (value) {

                    value = value || "";

                    if (this._text === value) {
                        return;
                    }

                    this._text = value;

                    this._scheduleUpdate();

                    /**
                     * Fired whenever this VectorTextGeometry's {{#crossLink "VectorTextGeometry/text:property"}}{{/crossLink}} property changes.
                     * @event text
                     * @type Boolean
                     * @param value The property's new value
                     */
                    this.fire("text", this._text);
                },

                get: function () {
                    return this._text;
                }
            },

            /**
             * The VectorText's size on the X-axis.
             *
             * Fires a {{#crossLink "VectorText/xSize:event"}}{{/crossLink}} event on change.
             *
             * @property xSize
             * @default 1
             * @type Number
             */
            xSize: {

                set: function (value) {

                    value = value || 1;

                    if (this._xSize === value) {
                        return;
                    }

                    if (value < 0) {
                        this.warn("negative xSize not allowed - will invert");
                        value = value * -1;
                    }

                    this._xSize = value;

                    this._scheduleUpdate();

                    /**
                     * Fired whenever this VectorText's {{#crossLink "VectorText/xSize:property"}}{{/crossLink}} property changes.
                     * @event xSize
                     * @type Number
                     * @param value The property's new value
                     */
                    this.fire("xSize", this._xSize);
                },

                get: function () {
                    return this._xSize;
                }
            },

            /**
             * The VectorText's size on the Y-axis.
             *
             * Fires a {{#crossLink "VectorText/ySize:event"}}{{/crossLink}} event on change.
             *
             * @property ySize
             * @default 1.0
             * @type Number
             */
            ySize: {

                set: function (value) {

                    value = value || 1.0;

                    if (this._ySize === value) {
                        return;
                    }

                    if (value < 0) {
                        this.warn("negative ySize not allowed - will invert");
                        value = value * -1;
                    }

                    this._ySize = value;

                    this._scheduleUpdate();

                    /**
                     * Fired whenever this VectorText's {{#crossLink "VectorText/ySize:property"}}{{/crossLink}} property changes.
                     * @event ySize
                     * @type Number
                     * @param value The property's new value
                     */
                    this.fire("ySize", this._ySize);
                },

                get: function () {
                    return this._ySize;
                }
            },

            _getJSON: function () {
                return {
                    text: this._text
                };
            }
        }
    });

    function buildStrokeData() {
        return {
            ' ': {width: 16, points: []},
            '!': {
                width: 10, points: [
                    [5, 21],
                    [5, 7],
                    [-1, -1],
                    [5, 2],
                    [4, 1],
                    [5, 0],
                    [6, 1],
                    [5, 2]
                ]
            },
            '"': {
                width: 16, points: [
                    [4, 21],
                    [4, 14],
                    [-1, -1],
                    [12, 21],
                    [12, 14]
                ]
            },
            '#': {
                width: 21, points: [
                    [11, 25],
                    [4, -7],
                    [-1, -1],
                    [17, 25],
                    [10, -7],
                    [-1, -1],
                    [4, 12],
                    [18, 12],
                    [-1, -1],
                    [3, 6],
                    [17, 6]
                ]
            },
            '$': {
                width: 20, points: [
                    [8, 25],
                    [8, -4],
                    [-1, -1],
                    [12, 25],
                    [12, -4],
                    [-1, -1],
                    [17, 18],
                    [15, 20],
                    [12, 21],
                    [8, 21],
                    [5, 20],
                    [3, 18],
                    [3, 16],
                    [4, 14],
                    [5, 13],
                    [7, 12],
                    [13, 10],
                    [15, 9],
                    [16, 8],
                    [17, 6],
                    [17, 3],
                    [15, 1],
                    [12, 0],
                    [8, 0],
                    [5, 1],
                    [3, 3]
                ]
            },
            '%': {
                width: 24, points: [
                    [21, 21],
                    [3, 0],
                    [-1, -1],
                    [8, 21],
                    [10, 19],
                    [10, 17],
                    [9, 15],
                    [7, 14],
                    [5, 14],
                    [3, 16],
                    [3, 18],
                    [4, 20],
                    [6, 21],
                    [8, 21],
                    [10, 20],
                    [13, 19],
                    [16, 19],
                    [19, 20],
                    [21, 21],
                    [-1, -1],
                    [17, 7],
                    [15, 6],
                    [14, 4],
                    [14, 2],
                    [16, 0],
                    [18, 0],
                    [20, 1],
                    [21, 3],
                    [21, 5],
                    [19, 7],
                    [17, 7]
                ]
            },
            '&': {
                width: 26, points: [
                    [23, 12],
                    [23, 13],
                    [22, 14],
                    [21, 14],
                    [20, 13],
                    [19, 11],
                    [17, 6],
                    [15, 3],
                    [13, 1],
                    [11, 0],
                    [7, 0],
                    [5, 1],
                    [4, 2],
                    [3, 4],
                    [3, 6],
                    [4, 8],
                    [5, 9],
                    [12, 13],
                    [13, 14],
                    [14, 16],
                    [14, 18],
                    [13, 20],
                    [11, 21],
                    [9, 20],
                    [8, 18],
                    [8, 16],
                    [9, 13],
                    [11, 10],
                    [16, 3],
                    [18, 1],
                    [20, 0],
                    [22, 0],
                    [23, 1],
                    [23, 2]
                ]
            },
            '\'': {
                width: 10, points: [
                    [5, 19],
                    [4, 20],
                    [5, 21],
                    [6, 20],
                    [6, 18],
                    [5, 16],
                    [4, 15]
                ]
            },
            '(': {
                width: 14, points: [
                    [11, 25],
                    [9, 23],
                    [7, 20],
                    [5, 16],
                    [4, 11],
                    [4, 7],
                    [5, 2],
                    [7, -2],
                    [9, -5],
                    [11, -7]
                ]
            },
            ')': {
                width: 14, points: [
                    [3, 25],
                    [5, 23],
                    [7, 20],
                    [9, 16],
                    [10, 11],
                    [10, 7],
                    [9, 2],
                    [7, -2],
                    [5, -5],
                    [3, -7]
                ]
            },
            '*': {
                width: 16, points: [
                    [8, 21],
                    [8, 9],
                    [-1, -1],
                    [3, 18],
                    [13, 12],
                    [-1, -1],
                    [13, 18],
                    [3, 12]
                ]
            },
            '+': {
                width: 26, points: [
                    [13, 18],
                    [13, 0],
                    [-1, -1],
                    [4, 9],
                    [22, 9]
                ]
            },
            ',': {
                width: 10, points: [
                    [6, 1],
                    [5, 0],
                    [4, 1],
                    [5, 2],
                    [6, 1],
                    [6, -1],
                    [5, -3],
                    [4, -4]
                ]
            },
            '-': {
                width: 26, points: [
                    [4, 9],
                    [22, 9]
                ]
            },
            '.': {
                width: 10, points: [
                    [5, 2],
                    [4, 1],
                    [5, 0],
                    [6, 1],
                    [5, 2]
                ]
            },
            '/': {
                width: 22, points: [
                    [20, 25],
                    [2, -7]
                ]
            },
            '0': {
                width: 20, points: [
                    [9, 21],
                    [6, 20],
                    [4, 17],
                    [3, 12],
                    [3, 9],
                    [4, 4],
                    [6, 1],
                    [9, 0],
                    [11, 0],
                    [14, 1],
                    [16, 4],
                    [17, 9],
                    [17, 12],
                    [16, 17],
                    [14, 20],
                    [11, 21],
                    [9, 21]
                ]
            },
            '1': {
                width: 20, points: [
                    [6, 17],
                    [8, 18],
                    [11, 21],
                    [11, 0]
                ]
            },
            '2': {
                width: 20, points: [
                    [4, 16],
                    [4, 17],
                    [5, 19],
                    [6, 20],
                    [8, 21],
                    [12, 21],
                    [14, 20],
                    [15, 19],
                    [16, 17],
                    [16, 15],
                    [15, 13],
                    [13, 10],
                    [3, 0],
                    [17, 0]
                ]
            },
            '3': {
                width: 20, points: [
                    [5, 21],
                    [16, 21],
                    [10, 13],
                    [13, 13],
                    [15, 12],
                    [16, 11],
                    [17, 8],
                    [17, 6],
                    [16, 3],
                    [14, 1],
                    [11, 0],
                    [8, 0],
                    [5, 1],
                    [4, 2],
                    [3, 4]
                ]
            },
            '4': {
                width: 20, points: [
                    [13, 21],
                    [3, 7],
                    [18, 7],
                    [-1, -1],
                    [13, 21],
                    [13, 0]
                ]
            },
            '5': {
                width: 20, points: [
                    [15, 21],
                    [5, 21],
                    [4, 12],
                    [5, 13],
                    [8, 14],
                    [11, 14],
                    [14, 13],
                    [16, 11],
                    [17, 8],
                    [17, 6],
                    [16, 3],
                    [14, 1],
                    [11, 0],
                    [8, 0],
                    [5, 1],
                    [4, 2],
                    [3, 4]
                ]
            },
            '6': {
                width: 20, points: [
                    [16, 18],
                    [15, 20],
                    [12, 21],
                    [10, 21],
                    [7, 20],
                    [5, 17],
                    [4, 12],
                    [4, 7],
                    [5, 3],
                    [7, 1],
                    [10, 0],
                    [11, 0],
                    [14, 1],
                    [16, 3],
                    [17, 6],
                    [17, 7],
                    [16, 10],
                    [14, 12],
                    [11, 13],
                    [10, 13],
                    [7, 12],
                    [5, 10],
                    [4, 7]
                ]
            },
            '7': {
                width: 20, points: [
                    [17, 21],
                    [7, 0],
                    [-1, -1],
                    [3, 21],
                    [17, 21]
                ]
            },
            '8': {
                width: 20, points: [
                    [8, 21],
                    [5, 20],
                    [4, 18],
                    [4, 16],
                    [5, 14],
                    [7, 13],
                    [11, 12],
                    [14, 11],
                    [16, 9],
                    [17, 7],
                    [17, 4],
                    [16, 2],
                    [15, 1],
                    [12, 0],
                    [8, 0],
                    [5, 1],
                    [4, 2],
                    [3, 4],
                    [3, 7],
                    [4, 9],
                    [6, 11],
                    [9, 12],
                    [13, 13],
                    [15, 14],
                    [16, 16],
                    [16, 18],
                    [15, 20],
                    [12, 21],
                    [8, 21]
                ]
            },
            '9': {
                width: 20, points: [
                    [16, 14],
                    [15, 11],
                    [13, 9],
                    [10, 8],
                    [9, 8],
                    [6, 9],
                    [4, 11],
                    [3, 14],
                    [3, 15],
                    [4, 18],
                    [6, 20],
                    [9, 21],
                    [10, 21],
                    [13, 20],
                    [15, 18],
                    [16, 14],
                    [16, 9],
                    [15, 4],
                    [13, 1],
                    [10, 0],
                    [8, 0],
                    [5, 1],
                    [4, 3]
                ]
            },
            ':': {
                width: 10, points: [
                    [5, 14],
                    [4, 13],
                    [5, 12],
                    [6, 13],
                    [5, 14],
                    [-1, -1],
                    [5, 2],
                    [4, 1],
                    [5, 0],
                    [6, 1],
                    [5, 2]
                ]
            },
            ';': {
                width: 10, points: [
                    [5, 14],
                    [4, 13],
                    [5, 12],
                    [6, 13],
                    [5, 14],
                    [-1, -1],
                    [6, 1],
                    [5, 0],
                    [4, 1],
                    [5, 2],
                    [6, 1],
                    [6, -1],
                    [5, -3],
                    [4, -4]
                ]
            },
            '<': {
                width: 24, points: [
                    [20, 18],
                    [4, 9],
                    [20, 0]
                ]
            },
            '=': {
                width: 26, points: [
                    [4, 12],
                    [22, 12],
                    [-1, -1],
                    [4, 6],
                    [22, 6]
                ]
            },
            '>': {
                width: 24, points: [
                    [4, 18],
                    [20, 9],
                    [4, 0]
                ]
            },
            '?': {
                width: 18, points: [
                    [3, 16],
                    [3, 17],
                    [4, 19],
                    [5, 20],
                    [7, 21],
                    [11, 21],
                    [13, 20],
                    [14, 19],
                    [15, 17],
                    [15, 15],
                    [14, 13],
                    [13, 12],
                    [9, 10],
                    [9, 7],
                    [-1, -1],
                    [9, 2],
                    [8, 1],
                    [9, 0],
                    [10, 1],
                    [9, 2]
                ]
            },
            '@': {
                width: 27, points: [
                    [18, 13],
                    [17, 15],
                    [15, 16],
                    [12, 16],
                    [10, 15],
                    [9, 14],
                    [8, 11],
                    [8, 8],
                    [9, 6],
                    [11, 5],
                    [14, 5],
                    [16, 6],
                    [17, 8],
                    [-1, -1],
                    [12, 16],
                    [10, 14],
                    [9, 11],
                    [9, 8],
                    [10, 6],
                    [11, 5],
                    [-1, -1],
                    [18, 16],
                    [17, 8],
                    [17, 6],
                    [19, 5],
                    [21, 5],
                    [23, 7],
                    [24, 10],
                    [24, 12],
                    [23, 15],
                    [22, 17],
                    [20, 19],
                    [18, 20],
                    [15, 21],
                    [12, 21],
                    [9, 20],
                    [7, 19],
                    [5, 17],
                    [4, 15],
                    [3, 12],
                    [3, 9],
                    [4, 6],
                    [5, 4],
                    [7, 2],
                    [9, 1],
                    [12, 0],
                    [15, 0],
                    [18, 1],
                    [20, 2],
                    [21, 3],
                    [-1, -1],
                    [19, 16],
                    [18, 8],
                    [18, 6],
                    [19, 5]
                ]
            },
            'A': {
                width: 18, points: [
                    [9, 21],
                    [1, 0],
                    [-1, -1],
                    [9, 21],
                    [17, 0],
                    [-1, -1],
                    [4, 7],
                    [14, 7]
                ]
            },
            'B': {
                width: 21, points: [
                    [4, 21],
                    [4, 0],
                    [-1, -1],
                    [4, 21],
                    [13, 21],
                    [16, 20],
                    [17, 19],
                    [18, 17],
                    [18, 15],
                    [17, 13],
                    [16, 12],
                    [13, 11],
                    [-1, -1],
                    [4, 11],
                    [13, 11],
                    [16, 10],
                    [17, 9],
                    [18, 7],
                    [18, 4],
                    [17, 2],
                    [16, 1],
                    [13, 0],
                    [4, 0]
                ]
            },
            'C': {
                width: 21, points: [
                    [18, 16],
                    [17, 18],
                    [15, 20],
                    [13, 21],
                    [9, 21],
                    [7, 20],
                    [5, 18],
                    [4, 16],
                    [3, 13],
                    [3, 8],
                    [4, 5],
                    [5, 3],
                    [7, 1],
                    [9, 0],
                    [13, 0],
                    [15, 1],
                    [17, 3],
                    [18, 5]
                ]
            },
            'D': {
                width: 21, points: [
                    [4, 21],
                    [4, 0],
                    [-1, -1],
                    [4, 21],
                    [11, 21],
                    [14, 20],
                    [16, 18],
                    [17, 16],
                    [18, 13],
                    [18, 8],
                    [17, 5],
                    [16, 3],
                    [14, 1],
                    [11, 0],
                    [4, 0]
                ]
            },
            'E': {
                width: 19, points: [
                    [4, 21],
                    [4, 0],
                    [-1, -1],
                    [4, 21],
                    [17, 21],
                    [-1, -1],
                    [4, 11],
                    [12, 11],
                    [-1, -1],
                    [4, 0],
                    [17, 0]
                ]
            },
            'F': {
                width: 18, points: [
                    [4, 21],
                    [4, 0],
                    [-1, -1],
                    [4, 21],
                    [17, 21],
                    [-1, -1],
                    [4, 11],
                    [12, 11]
                ]
            },
            'G': {
                width: 21, points: [
                    [18, 16],
                    [17, 18],
                    [15, 20],
                    [13, 21],
                    [9, 21],
                    [7, 20],
                    [5, 18],
                    [4, 16],
                    [3, 13],
                    [3, 8],
                    [4, 5],
                    [5, 3],
                    [7, 1],
                    [9, 0],
                    [13, 0],
                    [15, 1],
                    [17, 3],
                    [18, 5],
                    [18, 8],
                    [-1, -1],
                    [13, 8],
                    [18, 8]
                ]
            },
            'H': {
                width: 22, points: [
                    [4, 21],
                    [4, 0],
                    [-1, -1],
                    [18, 21],
                    [18, 0],
                    [-1, -1],
                    [4, 11],
                    [18, 11]
                ]
            },
            'I': {
                width: 8, points: [
                    [4, 21],
                    [4, 0]
                ]
            },
            'J': {
                width: 16, points: [
                    [12, 21],
                    [12, 5],
                    [11, 2],
                    [10, 1],
                    [8, 0],
                    [6, 0],
                    [4, 1],
                    [3, 2],
                    [2, 5],
                    [2, 7]
                ]
            },
            'K': {
                width: 21, points: [
                    [4, 21],
                    [4, 0],
                    [-1, -1],
                    [18, 21],
                    [4, 7],
                    [-1, -1],
                    [9, 12],
                    [18, 0]
                ]
            },
            'L': {
                width: 17, points: [
                    [4, 21],
                    [4, 0],
                    [-1, -1],
                    [4, 0],
                    [16, 0]
                ]
            },
            'M': {
                width: 24, points: [
                    [4, 21],
                    [4, 0],
                    [-1, -1],
                    [4, 21],
                    [12, 0],
                    [-1, -1],
                    [20, 21],
                    [12, 0],
                    [-1, -1],
                    [20, 21],
                    [20, 0]
                ]
            },
            'N': {
                width: 22, points: [
                    [4, 21],
                    [4, 0],
                    [-1, -1],
                    [4, 21],
                    [18, 0],
                    [-1, -1],
                    [18, 21],
                    [18, 0]
                ]
            },
            'O': {
                width: 22, points: [
                    [9, 21],
                    [7, 20],
                    [5, 18],
                    [4, 16],
                    [3, 13],
                    [3, 8],
                    [4, 5],
                    [5, 3],
                    [7, 1],
                    [9, 0],
                    [13, 0],
                    [15, 1],
                    [17, 3],
                    [18, 5],
                    [19, 8],
                    [19, 13],
                    [18, 16],
                    [17, 18],
                    [15, 20],
                    [13, 21],
                    [9, 21]
                ]
            },
            'P': {
                width: 21, points: [
                    [4, 21],
                    [4, 0],
                    [-1, -1],
                    [4, 21],
                    [13, 21],
                    [16, 20],
                    [17, 19],
                    [18, 17],
                    [18, 14],
                    [17, 12],
                    [16, 11],
                    [13, 10],
                    [4, 10]
                ]
            },
            'Q': {
                width: 22, points: [
                    [9, 21],
                    [7, 20],
                    [5, 18],
                    [4, 16],
                    [3, 13],
                    [3, 8],
                    [4, 5],
                    [5, 3],
                    [7, 1],
                    [9, 0],
                    [13, 0],
                    [15, 1],
                    [17, 3],
                    [18, 5],
                    [19, 8],
                    [19, 13],
                    [18, 16],
                    [17, 18],
                    [15, 20],
                    [13, 21],
                    [9, 21],
                    [-1, -1],
                    [12, 4],
                    [18, -2]
                ]
            },
            'R': {
                width: 21, points: [
                    [4, 21],
                    [4, 0],
                    [-1, -1],
                    [4, 21],
                    [13, 21],
                    [16, 20],
                    [17, 19],
                    [18, 17],
                    [18, 15],
                    [17, 13],
                    [16, 12],
                    [13, 11],
                    [4, 11],
                    [-1, -1],
                    [11, 11],
                    [18, 0]
                ]
            },
            'S': {
                width: 20, points: [
                    [17, 18],
                    [15, 20],
                    [12, 21],
                    [8, 21],
                    [5, 20],
                    [3, 18],
                    [3, 16],
                    [4, 14],
                    [5, 13],
                    [7, 12],
                    [13, 10],
                    [15, 9],
                    [16, 8],
                    [17, 6],
                    [17, 3],
                    [15, 1],
                    [12, 0],
                    [8, 0],
                    [5, 1],
                    [3, 3]
                ]
            },
            'T': {
                width: 16, points: [
                    [8, 21],
                    [8, 0],
                    [-1, -1],
                    [1, 21],
                    [15, 21]
                ]
            },
            'U': {
                width: 22, points: [
                    [4, 21],
                    [4, 6],
                    [5, 3],
                    [7, 1],
                    [10, 0],
                    [12, 0],
                    [15, 1],
                    [17, 3],
                    [18, 6],
                    [18, 21]
                ]
            },
            'V': {
                width: 18, points: [
                    [1, 21],
                    [9, 0],
                    [-1, -1],
                    [17, 21],
                    [9, 0]
                ]
            },
            'W': {
                width: 24, points: [
                    [2, 21],
                    [7, 0],
                    [-1, -1],
                    [12, 21],
                    [7, 0],
                    [-1, -1],
                    [12, 21],
                    [17, 0],
                    [-1, -1],
                    [22, 21],
                    [17, 0]
                ]
            },
            'X': {
                width: 20, points: [
                    [3, 21],
                    [17, 0],
                    [-1, -1],
                    [17, 21],
                    [3, 0]
                ]
            },
            'Y': {
                width: 18, points: [
                    [1, 21],
                    [9, 11],
                    [9, 0],
                    [-1, -1],
                    [17, 21],
                    [9, 11]
                ]
            },
            'Z': {
                width: 20, points: [
                    [17, 21],
                    [3, 0],
                    [-1, -1],
                    [3, 21],
                    [17, 21],
                    [-1, -1],
                    [3, 0],
                    [17, 0]
                ]
            },
            '[': {
                width: 14, points: [
                    [4, 25],
                    [4, -7],
                    [-1, -1],
                    [5, 25],
                    [5, -7],
                    [-1, -1],
                    [4, 25],
                    [11, 25],
                    [-1, -1],
                    [4, -7],
                    [11, -7]
                ]
            },
            '\\': {
                width: 14, points: [
                    [0, 21],
                    [14, -3]
                ]
            },
            ']': {
                width: 14, points: [
                    [9, 25],
                    [9, -7],
                    [-1, -1],
                    [10, 25],
                    [10, -7],
                    [-1, -1],
                    [3, 25],
                    [10, 25],
                    [-1, -1],
                    [3, -7],
                    [10, -7]
                ]
            },
            '^': {
                width: 16, points: [
                    [6, 15],
                    [8, 18],
                    [10, 15],
                    [-1, -1],
                    [3, 12],
                    [8, 17],
                    [13, 12],
                    [-1, -1],
                    [8, 17],
                    [8, 0]
                ]
            },
            '_': {
                width: 16, points: [
                    [0, -2],
                    [16, -2]
                ]
            },
            '`': {
                width: 10, points: [
                    [6, 21],
                    [5, 20],
                    [4, 18],
                    [4, 16],
                    [5, 15],
                    [6, 16],
                    [5, 17]
                ]
            },
            'a': {
                width: 19, points: [
                    [15, 14],
                    [15, 0],
                    [-1, -1],
                    [15, 11],
                    [13, 13],
                    [11, 14],
                    [8, 14],
                    [6, 13],
                    [4, 11],
                    [3, 8],
                    [3, 6],
                    [4, 3],
                    [6, 1],
                    [8, 0],
                    [11, 0],
                    [13, 1],
                    [15, 3]
                ]
            },
            'b': {
                width: 19, points: [
                    [4, 21],
                    [4, 0],
                    [-1, -1],
                    [4, 11],
                    [6, 13],
                    [8, 14],
                    [11, 14],
                    [13, 13],
                    [15, 11],
                    [16, 8],
                    [16, 6],
                    [15, 3],
                    [13, 1],
                    [11, 0],
                    [8, 0],
                    [6, 1],
                    [4, 3]
                ]
            },
            'c': {
                width: 18, points: [
                    [15, 11],
                    [13, 13],
                    [11, 14],
                    [8, 14],
                    [6, 13],
                    [4, 11],
                    [3, 8],
                    [3, 6],
                    [4, 3],
                    [6, 1],
                    [8, 0],
                    [11, 0],
                    [13, 1],
                    [15, 3]
                ]
            },
            'd': {
                width: 19, points: [
                    [15, 21],
                    [15, 0],
                    [-1, -1],
                    [15, 11],
                    [13, 13],
                    [11, 14],
                    [8, 14],
                    [6, 13],
                    [4, 11],
                    [3, 8],
                    [3, 6],
                    [4, 3],
                    [6, 1],
                    [8, 0],
                    [11, 0],
                    [13, 1],
                    [15, 3]
                ]
            },
            'e': {
                width: 18, points: [
                    [3, 8],
                    [15, 8],
                    [15, 10],
                    [14, 12],
                    [13, 13],
                    [11, 14],
                    [8, 14],
                    [6, 13],
                    [4, 11],
                    [3, 8],
                    [3, 6],
                    [4, 3],
                    [6, 1],
                    [8, 0],
                    [11, 0],
                    [13, 1],
                    [15, 3]
                ]
            },
            'f': {
                width: 12, points: [
                    [10, 21],
                    [8, 21],
                    [6, 20],
                    [5, 17],
                    [5, 0],
                    [-1, -1],
                    [2, 14],
                    [9, 14]
                ]
            },
            'g': {
                width: 19, points: [
                    [15, 14],
                    [15, -2],
                    [14, -5],
                    [13, -6],
                    [11, -7],
                    [8, -7],
                    [6, -6],
                    [-1, -1],
                    [15, 11],
                    [13, 13],
                    [11, 14],
                    [8, 14],
                    [6, 13],
                    [4, 11],
                    [3, 8],
                    [3, 6],
                    [4, 3],
                    [6, 1],
                    [8, 0],
                    [11, 0],
                    [13, 1],
                    [15, 3]
                ]
            },
            'h': {
                width: 19, points: [
                    [4, 21],
                    [4, 0],
                    [-1, -1],
                    [4, 10],
                    [7, 13],
                    [9, 14],
                    [12, 14],
                    [14, 13],
                    [15, 10],
                    [15, 0]
                ]
            },
            'i': {
                width: 8, points: [
                    [3, 21],
                    [4, 20],
                    [5, 21],
                    [4, 22],
                    [3, 21],
                    [-1, -1],
                    [4, 14],
                    [4, 0]
                ]
            },
            'j': {
                width: 10, points: [
                    [5, 21],
                    [6, 20],
                    [7, 21],
                    [6, 22],
                    [5, 21],
                    [-1, -1],
                    [6, 14],
                    [6, -3],
                    [5, -6],
                    [3, -7],
                    [1, -7]
                ]
            },
            'k': {
                width: 17, points: [
                    [4, 21],
                    [4, 0],
                    [-1, -1],
                    [14, 14],
                    [4, 4],
                    [-1, -1],
                    [8, 8],
                    [15, 0]
                ]
            },
            'l': {
                width: 8, points: [
                    [4, 21],
                    [4, 0]
                ]
            },
            'm': {
                width: 30, points: [
                    [4, 14],
                    [4, 0],
                    [-1, -1],
                    [4, 10],
                    [7, 13],
                    [9, 14],
                    [12, 14],
                    [14, 13],
                    [15, 10],
                    [15, 0],
                    [-1, -1],
                    [15, 10],
                    [18, 13],
                    [20, 14],
                    [23, 14],
                    [25, 13],
                    [26, 10],
                    [26, 0]
                ]
            },
            'n': {
                width: 19, points: [
                    [4, 14],
                    [4, 0],
                    [-1, -1],
                    [4, 10],
                    [7, 13],
                    [9, 14],
                    [12, 14],
                    [14, 13],
                    [15, 10],
                    [15, 0]
                ]
            },
            'o': {
                width: 19, points: [
                    [8, 14],
                    [6, 13],
                    [4, 11],
                    [3, 8],
                    [3, 6],
                    [4, 3],
                    [6, 1],
                    [8, 0],
                    [11, 0],
                    [13, 1],
                    [15, 3],
                    [16, 6],
                    [16, 8],
                    [15, 11],
                    [13, 13],
                    [11, 14],
                    [8, 14]
                ]
            },
            'p': {
                width: 19, points: [
                    [4, 14],
                    [4, -7],
                    [-1, -1],
                    [4, 11],
                    [6, 13],
                    [8, 14],
                    [11, 14],
                    [13, 13],
                    [15, 11],
                    [16, 8],
                    [16, 6],
                    [15, 3],
                    [13, 1],
                    [11, 0],
                    [8, 0],
                    [6, 1],
                    [4, 3]
                ]
            },
            'q': {
                width: 19, points: [
                    [15, 14],
                    [15, -7],
                    [-1, -1],
                    [15, 11],
                    [13, 13],
                    [11, 14],
                    [8, 14],
                    [6, 13],
                    [4, 11],
                    [3, 8],
                    [3, 6],
                    [4, 3],
                    [6, 1],
                    [8, 0],
                    [11, 0],
                    [13, 1],
                    [15, 3]
                ]
            },
            'r': {
                width: 13, points: [
                    [4, 14],
                    [4, 0],
                    [-1, -1],
                    [4, 8],
                    [5, 11],
                    [7, 13],
                    [9, 14],
                    [12, 14]
                ]
            },
            's': {
                width: 17, points: [
                    [14, 11],
                    [13, 13],
                    [10, 14],
                    [7, 14],
                    [4, 13],
                    [3, 11],
                    [4, 9],
                    [6, 8],
                    [11, 7],
                    [13, 6],
                    [14, 4],
                    [14, 3],
                    [13, 1],
                    [10, 0],
                    [7, 0],
                    [4, 1],
                    [3, 3]
                ]
            },
            't': {
                width: 12, points: [
                    [5, 21],
                    [5, 4],
                    [6, 1],
                    [8, 0],
                    [10, 0],
                    [-1, -1],
                    [2, 14],
                    [9, 14]
                ]
            },
            'u': {
                width: 19, points: [
                    [4, 14],
                    [4, 4],
                    [5, 1],
                    [7, 0],
                    [10, 0],
                    [12, 1],
                    [15, 4],
                    [-1, -1],
                    [15, 14],
                    [15, 0]
                ]
            },
            'v': {
                width: 16, points: [
                    [2, 14],
                    [8, 0],
                    [-1, -1],
                    [14, 14],
                    [8, 0]
                ]
            },
            'w': {
                width: 22, points: [
                    [3, 14],
                    [7, 0],
                    [-1, -1],
                    [11, 14],
                    [7, 0],
                    [-1, -1],
                    [11, 14],
                    [15, 0],
                    [-1, -1],
                    [19, 14],
                    [15, 0]
                ]
            },
            'x': {
                width: 17, points: [
                    [3, 14],
                    [14, 0],
                    [-1, -1],
                    [14, 14],
                    [3, 0]
                ]
            },
            'y': {
                width: 16, points: [
                    [2, 14],
                    [8, 0],
                    [-1, -1],
                    [14, 14],
                    [8, 0],
                    [6, -4],
                    [4, -6],
                    [2, -7],
                    [1, -7]
                ]
            },
            'z': {
                width: 17, points: [
                    [14, 14],
                    [3, 0],
                    [-1, -1],
                    [3, 14],
                    [14, 14],
                    [-1, -1],
                    [3, 0],
                    [14, 0]
                ]
            },
            '{': {
                width: 14, points: [
                    [9, 25],
                    [7, 24],
                    [6, 23],
                    [5, 21],
                    [5, 19],
                    [6, 17],
                    [7, 16],
                    [8, 14],
                    [8, 12],
                    [6, 10],
                    [-1, -1],
                    [7, 24],
                    [6, 22],
                    [6, 20],
                    [7, 18],
                    [8, 17],
                    [9, 15],
                    [9, 13],
                    [8, 11],
                    [4, 9],
                    [8, 7],
                    [9, 5],
                    [9, 3],
                    [8, 1],
                    [7, 0],
                    [6, -2],
                    [6, -4],
                    [7, -6],
                    [-1, -1],
                    [6, 8],
                    [8, 6],
                    [8, 4],
                    [7, 2],
                    [6, 1],
                    [5, -1],
                    [5, -3],
                    [6, -5],
                    [7, -6],
                    [9, -7]
                ]
            },
            '|': {
                width: 8, points: [
                    [4, 25],
                    [4, -7]
                ]
            },
            '}': {
                width: 14, points: [
                    [5, 25],
                    [7, 24],
                    [8, 23],
                    [9, 21],
                    [9, 19],
                    [8, 17],
                    [7, 16],
                    [6, 14],
                    [6, 12],
                    [8, 10],
                    [-1, -1],
                    [7, 24],
                    [8, 22],
                    [8, 20],
                    [7, 18],
                    [6, 17],
                    [5, 15],
                    [5, 13],
                    [6, 11],
                    [10, 9],
                    [6, 7],
                    [5, 5],
                    [5, 3],
                    [6, 1],
                    [7, 0],
                    [8, -2],
                    [8, -4],
                    [7, -6],
                    [-1, -1],
                    [8, 8],
                    [6, 6],
                    [6, 4],
                    [7, 2],
                    [8, 1],
                    [9, -1],
                    [9, -3],
                    [8, -5],
                    [7, -6],
                    [5, -7]
                ]
            },
            '~': {
                width: 24, points: [
                    [3, 6],
                    [3, 8],
                    [4, 11],
                    [6, 12],
                    [8, 12],
                    [10, 11],
                    [14, 8],
                    [16, 7],
                    [18, 7],
                    [20, 8],
                    [21, 10],
                    [-1, -1],
                    [3, 8],
                    [4, 10],
                    [6, 11],
                    [8, 11],
                    [10, 10],
                    [14, 7],
                    [16, 6],
                    [18, 6],
                    [20, 7],
                    [21, 10],
                    [21, 12]
                ]
            }
        };

    }
})();
