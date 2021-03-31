import Cartesian2 from './Cartesian2.js';
import Check from './Check.js';
import defaultValue from './defaultValue.js';
import defined from  './defined.js';
import Ellipsoid from './Ellipsoid.js';
import GeographicProjection from './GeographicProjection.js';
import CesiumMath from './Math.js';
import Rectangle from './Rectangle.js';

    /**
     * A tiling scheme for geometry referenced to a simple {@link GeographicProjection} where
     * longitude and latitude are directly mapped to X and Y.  This projection is commonly
     * known as geographic, equirectangular, equidistant cylindrical, or plate carrée.
     *
     * @alias GibsGeographicTilingScheme
     * @constructor
     *
     * @param {Object} [options] Object with the following properties:
     * @param {Ellipsoid} [options.ellipsoid=Ellipsoid.WGS84] The ellipsoid whose surface is being tiled. Defaults to
     * the WGS84 ellipsoid.
     * @param {Rectangle} [options.rectangle=Rectangle.MAX_VALUE] The rectangle, in radians, covered by the tiling scheme.
     * @param {Number} [options.numberOfLevelZeroTilesX=2] The number of tiles in the X direction at level zero of
     * the tile tree.
     * @param {Number} [options.numberOfLevelZeroTilesY=1] The number of tiles in the Y direction at level zero of
     * the tile tree.
     */
    function GibsGeographicTilingScheme(options) {
        options = defaultValue(options, {});

        this._ellipsoid = defaultValue(options.ellipsoid, Ellipsoid.WGS84);
        this._rectangle = defaultValue(options.rectangle, Rectangle.MAX_VALUE);
        this._projection = new GeographicProjection(this._ellipsoid);
        this._numberOfLevelZeroTilesX = defaultValue(options.numberOfLevelZeroTilesX, 2);
        this._numberOfLevelZeroTilesY = defaultValue(options.numberOfLevelZeroTilesY, 1);
        this._tileSize = 512;
        // Resolution: radians per pixel
        this._levels = [
            { width:  2,  height:   1, resolution: 0.009817477042468103 },
            { width:  3,  height:   2, resolution: 0.004908738521234052 },
            { width:  5,  height:   3, resolution: 0.002454369260617026 },
            { width:  10, height:   5, resolution: 0.001227184630308513 },
            { width:  20, height:  10, resolution: 0.0006135923151542565 },
            { width:  40, height:  20, resolution: 0.00030679615757712823 },
            { width:  80, height:  40, resolution: 0.00015339807878856412 },
            { width: 160, height:  80, resolution: 0.00007669903939428206 },
            { width: 320, height: 160, resolution: 0.00003834951969714103 }
        ];
    }

    Object.defineProperties(GibsGeographicTilingScheme.prototype, {
        /**
         * Gets the ellipsoid that is tiled by this tiling scheme.
         * @memberof GeographicTilingScheme.prototype
         * @type {Ellipsoid}
         */
        ellipsoid : {
            get : function() {
                return this._ellipsoid;
            }
        },

        /**
         * Gets the rectangle, in radians, covered by this tiling scheme.
         * @memberof GeographicTilingScheme.prototype
         * @type {Rectangle}
         */
        rectangle : {
            get : function() {
                return this._rectangle;
            }
        },

        /**
         * Gets the map projection used by this tiling scheme.
         * @memberof GeographicTilingScheme.prototype
         * @type {MapProjection}
         */
        projection : {
            get : function() {
                return this._projection;
            }
        }
    });

    /**
     * Gets the total number of tiles in the X direction at a specified level-of-detail.
     *
     * @param {Number} level The level-of-detail.
     * @returns {Number} The number of tiles in the X direction at the given level.
     */
    GibsGeographicTilingScheme.prototype.getNumberOfXTilesAtLevel = function(level) {
        return this._levels[level].width;
    };

    /**
     * Gets the total number of tiles in the Y direction at a specified level-of-detail.
     *
     * @param {Number} level The level-of-detail.
     * @returns {Number} The number of tiles in the Y direction at the given level.
     */
    GibsGeographicTilingScheme.prototype.getNumberOfYTilesAtLevel = function(level) {
        return this._levels[level].height;
    };

    /**
     * Transforms a rectangle specified in geodetic radians to the native coordinate system
     * of this tiling scheme.
     *
     * @param {Rectangle} rectangle The rectangle to transform.
     * @param {Rectangle} [result] The instance to which to copy the result, or undefined if a new instance
     *        should be created.
     * @returns {Rectangle} The specified 'result', or a new object containing the native rectangle if 'result'
     *          is undefined.
     */
    GibsGeographicTilingScheme.prototype.rectangleToNativeRectangle = function(rectangle, result) {
        //>>includeStart('debug', pragmas.debug);
        Check.defined('rectangle', rectangle);
        //>>includeEnd('debug');

        var west = CesiumMath.toDegrees(rectangle.west);
        var south = CesiumMath.toDegrees(rectangle.south);
        var east = CesiumMath.toDegrees(rectangle.east);
        var north = CesiumMath.toDegrees(rectangle.north);

        if (!defined(result)) {
            return new Rectangle(west, south, east, north);
        }

        result.west = west;
        result.south = south;
        result.east = east;
        result.north = north;
        return result;
    };

    /**
     * Converts tile x, y coordinates and level to a rectangle expressed in the native coordinates
     * of the tiling scheme.
     *
     * @param {Number} x The integer x coordinate of the tile.
     * @param {Number} y The integer y coordinate of the tile.
     * @param {Number} level The tile level-of-detail.  Zero is the least detailed.
     * @param {Object} [result] The instance to which to copy the result, or undefined if a new instance
     *        should be created.
     * @returns {Rectangle} The specified 'result', or a new object containing the rectangle
     *          if 'result' is undefined.
     */
    GibsGeographicTilingScheme.prototype.tileXYToNativeRectangle = function(x, y, level, result) {
        var rectangleRadians = this.tileXYToRectangle(x, y, level, result);
        rectangleRadians.west = CesiumMath.toDegrees(rectangleRadians.west);
        rectangleRadians.south = CesiumMath.toDegrees(rectangleRadians.south);
        rectangleRadians.east = CesiumMath.toDegrees(rectangleRadians.east);
        rectangleRadians.north = CesiumMath.toDegrees(rectangleRadians.north);
        return rectangleRadians;
    };

    /**
     * Converts tile x, y coordinates and level to a cartographic rectangle in radians.
     *
     * @param {Number} x The integer x coordinate of the tile.
     * @param {Number} y The integer y coordinate of the tile.
     * @param {Number} level The tile level-of-detail.  Zero is the least detailed.
     * @param {Object} [result] The instance to which to copy the result, or undefined if a new instance
     *        should be created.
     * @returns {Rectangle} The specified 'result', or a new object containing the rectangle
     *          if 'result' is undefined.
     */
    GibsGeographicTilingScheme.prototype.tileXYToRectangle = function(x, y, level, result) {
        var xTiles = this._levels[level].width;
        var yTiles = this._levels[level].height;
        var resolution = this._levels[level].resolution;

        var xTileWidth = resolution * this._tileSize;
        var west = x * xTileWidth + this._rectangle.west;
        var east = (x + 1) * xTileWidth + this._rectangle.west;

        var yTileHeight = resolution * this._tileSize;
        var north = this._rectangle.north - y * yTileHeight;
        var south = this._rectangle.north - (y + 1) * yTileHeight;

        if ( !result ) {
            result = new Cesium.Rectangle(0, 0, 0, 0);
        }
        result.west = west;
        result.south = south;
        result.east = east;
        result.north = north;
        return result;
    };

    /**
     * Calculates the tile x, y coordinates of the tile containing
     * a given cartographic position.
     *
     * @param {Cartographic} position The position.
     * @param {Number} level The tile level-of-detail.  Zero is the least detailed.
     * @param {Cartesian2} [result] The instance to which to copy the result, or undefined if a new instance
     *        should be created.
     * @returns {Cartesian2} The specified 'result', or a new object containing the tile x, y coordinates
     *          if 'result' is undefined.
     */
    GibsGeographicTilingScheme.prototype.positionToTileXY = function(position, level, result) {
        if ( !Cesium.Rectangle.contains(this._rectangle, position) ) {
            return undefined;
        }

        var xTiles = this._levels[level].width;
        var yTiles = this._levels[level].height;
        var resolution = this._levels[level].resolution;

        var xTileWidth = resolution * this._tileSize;
        var yTileHeight = resolution * this._tileSize;

        var longitude = position.longitude;
        if ( this._rectangle.east < this._rectangle.west ) {
            longitude += CesiumMath.TWO_PI;
        }

        var xTileCoordinate = (longitude - this._rectangle.west) / xTileWidth | 0;
        if ( xTileCoordinate >= xTiles ) {
            xTileCoordinate = xTiles - 1;
        }

        var latitude = position.latitude;
        var yTileCoordinate = (this._rectangle.north - latitude) / yTileHeight | 0;
        if ( yTileCoordinate > yTiles ) {
            yTileCoordinate = yTiles - 1;
        }

        if ( !result ) {
            result = new Cesium.Cartesian2(0, 0);
        }
        result.x = xTileCoordinate;
        result.y = yTileCoordinate;
        return result;
    };

export default GibsGeographicTilingScheme;
