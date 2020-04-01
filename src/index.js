
import { setupScreenSpaceRenderable } from './output-screen';
import { MouseInput } from './mouse-input';

const init = async () => {
    const pixelRatio = window.devicePixelRatio || 1;

    const root = document.getElementById('root');

    const surface = document.createElementNS('http://www.w3.org/1999/xhtml', 'canvas');

    const gl = surface.getContext('webgl2', {
        alpha: true,
        depth: true,
        stencil: true,
        antialias: true,
        premultipliedAlpha: false,
        preserveDrawingBuffer: false,
        failIfMajorPerformanceCaveat: false,
        desynchronized: false
    });

    root.appendChild(surface);

    const input = new MouseInput(root);

    gl.clearColor(0, 0, 0, 1);

    const { count, tLocation, resLocation, targetLocation, coordsLocation } = setupScreenSpaceRenderable(gl);

    const onResize = () => {
        const w = window.innerWidth;
        const h = window.innerHeight;

        surface.width = Math.floor(w * pixelRatio);
        surface.height = Math.floor(h * pixelRatio);

        surface.style.width = `${w}px`;
        surface.style.height = `${h}px`;

        const width = w * pixelRatio;
        const height = h * pixelRatio;

        gl.viewport(0, 0, w * pixelRatio, h * pixelRatio);

        gl.uniform2fv(resLocation, [width, height]);
    };

    window.addEventListener('resize', onResize);

    onResize();

    return { gl, count, tLocation, input, targetLocation, coordsLocation };
};

const run = async () => {
    const { gl, count, tLocation, input, targetLocation, coordsLocation } = await init();

    let start = performance.now();
    let time = 0;
    let dt = 0;

    const renderOneFrame = () => {
        input.update(dt);

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.uniform1f(tLocation, time);

        gl.uniform3fv(coordsLocation, input.getCoords());

        gl.uniform3fv(targetLocation, input.getTarget());

        gl.drawArrays(gl.TRIANGLES, 0, count);

        const end = performance.now();

        dt = (end - start) * 0.001;

        start = end;

        time += dt;

        requestAnimationFrame(renderOneFrame);
    };

    requestAnimationFrame(renderOneFrame);
};

run();
