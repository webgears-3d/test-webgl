
class MouseInput
{
    static get STATE() {
        return class _STATE {
            static get NONE() { return 0; }
            static get ROTATE() { return 1; }
            static get PAN() { return 2; }
            static get ZOOM() { return 2; }
        };
    }

    constructor(surface) {
        this._addListeners(surface);
        this._dolly = 0.0;
        this._dumping = 0.9;
        this._distance = 1.0;
        this._azimuth = -Math.PI / 2.0;
        this._polar = Math.PI / 2.0;
        this._rotateStart = { x: 0.0, y: 0.0 };
        this._rotate = { x: 0.0, y: 0.0 };
        this._target = { x: 0.0, y: 0.0, z: 0.0 };
        this._panStart = { x: 0.0, y: 0.0, z: 0.0 };
        this._pan = { x: 0.0, y: 0.0, z: 0.0 };
        this._state = MouseInput.STATE.NONE;

        this._addListeners(surface);
    }

    _addListeners(surface) {
        surface.addEventListener('mousedown', (event) => {
            const onContextMenu = (e) => {
                surface.removeEventListener('contextmenu', onContextMenu);
                e.preventDefault();
            };
            surface.addEventListener('contextmenu', onContextMenu);

            switch (event.button) {
                case 0:
                    this._state = MouseInput.STATE.ROTATE;
                    this._rotateStart.x = event.clientX;
                    this._rotateStart.y = event.clientY;

                    break;
                case 1:
                    this._state = MouseInput.STATE.ZOOM;
                    break;
                case 2:
                    this._state = MouseInput.STATE.PAN;
                    break;
                default:
                    this._state = MouseInput.STATE.NONE;
            }

            return false;
        }, false);

        surface.addEventListener('mouseup', (event) => {
            event.preventDefault();
            event.stopPropagation();

            this._state = MouseInput.STATE.NONE;
        }, false);

        surface.addEventListener('wheel', (event) => {
            event.preventDefault();

            if (event.deltaY > 0) {
                this._dolly -= 0.01;
            } else if (event.deltaY < 0){
                this._dolly += 0.01;
            }
        }, false);

        surface.addEventListener('mousemove', (event) => {
            if (this._state === MouseInput.STATE.ROTATE) {
                this._rotate.x = 2.0 * Math.PI * 2.0 * (event.clientX - this._rotateStart.x) / surface.clientHeight;
                this._rotate.y = 2.0 * Math.PI * 2.0 * (event.clientY - this._rotateStart.y) / surface.clientHeight;
            } else if (this._state === MouseInput.STATE.PAN) {
                this._pan.x =  (event.clientX - this._panStart.x) / surface.clientHeight;
                this._pan.y = (event.clientY - this._panStart.y) / surface.clientHeight;
            }
        }, false);
    }

    update(dt) {
        const  { _dolly, _dumping, _rotate, _pan } = this;

        let dz = _dolly;
        let da = _rotate.x;
        let dp = _rotate.y;

        let dtx = _pan.x;
        let dty = _pan.y;

        this._distance += dz;
        this._distance = Math.max(0.2, Math.min(5.1, this._distance));

        dz -= dz * (1.0 - _dumping);

        dz = Math.abs(dz) < 0.1e-3 ? 0.0 : dz;

        this._azimuth += da * dt;
        this._polar -= dp * dt;
        this._polar = Math.min((Math.PI / 2.0), Math.max(0.1, this._polar));

        this._target.x += dtx * dt;
        dtx -= dtx * (1.0 - _dumping);

        da -= da * (1.0 - _dumping);
        dp -= dp * (1.0 - _dumping);

        this._dolly = dz;

        _rotate.x = da;
        _rotate.y = dp;

        _pan.x = dtx;
        _pan.y = dty;
    }

    get distance() {
        return this._distance;
    }
}

Object.assign(MouseInput.prototype, {
    getCoords: (function _getCoords() {
        const coords = [];

        return function getCoords() {
            const { _azimuth, _polar, _distance } = this;
            coords[0] = _azimuth;
            coords[1] = _polar;
            coords[2] = _distance;

            return coords;
        };
    }()),

    getTarget: (function _getTarget() {
        const target = [0.0, 0.0, 0.0];

        return function getTarget() {
            return target;
        };
    }())
});

export { MouseInput };
