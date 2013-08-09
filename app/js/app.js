function SequenceEditor(appState, arrangementService) {
    return {
        restrict: "E",
        scope: false,
        link: function ($scope, element, attrs) {
            var wrapperEl = element.find(".wrapper");
            $scope.appState = appState;
            $scope.availablePatterns = [];
            $scope.$watch("appState.a.patterns.length", function (value) {
                $scope.availablePatterns = getAvailablePatterns();
            });
            $scope.$watch("appState.a", function (value) {
                $scope.availablePatterns = getAvailablePatterns();
            });
            $scope.$watch("appState.ps.currentSequenceIndex", function (value) {
                var elWidth = element.width();
                var cellWidth = appState.cellWidth;
                var cellHeight = appState.cellHeight;
                var totalWidth = appState.a.sequence.length * cellWidth;
                var left = cellWidth;
                if(totalWidth > elWidth) {
                    left = value * cellWidth * -1 + (elWidth / 2);
                    if(left > cellWidth) {
                        left = cellWidth;
                    }
                    if(totalWidth > elWidth && left < elWidth - totalWidth - cellWidth) {
                        left = elWidth - totalWidth - cellWidth;
                    }
                }
                wrapperEl.css({
                    "-webkit-transform": "translate(" + left + "px,0)"
                });
            });
            $scope.add = function () {
                var currentPatternIndex = appState.a.sequence[appState.ps.currentSequenceIndex];
                var currentPattern = appState.a.patterns[currentPatternIndex];
                appState.a.sequence.splice(appState.ps.currentSequenceIndex, 0, currentPatternIndex);
            };
            $scope.clone = function () {
                var currentPatternIndex = appState.a.sequence[appState.ps.currentSequenceIndex];
                var currentPattern = appState.a.patterns[currentPatternIndex];
                var pattern = $.extend(true, {
                }, {
                    pattern: currentPattern
                });
                pattern = pattern.pattern;
                appState.a.sequence.push(appState.a.patterns.length);
                appState.a.patterns.push(pattern);
                var time = arrangementService.getTimeForSequence(appState.a, appState.a.sequence.length - 1, 0);
                $scope.$emit("seek", time);
            };
            $scope.remove = function () {
                if(appState.a.sequence.length > 1) {
                    appState.a.sequence.splice(appState.ps.currentSequenceIndex, 1);
                    var index = appState.ps.currentSequenceIndex;
                    if(appState.ps.currentSequenceIndex >= appState.a.sequence.length) {
                        index--;
                    }
                    var time = arrangementService.getTimeForSequence(appState.a, index, 0);
                    $scope.$emit("seek", time);
                }
            };
            $scope.loop = function () {
                var currentPatternIndex = appState.a.sequence[appState.ps.currentSequenceIndex];
                var triggers = appState.a.patterns[currentPatternIndex];
                var patternLength = triggers[0].length;
                var emptyChannel = [];
                var time = arrangementService.getTimeForSequence(appState.a, appState.ps.currentSequenceIndex, 0);
                $scope.$emit("loop", triggers, time);
            };
            function getAvailablePatterns() {
                var results = [];
                for(var i = 0; i < appState.a.patterns.length; i++) {
                    results.push(i);
                }
                return results;
            }
            $scope.onSequenceClick = function () {
                $scope.$emit("stop");
                var time = arrangementService.getTimeForSequence(appState.a, this.$index, 0);
                $scope.$emit("seek", time);
            };
        }
    };
}
SequenceEditor["$inject"] = [
    "appState", 
    "arrangementService"
];
function Grid(musicTheory, appState, arrangementService) {
    return {
        restrict: "E",
        scope: {
            scroll: '=',
            currentPattern: '='
        },
        link: function ($scope, element, attrs) {
            var triggersEl = element.find(".triggers");
            var gridBackgroundEl = element.find(".grid-background");
            var playheadEl = element.find(".playhead");
            var contentEl = element.find(".content");
            $scope.appState = appState;
            $scope.selectedTrigger = null;
            $scope.selectedTriggerIndex = 0;
            $scope.selectedChannelIndex = 0;
            $scope.$watch("currentPattern", function () {
                appState.selection = null;
                refreshGrid();
            });
            $scope.$watch("appState.ps.currentTime", function () {
                scrollToCurrentTime();
            });
            $scope.$on("onPatternChange", function (e, selection) {
                refreshGrid(selection);
            });
            $scope.$watch("scroll.scrollX", function (value) {
                if(lastViewport && Math.abs(value - lastViewport.x) > bufferX / 2) {
                    renderViewport();
                }
                element.scrollLeft(value);
            });
            $scope.$watch("scroll.scrollY", function (value) {
                if(lastViewport && Math.abs(value - lastViewport.y) > bufferY / 2) {
                    renderViewport();
                }
                element.scrollTop(value);
            });
            function scrollToCurrentTime() {
                if(!$scope.currentPattern) {
                    return;
                }
                var x = appState.ps.currentRowIndex * appState.cellWidth;
                var y = appState.selection ? appState.selection.lastChannel * appState.cellHeight : 0;
                $scope.scroll = scrollIntoView(x, y, $scope.scroll);
            }
            function scrollIntoView(x, y, scrollState) {
                var currentPattern = $scope.currentPattern;
                var cellWidth = appState.cellWidth;
                var cellHeight = appState.cellHeight;
                var gridWidth = currentPattern[0].length * cellWidth;
                var gridHeight = currentPattern.length * cellHeight;
                var paddingX = cellWidth * 2;
                var paddingY = cellHeight * 2;
                var viewportWidth = element.width();
                var viewportHeight = element.height();
                var maxScrollX = Math.max(gridWidth + cellWidth - viewportWidth, 0);
                var maxScrollY = Math.max(gridHeight + cellHeight - viewportHeight, 0);
                var scrollX = scrollState.scrollX;
                var scrollY = scrollState.scrollY;
                if(gridWidth > viewportWidth) {
                    if(x > scrollX + viewportWidth - paddingX - cellWidth) {
                        scrollX = x + paddingX + cellWidth - viewportWidth;
                    } else if(x < scrollX + paddingX) {
                        scrollX = x - paddingX;
                    }
                    if(scrollX < 0) {
                        scrollX = 0;
                    }
                }
                if(gridHeight > viewportHeight) {
                    if(y > scrollY + viewportHeight - paddingY - cellHeight) {
                        scrollY = y + paddingY + cellHeight - viewportHeight;
                    } else if(y < scrollY + paddingY) {
                        scrollY = y - paddingY;
                    }
                    if(scrollY < 0) {
                        scrollY = 0;
                    }
                }
                return {
                    scrollY: Math.round(Math.min(scrollY, maxScrollY)),
                    scrollX: Math.round(Math.min(scrollX, maxScrollX)),
                    maxScrollX: maxScrollX,
                    maxScrollY: maxScrollY
                };
            }
            function refreshGrid(selection) {
                var currentPattern = $scope.currentPattern;
                if(!currentPattern) {
                    return;
                }
                if(!selection) {
                    playheadEl.height(currentPattern.length * appState.cellHeight - 1);
                    triggersEl.css({
                        width: (appState.cellWidth * (currentPattern[0].length + 1)) + "px",
                        height: (appState.cellHeight * (currentPattern.length + 1)) + "px"
                    });
                    gridBackgroundEl.css({
                        width: (appState.cellWidth * (currentPattern[0].length)) + "px",
                        height: (appState.cellHeight * (currentPattern.length)) + "px"
                    });
                    activeRenderersList = [];
                    activeRenderers = (function () {
                        var results = [];
                        for(var i = 0; i < currentPattern.length; i++) {
                            results[i] = [];
                        }
                        return results;
                    })();
                    triggersEl.html("");
                    renderViewport();
                } else {
                    var trigger;
                    for(var i = selection.startChannel; i <= selection.endChannel; i++) {
                        for(var j = selection.startPosition; j <= selection.endPosition; j++) {
                            trigger = currentPattern[i][j];
                            var r = activeRenderers[i][j];
                            if(trigger.vol != 0 && r == null) {
                                var el = $('<div class="grid-trigger cellWidth cellHeight c' + j + ' r' + i + '">' + renderTrigger(trigger) + '</div>').appendTo(triggersEl);
                                var renderer = {
                                    position: j,
                                    channel: i,
                                    renderer: el,
                                    trigger: trigger
                                };
                                activeRenderersList.push(renderer);
                                activeRenderers[i][j] = renderer;
                            } else if(r) {
                                r.trigger = trigger;
                                r.renderer.html(renderTrigger(trigger));
                            }
                        }
                    }
                }
            }
            var bufferX = 400;
            var bufferY = 600;
            var lastViewport;
            var activeRenderers;
            var activeRenderersList;
            var renderBufferTime;
            function renderViewport() {
                window["webkitCancelAnimationFrame"](renderBufferTime);
                renderBufferTime = window["webkitRequestAnimationFrame"](function () {
                    var start = new Date();
                    var currentPattern = $scope.currentPattern;
                    var rect = {
                        x: element.scrollLeft(),
                        y: element.scrollTop(),
                        w: element.width(),
                        h: element.height()
                    };
                    var startChannel = Math.max(0, Math.floor((rect.y - bufferY) / appState.cellHeight));
                    var endChannel = Math.min(currentPattern.length - 1, Math.floor((rect.y + rect.h + bufferY) / appState.cellHeight));
                    var startPosition = Math.max(0, Math.floor((rect.x - bufferX) / appState.cellWidth));
                    var endPosition = Math.min(currentPattern[0].length, Math.floor((rect.x + rect.w + bufferX) / appState.cellWidth));
                    var active = [];
                    var renderer;
                    for(var i = 0; i < activeRenderersList.length; i++) {
                        renderer = activeRenderersList[i];
                        if(renderer.position < startPosition || renderer.channel < startChannel || renderer.channel > endChannel || renderer.position > endPosition || renderer.trigger.vol == 0) {
                            renderer.renderer.remove();
                            activeRenderers[renderer.channel][renderer.position] = null;
                        } else {
                            active.push(renderer);
                        }
                    }
                    activeRenderersList = active;
                    var trigger;
                    var newNodes = [];
                    for(var i = startChannel; i <= endChannel; i++) {
                        for(var j = startPosition; j <= endPosition; j++) {
                            renderer = activeRenderers[i][j];
                            trigger = currentPattern[i][j];
                            if(trigger && trigger.vol != 0 && renderer == null) {
                                var el = $('<div class="grid-trigger cellWidth cellHeight c' + j + ' r' + i + '">' + renderTrigger(trigger) + '</div>');
                                newNodes.push(el);
                                renderer = {
                                    position: j,
                                    channel: i,
                                    renderer: el,
                                    trigger: trigger
                                };
                                activeRenderersList.push(renderer);
                                activeRenderers[i][j] = renderer;
                            }
                        }
                    }
                    triggersEl.append(newNodes);
                    lastViewport = rect;
                });
            }
            function renderTrigger(input) {
                if(input && input.vol > 0) {
                    var vol = Math.min(Math.floor(input.vol * 100), 99);
                    return musicTheory.noteName(input.note) + " " + vol;
                } else if(input && input.vol < 0) {
                    return "OFF";
                }
                return "";
            }
            var startMouseX = 0;
            var startMouseY = 0;
            var lastMouseX = 0;
            var lastMouseY = 0;
            var lastNote = 48;
            var lastVol = 0.5;
            var selectionInterval = 0;
            var tapStart;
            var touchEnabled = false;
            if('ontouchstart' in window) {
                touchEnabled = true;
            }
            triggersEl.on(touchEnabled ? "touchstart" : "mousedown", function (evt) {
                var originalEvent = evt.originalEvent;
                var touches = originalEvent.touches;
                evt.preventDefault();
                $scope.$emit("stop");
                var gridOffset = contentEl.offset();
                lastMouseX = (touches ? touches[0].pageX : evt.pageX);
                lastMouseY = (touches ? touches[0].pageY : evt.pageY);
                startMouseX = lastMouseX - gridOffset.left;
                startMouseY = lastMouseY - gridOffset.top;
                tapStart = evt.timeStamp;
                updateSelection();
                clearInterval(selectionInterval);
                selectionInterval = setTimeout(function () {
                    clearInterval(selectionInterval);
                    updateSelection();
                    selectionInterval = setInterval(updateSelection, 100);
                }, 300);
                $(document.body).bind(touchEnabled ? "touchmove" : "mousemove", function (evt) {
                    var originalEvent = evt.originalEvent;
                    var touches = originalEvent.touches;
                    evt.preventDefault();
                    lastMouseX = (touches ? touches[0].pageX : evt.pageX);
                    lastMouseY = (touches ? touches[0].pageY : evt.pageY);
                });
                $(document.body).bind("mouseup touchend touchcancel", function (evt) {
                    var time = arrangementService.getTimeForSequence(appState.a, appState.ps.currentSequenceIndex, appState.selection.startPosition);
                    $scope.$emit("seek", time);
                    clearInterval(selectionInterval);
                    $(document.body).unbind("mouseup touchend touchcancel touchmove mousemove");
                });
            });
            function updateSelection() {
                var currentPattern = $scope.currentPattern;
                var gridOffset = contentEl.offset();
                var pos1 = Math.floor((startMouseX) / appState.cellWidth);
                var pos2 = Math.floor((lastMouseX - gridOffset.left) / appState.cellWidth);
                var maxPos = currentPattern[0].length - 1;
                pos1 = Math.min(pos1, maxPos);
                pos2 = Math.min(pos2, maxPos);
                pos1 = Math.max(pos1, 0);
                pos2 = Math.max(pos2, 0);
                var ch1 = Math.floor((startMouseY) / appState.cellHeight);
                var ch2 = Math.floor((lastMouseY - gridOffset.top) / appState.cellHeight);
                var maxChannel = currentPattern.length - 1;
                ch1 = Math.min(ch1, maxChannel);
                ch2 = Math.min(ch2, maxChannel);
                ch1 = Math.max(ch1, 0);
                ch2 = Math.max(ch2, 0);
                var menuPosition = "";
                if(pos2 > pos1 || Math.min(pos1, pos2) == 0) {
                    menuPosition += "right ";
                }
                if(Math.min(ch1, ch2) == 0 && Math.abs(ch1 - ch2) < 3) {
                    menuPosition += "top";
                }
                if(Math.max(ch1, ch2) == maxChannel && Math.abs(ch1 - ch2) < 3) {
                    menuPosition += "bottom";
                }
                $scope.$apply(function () {
                    appState.selection = {
                        startChannel: Math.min(ch1, ch2),
                        endChannel: Math.max(ch1, ch2),
                        startPosition: Math.min(pos1, pos2),
                        endPosition: Math.max(pos1, pos2),
                        lastPosition: pos2,
                        lastChannel: ch2
                    };
                    $scope.scroll = scrollIntoView(pos2 * appState.cellWidth, ch2 * appState.cellHeight, $scope.scroll);
                });
            }
            var maxPatternLength = 32;
            var styleNode;
            $scope.$watch("currentPattern[0].length", function (value) {
                if(value > maxPatternLength) {
                    maxPatternLength = value;
                    updateGridHighlights();
                }
            });
            $scope.$watch("appState.a.highlight1", updateGridHighlights);
            $scope.$watch("appState.a.highlight2", updateGridHighlights);
            function updateGridHighlights() {
                if(styleNode) {
                    styleNode.remove();
                }
                var styles = '';
                styles += '.position-labels .label:nth-child(' + appState.a.highlight1 + 'n+1){background-color:#DEF;}';
                styles += '.position-labels div.label:nth-child(' + appState.a.highlight2 + 'n+1){background-color:#C2DBF3;}';
                styleNode = $("<style>" + styles + "</style>").appendTo(document.body);
                var h1 = appState.a.highlight1;
                var h2 = appState.a.highlight2;
                var html = "";
                for(var i = 0; i < maxPatternLength; i++) {
                    if(i % h2 == 0) {
                        html += '<div class="h2 cellWidth c' + i + '"></div>';
                    } else if(i % h1 == 0) {
                        html += '<div class="h1 cellWidth c' + i + '"></div>';
                    }
                }
                gridBackgroundEl.html(html);
            }
        }
    };
}
Grid["$inject"] = [
    "musicTheory", 
    "appState", 
    "arrangementService"
];
function Scrollbar() {
    return {
        restrict: "E",
        scope: {
            scroll: '=',
            direction: '='
        },
        template: '<div class="wrapper"><div class="handle" ng-style="handleStyle()" ></div></div>',
        link: function ($scope, element, attrs) {
            var handle = element.find('.handle');
            var wrapper = element.find('.wrapper');
            var minScroll = 5;
            var startMouse;
            var startHandle = 5;
            var lastMouse;
            if(attrs.direction == 'H') {
                element.addClass('horizontal');
                handle.bind('mousedown touchstart', function (evt) {
                    var originalEvent = evt.originalEvent;
                    var touches = originalEvent.touches;
                    evt.preventDefault();
                    startMouse = (touches ? touches[0].pageX : evt.pageX);
                    startHandle = parseFloat(handle.css("left"));
                    var maxScroll = element.width() - (minScroll * 2) - handle.width();
                    $(document.body).bind("touchmove mousemove", function (evt) {
                        evt.preventDefault();
                        lastMouse = (touches ? touches[0].pageX : evt.pageX);
                        var value = startHandle + lastMouse - startMouse - minScroll;
                        var scroll = (value / maxScroll) * $scope.scroll.maxScrollX;
                        scroll = Math.max(0, scroll);
                        scroll = Math.min(scroll, $scope.scroll.maxScrollX);
                        $scope.$apply(function () {
                            $scope.scroll.scrollX = Math.round(scroll);
                        });
                    });
                    $(document.body).bind("mouseup touchend touchcancel", function (evt) {
                        $(document.body).unbind("mouseup touchend touchcancel touchmove mousemove");
                    });
                });
            } else {
                element.addClass('vertical');
                handle.bind('mousedown touchstart', function (evt) {
                    var originalEvent = evt.originalEvent;
                    var touches = originalEvent.touches;
                    startMouse = (touches ? touches[0].pageY : evt.pageY);
                    startHandle = parseFloat(handle.css("top"));
                    var maxScroll = element.height() - (minScroll * 2) - handle.height();
                    $(document.body).bind("touchmove mousemove", function (evt) {
                        lastMouse = (touches ? touches[0].pageY : evt.pageY);
                        var value = startHandle + lastMouse - startMouse - minScroll;
                        var scroll = (value / maxScroll) * $scope.scroll.maxScrollY;
                        scroll = Math.max(0, scroll);
                        scroll = Math.min(scroll, $scope.scroll.maxScrollY);
                        $scope.$apply(function () {
                            $scope.scroll.scrollY = Math.round(scroll);
                        });
                    });
                    $(document.body).bind("mouseup touchend touchcancel", function (evt) {
                        $(document.body).unbind("mouseup touchend touchcancel touchmove mousemove");
                    });
                });
            }
            $scope.handleStyle = function () {
                var maxScrollSize;
                var styles = {
                };
                element.css({
                    opacity: 1
                });
                var scroll = $scope.scroll;
                var maxScroll;
                if(attrs.direction == 'H') {
                    if(scroll.maxScrollX == 0) {
                        styles.display = "none";
                        element.css({
                            opacity: 0.3
                        });
                    }
                    maxScroll = element.width() - (minScroll * 2) - handle.width();
                    styles.left = Math.round(minScroll + (scroll.scrollX / scroll.maxScrollX) * maxScroll) + "px";
                } else {
                    if(scroll.maxScrollY == 0) {
                        styles.display = "none";
                        element.css({
                            opacity: 0.3
                        });
                    }
                    maxScroll = element.height() - (minScroll * 2) - handle.height();
                    styles.top = Math.round(minScroll + (scroll.scrollY / scroll.maxScrollY) * maxScroll) + "px";
                }
                return styles;
            };
        }
    };
}
function TriggerSelectionEditor(player, musicTheory, appState, arrangementService) {
    return {
        restrict: "E",
        scope: {
            currentPattern: "=",
            scroll: '='
        },
        link: function ($scope, element, attrs) {
            $scope.appState = appState;
            $scope.single = false;
            $scope.selectedTrigger = null;
            $scope.notes = generateNoteValues();
            $scope.volumes = generateVolumeValues();
            var menuEl = element.find('.selection-menu');
            menuEl.appendTo(document.body);
            var delay = 0;
            $scope.$watch('scroll.scrollX', hideMenu);
            $scope.$watch('scroll.scrollY', hideMenu);
            $scope.$watch('appState.ps.currentTime', hideMenu);
            $scope.$watch("selectedTrigger.note", onNoteChange);
            $scope.$watch("selectedTrigger.vol", onVolumeChange);
            $scope.$watch('appState.selection', onSelectionChange);
            $scope.onCopyClick = function () {
                var triggers = arrangementService.getTriggers(appState.a, appState.a.sequence[appState.ps.currentSequenceIndex], appState.selection);
                appState.copiedTriggers = arrangementService.clonePattern(triggers);
            };
            $scope.onPasteClick = function () {
                if(!appState.copiedTriggers) {
                    return;
                }
                arrangementService.pasteTriggers(appState.copiedTriggers, appState.a, appState.a.sequence[appState.ps.currentSequenceIndex], appState.selection.startChannel, appState.selection.startPosition);
                $scope.$emit("patternChange");
            };
            $scope.onDeleteClick = function () {
                var triggers = arrangementService.getTriggers(appState.a, appState.a.sequence[appState.ps.currentSequenceIndex], appState.selection);
                arrangementService.deleteTriggers(triggers);
                $scope.$emit("patternChange");
            };
            $scope.onLoopClick = function () {
                var triggers = arrangementService.getTriggers(appState.a, appState.a.sequence[appState.ps.currentSequenceIndex], appState.selection);
                var patternLength = triggers[0].length;
                var emptyChannel = [];
                for(var i = 0; i < appState.selection.startChannel; i++) {
                    emptyChannel = [];
                    for(var j = 0; j < patternLength; j++) {
                        emptyChannel.push(arrangementService.createEmptyTrigger());
                    }
                    triggers.unshift(emptyChannel);
                }
                for(i = appState.selection.endChannel + 1; i < appState.a.channels.length; i++) {
                    emptyChannel = [];
                    for(j = 0; j < patternLength; j++) {
                        emptyChannel.push(arrangementService.createEmptyTrigger());
                    }
                    triggers.push(emptyChannel);
                }
                var time = arrangementService.getTimeForSequence(appState.a, appState.ps.currentSequenceIndex, appState.selection.startPosition);
                player.playPattern(triggers, time, 100);
            };
            var lastVol = 0.5;
            var lastNote = 48;
            element.bind("mousedown touchstart", function (evt) {
                evt.preventDefault();
                var originalEvent = evt.originalEvent;
                var touches = originalEvent.touches;
                if(!$scope.single) {
                    $scope.$apply(function () {
                        appState.selection = null;
                    });
                    return;
                }
                var startX = touches ? touches[0].pageX : evt.pageX;
                var startY = touches ? touches[0].pageY : evt.pageY;
                var startVol = $scope.selectedTrigger.vol;
                var startNote = $scope.selectedTrigger.note;
                if(startVol == 0) {
                    $scope.$apply(function () {
                        startVol = $scope.selectedTrigger.vol = lastVol;
                        startNote = $scope.selectedTrigger.note = lastNote;
                    });
                }
                $(document.body).bind("touchmove mousemove", function (evt) {
                    evt.preventDefault();
                    var x = touches ? touches[0].pageX : evt.pageX;
                    var y = touches ? touches[0].pageY : evt.pageY;
                    var dx = x - startX;
                    var dy = startY - y;
                    var note = Math.round(startNote + dy / 10);
                    if(note > 96) {
                        note = 96;
                    }
                    if(note < 0) {
                        note = 0;
                    }
                    var vol = startVol + dx / 200;
                    if(vol < 0) {
                        vol = -0.1;
                    }
                    if(vol > 1) {
                        vol = 1;
                    }
                    vol = Math.round(vol * 100) / 100;
                    $scope.$apply(function () {
                        $scope.selectedTrigger.vol = vol;
                        if($scope.selectedTrigger.note != note) {
                            $scope.selectedTrigger.note = note;
                        }
                    });
                });
                $(document.body).bind("mouseup touchend touchcancel", function () {
                    $(document.body).unbind("mouseup touchend touchcancel touchmove mousemove");
                });
            });
            function hideMenu() {
                clearTimeout(delay);
                delay = setTimeout(showMenu, 300);
                menuEl.hide();
            }
            function showMenu() {
                var selection = appState.selection;
                if(selection == null) {
                    menuEl.hide();
                } else {
                    var offset = element.offset();
                    menuEl.css({
                        top: (offset.top + element.height() / 2) + 'px',
                        left: offset.left + 'px',
                        'margin-top': (menuEl.height() / -2) + 'px'
                    });
                    menuEl.fadeIn();
                }
            }
            function onNoteChange() {
                if($scope.selectedTrigger) {
                    if($scope.selectedTrigger.vol > 0) {
                        lastNote = $scope.selectedTrigger.note;
                        lastVol = $scope.selectedTrigger.vol;
                    }
                    player.playNote(appState.selection.startChannel, $scope.selectedTrigger);
                }
                $scope.$emit("patternChange", appState.selection);
            }
            function onVolumeChange() {
                if($scope.selectedTrigger) {
                    lastVol = $scope.selectedTrigger.vol > 0 ? $scope.selectedTrigger.vol : lastVol;
                }
                $scope.$emit("patternChange", appState.selection);
            }
            function onSelectionChange(s) {
                if(s == null) {
                    element.css({
                        display: 'none'
                    });
                } else {
                    element.css({
                        height: ((1 + (s.endChannel - s.startChannel)) * appState.cellHeight) + 'px',
                        width: ((1 + (s.endPosition - s.startPosition)) * appState.cellWidth) + 'px',
                        left: (s.startPosition * appState.cellWidth) + 'px',
                        top: (s.startChannel * appState.cellHeight) + 'px',
                        display: 'block'
                    });
                }
                $scope.single = s && s.startChannel == s.endChannel && s.startPosition == s.endPosition;
                $scope.selectedTrigger = null;
                if($scope.single) {
                    $scope.selectedTrigger = $scope.currentPattern[s.startChannel][s.startPosition];
                }
                hideMenu();
            }
            function generateVolumeValues() {
                var results = [];
                results.push({
                    value: -1,
                    text: "0FF"
                });
                for(var i = 0; i < 100; i++) {
                    results.push({
                        value: i / 100,
                        text: i
                    });
                }
                return results;
            }
            function generateNoteValues() {
                var results = [];
                for(var i = 0; i < 96; i++) {
                    results.push({
                        value: i,
                        text: musicTheory.noteName(i)
                    });
                }
                return results;
            }
        }
    };
}
TriggerSelectionEditor["$inject"] = [
    "player", 
    "musicTheory", 
    "appState", 
    "arrangementService"
];
function IScroll() {
    return {
        restrict: "E",
        link: function ($scope, element, attrs) {
            new iScroll(element[0]);
        }
    };
}
var BrowserAudioContext = (function () {
    function BrowserAudioContext() { }
    BrowserAudioContext.getInstance = function getInstance() {
        if(!BrowserAudioContext.instance) {
            try  {
                BrowserAudioContext.instance = new webkitAudioContext();
            } catch (e) {
                console.log(e);
            }
        }
        return BrowserAudioContext.instance;
    };
    return BrowserAudioContext;
})();
var ArrangementService = (function () {
    function ArrangementService(musicTheory, $http, $q) {
        this.musicTheory = musicTheory;
        this.$http = $http;
        this.$q = $q;
        this.fillTypes = [
            'Arpeggio ASC', 
            'Arpeggio DESC', 
            'Arpeggio ASC DESC', 
            'Arpeggio DESC ASC', 
            'Random'
        ];
    }
    ArrangementService.$inject = [
        "musicTheory", 
        "$http", 
        "$q"
    ];
    ArrangementService.SONG_PREFIX = "Song Name ";
    ArrangementService.prototype.getArrangementList = function () {
        var me = this;
        var defer = me.$q.defer();
        var songList = localStorage.getItem("SongList") || "{}";
        songList = JSON.parse(songList);
        var songListArray = [];
        for(var p in songList) {
            songListArray.push(p);
        }
        defer.resolve(songListArray);
        return defer.promise;
    };
    ArrangementService.prototype.openArrangement = function (url) {
        var me = this;
        var defer = me.$q.defer();
        me.$http.get(url).success(function (data, status, headers, config) {
            data.patterns = me.decompressPattern(data.patterns);
            defer.resolve(data);
        });
        return defer.promise;
    };
    ArrangementService.prototype.openLocalArrangement = function (title) {
        var me = this;
        var defer = me.$q.defer();
        var song = localStorage.getItem(ArrangementService.SONG_PREFIX + title);
        if(song) {
            song = me.decompressPattern(JSON.parse(song));
        }
        defer.resolve(song);
        return defer.promise;
    };
    ArrangementService.prototype.saveLocalArrangement = function (arrangement) {
        arrangement.date = new Date().getTime();
        arrangement = angular.copy(arrangement);
        arrangement.patterns = this.compressPatterns(arrangement.patterns);
        var songList = localStorage.getItem("SongList") || "{}";
        songList = JSON.parse(songList);
        songList[arrangement.title] = true;
        console.log(JSON.stringify(arrangement));
        localStorage.setItem("SongList", JSON.stringify(songList));
        localStorage.setItem(ArrangementService.SONG_PREFIX + arrangement.title, JSON.stringify(arrangement));
    };
    ArrangementService.prototype.compressPatterns = function (patterns) {
        patterns = angular.copy(patterns);
        var pattern;
        var trigger;
        for(var k = 0; k < patterns.length; k++) {
            pattern = patterns[k];
            for(var i = 0; i < pattern.length; i++) {
                for(var j = 0; j < pattern[i].length; j++) {
                    trigger = pattern[i][j];
                    pattern[i][j] = trigger.vol == 0 ? 0 : trigger;
                }
            }
        }
        return patterns;
    };
    ArrangementService.prototype.decompressPattern = function (patterns) {
        var me = this;
        patterns = angular.copy(patterns);
        var pattern;
        var trigger;
        for(var k = 0; k < patterns.length; k++) {
            pattern = patterns[k];
            for(var i = 0; i < pattern.length; i++) {
                for(var j = 0; j < pattern[i].length; j++) {
                    trigger = pattern[i][j];
                    pattern[i][j] = trigger === 0 ? me.createEmptyTrigger() : trigger;
                }
            }
        }
        return patterns;
    };
    ArrangementService.prototype.createMockArrangement = function () {
        var me = this;
        var majorTones = me.musicTheory.chords.Major;
        var data = {
            bpm: 80,
            title: "",
            description: '',
            channels: me.createMockChannels(10),
            highlight1: 4,
            highlight2: 16,
            patterns: [
                me.createMockPattern(10, 16, 1, me.musicTheory.transposeNotes(me.musicTheory.chords.Major, 36)), 
                me.createMockPattern(10, 64, 2, me.musicTheory.transposeNotes(me.musicTheory.chords.Minor, 40)), 
                me.createMockPattern(10, 12, 4, me.musicTheory.transposeNotes(me.musicTheory.chords.Minor, 38)), 
                me.createMockPattern(10, 12, 1, me.musicTheory.transposeNotes(me.musicTheory.chords.Maj7, 36))
            ],
            sequence: [
                0, 
                1, 
                2, 
                3, 
                0, 
                1, 
                2, 
                3, 
                0, 
                1, 
                2, 
                3
            ],
            date: new Date().getTime()
        };
        return data;
    };
    ArrangementService.prototype.createEmptyArrangement = function () {
        var me = this;
        var data = {
            bpm: 80,
            highlight1: 4,
            highlight2: 16,
            title: "",
            description: '',
            channels: me.createMockChannels(10),
            patterns: [
                me.createEmptyPattern(10, 16)
            ],
            sequence: [
                0, 
                0
            ],
            date: new Date().getTime()
        };
        return data;
    };
    ArrangementService.prototype.createMockChannels = function (channelCount) {
        var data = [];
        for(var i = 0; i < 3; i++) {
            data.push({
                vol: 1,
                pan: i % 2 == 0 ? -0.1 : 0.1,
                source: {
                    "name": "Drums I",
                    "type": "wavTable",
                    "data": [
                        {
                            "note": 36,
                            "url": "data/drums1/TTloBrushkit.mp3"
                        }, 
                        {
                            "note": 38,
                            "url": "data/drums1/TThi2Brushkit.mp3"
                        }, 
                        {
                            "note": 40,
                            "url": "data/drums1/TThiBrushkit.mp3"
                        }, 
                        {
                            "note": 42,
                            "url": "data/drums1/CONGA1.mp3"
                        }, 
                        {
                            "note": 44,
                            "url": "data/drums1/CONGA2.mp3"
                        }, 
                        {
                            "note": 48,
                            "url": "data/drums1/bdBrushkit.mp3"
                        }, 
                        {
                            "note": 50,
                            "url": "data/drums1/SD6Brushkit.mp3"
                        }, 
                        {
                            "note": 51,
                            "url": "data/drums1/SD6Brushkit.mp3"
                        }, 
                        {
                            "note": 52,
                            "url": "data/drums1/CLAP1.mp3"
                        }, 
                        {
                            "note": 56,
                            "url": "data/drums1/HIHAT01.mp3"
                        }, 
                        {
                            "note": 57,
                            "url": "data/drums1/HHosBrushkit.mp3"
                        }, 
                        {
                            "note": 58,
                            "url": "data/drums1/HHo2Brushkit.mp3"
                        }, 
                        {
                            "note": 59,
                            "url": "data/drums1/TAMB.mp3"
                        }, 
                        {
                            "note": 60,
                            "url": "data/drums1/Cy1Brushkit.mp3"
                        }, 
                        {
                            "note": 62,
                            "url": "data/drums1/Cy2Brushkit.mp3"
                        }, 
                        {
                            "note": 70,
                            "url": "data/drums1/CYMBAL03.mp3"
                        }, 
                        {
                            "note": 72,
                            "url": "data/drums1/CYMBAL08.mp3"
                        }
                    ]
                }
            });
        }
        for(; i < channelCount; i++) {
            data.push({
                vol: 0.2,
                pan: i % 2 == 0 ? -0.1 : 0.1,
                source: {
                    "name": "Cello",
                    "type": "wavTable",
                    "data": [
                        {
                            "note": 24,
                            "url": "data/cello/12.mp3"
                        }, 
                        {
                            "note": 30,
                            "url": "data/cello/18.mp3"
                        }, 
                        {
                            "note": 36,
                            "url": "data/cello/24.mp3"
                        }, 
                        {
                            "note": 42,
                            "url": "data/cello/30.mp3"
                        }, 
                        {
                            "note": 48,
                            "url": "data/cello/36.mp3"
                        }, 
                        {
                            "note": 54,
                            "url": "data/cello/42.mp3"
                        }, 
                        {
                            "note": 60,
                            "url": "data/cello/48.mp3"
                        }, 
                        {
                            "note": 66,
                            "url": "data/cello/54.mp3"
                        }, 
                        {
                            "note": 72,
                            "url": "data/cello/60.mp3"
                        }
                    ]
                }
            });
        }
        return data;
    };
    ArrangementService.prototype.createMockPattern = function (channelCount, length, every, tones) {
        var me = this;
        var results = me.createEmptyPattern(channelCount, length);
        var channelIndex = 0;
        var toneIndex = 0;
        for(var rowIndex = 0; rowIndex < length; rowIndex += every) {
            results[channelIndex][rowIndex].note = tones[toneIndex];
            results[channelIndex][rowIndex].vol = 1 - ((rowIndex / length) * .7);
            channelIndex++;
            if(channelIndex >= channelCount) {
                channelIndex = 0;
            }
            toneIndex++;
            if(toneIndex >= tones.length) {
                toneIndex = 0;
            }
        }
        return results;
    };
    ArrangementService.prototype.createEmptyPattern = function (channelCount, length) {
        var results = [];
        for(var i = 0; i < channelCount; i++) {
            results[i] = [];
            for(var j = 0; j < length; j++) {
                results[i][j] = this.createEmptyTrigger();
            }
        }
        return results;
    };
    ArrangementService.prototype.clearPattern = function (arrangement, patternIndex) {
        var oldPattern = arrangement.patterns[patternIndex];
        var newPattern = this.createEmptyPattern(oldPattern.length, oldPattern[0].length);
        for(var i = 0; i < oldPattern.length; i++) {
            oldPattern[i] = newPattern[i];
        }
    };
    ArrangementService.prototype.addEmptyPatternChannel = function (arrangement, index) {
        var patternLength;
        var triggerData;
        for(var i = 0; i < arrangement.patterns.length; i++) {
            triggerData = [];
            patternLength = arrangement.patterns[i][0].length;
            for(var j = 0; j < patternLength; j++) {
                triggerData.push(this.createEmptyTrigger());
            }
            arrangement.patterns[i].splice(index, 0, triggerData);
        }
        return arrangement;
    };
    ArrangementService.prototype.removePatternChannel = function (arrangement, index) {
        if(arrangement.channels.length <= 1) {
            return arrangement;
        }
        for(var i = 0; i < arrangement.patterns.length; i++) {
            arrangement.patterns[i].splice(index, 1);
        }
        return arrangement;
    };
    ArrangementService.prototype.clearPatternChannel = function (arrangement, index) {
        this.removePatternChannel(arrangement, index);
        this.addEmptyPatternChannel(arrangement, index);
        return arrangement;
    };
    ArrangementService.prototype.transposeTriggers = function (triggers, transpose) {
        for(var i = 0; i < triggers.length; i++) {
            for(var j = 0; j < triggers[i].length; j++) {
                triggers[i][j].note += transpose;
            }
        }
    };
    ArrangementService.prototype.randomizeVolume = function (triggers, amount) {
        var vol;
        for(var i = 0; i < triggers.length; i++) {
            for(var j = 0; j < triggers[i].length; j++) {
                vol = triggers[i][j].vol;
                if(vol > 0) {
                    vol += (Math.random() * amount) - amount * 0.5;
                    vol = vol <= 0 ? triggers[i][j].vol : vol;
                    vol = Math.min(vol, 1);
                    triggers[i][j].vol = vol;
                }
            }
        }
    };
    ArrangementService.prototype.deleteTriggers = function (triggers) {
        for(var i = 0; i < triggers.length; i++) {
            for(var j = 0; j < triggers[i].length; j++) {
                triggers[i][j].vol = 0;
            }
        }
    };
    ArrangementService.prototype.autoChord = function (triggers, notes, type) {
        var me = this;
        var lastNumberIndex = 0;
        var isAsc = true;
        var getNextNote;
        function asc() {
            lastNumberIndex++;
            if(lastNumberIndex == notes.length) {
                lastNumberIndex = 0;
            }
            return notes[lastNumberIndex];
        }
        function desc() {
            lastNumberIndex--;
            if(lastNumberIndex <= 0) {
                lastNumberIndex = notes.length - 1;
            }
            return notes[lastNumberIndex];
        }
        function ascDesc() {
            if(isAsc) {
                if(lastNumberIndex + 1 == notes.length) {
                    isAsc = false;
                    return desc();
                }
                return asc();
            } else {
                if(lastNumberIndex - 1 <= 0) {
                    isAsc = true;
                    return asc();
                }
                return desc();
            }
        }
        function random() {
            return notes[Math.floor(Math.random() * notes.length)];
        }
        switch(type) {
            case me.fillTypes[0]:
                lastNumberIndex = -1;
                getNextNote = asc;
                break;
            case me.fillTypes[1]:
                lastNumberIndex = notes.length;
                getNextNote = desc;
                break;
            case me.fillTypes[2]:
                lastNumberIndex = -1;
                getNextNote = ascDesc;
                break;
            case me.fillTypes[3]:
                lastNumberIndex = notes.length;
                isAsc = false;
                getNextNote = ascDesc;
                break;
            case me.fillTypes[4]:
                getNextNote = random;
                break;
        }
        for(var i = 0; i < triggers[0].length; i++) {
            for(var j = 0; j < triggers.length; j++) {
                if(triggers[j][i].vol > 0) {
                    triggers[j][i].note = getNextNote();
                }
            }
        }
    };
    ArrangementService.prototype.setPatternLength = function (arrangement, patternIndex, newLength) {
        var me = this;
        var pattern = arrangement.patterns[patternIndex];
        var channel;
        for(var i = 0; i < pattern.length; i++) {
            channel = pattern[i];
            while(channel.length > newLength) {
                channel.pop();
            }
            while(channel.length < newLength) {
                channel.push(me.createEmptyTrigger());
            }
        }
    };
    ArrangementService.prototype.createEmptyTrigger = function () {
        return {
            note: 48,
            vol: 0
        };
    };
    ArrangementService.prototype.joinPatterns = function (pattern1, pattern2) {
        var me = this;
        pattern1 = me.clonePattern(pattern1);
        pattern2 = me.clonePattern(pattern2);
        for(var i = 0; i < pattern1.length; i++) {
            pattern1[i] = pattern1[i].concat(pattern2[i]);
        }
        return pattern1;
    };
    ArrangementService.prototype.flattenArrangementPatterns = function (data) {
        var results = [];
        for(var i = 0; i < data.channels.length; i++) {
            results[i] = [];
        }
        var patternIndex;
        var pattern;
        for(i = 0; i < data.sequence.length; i++) {
            patternIndex = data.sequence[i];
            pattern = data.patterns[patternIndex];
            var trigger;
            for(var j = 0; j < pattern.length; j++) {
                for(var k = 0, kk = pattern[j].length; k < kk; k++) {
                    trigger = pattern[j][k];
                    results[j].push({
                        note: trigger.note,
                        vol: trigger.vol
                    });
                }
            }
        }
        return results;
    };
    ArrangementService.prototype.getArrangementDuration = function (arrangement) {
        var duration = 0;
        var spr = this.getSecondsPerRow(arrangement.bpm);
        var patternIndex;
        var pattern;
        for(var i = 0; i < arrangement.sequence.length; i++) {
            patternIndex = arrangement.sequence[i];
            pattern = arrangement.patterns[patternIndex];
            duration += pattern[0].length * spr;
        }
        return duration;
    };
    ArrangementService.prototype.getTimeForSequence = function (arrangement, sequenceIndex, rowIndex) {
        var duration = 0;
        var spr = this.getSecondsPerRow(arrangement.bpm);
        var patternIndex;
        var pattern;
        var patternDuration;
        for(var i = 0; i < sequenceIndex; i++) {
            patternIndex = arrangement.sequence[i];
            pattern = arrangement.patterns[patternIndex];
            patternDuration = pattern[0].length * spr;
            duration += patternDuration;
        }
        duration += rowIndex * spr;
        return duration;
    };
    ArrangementService.prototype.clonePattern = function (data) {
        var clone = [];
        var channel;
        var cloneChannel;
        for(var i = 0; i < data.length; i++) {
            channel = data[i];
            cloneChannel = [];
            for(var j = 0; j < channel.length; j++) {
                cloneChannel.push({
                    note: channel[j].note,
                    vol: channel[j].vol
                });
            }
            clone[i] = cloneChannel;
        }
        return clone;
    };
    ArrangementService.prototype.getPlaybackStateForTime = function (arrangement, time) {
        var me = this;
        time = Math.max(time, .01);
        var playbackState = {
        };
        playbackState.currentTime = time;
        playbackState.totalDuration = me.getArrangementDuration(arrangement);
        var duration = 0;
        var spr = me.getSecondsPerRow(arrangement.bpm);
        var patternIndex;
        var pattern;
        var patternDuration;
        for(var i = 0; i < arrangement.sequence.length; i++) {
            patternIndex = arrangement.sequence[i];
            pattern = arrangement.patterns[patternIndex];
            patternDuration = pattern[0].length * spr;
            duration += patternDuration;
            if(duration > time) {
                playbackState.currentSequenceIndex = i;
                playbackState.currentRowIndex = Math.round((time - (duration - patternDuration)) / spr);
                break;
            }
        }
        return playbackState;
    };
    ArrangementService.prototype.getPatternForTime = function (arrangement, time) {
        var playbackState = this.getPlaybackStateForTime(arrangement, time);
        return arrangement.patterns[arrangement.sequence[playbackState.currentSequenceIndex]];
    };
    ArrangementService.prototype.getSecondsPerRow = function (bpm) {
        var spb = 60 / bpm;
        return spb / 4;
    };
    ArrangementService.prototype.getRowsPerSecond = function (bpm) {
        var bps = bpm / 60;
        return bps * 4;
    };
    ArrangementService.prototype.getTriggers = function (arrangement, patternIndex, selection) {
        var pattern = arrangement.patterns[patternIndex];
        var results = [];
        var channel;
        for(var i = selection.startChannel; i <= selection.endChannel; i++) {
            channel = [];
            for(var j = selection.startPosition; j <= selection.endPosition; j++) {
                channel.push(pattern[i][j]);
            }
            results.push(channel);
        }
        return results;
    };
    ArrangementService.prototype.pasteTriggers = function (triggers, arrangement, patternIndex, channelIndex, posIndex) {
        var pattern = arrangement.patterns[patternIndex];
        var triggers = this.clonePattern(triggers);
        for(var i = 0; i < triggers.length; i++) {
            if(i + channelIndex >= pattern.length) {
                break;
            }
            for(var j = 0; j < triggers[i].length; j++) {
                if(j + posIndex >= pattern[0].length) {
                    break;
                }
                pattern[i + channelIndex][j + posIndex] = triggers[i][j];
            }
        }
    };
    return ArrangementService;
})();
var EventDispatcher = (function () {
    function EventDispatcher() {
        this._listeners = [];
    }
    EventDispatcher.prototype.hasListener = function (type, listener) {
        var exists = false;
        for(var i = 0; i < this._listeners.length; i++) {
            if(this._listeners[i].type === type && this._listeners[i].listener === listener) {
                exists = true;
            }
        }
        return exists;
    };
    EventDispatcher.prototype.on = function (typeStr, listenerFunc) {
        if(this.hasListener(typeStr, listenerFunc)) {
            return;
        }
        this._listeners.push({
            type: typeStr,
            listener: listenerFunc
        });
    };
    EventDispatcher.prototype.off = function (typeStr, listenerFunc) {
        for(var i = 0; i < this._listeners.length; i++) {
            if(this._listeners[i].type === typeStr && this._listeners[i].listener === listenerFunc) {
                this._listeners.splice(i, 1);
            }
        }
    };
    EventDispatcher.prototype.fire = function (typeStr, data) {
        for(var i = 0; i < this._listeners.length; i++) {
            if(this._listeners[i].type === typeStr) {
                this._listeners[i].listener.call(this, typeStr, data);
            }
        }
    };
    return EventDispatcher;
})();
var __extends = this.__extends || function (d, b) {
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var WavTable = (function (_super) {
    __extends(WavTable, _super);
    function WavTable(sourceData) {
        _super.call(this);
        this.sourceData = sourceData;
        this.wavs = this.sourceData.data;
    }
    WavTable.prototype.play = function (trigger, destination) {
        var wav = this.getClosestWav(trigger.note);
        var delta = trigger.note - wav.note;
        var rate = Math.pow(2, delta / 12);
        var source = destination.context.createBufferSource();
        source.buffer = wav.audioBuffer;
        source.playbackRate.value = rate;
        source.noteOn(trigger.timeStart);
        var gain = destination.context.createGainNode();
        gain.gain.value = trigger.vol;
        if(trigger.timeEnd) {
            gain.gain.setValueAtTime(trigger.vol, trigger.timeEnd - 0.1);
            gain.gain.exponentialRampToValueAtTime(0, trigger.timeEnd);
            source.noteOff(trigger.timeEnd);
        }
        source.connect(gain);
        gain.connect(destination);
        return gain;
    };
    WavTable.prototype.getClosestWav = function (index) {
        var closest = -1000;
        var wav;
        for(var i = 0; i < this.wavs.length; i++) {
            wav = this.wavs[i];
            if(wav.note == index) {
                return wav;
            } else {
                closest = Math.abs(wav.note - index) < Math.abs(closest - index) ? wav.note : closest;
            }
        }
        return this.getClosestWav(closest);
    };
    WavTable.prototype.load = function () {
        this.loadingQueue = this.wavs.concat();
        this.loadNext();
    };
    WavTable.prototype.loadNext = function () {
        if(this.loadingQueue.length) {
            this.loadingItem = this.loadingQueue.pop();
            var req = new XMLHttpRequest();
            req.open("GET", this.loadingItem.url);
            req.responseType = "arraybuffer";
            req.onload = this.onFileLoaded.bind(this);
            req.send();
        } else {
            this.fire("load", this);
        }
    };
    WavTable.prototype.onFileLoaded = function (e) {
        var target = e.target;
        var arrayBuffer = target.response;
        BrowserAudioContext.getInstance().decodeAudioData(arrayBuffer, this.onDecode.bind(this));
    };
    WavTable.prototype.onDecode = function (audioBuffer) {
        this.loadingItem.audioBuffer = audioBuffer;
        this.loadNext();
    };
    WavTable.prototype.getSourceData = function () {
        var data;
        return data;
    };
    return WavTable;
})(EventDispatcher);
var SourceFactory = (function () {
    function SourceFactory() { }
    SourceFactory.WAV_TABLE = "wavTable";
    SourceFactory.SYNTH = "synth";
    SourceFactory.createInstance = function createInstance(data) {
        var instance;
        switch(data.type) {
            case SourceFactory.WAV_TABLE:
                instance = new WavTable(data);
                break;
            case SourceFactory.SYNTH:
                break;
        }
        return instance;
    };
    return SourceFactory;
})();
var Player = (function (_super) {
    __extends(Player, _super);
    function Player(arrangementService) {
        _super.call(this);
        this.arrangementService = arrangementService;
        this.channelSourceMap = {
        };
        this.isPlaying = false;
        this.isLooping = false;
        this.isStereo = false;
        var me = this;
        me.ps = {
            isPlaying: false,
            currentTime: 0,
            currentPattern: [
                []
            ],
            currentPatternIndex: 0,
            currentRowIndex: 0,
            currentSequenceIndex: 0,
            totalDuration: 0
        };
        me.initAudioNodes();
    }
    Player.$inject = [
        "arrangementService"
    ];
    Player.prototype.setArrangement = function (arrangement) {
        var me = this;
        me.a = arrangement;
        me.seekTo(0);
        me.resetChannelNodes();
    };
    Player.prototype.initAudioNodes = function () {
        var me = this;
        me.audioContext = BrowserAudioContext.getInstance();
        me.masterGainNode = me.audioContext.createGainNode();
        me.masterGainNode.connect(me.audioContext.destination);
        me.compressorNode = me.audioContext.createDynamicsCompressor();
        me.compressorNode.connect(me.masterGainNode);
    };
    Player.prototype.play = function (timeStart) {
        var me = this;
        if(!timeStart) {
            timeStart = me.ps.currentTime || 0;
        }
        if(me.isPlaying) {
            me.stop();
        }
        me.isLooping = false;
        me.resetChannelNodes();
        me.lastStartTime = timeStart;
        me.lastContextStartTime = me.audioContext.currentTime;
        var spr = me.arrangementService.getSecondsPerRow(me.a.bpm);
        me.isPlaying = true;
        me.fire("play", this);
        me.playingPatternData = me.arrangementService.flattenArrangementPatterns(me.a);
        var offset = me.lastContextStartTime - timeStart + 0.3;
        me.playingPatternData = me.setTriggerTimes(me.playingPatternData, offset);
        me.updateInterval = setInterval(me.updatePlaybackState.bind(this), Math.max(spr * 1000, 33));
        me.schedulingInterval = setInterval(me.scheduleNotes.bind(this), 500);
        me.updatePlaybackState();
        me.scheduleNotes();
    };
    Player.prototype.playPattern = function (pattern, timeStart, loop) {
        var me = this;
        if(me.isPlaying) {
            me.stop();
        }
        me.resetChannelNodes();
        me.lastStartTime = timeStart;
        me.lastContextStartTime = me.audioContext.currentTime;
        var spr = me.arrangementService.getSecondsPerRow(me.a.bpm);
        me.isPlaying = true;
        me.fire("play", this);
        var patternData = me.arrangementService.clonePattern(pattern);
        if(loop) {
            for(var i = 0; i < loop; i++) {
                patternData = me.arrangementService.joinPatterns(patternData, pattern);
            }
            me.isLooping = true;
        }
        me.playingPatternData = patternData;
        me.loopingPatternDuration = spr * pattern[0].length;
        var offset = me.lastContextStartTime + 0.3;
        me.playingPatternData = me.setTriggerTimes(me.playingPatternData, offset);
        me.updateInterval = setInterval(me.updatePlaybackState.bind(this), Math.max(spr * 1000, 33));
        me.schedulingInterval = setInterval(me.scheduleNotes.bind(this), 500);
        me.updatePlaybackState();
        me.scheduleNotes();
    };
    Player.prototype.scheduleNotes = function () {
        var me = this;
        var node;
        var source;
        var trigger;
        var patternData = me.playingPatternData;
        var channel;
        var contextCurrentTime = me.audioContext.currentTime;
        for(var i = 0; i < patternData.length; i++) {
            node = me.channelNodes[i];
            source = me.channelSources[i];
            channel = patternData[i];
            trigger = channel.shift();
            while(trigger && !trigger.timeStart) {
                trigger = channel.shift();
            }
            while(trigger && trigger.timeStart < contextCurrentTime + 1) {
                if(trigger && trigger.vol > 0 && trigger.timeStart > contextCurrentTime) {
                    source.play(trigger, node);
                }
                trigger = channel.shift();
                while(trigger && !trigger.timeStart) {
                    trigger = channel.shift();
                }
            }
            if(trigger && trigger.vol > 0 && trigger.timeStart > contextCurrentTime) {
                channel.unshift(trigger);
            }
        }
    };
    Player.prototype.resetChannelNodes = function () {
        var me = this;
        if(me.channelNodes) {
            for(var i = 0; i < me.channelNodes.length; i++) {
                me.channelNodes[i].disconnect();
            }
        }
        me.channelNodes = [];
        var splitter;
        var merger;
        var left;
        var right;
        var channelData;
        for(var i = 0; i < me.a.channels.length; i++) {
            channelData = me.a.channels[i];
            if(me.isStereo) {
                splitter = me.audioContext.createChannelMerger();
                left = me.audioContext.createGainNode();
                var pan = (1 + Number(channelData.pan)) * 0.5;
                var pi_2 = Math.PI / 2;
                var vol = Number(channelData.vol);
                left.gain.value = Math.sin(pan * pi_2) * vol;
                right = me.audioContext.createGainNode();
                right.gain.value = Math.cos(pan * pi_2) * vol;
                splitter.connect(left);
                splitter.connect(right);
                merger = me.audioContext.createChannelMerger(2);
                left.connect(merger, 0, 0);
                right.connect(merger, 0, 1);
                merger.connect(me.compressorNode);
                me.channelNodes.push(splitter);
            } else {
                left = me.audioContext.createGainNode();
                left.gain.value = channelData.vol;
                left.connect(me.compressorNode);
                me.channelNodes.push(left);
            }
        }
    };
    Player.prototype.playNote = function (channelIndex, trigger) {
        var me = this;
        if(trigger.vol <= 0) {
            return;
        }
        if(!me.channelNodes) {
            me.resetChannelNodes();
        }
        if(me.lastPreviewNode) {
            me.lastPreviewNode.gain.exponentialRampToValueAtTime(0, me.audioContext.currentTime + 0.5);
        }
        var source = me.channelSources[channelIndex];
        var channel = me.channelNodes[channelIndex];
        var trigger = {
            note: trigger.note,
            vol: trigger.vol,
            timeStart: me.audioContext.currentTime + .02,
            timeEnd: null
        };
        me.lastPreviewNode = source.play(trigger, channel);
    };
    Player.prototype.updatePlaybackState = function () {
        var me = this;
        var totalDuration = me.arrangementService.getArrangementDuration(me.a);
        var currentTime = me.lastStartTime + (me.audioContext.currentTime - me.lastContextStartTime);
        if(me.isLooping) {
            currentTime = me.lastStartTime + (me.audioContext.currentTime - me.lastContextStartTime) % me.loopingPatternDuration;
        }
        if(currentTime > totalDuration) {
            currentTime = 0;
            me.resetChannelNodes();
            clearInterval(me.schedulingInterval);
            clearInterval(me.updateInterval);
            me.isPlaying = false;
            me.fire("stop", this);
        }
        me.seekTo(currentTime);
    };
    Player.prototype.seekTo = function (time) {
        var me = this;
        me.ps = me.arrangementService.getPlaybackStateForTime(me.a, time);
        me.fire("playbackStateChanged", me.ps);
    };
    Player.prototype.stop = function () {
        var me = this;
        if(!me.isPlaying) {
            return;
        }
        if(!me.channelNodes) {
            return;
        }
        me.resetChannelNodes();
        clearInterval(me.updateInterval);
        clearInterval(me.schedulingInterval);
        me.updatePlaybackState();
        me.isLooping = false;
        me.isPlaying = false;
        me.fire("stop", this);
    };
    Player.prototype.loadSources = function () {
        var me = this;
        me.channelSources = [];
        var channels = me.a.channels;
        var channel;
        var sourceData;
        var sourcePlayer;
        var toLoad = 0;
        for(var i = 0; i < channels.length; i++) {
            channel = channels[i];
            sourceData = channel.source;
            sourcePlayer = me.channelSourceMap[sourceData.name];
            if(!sourcePlayer) {
                sourcePlayer = SourceFactory.createInstance(channel.source);
                sourcePlayer.on("load", function () {
                    toLoad--;
                    if(toLoad == 0) {
                        me.fire("load", this);
                    }
                });
                toLoad++;
                sourcePlayer.load();
            }
            me.resetChannelNodes();
            me.channelSourceMap[sourceData.name] = sourcePlayer;
            me.channelSources[i] = sourcePlayer;
        }
    };
    Player.prototype.setTriggerTimes = function (data, offset) {
        var me = this;
        var spr = me.arrangementService.getSecondsPerRow(me.a.bpm);
        var channelTriggers;
        var lastActiveTrigger;
        var trigger;
        for(var i = 0; i < data.length; i++) {
            channelTriggers = data[i];
            lastActiveTrigger = null;
            for(var j = 0, jj = channelTriggers.length; j < jj; j++) {
                trigger = channelTriggers[j];
                if(trigger.vol) {
                    trigger.timeStart = j * spr + offset;
                    if(lastActiveTrigger) {
                        lastActiveTrigger.timeEnd = trigger.timeStart;
                    }
                    lastActiveTrigger = trigger;
                }
            }
        }
        return data;
    };
    return Player;
})(EventDispatcher);
var MusicTheory = (function () {
    function MusicTheory() {
        this.notes = [
            'C', 
            'C#', 
            'D', 
            'D#', 
            'E', 
            'F', 
            'F#', 
            'G', 
            'G#', 
            'A', 
            'A#', 
            'B', 
            'OFF'
        ];
        this.scale = {
            "Major": [
                0, 
                2, 
                4, 
                5, 
                7, 
                9, 
                11
            ],
            "Natural Minor": [
                0, 
                2, 
                3, 
                5, 
                7, 
                8, 
                10
            ],
            "Harmonic Minor": [
                0, 
                2, 
                3, 
                5, 
                7, 
                8, 
                11
            ],
            "Mixolydian Augmented": [
                0, 
                2, 
                4, 
                5, 
                8, 
                9, 
                10
            ],
            "Harmonic Major": [
                0, 
                2, 
                4, 
                5, 
                8, 
                9, 
                11
            ],
            "Lydian Minor": [
                0, 
                2, 
                4, 
                6, 
                7, 
                8, 
                10
            ],
            "Lydian Dominant": [
                0, 
                2, 
                4, 
                6, 
                7, 
                9, 
                10
            ],
            "Lydian": [
                0, 
                2, 
                4, 
                6, 
                7, 
                9, 
                11
            ],
            "Lydian Augmented": [
                0, 
                2, 
                4, 
                6, 
                8, 
                9, 
                10
            ],
            "Leading Whole Tone": [
                0, 
                2, 
                4, 
                6, 
                8, 
                10, 
                11
            ],
            "Rock 'n Roll": [
                0, 
                3, 
                4, 
                5, 
                7, 
                9, 
                10
            ],
            "Hungarian Major": [
                0, 
                3, 
                4, 
                6, 
                7, 
                9, 
                10
            ],
            "Pentatonic Major": [
                0, 
                2, 
                4, 
                7, 
                9
            ],
            "Pentatonic Minor": [
                0, 
                3, 
                5, 
                7, 
                10
            ],
            "Spanish 8 Tone": [
                0, 
                1, 
                3, 
                4, 
                5, 
                6, 
                8, 
                10
            ],
            "Flamenco": [
                0, 
                1, 
                3, 
                4, 
                5, 
                7, 
                8, 
                10
            ],
            "Symmetrical": [
                0, 
                1, 
                3, 
                4, 
                6, 
                7, 
                9, 
                10
            ],
            "Diminished": [
                0, 
                2, 
                3, 
                5, 
                6, 
                8, 
                9, 
                11
            ],
            "Whole Tone": [
                0, 
                2, 
                4, 
                6, 
                8, 
                10
            ],
            "Augmented": [
                0, 
                3, 
                4, 
                7, 
                8, 
                11
            ],
            "Ultra Locrian": [
                0, 
                1, 
                3, 
                4, 
                6, 
                8, 
                9
            ],
            "Super Locrian": [
                0, 
                1, 
                3, 
                4, 
                6, 
                8, 
                10
            ],
            "Indian": [
                0, 
                1, 
                3, 
                4, 
                7, 
                8, 
                10
            ],
            "Locrian": [
                0, 
                1, 
                3, 
                5, 
                6, 
                8, 
                10
            ],
            "Phrygian": [
                0, 
                1, 
                3, 
                5, 
                7, 
                8, 
                10
            ],
            "Neapolitan Minor": [
                0, 
                1, 
                3, 
                5, 
                7, 
                8, 
                11
            ],
            "Javanese": [
                0, 
                1, 
                3, 
                5, 
                7, 
                9, 
                10
            ],
            "Neapolitan Major": [
                0, 
                1, 
                3, 
                5, 
                7, 
                9, 
                11
            ],
            "Todi (Indian)": [
                0, 
                1, 
                3, 
                6, 
                7, 
                8, 
                11
            ],
            "Persian": [
                0, 
                1, 
                4, 
                5, 
                6, 
                8, 
                11
            ],
            "Oriental": [
                0, 
                1, 
                4, 
                5, 
                6, 
                9, 
                10
            ],
            "Phrygian Major": [
                0, 
                1, 
                4, 
                5, 
                7, 
                8, 
                10
            ],
            "Double Harmonic": [
                0, 
                1, 
                4, 
                5, 
                7, 
                8, 
                11
            ],
            "Marva (Indian)": [
                0, 
                1, 
                4, 
                6, 
                7, 
                9, 
                11
            ],
            "Enigmatic": [
                0, 
                1, 
                4, 
                6, 
                8, 
                10, 
                11
            ],
            "Locrian Natural 2nd": [
                0, 
                2, 
                3, 
                5, 
                6, 
                8, 
                10
            ],
            "Dorian": [
                0, 
                2, 
                3, 
                5, 
                7, 
                9, 
                10
            ],
            "Melodic Minor (Asc)": [
                0, 
                2, 
                3, 
                5, 
                7, 
                9, 
                11
            ],
            "Hungarian Gypsy": [
                0, 
                2, 
                3, 
                6, 
                7, 
                8, 
                10
            ],
            "Hungarian Minor": [
                0, 
                2, 
                3, 
                6, 
                7, 
                8, 
                11
            ],
            "Romanian": [
                0, 
                2, 
                3, 
                6, 
                7, 
                9, 
                10
            ],
            "Locrian Major": [
                0, 
                2, 
                4, 
                5, 
                6, 
                8, 
                10
            ],
            "Hindu": [
                0, 
                2, 
                4, 
                5, 
                7, 
                8, 
                10
            ],
            "Ethiopian": [
                0, 
                2, 
                4, 
                5, 
                7, 
                8, 
                11
            ],
            "Mixolydian": [
                0, 
                2, 
                4, 
                5, 
                7, 
                9, 
                10
            ]
        };
        this.chords = {
            "69": [
                0, 
                2, 
                4, 
                7, 
                9
            ],
            "Major": [
                0, 
                4, 
                7
            ],
            "Minor": [
                0, 
                3, 
                7
            ],
            "7": [
                0, 
                4, 
                7, 
                10
            ],
            "m7": [
                0, 
                3, 
                7, 
                10
            ],
            "Maj7": [
                0, 
                4, 
                7, 
                11
            ],
            "7b5": [
                0, 
                4, 
                6, 
                10
            ],
            "7#5": [
                0, 
                4, 
                8, 
                10
            ],
            "m7b5": [
                0, 
                3, 
                6, 
                10
            ],
            "7b9": [
                0, 
                1, 
                4, 
                7, 
                10
            ],
            "6": [
                0, 
                4, 
                7, 
                9
            ],
            "m6": [
                0, 
                3, 
                7, 
                9
            ],
            "9": [
                0, 
                2, 
                4, 
                7, 
                10
            ],
            "m9": [
                0, 
                2, 
                3, 
                7, 
                10
            ],
            "maj9": [
                0, 
                2, 
                4, 
                7, 
                11
            ],
            "add9": [
                0, 
                2, 
                4, 
                7
            ],
            "sus2": [
                0, 
                2, 
                7
            ],
            "sus4": [
                0, 
                5, 
                7
            ],
            "dim": [
                0, 
                3, 
                6
            ],
            "dim7": [
                0, 
                3, 
                6, 
                9
            ],
            "aug": [
                0, 
                4, 
                8
            ]
        };
    }
    MusicTheory.prototype.getChordsFromScale = function (scale, root) {
        var results = [];
        var chords = this.chords;
        for(var chordName in chords) {
            var chord = chords[chordName];
            var ch = chord;
            for(var i = 0; i < scale.length; i++) {
                var found = true;
                ch = this.rotateNotes(chord, scale[i]);
                for(var j = 0; j < ch.length; j++) {
                    if(scale.indexOf(ch[j]) == -1) {
                        found = false;
                        break;
                    }
                }
                if(found) {
                    var n2 = this.rotateNotes(ch, root);
                    var r = (scale[i] + root) % 12;
                    var n = (this.notes[r]) + " " + chordName + " (";
                    for(var k = 0; k < n2.length; k++) {
                        n += this.notes[n2[k]] + " ";
                    }
                    n += ")";
                    results.push({
                        pos: i,
                        root: r,
                        label: n,
                        notes: n2
                    });
                }
            }
        }
        results = results.sort(function (a, b) {
            return a.pos > b.pos ? 1 : a.pos < b.pos ? -1 : 0;
        });
        return results;
    };
    MusicTheory.prototype.noteName = function (note) {
        var toneName = this.notes[note % 12];
        var result;
        if(toneName.length == 2) {
            result = toneName + "" + Math.floor(note / 12);
        } else {
            result = toneName + " " + Math.floor(note / 12);
        }
        return result;
    };
    MusicTheory.prototype.rotateNotes = function (notes, value) {
        var results = [];
        for(var i = 0; i < notes.length; i++) {
            results.push((notes[i] + value) % 12);
        }
        results = results.sort(function (a, b) {
            return a > b ? 1 : a < b ? -1 : 0;
        });
        return results;
    };
    MusicTheory.prototype.transposeNotes = function (notes, value) {
        var results = [];
        for(var i = 0; i < notes.length; i++) {
            results.push((notes[i] + value));
        }
        return results;
    };
    return MusicTheory;
})();
var InstrumentService = (function () {
    function InstrumentService($http, $q) {
        this.$http = $http;
        this.$q = $q;
    }
    InstrumentService.$inject = [
        "$http", 
        "$q"
    ];
    InstrumentService.prototype.getInstruments = function () {
        var me = this;
        var defer = me.$q.defer();
        if(me.instruments) {
            defer.resolve(me.instruments);
        } else {
            me.$http.get("data/instruments.json").success(function (data, status, headers, config) {
                me.instruments = data.data;
                defer.resolve(me.instruments);
            });
        }
        return defer.promise;
    };
    return InstrumentService;
})();
function Main($scope, player, arrangementService, appState) {
    $scope.safeApply = function (fn) {
        var phase = this.$root.$$phase;
        if(phase == '$apply' || phase == '$digest') {
            if(fn && (typeof (fn) === 'function')) {
                fn();
            }
        } else {
            this.$apply(fn);
        }
    };
    $scope.appState = appState;
    appState.a = arrangementService.createEmptyArrangement();
    player.setArrangement(appState.a);
    appState.ps = arrangementService.getPlaybackStateForTime(appState.a, 0);
    player.on("playbackStateChanged", function (eName, state) {
        var me = this;
        appState.ps = state;
        $scope.$broadcast("onPlaybackStateChange", state);
    });
    arrangementService.openArrangement("data/demoSong.json").then(function (data) {
        appState.a = data;
        player.setArrangement(appState.a);
        player.loadSources();
    });
    $scope.$on("patternChange", function (e, selection) {
        $scope.$broadcast("onPatternChange", selection);
    });
    $scope.$on("seek", function (e, time) {
        player.seekTo(time);
    });
    $scope.$on("play", function (e, time) {
        player.play(time);
    });
    $scope.$on("stop", function (e) {
        player.stop();
    });
    $scope.$on("loop", function (e, pattern, time) {
        player.playPattern(pattern, time, 30);
    });
}
Main["$inject"] = [
    "$scope", 
    "player", 
    "arrangementService", 
    "appState"
];
function Modal($scope) {
    $scope.showModal = false;
    $scope.$on("$routeChangeStart", function (evt, route) {
        if(route) {
            $scope.showModal = true;
        } else {
            $scope.showModal = false;
        }
        $scope.$emit("stop");
    });
}
Modal["$inject"] = [
    "$scope"
];
function Playback($scope, player, arrangementService) {
    $scope.pl = player;
    $scope.togglePlay = function () {
        if(player.isPlaying) {
            player.stop();
        } else {
            player.play();
        }
    };
    $scope.tempoValues = (function () {
        var results = [];
        for(var i = 50; i < 250; i += 5) {
            results.push(i);
        }
        return results;
    })();
    $scope.highlightValues = (function () {
        var results = [];
        for(var i = 2; i < 64; i++) {
            results.push(i);
        }
        return results;
    })();
}
Playback["$inject"] = [
    "$scope", 
    "player", 
    "arrangementService"
];
function Pattern($scope, arrangementService, appState) {
    $scope.appState = appState;
    $scope.patternLengths = generatePatternLengths();
    $scope.positionLabels = [];
    $scope.scroll = {
        scrollX: 0,
        scrollY: 0,
        maxScrollX: 0,
        maxScrollY: 0
    };
    $scope.$on("onPlaybackStateChange", updatePatternState);
    $scope.$on("onPatternChange", updatePatternState);
    $scope.$watch("patternLength", onPatternLengthChange);
    $scope.$watch("appState.a.sequence[appState.ps.currentSequenceIndex]", updatePatternState);
    $scope.$watch("currentPattern[0].length", function (value) {
        $scope.positionLabels = generatePositionLabels(value);
    });
    function updatePatternState() {
        $scope.safeApply(function () {
            $scope.currentPattern = appState.a.patterns[appState.a.sequence[appState.ps.currentSequenceIndex]];
            $scope.patternLength = $scope.currentPattern[0].length;
        });
    }
    function generatePositionLabels(count) {
        var results = [];
        var index;
        for(var i = 0, ii = count; i < ii; i++) {
            index = i.toString();
            while(index.length < 3) {
                index = '0' + index;
            }
            results.push(index);
        }
        return results;
    }
    function generatePatternLengths() {
        var min = 12;
        var max = 256;
        var results = [];
        for(var i = min; i <= max; i += 4) {
            results.push(i);
        }
        return results;
    }
    function onPatternLengthChange(value) {
        if(!value) {
            return;
        }
        var currentPatternIndex = appState.a.sequence[appState.ps.currentSequenceIndex];
        var currentPattern = appState.a.patterns[appState.a.sequence[appState.ps.currentSequenceIndex]];
        if(value != currentPattern[0].length) {
            arrangementService.setPatternLength(appState.a, currentPatternIndex, value);
            var time = arrangementService.getTimeForSequence(appState.a, appState.ps.currentSequenceIndex, appState.ps.currentRowIndex);
            $scope.$emit("seek", time);
            $scope.$emit("patternChange");
        }
    }
}
Pattern["$inject"] = [
    "$scope", 
    "arrangementService", 
    "appState"
];
function SelectionMenu($scope, appState, arrangementService) {
    $scope.onCopyClick = function () {
        var triggers = arrangementService.getTriggers(appState.a, appState.a.sequence[appState.ps.currentSequenceIndex], appState.selection);
        appState.copiedTriggers = arrangementService.clonePattern(triggers);
    };
    $scope.onPasteClick = function () {
        if(!appState.copiedTriggers) {
            return;
        }
        arrangementService.pasteTriggers(appState.copiedTriggers, appState.a, appState.a.sequence[appState.ps.currentSequenceIndex], appState.selection.startChannel, appState.selection.startPosition);
        $scope.$emit("patternChange", appState.selection);
    };
    $scope.onDeleteClick = function () {
        var triggers = arrangementService.getTriggers(appState.a, appState.a.sequence[appState.ps.currentSequenceIndex], appState.selection);
        arrangementService.deleteTriggers(triggers);
        $scope.$emit("patternChange", appState.selection);
    };
}
SelectionMenu["$inject"] = [
    "$scope", 
    "appState", 
    "arrangementService"
];
function ChannelMenu($scope, $route, player, arrangementService, appState, instrumentService) {
    var channelIndex = $route.current.params.id;
    if(channelIndex == "add") {
        $scope.channelData = angular.copy(appState.a.channels[appState.a.channels.length - 1]);
        $scope.title = "Create New Channel";
        $scope.channelIndex = appState.a.channels.length;
    } else {
        channelIndex = parseFloat(channelIndex);
        $scope.channelIndex = channelIndex;
        $scope.title = "Edit Channel " + channelIndex + " Settings";
        $scope.channelData = appState.a.channels[channelIndex];
    }
    $scope.volValues = generateVolValues();
    $scope.panValues = generatePanValues();
    $scope.channelSource = $scope.channelData.source;
    $scope.vol = $scope.channelData.vol;
    $scope.pan = $scope.channelData.pan;
    $scope.sources = [];
    $scope.selectedSource = 0;
    $scope.okClick = function () {
        $scope.channelData.vol = $scope.vol;
        $scope.channelData.pan = $scope.pan;
        $scope.channelData.source = $scope.channelSource;
        if(channelIndex == "add") {
            appState.a.channels.push($scope.channelData);
            arrangementService.addEmptyPatternChannel(appState.a, appState.a.channels.length);
            $scope.$emit("patternChange");
        }
        player.loadSources();
    };
    instrumentService.getInstruments().then(function (value) {
        var instruments = value;
        for(var i = 0; i < instruments.length; i++) {
            if(instruments[i].name == $scope.channelData.source.name) {
                $scope.channelSource = instruments[i];
                break;
            }
        }
        $scope.sources = instruments;
    });
    function generateVolValues() {
        var results = [];
        for(var i = 0; i <= 100; i += 10) {
            results.push({
                text: i.toString(),
                value: i / 100
            });
        }
        return results;
    }
    function generatePanValues() {
        var results = [];
        for(var i = -100; i <= 100; i += 10) {
            results.push({
                text: i.toString(),
                value: i / 100
            });
        }
        return results;
    }
}
ChannelMenu["$inject"] = [
    "$scope", 
    "$route", 
    "player", 
    "arrangementService", 
    "appState", 
    "instrumentService"
];
function PatternMenu($scope, arrangementService, appState) {
    var currentPatternIndex = appState.a.sequence[appState.ps.currentSequenceIndex];
    var currentPattern = appState.a.patterns[currentPatternIndex];
    $scope.title = "Edit Pattern " + currentPatternIndex;
    $scope.patternLength = currentPattern[0].length;
    $scope.onClearClick = function () {
        currentPatternIndex = appState.a.sequence[appState.ps.currentSequenceIndex];
        currentPattern = appState.a.patterns[currentPatternIndex];
        arrangementService.clearPattern(appState.a, currentPatternIndex);
        $scope.$emit("patternChange");
    };
    $scope.onPasteClick = function () {
        if(!appState.copiedTriggers) {
            return;
        }
        arrangementService.pasteTriggers(appState.copiedTriggers, appState.a, appState.selection.startPosition, appState.selection.startChannel, appState.ps.currentRowIndex);
        $scope.$emit("patternChange");
    };
}
PatternMenu["$inject"] = [
    "$scope", 
    "arrangementService", 
    "appState"
];
function SongMenu($scope, appState, player, arrangementService, $location) {
    $scope.onSaveClick = function ($event) {
        if(appState.a.title) {
            arrangementService.saveLocalArrangement(appState.a);
        } else {
            $location.path("/SaveAs");
            $event.preventDefault();
        }
    };
    $scope.onNewClick = function ($event) {
        appState.a = arrangementService.createEmptyArrangement();
        player.setArrangement(appState.a);
        player.loadSources();
    };
}
SongMenu["$inject"] = [
    "$scope", 
    "appState", 
    "player", 
    "arrangementService", 
    "$location"
];
function OpenSong($scope, player, appState, arrangementService) {
    $scope.title = "";
    arrangementService.getArrangementList().then(function (value) {
        $scope.arrangementList = value;
    });
    $scope.onItemClick = function (title) {
        $scope.title = title;
    };
    $scope.onOpenClick = function ($event) {
        if($scope.title.length) {
            arrangementService.openLocalArrangement($scope.title).then(function (value) {
                appState.a = value;
                player.setArrangement(appState.a);
                player.loadSources();
            });
        }
    };
}
OpenSong["$inject"] = [
    "$scope", 
    "player", 
    "appState", 
    "arrangementService"
];
function SaveAs($scope, appState, arrangementService) {
    $scope.title = appState.a.title;
    arrangementService.getArrangementList().then(function (value) {
        $scope.arrangementList = value;
    });
    $scope.onItemClick = function (title) {
        $scope.title = title;
    };
    $scope.onSaveClick = function ($event) {
        if($scope.title.length) {
            appState.a.title = $scope.title;
            arrangementService.saveLocalArrangement(appState.a);
        }
    };
}
SaveAs["$inject"] = [
    "$scope", 
    "appState", 
    "arrangementService"
];
function TransposeNotes($scope, arrangementService, appState) {
    $scope.onUpClick = function () {
        var triggers = arrangementService.getTriggers(appState.a, appState.a.sequence[appState.ps.currentSequenceIndex], appState.selection);
        arrangementService.transposeTriggers(triggers, 1);
        $scope.$emit("patternChange", appState.selection);
    };
    $scope.onDownClick = function () {
        var triggers = arrangementService.getTriggers(appState.a, appState.a.sequence[appState.ps.currentSequenceIndex], appState.selection);
        arrangementService.transposeTriggers(triggers, -1);
        $scope.$emit("patternChange", appState.selection);
    };
}
TransposeNotes["$inject"] = [
    "$scope", 
    "arrangementService", 
    "appState"
];
function RandomizeVolume($scope, arrangementService, appState) {
    $scope.amount = 0.1;
    $scope.amountValues = (function () {
        var results = [];
        for(var i = 1; i <= 10; i++) {
            results.push({
                text: i / 10,
                value: i / 10
            });
        }
        return results;
    })();
    $scope.okClick = function () {
        var triggers = arrangementService.getTriggers(appState.a, appState.a.sequence[appState.ps.currentSequenceIndex], appState.selection);
        arrangementService.randomizeVolume(triggers, $scope.amount);
        $scope.$emit("patternChange", appState.selection);
    };
}
RandomizeVolume["$inject"] = [
    "$scope", 
    "arrangementService", 
    "appState"
];
function AutoChord($scope, player, arrangementService, musicTheory, appState) {
    $scope.selection = appState.selection;
    $scope.fillValues = arrangementService.fillTypes;
    $scope.rootValues = generateRootValues();
    $scope.scaleValues = generateScaleValues();
    $scope.octaveValues = generateOctaveValues();
    var state = appState.autoChordState;
    state.root = state.root || 0;
    state.fill = state.fill || arrangementService.fillTypes[0];
    state.scale = state.scale || $scope.scaleValues[0].value;
    $scope.chordValues = updateChordValues();
    state.chord = state.chord || $scope.chordValues[0].value;
    state.octaveStart = state.octaveStart || 3;
    state.octaveEnd = state.octaveEnd || 5;
    $scope.state = state;
    $scope.$watch("state.root", updateChordValues);
    $scope.$watch("state.scale", updateChordValues);
    $scope.okClick = function () {
        var triggers = arrangementService.getTriggers(appState.a, appState.a.sequence[appState.ps.currentSequenceIndex], appState.selection);
        var chord = state.chord;
        var notes = [];
        var start = Math.min(state.octaveStart, state.octaveEnd);
        var end = Math.max(state.octaveStart, state.octaveEnd);
        for(var i = start; i <= end; i++) {
            notes = notes.concat(musicTheory.transposeNotes(chord, i * 12));
        }
        arrangementService.autoChord(triggers, notes, state.fill);
        $scope.$emit("patternChange", appState.selection);
    };
    $scope.onPreviewClick = function () {
        var chord = state.chord;
        var notes = [];
        var start = Math.min(state.octaveStart, state.octaveEnd);
        var end = Math.max(state.octaveStart, state.octaveEnd);
        for(var i = start; i <= end; i++) {
            notes = notes.concat(musicTheory.transposeNotes(chord, i * 12));
        }
        var triggers = [];
        for(i = 0; i < 10; i++) {
            triggers.push({
                note: 48,
                vol: 0.5
            });
        }
        arrangementService.autoChord([
            triggers
        ], notes, state.fill);
        var channelIndex = 0;
        if(appState.selection) {
            channelIndex = appState.selection.startChannel;
        }
        player.playNote(channelIndex, triggers.shift());
        player.playNote(channelIndex, triggers.shift());
        player.playNote(channelIndex, triggers.shift());
        var interval = setInterval(function () {
            player.playNote(channelIndex, triggers.shift());
            if(triggers.length == 0) {
                clearInterval(interval);
            }
        }, 160);
    };
    function updateChordValues() {
        var results = musicTheory.getChordsFromScale(state.scale, state.root);
        var value = JSON.stringify(state.chord);
        state.chord = results[0].notes;
        for(var i = 0; i < results.length; i++) {
            if(JSON.stringify(results[i].notes) == value) {
                state.chord = results[i].notes;
                break;
            }
        }
        $scope.chordValues = results;
        return results;
    }
    function generateScaleValues() {
        var results = [];
        var scales = musicTheory.scale;
        for(var p in scales) {
            results.push({
                text: p,
                value: scales[p]
            });
        }
        return results;
    }
    function generateRootValues() {
        var results = [];
        for(var i = 0; i < 12; i++) {
            results.push({
                text: musicTheory.notes[i],
                value: i
            });
        }
        return results;
    }
    function generateOctaveValues() {
        var results = [];
        for(var i = 1; i < 8; i++) {
            results.push(i);
        }
        return results;
    }
}
AutoChord["$inject"] = [
    "$scope", 
    "player", 
    "arrangementService", 
    "musicTheory", 
    "appState"
];
//@ sourceMappingURL=app.js.map
