const webpack = require('webpack');

module.exports = {
    entry: './summarize-pad.js',
    output: {
        filename: 'summarize-pad.min.js'
    },
    module: {
        rules: [
            {
                test: /\.js$/, use: [
                    {
                        loader: 'babel-loader', query: {
                            presets: ['es2015']
                        }
                    }
                ]
            },
            {
                test: /\.html$/, use: [
                    {
                        loader: 'html-loader',
                        query: {
                            minimize: true,
                            exportAsEs6Default: true
                        }
                    }
                ]
            },
            {
                test: /\.css$/, use: [
                    'raw-loader',
                    {
                        loader: 'postcss-loader',
                        options: {
                            plugins: [
                                require('cssnano')({ safe: true })
                            ]
                        }
                    }
                ]
            }
        ]
    },
    plugins: [
        new webpack.optimize.UglifyJsPlugin()
    ]
};