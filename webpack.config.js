const path = require('path');

const findPort = require('find-port');

const host = '0.0.0.0';
const getPort = () => new Promise(resolve => findPort(host, 9000, 9010, ps => resolve(ps[0])));

module.exports = getPort().then((port) => ({
    context: path.join(__dirname, 'src'),
    mode: 'development',
    entry: './index.js',
    devtool: 'source-map',
    output: {
        path: path.resolve(__dirname, './dist'),
        filename: '[name].js',
        publicPath: '',
        globalObject: 'this'
    },
    module: {
        rules: [
            {
                test: /\.(?:frag|vert|glsl)$/,
                use: 'raw-loader'
            }
        ]
    },
    devServer: {
        port, host,
        contentBase: path.resolve(__dirname, 'public'),
        disableHostCheck: true,
    }
}));
