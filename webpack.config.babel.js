import webpack from 'webpack';
import path from 'path';
import FlowBabelWebpackPlugin from 'flow-babel-webpack-plugin';

const ENV = process.env.NODE_ENV || 'development';

module.exports = {
    context: path.resolve(__dirname,'src'),
    entry: './Shell.js',
    
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'JGShell.js',
        library: "JGShell",
        libraryTarget: "umd"        
    },
    
    externals: {
        "lodash": {
            commonjs: "lodash",
            commonjs2: "lodash",
            amd: "lodash",
            root: "_",
        },
        "ReteNet": "rete.ReteNet"
    },

    resolve:{
        modules: [ path.resolve(__dirname, "src"),
                   path.resolve(__dirname,"libs"),
                   "node_modules"
                 ]
    },
    
    module:{
        rules:[
            {test:/\.js$/, exclude: /node_modules/, enforce: 'pre', loader: 'eslint-loader'},
            {test: /\.js$/, exclude: /node_modules/, loader: "babel-loader" },
        ]
    },

    plugins: [
        new FlowBabelWebpackPlugin(),
        // new webpack.optimize.UglifyJsPlugin({
        //     sourceMap: true
        // })
    ],
};
