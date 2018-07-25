/**
 * Edition Degrading Library
 * 版本降级型基本库
 * 参考：https://github.com/trekhleb/javascript-algorithms
 * 从ES6降为ES5
 * 这里是：Comparator
 */

/**
 * @param {function(a: *, b: *)} [compareFunction]
 */
var Comparator = function(compareFunction) {
    this.compare = compareFunction || this.defaultCompareFunction;
};

Comparator.prototype = {
    /**
     * @param {(string|number)} a
     * @param {(string|number)} b
     * @returns {number}
     */
    defaultCompareFunction : function(a, b) {
        if (a === b) {
            return 0;
        }

        return a < b ? -1 : 1;
    },

    equal : function(a, b) {
        return this.compare(a, b) === 0;
    },
    
    lessThan : function(a, b) {
        return this.compare(a, b) < 0;
    },
    
    greaterThan : function(a, b) {
        return this.compare(a, b) > 0;
    },
    
    lessThanOrEqual : function(a, b) {
        return this.lessThan(a, b) || this.equal(a, b);
    },
    
    greaterThanOrEqual : function(a, b) {
        return this.greaterThan(a, b) || this.equal(a, b);
    },
    
    reverse : function() {
        let compareOriginal = this.compare;
        this.compare = function(a, b) { return compareOriginal(b, a); };
    }
};

module.exports = Comparator;