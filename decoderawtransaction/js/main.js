'use strict';

var angular = require('./node_modules/angular');

var ParserCtrl = require('./controllers/parserCtrl');

var app = angular.module('btcApp', []);

app.controller('ParserCtrl', ['$scope', ParserCtrl]);
