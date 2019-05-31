const webpack = require('webpack')
const path = require('path')
const fs = require('fs')
const CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = 
{
  entry: {
    index: "./src/index.js",
    createGroup: "./src/createGroup.js",
    studyGroup: "./src/studyGroup.js",
    userPage: "./src/userPage.js",
    // common: "./src/common.js",
  },
  mode: 'development',
  output: {    
    path: path.resolve(__dirname, 'dist'),
    filename: "[name].js",
  },
  plugins: [   
    new webpack.DefinePlugin({
      DEPLOYED_ADDRESS: JSON.stringify(fs.readFileSync('deployedAddress', 'utf8').replace(/\n|\r/g, "")),
      DEPLOYED_ABI: fs.existsSync('deployedABI') && fs.readFileSync('deployedABI', 'utf8'),
      //두 정보를 읽어 상수로 등록
    }),
    new CopyWebpackPlugin(
      [
        { from: "./src/index.html", to: "index.html"}, 
        { from: "./src/studyGroup.html", to: "studyGroup.html"},
        { from: "./src/createGroup.html", to: "createGroup.html"},
        { from: "./src/userPage.html", to: "userPage.html"}
      ])
  ],
  devServer: { contentBase: path.join(__dirname, "dist"), compress: true, disableHostCheck: true, host: "0.0.0.0", port: 5555 }
}