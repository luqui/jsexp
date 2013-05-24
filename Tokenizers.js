Tokenizers = function() { 


var for_kv = function(object, body) {
    for (var k in object) {
        if (object.hasOwnProperty(k)) {
            body(k, object[k]);
        }
    }
};

var escape_for_regexp = function(text) {
    return text.replace(/[\]\[\\^$*+?{}\.()|]/g, function(x) { return '\\' + x });
};

var newtype = function() {
    var ident = {};
    return {
        wrap: function(x) { return { ident: ident, __value: x } },
        unwrap: function(x) { 
            if (x.ident === ident) {
                return x.__value;
            }
            else {
                throw "Attempt to unwrap non-matching newtype";
            }
        }
    };
};


var $$ = {};

var Tokenizer = newtype();

$$.regexp = function(tokens) { 
    return Tokenizer.wrap(function(str) {
        var bestMatch = null;
        var bestFunc = null; 
        for_kv(tokens, function(k,v) {
            var m = new RegExp('^' + k).exec(str);
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
    })
};

$$.choice = function(tokenizers) {
    return Tokenizer.wrap(function(str) {
        for (var i = 0; i < tokenizers.length; ++i) {
            var tokresult = tokenizers[i](str);
            if (tokresult) {
                return tokresult;
            }
        }
        return null;
    });
};

$$.string = function(str, func) {
    var d = {};
    d[escape_for_regexp(str)] = func;
    return $$.regexp(d);
};

$$.map = function(f, tokenizer) {
    return Tokenizer.wrap(function(str) {
        var tokresult = Tokenizer.unwrap(tokenizer)(str);
        if (tokresult) {
            return [f(tokresult[0]), tokresult[1]];
        }
        else {
            return null;
        }
    });
};

$$.prefix = function(tokenizers) {
    return Tokenizer.wrap(function(str) {
        var ret = [];
        for (var i = 0; i < tokenizers.length; i++) {
            var tokresult = Tokenizer.unwrap(tokenizers[i])(str); 
            if (tokresult) {
                ret.push(tokresult[0]);
                str = tokresult[1];
            }
            else {
                return [ ret, str ];
            }
        }
        return [ ret, str ];
    });
};

$$.nonempty_choice = function(tokenizers) {
    if (tokenizers.length == 0) { return Tokenizer.wrap(function(str) { return null }) }
    if (tokenizers.length == 1) { return tokenizers[0] }
    
    return Tokenizer.wrap(function(str) {
        for (var i = 0; i < tokenizers.length; i++) {
            var tokresult = Tokenizer.unwrap(tokenizers[i])(str);
            if (tokresult && tokresult[1].length < str.length) {
                return tokresult;
            }
        }
        return null; // er.. if they *all* accept the empty string, then... er...
    });
};

// run_tokenizer takes a tokenizer and a string and returns either
// * null, indicating failure, or
// * a two element array [ value, remaining_string ]
$$.run_tokenizer = function(tok, str) {
    return Tokenizer.unwrap(tok)(str);
};

// marks a non-algebraic tokenizer which needs further abstraction
$$.HACK_wrap = function(tok) {
    return Tokenizer.wrap(tok);
};

return $$;

};
