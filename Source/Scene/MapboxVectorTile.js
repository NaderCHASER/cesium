import Cartesian2 from '../Core/Cartesian2.js';
import Cartesian3 from '../Core/Cartesian3.js';
import Cartographic from '../Core/Cartographic.js';
import combine from '../Core/combine.js';
import Credit from '../Core/Credit.js';
import defaultValue from '../Core/defaultValue.js';
import defined from '../Core/defined.js';
import DeveloperError from '../Core/DeveloperError.js';
import Event from '../Core/Event.js';
import CesiumMath from '../Core/Math.js';
import Resource from '../Core/Resource.js';
import WebMercatorTilingScheme from '../Core/WebMercatorTilingScheme.js';
import when from '../ThirdParty/when.js';
import TileReplacementQueue from './TileReplacementQueue.js';

    function MapboxVectorTile(options) {
        //>>includeStart('debug', pragmas.debug);
        if (!defined(options)) {
          throw new DeveloperError('options is required.');
        }
        if (!when.isPromise(options) && !defined(options.url)) {
          throw new DeveloperError('options is required.');
        }
        //>>includeEnd('debug');

        this._tilingScheme = undefined;
        this._tileWidth = undefined;
        this._tileHeight = undefined;
        this._readyPromise = undefined;
        this._ol = undefined;
        this._mvtParser = undefined;

        this._styleFun = undefined;
        this._key = undefined;
        this._url = undefined;
        this._subdomains = undefined;

        this._pixelRatio = undefined;
        this._transform = undefined;
        this._replays = undefined;
        this._tileQueue = undefined;
        this._cacheSize = undefined;

        this.reinitialize(options);
    }

    Object.defineProperties(MapboxVectorTile.prototype, {
        proxy : {
            get : function() {
                return undefined;
            }
        },

        tileWidth : {
            get : function() {
                return this._tileWidth;
            }
        },

        tileHeight: {
            get : function() {
                return this._tileHeight;
            }
        },

        maximumLevel : {
            get : function() {
                return undefined;
            }
        },

        minimumLevel : {
            get : function() {
                return undefined;
            }
        },

        tilingScheme : {
            get : function() {
                return this._tilingScheme;
            }
        },

        rectangle : {
            get : function() {
                return this._tilingScheme.rectangle;
            }
        },

        tileDiscardPolicy : {
            get : function() {
                return undefined;
            }
        },

        errorEvent : {
            get : function() {
                return this._errorEvent;
            }
        },

        ready : {
            get : function() {
                return true;
            }
        },

        readyPromise : {
            get : function() {
                return this._readyPromise;
            }
        },

        credit : {
            get : function() {
                return undefined;
            }
        },

        hasAlphaChannel : {
            get : function() {
                return true;
            }
        }
    });

    MapboxVectorTile.prototype.reinitialize = function(options) {
        var that = this;
        that._readyPromise = when(options).then(function(properties) {
            //>>includeStart('debug', pragmas.debug);
            if (!defined(properties)) {
                throw new DeveloperError('options is required.');
              }
            if (!defined(properties.url)) {
                throw new DeveloperError('options.url is required.');
            }
            //>>includeEnd('debug');

            that._tilingScheme = defined(options.tilingScheme) ? options.tilingScheme : new WebMercatorTilingScheme();
            that._tileWidth = defaultValue(options.tileWidth, 512);
            that._tileHeight = defaultValue(options.tileHeight, 512);
            that._readyPromise = when.resolve(true);
            that._ol = options.ol;
            that._mvtParser = new that._ol.format.MVT();

            that._styleFun =  defaultValue(options.style, function() {
                return true;
            });
            that._key = defaultValue(options.key, 'pk.eyJ1IjoiYWxsaXNvbmhvdXNlIiwiYSI6IjRYTTBnQVEifQ.D8WYESF5G7PntWLtgZQ5Uw');
            that._url = defaultValue(options.url, '//tiles.pixels.global/maptile/data/v3/{z}/{x}/{y}.pbf');

            that._subdomains = properties.subdomains;
            if (Array.isArray(that._subdomains)) {
                that._subdomains = that._subdomains.slice();
            } else if (defined(that._subdomains) && that._subdomains.length > 0) {
                that._subdomains = that._subdomains.split('');
            } else {
                that._subdomains = ['a', 'b', 'c'];
            }

            var sw = that._tilingScheme._rectangleSouthwestInMeters;
            var ne = that._tilingScheme._rectangleNortheastInMeters;
            var mapExtent = [sw.x, sw.y, ne.x, ne.y];
            that._resolutions = that._ol.tilegrid.resolutionsFromExtent(mapExtent, 22, that._tileWidth);

            that._pixelRatio = 1;
            that._transform = [0.125,0,0,0.125,0,0];
            that._replays =  ['Default','Image','Polygon', 'LineString','Text'];

            that._tileQueue = new TileReplacementQueue();
            that._cacheSize = 2500;

            return true;
        });
    };

    MapboxVectorTile.prototype.getTileCredits = function(x, y, level) {
        return undefined;
    };

    function findTileInQueue(x, y, level, tileQueue){
        var item = tileQueue.head;
        while(item !== undefined && !(item.xMvt === x && item.yMvt === y && item.zMvt === level)){
            item = item.replacementNext;
        }
        return item;
    }

    function remove(tileReplacementQueue, item) {
        var previous = item.replacementPrevious;
        var next = item.replacementNext;

        if (item === tileReplacementQueue._lastBeforeStartOfFrame) {
            tileReplacementQueue._lastBeforeStartOfFrame = next;
        }

        if (item === tileReplacementQueue.head) {
            tileReplacementQueue.head = next;
        } else {
            previous.replacementNext = next;
        }

        if (item === tileReplacementQueue.tail) {
            tileReplacementQueue.tail = previous;
        } else {
            next.replacementPrevious = previous;
        }

        item.replacementPrevious = undefined;
        item.replacementNext = undefined;

        --tileReplacementQueue.count;
    }

    function trimTiles(tileQueue,maximumTiles) {
        var tileToTrim = tileQueue.tail;
        while (tileQueue.count > maximumTiles &&
               defined(tileToTrim)) {
            var previous = tileToTrim.replacementPrevious;

            remove(tileQueue, tileToTrim);
            tileToTrim = null;

            tileToTrim = previous;
        }
    }

    MapboxVectorTile.prototype.requestImage = function(x, y, level, request) {
        var cacheTile = findTileInQueue(x, y, level, this._tileQueue);
        if(!defined(cacheTile)) {
            var that = this;
            var url = this._url;
            var index = (x + y + level) % this._subdomains.length;
            url = url.replace('{x}', x).replace('{y}', y).replace('{z}', level).replace('{k}', this._key).replace('{s}', this._subdomains[index]);

            return Resource.fetchArrayBuffer(url).then(function(arrayBuffer) {
                var canvas = document.createElement('canvas');
                canvas.width = that._tileWidth;
                canvas.height = that._tileHeight;
                var vectorContext = canvas.getContext('2d');

                var features = that._mvtParser.readFeatures(arrayBuffer);

                var styleFun = that._styleFun();

                var extent = [0, 0, 4096, 4096];
                var _replayGroup = new that._ol.render.canvas.ReplayGroup(0, extent, 8, true, 100);

                for(var i = 0; i < features.length; i++){
                    var feature = features[i];
                    var styles = styleFun(features[i],that._resolutions[level]);
                    for(var j=0;j<styles.length;j++)
                    {
                        that._ol.renderer.vector.renderFeature_(_replayGroup, feature, styles[j],16);
                    }
                }
                _replayGroup.finish();

                _replayGroup.replay(vectorContext, that._pixelRatio, that._transform, 0, {}, that._replays, true);
                if(that._tileQueue.count > that._cacheSize){
                    trimTiles(that._tileQueue, that._cacheSize / 2);
                }

                canvas.xMvt = x;
                canvas.yMvt = y;
                canvas.zMvt = level;
                that._tileQueue.markTileRendered(canvas);

                _replayGroup = null;

                return canvas;
            });
        }

        return cacheTile;
    };

    MapboxVectorTile.prototype.pickFeatures = function(x, y, level, longitude, latitude) {
        return undefined;
    };

export default MapboxVectorTile;
