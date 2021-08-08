const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');

module.exports = {
    entry: './src/main.js',
    mode: "development",
    devtool: false,
    output: {
        filename: "main.js",
        path: path.resolve(__dirname, './dist'),
    },
    plugins: [
        new HtmlWebpackPlugin({
            title: 'Remote Dynamixel',
            filename: 'index.html',
            inject: false,
        })
    ]
};