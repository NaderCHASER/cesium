/*global define*/
define([
        './defaultValue',
        './defined',
        './DeveloperError'
    ], function(
        defaultValue,
        defined,
        DeveloperError) {
    'use strict';

    /**
     * Fill an array or a portion of an array with a given value.
     *
     * @param {Array} array The array to fill.
     * @param {Object} value The value to fill the array with.
     * @param {Number} [start=0] The index to start filling at.
     * @param {Number} [end=array.length] The index to end stop at.
     *
     * @returns {Array} The resulting array.
     * @private
     */
    function arrayFill(array, value, start, end) {
        //>>includeStart('debug', pragmas.debug);
        if (!defined(array) || typeof array !== 'object') {
            throw new DeveloperError('array is required.');
        }
        if (!defined(value)) {
            throw new DeveloperError('value is required.');
        }
        if (defined(start) && typeof start !== 'number') {
            throw new DeveloperError('start must be a valid index.');
        }
        if (defined(end) && typeof end !== 'number') {
            throw new DeveloperError('end must be a valid index.');
        }
        //>>includeEnd('debug');

        if (typeof array.fill === 'function') {
            return array.fill(value, start, end);
        }

        var length = array.length >>> 0;
        var relativeStart = defaultValue(start, 0);
        // If negative, find wrap around position
        var k = (relativeStart < 0) ? Math.max(length + relativeStart, 0) : Math.min(relativeStart, length);
        var relativeEnd = defaultValue(end, length);
        // If negative, find wrap around position
        var final = (relativeEnd < 0) ? Math.max(length + relativeEnd, 0) : Math.min(relativeEnd, length);

        // Fill array accordingly
        while (k < final) {
            array[k] = value;
            k++;
        }
        return array;
    }
    
    return arrayFill;
});
