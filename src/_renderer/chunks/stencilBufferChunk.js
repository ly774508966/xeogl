(function () {

    "use strict";

    XEO.renderer.ChunkFactory.createChunkType({

        type: "stencilBuf",

        // Avoid re-application of this chunk after a program switch.

        programGlobal: true,

        draw: function (frameCtx) {

            var gl = this.program.gl;
            var state = this.state;
            var active = state.active;

            // Enable or disable stencil buffer

            if (frameCtx.stencilTestEnabled !== active) {
                if (active) {
                    gl.enable(gl.STENCIL_TEST);
                } else {
                    gl.disable(gl.STENCIL_TEST);
                }
                frameCtx.stencilTestEnabled = active;
            }

            // Stencil buffer clear value

            var clearValue = state.clearValue;

            if (frameCtx.clearValue !== clearValue) {
                gl.clearStencil(clearValue);
                frameCtx.clearValue = clearValue;
            }

            // Stencil settings for front faces

            var func = state.frontFunc;
            var ref = state.frontRef;
            var mask = state.frontMask;

            if (frameCtx.stencilFrontFunc != func || frameCtx.stencilFrontRef != ref || frameCtx.stencilFrontMask != mask) {
                gl.stencilFuncSeparate(gl.FRONT, func, ref, mask);
                frameCtx.stencilFrontFunc = func;
                frameCtx.stencilFrontRef = ref;
                frameCtx.stencilFrontMask = mask;
            }

            var sfail = state.frontSFail;
            var dpfail = state.frontDPFail;
            var dppass = state.frontDPPass;

            if (frameCtx.stencilFrontSFail != sfail || frameCtx.stencilFrontDPFail != dpfail || frameCtx.stencilFrontDPPass != dppass) {
                gl.stencilOpSeparate(gl.FRONT, sfail, dpfail, dppass);
                frameCtx.stencilFrontSFail = sfail;
                frameCtx.stencilFrontDPFail = dpfail;
                frameCtx.stencilFrontDPPass = dppass;
            }

            // Stencil settings for back faces

            func = state.backFunc;
            ref = state.backRef;
            mask = state.backMask;

            if (frameCtx.stencilBackFunc != func || frameCtx.stencilBackRef != ref || frameCtx.stencilBackMask != mask) {
                gl.stencilFuncSeparate(gl.BACK, func, ref, mask);
                frameCtx.stencilBackFunc = func;
                frameCtx.stencilBackRef = ref;
                frameCtx.stencilBackMask = mask;
            }

            sfail = state.backSFail;
            dpfail = state.backDPFail;
            dppass = state.backDPPass;

            if (frameCtx.stencilBackSFail != sfail || frameCtx.stencilBackDPFail != dpfail || frameCtx.stencilBackDPPass != dppass) {
                gl.stencilOpSeparate(gl.BACK, sfail, dpfail, dppass);
                frameCtx.stencilBackSFail = sfail;
                frameCtx.stencilBackDPFail = dpfail;
                frameCtx.stencilBackDPPass = dppass;
            }

            // Clear stencil buffer

            if (state.clear) {
                gl.clear(gl.STENCIL_BUFFER_BIT);
            }
        }
    });
})();
