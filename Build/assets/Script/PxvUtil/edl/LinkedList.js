/**
 * Edition Degrading Library
 * 版本降级型基本库
 * 参考：https://github.com/trekhleb/javascript-algorithms
 * 从ES6降为ES5
 * 这里是：LinkedList
 */
var Comparator = require("Comparator");

var LinkedListNode = function(value, next) {
    this.value = value;
    this.next = next;
};
LinkedListNode.prototype = {
    toString : function(callback) {
        return callback ? callback(this.value) : "${this.value}";
    }
};

/**
 * @param {Function} [comparatorFunction]
 */
var LinkedList = function(comparatorFunction) {
    /** @var LinkedListNode */
    this.head = null;

    /** @var LinkedListNode */
    this.tail = null;

    this.compare = new Comparator(comparatorFunction);
};

LinkedList.prototype = {
    /**
     * @param {*} value
     * @return {LinkedListNode}
     */
    prepend : function(value) {
        // Make new node to be a head.
        let newNode = new LinkedListNode(value, this.head);
        this.head = newNode;

        // If there is no tail yet let's make new node a tail.
        if (!this.tail) {
            this.tail = newNode;
        }

        return newNode;
    },

    /**
     * @param {*} value
     * @return {LinkedListNode}
     */
    append : function(value) {
        let newNode = new LinkedListNode(value);

        // If there is no head yet let's make new node a head.
        if (!this.head) {
            this.head = newNode;
            this.tail = newNode;

            return this;
        }

        // Attach new node to the end of linked list.
        this.tail.next = newNode;
        this.tail = newNode;

        return newNode;
    },

    /**
     * @param {*} value
     * @return {LinkedListNode}
     */
    delete : function(value) {
        if (!this.head) {
            return null;
        }

        let deletedNode = null;

        // If the head must be deleted then make 2nd node to be a head.
        while (this.head && this.compare.equal(this.head.value, value)) {
            deletedNode = this.head;
            this.head = this.head.next;
        }

        let currentNode = this.head;

        if (currentNode !== null) {
            // If next node must be deleted then make next node to be a next next one.
            while (currentNode.next) {
                if (this.compare.equal(currentNode.next.value, value)) {
                    deletedNode = currentNode.next;
                    currentNode.next = currentNode.next.next;
                } else {
                    currentNode = currentNode.next;
                }
            }
        }

        // Check if tail must be deleted.
        if (this.compare.equal(this.tail.value, value)) {
            this.tail = currentNode;
        }

        return deletedNode;
    },

    /**
     * @param {*} value
     * @param {function} [callback]
     * @return {LinkedListNode}
     */
    find : function(value, callback) {
        if (!this.head) {
            return null;
        }

        let currentNode = this.head;

        while (currentNode) {
            // If callback is specified then try to find node by callback.
            if (callback && callback(currentNode.value)) {
                return currentNode;
            }

            // If value is specified then try to compare by value..
            if (value !== undefined && this.compare.equal(currentNode.value, value)) {
                return currentNode;
            }

            currentNode = currentNode.next;
        }

        return null;
    },

    /**
     * @return {LinkedListNode}
     */
    deleteTail() {
        if (this.head === this.tail) {
            // There is only one node in linked list.
            let deletedTail = this.tail;
            this.head = null;
            this.tail = null;

            return deletedTail;
        }

        // If there are many nodes in linked list...
        let deletedTail = this.tail;

        // Rewind to the last node and delete "next" link for the node before the last one.
        let currentNode = this.head;
        while (currentNode.next) {
            if (!currentNode.next.next) {
                currentNode.next = null;
            } else {
                currentNode = currentNode.next;
            }
        }

        this.tail = currentNode;

        return deletedTail;
    },

    /**
     * @return {LinkedListNode}
     */
    deleteHead() {
        if (!this.head) {
            return null;
        }

        let deletedHead = this.head;

        if (this.head.next) {
            this.head = this.head.next;
        } else {
            this.head = null;
            this.tail = null;
        }

        return deletedHead;
    },

    /**
     * @return {LinkedListNode[]}
     */
    toArray() {
        let nodes = [];

        let currentNode = this.head;
        while (currentNode) {
            nodes.push(currentNode);
            currentNode = currentNode.next;
        }

        return nodes;
    },

    /**
     * @param {function} [callback]
     * @return {string}
     */
    toString(callback) {
        let mapfunc = function(node) { return node.toString(callback); };
        return this.toArray().map(mapfunc).toString();
    }
};

module.exports = LinkedList;