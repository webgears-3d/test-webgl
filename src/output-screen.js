
import vertexShaderCode from './shaders/screen.vert';
import fragmentShaderCode from './shaders/screen.frag';

function setupScreenSpaceRenderable(gl) {
    // create buffers (change to indices):
    const buffer = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 1, 2]), gl.STATIC_DRAW, 0);

    // create webgl-program:
    const webglProgram = gl.createProgram();

    const vertexShaderModule = gl.createShader(gl.VERTEX_SHADER);

    gl.shaderSource(vertexShaderModule, vertexShaderCode);
    gl.compileShader(vertexShaderModule);

    {
        const log = gl.getShaderInfoLog(vertexShaderModule);
        if (log.length > 0) { console.warn(log); } // eslint-disable-line
    }

    const fragmentShaderModule = gl.createShader(gl.FRAGMENT_SHADER);

    gl.shaderSource(fragmentShaderModule, fragmentShaderCode);
    gl.compileShader(fragmentShaderModule);

    {
        const log = gl.getShaderInfoLog(fragmentShaderModule);
        if (log.length > 0) { console.warn(log); } // eslint-disable-line
    }

    gl.attachShader(webglProgram, vertexShaderModule);
    gl.attachShader(webglProgram, fragmentShaderModule);

    gl.linkProgram(webglProgram);

    {
        const log = gl.getProgramInfoLog(webglProgram);
        if (log.length > 0) { console.warn(log); } // eslint-disable-line
    }

    gl.deleteShader(vertexShaderModule);
    gl.deleteShader(fragmentShaderModule);

    gl.useProgram(webglProgram);

    // bind attributes:
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 1, gl.FLOAT, false, 4, 0);

    const tLocation = gl.getUniformLocation(webglProgram, 'uTime');
    const resLocation = gl.getUniformLocation(webglProgram, 'uResolution');
    const targetLocation = gl.getUniformLocation(webglProgram, 'uTarget');
    const coordsLocation = gl.getUniformLocation(webglProgram, 'uCoords');

    return { count: 3, tLocation, resLocation, targetLocation, coordsLocation };
}

export { setupScreenSpaceRenderable };
