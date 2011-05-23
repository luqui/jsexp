AttributeGrammar = function() {

// CodeCatalog Snippet http://www.codecatalog.net/279/1/
var foreach = function(array, body) {
    for (var i = 0; i < array.length; ++i) {
        body(array[i]);
    }
};
// End CodeCatalog Snippet

// CodeCatalog Snippet http://www.codecatalog.net/333/1/
var thunk = function(fn) {
    var cache;
    var cacheset = false;
    return function() {
        if (!cacheset) { cache = fn(); cacheset = true }
        return cache;
    };
};
// End CodeCatalog Snippet

var walk = function(root, parent, func) {
    // TODO js's stack depth is ridiculously small.  iterate, don't recurse.
    if (typeof(root) === 'object' && root.isSexp) {
        foreach(root.args, function(child) {
            walk(child, root, func);
        });
        func(root, root.args, parent);
    }
};

var walk_zipper = function(zipper, func) {
    for (var ix = 0; ix < zipper.length; ix++) { (function() {
        var link = zipper[ix];
        foreach(link.args, function(child) {
            walk(child, link, func);
        });
        func(link, link.args.concat(zipper[ix-1]), zipper[ix+1]);
    })() }
};

var visitor = function(defns, node, parent) {
    if (!parent && 'ROOT' in defns) {
        return defns['ROOT'];
    }
    else if (node.head in defns) {
        return defns[node.head];
    }
    else if ('*' in defns) {
        return defns['*'];
    }
};

return {
    install_root: function(root, name, defns) {
        walk(root, undefined, function(node, children, parent) {
            var f = visitor(defns, node, parent);
            node[name] = thunk(function() { return f(node, children, parent) });
        });
    },
    install_zipper: function(zipper, name, defns) {
        walk_zipper(zipper, function(node, children, parent) {
            var f = visitor(defns, node, parent);
            node[name] = thunk(function() { return f(node, children, parent) });
        });
    },
}
}();
