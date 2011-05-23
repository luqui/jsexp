Sexp = function() { 

// CodeCatalog Snippet http://www.codecatalog.net/323/2/
var for_kv = function(object, body) {
    for (var k in object) {
        if (object.hasOwnProperty(k)) {
            body(k, object[k]);
        }
    }
};
// End CodeCatalog Snippet

// CodeCatalog Snippet http://www.codecatalog.net/331/1/
var object = function(methods) {
    var constr = methods['init'] || function() {};
    for_kv(methods, function(k,v) {
        constr.prototype[k] = v;
    });
    return constr;
};
// End CodeCatalog Snippet

var Sexp = object({
    init: function(head, args) {
        this.head = head;
        this.args = args;
    },
    toString: function() { return "(" + this.head + " " + this.args.join(' ') + ")" }
});

return Sexp;

}();
