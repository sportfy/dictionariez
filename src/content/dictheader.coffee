import 'bootstrap/dist/css/bootstrap.min.css'
import '../vendor/font-awesome.css'
import './dictheader.less'

import $ from 'jquery'
import angular from 'angular'
import utils from "utils"

import 'angular-route'
import 'angular-sanitize'
import 'angular-ui-bootstrap'
# import '../needsharebutton.min.js'

import _ from 'lodash'

import './starrr.js'

import headerDom from '../header.html'

dictApp = angular.module('fairyDictApp', ['ui.bootstrap', 'ngSanitize'])
dictApp.run ($rootScope)->
    $rootScope._ = _

dictApp.controller 'dictCtrl', ($scope, $sce) ->
    console.log "[dictCtrl] init"

    # change Bing dictionary's title
    document.title = 'Fairy Dict'
    baseNode = '#fairy-dict'
    $scope.initial = true
    $scope.inFrame = window.self != window.top
    $scope.querying = false
    $scope.previous = null

    chrome.runtime.sendMessage {
        type: 'dictionary',
        # origin: window.top?.location?.origin,
        # url: window.top?.location?.href
    }, ({dictionary, allDicts, previous, w})->
        console.log "[dict] all dicts: ", allDicts
        $scope.allDicts = allDicts
        $scope.currentDictionary = allDicts.find (d)->
            d.dictName == dictionary
        $scope.currentDictionary ?= allDicts[0]
        $scope.previous = previous
        $scope.word = w
        $scope.$apply()

    chrome.runtime.sendMessage {
        type: 'setting'
    }, (setting)->
        $scope.setting = setting

    $scope.changeDict = (dict)->
        ci = $scope.allDicts.findIndex (d)->
            d.dictName == $scope.currentDictionary.dictName

        if dict == 'next'
            idx = (ci+1) % $scope.allDicts.length
            $scope.currentDictionary = $scope.allDicts[idx]
        else if dict == 'prev'
            idx = if ci > 0 then ci-1 else ($scope.allDicts.length-1)
            $scope.currentDictionary = $scope.allDicts[idx]
        else
            $scope.currentDictionary = dict
        $scope.query(true)

    $scope.selectHistory = (index)->
        $scope.word = $scope.previous.w
        $scope.query()

    $scope.query = ()->
        if not $scope.word or not $scope.currentDictionary
            $scope.initial = true
            return

        # console.log "[dictCtrl] query `#{$scope.word}` from #{$scope.currentDictionary.dictName}"
        $scope.initial = false
        $scope.querying = true

        chrome.runtime.sendMessage({
            type: 'query',
            w: $scope.word,
            dictionary: $scope.currentDictionary.dictName,
        }, (data) ->
            console.log data
            result = data.result
            window.top.location.href = result.windowUrl
        )

    chrome.runtime.onMessage?.addListener (request, sender, sendResponse)->
        # console.log(request)
        if request.type == 'querying'
            $scope.initial = false
            $scope.querying = true
            $scope.word = request.text

        $scope.$apply()

    $('#fairy-stars', baseNode).on 'starrr:change', (e, value)->
        if $scope.word
            value ?= 0
            console.log "[dictCtrl] rating word: #{$scope.word} #{value}"
            chrome.runtime.sendMessage {
                type: 'rating',
                value: value,
                text: $scope.word
            }
            if $scope.historyIndex >= 0
                item = $scope.history[$scope.historyIndex]
                if item and item[$scope.word]?
                    item[$scope.word] = value

    $('.starrr', baseNode).starrr({numStars: 3})

    updateRating = (value)->
        obj = $(".starrr", baseNode).data('star-rating')
        obj.options.rating = value
        obj.syncRating()

    _handler = (evt)->
        node = $(event.target)
        if node.is('.sound')
            a = node.next('audio')
            if a.length
                a[0].play()

    $(document).mouseover _handler
    $(document).click _handler

    $(document).keyup (evt)->
        code = evt.charCode or evt.keyCode
        if code == 27
            $('input.dict-input', baseNode)[0].select()

    $(document).keydown (evt)->
        code = evt.charCode or evt.keyCode
        prevSK = $scope.setting.prevDictSK1
        nextSK = $scope.setting.nextDictSK1
        prevKey = $scope.setting.prevDictKey
        nextKey = $scope.setting.nextDictKey
        stop = false

        if utils.checkEventKey evt, prevSK, null, prevKey
            $scope.changeDict('prev')
            stop = true
        if utils.checkEventKey evt, nextSK, null, nextKey
            $scope.changeDict('next')
            stop = true
        if utils.checkEventKey evt, $scope.setting.prevHistorySK1, null, $scope.setting.prevHistoryKey
            $scope.selectHistory('prev')
            stop = true
        if utils.checkEventKey evt, $scope.setting.nextHistorySK1, null, $scope.setting.nextHistoryKey
            $scope.selectHistory('next')
            stop = true
        if stop
            evt.preventDefault()
            evt.stopPropagation()
    return

$(document.body).append(headerDom)
angular.bootstrap(document.getElementById('fairy-dict'), ['fairyDictApp'])