// Copyright (c) 2020 Uber Technologies, Inc.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

/**
 * Generate a hash string based on number of character
 * @param {number} count
 * @returns {string} hash string
 */
export function generateHashId(count) {
  return Math.random()
    .toString(36)
    .substr(count);
}


export const deepDiffMapper = function () {
  return {
    VALUE_CREATED: 'created',
    VALUE_UPDATED: 'updated',
    VALUE_DELETED: 'deleted',
    VALUE_UNCHANGED: 'unchanged',
    map: function(obj1, obj2) {
      if (this.isFunction(obj1) || this.isFunction(obj2)) {
        throw 'Invalid argument. Function given, object expected.';
      }
      if (this.isValue(obj1) || this.isValue(obj2)) {
        if(this.compareValues(obj1, obj2) === "updated" || this.compareValues(obj1, obj2)==="created") {
          console.log(obj1, obj2);
        }
        return {
          type: this.compareValues(obj1, obj2),
          data: obj1 === undefined ? obj2 : obj1
        };
      }

      let diff = {};
      for (let key in obj1) {
        if (this.isFunction(obj1[key])) {
          continue;
        }

        let value2 = undefined;
        if (obj2[key] !== undefined) {
          value2 = obj2[key];
        }

        diff[key] = this.map(obj1[key], value2);
      }
      for (let key in obj2) {
        if (this.isFunction(obj2[key]) || diff[key] !== undefined) {
          continue;
        }

        diff[key] = this.map(undefined, obj2[key]);
      }

      return diff;

    },
    compareValues: function (value1, value2) {
      if (value1 === value2) {
        return this.VALUE_UNCHANGED;
      }
      if (this.isDate(value1) && this.isDate(value2) && value1.getTime() === value2.getTime()) {
        return this.VALUE_UNCHANGED;
      }
      if (value1 === undefined) {
        return this.VALUE_CREATED;
      }
      if (value2 === undefined) {
        return this.VALUE_DELETED;
      }
      return this.VALUE_UPDATED;
    },
    isFunction: function (x) {
      return Object.prototype.toString.call(x) === '[object Function]';
    },
    isArray: function (x) {
      return Object.prototype.toString.call(x) === '[object Array]';
    },
    isDate: function (x) {
      return Object.prototype.toString.call(x) === '[object Date]';
    },
    isObject: function (x) {
      return Object.prototype.toString.call(x) === '[object Object]';
    },
    isValue: function (x) {
      return !this.isObject(x) && !this.isArray(x);
    }
  }
}();