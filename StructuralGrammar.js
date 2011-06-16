// StucturalGrammar : StructuralFramework -> Module

StructuralGrammar = function(SF) {

// CodeCatalog Snippet http://www.codecatalog.net/323/2/
var for_kv = function(object, body) {
    for (var k in object) {
        if (object.hasOwnProperty(k)) {
            body(k, object[k]);
        }
    }
};
// End CodeCatalog Snippet


// CodeCatalog Snippet http://www.codecatalog.net/378/2/
var regexp_tokenizer = function(tokens) { 
    return function(str) {
        var bestMatch = null;
        var bestFunc = null; 
        for_kv(tokens, function(k,v) {
            var m = new RegExp('^' + k)(str);
            if (m && (!bestMatch || m[0].length > bestMatch[0].length)) {
                bestMatch = m;
                bestFunc = v;
            }
        });

        // don't match the whole string in case we are in the middle of typing a token
        // we use \0 to mean "eof" so this will pass.
        if (bestFunc && bestMatch[0].length < str.length) {
            return [bestFunc(bestMatch), str.slice(bestMatch[0].length)];
        }
        else {
            return null;
        }
    }
};
// End CodeCatalog Snippet

// CodeCatalog Snippet http://www.codecatalog.net/368/1/
var arguments_to_array = function(argobj) {
    return Array.prototype.slice.call(argobj);
};
// End CodeCatalog Snippet

// A grammar is an object that maps nonterminal names to syntactic forms,
// where syntactic forms are built up as combinators.

// The final representation returned by these combinators is simply an
// EClass representing that symbol.

// Our intermediate representation will be a simple open fixed point.
// Grammar = String -> (Grammar -> EClass).   We will pass the final grammar
// to a point in the grammar so it can refer to other nonterminals within itself.  
// As an unintended bonus, we also get grammar inheritance.
//
// For the Grammar argument, we'll use a proper function instead of an object
// so we can do renaming during inheritance.

var $$ = {};

$$.sym = function(name) {
    return function(grammar) { return grammar(name) }
};

$$.str = function(cls) {
    return function(grammar) {
        return new SF.EClass({
            cls: cls
        })
    }
};

$$.literal = function(str) {
    return function(grammar) {
        return new SF.EClass({
            make: function() {
                return this.__proto__.make.call(this, str)
            }
        })
    };
};

$$.token = function(rx, cls) {
    return function(grammar) {
        var toks = {};
        toks[rx.source] = function(m) { return $$.str(cls)(grammar).make(m[0]) };
        return SF.Exp_box(cls, regexp_tokenizer(toks));
    };
};

$$.seq = function() {
    var xs = arguments_to_array(arguments);
    return function(grammar) {
        return new SF.EClass({
            make: function() {
                return this.__proto__.make.apply(
                    this,
                    xs.map(function(x) { return x(grammar).make() }))
            }
        })
    };
};

$$.grammar = function(top, grammar) {
    var lookup = function(s) { return grammar[s](lookup) };
    return lookup(top);
};

return $$;

};
